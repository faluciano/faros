# Faros API Documentation

Welcome to the Faros Lighthouse API documentation. This API allows users to manage lighthouse visits, wishlists, and social features like friends and friend requests.

## Base URL

- **Local Development**: `http://localhost:8080`
- **Production**: Your deployed API URL

## Authentication

The API uses Clerk for authentication. Include the authorization token in the request header:

```
Authorization: Bearer <your-token>
```

## Interactive Documentation

For interactive API documentation with request/response examples, visit:
- **Local**: [http://localhost:8080/docs/](http://localhost:8080/docs/)
- **Production**: `<your-api-url>/docs/`

## Quick Start

1. **Get all lighthouses**: `GET /api/lighthouses`
2. **Search lighthouses by country**: `GET /api/lighthouses?country=USA`
3. **Search lighthouses by state**: `GET /api/lighthouses?state=California`
4. **Get current user info**: `GET /user` (requires authentication)

## Rate Limiting

The API implements standard rate limiting to ensure fair usage. Please respect the limits and implement appropriate error handling in your applications.

## Error Handling

The API returns standard HTTP status codes and JSON error responses:

```json
{
  "error": "Error description"
}
```

## Support

For API support, please create an issue in the GitHub repository or contact the development team.
