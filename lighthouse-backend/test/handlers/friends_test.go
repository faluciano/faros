package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"lighthouse-backend/auth"
	"lighthouse-backend/handlers"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
	"lighthouse-backend/test/mocks"
	"net/http"
	"net/http/httptest"
	"testing"
)

type friendRequestDB struct {
	interfaces.DBInterface
	target schemas.User
	sentTo string
}

func (db *friendRequestDB) GetUser(id string) (*schemas.User, error) {
	if id != db.target.ID {
		return nil, nil
	}
	return &db.target, nil
}

func (db *friendRequestDB) SendFriendRequest(_ string, friendID string) error {
	db.sentTo = friendID
	return nil
}

func TestSendFriendRequest(t *testing.T) {
	base := mocks.NewMockDB()
	database := &friendRequestDB{
		DBInterface: base,
		target: schemas.User{
			ID:        "target-user",
			FirstName: "Target",
			LastName:  "User",
			Email:     "target@example.com",
		},
	}
	handler := handlers.NewFriendsHandler(database)
	request := httptest.NewRequest(
		http.MethodPost,
		"/user/friends/requests",
		bytes.NewBufferString(`{"friendId":"target-user"}`),
	)
	request = request.WithContext(
		context.WithValue(request.Context(), auth.UserIDKey, "sender-user"),
	)
	response := httptest.NewRecorder()

	handler.SendFriendRequest(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body = %s", response.Code, http.StatusOK, response.Body)
	}
	if database.sentTo != "target-user" {
		t.Fatalf("friend request sent to %q, want target-user", database.sentTo)
	}

	var payload map[string]bool
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !payload["success"] {
		t.Fatalf("response = %#v, want success", payload)
	}
}

func TestSendFriendRequestRejectsSelf(t *testing.T) {
	handler := handlers.NewFriendsHandler(mocks.NewMockDB())
	request := httptest.NewRequest(
		http.MethodPost,
		"/user/friends/requests",
		bytes.NewBufferString(`{"friendId":"same-user"}`),
	)
	request = request.WithContext(
		context.WithValue(request.Context(), auth.UserIDKey, "same-user"),
	)
	response := httptest.NewRecorder()

	handler.SendFriendRequest(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusBadRequest)
	}
}
