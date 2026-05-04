# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.1] - 2026-05-04
### Added
- **Constituency Detail View**: Integrated a live election results feature that displays candidate standings, vote counts, and party affiliations directly within the map.
- **ECI Scraper Microservice**: Developed a highly isolated Firebase Cloud Function utilizing Cheerio to scrape and parse live HTML from the Election Commission of India website.
- **Sub-200ms API Caching**: Implemented an in-memory 30-second TTL cache in the backend to ensure instantaneous responses and prevent excess load on external servers.

### Changed
- **Temporary Default Landing**: Set the `/constituency` layer as the default home page for the 2026 election period to prioritize civic information.

## [1.8.0] - 2026-05-04
### Added
- **Site Visitor Counter**: Implemented a real-time visitor counter in the Sidebar settings using Firebase Realtime Database.
- **Session-Aware Tracking**: Uses atomic transactions and `sessionStorage` to ensure accurate, non-inflated visit counts.
- **Live UI Feedback**: Added a subtle green pulse indicator to the visitor counter to signify live connectivity.

### Changed
- **Unified Search Experience**: Simplified the search bar placeholder to a single, consistent string ("Search for an area, pincode, or office...") across all service modules.
- **Search Logic Cleanup**: Removed redundant layer-specific translation keys and streamlined the `SearchBar` component's conditional logic.
- **Firebase Configuration**: Migrated the `databaseURL` to environment variables for better project management and regional instance support (Asia Southeast).

### Fixed
- **Code Hygiene**: Resolved unused variable errors in the `SearchBar` component to ensure clean production builds.

## [1.7.0] - 2026-05-01
### Added
- **Core Web Vitals Optimization**: Implemented a comprehensive performance overhaul focusing on LCP, FCP, and TBT.
- **Resource Preloading**: Added critical resource hints (`preload`, `preconnect`) for fonts, map tiles, and branding assets in `index.html`.
- **Advanced Code Splitting**: Configured manual chunks in Vite to separate React, Leaflet, Framer Motion, and Sentry into logical vendor bundles.
- **Lazy Loading**: Converted all non-critical UI components (Modals, Tutorials, Overlays, and Feature Panels) to lazy-loaded modules, reducing initial JS payload by ~20%.
- **Critical CSS Path**: Inlined the essential "shell" CSS for the sidebar and search bar to eliminate render-blocking delays during first paint.

### Changed
- **Map Skeleton Accuracy**: Refined the `MapSkeleton` dimensions and styles to perfectly match the final UI, reducing layout shifts (CLS) and improving perceived performance.
- **Image Priority Hints**: Applied `fetchpriority="high"` and `loading="eager"` to the main branding logo to accelerate Largest Contentful Paint (LCP).

### Fixed
- **Build Performance**: Optimized Rollup chunking logic to prevent duplicate code in vendor bundles.

## [1.6.2] - 2026-04-30
### Added
- **Quick Navigation**: Added a dedicated directions shortcut icon to the header of marker cards on mobile, allowing users to start navigation with a single tap.

### Changed
- **Header Layout Optimization**: Rearranged mobile header icons by priority (Directions > Info > Minimize > Close) and increased spacing to 12px for better readability and touch-friendliness.
- **Visual Semantics**: Replaced the "Report Issue" icon with a descriptive "Info" (ⓘ) icon to more accurately reflect user expectations for discovering facility details.

## [1.6.1] - 2026-04-30
### Fixed
- **Mobile Result Card Layout**: Resolved a critical visibility issue where the "GET DIRECTIONS" button was clipped on mobile screens by implementing a fixed-footer layout and refined flexbox shrinking.
- **Police Module Directions**: Improved reliability of the directions feature by adding a fallback to geometry coordinates for stations with missing property metadata.
- **Mobile Map Space**: Optimized mobile viewport real estate by hiding the Postal Legend Panel on small screens, as requested.

## [1.6.0] - 2026-04-30
### Added
- **Mobile UI/UX Overhaul**: Comprehensive refinements to result cards, health filters, and postal legends for a more native, fluid experience on mobile devices.
- **Smart Update Persistence**: Implemented `localStorage` persistence for dismissed update notifications, ensuring users aren't repeatedly prompted for the same version.
- **Update Display Gate**: Added logic to prevent redundant version check prompts during active sessions.
- **Postal Legend Panel**: Added a dedicated legend for the Pincode layer to help users distinguish between different postal office types and status indicators.

### Changed
- **GIS Worker Optimization**: Refined spatial indexing performance and improved boundary resolution logic for complex jurisdictions.
- **Health Filtering Logic**: Standardized health facility filtering to treat facility types as mandatory (AND) while keeping capabilities flexible (OR).
- **Unit Test Architecture**: Refactored `vitest` suite to utilize production modules directly, ensuring tests accurately reflect the latest GIS engine behavior.

