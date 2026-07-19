package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"lighthouse-backend/auth"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
	"lighthouse-backend/utils"
	"log"
	"net/http"
	"net/mail"
	"strings"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
)

const (
	passkeySessionHeader        = "X-WebAuthn-Session"
	passkeyRegistrationCeremony = "registration"
	passkeyLoginCeremony        = "login"
	maxAuthRequestBytes         = 1 << 20
)

// AuthHandler handles authentication-related requests.
type AuthHandler struct {
	db        interfaces.DBInterface
	jwtSecret string
	passkeys  *webauthn.WebAuthn
	rpID      string
}

func NewAuthHandler(
	db interfaces.DBInterface,
	jwtSecret string,
	passkeys *webauthn.WebAuthn,
	rpID string,
) *AuthHandler {
	return &AuthHandler{
		db:        db,
		jwtSecret: jwtSecret,
		passkeys:  passkeys,
		rpID:      rpID,
	}
}

type passkeyRegistrationRequest struct {
	// @Description User's email address
	Email string `json:"email"`
	// @Description User's first name
	FirstName string `json:"first_name"`
	// @Description User's last name
	LastName string `json:"last_name"`
}

type passkeyRegistrationOptionsResponse struct {
	FlowID    string                                      `json:"flow_id"`
	PublicKey protocol.PublicKeyCredentialCreationOptions `json:"public_key"`
}

type passkeyLoginOptionsResponse struct {
	FlowID    string                                     `json:"flow_id"`
	PublicKey protocol.PublicKeyCredentialRequestOptions `json:"public_key"`
}

type authResponse struct {
	// @Description JWT authentication token
	Token string `json:"token"`
	// @Description Authenticated user information
	User schemas.User `json:"user"`
}

// BeginPasskeyRegistration godoc
// @Summary     Begin passkey registration
// @Description Create passkey registration options for a new user
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       request body passkeyRegistrationRequest true "Registration profile"
// @Success     200 {object} map[string]interface{}
// @Failure     400 {object} utils.APIError
// @Failure     409 {object} utils.APIError
// @Failure     500 {object} utils.APIError
// @Router      /auth/passkey/register/options [post]
func (h *AuthHandler) BeginPasskeyRegistration(w http.ResponseWriter, r *http.Request) {
	var req passkeyRegistrationRequest
	if err := decodeJSON(w, r, &req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	email, err := normalizeEmail(req.Email)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}
	firstName := strings.TrimSpace(req.FirstName)
	lastName := strings.TrimSpace(req.LastName)
	if firstName == "" {
		utils.WriteError(w, http.StatusBadRequest, "first_name is required")
		return
	}
	if lastName == "" {
		utils.WriteError(w, http.StatusBadRequest, "last_name is required")
		return
	}
	if len(firstName) > 100 || len(lastName) > 100 {
		utils.WriteError(w, http.StatusBadRequest, "name fields must be 100 characters or fewer")
		return
	}

	existingUser, err := h.db.GetUserByEmail(email)
	if err != nil {
		log.Printf("check passkey registration email: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to begin passkey registration")
		return
	}
	if existingUser != nil {
		utils.WriteError(w, http.StatusConflict, "email already registered")
		return
	}

	handle, err := auth.GenerateUserHandle()
	if err != nil {
		log.Printf("generate passkey user handle: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to begin passkey registration")
		return
	}

	user := schemas.PasskeyUser{
		User: schemas.User{
			ID:        uuid.NewString(),
			Email:     email,
			FirstName: firstName,
			LastName:  lastName,
		},
		Handle: handle,
	}

	creation, sessionData, err := h.passkeys.BeginRegistration(
		user,
		webauthn.WithResidentKeyRequirement(protocol.ResidentKeyRequirementRequired),
	)
	if err != nil {
		log.Printf("begin passkey registration: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to begin passkey registration")
		return
	}

	flowID, err := auth.GenerateCeremonyID()
	if err != nil {
		log.Printf("generate passkey registration ceremony ID: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to begin passkey registration")
		return
	}

	if err := h.db.SavePasskeySession(r.Context(), schemas.PasskeySession{
		ID:       flowID,
		RPID:     h.rpID,
		Ceremony: passkeyRegistrationCeremony,
		Data:     *sessionData,
		User:     user.User,
	}); err != nil {
		log.Printf("save passkey registration session: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to begin passkey registration")
		return
	}

	writeJSON(w, http.StatusOK, passkeyRegistrationOptionsResponse{
		FlowID:    flowID,
		PublicKey: creation.Response,
	})
}

