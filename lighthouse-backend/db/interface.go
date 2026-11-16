package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"lighthouse-backend/interfaces"
	"lighthouse-backend/schemas"
	"strings"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
)

// DBImpl implements interfaces.DBInterface using a real database connection
type DBImpl struct {
	db *sql.DB
}

// NewDB creates a new DBImpl instance
func NewDB(db *sql.DB) interfaces.DBInterface {
	return &DBImpl{db: db}
}

// lighthouseSelect is the single column list for full lighthouse rows; it
// must stay in step with scanLighthouse.
const lighthouseSelect = `SELECT l.id, l.name, l.country, l.state, l.latitude, l.longitude, l.image, l.height, l.year_built, l.light_characteristics, l.description, l.source, l.image_author, l.image_license, l.image_url FROM lighthouses l`

type rowScanner interface {
	Scan(dest ...any) error
}

func scanLighthouse(row rowScanner) (schemas.Lighthouse, error) {
	var l schemas.Lighthouse
	err := row.Scan(&l.ID, &l.Name, &l.Country, &l.State, &l.Latitude, &l.Longitude, &l.Image, &l.Height, &l.YearBuilt, &l.LightCharacteristics, &l.Description, &l.Source, &l.ImageAuthor, &l.ImageLicense, &l.ImageURL)
	return l, err
}

