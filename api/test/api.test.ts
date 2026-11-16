import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import app from "../src/index.ts";
import { TestPasskey } from "./authenticator.ts";
import { TestD1 } from "./d1.ts";

const ORIGIN = "https://faros.example";
const site = { rpID: "faros.example", origin: ORIGIN };

let env: Record<string, unknown>;
beforeEach(() => {
	env = {
		DB: new TestD1(),
		JWT_SECRET: "test-secret-that-is-at-least-32-characters",
		PASSKEY_RP_ID: site.rpID,
		ALLOWED_ORIGINS: ORIGIN,
	};
});

interface CallOptions {
	token?: string;
	body?: unknown;
	headers?: Record<string, string>;
}

const call = async (method: string, path: string, { token, body, headers = {} }: CallOptions = {}) => {
	const response = await app.request(path, {
		method,
		headers: {
			...(body === undefined ? {} : { "Content-Type": "application/json" }),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...headers,
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	}, env);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return { status: response.status, body: await response.json() as any, headers: response.headers };
};

const startRegistration = (email: string, first = "Ada", last = "Lovelace") =>
	call("POST", "/auth/passkey/register/options", { body: { email, first_name: first, last_name: last } });

const register = async (email: string, first = "Ada", last = "Lovelace", passkey = new TestPasskey(site)) => {
	const options = await startRegistration(email, first, last);
	assert.equal(options.status, 200);
	const finished = await call("POST", "/auth/passkey/register", {
		body: await passkey.register(options.body.public_key),
		headers: { "X-WebAuthn-Session": options.body.flow_id },
	});
	assert.equal(finished.status, 201);
	return { passkey, token: finished.body.token as string, user: finished.body.user as { id: string } };
};

const signIn = async (passkey: TestPasskey) => {
	const options = await call("POST", "/auth/passkey/login/options");
	return call("POST", "/auth/passkey/login", {
		body: await passkey.signIn(options.body.public_key),
		headers: { "X-WebAuthn-Session": options.body.flow_id },
	});
};

describe("passkeys", () => {
	it("registers a user and signs them in with the same passkey", async () => {
		const { passkey, token, user } = await register("Ada@Example.com");
		const me = await call("GET", "/auth/me", { token });
		assert.deepEqual(me.body, { id: user.id, first_name: "Ada", last_name: "Lovelace", email: "ada@example.com" });

		const first = await signIn(passkey);
		assert.equal(first.status, 200);
		assert.equal(first.body.user.id, user.id);
		assert.equal((await call("GET", "/user", { token: first.body.token })).status, 200);
		// The signature counter moves forward, so a second sign-in still works.
		assert.equal((await signIn(passkey)).status, 200);
	});

	it("rejects a second account for the same email", async () => {
		await register("ada@example.com");
		assert.equal((await startRegistration("ADA@example.com")).status, 409);
	});

	it("validates the registration profile", async () => {
		assert.equal((await startRegistration("not-an-email")).status, 400);
		assert.equal((await startRegistration("ada@example.com", "")).status, 400);
		assert.equal((await startRegistration("ada@example.com", "A".repeat(101))).status, 400);
	});

	it("uses each ceremony only once", async () => {
		const passkey = new TestPasskey(site);
		const options = await startRegistration("ada@example.com");
		const body = await passkey.register(options.body.public_key);
		const send = () => call("POST", "/auth/passkey/register", { body, headers: { "X-WebAuthn-Session": options.body.flow_id } });
		assert.equal((await send()).status, 201);
		assert.equal((await send()).status, 400);
	});

	it("rejects an expired ceremony", async () => {
		const passkey = new TestPasskey(site);
		const options = await startRegistration("ada@example.com");
		(env.DB as TestD1).exec("UPDATE passkey_sessions SET expires_at = 1");
		const finished = await call("POST", "/auth/passkey/register", {
			body: await passkey.register(options.body.public_key),
			headers: { "X-WebAuthn-Session": options.body.flow_id },
		});
		assert.equal(finished.status, 400);
	});

	it("rejects a passkey response made for another site", async () => {
		const elsewhere = new TestPasskey({ rpID: site.rpID, origin: "https://evil.example" });
		const options = await startRegistration("ada@example.com");
		const finished = await call("POST", "/auth/passkey/register", {
			body: await elsewhere.register(options.body.public_key),
			headers: { "X-WebAuthn-Session": options.body.flow_id },
		});
		assert.equal(finished.status, 400);
	});

	it("rejects sign-in with an unknown passkey or a replayed counter", async () => {
		const { passkey } = await register("ada@example.com");
		const stranger = new TestPasskey(site);
		await stranger.register({ challenge: "unused", user: { id: "unused" } });
		assert.equal((await signIn(stranger)).status, 401);

		assert.equal((await signIn(passkey)).status, 200);
		// Winding the stored counter forward makes the next response look cloned.
		(env.DB as TestD1).exec("UPDATE credentials SET counter = 100");
		assert.equal((await signIn(passkey)).status, 401);
	});
});

describe("sessions", () => {
	it("requires a valid token", async () => {
		assert.equal((await call("GET", "/user/map-state")).status, 401);
		assert.equal((await call("GET", "/user/map-state", { token: "nonsense" })).status, 401);

		const { token } = await register("ada@example.com");
		env.JWT_SECRET = "a-different-secret-of-sufficient-length-here";
		assert.equal((await call("GET", "/user/map-state", { token })).status, 401);
	});

	it("refuses to run without a real secret", async () => {
		const { token } = await register("ada@example.com");
		env.JWT_SECRET = "";
		assert.equal((await call("GET", "/user", { token })).status, 500);
	});
});

describe("visited and wishlist", () => {
	it("tracks saved lighthouses and moves visited ones off the wishlist", async () => {
		const { token } = await register("ada@example.com");
		await call("POST", "/user/wishlist", { token, body: { lighthouseId: "a" } });
		await call("POST", "/user/wishlist", { token, body: { lighthouseId: "b" } });
		await call("POST", "/user/lighthouses", { token, body: { lighthouseId: "a" } });
		await call("POST", "/user/lighthouses", { token, body: { lighthouseId: "a" } });
		assert.deepEqual((await call("GET", "/user/map-state", { token })).body, { visited_ids: ["a"], wishlist_ids: ["b"] });

		await call("DELETE", "/user/lighthouses", { token, body: { lighthouseId: "a" } });
		await call("DELETE", "/user/wishlist", { token, body: { lighthouseId: "b" } });
		assert.deepEqual((await call("GET", "/user/map-state", { token })).body, { visited_ids: [], wishlist_ids: [] });
	});

	it("rejects missing, oversized and malformed bodies", async () => {
		const { token } = await register("ada@example.com");
		assert.equal((await call("POST", "/user/lighthouses", { token, body: {} })).status, 400);
		assert.equal((await call("POST", "/user/lighthouses", { token, body: { lighthouseId: "x".repeat(129) } })).status, 400);
		assert.equal((await call("POST", "/user/lighthouses", { token, body: ["a"] })).status, 400);
		assert.equal((await call("POST", "/user/lighthouses", { token, body: { lighthouseId: "x".repeat(70_000) } })).status, 413);
	});
});

describe("friends", () => {
	it("runs the request, accept and remove flow", async () => {
		const ada = await register("ada@example.com", "Ada", "Lovelace");
		const alan = await register("alan@example.com", "Alan", "Turing");
		const friendId = (id: string) => ({ friendId: id });

		assert.equal((await call("POST", "/user/friends/requests", { token: ada.token, body: friendId(ada.user.id) })).status, 400);
		assert.equal((await call("POST", "/user/friends/requests", { token: ada.token, body: friendId("nobody") })).status, 404);
		assert.equal((await call("POST", "/user/friends/requests", { token: ada.token, body: friendId(alan.user.id) })).status, 200);
		// Duplicate in either direction.
		assert.equal((await call("POST", "/user/friends/requests", { token: ada.token, body: friendId(alan.user.id) })).status, 409);
		assert.equal((await call("POST", "/user/friends/requests", { token: alan.token, body: friendId(ada.user.id) })).status, 409);

		// The recipient sees the sender's email; the sender does not see the recipient's.
		const incoming = await call("GET", "/user/friends/requests", { token: alan.token });
		assert.deepEqual(incoming.body, [{ id: ada.user.id, first_name: "Ada", last_name: "Lovelace", email: "ada@example.com" }]);
		const outgoing = await call("GET", "/user/friends/requests/outgoing", { token: ada.token });
		assert.deepEqual(outgoing.body, [{ id: alan.user.id, first_name: "Alan", last_name: "Turing" }]);

		// Only the recipient can accept.
		assert.equal((await call("POST", "/user/friends/requests/accept", { token: ada.token, body: friendId(alan.user.id) })).status, 404);
		assert.equal((await call("POST", "/user/friends/requests/accept", { token: alan.token, body: friendId(ada.user.id) })).status, 200);
		assert.equal((await call("POST", "/user/friends/requests/accept", { token: alan.token, body: friendId(ada.user.id) })).status, 404);

		assert.equal((await call("GET", "/user/friends", { token: ada.token })).body[0].email, "alan@example.com");
		assert.equal((await call("GET", "/user/friends", { token: alan.token })).body[0].id, ada.user.id);

		await call("DELETE", "/user/friends", { token: alan.token, body: friendId(ada.user.id) });
		assert.deepEqual((await call("GET", "/user/friends", { token: ada.token })).body, []);
	});

	it("shares visited lighthouses only between accepted friends", async () => {
		const ada = await register("ada@example.com", "Ada", "Lovelace");
		const alan = await register("alan@example.com", "Alan", "Turing");
		await call("POST", "/user/lighthouses", { token: alan.token, body: { lighthouseId: "bell-rock" } });
		const visitedByAlan = () => call("GET", `/user/friends/lighthouses?friendId=${alan.user.id}`, { token: ada.token });

		assert.deepEqual((await visitedByAlan()).body, []);
		await call("POST", "/user/friends/requests", { token: ada.token, body: { friendId: alan.user.id } });
		assert.deepEqual((await visitedByAlan()).body, []);
		await call("POST", "/user/friends/requests/accept", { token: alan.token, body: { friendId: ada.user.id } });
		assert.deepEqual((await visitedByAlan()).body, ["bell-rock"]);
		assert.equal((await call("GET", "/user/friends/lighthouses", { token: ada.token })).status, 400);
	});

	it("searches names by substring but emails only exactly, without revealing emails", async () => {
		const me = await register("me@example.com", "Me", "Self");
		const ada = await register("ada@example.com", "Ada", "Lovelace");
		const alan = await register("alan@example.com", "Alan", "Turing");
		const search = async (query: string) =>
			(await call("GET", `/users/search?query=${encodeURIComponent(query)}`, { token: me.token })).body;

		assert.deepEqual(await search("ada"), [{ id: ada.user.id, first_name: "Ada", last_name: "Lovelace" }]);
		assert.deepEqual((await search("ada love")).map((user: { id: string }) => user.id), [ada.user.id]);
		assert.deepEqual((await search("ALAN@example.com")).map((user: { id: string }) => user.id), [alan.user.id]);
		for (const query of ["example.com", "@example", "%%", "a_a"]) {
			assert.deepEqual(await search(query), [], query);
		}
		assert.equal((await call("GET", "/users/search?query=a", { token: me.token })).status, 400);

		// People you already have a request or friendship with drop out of search.
		await call("POST", "/user/friends/requests", { token: me.token, body: { friendId: ada.user.id } });
		assert.deepEqual(await search("ada"), []);
	});
});

describe("cross-origin requests", () => {
	it("only answers the configured origins", async () => {
		const allowed = await call("GET", "/user", { headers: { Origin: ORIGIN } });
		assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), ORIGIN);
		const other = await call("GET", "/user", { headers: { Origin: "https://evil.example" } });
		assert.equal(other.headers.get("Access-Control-Allow-Origin"), null);
	});
});
