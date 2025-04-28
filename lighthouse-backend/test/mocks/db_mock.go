package mocks

import (
	"lighthouse-backend/interfaces"
	"lighthouse-backend/models"
)

// MockDB implements interfaces.DBInterface for testing
type MockDB struct {
	lighthouses []models.Lighthouse
}

// NewMockDB creates a new MockDB instance with test data
func NewMockDB() interfaces.DBInterface {
	return &MockDB{
		lighthouses: []models.Lighthouse{
			{
				ID:        "1",
				Name:      "Test Lighthouse 1",
				Country:   "USA",
				State:     "California",
				Latitude:  37.7749,
				Longitude: -122.4194,
			},
			{
				ID:        "2",
				Name:      "Test Lighthouse 2",
				Country:   "USA",
				State:     "New York",
				Latitude:  40.7128,
				Longitude: -74.0060,
			},
			{
				ID:        "3",
				Name:      "Test Lighthouse 3",
				Country:   "Canada",
				State:     "British Columbia",
				Latitude:  49.2827,
				Longitude: -123.1207,
			},
		},
	}
}

// GetLighthouses returns all lighthouses
func (m *MockDB) GetLighthouses() ([]models.Lighthouse, error) {
	return m.lighthouses, nil
}

// GetLighthousesByCountry returns lighthouses filtered by country
func (m *MockDB) GetLighthousesByCountry(country string) ([]models.Lighthouse, error) {
	var filtered []models.Lighthouse
	for _, l := range m.lighthouses {
		if l.Country == country {
			filtered = append(filtered, l)
		}
	}
	return filtered, nil
}

// GetLighthousesByState returns lighthouses filtered by state
func (m *MockDB) GetLighthousesByState(state string) ([]models.Lighthouse, error) {
	var filtered []models.Lighthouse
	for _, l := range m.lighthouses {
		if l.State == state {
			filtered = append(filtered, l)
		}
	}
	return filtered, nil
}
