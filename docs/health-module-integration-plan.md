# Health Module Integration Plan

## Fit Assessment

The `HEALTH` module fits the existing architecture well:

- `PDS` provides the right lazy district-shard loading pattern.
- `POLICE` provides the right marker-first statewide discovery pattern.
- `PINCODE` provides the right point-in-polygon basis for local filtering.

The key implementation rule is:

- Do not treat health as one giant global point layer.
- Treat it as a drill-down module with:
  - statewide summary + priority hospitals,
  - district-level lazy shards,
  - pincode-level spatial filtering.

## Assets

Use these generated data files:

- `public/data/health_manifest.json`
- `public/data/health_statewide_priority.geojson`
- `public/data/health_search_index.json`
- `public/data/health_by_district/*.geojson`

## Target UX Model

Health should have 3 scopes:

- `STATE`
- `DISTRICT`
- `PINCODE`

Recommended defaults:

- Default scope: `STATE`
- Default visible types: priority facilities only
  - `CHC`, `SDH`, `DH`, `MCH`
- `PHC` and especially `HSC` should appear only after drill-down or explicit filtering

## Worker Plan

Add health-specific worker support in `src/workers/gis.worker.ts`.

### New Worker Caches

- `healthManifest`
- `healthPriorityGeoJson`
- `healthSearchIndex`
- `loadedHealthDistricts: Map<string, FeatureCollection>`
- `healthDistrictIndexes: Map<string, RBush>`

### New Message Types

- `LOAD_HEALTH_MANIFEST`
- `LOAD_HEALTH_PRIORITY`
- `LOAD_HEALTH_SEARCH_INDEX`
- `LOAD_HEALTH_DISTRICT`
- `FILTER_HEALTH_BY_AREA`
- `FILTER_HEALTH_BY_PINCODE`
- `GET_HEALTH_SUGGESTIONS`

### Loading Strategy

Eager on `HEALTH` activation:

- `health_manifest.json`
- `health_statewide_priority.geojson`

Lazy:

- district shard files
- `health_search_index.json` if needed to keep initial load smaller

### Filtering Strategy

`STATE`:

- use manifest for summaries
- use priority GeoJSON for map markers
- do not render all health facilities statewide

`DISTRICT`:

- load one district shard
- filter by facility type, capability, and location type in worker
- cluster rendered facilities on map

`PINCODE`:

- resolve pincode polygon using existing pincode boundaries
- load the relevant district shard
- use point-in-polygon to keep only facilities inside the pincode boundary
- then apply active health filters

## Store Plan

Add health-specific fields in `src/store/useMapStore.ts`.

### Data

- `healthManifest`
- `healthPriorityData`
- `healthDistrictData`
- `healthFilteredData`

### Selection

- `selectedHealthFacility`
- `selectedHealthAreaSummary`
- `activeHealthDistrict`
- `activeHealthPincode`
- `healthScope`

### Filters

- `healthFilters`

Recommended filter shape:

- `scope`
- `facilityTypes`
- `capabilities`
- `locationTypes`
- `showPriorityOnly`
- `includeHsc`
- `includePhc`

### Reset Rules

When switching away from `HEALTH`, clear:

- selected facility
- selected area summary
- current district/pincode filtered result

Keep cached:

- manifest
- priority statewide data

## Type System Plan

Extend `src/types/gis.ts`.

### Add to `ServiceLayer`

- `'HEALTH'`

### Add to `suggestionType`

- `'HEALTH_FACILITY'`

### Add Types

- `HealthFacilityProperties`
- `HealthFacility`
- `HealthFacilityCollection`
- `HealthManifest`
- `HealthDistrictSummary`
- `HealthAreaSummary`
- `HealthSearchIndexRow`
- `HealthFilterState`
- `HealthScope = 'STATE' | 'DISTRICT' | 'PINCODE'`

### Suggested Health Facility Fields

Identity:

- `reference_`
- `facility_n`
- `facility_t`
- `nin_number`

Administrative:

- `district_n`
- `sub_distri`
- `block_name`
- `assembly_c`
- `parliament`
- `taluk_lgd_`

Operational:

- `location_t`
- `lbtype`
- `timing_of_`
- `phc_catego`
- `fru`
- `under_heal`

Capabilities:

- `hwc`
- `kayakalp`
- `nqas`
- `delivery_p`
- `blood_bank`
- `blood_stor`
- `ct`
- `mri`
- `dialysis_c`
- `sncu`
- `nbsu`
- `deic`
- `cbnaat_sit`
- `tele_v_car`
- `stemi_hubs`
- `stemi_spok`
- `cath_lab_m`
- `prem_centr`
- `script_hub`
- `script_spo`

## Hook Plan

Update `src/hooks/useGisWorker.ts`.

### Add Worker API Wrappers

