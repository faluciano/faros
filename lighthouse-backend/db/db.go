package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/tursodatabase/go-libsql"
)

var DB *sql.DB

func InitDB() (*sql.DB, error) {
	dbName := "local.db"
	primaryUrl := os.Getenv("TURSO_DATABASE_URL")
	authToken := os.Getenv("TURSO_AUTH_TOKEN")

	if primaryUrl == "" || authToken == "" {
		return nil, fmt.Errorf("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set")
	}

	dir, err := os.MkdirTemp("", "libsql-*")
	if err != nil {
		return nil, fmt.Errorf("error creating temporary directory: %w", err)
	}

	dbPath := filepath.Join(dir, dbName)

	connector, err := libsql.NewEmbeddedReplicaConnector(dbPath, primaryUrl,
		libsql.WithAuthToken(authToken),
		libsql.WithSyncInterval(time.Minute*30),
	)
	if err != nil {
		return nil, fmt.Errorf("error creating connector: %w", err)
	}

	db := sql.OpenDB(connector)
	if err := db.Ping(); err != nil {
		connector.Close()
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	DB = db
	return db, nil
}
