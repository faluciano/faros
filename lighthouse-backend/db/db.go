package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/tursodatabase/go-libsql"
)

func InitDB() (*sql.DB, error) {
	var db *sql.DB
	var err error

	tursoURL := os.Getenv("TURSO_DATABASE_URL")
	tursoAuthToken := os.Getenv("TURSO_AUTH_TOKEN")

	if tursoURL != "" && tursoAuthToken != "" {
		// Production or Docker local setup: Connect to Turso
		dbUrl := fmt.Sprintf("%s?authToken=%s", tursoURL, tursoAuthToken)
		db, err = sql.Open("libsql", dbUrl)
		if err != nil {
			return nil, fmt.Errorf("failed to open database: %w", err)
		}
	} else {
		// Local console setup: Use a local SQLite file
		dbPath := "file:lighthouse.db"
		db, err = sql.Open("libsql", dbPath)
		if err != nil {
			return nil, fmt.Errorf("failed to open local database: %w", err)
		}
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	// Initialize tables
	if err := createAllTables(db); err != nil {
		return nil, fmt.Errorf("error creating tables: %w", err)
	}

	return db, nil
}

func createAllTables(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS lighthouses (
			id TEXT PRIMARY KEY,
			name TEXT,
			country TEXT,
			state TEXT,
			latitude REAL,
			longitude REAL,
			image TEXT,
			height REAL,
			year_built INTEGER,
			light_characteristics TEXT,
			description TEXT,
			source TEXT DEFAULT 'OpenStreetMap'
		);`,
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			first_name TEXT,
			last_name TEXT,
			email TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS webauthn_users (
			rp_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			handle BLOB NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (rp_id, user_id),
			UNIQUE (rp_id, handle),
			FOREIGN KEY (user_id) REFERENCES users(id)
		);`,
		`CREATE TABLE IF NOT EXISTS webauthn_credentials (
			rp_id TEXT NOT NULL,
			credential_id BLOB NOT NULL,
			user_id TEXT NOT NULL,
			credential_json BLOB NOT NULL,
			version INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			last_used_at TIMESTAMP,
			PRIMARY KEY (rp_id, credential_id),
			FOREIGN KEY (rp_id, user_id) REFERENCES webauthn_users(rp_id, user_id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(rp_id, user_id);`,
		`CREATE TABLE IF NOT EXISTS webauthn_sessions (
			id TEXT PRIMARY KEY,
			rp_id TEXT NOT NULL,
			ceremony TEXT NOT NULL,
			session_data BLOB NOT NULL,
			user_id TEXT NOT NULL DEFAULT '',
			email TEXT NOT NULL DEFAULT '',
			first_name TEXT NOT NULL DEFAULT '',
			last_name TEXT NOT NULL DEFAULT '',
			expires_at INTEGER NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE INDEX IF NOT EXISTS idx_webauthn_sessions_expires_at ON webauthn_sessions(expires_at);`,
		`CREATE TABLE IF NOT EXISTS user_wishlist_lighthouse (
			user_id TEXT,
			lighthouse_id TEXT,
			added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, lighthouse_id),
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (lighthouse_id) REFERENCES lighthouses(id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_user_wishlist_lighthouse_user_id ON user_wishlist_lighthouse(user_id);`,
		`CREATE TABLE IF NOT EXISTS user_visited_lighthouse (
			user_id TEXT,
			lighthouse_id TEXT,
			visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, lighthouse_id),
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (lighthouse_id) REFERENCES lighthouses(id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_user_visited_lighthouse_user_id ON user_visited_lighthouse(user_id);`,
		`CREATE TABLE IF NOT EXISTS friendships (
			user_id TEXT,
			friend_id TEXT,
			status TEXT CHECK(status IN ('pending', 'accepted')),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, friend_id),
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (friend_id) REFERENCES users(id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_friendships_friend_id_status ON friendships(friend_id, status);`,
		`CREATE INDEX IF NOT EXISTS idx_lighthouses_country_state ON lighthouses(country, state);`,
		`CREATE INDEX IF NOT EXISTS idx_lighthouses_lat_long ON lighthouses(latitude, longitude);`,
		`CREATE INDEX IF NOT EXISTS idx_lighthouses_source ON lighthouses(source);`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return err
		}
	}

	// Add new columns to lighthouses table (ignore error if columns already exist)
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN height REAL DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN year_built INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN light_characteristics TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN description TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN source TEXT DEFAULT 'OpenStreetMap'")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN image_author TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN image_license TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN image_url TEXT DEFAULT ''")

	if err := ensureCredentialVersionColumn(db); err != nil {
		return err
	}
	return resetLegacyUsersForPasskeys(db)
}

const passkeyResetMigration = "20260718_passkey_only_auth"
const passkeyCredentialVersionMigration = "20260718_passkey_credential_version"

func ensureCredentialVersionColumn(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	result, err := tx.Exec(
		"INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)",
		passkeyCredentialVersionMigration,
	)
	if err != nil {
		return err
	}

	applied, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if applied == 0 {
		return tx.Commit()
	}

	rows, err := tx.Query("PRAGMA table_info(webauthn_credentials)")
	if err != nil {
		return err
	}

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
			rows.Close()
			return err
		}
		if name == "version" {
			hasVersion = true
		}
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	if err := rows.Close(); err != nil {
		return err
	}

	if !hasVersion {
		if _, err := tx.Exec(
			"ALTER TABLE webauthn_credentials ADD COLUMN version INTEGER NOT NULL DEFAULT 0",
		); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func resetLegacyUsersForPasskeys(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	result, err := tx.Exec(
		"INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)",
		passkeyResetMigration,
	)
	if err != nil {
		return err
	}

	applied, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if applied == 0 {
		return tx.Commit()
	}

	tables := []string{
		"webauthn_sessions",
		"webauthn_credentials",
		"webauthn_users",
		"friendships",
		"user_wishlist_lighthouse",
		"user_visited_lighthouse",
		"users",
	}
	for _, table := range tables {
		if _, err := tx.Exec("DELETE FROM " + table); err != nil {
			return err
		}
	}
	return tx.Commit()
}
