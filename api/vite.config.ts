import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [cloudflare()],
	// The frontend's dev server owns 5173 and expects the API on 8080.
	server: { port: 8080, strictPort: true },
});
