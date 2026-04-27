# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.3] - 2026-04-27
### Added
- **Schema.org Structured Data**: Integrated JSON-LD metadata to identify NammaMap as a "GovernmentService" and "Dataset" for better visibility in Google Search and Google Dataset Search.
- **Accessibility: Skip Link**: Added "Skip to results" functionality for keyboard users to bypass navigation.
- **Accessibility: Screen Reader Support**: Implemented `aria-live` regions for result cards and added semantic ARIA landmarks across the app.
- **Sitemap Expansion**: Updated sitemap generator to include the "Local Bodies" layer for all districts.

### Fixed
- **Modal Accessibility**: Added `Escape` key support to close all modals and implemented background scroll locking.
- **Visual Focus**: Added global high-contrast focus rings (`:focus-visible`) for all interactive elements.

## [1.2.2] - 2026-04-27
### Added
- **Robust Update System**: Implemented a proactive version check against `version.json` that works alongside the PWA, ensuring users jump directly to the latest deployment.
- **Version Transparency**: Added build version displays to the Update Notification and the **About & Legal** dialog for better support and transparency.

### Changed
- **Update UX**: Introduced a non-dismissible "Updating..." state with a loading animation to prevent race conditions and redundant notifications during the refresh cycle.
- **Visual Contrast**: Redesigned the update notification with a solid dark theme and high-contrast text for significantly improved readability in all lighting conditions.

### Fixed
- **Notification Persistence**: Added session-based dismissal logic, allowing users to hide update notifications for the current version while still alerting them to future updates.

## [1.2.1] - 2026-04-27
### Changed
- **Sidebar UX**: Reorganized service modules into semantic categories (ESSENTIALS, CIVIC, SAFETY, UTILITIES) for faster discovery and better information hierarchy.
- **Visual Semantics**: Color-coded sidebar icons to match their respective map marker themes (e.g., Red for Ration Shops, Amber for TNEB, Crimson for Health), creating a stronger visual link between the navigation and data.
- **Map Context**: Added the Tamil Nadu statewide boundary to the **Local Bodies** layer, providing consistent geographic orientation.

### Fixed
- **UI Structure**: Improved spacing and visual separation between service discovery modules and application settings (Theme, Legal) in the sidebar.

## [1.2.0] - 2026-04-27
### Added
- **Local Bodies V2**: Unified administrative area discovery for Corporations, Municipalities, Town Panchayats, and Village Panchayats with prioritized resolution.
- **Police Stations & Jurisdictions**: Integrated statewide station points with their respective jurisdictional boundaries.
- **Constituency Layers**: Added interactive layers for Assembly (AC) and Parliamentary (PC) Constituencies.
- **Health Facilities UX**: Comprehensive filtering by facility type (PHC, CHC, etc.) and specific capabilities (24x7, Emergency, Neonatal).

### Changed
- **Panchayat Discovery**: Transitioned Village Panchayat loading to a pincode-driven model, optimizing performance by loading only local-area boundaries.
- **Health Filtering**: Refactored logic to use inclusive OR for capability filters while maintaining strict AND for facility types.

### Fixed
- **GIS Worker Stability**: Improved memory management during large GeoJSON parsing and spatial indexing.

## [1.1.0] - 2026-04-25
### Added
- **Mobile Bottom Sheets**: Converted result cards, health summaries, and filters into native-feeling responsive bottom sheets.
- **Update Notification System**: Automated versioning and background polling to prompt users for refresh on new deployments.
- **Persistent Caching**: Implemented a 24-hour IndexedDB cache for all GIS datasets, significantly reducing subsequent load times.
- **Spatial Indexing**: Integrated `RBush` for high-performance (O(log n)) marker and boundary lookups in the worker.
- **Locating Overlay**: Full-screen visual feedback when using the "Locate Me" feature.

### Changed
- **Responsive Layout**: Sidebar converted to a drawer on mobile with a dimmed backdrop.
- **Performance**: Implemented "Property Thinning" to reduce worker-to-main thread message payload sizes.
- **Mobile Styling**: Switched to `dvh` units and added Safe Area support for notched devices and modern browsers.

### Fixed
- **Constituency Loading**: Resolved a regression where boundaries were not appearing due to redundant data parsing.
- **Result Card Clipping**: Fixed an issue where long lists of details were cut off on mobile browsers with toolbars.

## [1.0.0-beta.2] - 2026-04-22
### Added
- **Context-Aware Search**: The search bar now adapts suggestions based on the active layer (PINCODE, PDS, TNEB).
- **Auto-Loading PDS Data**: PDS shops now automatically populate when switching to the PDS layer with a selected area.
- **Instructional Cards**: Added service-specific guidance cards for TNEB and PDS modules.
- **Visual Geolocation Feedback**: Added a spinner and placeholder updates during "Locate Me" requests.
- **Firebase Hosting**: Initialized and configured for SPA routing.

### Changed
- **PDS Discovery Model**: Moved from a 4MB global index to a high-performance local-area discovery model.
- **Map Aesthetics**: Updated Pincode boundaries to a vibrant blue theme for better contrast.
- **Search UI**: Improved suggestion subtitles to show District names instead of office type codes.

### Fixed
- **GeoJSON Conflict**: Resolved "Invalid GeoJSON" crash by renaming internal type properties.
- **Worker Scoping**: Fixed TypeScript redeclaration errors in `gis.worker.ts`.
- **Build Errors**: Resolved Lucide icon prop types and unused variables for production compilation.

## [1.0.0-beta.1] - 2026-04-19
### Added
- **Initial GIS Core**: Multi-layer support for Districts, Pincodes, and TNEB Boundaries.
- **Web Worker Engine**: Off-thread spatial resolution for jurisdiction finding.
- **Zustand Store**: Centralized map state management.
- **Basic UI**: Sidebar, Theme switching, and Mobile-first layout.
