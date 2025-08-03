# Development Setup

## Prerequisites

- Go 1.24.0 or later
- Git
- A Turso database account (for production) or SQLite for local development

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/faluciano/faros.git
cd faros
```

### 2. Backend Setup

```bash
cd lighthouse-backend

# Install dependencies
go mod download

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# For local development, you can leave TURSO_* variables empty to use SQLite
```

### 3. Environment Variables

Create a `.env` file in the `lighthouse-backend` directory:

```env
# Clerk Authentication
CLERK_AUTH_TOKEN=your_clerk_secret_key

# Database (for production deployment)
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Server Configuration
PORT=8080
API_HOST=localhost:8080
API_SCHEME=http
```

**Note**: For local development, if `TURSO_*` variables are not set, the application will use a local SQLite database file (`lighthouse.db`).

### 4. Run the Backend

```bash
# Run directly
go run main.go

# Or use the provided script
chmod +x run-local.sh
./run-local.sh
```

The API will be available at `http://localhost:8080`

### 5. Frontend Setup

```bash
cd ../lighthouse-frontend

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The frontend will be available at `http://localhost:5173`

## API Documentation

Once the backend is running, you can access:
- Swagger UI: `http://localhost:8080/docs/`
- API endpoints: `http://localhost:8080/api/`

## Database

### Local Development
- Uses SQLite database (`lighthouse.db` file)
- Database tables are created automatically on first run

### Production
- Uses Turso (SQLite in the cloud)
- Requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`

## Development Commands

### Backend

```bash
# Run the application
go run main.go

# Run tests
go test ./...

# Generate Swagger documentation
swag init

# Format code
go fmt ./...

# Check for issues
go vet ./...
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Project Structure

```
faros/
├── docs/                     # Documentation
├── lighthouse-backend/       # Go API server
│   ├── db/                  # Database layer
│   ├── handlers/            # HTTP handlers
│   ├── interfaces/          # Interface definitions
│   ├── schemas/             # Data schemas
│   ├── utils/               # Utility functions
│   └── docs/                # Auto-generated Swagger docs
└── lighthouse-frontend/      # React frontend
    ├── src/
    │   ├── components/      # React components
    │   ├── context/         # React contexts
    │   ├── hooks/           # Custom hooks
    │   └── utils/           # Utility functions
    └── public/              # Static assets
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test your changes locally
4. Create a pull request

## Troubleshooting

### Backend Issues

- **Port already in use**: Change the `PORT` environment variable
- **Database connection error**: Check your Turso credentials or SQLite file permissions
- **Authentication errors**: Verify your `CLERK_AUTH_TOKEN`

### Frontend Issues

- **API connection failed**: Ensure the backend is running on the correct port
- **Authentication not working**: Check Clerk configuration in both frontend and backend
