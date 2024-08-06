package db

import (
	"log"
	"os"

	"lighthouse-backend/schemas"

	"github.com/joho/godotenv"
	supa "github.com/nedpals/supabase-go"
)

func GetLighthouses() ([]schemas.Lighthouse, error) {
	godotenv.Load()

	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_KEY")
	supabase := supa.CreateClient(SUPABASE_URL, SUPABASE_KEY)

	if supabase == nil {
		log.Fatal("Failed to create Supabase client")
		return nil, nil
	}
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
	godotenv.Load()

	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_KEY")
	supabase := supa.CreateClient(SUPABASE_URL, SUPABASE_KEY)

	if supabase == nil {
		log.Fatal("Failed to create Supabase client")
		return nil, nil
	}
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
	godotenv.Load()

	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_KEY")
	supabase := supa.CreateClient(SUPABASE_URL, SUPABASE_KEY)

	if supabase == nil {
		log.Fatal("Failed to create Supabase client")
		return nil, nil
	}
	lighthouses := []schemas.Lighthouse{}
	query := supabase.DB.From("lighthouses").Select("*").Eq("state", state)
	err := query.Execute(&lighthouses)

	if err != nil {
		log.Fatal("Request failed:", err)
		return nil, err
	}

	return lighthouses, nil
}
