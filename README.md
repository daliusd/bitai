# Bitai

Small, self-contained browser tools — visualizations, calculators and utilities.
Everything runs client-side: no servers, no accounts.

Live at **https://bitai.ffff.lt** (the site itself is in Lithuanian).

## What's inside

| Path | Description |
| --- | --- |
| `index.html`, `css/`, `images/` | Landing page listing all tools |
| `pasaulines-investicijos/` | Global investments by sector visualization (static HTML) |
| `cah/` | Lithuanian translation of Cards Against Humanity: printable PDFs, CSVs and the Scribus scripts that generate the cards |
| `apps/cholesterolis/` | Science-based cholesterol calculator (React + TypeScript + Vite) |
| `apps/kraujospudis/` | Science-based blood pressure calculator (React + TypeScript + Vite) |
| `apps/laikmatis/` | Interval training timer with voice cues (React + TypeScript + Vite) |
| `apps/ryskumo-gylis/` | Depth of field visualization with a 3D blur view, in Lithuanian and English (`?lang=en`) (React + TypeScript + Vite) |
| `up/` | Health check endpoint used by Kamal |

## Development

Requires Node.js 22+.

```sh
make run     # serve the repo at http://localhost:9876
make build   # build the React apps into ./cholesterolis, ./kraujospudis, ./laikmatis and ./ryskumo-gylis
make test    # run the React apps' tests (Vitest)
```

To work on an app with hot reload:

```sh
cd apps/cholesterolis   # or apps/kraujospudis, apps/laikmatis, apps/ryskumo-gylis
npm install
npm run dev
```

## Deployment

The site is packaged as an nginx Docker image (see `Dockerfile`; tests run
during the build) and deployed with [Kamal](https://kamal-deploy.org):

```sh
make deploy
```

Or run the **Deploy** workflow from the GitHub Actions tab (manual trigger). It
needs an `SSH_PRIVATE_KEY` repository secret holding a key that can reach the
server.

Configuration lives in `config/deploy.yml`.

## License

[MIT](LICENSE)
