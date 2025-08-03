package mocks

import (
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
)

// MockDB implements interfaces.DBInterface for testing
type MockDB struct {
	lighthouses []schemas.Lighthouse
}

// NewMockDB creates a new MockDB instance with test data
func NewMockDB() interfaces.DBInterface {
	return &MockDB{
		lighthouses: []schemas.Lighthouse{
			{
				ID:        "1",
				Name:      "Test Lighthouse 1",
				Country:   "USA",
				State:     "California",
				Latitude:  37.7749,
				Longitude: -122.4194,
				Image:     "https://example.com/lighthouse1.jpg",
			},
			{
				ID:        "2",
				Name:      "Test Lighthouse 2",
				Country:   "USA",
				State:     "New York",
				Latitude:  40.7128,
				Longitude: -74.0060,
				Image:     "https://example.com/lighthouse2.jpg",
			},
			{
				ID:        "3",
				Name:      "Test Lighthouse 3",
				Country:   "Canada",
				State:     "British Columbia",
				Latitude:  49.2827,
				Longitude: -123.1207,
				Image:     "https://example.com/lighthouse3.jpg",
			},
		},
	}
}

// GetLighthouses returns all lighthouses
func (m *MockDB) GetLighthouses() ([]schemas.Lighthouse, error) {
	return m.lighthouses, nil
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
