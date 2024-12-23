package db

import (
	"log"
	"os"
	"sync"

	"lighthouse-backend/schemas"

	supa "github.com/nedpals/supabase-go"
)

var (
	supabase     *supa.Client
	initSupabase sync.Once
)

func initializeSupabase() {
	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_KEY")
	supabase = supa.CreateClient(SUPABASE_URL, SUPABASE_KEY)

	if supabase == nil {
		log.Fatal("Failed to create Supabase client")
	}
}

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
