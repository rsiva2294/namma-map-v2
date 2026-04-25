# NammaMap V2 Technical Onboarding Guide

This document is the detailed developer onboarding reference for NammaMap V2. It is meant to give a new engineer enough context to understand how the application works, how data flows through the system, which datasets power each feature, and which keys are used for search and resolution so they can contribute without needing constant handholding.

## 1. What The App Is

NammaMap V2 is a client-side GIS application for Tamil Nadu. It renders multiple public-service layers on top of a Leaflet map and lets the user:

- search for places, offices, districts, constituencies, police stations, and PDS shops,
- click the map to resolve jurisdiction for the active service layer,
- inspect structured result cards for the resolved entity,
- get driving directions through Google Maps,
- report data corrections through a mailto-driven modal.

The app currently exposes five service layers:

- `PINCODE`
- `PDS`
- `TNEB`
- `CONSTITUENCY`
- `POLICE`

There is no backend API in this repo. All runtime data is served as static files from `public/data` and processed in-browser.

## 2. Stack And Runtime Model

From [package.json](C:/projects/nammamap-v2/v2/package.json):

- UI framework: React 19
- Bundler/dev server: Vite
- Map engine: Leaflet with `react-leaflet`
- State management: Zustand
- Spatial indexing: `rbush`
- Topology conversion: `topojson-client`
- Motion/UI animation: `framer-motion`
- Icons: `lucide-react`
- Testing dependency present: Vitest

### Why the app feels responsive

The main architectural choice is that all heavy GIS work lives in the worker at [src/workers/gis.worker.ts](C:/projects/nammamap-v2/v2/src/workers/gis.worker.ts). The React tree never parses large TopoJSON files directly and never performs polygon resolution on the main thread.

At a high level:

1. React renders the UI shell and map container.
2. The custom hook [src/hooks/useGisWorker.ts](C:/projects/nammamap-v2/v2/src/hooks/useGisWorker.ts) creates a web worker.
3. The worker lazily loads static GIS datasets.
4. User search and map clicks are turned into worker messages.
5. The worker returns search suggestions or resolution payloads.
6. Zustand state in [src/store/useMapStore.ts](C:/projects/nammamap-v2/v2/src/store/useMapStore.ts) is updated.
7. The map and cards re-render from store state.

## 3. Repository Areas That Matter

Relevant folders and files:

- [src/App.tsx](C:/projects/nammamap-v2/v2/src/App.tsx): top-level app shell
- [src/features/map/GisMap.tsx](C:/projects/nammamap-v2/v2/src/features/map/GisMap.tsx): Leaflet map, layer rendering, click handling
- [src/hooks/useGisWorker.ts](C:/projects/nammamap-v2/v2/src/hooks/useGisWorker.ts): bridge between React and the worker
- [src/workers/gis.worker.ts](C:/projects/nammamap-v2/v2/src/workers/gis.worker.ts): all data loading, indexing, search, and point-in-polygon resolution
- [src/store/useMapStore.ts](C:/projects/nammamap-v2/v2/src/store/useMapStore.ts): application state and actions
- [src/components/layout/SearchBar.tsx](C:/projects/nammamap-v2/v2/src/components/layout/SearchBar.tsx): text search and suggestion picker
- [src/components/layout/Sidebar.tsx](C:/projects/nammamap-v2/v2/src/components/layout/Sidebar.tsx): layer switching
- [src/components/layout/ResultContainer.tsx](C:/projects/nammamap-v2/v2/src/components/layout/ResultContainer.tsx): decides which detail card to show
- [src/components/ResultCard.tsx](C:/projects/nammamap-v2/v2/src/components/ResultCard.tsx): reusable card UI
- [src/components/ReportModal.tsx](C:/projects/nammamap-v2/v2/src/components/ReportModal.tsx): issue reporting flow
- [src/types/gis.ts](C:/projects/nammamap-v2/v2/src/types/gis.ts): shared geometry and property contracts
- `public/data/*`: all GIS/static data consumed by the app
- [scripts/generate_pds_index.cjs](C:/projects/nammamap-v2/v2/scripts/generate_pds_index.cjs): builds search index for PDS shops
- [scripts/pds_audit.cjs](C:/projects/nammamap-v2/v2/scripts/pds_audit.cjs): validates the PDS district manifest

## 4. End-To-End Flow By User Action

### App startup

Startup path:

1. [src/main.tsx](C:/projects/nammamap-v2/v2/src/main.tsx) renders `<App />` into `#root`.
2. [src/App.tsx](C:/projects/nammamap-v2/v2/src/App.tsx) mounts:
   - `Sidebar`
   - lazy-loaded `GisMap`
   - `SearchBar`
   - `ResultContainer`
   - `ReportModal`
3. `GisMap` calls `useGisWorker()`.
4. The hook creates the worker and sends `INIT_DB`.
5. The worker immediately replies with `READY`.
6. Once ready, `GisMap` triggers these loads in parallel:
   - `LOAD_DISTRICTS`
   - `LOAD_STATE_BOUNDARY`
   - `LOAD_PINCODES`
   - `LOAD_TNEB`
   - `LOAD_PDS_INDEX`
   - `LOAD_CONSTITUENCIES`
   - `LOAD_POLICE`

This means the app eagerly prepares almost every layer on startup except district-specific PDS point files, which are loaded lazily.

