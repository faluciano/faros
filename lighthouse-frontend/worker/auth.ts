import { Hono } from "hono";
import {
	generateAuthenticationOptions,
	generateRegistrationOptions,
	verifyAuthenticationResponse,
	verifyRegistrationResponse,
	type AuthenticationResponseJSON,
	type RegistrationResponseJSON,
	type WebAuthnCredential,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import {
	ApiError,
	isUniqueViolation,
	readObject,
	requireString,
	type AppContext,
	type AppEnv,
} from "./http.ts";
import { endSession, startSession } from "./session.ts";
import type { User } from "./users.ts";

const SESSION_HEADER = "X-WebAuthn-Session";
const CEREMONY_SECONDS = 5 * 60;
const HANDLE_BYTES = 32;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

type Ceremony = "registration" | "login";

interface PendingUser extends Required<User> {
	handle: string;
}

interface StoredCredential {
	id: string;
	public_key: string;
	counter: number;
	transports: string | null;
	user_id: string;
	first_name: string;
	last_name: string;
	email: string;
	handle: string;
}

const now = (): number => Math.floor(Date.now() / 1000);

const normalizeEmail = (body: Record<string, unknown>): string => {
	const email = requireString(body, "email", MAX_EMAIL_LENGTH).toLowerCase();
	if (!EMAIL_PATTERN.test(email)) {
		throw new ApiError(400, "email must be valid");
	}
	return email;
};

const saveSession = async (c: AppContext, ceremony: Ceremony, challenge: string, pendingUser?: PendingUser) => {
	const id = isoBase64URL.fromBuffer(crypto.getRandomValues(new Uint8Array(32)));
	await c.env.DB.batch([
		c.env.DB.prepare("DELETE FROM passkey_sessions WHERE expires_at <= ?").bind(now()),
		c.env.DB
			.prepare("INSERT INTO passkey_sessions (id, ceremony, challenge, pending_user, expires_at) VALUES (?, ?, ?, ?, ?)")
			.bind(id, ceremony, challenge, pendingUser ? JSON.stringify(pendingUser) : null, now() + CEREMONY_SECONDS),
	]);
	return id;
};

// Deletes the session as it reads it, so a challenge can only be used once.
const consumeSession = async (c: AppContext, ceremony: Ceremony) => {
	const id = (c.req.header(SESSION_HEADER) ?? "").trim();
	if (!id) {
		throw new ApiError(400, "missing passkey session");
	}
	const session = await c.env.DB
		.prepare("DELETE FROM passkey_sessions WHERE id = ? AND ceremony = ? RETURNING challenge, pending_user, expires_at")
		.bind(id, ceremony)
		.first<{ challenge: string; pending_user: string | null; expires_at: number }>();
	if (!session || session.expires_at <= now()) {
		throw new ApiError(400, "passkey request expired; start again");
	}
	return session;
};

const signedIn = async (c: AppContext, user: Required<User>, status: 200 | 201) => {
	await startSession(c, user.id);
	return c.json({ user }, status);
};

export const auth = new Hono<AppEnv>();

auth.post("/auth/passkey/register/options", async (c) => {
	const body = await readObject(c);
	const email = normalizeEmail(body);
	const firstName = requireString(body, "first_name", MAX_NAME_LENGTH);
	const lastName = requireString(body, "last_name", MAX_NAME_LENGTH);

	const existing = await c.env.DB.prepare("SELECT 1 FROM users WHERE email = ?").bind(email).first();
	if (existing) {
		throw new ApiError(409, "email already registered");
	}

	const options = await generateRegistrationOptions({
		rpName: "Faros",
		rpID: c.env.PASSKEY_RP_ID,
		userName: email,
		userDisplayName: `${firstName} ${lastName}`,
		userID: crypto.getRandomValues(new Uint8Array(HANDLE_BYTES)),
		attestationType: "none",
		authenticatorSelection: { residentKey: "required", userVerification: "required" },
		timeout: CEREMONY_SECONDS * 1000,
	});

	const flowId = await saveSession(c, "registration", options.challenge, {
		id: crypto.randomUUID(),
		email,
		first_name: firstName,
		last_name: lastName,
		handle: options.user.id,
	});
	return c.json({ flow_id: flowId, public_key: options });
});

auth.post("/auth/passkey/register", async (c) => {
	const session = await consumeSession(c, "registration");
	const response = await readObject(c) as unknown as RegistrationResponseJSON;
	const { handle, ...user } = JSON.parse(session.pending_user ?? "null") as PendingUser;

	const verification = await verifyRegistrationResponse({
		response,
		expectedChallenge: session.challenge,
		expectedOrigin: c.env.APP_ORIGIN,
		expectedRPID: c.env.PASSKEY_RP_ID,
		requireUserVerification: true,
	}).catch(() => null);
	if (!verification?.verified || !verification.registrationInfo) {
		throw new ApiError(400, "passkey registration failed");
	}
	const { credential } = verification.registrationInfo;

	try {
		await c.env.DB.batch([
			c.env.DB
				.prepare("INSERT INTO users (id, first_name, last_name, email, handle) VALUES (?, ?, ?, ?, ?)")
				.bind(user.id, user.first_name, user.last_name, user.email, handle),
			c.env.DB
				.prepare("INSERT INTO credentials (id, user_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)")
				.bind(
					credential.id,
					user.id,
					isoBase64URL.fromBuffer(credential.publicKey),
					credential.counter,
					credential.transports ? JSON.stringify(credential.transports) : null,
				),
		]);
	} catch (error) {
		if (isUniqueViolation(error)) {
			throw new ApiError(409, "email or passkey already registered");
		}
		throw error;
	}

	return signedIn(c, user, 201);
});

auth.post("/auth/passkey/login/options", async (c) => {
	// No allow-list: the browser offers whichever passkeys it holds for the site.
	const options = await generateAuthenticationOptions({
		rpID: c.env.PASSKEY_RP_ID,
		userVerification: "required",
		timeout: CEREMONY_SECONDS * 1000,
	});
	const flowId = await saveSession(c, "login", options.challenge);
	return c.json({ flow_id: flowId, public_key: options });
});

auth.post("/auth/passkey/login", async (c) => {
	const session = await consumeSession(c, "login");
	const response = await readObject(c) as unknown as AuthenticationResponseJSON;
	const failed = new ApiError(401, "passkey sign-in failed");

	if (typeof response.id !== "string") {
		throw failed;
	}
	const stored = await c.env.DB
		.prepare(`
			SELECT c.id, c.public_key, c.counter, c.transports,
				u.id AS user_id, u.first_name, u.last_name, u.email, u.handle
			FROM credentials c JOIN users u ON u.id = c.user_id
			WHERE c.id = ?
		`)
		.bind(response.id)
		.first<StoredCredential>();
	// The passkey names the account it belongs to; it must match the owner on record.
	if (!stored || response.response?.userHandle !== stored.handle) {
		throw failed;
	}

	const verification = await verifyAuthenticationResponse({
		response,
		expectedChallenge: session.challenge,
		expectedOrigin: c.env.APP_ORIGIN,
		expectedRPID: c.env.PASSKEY_RP_ID,
		requireUserVerification: true,
		credential: {
			id: stored.id,
			publicKey: isoBase64URL.toBuffer(stored.public_key),
			counter: stored.counter,
			transports: stored.transports ? JSON.parse(stored.transports) as WebAuthnCredential["transports"] : undefined,
		},
	}).catch(() => null);
	if (!verification?.verified) {
		throw failed;
	}

	// Matching on the old counter means two concurrent sign-ins with the same
	// passkey cannot both succeed.
	const update = await c.env.DB
		.prepare("UPDATE credentials SET counter = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ? AND counter = ?")
		.bind(verification.authenticationInfo.newCounter, stored.id, stored.counter)
		.run();
	if (update.meta.changes !== 1) {
		throw new ApiError(409, "passkey sign-in must be retried");
	}

	return signedIn(c, {
		id: stored.user_id,
		first_name: stored.first_name,
		last_name: stored.last_name,
		email: stored.email,
	}, 200);
});

auth.post("/auth/logout", (c) => {
	endSession(c);
	return c.json({ success: true });
});
