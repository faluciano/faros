# Tech Stack

Faros is a single Cloudflare Worker serving both the frontend and the API.

## Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Maps:** `maplibre-gl` and `react-map-gl`, with OpenFreeMap tiles.

## API
- **Runtime:** Cloudflare Workers
- **Language:** TypeScript
- **Web Framework:** Hono
- **Passkeys:** `@simplewebauthn/server`

## Data
- **User data:** Cloudflare D1 (SQLite).
- **Lighthouse data:** static JSON files shipped with the frontend, maintained by the scripts in `scripts/`.

## Authentication
- **Method:** WebAuthn passkeys with an httpOnly session cookie. No third-party provider.

## DevOps & Infrastructure
- **Hosting:** Cloudflare Workers (static assets and API on one origin).
- **Tooling:** `cf` CLI with `cloudflare.config.ts`.
- **CI:** GitHub Actions (typecheck, lint, API tests, dry-run build).
