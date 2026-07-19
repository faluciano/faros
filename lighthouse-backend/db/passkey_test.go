package db

import (
	"context"
	"database/sql"
	"errors"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
	"testing"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
	_ "github.com/tursodatabase/go-libsql"
)

func TestPasskeySessionCanOnlyBeConsumedOnce(t *testing.T) {
	database := newPasskeyTestDB(t)
	store := &DBImpl{db: database}

	session := schemas.PasskeySession{
		ID:       "registration-flow",
		RPID:     "localhost",
		Ceremony: "registration",
		Data: webauthn.SessionData{
			Challenge: "challenge",
			UserID:    []byte("opaque-user-handle"),
			Expires:   time.Now().Add(5 * time.Minute),
		},
		User: schemas.User{
			ID:        "user-id",
			Email:     "user@example.com",
			FirstName: "Test",
			LastName:  "User",
		},
	}

	if err := store.SavePasskeySession(context.Background(), session); err != nil {
		t.Fatalf("SavePasskeySession() error = %v", err)
	}

	consumed, err := store.ConsumePasskeySession(
		context.Background(),
		session.ID,
		session.Ceremony,
		session.RPID,
	)
	if err != nil {
		t.Fatalf("ConsumePasskeySession() error = %v", err)
	}
	if consumed.Data.Challenge != session.Data.Challenge {
		t.Fatalf("challenge = %q, want %q", consumed.Data.Challenge, session.Data.Challenge)
	}
	if consumed.User != session.User {
		t.Fatalf("user = %#v, want %#v", consumed.User, session.User)
	}

	_, err = store.ConsumePasskeySession(
		context.Background(),
		session.ID,
		session.Ceremony,
		session.RPID,
	)
	if !errors.Is(err, interfaces.ErrPasskeySessionNotFound) {
		t.Fatalf("second ConsumePasskeySession() error = %v, want session not found", err)
	}
}

func TestExpiredPasskeySessionIsRejected(t *testing.T) {
	database := newPasskeyTestDB(t)
	store := &DBImpl{db: database}

	session := schemas.PasskeySession{
		ID:       "expired-flow",
		RPID:     "localhost",
		Ceremony: "login",
		Data: webauthn.SessionData{
			Challenge: "challenge",
			Expires:   time.Now().Add(-time.Minute),
		},
	}
	if err := store.SavePasskeySession(context.Background(), session); err != nil {
		t.Fatalf("SavePasskeySession() error = %v", err)
	}

	_, err := store.ConsumePasskeySession(
		context.Background(),
		session.ID,
		session.Ceremony,
		session.RPID,
	)
	if !errors.Is(err, interfaces.ErrPasskeySessionExpired) {
		t.Fatalf("ConsumePasskeySession() error = %v, want session expired", err)
	}
}

func TestPasskeyCredentialRoundTripAndUpdate(t *testing.T) {
	database := newPasskeyTestDB(t)
	store := &DBImpl{db: database}

	user := schemas.PasskeyUser{
		User: schemas.User{
			ID:        "user-id",
			Email:     "user@example.com",
			FirstName: "Test",
			LastName:  "User",
		},
		Handle: []byte("opaque-user-handle"),
	}
	credential := webauthn.Credential{
		ID:        []byte("credential-id"),
		PublicKey: []byte("credential-public-key"),
		Flags: webauthn.CredentialFlags{
			UserPresent:    true,
			UserVerified:   true,
			BackupEligible: true,
		},
	}

	if err := store.CreatePasskeyUser(
		context.Background(),
		user,
		credential,
		"localhost",
	); err != nil {
		t.Fatalf("CreatePasskeyUser() error = %v", err)
	}

	loaded, err := store.GetPasskeyUserByHandle(
		context.Background(),
		"localhost",
		user.Handle,
	)
	if err != nil {
		t.Fatalf("GetPasskeyUserByHandle() error = %v", err)
	}
	if loaded == nil {
		t.Fatal("GetPasskeyUserByHandle() returned nil user")
	}
	if loaded.User != user.User {
		t.Fatalf("loaded user = %#v, want %#v", loaded.User, user.User)
	}
	if len(loaded.Credentials) != 1 {
		t.Fatalf("credential count = %d, want 1", len(loaded.Credentials))
	}
	if len(loaded.CredentialVersions) != 1 || loaded.CredentialVersions[0] != 0 {
		t.Fatalf("credential versions = %#v, want [0]", loaded.CredentialVersions)
	}
	if string(loaded.Credentials[0].ID) != string(credential.ID) {
		t.Fatalf("credential ID = %q, want %q", loaded.Credentials[0].ID, credential.ID)
	}

	loaded.Credentials[0].Authenticator.SignCount = 9
	if err := store.UpdatePasskeyCredential(
		context.Background(),
		"localhost",
		user.ID,
		loaded.Credentials[0],
		loaded.CredentialVersions[0],
	); err != nil {
		t.Fatalf("UpdatePasskeyCredential() error = %v", err)
	}

	if err := store.UpdatePasskeyCredential(
		context.Background(),
		"localhost",
		user.ID,
		loaded.Credentials[0],
		loaded.CredentialVersions[0],
	); !errors.Is(err, interfaces.ErrPasskeyCredentialChanged) {
		t.Fatalf("stale UpdatePasskeyCredential() error = %v, want credential changed", err)
	}

	updated, err := store.GetPasskeyUserByHandle(
		context.Background(),
		"localhost",
		user.Handle,
	)
	if err != nil {
		t.Fatalf("GetPasskeyUserByHandle() after update error = %v", err)
	}
	if updated.Credentials[0].Authenticator.SignCount != 9 {
		t.Fatalf(
			"credential sign count = %d, want 9",
			updated.Credentials[0].Authenticator.SignCount,
		)
	}
	if updated.CredentialVersions[0] != 1 {
		t.Fatalf("credential version = %d, want 1", updated.CredentialVersions[0])
	}
}

