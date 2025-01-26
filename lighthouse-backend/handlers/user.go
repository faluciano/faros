package handlers

import (
	"encoding/json"
	"fmt"
	"lighthouse-backend/db"
	"lighthouse-backend/schemas"
	"net/http"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/user"
)

func InitClerk() error {
	clerkToken := os.Getenv("CLERK_AUTH_TOKEN")
	if clerkToken == "" {
		return fmt.Errorf("CLERK_AUTH_TOKEN must be set")
	}
	clerk.SetKey(clerkToken)
	return nil
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	clerkUser, err := user.Get(ctx, claims.Subject)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	if clerkUser == nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "user not found"})
		return
	}

	// Create or update user in our database
	dbUser := schemas.User{
		ID:        clerkUser.ID,
		FirstName: *clerkUser.FirstName,
		LastName:  *clerkUser.LastName,
		Email:     clerkUser.EmailAddresses[0].EmailAddress,
	}

	if err := db.CreateUser(dbUser); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to save user"})
		return
	}

	// Return the user data
	json.NewEncoder(w).Encode(dbUser)
}

func GetUserVisitedLighthouses(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	lighthouses, err := db.GetUserVisitedLighthouses(claims.Subject)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(lighthouses)
}
