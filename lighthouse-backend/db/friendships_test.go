package db

import (
	"database/sql"
	"errors"
	"lighthouse-backend/interfaces"
	"strings"
	"testing"

	_ "github.com/tursodatabase/go-libsql"
)

func TestDirectionalFriendshipMigrationRemovesCanonicalOrderConstraint(t *testing.T) {
	database, err := sql.Open("libsql", ":memory:")
	if err != nil {
		t.Fatalf("sql.Open() error = %v", err)
	}
	database.SetMaxOpenConns(1)
	defer database.Close()

	statements := []string{
		`CREATE TABLE schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE users (
			id TEXT PRIMARY KEY,
			first_name TEXT,
			last_name TEXT,
			email TEXT
		)`,
		`CREATE TABLE friendships (
			user_id TEXT,
			friend_id TEXT,
			status TEXT CHECK(status IN ('pending', 'accepted')),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, friend_id),
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (friend_id) REFERENCES users(id),
			CHECK (user_id < friend_id)
		)`,
		`CREATE INDEX idx_friendships_friend_id_status ON friendships(friend_id, status)`,
		`INSERT INTO users (id, first_name, last_name, email) VALUES
			('a-user', 'A', 'User', 'a@example.com'),
			('z-user', 'Z', 'User', 'z@example.com')`,
		`INSERT INTO friendships (user_id, friend_id, status)
			VALUES ('a-user', 'z-user', 'accepted')`,
	}
	for _, statement := range statements {
		if _, err := database.Exec(statement); err != nil {
			t.Fatalf("prepare constrained friendships table: %v", err)
		}
	}

	if err := ensureDirectionalFriendships(database); err != nil {
		t.Fatalf("ensureDirectionalFriendships() error = %v", err)
	}

	var createSQL string
	if err := database.QueryRow(
		"SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'friendships'",
	).Scan(&createSQL); err != nil {
		t.Fatalf("read migrated schema: %v", err)
	}
	if strings.Contains(
		strings.Join(strings.Fields(strings.ToLower(createSQL)), " "),
		"check (user_id < friend_id)",
	) {
		t.Fatalf("canonical-order constraint still present: %s", createSQL)
	}

	store := &DBImpl{db: database}
	if err := store.SendFriendRequest("z-user", "a-user"); !errors.Is(
		err,
		interfaces.ErrFriendshipExists,
	) {
		t.Fatalf("reverse accepted SendFriendRequest() error = %v, want friendship exists", err)
	}
	if _, err := database.Exec("DELETE FROM friendships"); err != nil {
		t.Fatalf("clear preserved friendship: %v", err)
	}
	if err := store.SendFriendRequest("z-user", "a-user"); err != nil {
		t.Fatalf("reverse-order new SendFriendRequest() error = %v", err)
	}
	if err := store.SendFriendRequest("a-user", "z-user"); !errors.Is(
		err,
		interfaces.ErrFriendshipExists,
	) {
		t.Fatalf("reciprocal SendFriendRequest() error = %v, want friendship exists", err)
	}

	var accepted, pending int
	if err := database.QueryRow(
		"SELECT COUNT(*) FROM friendships WHERE status = 'accepted'",
	).Scan(&accepted); err != nil {
		t.Fatalf("count preserved friendships: %v", err)
	}
	if err := database.QueryRow(
		"SELECT COUNT(*) FROM friendships WHERE status = 'pending'",
	).Scan(&pending); err != nil {
		t.Fatalf("count new friend requests: %v", err)
	}
	if accepted != 0 || pending != 1 {
		t.Fatalf("friendship counts accepted=%d pending=%d, want 0 and 1", accepted, pending)
	}
}
