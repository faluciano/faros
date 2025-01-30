package db

import (
	"lighthouse-backend/schemas"
)

func SearchUsers(query string, currentUserId string) ([]schemas.User, error) {
	// First, verify the current user exists
	var currentUser schemas.User
	err := DB.QueryRow("SELECT id, first_name, last_name, email FROM users WHERE id = ?", currentUserId).
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

	rows, err := DB.Query(searchQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []schemas.User
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

func SendFriendRequest(userId, friendId string) error {
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
	_, err := DB.Exec(query, userId, friendId)
	return err
}

func AcceptFriendRequest(userId, friendId string) error {
	query := `
	UPDATE friendships
	SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
	WHERE user_id = ? AND friend_id = ? AND status = 'pending'
	`
	_, err := DB.Exec(query, friendId, userId)
	return err
}

func RemoveFriend(userId, friendId string) error {
	query := `
	DELETE FROM friendships
	WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
	`
	_, err := DB.Exec(query, userId, friendId, friendId, userId)
	return err
}

func GetFriends(userId string) ([]schemas.User, error) {
	query := `
	SELECT u.id, u.first_name, u.last_name, u.email
	FROM users u
	JOIN friendships f ON (u.id = f.friend_id OR u.id = f.user_id)
	WHERE ((f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id))
	AND f.status = 'accepted'
	`

	rows, err := DB.Query(query, userId, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var friends []schemas.User
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

func GetPendingFriendRequests(userId string) ([]schemas.User, error) {
	query := `
	SELECT u.id, u.first_name, u.last_name, u.email
	FROM users u
	JOIN friendships f ON u.id = f.user_id
	WHERE f.friend_id = ? AND f.status = 'pending'
	`

	rows, err := DB.Query(query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []schemas.User
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

func GetOutgoingFriendRequests(userId string) ([]schemas.User, error) {
	query := `
	SELECT u.id, u.first_name, u.last_name, u.email
	FROM users u
	JOIN friendships f ON u.id = f.friend_id
	WHERE f.user_id = ? AND f.status = 'pending'
	`

	rows, err := DB.Query(query, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []schemas.User
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
