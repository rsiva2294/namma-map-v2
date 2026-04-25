# 🗺️ NammaMap V2 Roadmap

This document outlines the planned and proposed features for the evolution of NammaMap V2. These items are categorized by their impact on utility, user experience, and technical depth.

## 🚀 Phase 1: High-Impact Utility (Short Term)
Features that provide immediate value with minimal architectural changes.

- [ ] **Deep Linking & Shareable URLs**: State-reflective URLs (e.g., `/tneb/section-code`) to allow users to share specific jurisdictions.
- [x] **Navigation Integration**: "Get Directions" button in Result Cards that opens Google Maps/Apple Maps.
- [ ] **Bilingual Support (Tamil/English)**: Full localization of the UI and primary dataset labels.
- [ ] **Enhanced Result Metadata**: Include phone numbers, operating hours, and official contact emails for offices.
- [x] **Police Stations & Jurisdictions**: Complete boundary mapping and station point integration.

## 🛠️ Phase 2: User Experience & Engagement (Medium Term)
Features that improve retention and ease of use.

- [x] **Saved Locations ("My Places")**: LocalStorage-based saving of favorite pincodes or offices for quick access.
- [x] **Global Universal Search**: A single search bar that resolves Districts, Pincodes, and Offices without requiring layer switching.
- [x] **Assembly & Parliamentary Constituency Layers (AC/PC)**: Complete boundary mapping and toggle controls.
- [x] **Crowdsourced Feedback**: "Report an Issue" button for data corrections (location shifts, name changes).
- [x] **Mobile Responsiveness & Performance**: Premium bottom sheet interactions and IndexedDB data caching.
- [ ] **Interactive Legend**: A visual guide to map markers, colors, and boundary types.

## 📡 Phase 3: Real-Time & Advanced GIS (Long Term)
Features requiring external API integrations or complex spatial logic.

- [ ] **TNEB Live Outage Map**: Integration with TANGEDCO feeds to show real-time power outage polygons.
- [ ] **PDS Stock/Status Integration**: Live shop status (Open/Closed) and essential commodity availability.
- [ ] **Offline Mode (PWA)**: Service Worker implementation for map tile and jurisdiction caching.
- [ ] **Proximity Analysis**: "Show all services within X km" and nearest-neighbor resolution.

## 📊 Phase 4: Data & Analytics
Internal and research-oriented features.

- [ ] **Demographic Overlays**: Census data (population density, etc.) overlaid on jurisdictional boundaries.
- [ ] **Usage Analytics**: Privacy-first tracking of popular search areas to identify high-demand regions.
- [ ] **Automated Data Pipeline**: Scripts to automatically fetch and convert raw government CSV/JSON into optimized TopoJSON.

---
*Last Updated: April 25, 2026 (Performance & Mobile Release)*
