package handlers

import (
	"encoding/json"
	"lighthouse-backend/auth"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
	"lighthouse-backend/utils"
	"net/http"

	"github.com/google/uuid"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	db        interfaces.DBInterface
	jwtSecret string
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(db interfaces.DBInterface, jwtSecret string) *AuthHandler {
	return &AuthHandler{db: db, jwtSecret: jwtSecret}
}

type registerRequest struct {
	// @Description User's email address
	Email string `json:"email"`
	// @Description User's password (minimum 8 characters)
	Password string `json:"password"`
	// @Description User's first name
	FirstName string `json:"first_name"`
	// @Description User's last name
	LastName string `json:"last_name"`
}

type loginRequest struct {
	// @Description User's email address
	Email string `json:"email"`
	// @Description User's password
	Password string `json:"password"`
}

type authResponse struct {
	// @Description JWT authentication token
	Token string `json:"token"`
	// @Description Authenticated user information
	User schemas.User `json:"user"`
}

// @Summary     Register a new user
// @Description Create a new user account with email and password
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       request body registerRequest true "Registration details"
// @Success     201 {object} authResponse
// @Failure     400 {object} map[string]string
// @Failure     409 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate required fields
	if req.Email == "" {
		utils.WriteError(w, http.StatusBadRequest, "email is required")
		return
	}
	if req.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, "password is required")
		return
	}
	if len(req.Password) < 8 {
		utils.WriteError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}
	if req.FirstName == "" {
		utils.WriteError(w, http.StatusBadRequest, "first_name is required")
		return
	}
	if req.LastName == "" {
		utils.WriteError(w, http.StatusBadRequest, "last_name is required")
		return
	}

	// Check if email already exists
	existingUser, err := h.db.GetUserByEmail(req.Email)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "failed to check existing user")
		return
	}
	if existingUser != nil {
		utils.WriteError(w, http.StatusConflict, "email already registered")
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	// Create user
	userID := uuid.New().String()
	user := schemas.User{
		ID:           userID,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Email:        req.Email,
		PasswordHash: hashedPassword,
	}

	if err := h.db.CreateUserWithPassword(user); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	// Generate JWT
	token, err := auth.GenerateToken(userID, h.jwtSecret)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(authResponse{
		Token: token,
		User: schemas.User{
			ID:        user.ID,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Email:     user.Email,
		},
	})
}

// @Summary     Login user
// @Description Authenticate a user with email and password
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       request body loginRequest true "Login credentials"
// @Success     200 {object} authResponse
// @Failure     400 {object} map[string]string
// @Failure     401 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate required fields
	if req.Email == "" {
		utils.WriteError(w, http.StatusBadRequest, "email is required")
		return
	}
	if req.Password == "" {
		utils.WriteError(w, http.StatusBadRequest, "password is required")
		return
	}

	// Look up user by email
	user, err := h.db.GetUserByEmail(req.Email)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "failed to look up user")
		return
	}
	if user == nil {
		utils.WriteError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	// Check password
	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		utils.WriteError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	// Generate JWT
	token, err := auth.GenerateToken(user.ID, h.jwtSecret)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	json.NewEncoder(w).Encode(authResponse{
		Token: token,
		User: schemas.User{
			ID:        user.ID,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Email:     user.Email,
		},
	})
}

// @Summary     Get current user
// @Description Get the currently authenticated user's information (requires JWT)
// @Tags        auth
// @Produce     json
// @Security    ApiKeyAuth
// @Success     200 {object} schemas.User
// @Failure     401 {object} map[string]string
// @Failure     404 {object} map[string]string
// @Failure     500 {object} map[string]string
// @Router      /auth/me [get]
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
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
