package main

//import and add handlers
import (
	"database/sql"
	"lighthouse-backend/db"
	"lighthouse-backend/handlers"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/tursodatabase/go-libsql"
)

func main() {

	godotenv.Load()

	dbName := "local.db"
	primaryUrl := os.Getenv("TURSO_DATABASE_URL")
	authToken := os.Getenv("TURSO_AUTH_TOKEN")

	if primaryUrl == "" || authToken == "" {
		log.Fatal("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set")
	}

	dir, err := os.MkdirTemp("", "libsql-*")
	if err != nil {
		log.Fatal("Error creating temporary directory:", err)
	}
	defer os.RemoveAll(dir)

	dbPath := filepath.Join(dir, dbName)

	connector, err := libsql.NewEmbeddedReplicaConnector(dbPath, primaryUrl,
		libsql.WithAuthToken(authToken),
		libsql.WithSyncInterval(time.Minute*30),
	)
	if err != nil {
		log.Fatal("Error creating connector:", err)
	}
	defer connector.Close()

	db_f := sql.OpenDB(connector)
	if err := db_f.Ping(); err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	defer db_f.Close()
	handlers.DB = db_f
	db.DB = db_f

	r := mux.NewRouter()
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Lighthouse API"))
	})
	r.HandleFunc("/api/lighthouses", handlers.GetLighthouses).Methods("GET")

	handler := cors.Default().Handler(r)
	http.Handle("/", handler)
	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8080"
	}
	log.Printf("Starting server on port %s\n", PORT)
	if err := http.ListenAndServe(":"+PORT, nil); err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
