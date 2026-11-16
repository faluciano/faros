# Faros

Web app to track visited lighthouses around the world with a map to display visited points.

## ✨ Features

- [x] Interactive lighthouse map with global lighthouse data
- [x] Passwordless authentication with passkeys
- [x] Personal visited lighthouse tracking
- [x] Social features: friends and friend requests
- [x] Combined friend/personal lighthouse maps
- [x] Lighthouse wishlist functionality
- [ ] Lighthouse visit photo upload

## 🏗️ Architecture

Faros runs as a single Cloudflare Worker:

- **Frontend**: React with TypeScript and Vite, served as static assets
- **API**: [Hono](https://hono.dev) on the same Worker, under `/api`
- **Database**: Cloudflare D1 (SQLite) for accounts, visits, wishlists and friendships
- **Lighthouse data**: static JSON files shipped with the frontend, so the map needs no API
- **Authentication**: WebAuthn passkeys with an httpOnly session cookie
- **Maps**: MapLibre GL with OpenFreeMap tiles

## 🚀 Quick Start

Requires Node.js 22.18 or later and the [`cf` CLI](https://developers.cloudflare.com/cf/).

```bash
git clone https://github.com/faluciano/faros.git
cd faros/lighthouse-frontend
npm install
cp .dev.vars.example .dev.vars          # then set JWT_SECRET
npm run migrate:local -- <database-id>   # the id in cloudflare.config.ts
npm run dev                              # http://localhost:5173
```

See [`lighthouse-frontend/README.md`](./lighthouse-frontend/README.md) for the
project layout, checks and deployment.

## 🔐 Passkeys

Passkeys are bound to the site's hostname, set in
`lighthouse-frontend/cloudflare.config.ts`. Changing it makes every existing
passkey unusable. Local development uses `localhost`.

## 🌐 Live Deployment

https://faros.faluciano.workers.dev

## 🤝 Contributing

Please read our [development setup guide](./docs/development/setup.md) for contribution guidelines.

## 📄 License

This project is licensed under the MIT License.
