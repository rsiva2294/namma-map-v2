# Database Documentation

## Data Model Summary

There is no SQL database or Prisma schema in this repository. The project uses file-backed GIS datasets plus browser-side caching.

## Storage Layers

| Layer | Location | Purpose |
|---|---|---|
| Static datasets | `public/data/` | Source of truth for all GIS resolution |
| Browser cache | IndexedDB `nammamap-cache` / `gis-data` | Caches fetched GIS payloads |
| Version marker | `public/version.json` | Stores the current build timestamp |
| Client state | Zustand store | Holds UI selections and resolved results |

## Static Dataset Inventory

| Dataset | Folder | Approx. file count | Notes |
|---|---|---:|---|
| Postal districts | `public/data/postal_by_district/` | 38 | Used for pincode and postal office search |
| PDS districts | `public/data/pds_by_district/` | 38 | District-scoped ration shop files |
| TNEB districts | `public/data/tneb_by_district/` | 76 | Boundary and office payloads |
| Police districts | `public/data/police_by_district/` | 78 | Boundary and station files, including validation JSON |
| Health districts | `public/data/health_by_district/` | 38 | District GeoJSON shards |
| Local bodies V2 | `public/data/local_bodies/` | 13 top-level files plus village panchayat shards | Unified civic layer source |

## Key File Families

- `tn_state_boundary.topojson`
- `tn_districts.topojson`
- `tn_assembly_constituencies.topojson`
- `tn_parliamentary_constituencies.topojson`
- `tn_pincodes.topojson`
- `pds_index.json`
- `police_index.json`
- `police_validation.json`
- `health_manifest.json`
- `health_search_index.json`
- `health_statewide_priority.geojson`

## Relationships

The project joins datasets by district or service code rather than by foreign keys.

| Relationship | How It Works |
|---|---|
| District to postal shard | `RouteManager` and the worker use district names to select files in `public/data/postal_by_district/` |
| District to PDS shard | The worker resolves a canonical district identity and loads the corresponding file |
| District to TNEB shard | The worker normalizes district names before loading district JSON |
| Police boundary to station | The worker resolves station-to-boundary matches with metadata plus spatial fallback |
| Health manifest to district shard | `health_manifest.json` maps district names to shard filenames |
| Local body geometry to type | `LocalBodyV2Properties.type` distinguishes corporation, municipality, town panchayat, village panchayat, or unknown |

## IndexedDB Cache Schema

The worker and `cacheService` both use the same store shape.

| Field | Meaning |
|---|---|
| `url` | Cache key |
| `data` | Stored JSON payload |
| `timestamp` | Write time |
| `expiresAt` | Cache expiry timestamp |

This cache is stored in the `nammamap-cache` database and the `gis-data` object store.

## Migration Notes

- No formal migrations are present.
- Dataset updates are file replacements rather than schema migrations.
- If the static data shape changes, the worker, types, and UI cards must be updated together.

## Review Notes

- The repository contains generated static data and build outputs, but no migration tooling.
- If you introduce a real backend database later, this doc should be expanded with schema and migration history.

