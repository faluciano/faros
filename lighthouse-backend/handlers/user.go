package handlers

import (
	"encoding/json"
	"fmt"
	"lighthouse-backend/db"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
	"net/http"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/user"
)

// UserHandler handles user-related requests
type UserHandler struct {
	db interfaces.DBInterface
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(db interfaces.DBInterface) *UserHandler {
	return &UserHandler{db: db}
}

type VisitRequest struct {
	// @Description ID of the lighthouse to visit
	LighthouseId string `json:"lighthouseId"`
}

// HandleLighthouses handles all lighthouse-related operations for a user
func (h *UserHandler) HandleLighthouses(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetUserVisitedLighthouses(w, r)
	case http.MethodPost:
		MarkLighthouseAsVisited(w, r)
	case http.MethodDelete:
		UnmarkLighthouseAsVisited(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "method not allowed"})
	}
}

// HandleWishlist handles all wishlist-related operations for a user
func (h *UserHandler) HandleWishlist(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetUserWishlistLighthouses(w, r)
	case http.MethodPost:
		AddToWishlist(w, r)
	case http.MethodDelete:
		RemoveFromWishlist(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "method not allowed"})
	}
}

// @Summary     Initialize Clerk authentication
// @Description Initialize the Clerk authentication service
// @Tags        auth
// @Success     200
// @Failure     500 {object} map[string]string
func InitClerk() error {
	clerkToken := os.Getenv("CLERK_AUTH_TOKEN")
	if clerkToken == "" {
		return fmt.Errorf("CLERK_AUTH_TOKEN must be set")
	}
	clerk.SetKey(clerkToken)
	return nil
}

// @Summary     Get current user
// @Description Get the current authenticated user's information
// @Tags        users
// @Produce     json
// @Security    ApiKeyAuth
// @Success     200 {object} schemas.User
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user [get]
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

// @Summary     Get user's visited lighthouses
// @Description Get a list of lighthouses visited by the current user
// @Tags        users
// @Produce     json
// @Security    ApiKeyAuth
// @Success     200 {array} schemas.Lighthouse
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/lighthouses [get]
func GetUserVisitedLighthouses(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

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

// @Summary     Get user's wishlist lighthouses
// @Description Get a list of lighthouses in the current user's wishlist
// @Tags        users
// @Produce     json
// @Security    ApiKeyAuth
// @Success     200 {array} schemas.Lighthouse
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/wishlist [get]
func GetUserWishlistLighthouses(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	lighthouses, err := db.GetUserWishlistLighthouses(claims.Subject)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(lighthouses)
}

// @Summary     Add lighthouse to wishlist
// @Description Add a lighthouse to the current user's wishlist
// @Tags        users
// @Accept      json
// @Produce     json
// @Security    ApiKeyAuth
// @Param       request body VisitRequest true "Lighthouse ID"
// @Success     200 {object} map[string]bool
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/wishlist [post]
func AddToWishlist(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	var req VisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if err := db.AddToWishlist(claims.Subject, req.LighthouseId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// @Summary     Remove lighthouse from wishlist
// @Description Remove a lighthouse from the current user's wishlist
// @Tags        users
// @Accept      json
// @Produce     json
// @Security    ApiKeyAuth
// @Param       request body VisitRequest true "Lighthouse ID"
// @Success     200 {object} map[string]bool
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/wishlist [delete]
func RemoveFromWishlist(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	var req VisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if err := db.RemoveFromWishlist(claims.Subject, req.LighthouseId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// @Summary     Mark lighthouse as visited
// @Description Mark a lighthouse as visited by the current user
// @Tags        users
// @Accept      json
// @Produce     json
// @Security    ApiKeyAuth
// @Param       request body VisitRequest true "Lighthouse ID"
// @Success     200 {object} map[string]bool
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/lighthouses [post]
func MarkLighthouseAsVisited(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	var req VisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if err := db.MarkLighthouseAsVisited(claims.Subject, req.LighthouseId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// When marking as visited, remove from wishlist if it exists there
	_ = db.RemoveFromWishlist(claims.Subject, req.LighthouseId)

	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// @Summary     Unmark lighthouse as visited
// @Description Remove a lighthouse from the current user's visited list
// @Tags        users
// @Accept      json
// @Produce     json
// @Security    ApiKeyAuth
// @Param       request body VisitRequest true "Lighthouse ID"
// @Success     200 {object} map[string]bool
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/lighthouses [delete]
func UnmarkLighthouseAsVisited(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	var req VisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if err := db.UnmarkLighthouseAsVisited(claims.Subject, req.LighthouseId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// @Summary     Get friend's visited lighthouses
// @Description Get a list of lighthouses visited by a friend
// @Tags        users
// @Produce     json
// @Security    ApiKeyAuth
// @Param       friendId query string true "Friend's user ID"
// @Success     200 {array} schemas.Lighthouse
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/friends/lighthouses [get]
func GetFriendVisitedLighthouses(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	friendId := r.URL.Query().Get("friendId")
	if friendId == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "friendId is required"})
		return
	}

	lighthouses, err := db.GetFriendVisitedLighthouses(claims.Subject, friendId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(lighthouses)
}
