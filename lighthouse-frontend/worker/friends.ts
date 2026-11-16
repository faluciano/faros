import { Hono } from "hono";
import { ApiError, MAX_ID_LENGTH, readObject, requireString, type AppContext, type AppEnv } from "./http.ts";
import { requireAuth } from "./session.ts";
import { USER_COLUMNS, type User } from "./users.ts";

const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 100;

const friendId = async (c: AppContext): Promise<string> =>
	requireString(await readObject(c), "friendId", MAX_ID_LENGTH);

const listUsers = async (c: AppContext, clause: string, ...values: unknown[]): Promise<User[]> =>
	(await c.env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users u ${clause}`).bind(...values).all<User>()).results;

// Addresses are only shown to people the user has a relationship with, so
// search and outgoing requests cannot be used to collect them.
const withoutEmails = (users: User[]): User[] =>
	users.map(({ id, first_name, last_name }) => ({ id, first_name, last_name }));

// Makes user input literal inside a LIKE pattern that uses \ as its escape.
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (character) => `\\${character}`);

export const friends = new Hono<AppEnv>();
friends.use("/user/*", requireAuth);
friends.use("/users/*", requireAuth);

// Names match by substring; an email only matches the exact address.
friends.get("/users/search", async (c) => {
	const query = (c.req.query("query") ?? "").trim();
	if (query.length < MIN_SEARCH_LENGTH) {
		throw new ApiError(400, `search query must be at least ${MIN_SEARCH_LENGTH} characters`);
	}
	if (query.length > MAX_SEARCH_LENGTH) {
		throw new ApiError(400, `search query must be ${MAX_SEARCH_LENGTH} characters or fewer`);
	}

	const users = await listUsers(c, `
		WHERE u.id != ?1
		AND (
			LOWER(u.first_name) LIKE LOWER(?2) ESCAPE '\\'
			OR LOWER(u.last_name) LIKE LOWER(?2) ESCAPE '\\'
			OR LOWER(u.first_name || ' ' || u.last_name) LIKE LOWER(?2) ESCAPE '\\'
			OR LOWER(u.email) = LOWER(?3)
		)
		AND NOT EXISTS (
			SELECT 1 FROM friendships f
			WHERE (f.user_id = ?1 AND f.friend_id = u.id) OR (f.friend_id = ?1 AND f.user_id = u.id)
		)
		ORDER BY
			CASE
				WHEN LOWER(u.email) = LOWER(?3) THEN 0
				WHEN LOWER(u.first_name) = LOWER(?3) THEN 1
				WHEN LOWER(u.last_name) = LOWER(?3) THEN 2
				ELSE 3
			END,
			u.first_name
		LIMIT 10
	`, c.get("userId"), `%${escapeLike(query)}%`, query);
	return c.json(withoutEmails(users));
});

friends.get("/user/friends", async (c) =>
	c.json(await listUsers(c, `
		JOIN friendships f ON (f.user_id = ?1 AND f.friend_id = u.id) OR (f.friend_id = ?1 AND f.user_id = u.id)
		WHERE f.status = 'accepted'
	`, c.get("userId"))));

friends.delete("/user/friends", async (c) => {
	await c.env.DB
		.prepare("DELETE FROM friendships WHERE (user_id = ?1 AND friend_id = ?2) OR (user_id = ?2 AND friend_id = ?1)")
		.bind(c.get("userId"), await friendId(c))
		.run();
	return c.json({ success: true });
});

// Requests other people have sent to the current user.
friends.get("/user/friends/requests", async (c) =>
	c.json(await listUsers(c, `
		JOIN friendships f ON u.id = f.user_id
		WHERE f.friend_id = ? AND f.status = 'pending'
	`, c.get("userId"))));

friends.get("/user/friends/requests/outgoing", async (c) =>
	c.json(withoutEmails(await listUsers(c, `
		JOIN friendships f ON u.id = f.friend_id
		WHERE f.user_id = ? AND f.status = 'pending'
	`, c.get("userId")))));

friends.post("/user/friends/requests", async (c) => {
	const recipient = await friendId(c);
	if (recipient === c.get("userId")) {
		throw new ApiError(400, "cannot send a friend request to yourself");
	}
	const exists = await c.env.DB.prepare("SELECT 1 FROM users WHERE id = ?").bind(recipient).first();
	if (!exists) {
		throw new ApiError(404, "user not found");
	}

	// The unique pair index makes this a no-op when a request or friendship
	// already exists in either direction.
	const result = await c.env.DB
		.prepare("INSERT OR IGNORE INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'pending')")
		.bind(c.get("userId"), recipient)
		.run();
	if (result.meta.changes !== 1) {
		throw new ApiError(409, "friendship or friend request already exists");
	}
	return c.json({ success: true });
});

// Only the recipient of a pending request can accept it.
friends.post("/user/friends/requests/accept", async (c) => {
	const result = await c.env.DB
		.prepare(`
			UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ? AND friend_id = ? AND status = 'pending'
		`)
		.bind(await friendId(c), c.get("userId"))
		.run();
	if (result.meta.changes !== 1) {
		throw new ApiError(404, "friend request not found");
	}
	return c.json({ success: true });
});
