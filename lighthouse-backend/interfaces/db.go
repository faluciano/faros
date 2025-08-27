package interfaces

import "lighthouse-backend/schemas"

// DBInterface defines the database operations we need
type DBInterface interface {
	// Lighthouse operations
	GetLighthouses() ([]schemas.Lighthouse, error)
	GetLighthousesByCountry(country string) ([]schemas.Lighthouse, error)
	GetLighthousesByState(state string) ([]schemas.Lighthouse, error)
	GetLighthousesByCountryAndState(country string, state string) ([]schemas.Lighthouse, error)

	// User operations
	CreateUser(user schemas.User) error
	GetUser(id string) (*schemas.User, error)
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
