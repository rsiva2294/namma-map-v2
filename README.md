# NammaMap V2

NammaMap is a Tamil Nadu civic GIS portal for finding post offices, ration shops, TNEB offices, health facilities, police jurisdictions, constituencies, and local bodies on a single map.

## What It Does

The app combines a React + Leaflet frontend, a Web Worker search/indexing pipeline, static GIS datasets, Firebase Hosting, and a small Cloud Function geocoding proxy. It is designed for fast location search, district-aware navigation, bilingual UI support, and SEO-friendly public landing pages.

## Key Features

- Layered civic discovery for `PINCODE`, `PDS`, `TNEB`, `CONSTITUENCY`, `POLICE`, `HEALTH`, and `LOCAL_BODIES_V2`
- Worker-backed search, geocoding fallback, and spatial resolution
- IndexedDB caching for GIS datasets
- Firebase Analytics, Performance, and Sentry telemetry
- PWA support with update prompts
- English and Tamil translations
- JSON-LD, Open Graph, Twitter, sitemap, and robots support

## Quick Start

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env`
3. Fill in the Firebase client values and optional Sentry value
4. Run the frontend with `npm run dev`
5. Run the Firebase Functions emulator if you need the geocoding proxy

## Scripts

- `npm run dev` - Start the Vite dev server
- `npm run build` - Update the version stamp, type-check, build, and regenerate the sitemap
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build

## Environment Variables

The client reads the `VITE_FIREBASE_*` values from `.env`. The app also uses `VITE_SENTRY_DSN` if you want Sentry initialized in `src/main.tsx`. The geocoding function uses the Firebase Secret Manager secret `GOOGLE_MAPS_API_KEY`.

See [docs/SETUP.md](docs/SETUP.md) for the full setup guide and variable table.

## Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Style Guide](docs/STYLE_GUIDE.md)
- [Setup Guide](docs/SETUP.md)
- [Codebase Guide](docs/CODEBASE.md)
- [API Reference](docs/API.md)
- [Data and Storage](docs/DATABASE.md)
- [SEO Audit](docs/SEO.md)
- [Security Notes](docs/SECURITY.md)
- [Maintenance Guide](docs/MAINTENANCE.md)

## Repository Notes

- The root app route is a React SPA route, not a server-rendered page route.
- The only HTTP API route is `/api/geocode`, which is rewritten to a Firebase Function.
- Static GIS assets live in `public/data/`.
- Browser cache state lives in IndexedDB under `nammamap-cache`.

## Support Files

- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `ROADMAP.md`
- `docs/user_guide.md`

## Live App

[https://namma-map.web.app](https://namma-map.web.app)
