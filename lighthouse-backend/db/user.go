package db

import (
	"database/sql"
	"lighthouse-backend/schemas"
)

func CreateUser(user schemas.User) error {
	query := `
	INSERT INTO users (id, first_name, last_name, email)
	VALUES (?, ?, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		first_name = excluded.first_name,
		last_name = excluded.last_name,
		email = excluded.email
	`

	_, err := DB.Exec(query, user.ID, user.FirstName, user.LastName, user.Email)
	return err
}

func GetUser(id string) (*schemas.User, error) {
	var user schemas.User
	err := DB.QueryRow("SELECT id, first_name, last_name, email FROM users WHERE id = ?", id).
		Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}
