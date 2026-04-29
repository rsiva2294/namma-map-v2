# Security Documentation

## Secrets Handling

| Secret / Variable | Where It Lives | Notes |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Firebase Secret Manager | Used only in `functions/src/index.ts` |
| `VITE_FIREBASE_*` | Client `.env` | Public client configuration by design |
| `VITE_SENTRY_DSN` | Client `.env` | Optional browser telemetry |

## Auth Flow

There is no user authentication flow in the application.

- The app is public.
- The geocoding endpoint is unauthenticated.
- The report flow uses `mailto:` to hand off a correction email to the developer.

## Security Posture

### Good Practices Observed

- No hardcoded Google Maps API key in the frontend
- Geocoding key is injected through Firebase secrets
- CSP, HSTS, frame protection, and referrer policy are configured in `firebase.json`
- The app does not store GPS history server-side
- Tutorial state is stored locally in the browser

### Risks and Gaps

| Risk | Evidence | Recommendation |
|---|---|---|
| Broad CORS on geocode endpoint | `functions/src/index.ts` uses `cors({ origin: true })` | Keep if public access is required, but monitor abuse |
| Relaxed CSP directives | `firebase.json` allows `unsafe-inline` and `unsafe-eval` | Tighten if the build can support it |
| Public analytics and error reporting | `src/lib/firebase.ts`, `src/main.tsx` | Verify consent and privacy messaging |
| Hardcoded support email | `src/components/ReportModal.tsx` | Acceptable for low-risk reporting, but note it in privacy docs |
| Regex-based UI search highlight | `src/components/layout/SearchBar.tsx` | Escape user input before building a regex |

## Vulnerabilities Noticed

- The search highlight helper can throw on regex metacharacters in the query.
- The geocoding endpoint has no authentication or rate limiting in this repository.
- The client uses a permissive CSP that may be acceptable for the current bundle, but it should be reviewed before adding more third-party scripts.

## Recommended Fixes

- Escape search text before using it in `new RegExp(...)`.
- Add monitoring for the geocoding endpoint.
- Consider a lightweight rate limit or abuse control if traffic grows.
- Review the CSP after build output changes.
- Keep the privacy copy in sync with actual analytics and telemetry settings.

