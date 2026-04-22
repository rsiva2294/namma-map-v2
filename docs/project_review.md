# Project Review & Improvement Roadmap

## 📊 Technical Analysis

### 1. Component Architecture
**Status**: 🟠 Needs Improvement
*   **Issue**: `App.tsx` is currently ~350 lines and handles sidebar, search, suggestions, and 5 different result card states.
*   **Impact**: Hard to maintain and test. Any change in the sidebar triggers a re-render of the search bar logic.
*   **Recommendation**: Extract `Sidebar`, `SearchBar`, `SuggestionDropdown`, and `ResultPanel` into their own files.

### 2. State Management (Zustand)
**Status**: 🟢 Good
*   **Issue**: Components are destructuring the entire store.
*   **Impact**: Redundant re-renders. If `theme` changes, the `selectSuggestion` logic in `GisMap` technically "re-runs" its dependency check.
*   **Recommendation**: Use **Selectors** (e.g., `const theme = useMapStore(s => s.theme)`) to isolate component updates.

### 3. GIS Engine (Web Worker)
**Status**: 🟡 Acceptable
*   **Issue**: Linear filtering (`.find` / `.filter`) on TopoJSON feature arrays.
*   **Impact**: For TNEB boundaries (~2000 complex polygons), resolution is fast. For PDS shops (~35,000 points), a statewide search would be slow.
*   **Recommendation**: Implement **Spatial Indexing** (RBush) within the worker for O(log n) lookups.

### 4. Type Safety
**Status**: 🔴 Critical
*   **Issue**: Extensive use of `any` for GeoJSON features and API payloads.
*   **Impact**: Easy to introduce breaking changes when data schemas evolve (e.g., the recent `type` vs `suggestionType` bug).
*   **Recommendation**: Define strict interfaces for `GisFeature`, `PdsShop`, and `TnebSection`.

---

## 🚀 Improvement Roadmap

### Phase 1: Modularization (Immediate)
*   [ ] Refactor `App.tsx` into a clean layout component.
*   [ ] Move inline CSS to `index.css` using utility classes or CSS variables.
*   [ ] Create a `components/layout/` directory.

### Phase 2: Performance & Indexing
*   [ ] Integrate `rbush` in the worker for faster point-in-polygon checks.
*   [ ] Implement `Transferable` objects for sending large datasets between worker/main-thread.
*   [ ] Add a `Cache` layer in the worker for frequently searched areas.

### Phase 3: UX & Accessibility
*   [ ] Add Framer Motion for smooth result card transitions.
*   [ ] Implement ARIA labels for map markers and search results.
*   [ ] Add a "Copy Coordinates" button to result cards.

### Phase 4: Reliability
*   [ ] Add Error Boundaries around the map component.
*   [ ] Implement a "Retry" mechanism for failed dataset fetches.
*   [ ] Add unit tests for the worker's spatial resolution logic.

---

## 💡 Summary
The foundation is rock solid. The transition to an off-thread architecture was the right choice. By focusing on **Modularization** and **Type Safety** in the next few sprints, we can ensure NammaMap V2 scales effectively as new layers (Health, Police, etc.) are added.
