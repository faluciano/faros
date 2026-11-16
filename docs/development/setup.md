# Development setup

## Requirements

- Node.js 22.18 or later
- The [`cf` CLI](https://developers.cloudflare.com/cf/) (`npm install --global cf`)
- [Bun](https://bun.sh), only if you will run the data scripts in `scripts/`

No Cloudflare account is needed to run or test the app locally.

## Run the app

```sh
git clone https://github.com/faluciano/faros.git
cd faros/lighthouse-frontend
npm install
cp .dev.vars.example .dev.vars          # set JWT_SECRET to any 32+ character string
npm run migrate:local -- <database-id>   # the id in cloudflare.config.ts
npm run dev
```

Open http://localhost:5173. The frontend and the API run together, against a
database file on your machine. Passkeys work on `localhost`.

## Check your changes

```sh
npm run check    # typecheck, lint, API tests
```

The same command runs in CI on every pull request, followed by a dry-run build.

- **API tests** (`test/api.test.ts`) call the real routes against Node's
  built-in SQLite and a software passkey, so they need no browser or network.
- **Schema changes** go in a new numbered file under `migrations/`. Apply it
  locally with `npm run migrate:local -- <database-id>`.

## Deploy

```sh
cf auth login                              # once
npm run migrate:remote -- <database-id>    # only if you added a migration
npm run deploy
```

The Worker's signing secret is set once with `cf workers secrets` and is not
in the repository.

## Change the lighthouse data

See [`scripts/README.md`](../../scripts/README.md).

## Contributing

- Branch from `main` and open a pull request.
- Keep `npm run check` passing, and add an API test for any behaviour change in `worker/`.