### Typing into search

Search flow:

1. The user types in [src/components/layout/SearchBar.tsx](C:/projects/nammamap-v2/v2/src/components/layout/SearchBar.tsx).
2. `searchQuery` is updated in Zustand and `isUserTyping` is set to `true`.
3. In [src/features/map/GisMap.tsx](C:/projects/nammamap-v2/v2/src/features/map/GisMap.tsx), a `useEffect` watches `searchQuery`.
4. If `isUserTyping` is true and query length is at least 3 characters, `GET_SUGGESTIONS` is sent to the worker.
5. The worker searches all loaded indexes/datasets and returns `SUGGESTIONS_RESULT`.
6. Suggestions are rendered in the dropdown.
7. Clicking a suggestion stores it in `selectedSuggestion` and clears the dropdown.
8. Another `useEffect` in `GisMap` calls `selectSuggestion(...)` from the worker hook.

### Clicking on the map

Map-click resolution flow:

1. `MapEvents` in [src/features/map/GisMap.tsx](C:/projects/nammamap-v2/v2/src/features/map/GisMap.tsx) listens for Leaflet click events.
2. It calls `resolveLocation(lat, lng, activeLayer)`.
3. `useGisWorker.ts` sends `RESOLVE_LOCATION` with:
   - `lat`
   - `lng`
   - `layer`
   - `keepSelection`
   - `constituencyType` when relevant
4. The worker picks the correct spatial index for the active layer and performs point-in-polygon resolution.
5. The worker returns `RESOLUTION_RESULT`.
6. The hook updates the store differently depending on `payload.layer`.

### Clicking “Locate me”

Geolocation flow:

1. `SearchBar` sets `triggerLocateMe` to `true`.
2. `GisMap` watches that flag and calls `navigator.geolocation.getCurrentPosition(...)`.
3. On success it forwards the coordinates to the same `resolveLocation(...)` path used by map clicks.
4. On failure it shows a browser `alert()`.

### Reporting an issue

Reporting flow:

1. `ResultContainer` builds a reduced `reportContext` object with only important fields.
2. It opens `ReportModal` through Zustand.
3. [src/components/ReportModal.tsx](C:/projects/nammamap-v2/v2/src/components/ReportModal.tsx) formats a `mailto:` URL.
4. The user’s mail client opens with prefilled structured text.
5. Recipient is currently hard-coded to `rsiva2294@gmail.com`.

There is no server-side ingestion or ticket creation in this repo.

## 5. Global State Model

All app state lives in [src/store/useMapStore.ts](C:/projects/nammamap-v2/v2/src/store/useMapStore.ts).

Important state fields:

- `activeLayer`: current service mode
- `searchQuery`: text in the search input
- `searchSuggestions`: dropdown results from worker search
- `selectedSuggestion`: transient selection used to trigger post-selection logic
- `searchResult`: current polygon/feature being highlighted
- `districtsData`: statewide district boundaries
- `stateBoundaryData`: Tamil Nadu outer boundary
- `pdsData`: currently loaded district-scoped PDS points
- `selectedPdsShop`: clicked PDS point
- `activeDistrict`: canonical district name currently backing `pdsData`
- `jurisdictionDetails`: TNEB office metadata
- `jurisdictionGeometry`: selected TNEB or police polygon geometry
- `policeResolution`: resolved police boundary + matched station + debug metadata
- `selectedPoliceStation`: point feature built from police station properties
- `constituencyType`: `AC` or `PC`
- `noDataFound`: indicates a click inside Tamil Nadu but outside the loaded active-layer coverage
- `lastClickedPoint`: stored only when no data was found
- `theme`, `isSidebarOpen`, `isResolving`, `isLocating`: UI state
- `isReportModalOpen`, `reportContext`: reporting flow state

### Important store behavior to understand

#### `setActiveLayer(...)`

When the layer changes, the store intentionally clears layer-specific state:

- `jurisdictionDetails`
- `jurisdictionGeometry`
- `selectedPdsShop`
- `selectedPoliceStation`
- `policeResolution`
- `searchResult`

This is why layer changes feel like context switches rather than overlays.

#### `setSearchResult(result, keepSelection, updateQuery)`

This method does more than store a feature:

- it optionally preserves or clears existing layer-specific selection,
- it can rewrite the visible search input,
- for constituency and police features it constructs a more descriptive search label.

The query rewrite logic uses this fallback order:

- number source: `assembly_1` -> `parliament` -> `ps_code`
- base name source: `ps_name` -> `assembly_c` -> `parliame_1` -> `office_name` -> `district` -> `NAME`
- type prefix: `Station` if `ps_name` exists, `AC` if `assembly_c` exists, `PC` if `parliame_1` exists
- pin source: `PIN_CODE` -> `pincode`

So a rewritten query can end up as:

- `607403 - Mathalapattu`
- `AC #3 - Tiruttani`
- `PC #1 - Tiruvallur (SC)`
- `Station #P11 - BAGAYAM`

#### `setNoDataFound(...)`

When this is set to `true`, the store intentionally clears other result state so only the “No Information Found” card appears.

## 6. Worker Message Contract

The React app and worker communicate with string message types.

Messages sent from UI to worker:

