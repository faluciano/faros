# Faros API

The API is part of the Faros Worker and is served under `/api` on the same
origin as the app: `https://faros.faluciano.workers.dev/api`.

- [Authentication](./authentication.md): passkeys and the session cookie
- [Endpoints](./endpoints.md): every route, with request and response shapes

## Conventions

- Requests and responses are JSON. Request bodies are limited to 64 KB.
- Errors use one shape: `{ "status": 404, "message": "user not found" }`.
- Responses are never cached (`Cache-Control: no-store`).
- Writes (`POST`, `DELETE`) are refused with `403` when the `Origin` header
  names a different site.
- Lighthouse data is not served by the API. It is static files under
  `/data/lighthouses/`; see the [system overview](../architecture/system-overview.md).

The code is in [`lighthouse-frontend/worker/`](../../lighthouse-frontend/worker/).
