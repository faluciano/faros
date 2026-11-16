import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./worker/index.ts" with { type: "cf-worker" };

// Passkeys are bound to this hostname. Changing it signs every user out for
// good, so treat it as permanent once accounts exist.
const PRODUCTION_HOST = "faros.faluciano.workers.dev";

export default defineConfig(({ mode }) => {
	const isDevelopment = mode === "development";
	return {
		worker: {
			name: "faros",
			compatibilityDate: "2026-09-30",
			entrypoint,
			observability: { enabled: true },
			assets: {
				// Unknown paths are client-side routes, so they get index.html;
				// /api always goes to the Worker.
				notFoundHandling: "single-page-application",
				runWorkerFirst: ["/api/*"],
			},
			env: {
				DB: bindings.d1({ name: "faros", id: "908be2aa-98eb-40c4-b311-b06680a8b820" }),
				// Set with `cf workers secrets`; locally, put it in .dev.vars.
				JWT_SECRET: bindings.secret(),
				PASSKEY_RP_ID: bindings.text(isDevelopment ? "localhost" : PRODUCTION_HOST),
				APP_ORIGIN: bindings.text(isDevelopment ? "http://localhost:5173" : `https://${PRODUCTION_HOST}`),
			},
		},
	};
});
