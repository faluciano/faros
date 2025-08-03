package db

import (
	"database/sql"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
)

// DBImpl implements interfaces.DBInterface using a real database connection
type DBImpl struct {
	db *sql.DB
}

// NewDB creates a new DBImpl instance
func NewDB(db *sql.DB) interfaces.DBInterface {
	return &DBImpl{db: db}
}

// GetLighthouses returns all lighthouses
func (d *DBImpl) GetLighthouses() ([]schemas.Lighthouse, error) {
	rows, err := d.db.Query(`SELECT id, name, country, state, latitude, longitude, image FROM lighthouses`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lighthouses []schemas.Lighthouse
	for rows.Next() {
		var l schemas.Lighthouse
		if err := rows.Scan(&l.ID, &l.Name, &l.Country, &l.State, &l.Latitude, &l.Longitude, &l.Image); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	return lighthouses, nil
}

// GetLighthousesByCountry returns lighthouses filtered by country
func (d *DBImpl) GetLighthousesByCountry(country string) ([]schemas.Lighthouse, error) {
	rows, err := d.db.Query(`SELECT id, name, country, state, latitude, longitude, image FROM lighthouses WHERE country = ?`, country)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lighthouses []schemas.Lighthouse
	for rows.Next() {
		var l schemas.Lighthouse
		if err := rows.Scan(&l.ID, &l.Name, &l.Country, &l.State, &l.Latitude, &l.Longitude, &l.Image); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	return lighthouses, nil
}

// GetLighthousesByState returns lighthouses filtered by state
func (d *DBImpl) GetLighthousesByState(state string) ([]schemas.Lighthouse, error) {
	rows, err := d.db.Query(`SELECT id, name, country, state, latitude, longitude, image FROM lighthouses WHERE state = ?`, state)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lighthouses []schemas.Lighthouse
	for rows.Next() {
		var l schemas.Lighthouse
		if err := rows.Scan(&l.ID, &l.Name, &l.Country, &l.State, &l.Latitude, &l.Longitude, &l.Image); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	return lighthouses, nil
}

// GetLighthousesByCountryAndState returns lighthouses filtered by both country and state
func (d *DBImpl) GetLighthousesByCountryAndState(country string, state string) ([]schemas.Lighthouse, error) {
	rows, err := d.db.Query(`SELECT id, name, country, state, latitude, longitude, image FROM lighthouses WHERE country = ? AND state = ?`, country, state)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lighthouses []schemas.Lighthouse
	for rows.Next() {
		var l schemas.Lighthouse
		if err := rows.Scan(&l.ID, &l.Name, &l.Country, &l.State, &l.Latitude, &l.Longitude, &l.Image); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	return lighthouses, nil
}
