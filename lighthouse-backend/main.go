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
	"lighthouse-backend/auth"
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

	db_f, err := db.InitDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db_f.Close()

	// Create database implementation

	database := db.NewDB(db_f)

	// Create handlers with database implementation

	lighthouseHandler := handlers.NewLighthouseHandler(database)
	userHandler := handlers.NewUserHandler(database)
	friendsHandler := handlers.NewFriendsHandler(database)

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET must be set")
	}
	authHandler := handlers.NewAuthHandler(database, jwtSecret)
	authMiddleware := auth.RequireAuth(jwtSecret)

	mux := http.NewServeMux()

	// Add Swagger documentation endpoint
	mux.HandleFunc("GET /docs/", swagger.Handler())

	// Root route
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Lighthouse API"))
	})

	// Public routes
	mux.HandleFunc("GET /api/lighthouses", lighthouseHandler.GetLighthouses)

	// Auth routes
	mux.HandleFunc("POST /auth/register", authHandler.Register)
	mux.HandleFunc("POST /auth/login", authHandler.Login)
	mux.Handle("GET /auth/me", authMiddleware(http.HandlerFunc(authHandler.GetMe)))

	// User routes with authentication
	clerkMiddleware := clerkhttp.WithHeaderAuthorization()
	mux.Handle("GET /user", clerkMiddleware(http.HandlerFunc(userHandler.GetUser)))

	// Visited lighthouses routes
	mux.Handle("GET /user/lighthouses", clerkMiddleware(http.HandlerFunc(userHandler.GetUserVisitedLighthouses)))
	mux.Handle("POST /user/lighthouses", clerkMiddleware(http.HandlerFunc(userHandler.MarkLighthouseAsVisited)))
	mux.Handle("DELETE /user/lighthouses", clerkMiddleware(http.HandlerFunc(userHandler.UnmarkLighthouseAsVisited)))

	// Wishlist routes
	mux.Handle("GET /user/wishlist", clerkMiddleware(http.HandlerFunc(userHandler.GetUserWishlistLighthouses)))
	mux.Handle("POST /user/wishlist", clerkMiddleware(http.HandlerFunc(userHandler.AddToWishlist)))
	mux.Handle("DELETE /user/wishlist", clerkMiddleware(http.HandlerFunc(userHandler.RemoveFromWishlist)))

	// Friend routes
	mux.Handle("GET /user/friends", clerkMiddleware(http.HandlerFunc(friendsHandler.GetFriends)))
	mux.Handle("DELETE /user/friends", clerkMiddleware(http.HandlerFunc(friendsHandler.RemoveFriend)))
	mux.Handle("GET /user/friends/lighthouses", clerkMiddleware(http.HandlerFunc(userHandler.GetFriendVisitedLighthouses)))
	mux.Handle("GET /user/friends/requests", clerkMiddleware(http.HandlerFunc(friendsHandler.GetPendingFriendRequests)))
	mux.Handle("POST /user/friends/requests", clerkMiddleware(http.HandlerFunc(friendsHandler.SendFriendRequest)))
	mux.Handle("GET /user/friends/requests/outgoing", clerkMiddleware(http.HandlerFunc(friendsHandler.GetOutgoingFriendRequests)))
	mux.Handle("POST /user/friends/requests/accept", clerkMiddleware(http.HandlerFunc(friendsHandler.AcceptFriendRequest)))
	mux.Handle("GET /users/search", clerkMiddleware(http.HandlerFunc(friendsHandler.SearchUsers)))

	// Configure CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"https://agreeable-pond-025c6731e.5.azurestaticapps.net",
			"https://agreeable-pond-025c6731e.4.azurestaticapps.net",
			"*", // Allow Swagger UI
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "Origin", "Accept"},
		AllowCredentials: true,
		ExposedHeaders:   []string{"Content-Length"},
		MaxAge:           86400,
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
