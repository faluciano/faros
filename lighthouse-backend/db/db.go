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
		db, err = sql.Open("libsql", "lighthouse.db")
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
			description TEXT
		);`,
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			first_name TEXT,
			last_name TEXT,
			email TEXT,
			password_hash TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
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
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return err
		}
	}

	// Add password_hash column to existing tables (ignore error if column already exists)
	_, _ = db.Exec("ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''")

	// Add new columns to lighthouses table (ignore error if columns already exist)
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN height REAL DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN year_built INTEGER DEFAULT 0")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN light_characteristics TEXT DEFAULT ''")
	_, _ = db.Exec("ALTER TABLE lighthouses ADD COLUMN description TEXT DEFAULT ''")

	return nil
}
