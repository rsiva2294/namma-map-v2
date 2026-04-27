# NammaMap V2 - Developer Guide

This guide covers the technical architecture and implementation details of the NammaMap GIS portal.

## 🛠️ Technology Stack
*   **Frontend**: React 18, Vite
*   **GIS Rendering**: Leaflet with `react-leaflet`
*   **State Management**: Zustand
*   **Data Processing**: TopoJSON (for boundary compression)
*   **Off-thread Processing**: Web Workers
*   **Icons**: Lucide React
*   **Styling**: Vanilla CSS (Modern CSS variables)

## 🏗️ Architecture

### 1. Off-Thread GIS Engine (`gis.worker.ts`)
To maintain a butter-smooth 60fps UI, all spatial operations are handled in a dedicated Web Worker.
*   **Point-in-Polygon Resolution**: Uses a custom ray-casting algorithm to determine which jurisdiction a user clicked on.
*   **Lazy Loading**: The worker handles fetching large datasets (Districts, Pincodes, PDS points) on-demand to keep the initial bundle small.
*   **Search Indexing**: Filters TopoJSON features in the background based on user queries.

### 2. State Management (`useMapStore.ts`)
The app uses a single source of truth for all map states:
*   `activeLayer`: Tracks (PINCODE | PDS | TNEB).
*   `searchResult`: Stores the currently highlighted GeoJSON feature.
*   `jurisdictionDetails`: Holds the specific service info (TNEB office, etc.).

### 3. Data Flow
1.  **Init**: `GisMap.tsx` initializes the worker.
2.  **Action**: User searches or clicks the map.
3.  **Process**: `useGisWorker.ts` hook sends a message to the worker.
4.  **Resolve**: Worker processes spatial logic and sends a response.
5.  **Update**: The hook updates the Zustand store, which triggers UI re-renders in `App.tsx`.

## 📂 Data Structure
The app relies on highly optimized TopoJSON and JSON files in `public/data/`:
*   `tn_districts.topojson`: Basic state administrative boundaries.
*   `tn_pincodes.topojson`: Pincode boundaries with searchable office names.
*   `pds/[District].json`: Point data for ration shops, lazy-loaded.
*   `tneb/tn_tneb_boundaries.topojson`: Multi-polygon section boundaries.
*   `health/manifest.json`: Statewide health facility metadata.
*   `health/districts/[District].json`: Point data for health facilities.
*   `police/boundaries/[District]_boundaries.json`: Police station jurisdictional polygons.
*   `police/stations/[District]_stations.json`: Police station point markers.
*   `local_bodies/village_panchayat/[District].json`: Village panchayat boundaries (Lazy-loaded).

## 🚀 Development
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```

## 🌐 Deployment
The project is hosted on **Firebase Hosting**.
```bash
# Build and Deploy
npm run build
firebase deploy --only hosting
```
