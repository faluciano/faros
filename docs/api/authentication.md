# Authentication

The Faros API uses [Clerk](https://clerk.dev/) for authentication and user management.

## Setup

### Backend Configuration

The API requires the following environment variable:
```bash
CLERK_AUTH_TOKEN=your_clerk_secret_key
```

### Frontend Integration

Install the Clerk SDK in your frontend application:
```bash
npm install @clerk/clerk-react
# or
npm install @clerk/nextjs
```

## Making Authenticated Requests

### Getting the Token

In your frontend application, get the session token:

```javascript
import { useAuth } from '@clerk/clerk-react';

function MyComponent() {
  const { getToken } = useAuth();
  
  const makeApiCall = async () => {
    const token = await getToken();
    
    const response = await fetch('/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.json();
  };
}
```

### Header Format

Include the authorization header in all authenticated requests:
```
Authorization: Bearer <jwt-token>
```

## User Context

When authenticated, the API provides access to user information through Clerk's session claims:
- User ID (`claims.Subject`)
- Email address
- Profile information

## Error Handling

Authentication errors return:
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Valid token but insufficient permissions

Example error response:
```json
{
  "error": "unauthorized"
}
```

## Security Notes

- Tokens are validated on each request
- Tokens expire automatically for security
- The frontend should handle token refresh automatically
- Never expose the `CLERK_AUTH_TOKEN` in client-side code

## Testing Authentication

For testing purposes, you can use tools like Postman or curl:

1. Login through your frontend application
2. Extract the JWT token from the browser's developer tools
3. Use the token in your API testing tool:

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:8080/user
```
