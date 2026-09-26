# Bitai

Small, self-contained browser tools — visualizations, calculators and utilities.
Everything runs client-side: no servers, no accounts.

Live at **https://bitai.ffff.lt** (the site itself is in Lithuanian).

## What's inside

| Path | Description |
| --- | --- |
| `index.html`, `css/`, `images/` | Landing page listing all tools |
| `pasaulines-investicijos/` | Global investments by sector visualization (static HTML) |
| `apps/cholesterolis/` | Science-based cholesterol calculator (React + TypeScript + Vite) |
| `up/` | Health check endpoint used by Kamal |

## Development

Requires Node.js 22+.

```sh
make run     # serve the repo at http://localhost:9876
make build   # build the cholesterol calculator into ./cholesterolis
make test    # run the calculator's tests (Vitest)
```

To work on the calculator with hot reload:

```sh
cd apps/cholesterolis
npm install
npm run dev
```

## Deployment

The site is packaged as an nginx Docker image (see `Dockerfile`; tests run
during the build) and deployed with [Kamal](https://kamal-deploy.org):

```sh
make deploy
```

Configuration lives in `config/deploy.yml`.

## License

[MIT](LICENSE)
