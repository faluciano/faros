# Endpoints

All paths are under `/api`. Every route except the four passkey ceremony
routes requires the session cookie and returns `401` without it. See
[Authentication](./authentication.md) for the ceremony routes.

A **user** is `{ id, first_name, last_name, email? }`. `email` is present only
for yourself, your accepted friends, and people who sent you a request.

## Current user

| Route | Returns |
| --- | --- |
| `GET /auth/me`, `GET /user` | The signed-in user |
| `POST /auth/logout` | `{ success: true }`; clears the session |

## Visited and wishlist

Lighthouses are referred to by ID. Full records come from the static data files.

| Route | Body | Returns |
| --- | --- | --- |
| `GET /user/map-state` | | `{ visited_ids: string[], wishlist_ids: string[] }` |
| `POST /user/lighthouses` | `{ lighthouseId }` | `{ success: true }`. Also removes it from the wishlist |
| `DELETE /user/lighthouses` | `{ lighthouseId }` | `{ success: true }` |
| `POST /user/wishlist` | `{ lighthouseId }` | `{ success: true }` |
| `DELETE /user/wishlist` | `{ lighthouseId }` | `{ success: true }` |

Adding something already saved, or removing something that is not, succeeds
without changing anything.

## Friends

| Route | Body or query | Returns |
| --- | --- | --- |
| `GET /users/search` | `?query=` (2 to 100 characters) | Up to 10 users, without emails |
| `GET /user/friends` | | Accepted friends |
| `DELETE /user/friends` | `{ friendId }` | `{ success: true }`. Removes a friendship or a pending request |
| `GET /user/friends/requests` | | Users who have sent you a request |
| `GET /user/friends/requests/outgoing` | | Users you have sent a request to, without emails |
| `POST /user/friends/requests` | `{ friendId }` | `{ success: true }` |
| `POST /user/friends/requests/accept` | `{ friendId }` | `{ success: true }` |
| `GET /user/friends/lighthouses` | `?friendId=` | IDs the friend has visited; empty unless the friendship is accepted |

Details worth knowing:

- **Search** matches names by substring and email only by exact address, and
  leaves out people you already have a request or friendship with.
- **Sending a request** returns `404` for an unknown user, `400` for yourself,
  and `409` if a request or friendship already exists in either direction.
- **Accepting** works only for the recipient of a pending request; anything
  else returns `404`.
