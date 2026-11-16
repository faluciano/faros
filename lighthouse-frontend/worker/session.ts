import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import { ApiError, type AppEnv, type Env } from "./http.ts";

const SESSION_SECONDS = 7 * 24 * 60 * 60;
const MIN_SECRET_LENGTH = 32;
const ISSUER = "faros";

// There is deliberately no fallback secret: a Worker deployed without one
// fails every sign-in instead of issuing sessions anyone could forge.
const secretFor = (env: Env): string => {
	if (!env.JWT_SECRET || env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
		throw new Error(`JWT_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters`);
	}
	return env.JWT_SECRET;
};

// The session lives in a cookie scripts cannot read and other sites cannot
// send. Over HTTPS it also takes the __Host- prefix, which pins it to this
// exact host; plain-HTTP local development cannot use that prefix.
const cookieFor = (env: Env) => {
	const secure = env.APP_ORIGIN.startsWith("https://");
	return {
		name: secure ? "__Host-faros_session" : "faros_session",
		options: { path: "/", httpOnly: true, secure, sameSite: "Strict" as const },
	};
};

export const startSession = async (c: Context<AppEnv>, userId: string): Promise<void> => {
	const now = Math.floor(Date.now() / 1000);
	const token = await sign(
		{ sub: userId, iss: ISSUER, iat: now, exp: now + SESSION_SECONDS },
		secretFor(c.env),
		"HS256",
	);
	const { name, options } = cookieFor(c.env);
	setCookie(c, name, token, { ...options, maxAge: SESSION_SECONDS });
};

export const endSession = (c: Context<AppEnv>): void => {
	const { name, options } = cookieFor(c.env);
	deleteCookie(c, name, options);
};

// Requires a valid session cookie and exposes its user as c.get("userId").
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
	const secret = secretFor(c.env);
	const token = getCookie(c, cookieFor(c.env).name);
	if (!token) {
		throw new ApiError(401, "unauthorized");
	}

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
