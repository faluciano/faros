-- User data only. Lighthouses are static files served with the frontend, so
-- lighthouse_id columns are plain IDs with no table behind them.

CREATE TABLE users (
	id TEXT PRIMARY KEY,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	-- WebAuthn user handle (base64url), random and unrelated to id or email.
	handle TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE credentials (
	-- Credential ID as base64url.
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	-- COSE public key as base64url.
	public_key TEXT NOT NULL,
	counter INTEGER NOT NULL DEFAULT 0,
	-- JSON array of authenticator transports, or NULL.
	transports TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_used_at TEXT
);
CREATE INDEX idx_credentials_user_id ON credentials(user_id);

-- One row per passkey ceremony in progress, deleted when it is finished.
CREATE TABLE passkey_sessions (
	id TEXT PRIMARY KEY,
	ceremony TEXT NOT NULL CHECK (ceremony IN ('registration', 'login')),
	challenge TEXT NOT NULL,
	-- JSON profile of the user being registered; NULL for sign-in.
	pending_user TEXT,
	-- Unix seconds.
	expires_at INTEGER NOT NULL
);
CREATE INDEX idx_passkey_sessions_expires_at ON passkey_sessions(expires_at);

CREATE TABLE visited (
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	lighthouse_id TEXT NOT NULL,
	visited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, lighthouse_id)
);

CREATE TABLE wishlist (
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	lighthouse_id TEXT NOT NULL,
	added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, lighthouse_id)
);

-- user_id sent the request to friend_id.
CREATE TABLE friendships (
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, friend_id),
	CHECK (user_id != friend_id)
);
CREATE INDEX idx_friendships_friend_id_status ON friendships(friend_id, status);
-- At most one row per pair, whichever direction the request went.
CREATE UNIQUE INDEX idx_friendships_unique_pair ON friendships (
	MIN(user_id, friend_id),
	MAX(user_id, friend_id)
);
