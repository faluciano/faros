# Faros

Web app to track visited lighthouses around the world with a map to display visited points.

## ✨ Features

- [x] Interactive lighthouse map with global lighthouse data
- [x] User authentication and registration via Clerk
- [x] Personal visited lighthouse tracking
- [x] Social features: friends and friend requests
- [x] Combined friend/personal lighthouse maps
- [x] Lighthouse wishlist functionality
- [ ] Lighthouse visit photo upload

## 🏗️ Architecture

- **Backend**: Go REST API with clean architecture
- **Frontend**: React with TypeScript, Vite, and Bun
- **Authentication**: Clerk for secure user management
- **Database**: Turso (SQLite) with embedded replica
- **Maps**: Pigeon-Maps for interactive map visualization

## 📚 Documentation

- **[API Documentation](./docs/api/)** - Complete API reference and examples
- **[Development Setup](./docs/development/setup.md)** - Get started with local development
- **[System Architecture](./docs/architecture/system-overview.md)** - Technical architecture overview
- **[Deployment Guide](./docs/deployment/)** - Production deployment instructions

## 🚀 Quick Start

### Prerequisites
- Go 1.24.0+
- Bun (latest version)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/faluciano/faros.git
   cd faros
   ```

2. **Setup Backend**
   ```bash
   cd lighthouse-backend
   go mod download
   cp .env.example .env
   # Edit .env with your Clerk credentials
   go run main.go
   ```

3. **Setup Frontend**
   ```bash
   cd lighthouse-frontend
   bun install
   bun dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - API Documentation: http://localhost:8080/docs/

## 🌐 Live Deployment

- **API**: https://faros-backend.azurewebsites.net/docs/
- **Web App**: https://agreeable-pond-025c6731e.5.azurestaticapps.net/

## 🤝 Contributing

Please read our [development setup guide](./docs/development/setup.md) for contribution guidelines.

## 📄 License

This project is licensed under the MIT License.
