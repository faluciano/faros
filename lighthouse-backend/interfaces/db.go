package interfaces

import "lighthouse-backend/schemas"

// DBInterface defines the database operations we need
type DBInterface interface {
	GetLighthouses() ([]schemas.Lighthouse, error)
	GetLighthousesByCountry(country string) ([]schemas.Lighthouse, error)
	GetLighthousesByState(state string) ([]schemas.Lighthouse, error)
}
