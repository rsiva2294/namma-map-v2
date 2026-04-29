# Setup Documentation

## Prerequisites

- Node.js 22 or compatible runtime
- npm
- Firebase CLI if you plan to run or deploy functions/hosting

## Installation

1. Install dependencies in the repository root with `npm install`.
2. Create a local `.env` from `.env.example`.
3. Add Firebase client values and any optional telemetry settings.
4. If you need the geocoding proxy locally, configure the Firebase Functions secret `GOOGLE_MAPS_API_KEY`.

## Environment Variables

| Variable | Used By | Purpose |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `src/lib/firebase.ts` | Firebase client API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `src/lib/firebase.ts` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | `src/lib/firebase.ts` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `src/lib/firebase.ts` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `src/lib/firebase.ts` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | `src/lib/firebase.ts` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | `src/lib/firebase.ts` | Firebase Analytics measurement ID |
| `VITE_SENTRY_DSN` | `src/main.tsx` | Optional Sentry browser SDK initialization |
| `VITE_DEFAULT_LAT` | client fallback | Default map latitude |
| `VITE_DEFAULT_LNG` | client fallback | Default map longitude |
| `VITE_DEFAULT_ZOOM` | client fallback | Default map zoom |
| `GOOGLE_MAPS_API_KEY` | `functions/src/index.ts` | Firebase Secret Manager secret for geocoding |

Notes:

- `.env.example` documents the Firebase client values and default map settings.
- `VITE_SENTRY_DSN` is used in code, but it is not listed in `.env.example`.
- The geocoding key is not a client env var. It should be stored in Firebase Secret Manager.

## Local Development

### Frontend only

```bash
npm run dev
```

### Frontend + functions emulator

```bash
firebase emulators:start
```

The frontend expects the `/api/geocode` rewrite to be available when you want address resolution.

## Scripts

| Script | What It Does |
|---|---|
| `npm run dev` | Starts Vite |
| `npm run build` | Updates the version stamp, type-checks, builds, and regenerates the sitemap |
| `npm run lint` | Runs ESLint across the repo |
| `npm run preview` | Serves the production build locally |

### Functions package scripts

| Script | What It Does |
|---|---|
| `npm --prefix functions run build` | Type-checks and builds the Cloud Function |
| `npm --prefix functions run serve` | Builds and starts the Firebase emulator |
| `npm --prefix functions run deploy` | Deploys Firebase Functions |

## Build Process

The root build does the following:

1. Updates `public/version.json` and `src/constants.ts`
2. Type-checks the app with `tsc -b`
3. Builds the Vite bundle
4. Regenerates `public/sitemap.xml` from district files

See `package.json` and `scripts/generate-sitemap.cjs`.

## Deployment

### Firebase Hosting

`firebase.json` deploys `dist/` to Firebase Hosting and rewrites `/api/geocode` to the `geocodeAddress` function.

### Firebase Functions

The function bundle lives in `functions/`. Build it with `npm --prefix functions run build` before deploying.

### Recommended deploy flow

1. `npm run build`
2. `npm --prefix functions run build`
3. `firebase deploy`