// FinishPasskeyRegistration godoc
// @Summary     Finish passkey registration
// @Description Verify a new passkey and create the user account
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       X-WebAuthn-Session header string true "Passkey ceremony ID"
// @Success     201 {object} authResponse
// @Failure     400 {object} utils.APIError
// @Failure     409 {object} utils.APIError
// @Failure     500 {object} utils.APIError
// @Router      /auth/passkey/register [post]
func (h *AuthHandler) FinishPasskeyRegistration(w http.ResponseWriter, r *http.Request) {
	session, ok := h.consumePasskeySession(w, r, passkeyRegistrationCeremony)
	if !ok {
		return
	}

	parsedResponse, err := protocol.ParseCredentialCreationResponseBody(
		http.MaxBytesReader(w, r.Body, maxAuthRequestBytes),
	)
	if err != nil {
		log.Printf("parse passkey registration response: %v", err)
		utils.WriteError(w, http.StatusBadRequest, "invalid passkey registration response")
		return
	}

	user := schemas.PasskeyUser{
		User:   session.User,
		Handle: session.Data.UserID,
	}
	credential, err := h.passkeys.CreateCredential(user, session.Data, parsedResponse)
	if err != nil {
		log.Printf("verify passkey registration: %v", err)
		utils.WriteError(w, http.StatusBadRequest, "passkey registration failed")
		return
	}

	if err := h.db.CreatePasskeyUser(r.Context(), user, *credential, h.rpID); err != nil {
		if errors.Is(err, interfaces.ErrUserAlreadyExists) {
			utils.WriteError(w, http.StatusConflict, "email or passkey already registered")
			return
		}
		log.Printf("create passkey user: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	h.writeAuthResponse(w, http.StatusCreated, user.User)
}

// BeginPasskeyLogin godoc
// @Summary     Begin passkey sign-in
// @Description Create usernameless passkey authentication options
// @Tags        auth
// @Produce     json
// @Success     200 {object} map[string]interface{}
// @Failure     500 {object} utils.APIError
// @Router      /auth/passkey/login/options [post]
func (h *AuthHandler) BeginPasskeyLogin(w http.ResponseWriter, r *http.Request) {
	assertion, sessionData, err := h.passkeys.BeginDiscoverableLogin(
		webauthn.WithUserVerification(protocol.VerificationRequired),
	)
	if err != nil {
		log.Printf("begin passkey login: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to begin passkey sign-in")
		return
	}

	flowID, err := auth.GenerateCeremonyID()
	if err != nil {
		log.Printf("generate passkey login ceremony ID: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to begin passkey sign-in")
		return
	}

	if err := h.db.SavePasskeySession(r.Context(), schemas.PasskeySession{
		ID:       flowID,
		RPID:     h.rpID,
		Ceremony: passkeyLoginCeremony,
		Data:     *sessionData,
	}); err != nil {
		log.Printf("save passkey login session: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to begin passkey sign-in")
		return
	}

	writeJSON(w, http.StatusOK, passkeyLoginOptionsResponse{
		FlowID:    flowID,
		PublicKey: assertion.Response,
	})
}

// FinishPasskeyLogin godoc
// @Summary     Finish passkey sign-in
// @Description Verify a discoverable passkey and authenticate its owner
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       X-WebAuthn-Session header string true "Passkey ceremony ID"
// @Success     200 {object} authResponse
// @Failure     400 {object} utils.APIError
// @Failure     401 {object} utils.APIError
// @Failure     500 {object} utils.APIError
// @Router      /auth/passkey/login [post]
func (h *AuthHandler) FinishPasskeyLogin(w http.ResponseWriter, r *http.Request) {
	session, ok := h.consumePasskeySession(w, r, passkeyLoginCeremony)
	if !ok {
		return
	}

	parsedResponse, err := protocol.ParseCredentialRequestResponseBody(
		http.MaxBytesReader(w, r.Body, maxAuthRequestBytes),
	)
	if err != nil {
		log.Printf("parse passkey login response: %v", err)
		utils.WriteError(w, http.StatusBadRequest, "invalid passkey sign-in response")
		return
	}

	resolvedUser, credential, err := h.passkeys.ValidatePasskeyLogin(
		func(_ []byte, userHandle []byte) (webauthn.User, error) {
			user, err := h.db.GetPasskeyUserByHandle(r.Context(), h.rpID, userHandle)
			if err != nil {
				return nil, err
			}
			if user == nil {
				return nil, interfaces.ErrPasskeyCredentialAbsent
			}
			return user, nil
		},
		session.Data,
		parsedResponse,
	)
	if err != nil {
		log.Printf("verify passkey login: %v", err)
		utils.WriteError(w, http.StatusUnauthorized, "passkey sign-in failed")
		return
	}

	user, ok := resolvedUser.(*schemas.PasskeyUser)
	if !ok {
		log.Printf("verify passkey login: unexpected user type %T", resolvedUser)
		utils.WriteError(w, http.StatusInternalServerError, "failed to complete passkey sign-in")
		return
	}
	if credential.Authenticator.CloneWarning {
		log.Printf("reject cloned passkey credential for user %s", user.ID)
		utils.WriteError(w, http.StatusUnauthorized, "passkey sign-in failed")
		return
	}
	credentialVersion, ok := user.CredentialVersion(credential.ID)
	if !ok {
		log.Printf("update passkey credential: missing version for user %s", user.ID)
		utils.WriteError(w, http.StatusInternalServerError, "failed to complete passkey sign-in")
		return
	}
	if err := h.db.UpdatePasskeyCredential(
		r.Context(),
		h.rpID,
		user.ID,
		*credential,
		credentialVersion,
	); errors.Is(err, interfaces.ErrPasskeyCredentialChanged) {
		log.Printf("passkey credential changed during login for user %s", user.ID)
		utils.WriteError(w, http.StatusConflict, "passkey sign-in must be retried")
		return
	} else if err != nil {
		log.Printf("update passkey credential: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to complete passkey sign-in")
		return
	}

	h.writeAuthResponse(w, http.StatusOK, user.User)
}

// GetMe godoc
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

	writeJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) consumePasskeySession(
	w http.ResponseWriter,
	r *http.Request,
	ceremony string,
) (*schemas.PasskeySession, bool) {
	flowID := strings.TrimSpace(r.Header.Get(passkeySessionHeader))
	if flowID == "" {
		utils.WriteError(w, http.StatusBadRequest, "missing passkey session")
		return nil, false
	}

	session, err := h.db.ConsumePasskeySession(r.Context(), flowID, ceremony, h.rpID)
	if errors.Is(err, interfaces.ErrPasskeySessionNotFound) ||
		errors.Is(err, interfaces.ErrPasskeySessionExpired) {
		utils.WriteError(w, http.StatusBadRequest, "passkey request expired; start again")
		return nil, false
	}
	if err != nil {
		log.Printf("consume passkey %s session: %v", ceremony, err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to continue passkey request")
		return nil, false
	}

	return session, true
}

func (h *AuthHandler) writeAuthResponse(w http.ResponseWriter, status int, user schemas.User) {
	token, err := auth.GenerateToken(user.ID, h.jwtSecret)
	if err != nil {
		log.Printf("generate auth token: %v", err)
		utils.WriteError(w, http.StatusInternalServerError, "failed to create authentication session")
		return
	}

	writeJSON(w, status, authResponse{
		Token: token,
		User:  user,
	})
}

func normalizeEmail(value string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(value))
	if email == "" {
		return "", errors.New("email is required")
	}
	if len(email) > 254 {
		return "", errors.New("email must be 254 characters or fewer")
	}

	address, err := mail.ParseAddress(email)
	if err != nil || address.Address != email {
		return "", errors.New("email must be valid")
	}
	return email, nil
}

func decodeJSON(w http.ResponseWriter, r *http.Request, destination any) error {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxAuthRequestBytes))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return err
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("request body must contain one JSON object")
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("encode JSON response: %v", err)
	}
}
