# API Documentation

## HTTP Routes

### `GET /`

- Type: SPA entry point
- Handler: Firebase Hosting serves `dist/index.html`
- Behavior: redirects in-app to `/pincode`
- Auth: not required
- Errors: browser-level routing issues only

### `GET /:layer/:district?`

This is the client-side route handled by React Router.

| Field | Details |
|---|---|
| Method | `GET` |
| Params | `layer`, optional `district` |
| Request body | None |
| Auth | Not required |
| Response | Renders the SPA and syncs the route into Zustand state |

Supported layer values in code:

- `pincode`
- `pds`
- `tneb`
- `constituency`
- `police`
- `health`
- `local_bodies_v2`

Important note:

- `public/sitemap.xml` currently contains `local-bodies` URLs, which do not match the live route slug handled by `RouteManager`.

### `GET /api/geocode?address=...`

The only server-side HTTP API route.

| Field | Details |
|---|---|
| Method | `GET` |
| Path | `/api/geocode` |
| Query params | `address` is required |
| Request body | None |
| Auth | Not required |
| Handler | `functions/src/index.ts` `geocodeAddress` |
| Upstream dependency | Google Maps Geocoding API |

#### Request example

```http
GET /api/geocode?address=Chennai%20Central%20Railway%20Station HTTP/1.1
```

#### Success response

The function forwards the Google Geocoding JSON payload and adds cache headers.

#### Error cases

| Condition | Response |
|---|---|
| Missing `address` | `400` with `{ error: "Missing address parameter" }` |
| Missing secret | `500` with `{ error: "Failed to resolve address" }` |
| Upstream Google error | `500` with `{ error: "Failed to resolve address" }` |

### `GET /api/constituency/:id`

Fetches live election results for a given constituency ID from the ECI website.

| Field | Details |
|---|---|
| Method | `GET` |
| Path | `/api/constituency/:id` |
| Params | `id` is required (the constituency AC number) |
| Request body | None |
| Auth | Not required |
| Handler | `functions/src/constituencyApi/index.ts` |
| Upstream dependency | Election Commission of India (ECI) public site |

#### Request example

```http
GET /api/constituency/195 HTTP/1.1
```

#### Success response

The function parses the ECI candidate cards and returns a structured JSON payload:
```json
{
  "constituencyId": 195,
  "candidates": [
    { "name": "Candidate A", "party": "Party X", "votes": 45000, "status": "Leading" }
  ],
  "lastUpdated": 1777885412051
}
```

#### Error cases

| Condition | Response |
|---|---|
| Invalid ID | `400` with `{ error: "Invalid constituency ID" }` |
| Upstream fetch error | `500` with `{ error: "Failed to fetch constituency data" }` |

## Internal Worker Command Surface

The application also has an internal message-based API between the UI and `src/workers/gis.worker.ts`.

| Command | Purpose |
|---|---|
| `INIT_DB` | Boot the worker cache and index setup |
| `LOAD_DISTRICTS` | Load district boundaries |
| `LOAD_STATE_BOUNDARY` | Load Tamil Nadu state boundary |
| `LOAD_PINCODES` | Load pincode polygons and office data |
| `LOAD_PDS_INDEX` | Load the PDS index |
| `LOAD_TNEB_STATEWIDE` | Load statewide TNEB data |
| `LOAD_TNEB_DISTRICT` | Load district-specific TNEB shard |
| `LOAD_CONSTITUENCIES` | Load AC and PC TopoJSON |
| `LOAD_POLICE` | Load police boundaries and station index |
| `LOAD_HEALTH_MANIFEST` | Load health manifest metadata |
| `LOAD_HEALTH_PRIORITY` | Load statewide health facilities |
| `LOAD_HEALTH_DISTRICT` | Load a district health shard |
| `LOAD_HEALTH_SEARCH_INDEX` | Load health search index |
| `FILTER_HEALTH` | Apply health filter rules |
| `RESOLVE_LOCATION` | Resolve a clicked point or coordinate pair |
| `GET_SUGGESTIONS` | Generate search suggestions |
| `SELECT_SUGGESTION` | Resolve a clicked search suggestion |
| `LOAD_PDS` | Load district PDS data and filter by boundary |
| `LOAD_LOCAL_BODIES_V2` | Load the local body V2 layers |
| `RESOLVE_HEALTH_FACILITY` | Resolve a selected health feature |

## Response Shapes

The worker posts typed messages back to the app, such as:

- `DISTRICTS_LOADED`
- `STATE_BOUNDARY_LOADED`
- `SUGGESTIONS_RESULT`
- `RESOLUTION_RESULT`
- `PDS_LOADED`
- `POLICE_LOADED`
- `HEALTH_MANIFEST_LOADED`
- `HEALTH_FILTERED`
- `LOCAL_BODIES_V2_LOADED`
- `ERROR`

