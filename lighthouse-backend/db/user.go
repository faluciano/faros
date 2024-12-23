package db

import (
	"log"

	"lighthouse-backend/schemas"
)

func GetUser(id string) (*schemas.User, error) {
	initSupabase.Do(initializeSupabase)

	user := &schemas.User{}
	query := supabase.DB.From("users").Select("*").Single().Eq("id", id)
	err := query.Execute(&user)

	if err != nil {
		log.Fatal("Request failed:", err)
		return nil, err
	}

	return user, nil
}
