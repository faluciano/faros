package db

import (
	"lighthouse-backend/schemas"
	"log"
)

func GetLighthouses() ([]schemas.Lighthouse, error) {
	lighthouses := []schemas.Lighthouse{}
	query, err := DB.Query("SELECT country, state, lighthouse, latitude, longitude, image FROM lighthouses")
	if err != nil {
		log.Printf("Failed to query lighthouses: %v", err)
		return nil, err
	}
	defer query.Close()

	for query.Next() {
		var lighthouse schemas.Lighthouse
		err := query.Scan(&lighthouse.Country, &lighthouse.State, &lighthouse.Name, &lighthouse.Latitude, &lighthouse.Longitude, &lighthouse.Image)
		if err != nil {
			log.Printf("Failed to scan lighthouse: %v", err)
			return nil, err
		}
		lighthouses = append(lighthouses, lighthouse)
	}

	return lighthouses, nil
}

func GetLighthousesByCountry(country string) ([]schemas.Lighthouse, error) {
	lighthouses := []schemas.Lighthouse{}
	query, err := DB.Query("SELECT country, state, lighthouse, latitude, longitude, image FROM lighthouses WHERE country = ?", country)
	if err != nil {
		log.Printf("Failed to query lighthouses by country: %v", err)
		return nil, err
	}
	defer query.Close()

	for query.Next() {
		var lighthouse schemas.Lighthouse
		err := query.Scan(&lighthouse.Country, &lighthouse.State, &lighthouse.Name, &lighthouse.Latitude, &lighthouse.Longitude, &lighthouse.Image)
		if err != nil {
			log.Printf("Failed to scan lighthouse: %v", err)
			return nil, err
		}
		lighthouses = append(lighthouses, lighthouse)
	}

	return lighthouses, nil
}

func GetLighthousesByState(state string) ([]schemas.Lighthouse, error) {
	lighthouses := []schemas.Lighthouse{}
	query, err := DB.Query("SELECT country, state, lighthouse, latitude, longitude, image FROM lighthouses WHERE state = ?", state)
	if err != nil {
		log.Printf("Failed to query lighthouses by state: %v", err)
		return nil, err
	}
	defer query.Close()

	for query.Next() {
		var lighthouse schemas.Lighthouse
		err := query.Scan(&lighthouse.Country, &lighthouse.State, &lighthouse.Name, &lighthouse.Latitude, &lighthouse.Longitude, &lighthouse.Image)
		if err != nil {
			log.Printf("Failed to scan lighthouse: %v", err)
			return nil, err
		}
		lighthouses = append(lighthouses, lighthouse)
	}

	return lighthouses, nil
}
