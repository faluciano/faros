package db

import (
	"log"

	"lighthouse-backend/schemas"
)

func GetLighthouses() ([]schemas.Lighthouse, error) {
	initSupabase.Do(initializeSupabase)

	lighthouses := []schemas.Lighthouse{}
	query := supabase.DB.From("lighthouses").Select("*")
	err := query.Execute(&lighthouses)

	if err != nil {
		log.Fatal("Request failed:", err)
		return nil, err
	}

	return lighthouses, nil
}

func GetLighthousesByCountry(country string) ([]schemas.Lighthouse, error) {
	initSupabase.Do(initializeSupabase)

	lighthouses := []schemas.Lighthouse{}
	query := supabase.DB.From("lighthouses").Select("*").Eq("country", country)
	err := query.Execute(&lighthouses)

	if err != nil {
		log.Fatal("Request failed:", err)
		return nil, err
	}

	return lighthouses, nil
}

func GetLighthousesByState(state string) ([]schemas.Lighthouse, error) {
	initSupabase.Do(initializeSupabase)

	lighthouses := []schemas.Lighthouse{}
	query := supabase.DB.From("lighthouses").Select("*").Eq("state", state)
	err := query.Execute(&lighthouses)

	if err != nil {
		log.Fatal("Request failed:", err)
		return nil, err
	}

	return lighthouses, nil
}
