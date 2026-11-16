import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import { ApiError, type AppEnv, type Env } from "./http.ts";

const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;
const MIN_SECRET_LENGTH = 32;
const ISSUER = "faros-api";

// There is deliberately no fallback secret: a Worker deployed without one
// fails every sign-in instead of issuing tokens anyone could forge.
const secretFor = (env: Env): string => {
	if (!env.JWT_SECRET || env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
		throw new Error(`JWT_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters`);
	}
	return env.JWT_SECRET;
};

export const issueToken = (env: Env, userId: string): Promise<string> => {
	const now = Math.floor(Date.now() / 1000);
	return sign(
		{ sub: userId, iss: ISSUER, iat: now, exp: now + TOKEN_LIFETIME_SECONDS },
		secretFor(env),
		"HS256",
	);
};

// Requires a valid Bearer token and exposes its user as c.get("userId").
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
	const [scheme, token] = (c.req.header("Authorization") ?? "").split(" ");
	if (scheme?.toLowerCase() !== "bearer" || !token) {
		throw new ApiError(401, "unauthorized");
	}

	const secret = secretFor(c.env);
	let subject: unknown;
	try {
		subject = (await verify(token, secret, { alg: "HS256", iss: ISSUER })).sub;
	} catch {
		throw new ApiError(401, "unauthorized");
	}
	if (typeof subject !== "string" || !subject) {
		throw new ApiError(401, "unauthorized");
	}

	c.set("userId", subject);
	await next();
});
