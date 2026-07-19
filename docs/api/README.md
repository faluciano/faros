# Faros API Documentation

The Faros API manages lighthouse visits, wishlists, and social features.

## Base URL

- **Local Development**: `http://localhost:8080`
- **Production**: Your deployed API URL

## Authentication

Users register and sign in with a WebAuthn passkey. Successful authentication
returns a short-lived JWT for protected API requests:

```text
Authorization: Bearer <token>
```

See [authentication.md](./authentication.md) for the complete passkey ceremony.

## Interactive Documentation

- **Local**: [http://localhost:8080/docs/](http://localhost:8080/docs/)
- **Production**: `<your-api-url>/docs/`

## Quick Start

1. `GET /api/lighthouses`
2. `GET /api/lighthouses?country=USA`
3. `GET /api/lighthouses?state=California`
4. `GET /user` with a valid bearer token

## Error Handling

```json
{
  "status": 400,
  "message": "Error description"
}
```

For API support, create an issue in the GitHub repository.
