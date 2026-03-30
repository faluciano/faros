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
	rows, err := d.db.Query(`SELECT id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description FROM lighthouses`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lighthouses := make([]schemas.Lighthouse, 0)
	for rows.Next() {
		var l schemas.Lighthouse
		if err := rows.Scan(&l.ID, &l.Name, &l.Country, &l.State, &l.Latitude, &l.Longitude, &l.Image, &l.Height, &l.YearBuilt, &l.LightCharacteristics, &l.Description); err != nil {
			log.Printf("Error scanning lighthouse row: %v", err)
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	if err := rows.Err(); err != nil {
		log.Printf("Error during rows iteration: %v", err)
		return nil, err
	}
	log.Printf("Successfully retrieved %d lighthouses", len(lighthouses))
	return lighthouses, nil
}

// GetLighthousesByCountry returns lighthouses filtered by country
func (d *DBImpl) GetLighthousesByCountry(country string) ([]schemas.Lighthouse, error) {
	rows, err := d.db.Query(`SELECT id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description FROM lighthouses WHERE country = ?`, country)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lighthouses := make([]schemas.Lighthouse, 0)
	for rows.Next() {
		var l schemas.Lighthouse
		if err := rows.Scan(&l.ID, &l.Name, &l.Country, &l.State, &l.Latitude, &l.Longitude, &l.Image, &l.Height, &l.YearBuilt, &l.LightCharacteristics, &l.Description); err != nil {
			log.Printf("Error scanning lighthouse row: %v", err)
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	if err := rows.Err(); err != nil {
		log.Printf("Error during rows iteration: %v", err)
		return nil, err
	}
	log.Printf("Successfully retrieved %d lighthouses", len(lighthouses))
	return lighthouses, nil
}

// GetLighthousesByState returns lighthouses filtered by state
func (d *DBImpl) GetLighthousesByState(state string) ([]schemas.Lighthouse, error) {
	rows, err := d.db.Query(`SELECT id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description FROM lighthouses WHERE state = ?`, state)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lighthouses := make([]schemas.Lighthouse, 0)
	for rows.Next() {
		var l schemas.Lighthouse
		if err := rows.Scan(&l.ID, &l.Name, &l.Country, &l.State, &l.Latitude, &l.Longitude, &l.Image, &l.Height, &l.YearBuilt, &l.LightCharacteristics, &l.Description); err != nil {
			log.Printf("Error scanning lighthouse row: %v", err)
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	if err := rows.Err(); err != nil {
		log.Printf("Error during rows iteration: %v", err)
		return nil, err
	}
	log.Printf("Successfully retrieved %d lighthouses", len(lighthouses))
	return lighthouses, nil
}

// GetLighthousesByCountryAndState returns lighthouses filtered by both country and state
func (d *DBImpl) GetLighthousesByCountryAndState(country string, state string) ([]schemas.Lighthouse, error) {
	rows, err := d.db.Query(`SELECT id, name, country, state, latitude, longitude, image, height, year_built, light_characteristics, description FROM lighthouses WHERE country = ? AND state = ?`, country, state)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lighthouses := make([]schemas.Lighthouse, 0)
	for rows.Next() {
		var l schemas.Lighthouse
		if err := rows.Scan(&l.ID, &l.Name, &l.Country, &l.State, &l.Latitude, &l.Longitude, &l.Image, &l.Height, &l.YearBuilt, &l.LightCharacteristics, &l.Description); err != nil {
			log.Printf("Error scanning lighthouse row: %v", err)
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	if err := rows.Err(); err != nil {
		log.Printf("Error during rows iteration: %v", err)
		return nil, err
	}
	log.Printf("Successfully retrieved %d lighthouses", len(lighthouses))
	return lighthouses, nil
}

func (d *DBImpl) CreateUser(user schemas.User) error {
	query := `
	INSERT INTO users (id, first_name, last_name, email)
	VALUES (?, ?, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		first_name = excluded.first_name,
		last_name = excluded.last_name,
		email = excluded.email
	`

	_, err := d.db.Exec(query, user.ID, user.FirstName, user.LastName, user.Email)
	return err
}

func (d *DBImpl) GetUser(id string) (*schemas.User, error) {
	var user schemas.User
	err := d.db.QueryRow("SELECT id, first_name, last_name, email FROM users WHERE id = ?", id).
		Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (d *DBImpl) GetUserByEmail(email string) (*schemas.User, error) {
	var user schemas.User
	err := d.db.QueryRow(
		"SELECT id, first_name, last_name, email, password_hash FROM users WHERE email = ?",
		email,
	).Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.PasswordHash)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (d *DBImpl) CreateUserWithPassword(user schemas.User) error {
	query := `
	INSERT INTO users (id, first_name, last_name, email, password_hash)
	VALUES (?, ?, ?, ?, ?)
	`
	_, err := d.db.Exec(query, user.ID, user.FirstName, user.LastName, user.Email, user.PasswordHash)
	return err
}

func (d *DBImpl) GetUserVisitedLighthouses(id string) ([]schemas.Lighthouse, error) {
	query := `
	SELECT l.id, l.country, l.state, l.name, l.latitude, l.longitude, l.image, l.height, l.year_built, l.light_characteristics, l.description
	FROM user_visited_lighthouse uvl
	JOIN lighthouses l ON uvl.lighthouse_id = l.id
	WHERE uvl.user_id = ?
	`

	rows, err := d.db.Query(query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lighthouses := make([]schemas.Lighthouse, 0)
	for rows.Next() {
		var lighthouse schemas.Lighthouse
		if err := rows.Scan(&lighthouse.ID, &lighthouse.Country, &lighthouse.State, &lighthouse.Name, &lighthouse.Latitude, &lighthouse.Longitude, &lighthouse.Image, &lighthouse.Height, &lighthouse.YearBuilt, &lighthouse.LightCharacteristics, &lighthouse.Description); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, lighthouse)
	}

	return lighthouses, nil
}

func (d *DBImpl) GetUserWishlistLighthouses(id string) ([]schemas.Lighthouse, error) {
	query := `
	SELECT l.id, l.country, l.state, l.name, l.latitude, l.longitude, l.image
	FROM user_wishlist_lighthouse uwl
	JOIN lighthouses l ON uwl.lighthouse_id = l.id
	WHERE uwl.user_id = ?
	`

	rows, err := d.db.Query(query, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lighthouses := make([]schemas.Lighthouse, 0)
	for rows.Next() {
		var lighthouse schemas.Lighthouse
		if err := rows.Scan(&lighthouse.ID, &lighthouse.Country, &lighthouse.State, &lighthouse.Name, &lighthouse.Latitude, &lighthouse.Longitude, &lighthouse.Image); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, lighthouse)
	}

	return lighthouses, nil
}

func (d *DBImpl) AddToWishlist(userId string, lighthouseId string) error {
	query := `
	INSERT INTO user_wishlist_lighthouse (user_id, lighthouse_id)
	VALUES (?, ?)
	ON CONFLICT(user_id, lighthouse_id) DO NOTHING
	`

	_, err := d.db.Exec(query, userId, lighthouseId)
	return err
}

func (d *DBImpl) RemoveFromWishlist(userId string, lighthouseId string) error {
	query := `
	DELETE FROM user_wishlist_lighthouse
	WHERE user_id = ? AND lighthouse_id = ?
	`

	_, err := d.db.Exec(query, userId, lighthouseId)
	return err
}

func (d *DBImpl) MarkLighthouseAsVisited(userId string, lighthouseId string) error {
	query := `
	INSERT INTO user_visited_lighthouse (user_id, lighthouse_id)
	VALUES (?, ?)
	ON CONFLICT(user_id, lighthouse_id) DO NOTHING
	`

	_, err := d.db.Exec(query, userId, lighthouseId)
	return err
}

func (d *DBImpl) UnmarkLighthouseAsVisited(userId string, lighthouseId string) error {
	query := `
	DELETE FROM user_visited_lighthouse
	WHERE user_id = ? AND lighthouse_id = ?
	`

	_, err := d.db.Exec(query, userId, lighthouseId)
	return err
}

func (d *DBImpl) GetFriendVisitedLighthouses(userId string, friendId string) ([]schemas.Lighthouse, error) {
	query := `
	SELECT l.id, l.country, l.state, l.name, l.latitude, l.longitude, l.image, l.height, l.year_built, l.light_characteristics, l.description
	FROM user_visited_lighthouse uvl
	JOIN lighthouses l ON uvl.lighthouse_id = l.id
	-- This JOIN confirms friendship exists and is accepted
	JOIN friendships f ON (
		(f.user_id = ? AND f.friend_id = uvl.user_id) OR
		(f.user_id = uvl.user_id AND f.friend_id = ?)
	)
	WHERE uvl.user_id = ? AND f.status = 'accepted'
	`

	rows, err := d.db.Query(query, userId, userId, friendId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lighthouses := make([]schemas.Lighthouse, 0)
	for rows.Next() {
		var lighthouse schemas.Lighthouse
		if err := rows.Scan(&lighthouse.ID, &lighthouse.Country, &lighthouse.State, &lighthouse.Name, &lighthouse.Latitude, &lighthouse.Longitude, &lighthouse.Image, &lighthouse.Height, &lighthouse.YearBuilt, &lighthouse.LightCharacteristics, &lighthouse.Description); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, lighthouse)
	}

	return lighthouses, nil
}

func (d *DBImpl) SearchUsers(query string, currentUserId string) ([]schemas.User, error) {
	// First, verify the current user exists
	var currentUser schemas.User
	err := d.db.QueryRow("SELECT id, first_name, last_name, email FROM users WHERE id = ?", currentUserId).
		Scan(&currentUser.ID, &currentUser.FirstName, &currentUser.LastName, &currentUser.Email)
	if err != nil {
		return nil, err
	}

	// Simplified search query
	searchQuery := `
	SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
	FROM users u
	WHERE u.id != ?
	AND (
		LOWER(u.first_name) LIKE LOWER(?)
		OR LOWER(u.last_name) LIKE LOWER(?)
		OR LOWER(u.email) LIKE LOWER(?)
	)
	AND NOT EXISTS (
		SELECT 1 FROM friendships f
		WHERE (
			(f.user_id = ? AND f.friend_id = u.id)
			OR (f.friend_id = ? AND f.user_id = u.id)
		)
		AND f.status = 'accepted'
	)
	ORDER BY
		CASE
			WHEN LOWER(u.first_name) = LOWER(?) THEN 0
			WHEN LOWER(u.last_name) = LOWER(?) THEN 1
			WHEN LOWER(u.email) = LOWER(?) THEN 2
			ELSE 3
		END,
		u.first_name ASC
	LIMIT 10
	`

	likeQuery := "%" + query + "%"
	exactQuery := query
	args := []interface{}{
		currentUserId,
		likeQuery, likeQuery, likeQuery, // For LIKE clauses
		currentUserId, currentUserId, // For friendship check
		exactQuery, exactQuery, exactQuery, // For ORDER BY exact matches
	}

	rows, err := d.db.Query(searchQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]schemas.User, 0)
	for rows.Next() {
		var user schemas.User
		err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (d *DBImpl) SendFriendRequest(userId, friendId string) error {
	query := `
	INSERT INTO friendships (user_id, friend_id, status)
	VALUES (?, ?, 'pending')
	ON CONFLICT(user_id, friend_id) DO UPDATE SET
		status = CASE
			WHEN status = 'pending' THEN 'pending'
			ELSE status
		END,
		updated_at = CURRENT_TIMESTAMP
	`
	_, err := d.db.Exec(query, userId, friendId)
	return err
}

func (d *DBImpl) AcceptFriendRequest(userId, friendId string) error {
	query := `
	UPDATE friendships
	SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
	WHERE user_id = ? AND friend_id = ? AND status = 'pending'
	`
	_, err := d.db.Exec(query, friendId, userId)
	return err
}

func (d *DBImpl) RemoveFriend(userId, friendId string) error {
	query := `
	DELETE FROM friendships
	WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
	`
	_, err := d.db.Exec(query, userId, friendId, friendId, userId)
	return err
}

func (d *DBImpl) GetFriends(userId string) ([]schemas.User, error) {
	query := `
	SELECT u.id, u.first_name, u.last_name, u.email
	FROM users u
	JOIN friendships f ON (u.id = f.friend_id OR u.id = f.user_id)
	WHERE ((f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id))
	AND f.status = 'accepted'
	`

	rows, err := d.db.Query(query, userId, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	friends := make([]schemas.User, 0)
	for rows.Next() {
		var friend schemas.User
		err := rows.Scan(&friend.ID, &friend.FirstName, &friend.LastName, &friend.Email)
		if err != nil {
			return nil, err
		}
		friends = append(friends, friend)
	}

	return friends, nil
}

func (d *DBImpl) GetPendingFriendRequests(userId string) ([]schemas.User, error) {
	query := `
	SELECT u.id, u.first_name, u.last_name, u.email
	FROM users u
	JOIN friendships f ON u.id = f.user_id
	WHERE f.friend_id = ? AND f.status = 'pending'
	`

	rows, err := d.db.Query(query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := make([]schemas.User, 0)
	for rows.Next() {
		var request schemas.User
		err := rows.Scan(&request.ID, &request.FirstName, &request.LastName, &request.Email)
		if err != nil {
			return nil, err
		}
		requests = append(requests, request)
	}

	return requests, nil
}

func (d *DBImpl) GetOutgoingFriendRequests(userId string) ([]schemas.User, error) {
	query := `
	SELECT u.id, u.first_name, u.last_name, u.email
	FROM users u
	JOIN friendships f ON u.id = f.friend_id
	WHERE f.user_id = ? AND f.status = 'pending'
	`

	rows, err := d.db.Query(query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := make([]schemas.User, 0)
	for rows.Next() {
		var request schemas.User
		err := rows.Scan(&request.ID, &request.FirstName, &request.LastName, &request.Email)
		if err != nil {
			return nil, err
		}
		requests = append(requests, request)
	}

	return requests, nil
}
