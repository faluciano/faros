# Authentication

Faros uses WebAuthn passkeys for account registration and sign-in. Passwords are
not accepted or stored. After a passkey ceremony succeeds, the API returns a
JWT used by the existing protected endpoints.

## Backend configuration

```env
JWT_SECRET=replace_with_a_long_random_value
PASSKEY_RP_ID=localhost
PASSKEY_RP_ORIGINS=http://localhost:5173
```

For production, `PASSKEY_RP_ID` must be the exact stable frontend hostname and
`PASSKEY_RP_ORIGINS` must contain its HTTPS origin. Multiple origins can be
comma-separated, but each origin must be valid for the configured relying-party
ID.

## Registration flow

1. `POST /auth/passkey/register/options` with the user's profile:

   ```json
   {
     "email": "user@example.com",
     "first_name": "Grace",
     "last_name": "Hopper"
   }
   ```

2. Pass `public_key` from the response to `navigator.credentials.create()` or a
   WebAuthn browser helper.
3. `POST /auth/passkey/register` with the credential response as the JSON body
   and the returned ceremony ID in:

   ```text
   X-WebAuthn-Session: <flow_id>
   ```

4. Store the returned JWT and use it for protected requests.

## Sign-in flow

1. `POST /auth/passkey/login/options` without a username or email.
2. Pass `public_key` to `navigator.credentials.get()` or a WebAuthn browser
   helper. The discoverable passkey identifies the account.
3. `POST /auth/passkey/login` with the assertion response and
   `X-WebAuthn-Session` header.
4. Store the returned JWT.

Ceremony IDs are short-lived, server-stored, and single-use. If a ceremony
expires or fails validation, begin a new one.

## Protected requests

```text
Authorization: Bearer <token>
```

Tokens expire after 24 hours. A missing or invalid token returns
`401 Unauthorized`.

## Security notes

- Passkey registration requires a discoverable credential and user verification.
- Passkeys require HTTPS except on localhost.
- Authenticator counters and backup state are persisted after every sign-in.
- Changing the relying-party ID invalidates existing passkeys.
- Never expose `JWT_SECRET` to the frontend.