- `INIT_DB`
- `LOAD_DISTRICTS`
- `LOAD_STATE_BOUNDARY`
- `LOAD_PDS_INDEX`
- `LOAD_PINCODES`
- `LOAD_TNEB`
- `LOAD_PDS`
- `LOAD_CONSTITUENCIES`
- `LOAD_POLICE`
- `GET_SUGGESTIONS`
- `RESOLVE_LOCATION`
- `AUDIT_POLICE` (debug/admin utility, not wired in UI)

Messages returned from worker:

- `READY`
- `DISTRICTS_LOADED`
- `STATE_BOUNDARY_LOADED`
- `SUGGESTIONS_RESULT`
- `RESOLUTION_RESULT`
- `PDS_LOADED`
- `CONSTITUENCIES_LOADED`
- `POLICE_LOADED`
- `PDS_INDEX_LOADED`
- `TNEB_LOADED`
- `PINCODES_LOADED`
- `AUDIT_RESULT`
- `ERROR`

## 7. Data Inventory And What Each Module Consumes

The app consumes the following static datasets from `public/data`.

### Dataset inventory and counts in this workspace

- `tn_districts.topojson`: 38 district features
- `tn_state_boundary.topojson`: 1 state boundary feature
- `tn_pincodes.topojson`: 2044 pincode polygons
- `tneb_boundaries.topojson`: 2817 TNEB polygons
- `tneb_offices.geojson`: 2812 TNEB office points
- `tn_assembly_constituencies.topojson`: 234 AC polygons
- `tn_parliamentary_constituencies.topojson`: 39 PC polygons
- `tn_police_boundaries.topojson`: 1333 police boundary polygons
- `tn_police_stations.geojson`: 1315 police station points
- `pds_manifest.json`: 38 canonical PDS district identities, 54 aliases
- `pds_index.json`: 34,746 flattened PDS search rows
- `public/data/pds_by_district/*.json`: 38 district-specific point datasets
- `police_crosswalk.json`: optional file, not present in this workspace

### 7.1 District boundaries

File: `public/data/tn_districts.topojson`

Loaded by:

- `LOAD_DISTRICTS` in worker
- rendered in `PINCODE` mode as the background layer
- searched in `GET_SUGGESTIONS`

Schema from first feature:

- `gid`
- `district_n`
- `edistric_c`
- `lgd_code`
- `rd_lgd_cod`
- `district_1` (Tamil name)
- `search_string`

How the app uses it:

- background visualization in `PINCODE` mode
- district suggestion search
- district name fallback during other flows

District search lookup order:

- `district`
- `DISTRICT`
- `NAME`
- `district_n`

In practice, district polygons use `district_n`, but the code supports alternate property names because not every dataset is normalized.

### 7.2 State boundary

File: `public/data/tn_state_boundary.topojson`

Loaded by:

- `LOAD_STATE_BOUNDARY`
- rendered as the background for `PDS`, `TNEB`, and `POLICE`
- used to determine whether a click is inside Tamil Nadu when no service-layer feature is found

Schema from first feature:

- `ogc_fid`
- `state_name`
- `state_code`
- `state_tami`
- `geom`
- `search_string`

Important behavior:

- The state boundary is not used to resolve service ownership.
- It is only used as a containment guard for the “No Information Found” experience.

### 7.3 Pincode boundaries

File: `public/data/tn_pincodes.topojson`

Loaded by:

- `LOAD_PINCODES`
- searched in `GET_SUGGESTIONS`
- resolved in `RESOLVE_LOCATION` for both `PINCODE` and `PDS`
- highlighted in the map and displayed in cards

Schema from first feature:

- `ogc_fid`
- `pin_code`
- `pincode`
- `office_nam`
- `office_name`
- `office_typ`
- `circle_nam`
- `region_nam`
- `division_n`
- `state`
- `district`
- `search_string`

Why both `pin_code` and `pincode` exist:

The source data contains duplicate naming variants. The app mostly reads uppercase/lowercase variants defensively.

Pincode search lookup logic:

- pin match: `PIN_CODE` or `pincode`, then `startsWith(query)`
- text match: `search_string` or `office_name`, then `includes(query)`

Important note:

The dataset sample uses lowercase `pin_code`, but the UI/store code usually checks `PIN_CODE` or `pincode`. This works here because the dataset also has `pincode`. If a future dataset drops `pincode` and keeps only `pin_code`, some UI formatting paths will miss the value unless the code is updated.

Pincode card lookup keys:

- display title: `office_name` -> `district` -> `NAME`
- pincode: `PIN_CODE` -> `pincode`
- district: `district`
- office type: `office_typ`
- region: `region_nam`

### 7.4 PDS district manifest

File: `public/data/pds_manifest.json`

Loaded by:

- `LOAD_PDS_INDEX`
- used by `resolveDistrictIdentity(...)`

Schema per entry:

- `id`: canonical internal district id, lowercase slug
- `display_name`: user-facing district name
- `pds_file`: basename of JSON file in `public/data/pds_by_district`
- `aliases`: accepted district-name variants

Purpose:

This manifest is the normalization layer that maps district names coming from pincode polygons or searches to the correct PDS district file.

Example aliases handled by the app:

