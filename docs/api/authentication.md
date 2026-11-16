# Authentication

Faros has no passwords. Accounts are created and used with
[passkeys](https://passkeys.dev) (WebAuthn), and a signed-in browser holds a
session cookie.

## Passkey ceremonies

Registration and sign-in are each two requests. The first returns WebAuthn
options and a `flow_id`; the second sends the browser's response back with
that `flow_id` in the `X-WebAuthn-Session` header.

| Step | Request | Returns |
| --- | --- | --- |
| Start registration | `POST /api/auth/passkey/register/options` with `email`, `first_name`, `last_name` | `{ flow_id, public_key }` |
| Finish registration | `POST /api/auth/passkey/register` with the browser's registration response | `201 { user }` and the session cookie |
| Start sign-in | `POST /api/auth/passkey/login/options` | `{ flow_id, public_key }` |
| Finish sign-in | `POST /api/auth/passkey/login` with the browser's assertion response | `200 { user }` and the session cookie |

Rules the server enforces:

- A ceremony expires after 5 minutes and can be finished only once.
- Passkeys must be discoverable and must verify the user (biometrics or device PIN).
- Sign-in has no username step: the browser offers the passkeys it holds for the site.
- A passkey whose signature counter goes backwards is rejected as a possible clone.
- An email can belong to one account. Registering it again returns `409`.

## The session cookie

A successful ceremony sets `__Host-faros_session`:

- `HttpOnly`, so page scripts cannot read it
- `Secure` and `SameSite=Strict`, so it is only sent over HTTPS by Faros's own pages
- valid for 7 days; it holds a signed token naming the user

`POST /api/auth/logout` clears it. `GET /api/auth/me` returns the signed-in
user, or `401` when there is none, which is how the frontend learns who is
signed in. Local development over plain HTTP uses the name `faros_session`
without the `Secure` attribute.

## The hostname is permanent

Passkeys are bound to the site's hostname (`PASSKEY_RP_ID` in
`lighthouse-frontend/cloudflare.config.ts`). Changing it makes every existing
passkey unusable, and there is no account recovery yet.
