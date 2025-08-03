package handlers

import (
	"encoding/json"
	"lighthouse-backend/db"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/utils"
	"net/http"
	"strings"

	clerk "github.com/clerk/clerk-sdk-go/v2"
)

// FriendsHandler handles friend-related requests
type FriendsHandler struct {
	db interfaces.DBInterface
}

// NewFriendsHandler creates a new FriendsHandler
func NewFriendsHandler(db interfaces.DBInterface) *FriendsHandler {
	return &FriendsHandler{db: db}
}

type FriendRequest struct {
	// @Description ID of the user to add as friend
	FriendId string `json:"friendId"`
}

// HandleFriends handles all friend-related operations
func (h *FriendsHandler) HandleFriends(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetFriends(w, r)
	case http.MethodDelete:
		RemoveFriend(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "method not allowed"})
	}
}

// HandleFriendRequests handles friend request operations
func (h *FriendsHandler) HandleFriendRequests(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetPendingFriendRequests(w, r)
	case http.MethodPost:
		SendFriendRequest(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "method not allowed"})
	}
}

// @Summary     Search users
// @Description Search for users by name or email
// @Tags        friends
// @Produce     json
// @Security    ApiKeyAuth
// @Param       query query string true "Search query"
// @Success     200 {array} schemas.User
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /users/search [get]
func SearchUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Use utility function for query parameter handling
	query := utils.GetStringParam(r, "query", "")
	if query == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "search query is required"})
		return
	}

	// Validate query length
	if len(query) < 2 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "search query must be at least 2 characters"})
		return
	}

	if len(query) > 100 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "search query must be less than 100 characters"})
		return
	}

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	// Search users by name or email
	users, err := db.SearchUsers(strings.ToLower(query), claims.Subject)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(users)
}

// @Summary     Get user's friends
// @Description Get a list of the current user's friends
// @Tags        friends
// @Produce     json
// @Security    ApiKeyAuth
// @Success     200 {array} schemas.User
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/friends [get]
func GetFriends(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	friends, err := db.GetFriends(claims.Subject)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	json.NewEncoder(w).Encode(friends)
}

// @Summary     Get pending friend requests
// @Description Get a list of pending friend requests for the current user
// @Tags        friends
// @Produce     json
// @Security    ApiKeyAuth
// @Success     200 {array} schemas.User
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/friends/requests [get]
func GetPendingFriendRequests(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	requests, err := db.GetPendingFriendRequests(claims.Subject)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(requests)
}

// @Summary     Get outgoing friend requests
// @Description Get a list of friend requests sent by the current user
// @Tags        friends
// @Produce     json
// @Security    ApiKeyAuth
// @Success     200 {array} schemas.User
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/friends/requests/outgoing [get]
func GetOutgoingFriendRequests(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	requests, err := db.GetOutgoingFriendRequests(claims.Subject)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(requests)
}

// @Summary     Send friend request
// @Description Send a friend request to another user
// @Tags        friends
// @Accept      json
// @Produce     json
// @Security    ApiKeyAuth
// @Param       request body FriendRequest true "Friend ID"
// @Success     200
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/friends/requests [post]
func SendFriendRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	var req FriendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if err := db.SendFriendRequest(claims.Subject, req.FriendId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary     Accept friend request
// @Description Accept a pending friend request
// @Tags        friends
// @Accept      json
// @Produce     json
// @Security    ApiKeyAuth
// @Param       request body FriendRequest true "Friend ID"
// @Success     200
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/friends/requests/accept [post]
func AcceptFriendRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	var req FriendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if err := db.AcceptFriendRequest(claims.Subject, req.FriendId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
}

// @Summary     Remove friend
// @Description Remove a user from the current user's friends list
// @Tags        friends
// @Accept      json
// @Produce     json
// @Security    ApiKeyAuth
// @Param       request body FriendRequest true "Friend ID"
// @Success     200
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/friends [delete]
func RemoveFriend(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
		return
	}

	var req FriendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid request"})
		return
	}

	if err := db.RemoveFriend(claims.Subject, req.FriendId); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
}