- `CHENGALPET`, `CHENGALPATTU`
- `THIRUCHIRAPALLI`, `TIRUCHIRAPPALLI`, `TRICHY`
- `TUTICORIN`, `THOOTHUKUDI`, `THOOTHUKKUDI`
- `CHENNAI`, `NORTHCHENNAI`, `SOUTHCHENNAI`

District identity resolution logic:

1. Normalize input by trimming, uppercasing, and removing non-alphanumeric characters.
2. Try exact alias match against every manifest alias.
3. If no alias matches, try normalized equality against:
   - `id`
   - `display_name`
4. If no match is found, PDS loading fails and the worker emits `ERROR`.

### 7.5 PDS search index

File: `public/data/pds_index.json`

Generated by: [scripts/generate_pds_index.cjs](C:/projects/nammamap-v2/v2/scripts/generate_pds_index.cjs)

Row format:

- index `0`: `shop_code`
- index `1`: `name`
- index `2`: `taluk`
- index `3`: `district`
- index `4`: `lat`
- index `5`: `lng`

Purpose:

This is the global lightweight search index for PDS shops. The app does not load all 38 district GeoJSON files at startup for search. Instead it searches this flattened array and loads the relevant district file only after a selection is made.

PDS suggestion lookup logic:

- name contains query
- or shop code contains query
- or taluk contains query

Returned suggestion payload shape for PDS search is synthetic, not raw dataset shape:

- `properties.shop_code`
- `properties.name`
- `properties.taluk`
- `properties.district`
- `properties.office_location = [lng, lat]`
- `geometry.type = Point`
- `geometry.coordinates = [lng, lat]`
- `suggestionType = PDS_SHOP`

### 7.6 District-specific PDS shop datasets

Files: `public/data/pds_by_district/*.json`

Loaded by:

- `LOAD_PDS` only when needed

Schema from sample file `Ariyalur.json`:

- `district`
- `taluk`
- `village`
- `name`
- `area_type`
- `shop_code`
- `search_string`

Geometry:

- `Point` coordinates `[lng, lat]`

How PDS works in the app:

1. The app resolves a pincode polygon first.
2. It extracts a district name from the selected polygon.
3. The worker maps that district through the manifest.
4. The worker loads `public/data/pds_by_district/<pds_file>.json`.
5. If a boundary geometry was supplied, the worker filters only shops that fall inside the selected polygon.
6. Those points are rendered as `CircleMarker`s.
7. Clicking a point sets `selectedPdsShop` and opens the detail card.

District lookup fallback used when moving from a selected polygon into PDS mode:

- `district`
- `DISTRICT`
- `DISTRICT_NAME`
- `NAME`
- `district_n`

This is one of the most important fallback chains in the app because multiple datasets use different district key names.

### 7.7 TNEB boundaries

File: `public/data/tneb_boundaries.topojson`

Loaded by:

- `LOAD_TNEB`
- resolved in `RESOLVE_LOCATION` when `activeLayer === 'TNEB'`

Schema from first feature:

- `ogc_fid`
- `section_na`
- `section_co`
- `subdivisio`
- `subdivis_1`
- `region_cod`
- `circle_cod`
- `ssmaecode`
- `division_c`
- `region_nam`
- `circle_nam`
- `section_ty`
- `division_n`
- `search_string`

These are polygon boundaries. They are not used directly for search suggestions.

### 7.8 TNEB offices

File: `public/data/tneb_offices.geojson`

Loaded alongside TNEB boundaries by `LOAD_TNEB`.

Schema from first feature:

- `section_na`
- `section_co`
- `subdivisio`
- `region_id`
- `subdivis_1`
- `division_n`
- `division_c`
- `circle_nam`
- `circle_cod`
- `region_nam`
- `object_id`
- `search_string`

These are point features and they serve two jobs:

- search suggestions for TNEB
- optional office marker placement after a TNEB boundary is resolved

#### TNEB join logic between polygon and office point

When a user clicks a location in TNEB mode:

1. The worker resolves the clicked point against `tnebIndex` using polygon geometry.
2. It then looks for a matching office point in `tnebOffices.features`.
3. Matching uses a three-part join:
   - `section_co`
   - `circle_cod`
   - `region_id` or `region_cod`

The actual worker code checks:

- office `section_co` === boundary `section_co`
- office `circle_cod` === boundary `circle_cod`
- office `(region_id || region_cod)` === boundary `(region_cod || region_id)`

This is a defensive join because the source schemas are not perfectly aligned.

#### TNEB search lookup logic

TNEB suggestions search only office points, not polygons.

Lookup order:

- `section_na`
- `section_office`

The code uses `includes(query)` after lowercasing.

#### TNEB detail card field mapping

The result card uses these fallbacks:

- title: `section_na` -> `section_office`
- section code: `section_co`
- sub-division: `subdivisio` -> `sub_division`
- sub-division code: `subdivis_1` -> `sub_div_co`
- division: `division_n` -> `division`
- division code: `division_c` -> `div_cod`
- circle: `circle_nam` -> `circle`
- circle code: `circle_cod`
- region: `region_nam` -> `region`
- region code: `region_id` -> `region_cod`

Note that `sub_division`, `sub_div_co`, `division`, `div_cod`, `circle`, and `region` are not present in the sample assets, but the UI supports them.

### 7.9 Assembly constituencies

File: `public/data/tn_assembly_constituencies.topojson`

Loaded by:

