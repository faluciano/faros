# Faros app

The whole of Faros in one Cloudflare Worker: the React frontend is served as
static assets, and `worker/` answers `/api` on the same origin.

Live at https://faros.faluciano.workers.dev.

## Run it

Requires Node.js 22.18 or later (not Bun) and the [`cf` CLI](https://developers.cloudflare.com/cf/).

```sh
npm install
cp .dev.vars.example .dev.vars          # then set JWT_SECRET
npm run migrate:local -- <database-id>   # the id in cloudflare.config.ts
npm run dev                              # http://localhost:5173
```

That one command serves the frontend and the API against a local database
file, so nothing you do locally touches production.

## Check and deploy

```sh
npm run check    # typecheck, lint, API tests
npm run deploy   # build and deploy to Cloudflare
```

Schema changes go in a new file under `migrations/` and are applied with
`npm run migrate:remote -- <database-id>` before deploying code that needs them.

## Layout

| Path | What it holds |
| --- | --- |
| `src/` | React frontend |
| `public/data/lighthouses/` | The lighthouse dataset as static files, written by `scripts/export_static.ts` in the repo root |
| `public/_headers` | Security and caching headers for static assets |
| `worker/index.ts` | API assembly: origin check, body limit, error handling |
| `worker/auth.ts` | Passkey registration and sign-in |
| `worker/session.ts` | The session cookie and the `requireAuth` middleware |
| `worker/users.ts` | Current user, visited, wishlist, a friend's visited list |
| `worker/friends.ts` | Search, requests, accept, remove |
| `migrations/` | D1 schema (user data only) |
| `test/` | API tests, run against Node's SQLite through a D1 stand-in with a software passkey |
| `cloudflare.config.ts` | Worker name, bindings, and the hostname passkeys are bound to |

## Things to know

- **Passkeys are bound to the hostname** in `cloudflare.config.ts`. Changing it
  locks every existing account out.
- **Sessions are an httpOnly, SameSite=Strict cookie.** The frontend never sees
  a token; it asks `/api/auth/me` who is signed in.
- **The Content-Security-Policy only allows images from Wikimedia** and map
  tiles from OpenFreeMap. A new image or tile host needs adding in
  `public/_headers`.
