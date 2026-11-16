import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { auth } from "./auth.ts";
import { friends } from "./friends.ts";
import { ApiError, errorBody, type AppEnv } from "./http.ts";
import { users } from "./users.ts";

// Passkey responses are the largest bodies the API accepts, at a few KB.
const MAX_BODY_BYTES = 64 * 1024;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// The frontend is served from the same origin as static assets; the Worker
// only runs for /api.
const app = new Hono<AppEnv>().basePath("/api");

app.use(async (c, next) => {
	// The session cookie is SameSite=Strict, so other sites cannot use it.
	// Refusing writes that name a different origin is a second line of
	// defence. Requests without an Origin header are not from a browser page.
	const origin = c.req.header("Origin");
	if (!SAFE_METHODS.has(c.req.method) && origin && origin !== c.env.APP_ORIGIN) {
		throw new ApiError(403, "cross-origin request refused");
	}
	await next();
	// Every response is specific to the signed-in user.
	c.header("Cache-Control", "no-store");
});
app.use(bodyLimit({
	maxSize: MAX_BODY_BYTES,
	onError: (c) => c.json(errorBody(413, "request body too large"), 413),
}));

app.route("/", auth);
app.route("/", users);
app.route("/", friends);

app.notFound((c) => c.json(errorBody(404, "not found"), 404));
app.onError((error, c) => {
	if (error instanceof ApiError) {
		return c.json(errorBody(error.status, error.message), error.status);
	}
	console.error(error);
	return c.json(errorBody(500, "internal error"), 500);
});

export default app;