- `LOAD_CONSTITUENCIES`
- rendered when `activeLayer === 'CONSTITUENCY'` and `constituencyType === 'AC'`
- searched in `GET_SUGGESTIONS`
- resolved spatially when clicking the map in AC mode

Schema from first feature:

- `district_n`
- `district_c`
- `assembly_c`
- `assembly_1`
- `parliament`
- `parliame_1`
- `parliame_2`
- `status`

AC search logic:

- search only `assembly_c` with `includes(query)`

AC result card logic:

- title: `assembly_c`
- AC number: `assembly_1`
- district: `district_n`
- parent parliamentary constituency: `parliame_1`

### 7.10 Parliamentary constituencies

File: `public/data/tn_parliamentary_constituencies.topojson`

Loaded by the same `LOAD_CONSTITUENCIES` path.

Schema from first feature:

- `state_name`
- `state_code`
- `parliament`
- `parliame_1`

PC search logic:

- search only `parliame_1` with `includes(query)`

PC result card logic:

- title: `parliame_1`
- PC number: `parliament`
- state is hard-coded in UI as `Tamil Nadu`

Important distinction:

The worker resolves AC and PC using different spatial indexes:

- `acIndex` when `constituencyType === 'AC'`
- `pcIndex` when `constituencyType === 'PC'`

### 7.11 Police jurisdiction boundaries

File: `public/data/tn_police_boundaries.topojson`

Loaded by:

- `LOAD_POLICE`
- resolved in `POLICE` mode

Schema from first feature:

- `ciprus_loc`
- `district_n`
- `e_district`
- `ed_taluk_c`
- `police_dis`
- `police_s_1`
- `police_s_2`
- `police_sta`
- `taluk_name`

Meaning of important keys:

- `police_s_1`: primary boundary station code
- `police_sta`: primary boundary station name alias
- `police_s_2`: secondary boundary station name alias
- `ciprus_loc`: boundary id used for optional crosswalk overrides

### 7.12 Police station points

File: `public/data/tn_police_stations.geojson`

Loaded alongside police boundaries by `LOAD_POLICE`.

Schema from first feature:

- `ps_code`
- `ps_name`
- `name`
- `dept_code`
- `status`

During load, the worker mutates every station feature to add:

- `station_location = geometry.coordinates`

That field is later used by the UI for directions and by store helpers.

### 7.13 Optional police crosswalk

Optional file: `public/data/police_crosswalk.json`

Purpose:

This can manually map a boundary id to a station code when heuristic matching is unreliable.

Expected behavior when present:

- key: boundary id, normally `ciprus_loc`
- value: target station `ps_code`

Current workspace status:

- file does not exist
- therefore all police matching is currently heuristic

## 8. Search System: Exact Keys And Matching Rules

The search system is implemented in the `GET_SUGGESTIONS` case inside [src/workers/gis.worker.ts](C:/projects/nammamap-v2/v2/src/workers/gis.worker.ts).

General rules:

- queries are trimmed and lowercased
- queries shorter than 1 character are ignored in the worker, but the UI only asks for suggestions from 3 characters onward
- each category has its own search logic and local result cap
- final results are truncated to 8 total suggestions

Category-by-category behavior:

### District suggestions

Source: `districtsGeoJson`

Match against:

- `district`
- `DISTRICT`
- `NAME`
- `district_n`

Rule:

- `searchBase.includes(query)`
- take first 5

Returned `suggestionType`:

- `DISTRICT`

### Pincode suggestions

Source: `pincodesGeoJson`

Match against:

- pincode: `PIN_CODE` -> `pincode`
- text blob: `search_string` -> `office_name`

Rule:

- pincode uses `startsWith(query)`
- text uses `includes(query)`
- take first 5

Returned `suggestionType`:

- `PINCODE`

### TNEB suggestions

Source: `tnebOffices`

Match against:

- `section_na`
- `section_office`

Rule:

- `includes(query)`
- take first 5

Returned `suggestionType`:

- `TNEB_SECTION`

### PDS suggestions

Source: `pdsIndex`

Match against row positions:

- `[1]` name
- `[0]` shop code
- `[2]` taluk

Rule:

- any field `includes(query)`
- take first 5

Returned `suggestionType`:

- `PDS_SHOP`

### Constituency suggestions

Sources:

- AC dataset searches `assembly_c`
- PC dataset searches `parliame_1`

Rule:

- `includes(query)`
- AC capped to 3
- PC capped to 3

Returned `suggestionType`:

- `CONSTITUENCY`

### Police suggestions

Source: `policeStationsGeoJson`

Match against:

- `ps_name`

Rule:

- `includes(query)`
- take first 3

Returned `suggestionType`:

- `POLICE_STATION`

### Search ordering and UX impact

The worker appends results in this fixed order:

1. districts
2. pincodes
3. TNEB offices
4. PDS shops
5. assembly constituencies
6. parliamentary constituencies
7. police stations

Then it slices to 8 total suggestions.

This means later categories can be crowded out when earlier categories return many matches. That is current behavior, not a bug in rendering.

## 9. Spatial Resolution System By Layer

All click resolution uses `findFeatureAt(...)` plus the appropriate RBush index.

### Shared spatial mechanics

