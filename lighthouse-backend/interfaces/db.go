package interfaces

import (
	"context"
	"errors"
	"lighthouse-backend/schemas"

	"github.com/go-webauthn/webauthn/webauthn"
)

var (
	ErrUserAlreadyExists        = errors.New("user already exists")
	ErrPasskeySessionNotFound   = errors.New("passkey session not found")
	ErrPasskeySessionExpired    = errors.New("passkey session expired")
	ErrPasskeyCredentialAbsent  = errors.New("passkey credential not found")
	ErrPasskeyCredentialChanged = errors.New("passkey credential changed")
)

// DBInterface defines the database operations we need
type DBInterface interface {
	// Lighthouse operations
	GetLighthouses() ([]schemas.Lighthouse, error)
	GetLighthouseByID(id string) (*schemas.Lighthouse, error)
	GetLighthousesSummary() ([]schemas.LighthouseSummary, error)
	GetLighthousesByCountry(country string) ([]schemas.Lighthouse, error)
	GetLighthousesByState(state string) ([]schemas.Lighthouse, error)
	GetLighthousesByCountryAndState(country string, state string) ([]schemas.Lighthouse, error)

	// User operations
	CreateUser(user schemas.User) error
	GetUser(id string) (*schemas.User, error)

	// Auth operations
	GetUserByEmail(email string) (*schemas.User, error)
	SavePasskeySession(ctx context.Context, session schemas.PasskeySession) error
	ConsumePasskeySession(ctx context.Context, id, ceremony, rpID string) (*schemas.PasskeySession, error)
	CreatePasskeyUser(ctx context.Context, user schemas.PasskeyUser, credential webauthn.Credential, rpID string) error
	GetPasskeyUserByHandle(ctx context.Context, rpID string, handle []byte) (*schemas.PasskeyUser, error)
	UpdatePasskeyCredential(
		ctx context.Context,
		rpID, userID string,
		credential webauthn.Credential,
		expectedVersion int64,
	) error

	GetUserVisitedLighthouses(id string) ([]schemas.Lighthouse, error)
	MarkLighthouseAsVisited(userId string, lighthouseId string) error
	UnmarkLighthouseAsVisited(userId string, lighthouseId string) error

	// Wishlist operations
	GetUserWishlistLighthouses(id string) ([]schemas.Lighthouse, error)
	AddToWishlist(userId string, lighthouseId string) error
	RemoveFromWishlist(userId string, lighthouseId string) error

	// Friend operations
	SearchUsers(query string, currentUserId string) ([]schemas.User, error)
	SendFriendRequest(userId, friendId string) error
	AcceptFriendRequest(userId, friendId string) error
	RemoveFriend(userId, friendId string) error
	GetFriends(userId string) ([]schemas.User, error)
	GetPendingFriendRequests(userId string) ([]schemas.User, error)
	GetOutgoingFriendRequests(userId string) ([]schemas.User, error)
	GetFriendVisitedLighthouses(userId string, friendId string) ([]schemas.Lighthouse, error)
}
