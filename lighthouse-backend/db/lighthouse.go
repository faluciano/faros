package db

import (
	"log"
	"os"

	"lighthouse-backend/schemas"

	"github.com/joho/godotenv"
	supa "github.com/nedpals/supabase-go"
)

func GetLighthouses() ([]schemas.Lighthouse, error) {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
		return nil, err
	}

	SUPABASE_URL := os.Getenv("SUPABASE_URL")
	SUPABASE_KEY := os.Getenv("SUPABASE_KEY")
	supabase := supa.CreateClient(SUPABASE_URL, SUPABASE_KEY)

	if supabase == nil {
		log.Fatal("Failed to create Supabase client")
		return nil, err
	}
	lighthouses := []schemas.Lighthouse{}
	query := supabase.DB.From("lighthouses").Select("*")
	err = query.Execute(&lighthouses)

	if err != nil {
		log.Fatal("Request failed:", err)
		return nil, err
	}

	return lighthouses, nil
}