- Each polygon dataset is converted to a GeoJSON feature collection when loaded.
- Every feature gets a bounding box through `getBBox(...)`.
- The worker loads those boxes into `RBush` indexes.
- On resolution, the index is searched using a tiny buffer around the clicked point.
- Candidate features then go through polygon containment using `isPointInPolygon(...)`.

Spatial indexes in the worker:

- `pincodesIndex`
- `tnebIndex`
- `stateBoundaryIndex`
- `acIndex`
- `pcIndex`
- `policeBoundariesIndex`
- `policeStationsIndex`
- `pdsIndexes` per district

### `PINCODE` resolution

Active index:

- `pincodesIndex`

Returned payload:

- resolved polygon properties
- resolved polygon geometry
- `layer: 'PINCODE'`

Outcome in UI:

- highlighted polygon
- pincode result card

### `PDS` resolution

First step uses the same index as `PINCODE`:

- `pincodesIndex`

Why:

PDS mode is boundary-first, shop-second. The user resolves a pincode polygon, and then the app loads only the PDS shops inside that polygon’s district/boundary.

Returned payload from the first click:

- resolved pincode polygon properties
- resolved pincode polygon geometry
- `layer: 'PDS'`

Then the hook extracts district fields using:

- `district`
- `DISTRICT`
- `DISTRICT_NAME`
- `NAME`

If a district is found, the worker receives `LOAD_PDS` with:

- `district`
- `boundary`

### `TNEB` resolution

Active index:

- `tnebIndex`

After polygon resolution, office point matching uses:

- `section_co`
- `circle_cod`
- `region_id` or `region_cod`

Returned payload:

- polygon properties merged with `office_location`
- polygon geometry
- `layer: 'TNEB'`

Outcome in UI:

- highlighted section polygon
- office marker at `office_location` if available, otherwise polygon bounds center
- TNEB result card

### `CONSTITUENCY` resolution

Active index depends on `constituencyType`:

- `acIndex` for `AC`
- `pcIndex` for `PC`

Returned payload:

- polygon properties
- polygon geometry
- `layer: 'CONSTITUENCY'`
- `constituencyType`

Outcome in UI:

- highlighted constituency polygon
- constituency result card

### `POLICE` resolution

Active index:

- `policeBoundariesIndex`

After polygon resolution, the worker runs `resolvePoliceStation(...)` to match the boundary polygon to the best police station point.

Returned payload:

- `boundary`
- `station`
- `confidence`
- `reason`
- `debug`
- `layer: 'POLICE'`

Outcome in UI:

- highlighted police polygon
- station marker if a station match exists
- police result card with confidence and debug detail in dev mode

### No-hit behavior

If no feature is found in the active layer:

1. The worker checks whether the point is inside Tamil Nadu using `stateBoundaryIndex`.
2. If yes, `noDataFound` is set to `true`.
3. If not, the UI shows nothing special.

This distinction avoids showing “missing data” for clicks outside the state.

## 10. Police Resolution Pipeline In Detail

Police matching is the most complex logic in the repo.

Code location:

- `resolvePoliceStation(...)` in [src/workers/gis.worker.ts](C:/projects/nammamap-v2/v2/src/workers/gis.worker.ts)

### Inputs used for matching

From the boundary polygon:

- boundary id: `ciprus_loc`, otherwise derived string
- primary code: `police_s_1`
- aliases: `police_sta`, `police_s_2`
- district: `district_n`
- centroid of polygon

From each station point:

- station code: `ps_code`, otherwise inferred from name prefix
- station aliases: `ps_name`, `name`
- point coordinates
- optional `district`

### Normalization helpers

The worker uses several helpers before matching:

- `normalizePoliceName(...)`
  - uppercases
  - removes punctuation drift
  - collapses spaces
  - normalizes “POLICE STATION” and “P S” to `PS`
  - strips trailing `PS`
  - applies one spelling drift patch: `TCH` -> `CH`
- `stripCodePrefix(...)`
  - removes leading code fragments like `B1 ` or `R3.`
- `extractPoliceCode(...)`
  - extracts prefix patterns like `R3`, `J2`, `P48`
- `getAliasStrength(...)`
  - computes similarity score from 0 to 1 using exact, condensed, partial, and token overlap checks

### Resolution stages

1. Manual override through `police_crosswalk.json` if present.
2. Iterate through every station and score it.
3. Use these signals:
   - exact code match
   - alias similarity strength
   - whether station point falls inside the boundary polygon
   - distance from station to boundary centroid
   - distance from station to clicked point
   - optional district-name agreement
4. Pick the highest score.
5. Break ties using smaller centroid distance.
6. If nothing scores well enough, fall back to the nearest station if within `0.15` distance units.

### Confidence levels

The worker assigns one of:

- `exact`
- `high`
- `medium`
- `low`
- `unresolved`

Broad scoring intent:

- `exact`: code match plus strong alias agreement
- `high`: strong alias match, optionally helped by inside-boundary or district agreement
- `medium`: code + moderate alias, or alias + spatial validation
- `low`: inside-boundary fallback or weak metadata fallback
- `unresolved`: nothing convincing found

### What the UI exposes from police matching

User-facing result card always shows:

- confidence
- resolved jurisdiction name and boundary code
- mapped station name and station code if one was found

In dev mode only (`import.meta.env.DEV`):

- match basis reason
- resolver method
- alias match percentage for non-exact, non-unresolved matches
- whether the point lies inside the chosen boundary

