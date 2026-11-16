import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { auth } from "./auth.ts";
import { friends } from "./friends.ts";
import { allowedOrigins, ApiError, errorBody, type AppEnv } from "./http.ts";
import { users } from "./users.ts";

// Passkey responses are the largest bodies the API accepts, at a few KB.
const MAX_BODY_BYTES = 64 * 1024;

const app = new Hono<AppEnv>();

app.use(cors({
	origin: (origin, c) => (allowedOrigins(c.env).includes(origin) ? origin : null),
	allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
	allowHeaders: ["Authorization", "Content-Type", "X-WebAuthn-Session"],
	maxAge: 86400,
}));
app.use(bodyLimit({
	maxSize: MAX_BODY_BYTES,
	onError: (c) => c.json(errorBody(413, "request body too large"), 413),
}));

app.get("/", (c) => c.text("Faros API"));
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