// queryLighthouses runs lighthouseSelect followed by the given clause.
func (d *DBImpl) queryLighthouses(clause string, args ...any) ([]schemas.Lighthouse, error) {
	rows, err := d.db.Query(lighthouseSelect+" "+clause, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lighthouses := make([]schemas.Lighthouse, 0)
	for rows.Next() {
		l, err := scanLighthouse(rows)
		if err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return lighthouses, nil
}

const userSelect = `SELECT u.id, u.first_name, u.last_name, u.email FROM users u`

// queryUsers runs userSelect followed by the given clause.
func (d *DBImpl) queryUsers(clause string, args ...any) ([]schemas.User, error) {
	rows, err := d.db.Query(userSelect+" "+clause, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]schemas.User, 0)
	for rows.Next() {
		var user schemas.User
		if err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

// GetLighthouses returns all lighthouses
func (d *DBImpl) GetLighthouses() ([]schemas.Lighthouse, error) {
	return d.queryLighthouses("")
}

// GetLighthouseByID returns a single lighthouse by its ID
func (d *DBImpl) GetLighthouseByID(id string) (*schemas.Lighthouse, error) {
	l, err := scanLighthouse(d.db.QueryRow(lighthouseSelect+" WHERE l.id = ?", id))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &l, nil
}

// GetLighthousesSummary returns lightweight lighthouses for map rendering
func (d *DBImpl) GetLighthousesSummary() ([]schemas.LighthouseSummary, error) {
	rows, err := d.db.Query(`SELECT id, name, latitude, longitude, image, state, country FROM lighthouses`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lighthouses := make([]schemas.LighthouseSummary, 0)
	for rows.Next() {
		var l schemas.LighthouseSummary
		if err := rows.Scan(&l.ID, &l.Name, &l.Latitude, &l.Longitude, &l.Image, &l.State, &l.Country); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return lighthouses, nil
}

func (d *DBImpl) GetLighthouseMapPoints() ([]schemas.LighthouseMapPoint, error) {
	rows, err := d.db.Query(`SELECT id, latitude, longitude FROM lighthouses`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	points := make([]schemas.LighthouseMapPoint, 0)
	for rows.Next() {
		var point schemas.LighthouseMapPoint
		if err := rows.Scan(&point.ID, &point.Latitude, &point.Longitude); err != nil {
			return nil, err
		}
		points = append(points, point)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return points, nil
}

// GetLighthousesByCountry returns lighthouses filtered by country
func (d *DBImpl) GetLighthousesByCountry(country string) ([]schemas.Lighthouse, error) {
	return d.queryLighthouses("WHERE l.country = ?", country)
}

// GetLighthousesByState returns lighthouses filtered by state
func (d *DBImpl) GetLighthousesByState(state string) ([]schemas.Lighthouse, error) {
	return d.queryLighthouses("WHERE l.state = ?", state)
}

// GetLighthousesByCountryAndState returns lighthouses filtered by both country and state
func (d *DBImpl) GetLighthousesByCountryAndState(country string, state string) ([]schemas.Lighthouse, error) {
	return d.queryLighthouses("WHERE l.country = ? AND l.state = ?", country, state)
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
		"SELECT id, first_name, last_name, email FROM users WHERE email = ?",
		email,
	).Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (d *DBImpl) SavePasskeySession(ctx context.Context, session schemas.PasskeySession) error {
	if session.Data.Expires.IsZero() {
		return fmt.Errorf("passkey session expiry must be set")
	}

	sessionData, err := json.Marshal(session.Data)
	if err != nil {
		return fmt.Errorf("marshal passkey session: %w", err)
	}

	if _, err := d.db.ExecContext(
		ctx,
		"DELETE FROM webauthn_sessions WHERE expires_at <= ?",
		time.Now().Unix(),
	); err != nil {
		return fmt.Errorf("remove expired passkey sessions: %w", err)
	}

	_, err = d.db.ExecContext(ctx, `
		INSERT INTO webauthn_sessions (
			id, rp_id, ceremony, session_data, user_id, email, first_name, last_name, expires_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		session.ID,
		session.RPID,
		session.Ceremony,
		sessionData,
		session.User.ID,
		session.User.Email,
		session.User.FirstName,
		session.User.LastName,
		session.Data.Expires.Unix(),
	)
	if err != nil {
		return fmt.Errorf("save passkey session: %w", err)
	}
	return nil
}

func (d *DBImpl) ConsumePasskeySession(
	ctx context.Context,
	id string,
	ceremony string,
	rpID string,
) (*schemas.PasskeySession, error) {
	var (
		sessionData []byte
		session     schemas.PasskeySession
		expiresAt   int64
	)

	err := d.db.QueryRowContext(ctx, `
		DELETE FROM webauthn_sessions
		WHERE id = ? AND ceremony = ? AND rp_id = ?
		RETURNING session_data, user_id, email, first_name, last_name, expires_at
	`, id, ceremony, rpID).Scan(
		&sessionData,
		&session.User.ID,
		&session.User.Email,
		&session.User.FirstName,
		&session.User.LastName,
		&expiresAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, interfaces.ErrPasskeySessionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("consume passkey session: %w", err)
	}
	if expiresAt <= time.Now().Unix() {
		return nil, interfaces.ErrPasskeySessionExpired
	}
	if err := json.Unmarshal(sessionData, &session.Data); err != nil {
		return nil, fmt.Errorf("unmarshal passkey session: %w", err)
	}

	session.ID = id
	session.Ceremony = ceremony
	session.RPID = rpID
	return &session, nil
}

func (d *DBImpl) CreatePasskeyUser(
	ctx context.Context,
	user schemas.PasskeyUser,
	credential webauthn.Credential,
	rpID string,
) error {
	credentialJSON, err := json.Marshal(credential)
	if err != nil {
		return fmt.Errorf("marshal passkey credential: %w", err)
	}

	tx, err := d.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin passkey user transaction: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO users (id, first_name, last_name, email)
		VALUES (?, ?, ?, ?)
	`, user.ID, user.FirstName, user.LastName, user.Email); err != nil {
		if isUniqueConstraintError(err) {
			return fmt.Errorf("%w: %v", interfaces.ErrUserAlreadyExists, err)
		}
		return fmt.Errorf("create user: %w", err)
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO webauthn_users (rp_id, user_id, handle)
		VALUES (?, ?, ?)
	`, rpID, user.ID, user.Handle); err != nil {
		return fmt.Errorf("create passkey user: %w", err)
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO webauthn_credentials (rp_id, credential_id, user_id, credential_json)
		VALUES (?, ?, ?, ?)
	`, rpID, credential.ID, user.ID, credentialJSON); err != nil {
		if isUniqueConstraintError(err) {
			return fmt.Errorf("%w: %v", interfaces.ErrUserAlreadyExists, err)
		}
		return fmt.Errorf("create passkey credential: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit passkey user transaction: %w", err)
	}
	return nil
}

func (d *DBImpl) GetPasskeyUserByHandle(
	ctx context.Context,
	rpID string,
	handle []byte,
) (*schemas.PasskeyUser, error) {
	var user schemas.PasskeyUser
	err := d.db.QueryRowContext(ctx, `
		SELECT u.id, u.first_name, u.last_name, u.email, wu.handle
		FROM webauthn_users wu
		JOIN users u ON u.id = wu.user_id
		WHERE wu.rp_id = ? AND wu.handle = ?
	`, rpID, handle).Scan(
		&user.ID,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.Handle,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get passkey user: %w", err)
	}

	rows, err := d.db.QueryContext(ctx, `
		SELECT credential_json, version
		FROM webauthn_credentials
		WHERE rp_id = ? AND user_id = ?
	`, rpID, user.ID)
	if err != nil {
		return nil, fmt.Errorf("get passkey credentials: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var (
			credentialJSON []byte
			version        int64
		)
		if err := rows.Scan(&credentialJSON, &version); err != nil {
			return nil, fmt.Errorf("scan passkey credential: %w", err)
		}

		var credential webauthn.Credential
		if err := json.Unmarshal(credentialJSON, &credential); err != nil {
			return nil, fmt.Errorf("unmarshal passkey credential: %w", err)
		}
		user.Credentials = append(user.Credentials, credential)
		user.CredentialVersions = append(user.CredentialVersions, version)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate passkey credentials: %w", err)
	}

	return &user, nil
}

func (d *DBImpl) UpdatePasskeyCredential(
	ctx context.Context,
	rpID string,
	userID string,
	credential webauthn.Credential,
	expectedVersion int64,
) error {
	credentialJSON, err := json.Marshal(credential)
	if err != nil {
		return fmt.Errorf("marshal passkey credential: %w", err)
	}

	result, err := d.db.ExecContext(ctx, `
		UPDATE webauthn_credentials
		SET credential_json = ?, version = version + 1, last_used_at = CURRENT_TIMESTAMP
		WHERE rp_id = ? AND user_id = ? AND credential_id = ? AND version = ?
	`, credentialJSON, rpID, userID, credential.ID, expectedVersion)
	if err != nil {
		return fmt.Errorf("update passkey credential: %w", err)
	}

	updated, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("read updated passkey credential count: %w", err)
	}
	if updated != 1 {
		return interfaces.ErrPasskeyCredentialChanged
	}
	return nil
}

func isUniqueConstraintError(err error) bool {
	message := strings.ToLower(err.Error())
	return strings.Contains(message, "unique constraint")
}

func (d *DBImpl) GetUserVisitedLighthouses(id string) ([]schemas.Lighthouse, error) {
	return d.queryLighthouses(`
		JOIN user_visited_lighthouse uvl ON uvl.lighthouse_id = l.id
		WHERE uvl.user_id = ?
	`, id)
}

func (d *DBImpl) GetUserMapState(id string) (schemas.UserMapState, error) {
	state := schemas.UserMapState{
		VisitedIDs:  make([]string, 0),
		WishlistIDs: make([]string, 0),
	}

	rows, err := d.db.Query(`
		SELECT 'visited' AS list_type, lighthouse_id
		FROM user_visited_lighthouse
		WHERE user_id = ?
		UNION ALL
		SELECT 'wishlist' AS list_type, lighthouse_id
		FROM user_wishlist_lighthouse
		WHERE user_id = ?
	`, id, id)
	if err != nil {
		return state, err
	}
	defer rows.Close()

	for rows.Next() {
		var listType string
		var lighthouseID string
		if err := rows.Scan(&listType, &lighthouseID); err != nil {
			return state, err
		}
		if listType == "visited" {
			state.VisitedIDs = append(state.VisitedIDs, lighthouseID)
		} else {
			state.WishlistIDs = append(state.WishlistIDs, lighthouseID)
		}
	}
	if err := rows.Err(); err != nil {
		return state, err
	}
	return state, nil
}

func (d *DBImpl) GetUserWishlistLighthouses(id string) ([]schemas.Lighthouse, error) {
	return d.queryLighthouses(`
		JOIN user_wishlist_lighthouse uwl ON uwl.lighthouse_id = l.id
		WHERE uwl.user_id = ?
	`, id)
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
	// The friendships JOIN only matches an accepted friendship between the
	// caller and the friend, in either direction.
	return d.queryLighthouses(`
		JOIN user_visited_lighthouse uvl ON uvl.lighthouse_id = l.id
		JOIN friendships f ON (
			(f.user_id = ? AND f.friend_id = uvl.user_id) OR
			(f.user_id = uvl.user_id AND f.friend_id = ?)
		)
		WHERE uvl.user_id = ? AND f.status = 'accepted'
	`, userId, userId, friendId)
}

// SearchUsers matches names by substring and email only by exact address, so
// the search cannot be used to enumerate other users' email addresses.
func (d *DBImpl) SearchUsers(query string, currentUserId string) ([]schemas.User, error) {
	likeQuery := "%" + escapeLike(query) + "%"
	return d.queryUsers(`
		WHERE u.id != ?
		AND (
			LOWER(u.first_name) LIKE LOWER(?) ESCAPE '\'
			OR LOWER(u.last_name) LIKE LOWER(?) ESCAPE '\'
			OR LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER(?) ESCAPE '\'
			OR LOWER(u.email) = LOWER(?)
		)
		AND NOT EXISTS (
			SELECT 1 FROM friendships f
			WHERE (
				(f.user_id = ? AND f.friend_id = u.id)
				OR (f.friend_id = ? AND f.user_id = u.id)
			)
		)
		ORDER BY
			CASE
				WHEN LOWER(u.email) = LOWER(?) THEN 0
				WHEN LOWER(u.first_name) = LOWER(?) THEN 1
				WHEN LOWER(u.last_name) = LOWER(?) THEN 2
				ELSE 3
			END,
			u.first_name ASC
		LIMIT 10
	`,
		currentUserId,
		likeQuery, likeQuery, likeQuery, query,
		currentUserId, currentUserId,
		query, query, query,
	)
}

// escapeLike makes user input literal inside a LIKE pattern that uses
// backslash as its ESCAPE character.
func escapeLike(value string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(value)
}

func (d *DBImpl) SendFriendRequest(userId, friendId string) error {
	query := `
	INSERT INTO friendships (user_id, friend_id, status)
	VALUES (?, ?, 'pending')
	ON CONFLICT DO NOTHING
	`
	result, err := d.db.Exec(query, userId, friendId)
	if err != nil {
		return err
	}
	inserted, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if inserted != 1 {
		return interfaces.ErrFriendshipExists
	}
	return nil
}

func (d *DBImpl) AcceptFriendRequest(userId, friendId string) error {
	query := `
	UPDATE friendships
	SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
	WHERE user_id = ? AND friend_id = ? AND status = 'pending'
	`
	result, err := d.db.Exec(query, friendId, userId)
	if err != nil {
		return err
	}
	updated, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if updated != 1 {
		return interfaces.ErrFriendRequestNotFound
	}
	return nil
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
	return d.queryUsers(`
		JOIN friendships f ON (
			(f.user_id = ? AND f.friend_id = u.id) OR
			(f.friend_id = ? AND f.user_id = u.id)
		)
		WHERE f.status = 'accepted'
	`, userId, userId)
}

func (d *DBImpl) GetPendingFriendRequests(userId string) ([]schemas.User, error) {
	return d.queryUsers(`
		JOIN friendships f ON u.id = f.user_id
		WHERE f.friend_id = ? AND f.status = 'pending'
	`, userId)
}

func (d *DBImpl) GetOutgoingFriendRequests(userId string) ([]schemas.User, error) {
	return d.queryUsers(`
		JOIN friendships f ON u.id = f.friend_id
		WHERE f.user_id = ? AND f.status = 'pending'
	`, userId)
}
