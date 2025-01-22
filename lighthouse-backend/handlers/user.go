package handlers

import (
	"fmt"
	"net/http"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/user"
)

func InitClerk() error {
	clerkToken := os.Getenv("CLERK_AUTH_TOKEN")
	if clerkToken == "" {
		return fmt.Errorf("CLERK_AUTH_TOKEN must be set")
	}
	clerk.SetKey(clerkToken)
	return nil
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"access": "unauthorized"}`))
		return
	}

	usr, err := user.Get(ctx, claims.Subject)
	if err != nil {
		panic(err)
	}
	if usr == nil {
		w.Write([]byte("User does not exist"))
		return
	}

	w.Write([]byte("Hello " + *usr.FirstName))

}
