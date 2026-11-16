# Faros API

The API as a Cloudflare Worker: [Hono](https://hono.dev) for routing, D1 for
user data, passkeys for sign-in. It serves the same routes and JSON as the Go
backend in `lighthouse-backend/`, which it replaces at cutover.

Lighthouse data is not stored here. It is static files served with the
frontend, so this database only holds accounts, passkeys, visited and wishlist
entries, and friendships.

## Run it

Requires Node.js 22.18 or later (not Bun) and the [`cf` CLI](https://developers.cloudflare.com/cf/).

```sh
npm install
cp .dev.vars.example .dev.vars        # then set JWT_SECRET
npm run migrate:local -- <database-id> # the id in cloudflare.config.ts
npm run dev                            # http://localhost:8080
```

The frontend's dev server (`bun run dev` in `lighthouse-frontend/`) calls
`http://localhost:8080` by default, so the two work together as they are.

## Test it

```sh
npm run check   # typecheck, then tests
```

Tests run the real routes against Node's built-in SQLite through a small D1
stand-in (`test/d1.ts`) and a software passkey (`test/authenticator.ts`), so
they need no Cloudflare account or Workers runtime.

## Layout

| Path | What it holds |
| --- | --- |
| `src/index.ts` | App assembly: CORS, body limit, error handling |
| `src/auth.ts` | Passkey registration and sign-in |
| `src/session.ts` | Token issuing and the `requireAuth` middleware |
| `src/users.ts` | Current user, visited, wishlist, a friend's visited list |
| `src/friends.ts` | Search, requests, accept, remove |
| `migrations/` | D1 schema |
