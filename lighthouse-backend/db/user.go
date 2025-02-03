package db

import (
	"database/sql"
	"fmt"
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

func GetUserVisitedLighthouses(id string) ([]schemas.Lighthouse, error) {
	query := `
	SELECT l.id, l.country, l.state, l.name, l.latitude, l.longitude, l.image
	FROM user_visited_lighthouse uvl
	JOIN lighthouses l ON uvl.lighthouse_id = l.id
	WHERE uvl.user_id = ?
	`

	rows, err := DB.Query(query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lighthouses []schemas.Lighthouse
	for rows.Next() {
		var lighthouse schemas.Lighthouse
		if err := rows.Scan(&lighthouse.ID, &lighthouse.Country, &lighthouse.State, &lighthouse.Name, &lighthouse.Latitude, &lighthouse.Longitude, &lighthouse.Image); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, lighthouse)
	}

	return lighthouses, nil
}

func GetUserWishlistLighthouses(id string) ([]schemas.Lighthouse, error) {
	query := `
	SELECT l.id, l.country, l.state, l.name, l.latitude, l.longitude, l.image
	FROM user_wishlist_lighthouse uwl
	JOIN lighthouses l ON uwl.lighthouse_id = l.id
	WHERE uwl.user_id = ?
	`

	rows, err := DB.Query(query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lighthouses []schemas.Lighthouse
	for rows.Next() {
		var lighthouse schemas.Lighthouse
		if err := rows.Scan(&lighthouse.ID, &lighthouse.Country, &lighthouse.State, &lighthouse.Name, &lighthouse.Latitude, &lighthouse.Longitude, &lighthouse.Image); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, lighthouse)
	}

	return lighthouses, nil
}

func AddToWishlist(userId string, lighthouseId string) error {
	query := `
	INSERT INTO user_wishlist_lighthouse (user_id, lighthouse_id)
	VALUES (?, ?)
	ON CONFLICT(user_id, lighthouse_id) DO NOTHING
	`

	_, err := DB.Exec(query, userId, lighthouseId)
	return err
}

func RemoveFromWishlist(userId string, lighthouseId string) error {
	query := `
	DELETE FROM user_wishlist_lighthouse
	WHERE user_id = ? AND lighthouse_id = ?
	`

	_, err := DB.Exec(query, userId, lighthouseId)
	return err
}

func MarkLighthouseAsVisited(userId string, lighthouseId string) error {
	query := `
	INSERT INTO user_visited_lighthouse (user_id, lighthouse_id)
	VALUES (?, ?)
	ON CONFLICT(user_id, lighthouse_id) DO NOTHING
	`

	_, err := DB.Exec(query, userId, lighthouseId)
	return err
}

func UnmarkLighthouseAsVisited(userId string, lighthouseId string) error {
	query := `
	DELETE FROM user_visited_lighthouse
	WHERE user_id = ? AND lighthouse_id = ?
	`

	_, err := DB.Exec(query, userId, lighthouseId)
	return err
}

func GetFriendVisitedLighthouses(userId string, friendId string) ([]schemas.Lighthouse, error) {
	// First verify they are friends
	var count int
	err := DB.QueryRow(`
		SELECT COUNT(*) FROM friendships 
		WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
		AND status = 'accepted'
	`, userId, friendId, friendId, userId).Scan(&count)

	if err != nil {
		return nil, err
	}

	if count == 0 {
		return nil, fmt.Errorf("not friends with user")
	}

	// Get friend's visited lighthouses
	query := `
	SELECT l.id, l.country, l.state, l.name, l.latitude, l.longitude, l.image
	FROM user_visited_lighthouse uvl
	JOIN lighthouses l ON uvl.lighthouse_id = l.id
	WHERE uvl.user_id = ?
	`

	rows, err := DB.Query(query, friendId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lighthouses []schemas.Lighthouse
	for rows.Next() {
		var lighthouse schemas.Lighthouse
		if err := rows.Scan(&lighthouse.ID, &lighthouse.Country, &lighthouse.State, &lighthouse.Name, &lighthouse.Latitude, &lighthouse.Longitude, &lighthouse.Image); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, lighthouse)
	}

	return lighthouses, nil
}
