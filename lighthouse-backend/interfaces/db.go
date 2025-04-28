package interfaces

import "lighthouse-backend/models"

// DBInterface defines the database operations we need
type DBInterface interface {
	GetLighthouses() ([]models.Lighthouse, error)
	GetLighthousesByCountry(country string) ([]models.Lighthouse, error)
	GetLighthousesByState(state string) ([]models.Lighthouse, error)
}
