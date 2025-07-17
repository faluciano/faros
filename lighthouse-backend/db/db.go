package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/tursodatabase/go-libsql"
)

var DB *sql.DB

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

	DB = db

	// Initialize tables
	if err := CreateUserTable(); err != nil {
		return nil, fmt.Errorf("error creating user table: %w", err)
	}
	if err := CreateUserVisitedLighthouseTable(); err != nil {
		return nil, fmt.Errorf("error creating user lighthouse table: %w", err)
	}
	if err := CreateUserWishlistTable(); err != nil {
		return nil, fmt.Errorf("error creating user wishlist table: %w", err)
	}
	if err := CreateFriendshipsTable(); err != nil {
		return nil, fmt.Errorf("error creating friendships table: %w", err)
	}

	return db, nil
}

func CreateUserWishlistTable() error {
	query := `
	CREATE TABLE IF NOT EXISTS user_wishlist_lighthouse (
		user_id TEXT,
		lighthouse_id TEXT,
		added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (user_id, lighthouse_id),
		FOREIGN KEY (user_id) REFERENCES users(id),
		FOREIGN KEY (lighthouse_id) REFERENCES lighthouses(id)
	)`
	_, err := DB.Exec(query)
	return err
}

func CreateUserVisitedLighthouseTable() error {
	query := `
	CREATE TABLE IF NOT EXISTS user_visited_lighthouse (
		user_id TEXT,
		lighthouse_id TEXT,
		visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (user_id, lighthouse_id),
		FOREIGN KEY (user_id) REFERENCES users(id),
		FOREIGN KEY (lighthouse_id) REFERENCES lighthouses(id)
	)`
	_, err := DB.Exec(query)
	return err
}

func CreateUserTable() error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		first_name TEXT,
		last_name TEXT,
		email TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	_, err := DB.Exec(query)
	return err
}

func CreateFriendshipsTable() error {
	query := `
	CREATE TABLE IF NOT EXISTS friendships (
		user_id TEXT,
		friend_id TEXT,
		status TEXT CHECK(status IN ('pending', 'accepted')),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (user_id, friend_id),
		FOREIGN KEY (user_id) REFERENCES users(id),
		FOREIGN KEY (friend_id) REFERENCES users(id)
	)`
	_, err := DB.Exec(query)
	return err
}
