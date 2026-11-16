package db

import (
	"database/sql"
	"errors"
	"lighthouse-backend/interfaces"
	"testing"

	_ "github.com/tursodatabase/go-libsql"
)

func newSearchTestDB(t *testing.T) interfaces.DBInterface {
	t.Helper()

	database, err := sql.Open("libsql", ":memory:")
	if err != nil {
		t.Fatalf("sql.Open() error = %v", err)
	}
	database.SetMaxOpenConns(1)
	t.Cleanup(func() { database.Close() })

	if err := createAllTables(database); err != nil {
		t.Fatalf("createAllTables() error = %v", err)
	}
	if _, err := database.Exec(`INSERT INTO users (id, first_name, last_name, email) VALUES
		('me', 'Me', 'Self', 'me@example.com'),
		('ada', 'Ada', 'Lovelace', 'ada@example.com'),
		('alan', 'Alan', 'Turing', 'alan@example.com')`); err != nil {
		t.Fatalf("insert users: %v", err)
	}
	return NewDB(database)
}

func TestSearchUsersMatchesNamesButOnlyExactEmails(t *testing.T) {
	database := newSearchTestDB(t)

	cases := []struct {
		query string
		want  []string
	}{
		{"ada", []string{"ada"}},
		{"ada love", []string{"ada"}},
		{"ALAN@example.com", []string{"alan"}},
		// Substrings of an address must not match, or search enumerates emails.
		{"example.com", nil},
		{"@example", nil},
		// LIKE wildcards are literal.
		{"%%", nil},
		{"a_a", nil},
	}
	for _, testCase := range cases {
		users, err := database.SearchUsers(testCase.query, "me")
		if err != nil {
			t.Fatalf("SearchUsers(%q) error = %v", testCase.query, err)
		}
		if len(users) != len(testCase.want) {
			t.Fatalf("SearchUsers(%q) = %v, want IDs %v", testCase.query, users, testCase.want)
		}
		for index, id := range testCase.want {
			if users[index].ID != id {
				t.Fatalf("SearchUsers(%q)[%d].ID = %q, want %q", testCase.query, index, users[index].ID, id)
			}
		}
	}
}

func TestAcceptFriendRequestRequiresPendingRequest(t *testing.T) {
	database := newSearchTestDB(t)

	if err := database.AcceptFriendRequest("me", "ada"); !errors.Is(err, interfaces.ErrFriendRequestNotFound) {
		t.Fatalf("AcceptFriendRequest() without a request error = %v, want ErrFriendRequestNotFound", err)
	}
	if err := database.SendFriendRequest("ada", "me"); err != nil {
		t.Fatalf("SendFriendRequest() error = %v", err)
	}
	// The sender cannot accept their own request.
	if err := database.AcceptFriendRequest("ada", "me"); !errors.Is(err, interfaces.ErrFriendRequestNotFound) {
		t.Fatalf("AcceptFriendRequest() by sender error = %v, want ErrFriendRequestNotFound", err)
	}
	if err := database.AcceptFriendRequest("me", "ada"); err != nil {
		t.Fatalf("AcceptFriendRequest() error = %v", err)
	}
	friends, err := database.GetFriends("me")
	if err != nil || len(friends) != 1 || friends[0].ID != "ada" {
		t.Fatalf("GetFriends() = %v, %v; want ada", friends, err)
	}
}
