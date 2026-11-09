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
| `apps/zurkeno-kalendorius/` | Printable hamster-care calendar for kids: enter the hamster's name, year and month and download an A4 PDF built in the browser (React + TypeScript + Vite + pdf-lib) |
| `apps/antra-pakopa/` | Second pension pillar calculator: by age and today's date, why moving the money to the third pillar or an ETF may be worth it during the 2026–2027 exit window, and what each option costs (React + TypeScript + Vite) |
| `up/` | Health check endpoint used by Kamal |
| `robots.txt`, `sitemap.xml`, `404.html`, `images/og/` | Search engine files, the not-found page and 1200×630 link previews |

## Development

Requires Node.js 22+.

```sh
make run     # serve the repo at http://localhost:9876
make build   # build the React apps into ./cholesterolis, ./kraujospudis, ./laikmatis, ./ryskumo-gylis, ./zurkeno-kalendorius and ./antra-pakopa
make test    # run the React apps' tests (Vitest)
```

To work on an app with hot reload:

```sh
cd apps/cholesterolis   # or apps/kraujospudis, apps/laikmatis, apps/ryskumo-gylis, apps/zurkeno-kalendorius, apps/antra-pakopa
npm install
npm run dev
```

## Adding a tool

Besides the card in `index.html`, a new page needs a few things for search
engines and link previews:

- a `<title>`, a `<meta name="description">` and a `<link rel="canonical">`;
- Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image`) and
  schema.org JSON-LD: copy them from an existing page, such as
  `apps/cholesterolis/index.html`;
- a 1200×630 JPEG preview in `images/og/`, for example a screenshot of the
  page in a 1200×630 window;
- an entry in `sitemap.xml`.

## Deployment

The site is packaged as an nginx Docker image (see `Dockerfile`; tests run
during the build) and deployed with [Kamal](https://kamal-deploy.org):

```sh
make deploy
```

Or run the **Deploy** workflow from the GitHub Actions tab (manual trigger). It
needs an `SSH_PRIVATE_KEY` repository secret holding a key that can reach the
server.

Configuration lives in `config/deploy.yml`; nginx's (gzip, caching of
Vite's hashed assets, the 404 page) in `config/nginx.conf`.

## License

[MIT](LICENSE)
