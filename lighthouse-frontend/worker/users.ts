import { Hono } from "hono";
import { ApiError, MAX_ID_LENGTH, readObject, requireString, type AppContext, type AppEnv } from "./http.ts";
import { requireAuth } from "./session.ts";

export interface User {
	id: string;
	first_name: string;
	last_name: string;
	// Left out where the caller has no established relationship with the user.
	email?: string;
}

export const USER_COLUMNS = "u.id, u.first_name, u.last_name, u.email";

const currentUser = async (c: AppContext) => {
	const user = await c.env.DB
		.prepare(`SELECT ${USER_COLUMNS} FROM users u WHERE u.id = ?`)
		.bind(c.get("userId"))
		.first<User>();
	if (!user) {
		throw new ApiError(404, "user not found");
	}
	return c.json(user);
};

const lighthouseId = async (c: AppContext): Promise<string> =>
	requireString(await readObject(c), "lighthouseId", MAX_ID_LENGTH);

const saved = (c: AppContext, table: "visited" | "wishlist") => ({
	add: (id: string) =>
		c.env.DB.prepare(`INSERT OR IGNORE INTO ${table} (user_id, lighthouse_id) VALUES (?, ?)`).bind(c.get("userId"), id),
	remove: (id: string) =>
		c.env.DB.prepare(`DELETE FROM ${table} WHERE user_id = ? AND lighthouse_id = ?`).bind(c.get("userId"), id),
	list: () =>
		c.env.DB.prepare(`SELECT lighthouse_id FROM ${table} WHERE user_id = ?`).bind(c.get("userId")),
});

const ids = (result: D1Result<{ lighthouse_id: string }>): string[] =>
	result.results.map((row) => row.lighthouse_id);

export const users = new Hono<AppEnv>();
users.use("/auth/me", requireAuth);
users.use("/user", requireAuth);
users.use("/user/*", requireAuth);

users.get("/auth/me", currentUser);
users.get("/user", currentUser);

// The IDs the map needs to colour markers; details come from static files.
users.get("/user/map-state", async (c) => {
	const [visited, wishlist] = await c.env.DB.batch<{ lighthouse_id: string }>([
		saved(c, "visited").list(),
		saved(c, "wishlist").list(),
	]);
	return c.json({ visited_ids: ids(visited), wishlist_ids: ids(wishlist) });
});

users.post("/user/lighthouses", async (c) => {
	const id = await lighthouseId(c);
	// A visited lighthouse no longer belongs on the wishlist.
	await c.env.DB.batch([saved(c, "visited").add(id), saved(c, "wishlist").remove(id)]);
	return c.json({ success: true });
});

users.delete("/user/lighthouses", async (c) => {
	await saved(c, "visited").remove(await lighthouseId(c)).run();
	return c.json({ success: true });
});

users.post("/user/wishlist", async (c) => {
	await saved(c, "wishlist").add(await lighthouseId(c)).run();
	return c.json({ success: true });
});

users.delete("/user/wishlist", async (c) => {
	await saved(c, "wishlist").remove(await lighthouseId(c)).run();
	return c.json({ success: true });
});

// IDs a friend has visited. Returns nothing unless the friendship is accepted.
users.get("/user/friends/lighthouses", async (c) => {
	const friendId = (c.req.query("friendId") ?? "").trim();
	if (!friendId || friendId.length > MAX_ID_LENGTH) {
		throw new ApiError(400, "friendId is required");
	}
	const result = await c.env.DB
		.prepare(`
			SELECT v.lighthouse_id FROM visited v
			WHERE v.user_id = ?1 AND EXISTS (
				SELECT 1 FROM friendships f
				WHERE f.status = 'accepted' AND (
					(f.user_id = ?2 AND f.friend_id = ?1) OR
					(f.user_id = ?1 AND f.friend_id = ?2)
				)
			)
		`)
		.bind(friendId, c.get("userId"))
		.all<{ lighthouse_id: string }>();
	return c.json(ids(result));
});
