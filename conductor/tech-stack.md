# Tech Stack

## Backend
- **Language:** Go 1.25
- **Architecture:** Clean Architecture (Handlers, Services, Repositories).
- **Web Framework:** Standard library (`net/http`) with `rs/cors` and `swaggo/http-swagger`.
- **JWT:** `golang-jwt/jwt/v5`.
- **API Docs:** Swagger (`swag`).

## Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Maps:** `maplibre-gl`, `react-map-gl`, and Pigeon-Maps.

## Database
- **Provider:** Turso (SQLite).
- **Driver:** `go-libsql`.

## Authentication
- **Provider:** Clerk.

## DevOps & Infrastructure
- **Containerization:** Docker.
- **CI/CD:** GitHub Actions.
- **Hosting:** Azure Static Web Apps (Frontend), Azure Web Apps for Containers (Backend).
