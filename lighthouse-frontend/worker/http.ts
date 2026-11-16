import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface Env {
	DB: D1Database;
	JWT_SECRET: string;
	// The hostname passkeys are bound to, and the one origin the app is served from.
	PASSKEY_RP_ID: string;
	APP_ORIGIN: string;
}

export interface AppEnv {
	Bindings: Env;
	Variables: { userId: string };
}

export type AppContext = Context<AppEnv>;

// Lighthouse and user IDs are short opaque strings; anything longer is junk.
export const MAX_ID_LENGTH = 128;

// An error whose message is safe to show the caller. Anything else that is
// thrown becomes a generic 500.
export class ApiError extends Error {
	readonly status: ContentfulStatusCode;

	constructor(status: ContentfulStatusCode, message: string) {
		super(message);
		this.status = status;
	}
}

export const errorBody = (status: number, message: string) => ({ status, message });

export const readObject = async (c: AppContext): Promise<Record<string, unknown>> => {
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		throw new ApiError(400, "invalid request body");
	}
	if (typeof body !== "object" || body === null || Array.isArray(body)) {
		throw new ApiError(400, "invalid request body");
	}
	return body as Record<string, unknown>;
};

// Reads a required, trimmed string field no longer than maxLength.
export const requireString = (
	body: Record<string, unknown>,
	field: string,
	maxLength: number,
): string => {
	const value = body[field];
	const text = typeof value === "string" ? value.trim() : "";
	if (!text) {
		throw new ApiError(400, `${field} is required`);
	}
	if (text.length > maxLength) {
		throw new ApiError(400, `${field} must be ${maxLength} characters or fewer`);
	}
	return text;
};

export const isUniqueViolation = (error: unknown): boolean =>
	error instanceof Error && /unique constraint failed/i.test(error.message);