### Fixed
- **Local Body Resolution**: Corrected an edge case where certain Village Panchayats failed to resolve during high-zoom map interactions.
- **Sidebar Visibility**: Resolved a regression where Assembly and Parliamentary sub-tabs were hidden in specific layer configurations.
- **Build Integrity**: Fixed several `TS6133` (unused variable) errors in `App.tsx` that were blocking production compilation.
- **Tutorial UI**: Fixed stacking context (z-index) and focus-blur issues in the `driver.js` onboarding guide.
- **React Stability**: Eliminated "duplicate key" warnings in result lists and filter panels.

## [1.5.0] - 2026-04-28
### Added
- **Interactive Onboarding Tutorial**: Implemented a step-by-step guided tour using `driver.js` to help new users discover core features (Service Layers, Smart Search, GPS Location).
- **Persistent Tutorial State**: Onboarding status is persisted in `localStorage` to ensure the tour only auto-plays once per user.
- **Help Center Integration**: Added a "Help" button in the sidebar footer to allow users to replay the tutorial at any time.

### Changed
- **Localized Guidance**: The entire tutorial experience is fully localized in both English and Tamil, including UI buttons and tooltips.

## [1.4.1] - 2026-04-28
### Added
- **Secure Backend Proxy**: Migrated Google Maps Geocoding API to a Firebase Cloud Function proxy, utilizing Secret Manager to prevent API key exposure in the client bundle.
- **Hosting Pre-deploy Automation**: Added automated `npm run build` trigger to `firebase.json` to ensure deployments always use the latest build and versioning.

### Changed
- **Search Performance**: Implemented 300ms debouncing for the global search to optimize worker message frequency and reduce Google Maps API quota usage.

### Fixed
- **URL Parser Stability**: Fixed a `TypeError` in the worker-side URL parser by adding a protocol guard before attempting to parse search strings as URLs.

## [1.4.0] - 2026-04-28
### Added
- **Global Search Engine**: Integrated Google Maps Geocoding API as a fallback to resolve full street addresses, landmarks, and unstructured locations across Tamil Nadu when civic data indexes yield no local matches.
- **Enhanced SEO & Metadata**: Expanded JSON-LD Schema.org configurations and dynamic meta tags to properly index Police, Constituencies, Local Bodies, and global search capabilities for search engines.

### Changed
- **Health Filtering Re-engineering**: Transitioned from mutually exclusive radio buttons to an additive checkbox system for facility groups (Major, Secondary, Local).
- **Intelligent Scope Filtering**: Default health filter state now considers the active map scope, visually disabling Local Centres at the statewide level to prevent empty result sets while maintaining accurate UI feedback.

### Fixed
- **Local Bodies Data Anomaly**: Added a deterministic override in the GIS Web Worker to correct an upstream data anomaly where the Chennai Municipal Corporation was improperly assigned to the Chengalpattu district.

## [1.3.0] - 2026-04-28
### Added
- **Full Internationalization (EN/TA)**: Completed Phase 2 of localization, refactoring all hardcoded text across components, utilities, and maps into a centralized translation system.
- **Visual Language Parity**: Implemented a dynamic font-scaling system that automatically adjusts Tamil text sizes to maintain visual alignment and premium aesthetics with English.
- **Enhanced Language Toggle**: Added a dedicated 'Languages' icon and an 'EXPERIMENTAL' badge to the sidebar to signify the ongoing development of the translation system.
- **Localized Health Assistant**: Fully translated the health summary guidance, facility capability filters, and expert filter panel.
- **Bilingual Map Engine**: Localized all marker tooltips, popups, and legends across PDS, TNEB, Police, and Health layers.
- **Bilingual Utilities**: Refactored postal and district utilities to support native language labels and descriptive service explanations.

### Fixed
- **Content Security Policy**: Updated the production CSP to explicitly allow Web Workers to be created from blob URLs (`worker-src 'self' blob:`), resolving initialization blocks in Chrome.
- **Code Hygiene**: Removed dozens of unused variables and redundant language-check ternaries across the codebase.
- **Build Integrity**: Consolidated and deduplicated translation keys to ensure consistent production build performance.

## [1.2.4] - 2026-04-27
### Added
- **Bilingual Support (Tamil)**: Implemented Phase 1 of native Tamil support, allowing users to toggle the entire application interface between English and Tamil.
- **Language Toggle**: Integrated a premium language switcher in the sidebar settings with instant state synchronization.
- **District Name Translation**: Created a comprehensive lookup system for all 38 Tamil Nadu districts to display their native Tamil names in result cards and search suggestions.
- **Localized Search Experience**: Updated the floating search bar to provide localized placeholders and category headers based on the active language.
- **Localized Action UI**: Translated core action buttons (Directions, Report, Close) and geographic disclaimers for a seamless local experience.

### Fixed
- **Type Safety**: Resolved several TypeScript compilation errors related to translation key indexing and hook usage.

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
