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
	"crypto/rand"
	"encoding/hex"
	"lighthouse-backend/auth"
	"lighthouse-backend/db"
	"lighthouse-backend/docs"
	"lighthouse-backend/handlers"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

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
	// Warm the map cache in the background so a cold start can accept
	// requests as soon as the schema check finishes.
	go func() {
		if err := lighthouseHandler.WarmMapCache(); err != nil {
			log.Printf("WARNING: failed to warm lighthouse map cache: %v", err)
		}
	}()
	userHandler := handlers.NewUserHandler(database)
	friendsHandler := handlers.NewFriendsHandler(database)

	jwtSecret, err := loadJWTSecret()
	if err != nil {
		log.Fatal(err)
	}

	passkeyRPID := envOrDefault("PASSKEY_RP_ID", "localhost")
	passkeyOrigins := envListOrDefault("PASSKEY_RP_ORIGINS", []string{"http://localhost:5173"})
	passkeys, err := auth.NewPasskey(passkeyRPID, passkeyOrigins)
	if err != nil {
		log.Fatalf("Invalid passkey configuration: %v", err)
	}

	authHandler := handlers.NewAuthHandler(database, jwtSecret, passkeys, passkeyRPID)
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
	mux.HandleFunc("GET /api/lighthouses/map", lighthouseHandler.GetLighthouseMap)
	mux.HandleFunc("GET /api/lighthouses/{id}", lighthouseHandler.GetLighthouseByID)

	// Auth routes
	mux.HandleFunc("POST /auth/passkey/register/options", authHandler.BeginPasskeyRegistration)
	mux.HandleFunc("POST /auth/passkey/register", authHandler.FinishPasskeyRegistration)
	mux.HandleFunc("POST /auth/passkey/login/options", authHandler.BeginPasskeyLogin)
	mux.HandleFunc("POST /auth/passkey/login", authHandler.FinishPasskeyLogin)
	mux.Handle("GET /auth/me", authMiddleware(http.HandlerFunc(authHandler.GetMe)))

	// User routes with authentication
	mux.Handle("GET /user", authMiddleware(http.HandlerFunc(userHandler.GetUser)))
	mux.Handle("GET /user/map-state", authMiddleware(http.HandlerFunc(userHandler.GetUserMapState)))

	// Visited lighthouses routes
	mux.Handle("GET /user/lighthouses", authMiddleware(http.HandlerFunc(userHandler.GetUserVisitedLighthouses)))
	mux.Handle("POST /user/lighthouses", authMiddleware(http.HandlerFunc(userHandler.MarkLighthouseAsVisited)))
	mux.Handle("DELETE /user/lighthouses", authMiddleware(http.HandlerFunc(userHandler.UnmarkLighthouseAsVisited)))

	// Wishlist routes
	mux.Handle("GET /user/wishlist", authMiddleware(http.HandlerFunc(userHandler.GetUserWishlistLighthouses)))
	mux.Handle("POST /user/wishlist", authMiddleware(http.HandlerFunc(userHandler.AddToWishlist)))
	mux.Handle("DELETE /user/wishlist", authMiddleware(http.HandlerFunc(userHandler.RemoveFromWishlist)))

	// Friend routes
	mux.Handle("GET /user/friends", authMiddleware(http.HandlerFunc(friendsHandler.GetFriends)))
	mux.Handle("DELETE /user/friends", authMiddleware(http.HandlerFunc(friendsHandler.RemoveFriend)))
	mux.Handle("GET /user/friends/lighthouses", authMiddleware(http.HandlerFunc(userHandler.GetFriendVisitedLighthouses)))
	mux.Handle("GET /user/friends/requests", authMiddleware(http.HandlerFunc(friendsHandler.GetPendingFriendRequests)))
	mux.Handle("POST /user/friends/requests", authMiddleware(http.HandlerFunc(friendsHandler.SendFriendRequest)))
	mux.Handle("GET /user/friends/requests/outgoing", authMiddleware(http.HandlerFunc(friendsHandler.GetOutgoingFriendRequests)))
	mux.Handle("POST /user/friends/requests/accept", authMiddleware(http.HandlerFunc(friendsHandler.AcceptFriendRequest)))
	mux.Handle("GET /users/search", authMiddleware(http.HandlerFunc(friendsHandler.SearchUsers)))

	// Configure CORS. Passkey origins are always allowed; CORS_ALLOWED_ORIGINS
	// replaces the built-in extras when set.
	allowedOrigins := uniqueStrings(append(passkeyOrigins,
		envListOrDefault("CORS_ALLOWED_ORIGINS", []string{
			"http://localhost:5173",
			"https://agreeable-pond-025c6731e.5.azurestaticapps.net",
			"https://agreeable-pond-025c6731e.4.azurestaticapps.net",
		})...,
	))
	c := cors.New(cors.Options{
		AllowedOrigins: allowedOrigins,
		AllowedMethods: []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{
			"Authorization",
			"Content-Type",
			"Origin",
			"Accept",
			"X-WebAuthn-Session",
		},
		ExposedHeaders: []string{"Content-Length"},
		MaxAge:         86400,
	})

	handler := c.Handler(mux)

	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8080"
	}

	log.Printf("Starting server on port %s\n", PORT)

	server := &http.Server{
		Addr:              ":" + PORT,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 16,
	}
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}

const minJWTSecretBytes = 32

// loadJWTSecret never falls back to a known value: a missing secret gets a
// random one for this process, so tokens cannot be forged with a default.
func loadJWTSecret() (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		random := make([]byte, minJWTSecretBytes)
		if _, err := rand.Read(random); err != nil {
			return "", err
		}
		log.Println("WARNING: JWT_SECRET not set; using a random secret, so sign-ins end when the server restarts")
		return hex.EncodeToString(random), nil
	}
	if len(secret) < minJWTSecretBytes {
		log.Printf("WARNING: JWT_SECRET is shorter than %d bytes; rotate it to a longer random value", minJWTSecretBytes)
	}
	return secret, nil
}

func envOrDefault(name string, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}

func envListOrDefault(name string, fallback []string) []string {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}

	items := strings.Split(value, ",")
	values := make([]string, 0, len(items))
	for _, item := range items {
		if item = strings.TrimSpace(item); item != "" {
			values = append(values, item)
		}
	}
	if len(values) == 0 {
		return fallback
	}
	return values
}

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	unique := make([]string, 0, len(values))
	for _, value := range values {
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		unique = append(unique, value)
	}
	return unique
}
