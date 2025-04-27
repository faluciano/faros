package main

// @title           Lighthouse API
// @version         1.0
// @description     API for managing lighthouses, user visits, and social features
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization

import (
	"lighthouse-backend/db"
	"lighthouse-backend/docs"
	"lighthouse-backend/handlers"
	"log"
	"net/http"
	"os"

	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	swagger "github.com/swaggo/http-swagger"
)

// @Summary     Get API documentation
// @Description Get the Swagger API documentation
// @Tags        docs
// @Produce     html
// @Success     200 {string} string "HTML documentation"
// @Router      /docs [get]
func main() {
	godotenv.Load()

	// Get the host from environment variable or use default
	host := os.Getenv("API_HOST")
	if host == "" {
		host = "localhost:8080"
	}

	// Get the scheme from environment variable or use default
	scheme := os.Getenv("API_SCHEME")
	if scheme == "" {
		scheme = "http"
	}

	// Programmatically set swagger info
	docs.SwaggerInfo.Title = "Lighthouse API"
	docs.SwaggerInfo.Description = "API for managing lighthouses, user visits, and social features"
	docs.SwaggerInfo.Version = "1.0"
	docs.SwaggerInfo.Host = host
	docs.SwaggerInfo.BasePath = "/"
	docs.SwaggerInfo.Schemes = []string{scheme}

	if err := handlers.InitClerk(); err != nil {
		log.Fatal(err)
	}

	db_f, err := db.InitDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db_f.Close()
	handlers.DB = db_f

	mux := http.NewServeMux()

	// Add Swagger documentation endpoint
	mux.HandleFunc("/docs/swagger.json", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "docs/swagger.json")
	})

	mux.HandleFunc("/docs/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/docs/" {
			http.Redirect(w, r, "/docs/index.html", http.StatusMovedPermanently)
			return
		}
		swagger.Handler(
			swagger.URL("/docs/swagger.json"),
		).ServeHTTP(w, r)
	})

	// Root route
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Write([]byte("Welcome to Lighthouse API"))
	})

	// Public routes
	mux.HandleFunc("/api/lighthouses", handlers.GetLighthouses)

	// User routes with authentication
	mux.Handle("/user", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.GetUser)))

	// Visited lighthouses routes
	mux.Handle("/user/lighthouses", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetUserVisitedLighthouses(w, r)
		case http.MethodPost:
			handlers.MarkLighthouseAsVisited(w, r)
		case http.MethodDelete:
			handlers.UnmarkLighthouseAsVisited(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// Wishlist routes
	mux.Handle("/user/wishlist", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetUserWishlistLighthouses(w, r)
		case http.MethodPost:
			handlers.AddToWishlist(w, r)
		case http.MethodDelete:
			handlers.RemoveFromWishlist(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	// Friend routes
	mux.Handle("/user/friends", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetFriends(w, r)
		case http.MethodDelete:
			handlers.RemoveFriend(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))

	mux.Handle("/user/friends/lighthouses", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.GetFriendVisitedLighthouses)))
	mux.Handle("/user/friends/requests", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetPendingFriendRequests(w, r)
		case http.MethodPost:
			handlers.SendFriendRequest(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})))
	mux.Handle("/user/friends/requests/outgoing", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.GetOutgoingFriendRequests)))
	mux.Handle("/user/friends/requests/accept", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.AcceptFriendRequest)))
	mux.Handle("/users/search", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(handlers.SearchUsers)))

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
		// Allow Swagger UI
		ExposedHeaders: []string{"Content-Length"},
	})

	handler := c.Handler(mux)

	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8080"
	}

	log.Printf("Starting server on port %s\n", PORT)

	if err := http.ListenAndServe(":"+PORT, handler); err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