This is valuable when tuning data quality.

## 11. Layer-Specific UI Behavior

### PINCODE layer

Map behavior:

- background district polygons are shown
- selected pincode polygon is highlighted in blue

Card behavior:

- shows office name, pincode, district, office type, region

### PDS layer

Map behavior:

- state boundary is shown as background
- first selection is still a pincode polygon
- after district PDS data loads, shops appear as red `CircleMarker`s
- clicking a shop selects it and swaps instruction card for detail card

Card behavior:

- before shop click: instruction card
- after shop click: shop detail card with code, village, taluk, district

### TNEB layer

Map behavior:

- state boundary background
- selected TNEB polygon shown in orange dashed styling
- office marker uses `office_location` or polygon center fallback

Card behavior:

- shows section, subdivision, division, circle, region

### CONSTITUENCY layer

Map behavior:

- full AC or PC dataset is shown as background depending on `constituencyType`
- selected polygon highlighted in indigo

Card behavior:

- AC card: number, district, parliamentary constituency
- PC card: number and state

### POLICE layer

Map behavior:

- state boundary background
- selected police polygon highlighted in slate styling
- police station marker appears when a station match exists

Card behavior:

- confidence pill
- jurisdiction name + boundary code
- station name + station code when resolved
- fallback unresolved message otherwise

## 12. Map Rendering Details That Matter For Developers

The map component is [src/features/map/GisMap.tsx](C:/projects/nammamap-v2/v2/src/features/map/GisMap.tsx).

Important details:

- base map uses CARTO light/dark tiles, switched by theme
- map bounds are constrained to Tamil Nadu-ish extents
- `MapController` flies to selected geometry bounds, not just markers
- sidebar state affects left padding during fly-to, so selections remain visible behind the floating UI
- result highlighting depends on either `searchResult` or `jurisdictionGeometry`

A subtle but important behavior:

- `searchResult` is used for pincode, district, and constituency-style area selection
- `jurisdictionGeometry` is used for TNEB and police polygons

That is why some cards are keyed off `searchResult` while others are keyed off `jurisdictionDetails` or `policeResolution`.

## 13. Data Normalization And Fallback Strategy

The codebase assumes source datasets are inconsistent. Instead of hard-normalizing everything up front, the app uses fallback chains at the point of use.

Common fallback groups used throughout the code:

### District name fallbacks

- `district`
- `DISTRICT`
- `DISTRICT_NAME`
- `NAME`
- `district_n`

### Pincode fallbacks

- `PIN_CODE`
- `pincode`

Potential gap:

- the sample dataset also includes `pin_code`, which is not always consulted outside the worker search path

### Area display name fallbacks

- `office_name`
- `district`
- `NAME`

### Constituency display name fallbacks

- `assembly_c`
- `parliame_1`

### TNEB display name fallbacks

- `section_na`
- `section_office`

### Police display fields

- station name: `ps_name`
- boundary name: `police_sta`
- station code: `ps_code`
- boundary code: `police_s_1`

When extending the app, developers should preserve these fallbacks unless they are also normalizing all upstream datasets and updating every usage site.

## 14. Caching And Performance Behavior

The worker caches loaded data in module scope.

In-memory caches:

- `districtsGeoJson`
- `stateBoundaryGeoJson`
- `pdsIndex`
- `pdsManifest`
- `pincodesGeoJson`
- `tnebGeoJson`
- `tnebOffices`
- `acGeoJson`
- `pcGeoJson`
- `policeBoundariesGeoJson`
- `policeStationsGeoJson`
- `loadedPds` map keyed by canonical district id
- `pdsIndexes` map keyed by canonical district id

Important implications:

- datasets are fetched only once per page session
- PDS district files are cached after first load
- PDS district filtering is fast after the first load because each district gets its own RBush point index

`fetchWithRetry(...)` retries failed fetches 3 times with 1-second delay.

## 15. Scripts And Data Maintenance

### `generate_pds_index.cjs`

File: [scripts/generate_pds_index.cjs](C:/projects/nammamap-v2/v2/scripts/generate_pds_index.cjs)

Purpose:

- scans every file in `public/data/pds`
- extracts `shop_code`, `name`, `taluk`, `district`, and coordinates
- writes flattened `public/data/pds_index.json`

Use this after adding or modifying district PDS files.

### `pds_audit.cjs`

File: [scripts/pds_audit.cjs](C:/projects/nammamap-v2/v2/scripts/pds_audit.cjs)

Purpose:

- validates manifest-referenced district files exist
- detects duplicate alias mappings
- warns about orphan PDS district files not referenced in the manifest

Use this after editing `pds_manifest.json`.

## 16. Current Constraints, Risks, And Gotchas

These are the things a new developer is most likely to trip over.

### 1. Data schemas are similar, not uniform

The app relies heavily on fallback property access because different datasets use different key names for conceptually identical fields. New code should avoid assuming one canonical property name unless the data pipeline is being standardized first.

### 2. Search and display keys are not always the same

Example:

- the worker search path for pincodes can use `search_string`
- the UI title path for a selected pincode uses `office_name`

A dataset can therefore be searchable but not display perfectly if a display fallback is missing.

### 3. `pin_code` is under-supported outside worker search

