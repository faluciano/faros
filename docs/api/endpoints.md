# API Endpoints

## Public Endpoints

### Lighthouses

#### Get All Lighthouses
- **Endpoint**: `GET /api/lighthouses`
- **Description**: Retrieve all lighthouses, with optional filtering by country and/or state
- **Query Parameters**:
  - `country` (optional): Filter by country name
  - `state` (optional): Filter by state name
  - **Note**: Both parameters can be used together to filter by state within a specific country
- **Response**: Array of lighthouse objects
- **Examples**:
  ```
  GET /api/lighthouses
  GET /api/lighthouses?country=USA
  GET /api/lighthouses?state=California
  GET /api/lighthouses?country=USA&state=California
  ```

## Authenticated Endpoints

All endpoints below require authentication via Clerk.

### User Management

#### Get Current User
- **Endpoint**: `GET /user`
- **Description**: Get current authenticated user information
- **Response**: User object with profile details

### User Lighthouses

#### Get Visited Lighthouses
- **Endpoint**: `GET /user/lighthouses`
- **Description**: Get all lighthouses visited by the current user

#### Mark Lighthouse as Visited
- **Endpoint**: `POST /user/lighthouses`
- **Description**: Mark a lighthouse as visited
- **Body**:
  ```json
  {
    "lighthouseId": "lighthouse-uuid"
  }
  ```

#### Unmark Lighthouse as Visited
- **Endpoint**: `DELETE /user/lighthouses`
- **Query Parameters**:
  - `lighthouseId`: ID of the lighthouse to unmark

### User Wishlist

#### Get Wishlist
- **Endpoint**: `GET /user/wishlist`
- **Description**: Get all lighthouses in user's wishlist

#### Add to Wishlist
- **Endpoint**: `POST /user/wishlist`
- **Body**:
  ```json
  {
    "lighthouseId": "lighthouse-uuid"
  }
  ```

#### Remove from Wishlist
- **Endpoint**: `DELETE /user/wishlist`
- **Query Parameters**:
  - `lighthouseId`: ID of the lighthouse to remove

### Friends Management

#### Search Users
- **Endpoint**: `GET /users/search`
- **Description**: Search for users by name or email
- **Query Parameters**:
  - `query` (required): Search term (2-100 characters)

#### Get Friends
- **Endpoint**: `GET /user/friends`
- **Description**: Get current user's friends list

#### Remove Friend
- **Endpoint**: `DELETE /user/friends`
- **Query Parameters**:
  - `friendId`: ID of the friend to remove

#### Get Friend's Visited Lighthouses
- **Endpoint**: `GET /user/friends/lighthouses`
- **Description**: Get lighthouses visited by user's friends

### Friend Requests

#### Get Pending Friend Requests
- **Endpoint**: `GET /user/friends/requests`
- **Description**: Get incoming friend requests

#### Send Friend Request
- **Endpoint**: `POST /user/friends/requests`
- **Body**:
  ```json
  {
    "friendId": "user-uuid"
  }
  ```

#### Get Outgoing Friend Requests
- **Endpoint**: `GET /user/friends/requests/outgoing`
- **Description**: Get sent friend requests

#### Accept Friend Request
- **Endpoint**: `POST /user/friends/requests/accept`
- **Body**:
  ```json
  {
    "friendId": "user-uuid"
  }
  ```

## Response Format

All endpoints return JSON responses with appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid
- `404 Not Found`: Resource not found
- `405 Method Not Allowed`: HTTP method not supported
- `500 Internal Server Error`: Server error

## Error Response Format

```json
{
  "error": "Descriptive error message"
}
```
