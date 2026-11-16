# System overview

Faros is one Cloudflare Worker. It serves the React app as static assets and
answers `/api` itself, backed by a D1 database.

```
Browser
  |
  |-- /, /lighthouse, /assets/*, /data/*   static assets (no code runs)
  |-- /api/*                               Worker (Hono) --> D1
  |
  '-- map tiles from OpenFreeMap, photos from Wikimedia Commons
```

## The two kinds of data

**Lighthouses** are about 10,000 public records that change only when someone
runs an import script. They are published as static files with the frontend:

- `/data/lighthouses/index.json`: every lighthouse as `[id, longitude, latitude]`
- `/data/lighthouses/details/<nn>.json`: full records, split into 256 files of a few KB

The map loads the index once; opening a lighthouse fetches one detail file.
None of this touches the API or the database, so browsing works even if the
API is down. The files are written by `scripts/export_static.ts`; see
[`scripts/README.md`](../../scripts/README.md).

**User data** is small and private: accounts, passkeys, visited and wishlist
entries, and friendships. It lives in D1 and is only reached through the API.
Visited and wishlist rows store lighthouse IDs; there is no lighthouse table.

## Request handling

- Requests that match a static file are served directly by Cloudflare.
- Other navigations get `index.html`, and React Router picks the page.
- `/api/*` always runs the Worker.

Static responses carry a Content-Security-Policy and caching rules from
`lighthouse-frontend/public/_headers`: hashed assets are cached for a year,
lighthouse data for an hour.

## Sign-in

Passkeys only, with an httpOnly same-site session cookie. See
[Authentication](../api/authentication.md).

## What is deliberately not here

- No container, server or always-on process: nothing to wake up.
- No API key for the map: OpenFreeMap needs none. The style URL is one constant
  in `src/utils/map.ts` if the provider ever has to change.
- No cross-origin access: the app and API share an origin, so CORS is off.

## Layout

See [`lighthouse-frontend/README.md`](../../lighthouse-frontend/README.md) for
where each piece lives in the code.
