package handlers

import (
	"encoding/json"
	"lighthouse-backend/auth"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/utils"
	"net/http"
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

// @Summary     Get current user
// @Description Get the current authenticated user's information
// @Tags        users
// @Produce     json
// @Security    ApiKeyAuth
// @Success     200 {object} schemas.User
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /user [get]
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.db.GetUser(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "failed to retrieve user")
		return
	}
	if user == nil {
		utils.WriteError(w, http.StatusNotFound, "user not found")
		return
	}

	json.NewEncoder(w).Encode(user)
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
func (h *UserHandler) GetUserVisitedLighthouses(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	lighthouses, err := h.db.GetUserVisitedLighthouses(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve visited lighthouses")
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
func (h *UserHandler) GetUserWishlistLighthouses(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	lighthouses, err := h.db.GetUserWishlistLighthouses(userID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve wishlist")
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
func (h *UserHandler) AddToWishlist(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req VisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if err := h.db.AddToWishlist(userID, req.LighthouseId); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to add to wishlist")
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
func (h *UserHandler) RemoveFromWishlist(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req VisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if err := h.db.RemoveFromWishlist(userID, req.LighthouseId); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to remove from wishlist")
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
func (h *UserHandler) MarkLighthouseAsVisited(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req VisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if err := h.db.MarkLighthouseAsVisited(userID, req.LighthouseId); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to mark as visited")
		return
	}

	// When marking as visited, remove from wishlist if it exists there
	_ = h.db.RemoveFromWishlist(userID, req.LighthouseId)

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
func (h *UserHandler) UnmarkLighthouseAsVisited(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req VisitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if err := h.db.UnmarkLighthouseAsVisited(userID, req.LighthouseId); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to unmark as visited")
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
func (h *UserHandler) GetFriendVisitedLighthouses(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := auth.GetUserID(r.Context())
	if userID == "" {
		utils.WriteError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	friendId := r.URL.Query().Get("friendId")
	if friendId == "" {
		utils.WriteError(w, http.StatusBadRequest, "friendId is required")
		return
	}

	lighthouses, err := h.db.GetFriendVisitedLighthouses(userID, friendId)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve friend visited lighthouses")
		return
	}

	json.NewEncoder(w).Encode(lighthouses)
}
