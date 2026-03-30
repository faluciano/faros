package mocks

import (
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
)

// MockDB implements interfaces.DBInterface for testing
type MockDB struct {
	lighthouses []schemas.Lighthouse
	users       []schemas.User
}

// NewMockDB creates a new MockDB instance with test data
func NewMockDB() interfaces.DBInterface {
	return &MockDB{
		lighthouses: []schemas.Lighthouse{
			{
				ID:                   "1",
				Name:                 "Test Lighthouse 1",
				Country:              "USA",
				State:                "California",
				Latitude:             37.7749,
				Longitude:            -122.4194,
				Image:                "https://example.com/lighthouse1.jpg",
				Height:               35.0,
				YearBuilt:            1870,
				LightCharacteristics: "Fl W 10s",
				Description:          "A beautiful lighthouse in California.",
			},
			{
				ID:                   "2",
				Name:                 "Test Lighthouse 2",
				Country:              "USA",
				State:                "New York",
				Latitude:             40.7128,
				Longitude:            -74.0060,
				Image:                "https://example.com/lighthouse2.jpg",
				Height:               50.0,
				YearBuilt:            1880,
				LightCharacteristics: "F R",
				Description:          "A historic lighthouse in New York.",
			},
			{
				ID:                   "3",
				Name:                 "Test Lighthouse 3",
				Country:              "Canada",
				State:                "British Columbia",
				Latitude:             49.2827,
				Longitude:            -123.1207,
				Image:                "https://example.com/lighthouse3.jpg",
				Height:               40.0,
				YearBuilt:            1890,
				LightCharacteristics: "Iso W 4s",
				Description:          "A lighthouse in British Columbia.",
			},
		},
	}
}

// GetLighthouses returns all lighthouses
func (m *MockDB) GetLighthouses() ([]schemas.Lighthouse, error) {
	return m.lighthouses, nil
}

// GetLighthouseByID returns a single lighthouse by its ID
func (m *MockDB) GetLighthouseByID(id string) (*schemas.Lighthouse, error) {
	for _, l := range m.lighthouses {
		if l.ID == id {
			return &l, nil
		}
	}
	return nil, nil
}

// GetLighthousesSummary returns lightweight lighthouses for map rendering
func (m *MockDB) GetLighthousesSummary() ([]schemas.LighthouseSummary, error) {
	summaries := make([]schemas.LighthouseSummary, len(m.lighthouses))
	for i, l := range m.lighthouses {
		summaries[i] = schemas.LighthouseSummary{
			ID:        l.ID,
			Name:      l.Name,
			Latitude:  l.Latitude,
			Longitude: l.Longitude,
		}
	}
	return summaries, nil
}

// GetLighthousesByCountry returns lighthouses filtered by country
func (m *MockDB) GetLighthousesByCountry(country string) ([]schemas.Lighthouse, error) {
	var filtered []schemas.Lighthouse
	for _, l := range m.lighthouses {
		if l.Country == country {
			filtered = append(filtered, l)
		}
	}
	return filtered, nil
}

// GetLighthousesByState returns lighthouses filtered by state
func (m *MockDB) GetLighthousesByState(state string) ([]schemas.Lighthouse, error) {
	var filtered []schemas.Lighthouse
	for _, l := range m.lighthouses {
		if l.State == state {
			filtered = append(filtered, l)
		}
	}
	return filtered, nil
}

// GetLighthousesByCountryAndState returns lighthouses filtered by both country and state
func (m *MockDB) GetLighthousesByCountryAndState(country string, state string) ([]schemas.Lighthouse, error) {
	var filtered []schemas.Lighthouse
	for _, l := range m.lighthouses {
		if l.Country == country && l.State == state {
			filtered = append(filtered, l)
		}
	}
	return filtered, nil
}

// Mocked user and friend methods
func (m *MockDB) CreateUser(user schemas.User) error                                 { return nil }
func (m *MockDB) GetUser(id string) (*schemas.User, error)                           { return nil, nil }
func (m *MockDB) GetUserVisitedLighthouses(id string) ([]schemas.Lighthouse, error)  { return nil, nil }
func (m *MockDB) MarkLighthouseAsVisited(userId, lhId string) error                  { return nil }
func (m *MockDB) UnmarkLighthouseAsVisited(userId, lhId string) error                { return nil }
func (m *MockDB) GetUserWishlistLighthouses(id string) ([]schemas.Lighthouse, error) { return nil, nil }
func (m *MockDB) AddToWishlist(userId, lhId string) error                            { return nil }
func (m *MockDB) RemoveFromWishlist(userId, lhId string) error                       { return nil }
func (m *MockDB) SearchUsers(q, id string) ([]schemas.User, error)                   { return nil, nil }
func (m *MockDB) SendFriendRequest(userId, friendId string) error                    { return nil }
func (m *MockDB) AcceptFriendRequest(userId, friendId string) error                  { return nil }
func (m *MockDB) RemoveFriend(userId, friendId string) error                         { return nil }
func (m *MockDB) GetFriends(userId string) ([]schemas.User, error)                   { return nil, nil }
func (m *MockDB) GetPendingFriendRequests(userId string) ([]schemas.User, error)     { return nil, nil }
func (m *MockDB) GetOutgoingFriendRequests(userId string) ([]schemas.User, error)    { return nil, nil }
func (m *MockDB) GetFriendVisitedLighthouses(userId, fId string) ([]schemas.Lighthouse, error) {
	return nil, nil
}

// Auth operations
func (m *MockDB) GetUserByEmail(email string) (*schemas.User, error) { return nil, nil }
func (m *MockDB) CreateUserWithPassword(user schemas.User) error     { return nil }
