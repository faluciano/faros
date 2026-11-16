import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "faros-api",
		compatibilityDate: "2026-09-30",
		entrypoint,
		observability: { enabled: true },
		env: {
			DB: bindings.d1({ name: "faros", id: "908be2aa-98eb-40c4-b311-b06680a8b820" }),
			// Set with `cf workers secrets`; locally, put it in .dev.vars.
			JWT_SECRET: bindings.secret(),
			// The site's hostname and the origins allowed to call the API.
			// Passkeys are bound to PASSKEY_RP_ID, so it must never change once
			// accounts exist. These defaults are for local development.
			PASSKEY_RP_ID: bindings.text("localhost"),
			ALLOWED_ORIGINS: bindings.text("http://localhost:5173"),
		},
	},
});
