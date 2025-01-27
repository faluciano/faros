package main

//import and add handlers
import (
	"lighthouse-backend/db"
	"lighthouse-backend/handlers"
	"log"
	"net/http"
	"os"

	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	godotenv.Load()

	if err := handlers.InitClerk(); err != nil {
		log.Fatal(err)
	}

	db_f, err := db.InitDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db_f.Close()
	handlers.DB = db_f

	r := mux.NewRouter()
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Lighthouse API"))
	})
	r.HandleFunc("/api/lighthouses", handlers.GetLighthouses).Methods("GET")

	// User routes with authentication
	authHandler := clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.GetUser))
	r.Handle("/user", authHandler).Methods("GET")

	// Visited lighthouses routes
	authHandler = clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.GetUserVisitedLighthouses))
	r.Handle("/user/lighthouses", authHandler).Methods("GET")

	authHandler = clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.MarkLighthouseAsVisited))
	r.Handle("/user/lighthouses", authHandler).Methods("POST")

	authHandler = clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.UnmarkLighthouseAsVisited))
	r.Handle("/user/lighthouses", authHandler).Methods("DELETE")

	// Wishlist routes
	authHandler = clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.GetUserWishlistLighthouses))
	r.Handle("/user/wishlist", authHandler).Methods("GET")

	authHandler = clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.AddToWishlist))
	r.Handle("/user/wishlist", authHandler).Methods("POST")

	authHandler = clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.RemoveFromWishlist))
	r.Handle("/user/wishlist", authHandler).Methods("DELETE")

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"https://agreeable-pond-025c6731e.5.azurestaticapps.net",
			"https://agreeable-pond-025c6731e.4.azurestaticapps.net",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)
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