The pincode dataset sample includes `pin_code`, `pincode`, and office-name variants. Several UI paths only check `PIN_CODE` or `pincode`. If upstream data changes, this is a likely regression area.

### 4. Police suggestions only search `ps_name`

They do not currently search:

- `name`
- `ps_code`
- boundary aliases from `police_sta` / `police_s_2`

So police search is narrower than police resolution.

### 5. Global suggestion ordering can hide some categories

Because the worker appends categories in a fixed order and truncates the final list to 8, a generic query can suppress later categories like police stations.

### 6. TNEB point/polygon counts do not match exactly

There are 2817 TNEB polygons but only 2812 office points in this workspace. The code handles this by falling back to the polygon center when office coordinates are unavailable.

### 7. Police crosswalk override is optional

The heuristic matcher is robust, but if a few jurisdictions are persistently wrong, adding `public/data/police_crosswalk.json` is the intended escape hatch.

### 8. Error handling is UI-light

Worker errors are mostly logged to console and reset `isResolving`. There is no centralized toast or error surface for non-fatal asset failures.

### 9. `AUTO_TRIGGER_PDS` exists in the hook but is not emitted by the worker

`useGisWorker.ts` handles an `AUTO_TRIGGER_PDS` message, but the worker does not currently send it. That looks like incomplete or leftover plumbing rather than active behavior.

### 10. `idb` is installed but not used

The dependency is present in `package.json`, but there is no IndexedDB persistence implementation in the current code.

## 17. If You Need To Add A New Layer

The existing architecture strongly suggests this sequence:

1. Add the new layer type to `ServiceLayer` in [src/types/gis.ts](C:/projects/nammamap-v2/v2/src/types/gis.ts).
2. Add store state for:
   - loaded dataset(s)
   - selected result payloads
   - layer-specific actions
3. Load the dataset in the worker with a new `LOAD_*` message.
4. Build an RBush spatial index if the layer has polygons or many points.
5. Add search logic to `GET_SUGGESTIONS` if search is required.
6. Add click resolution logic to `RESOLVE_LOCATION`.
7. Update `useGisWorker.ts` to handle returned message payloads.
8. Add sidebar entry in [src/components/layout/Sidebar.tsx](C:/projects/nammamap-v2/v2/src/components/layout/Sidebar.tsx).
9. Add map rendering and highlight logic in [src/features/map/GisMap.tsx](C:/projects/nammamap-v2/v2/src/features/map/GisMap.tsx).
10. Add a detail card branch in [src/components/layout/ResultContainer.tsx](C:/projects/nammamap-v2/v2/src/components/layout/ResultContainer.tsx).
11. Add reporting field selection if issue reporting is needed.

## 18. Practical Debugging Checklist

When something is not working, check in this order:

### Search result missing

- Was the dataset loaded by the worker?
- Does the query hit the exact field the worker searches?
- Did the category get crowded out by the 8-result cap?
- Is the issue only in display formatting rather than search matching?

### Click resolution missing

- Is the correct `activeLayer` selected?
- Was the matching layer index loaded?
- Is the point inside Tamil Nadu at all?
- Is the geometry malformed or missing coordinates?

### PDS not loading for a selected area

- Did the selected polygon expose one of the expected district keys?
- Does that district normalize through `pds_manifest.json`?
- Does the referenced `pds_file` actually exist?
- If the district file loads, is the supplied boundary filtering out all points?

### TNEB office marker missing

- Was the boundary resolved correctly?
- Did the office-point join fail on `section_co`, `circle_cod`, or region key mismatch?
- If so, the polygon should still display and the marker should fall back to bounds center.

### Police result looks wrong

- Check `confidence`, `reason`, and `debug.method` in dev mode.
- Compare boundary `police_s_1` / `police_sta` against station `ps_code` / `ps_name`.
- If the mismatch is persistent and known-good, add a crosswalk override.

## 19. Recommended First Reads For New Developers

For someone onboarding, read files in this order:

1. [src/types/gis.ts](C:/projects/nammamap-v2/v2/src/types/gis.ts)
2. [src/store/useMapStore.ts](C:/projects/nammamap-v2/v2/src/store/useMapStore.ts)
3. [src/hooks/useGisWorker.ts](C:/projects/nammamap-v2/v2/src/hooks/useGisWorker.ts)
4. [src/workers/gis.worker.ts](C:/projects/nammamap-v2/v2/src/workers/gis.worker.ts)
5. [src/features/map/GisMap.tsx](C:/projects/nammamap-v2/v2/src/features/map/GisMap.tsx)
6. [src/components/layout/ResultContainer.tsx](C:/projects/nammamap-v2/v2/src/components/layout/ResultContainer.tsx)
7. `public/data/*` sample schemas

That sequence moves from contracts to state to worker behavior to UI rendering.

## 20. Summary

The core mental model for NammaMap V2 is:

- React owns the experience.
- Zustand owns the live app state.
- The worker owns data loading, indexing, search, and jurisdiction resolution.
- Static GIS assets in `public/data` are the real source of truth.
- Most of the code complexity comes from schema inconsistency and the need to bridge polygon datasets to point datasets through fallback keys and heuristics.

If a new engineer understands the store, the worker message contract, the dataset inventory, and the fallback key chains documented above, they can work productively on this app without needing a senior to explain every lookup path.