func TestPasskeyMigrationResetsLegacyUsersOnce(t *testing.T) {
	database := openPasskeyTestDB(t)

	if _, err := database.Exec(`
		CREATE TABLE users (
			id TEXT PRIMARY KEY,
			first_name TEXT,
			last_name TEXT,
			email TEXT,
			password_hash TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`); err != nil {
		t.Fatalf("create legacy users table: %v", err)
	}
	if _, err := database.Exec(`
		INSERT INTO users (id, first_name, last_name, email, password_hash)
		VALUES ('legacy', 'Legacy', 'User', 'legacy@example.com', 'hash')
	`); err != nil {
		t.Fatalf("insert legacy user: %v", err)
	}

	if err := createAllTables(database); err != nil {
		t.Fatalf("createAllTables() error = %v", err)
	}
	assertUserCount(t, database, 0)

	if _, err := database.Exec(`
		INSERT INTO users (id, first_name, last_name, email)
		VALUES ('new', 'New', 'User', 'new@example.com')
	`); err != nil {
		t.Fatalf("insert new user: %v", err)
	}
	if err := createAllTables(database); err != nil {
		t.Fatalf("second createAllTables() error = %v", err)
	}
	assertUserCount(t, database, 1)
}

func TestCredentialVersionMigrationAddsColumn(t *testing.T) {
	database := openPasskeyTestDB(t)

	statements := []string{
		`CREATE TABLE schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE users (
			id TEXT PRIMARY KEY,
			first_name TEXT,
			last_name TEXT,
			email TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE webauthn_users (
			rp_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			handle BLOB NOT NULL,
			PRIMARY KEY (rp_id, user_id),
			UNIQUE (rp_id, handle)
		)`,
		`CREATE TABLE webauthn_credentials (
			rp_id TEXT NOT NULL,
			credential_id BLOB NOT NULL,
			user_id TEXT NOT NULL,
			credential_json BLOB NOT NULL,
			PRIMARY KEY (rp_id, credential_id)
		)`,
	}
	for _, statement := range statements {
		if _, err := database.Exec(statement); err != nil {
			t.Fatalf("prepare previous passkey schema: %v", err)
		}
	}

	if err := createAllTables(database); err != nil {
		t.Fatalf("createAllTables() error = %v", err)
	}

	rows, err := database.Query("PRAGMA table_info(webauthn_credentials)")
	if err != nil {
		t.Fatalf("read credential columns: %v", err)
	}
	defer rows.Close()

	hasVersion := false
	for rows.Next() {
		var (
			columnID     int
			name         string
			columnType   string
			notNull      int
			defaultValue sql.NullString
			primaryKey   int
		)
		if err := rows.Scan(
			&columnID,
			&name,
			&columnType,
			&notNull,
			&defaultValue,
			&primaryKey,
		); err != nil {
			t.Fatalf("scan credential column: %v", err)
		}
		if name == "version" {
			hasVersion = true
		}
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("iterate credential columns: %v", err)
	}
	if !hasVersion {
		t.Fatal("credential version column was not added")
	}
}

func newPasskeyTestDB(t *testing.T) *sql.DB {
	t.Helper()

	database := openPasskeyTestDB(t)
	if err := createAllTables(database); err != nil {
		t.Fatalf("createAllTables() error = %v", err)
	}
	return database
}

func openPasskeyTestDB(t *testing.T) *sql.DB {
	t.Helper()

	database, err := sql.Open("libsql", ":memory:")
	if err != nil {
		t.Fatalf("sql.Open() error = %v", err)
	}
	database.SetMaxOpenConns(1)
	t.Cleanup(func() {
		database.Close()
	})
	return database
}

func assertUserCount(t *testing.T, database *sql.DB, want int) {
	t.Helper()

	var got int
	if err := database.QueryRow("SELECT COUNT(*) FROM users").Scan(&got); err != nil {
		t.Fatalf("count users: %v", err)
	}
	if got != want {
		t.Fatalf("user count = %d, want %d", got, want)
	}
}
