package main

//import and add handlers
import (
	"lighthouse-backend/handlers"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/api/lighthouses", handlers.GetLighthouses).Methods("GET")

	handler := cors.Default().Handler(r)
	http.Handle("/", handler)
	http.ListenAndServe(":8000", nil)
}
