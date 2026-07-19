package handlers_test

import (
	"context"
	"encoding/json"
	"lighthouse-backend/auth"
	"lighthouse-backend/handlers"
	"lighthouse-backend/schemas"
	"lighthouse-backend/test/mocks"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetUserMapState(t *testing.T) {
	handler := handlers.NewUserHandler(mocks.NewMockDB())
	request := httptest.NewRequest(http.MethodGet, "/user/map-state", nil)
	request = request.WithContext(context.WithValue(request.Context(), auth.UserIDKey, "user-id"))
	response := httptest.NewRecorder()

	handler.GetUserMapState(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}

	var state schemas.UserMapState
	if err := json.NewDecoder(response.Body).Decode(&state); err != nil {
		t.Fatalf("decode map state: %v", err)
	}
	if state.VisitedIDs == nil || state.WishlistIDs == nil {
		t.Fatal("map state arrays must be empty arrays, not null")
	}
}
