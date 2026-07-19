package handlers_test

import (
	"bytes"
	"encoding/json"
	"lighthouse-backend/auth"
	"lighthouse-backend/handlers"
	"lighthouse-backend/test/mocks"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestBeginPasskeyRegistration(t *testing.T) {
	handler := newPasskeyAuthHandler(t)
	requestBody := []byte(`{
		"email": "USER@example.com",
		"first_name": "Test",
		"last_name": "User"
	}`)
	request := httptest.NewRequest(
		http.MethodPost,
		"/auth/passkey/register/options",
		bytes.NewReader(requestBody),
	)
	response := httptest.NewRecorder()

	handler.BeginPasskeyRegistration(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", response.Code, http.StatusOK, response.Body)
	}

	var payload struct {
		FlowID    string `json:"flow_id"`
		PublicKey struct {
			Challenge string `json:"challenge"`
			RP        struct {
				ID string `json:"id"`
			} `json:"rp"`
			User struct {
				Name string `json:"name"`
			} `json:"user"`
			AuthenticatorSelection struct {
				ResidentKey      string `json:"residentKey"`
				UserVerification string `json:"userVerification"`
			} `json:"authenticatorSelection"`
		} `json:"public_key"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload.FlowID == "" || payload.PublicKey.Challenge == "" {
		t.Fatalf("missing ceremony data: %#v", payload)
	}
	if payload.PublicKey.RP.ID != "localhost" {
		t.Fatalf("RP ID = %q, want localhost", payload.PublicKey.RP.ID)
	}
	if payload.PublicKey.User.Name != "user@example.com" {
		t.Fatalf("user name = %q, want normalized email", payload.PublicKey.User.Name)
	}
	if payload.PublicKey.AuthenticatorSelection.ResidentKey != "required" {
		t.Fatalf(
			"resident key = %q, want required",
			payload.PublicKey.AuthenticatorSelection.ResidentKey,
		)
	}
	if payload.PublicKey.AuthenticatorSelection.UserVerification != "required" {
		t.Fatalf(
			"user verification = %q, want required",
			payload.PublicKey.AuthenticatorSelection.UserVerification,
		)
	}
}

func TestBeginPasskeyRegistrationRejectsInvalidEmail(t *testing.T) {
	handler := newPasskeyAuthHandler(t)
	request := httptest.NewRequest(
		http.MethodPost,
		"/auth/passkey/register/options",
		bytes.NewBufferString(`{
			"email": "not-an-email",
			"first_name": "Test",
			"last_name": "User"
		}`),
	)
	response := httptest.NewRecorder()

	handler.BeginPasskeyRegistration(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf(
			"status = %d, want %d; body = %s",
			response.Code,
			http.StatusBadRequest,
			response.Body,
		)
	}
}

func TestBeginPasskeyLoginIsUsernameless(t *testing.T) {
	handler := newPasskeyAuthHandler(t)
	request := httptest.NewRequest(
		http.MethodPost,
		"/auth/passkey/login/options",
		nil,
	)
	response := httptest.NewRecorder()

	handler.BeginPasskeyLogin(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", response.Code, http.StatusOK, response.Body)
	}

	var payload struct {
		FlowID    string `json:"flow_id"`
		PublicKey struct {
			Challenge        string `json:"challenge"`
			RPID             string `json:"rpId"`
			UserVerification string `json:"userVerification"`
			AllowCredentials []any  `json:"allowCredentials"`
		} `json:"public_key"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload.FlowID == "" || payload.PublicKey.Challenge == "" {
		t.Fatalf("missing ceremony data: %#v", payload)
	}
	if payload.PublicKey.RPID != "localhost" {
		t.Fatalf("RP ID = %q, want localhost", payload.PublicKey.RPID)
	}
	if payload.PublicKey.UserVerification != "required" {
		t.Fatalf(
			"user verification = %q, want required",
			payload.PublicKey.UserVerification,
		)
	}
	if len(payload.PublicKey.AllowCredentials) != 0 {
		t.Fatalf(
			"allowCredentials = %#v, want empty for discoverable login",
			payload.PublicKey.AllowCredentials,
		)
	}
}

func TestFinishPasskeyLoginRequiresCeremonySession(t *testing.T) {
	handler := newPasskeyAuthHandler(t)
	request := httptest.NewRequest(
		http.MethodPost,
		"/auth/passkey/login",
		bytes.NewBufferString(`{}`),
	)
	response := httptest.NewRecorder()

	handler.FinishPasskeyLogin(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf(
			"status = %d, want %d; body = %s",
			response.Code,
			http.StatusBadRequest,
			response.Body,
		)
	}
}

func newPasskeyAuthHandler(t *testing.T) *handlers.AuthHandler {
	t.Helper()

	passkeys, err := auth.NewPasskey("localhost", []string{"http://localhost:5173"})
	if err != nil {
		t.Fatalf("auth.NewPasskey() error = %v", err)
	}
	return handlers.NewAuthHandler(mocks.NewMockDB(), "test-jwt-secret", passkeys, "localhost")
}
