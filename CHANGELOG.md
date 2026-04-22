# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
