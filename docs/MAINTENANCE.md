# Maintenance Documentation

## Common Issues

- Route slug drift between the sidebar, router, sitemap, and canonical tags
- Search UI issues caused by unescaped query text
- Mismatched translation keys returning raw token strings
- District name typos in translation tables
- Large worker startup times on low-end devices

## Debugging Guide

### App Does Not Load Correctly

1. Check the browser console for worker or map errors.
2. Confirm the static data files are present in `public/data/`.
3. Verify `npm run build` succeeded and regenerated `public/version.json`.
4. Confirm the Firebase Hosting rewrite still points `/api/geocode` to the function.

### Search Returns No Results

1. Confirm the active layer matches the dataset you expect.
2. Check whether the worker has loaded the relevant index or district shard.
3. Verify the district slug in the URL is one of the supported values.

### Health Layer Feels Empty

1. Confirm the scope is `STATE`, `DISTRICT`, or `PINCODE` as intended.
2. Check whether the health manifest contains a matching district shard.
3. Review the active filters in `HealthFiltersPanel`.

## Upgrade Risks

| Dependency | Risk |
|---|---|
| React 19 | New rendering behavior can expose effects or state timing bugs |
| Vite 8 | Plugin and build behavior changes may affect the sitemap or PWA build |
| Firebase SDK 12 | Telemetry APIs and auth initialization can change |
| Leaflet / react-leaflet | Map rendering or clustering APIs may shift |
| Sentry plugins | Build-time plugin changes can affect source map upload |

## Refactor Opportunities

- Split `src/workers/gis.worker.ts` into domain-specific worker modules
- Centralize route slug definitions so the router, sidebar, sitemap, and canonical tags share one source of truth
- Add a safe string escape helper for user-entered search text
- Extract repeated result-card formatting into smaller helpers
- Add a typed translation helper for postal and district labels

## Technical Debt List

| Item | Impact |
|---|---|
| `gis.worker.ts` is very large | Harder to test and reason about |
| Route slug mismatch for local bodies | SEO and navigation drift |
| Postal label translation keys do not line up with the translation table | Raw keys can appear in the UI |
| `districtMap` contains a district typo | Incorrect Tamil label in the UI |
| Sitemap is generated from one layer naming convention while the app uses another | Crawl and link consistency issue |
| `src/main.tsx` and `src/lib/firebase.ts` rely on env values that are not fully documented in `.env.example` | Onboarding friction |

## Suggested 30-Day Maintenance Plan

1. Fix route and sitemap slug drift.
2. Fix translation key mismatches and the district typo.
3. Escape the search highlight regex.
4. Split the worker into smaller modules or helper files.
5. Add tests for route normalization, postal labels, and search highlight safety.

