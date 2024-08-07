package main

//import and add handlers
import (
	"lighthouse-backend/handlers"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {

	godotenv.Load()

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