- `loadHealthManifest`
- `loadHealthPriority`
- `loadHealthSearchIndex`
- `loadHealthDistrict`
- `filterHealthByArea`
- `filterHealthByPincode`

### Add Worker Response Handlers

- `HEALTH_MANIFEST_LOADED`
- `HEALTH_PRIORITY_LOADED`
- `HEALTH_DISTRICT_LOADED`
- `HEALTH_FILTER_RESULT`
- `HEALTH_PINCODE_RESULT`
- `HEALTH_SUGGESTIONS_RESULT`

### Health Activation

When `HEALTH` becomes active:

- load manifest
- load priority facilities
- optionally load search index

## Sidebar Plan

Update `src/components/layout/Sidebar.tsx`.

- Replace the disabled `Health` future module with a real menu item.
- Use the existing `Activity` icon or a more health-specific icon if desired.

### Health Subcontrols

Primary:

- scope toggle: `State`, `District`, `Pincode`
- facility type filter:
  - `Priority`
  - `PHC`
  - `HSC`
  - `All`

Advanced:

- `Urban / Rural`
- `24x7`
- `HWC`
- `Delivery`
- `FRU`
- `Blood Bank / Blood Storage`
- `CT / MRI / Dialysis`
- `SNCU / NBSU / DEIC`
- `CBNAAT`
- `Cardiac`

## Search Plan

Update `src/components/layout/SearchBar.tsx`.

### New Suggestion Category

- `HEALTH_FACILITY`

### Searchable Fields

From `health_search_index.json`:

- facility name
- district
- block
- facility type
- sub-district
- optional reference id

### Ranking Rules

- exact facility name match highest
- prefix match next
- district + block matches next
- facility type-only matches lowest

Boost:

- `DH`, `MCH`, `SDH`, `CHC`, `PHC`

Demote:

- `HSC` on broad queries

Anti-noise rules:

- for short queries, suppress most `HSC` results
- cap `HSC` suggestions

## Map Plan

Update `src/features/map/GisMap.tsx`.

### State Scope

- show district boundaries
- show statewide priority facilities
- cluster if useful
- do not show all HSC/PHC

### District Scope

- load district shard
- show filtered facilities
- cluster by default
- raw markers only at closer zoom

### Pincode Scope

- highlight pincode polygon
- show only facilities inside polygon
- cluster at low zoom
- raw markers at high zoom

### Marker Hierarchy

- `DH/MCH`: strongest style
- `SDH/CHC`: medium emphasis
- `PHC`: standard
- `HSC`: smallest and quietest

### Interaction Model

- marker click: select facility and show detail card
- map click in health mode:
  - prefer area-selection workflow
  - pincode-based local filtering is the best initial behavior

## Result Card Plan

Update `src/components/layout/ResultContainer.tsx`.

### Selected Facility Card

Show:

- name
- facility type
- district
- block
- sub-district
- location type
- timing
- PHC category / FRU if present
- human-friendly capability pills

### District Summary Card

Show:

- district name
- total facilities
- counts by type
- top capabilities
- current filter summary

### Pincode Summary Card

Show:

- pincode
- district
- total facilities in polygon
- counts by type
- top capabilities in that area

### Capability Labels

Translate flags into user-facing labels:

- `hwc` -> `Health & Wellness Centre`
- `kayakalp` -> `Kayakalp Certified`
- `nqas` -> `NQAS Certified`
- `delivery_p` -> `Delivery Point`
- `fru` -> `First Referral Unit`
- `blood_bank` -> `Blood Bank`
- `blood_stor` -> `Blood Storage Unit`
- `ct` -> `CT Scan`
- `mri` -> `MRI`
- `dialysis_c` -> `Dialysis`
- `sncu` -> `SNCU`
- `nbsu` -> `NBSU`
- `deic` -> `DEIC`
- `cbnaat_sit` -> `CBNAAT`
- `tele_v_car` -> `Tele-Consultation`
- `stemi_hubs` -> `STEMI Hub`
- `stemi_spok` -> `STEMI Spoke`
- `cath_lab_m` -> `Cath Lab`

## Performance Strategy

- preload only manifest + statewide priority data
- lazy-load district shards
- cache district shards after first load
- build worker-side indexes per district
- avoid global rendering of all facilities
- keep HSC mostly out of statewide and broad search views

## Phased Rollout

### Phase 1

Minimum viable `HEALTH` module:

- add `HEALTH` to sidebar and layer model
- load manifest + statewide priority data
- render statewide priority markers
- support district shard loading
- support facility result card

### Phase 2

Better filters and search:

- load and use `health_search_index.json`
- add health search suggestions
- add health sidebar filters
- add pincode point-in-polygon filtering
- add district and pincode summaries

### Phase 3

Richer summaries and polish:

- capability-first filtering UX
- stronger summary cards
- better ranking and suppression of noisy HSC results
- optional interactive district-click workflow
