package handlers

import (
	"encoding/json"
	"errors"
	"lighthouse-backend/auth"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
	"lighthouse-backend/utils"
	"log"
	"net/http"
	"strings"
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
func (h *FriendsHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := utils.GetStringParam(r, "query", "")
	if query == "" {
		utils.WriteError(w, http.StatusBadRequest, "search query is required")
		return
	}
	if len(query) < 2 {
		utils.WriteError(w, http.StatusBadRequest, "search query must be at least 2 characters")
		return
	}
	if len(query) > 100 {
		utils.WriteError(w, http.StatusBadRequest, "search query must be less than 100 characters")
		return
	}

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	users, err := h.db.SearchUsers(strings.ToLower(query), userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to search users")
		return
	}

	if users == nil {
		users = []schemas.User{}
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
func (h *FriendsHandler) GetFriends(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	friends, err := h.db.GetFriends(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve friends")
		return
	}

	if friends == nil {
		friends = []schemas.User{}
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
func (h *FriendsHandler) GetPendingFriendRequests(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	requests, err := h.db.GetPendingFriendRequests(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve pending friend requests")
		return
	}

	if requests == nil {
		requests = []schemas.User{}
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
func (h *FriendsHandler) GetOutgoingFriendRequests(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	requests, err := h.db.GetOutgoingFriendRequests(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve outgoing friend requests")
		return
	}

	if requests == nil {
		requests = []schemas.User{}
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
// @Success     200 {object} map[string]bool
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Failure     409 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user/friends/requests [post]
func (h *FriendsHandler) SendFriendRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req FriendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request")
		return
	}
	req.FriendId = strings.TrimSpace(req.FriendId)
	if req.FriendId == "" {
		utils.WriteError(w, http.StatusBadRequest, "friendId is required")
		return
	}
	if req.FriendId == userID {
		utils.WriteError(w, http.StatusBadRequest, "cannot send a friend request to yourself")
		return
	}
	friend, err := h.db.GetUser(req.FriendId)
	if err != nil {
		log.Printf("look up friend request recipient: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Failed to send friend request")
		return
	}
	if friend == nil {
		utils.WriteError(w, http.StatusNotFound, "user not found")
		return
	}

	if err := h.db.SendFriendRequest(userID, req.FriendId); errors.Is(err, interfaces.ErrFriendshipExists) {
		utils.WriteError(w, http.StatusConflict, "friendship or friend request already exists")
		return
	} else if err != nil {
		log.Printf("send friend request: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "Failed to send friend request")
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"success": true})
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
func (h *FriendsHandler) AcceptFriendRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req FriendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if err := h.db.AcceptFriendRequest(userID, req.FriendId); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to accept friend request")
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
func (h *FriendsHandler) RemoveFriend(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req FriendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if err := h.db.RemoveFriend(userID, req.FriendId); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to remove friend")
		return
	}

	w.WriteHeader(http.StatusOK)
}
