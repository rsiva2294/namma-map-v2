# 🗺️ NammaMap V2

**NammaMap** is a professional, context-aware GIS portal for Tamil Nadu. It provides lightning-fast spatial resolution for essential services using modern web technologies.

[![Deploy to Firebase](https://img.shields.io/badge/Deploy-Firebase-orange?style=flat-square&logo=firebase)](https://namma-map.web.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🚀 Live Demo
[**https://namma-map.web.app**](https://namma-map.web.app)

## 📋 Professional Standards
This repository adheres to high-quality software engineering practices:
*   [**README.md**](./README.md): Project overview and quick start.
*   [**CHANGELOG.md**](./CHANGELOG.md): Detailed history of releases and changes.
*   [**CONTRIBUTING.md**](./CONTRIBUTING.md): Guidelines for code contributions.
*   [**ARCHITECTURE.md**](./ARCHITECTURE.md): Technical deep-dive and system design.
*   [**ROADMAP.md**](./ROADMAP.md): Future features and development plans.
*   [**User Guide**](./docs/user_guide.md): How-to for end users.

## ✨ Features
*   **7 Specialized GIS Layers**: 
    - **Pincodes**: India Post jurisdictions and office locations.
    - **PDS (Ration Shops)**: Comprehensive mapping of Civil Supplies outlets.
    - **TNEB**: Electricity Board Section, Sub-division, and Division boundaries.
    - **Health**: Advanced filtering of statewide medical facilities and capabilities.
    - **Police**: Station points and jurisdictional boundaries.
    - **Constituencies**: Assembly (AC) and Parliamentary (PC) mapping.
    - **Local Bodies**: Unified discovery for Corporations, Municipalities, and Panchayats.
*   **Off-Thread Processing**: All spatial queries run in Web Workers with `RBush` indexing to ensure 60fps UI performance.
*   **Global Geocoding Fallback**: Integrates Google Maps Geocoding API via Firebase Functions to seamlessly resolve street addresses and landmarks when local indexes yield no results.
*   **Persistent Caching**: Integrated IndexedDB caching for all GIS datasets, ensuring near-instant subsequent loads.
*   **Mobile-Native UX**: Advanced responsive design with glassmorphism, dynamic viewport units (`dvh`), and bottom-sheet interactions.
*   **Automated Updates**: Integrated version tracking prompts users to refresh when new updates are deployed.
*   **Full Bilingual Support (EN/TA)**: Instant, high-quality translation between English and Tamil with dynamic font scaling for visual parity.
*   **SEO Optimized**: Fully integrated Schema.org JSON-LD and dynamic OpenGraph/Twitter meta tags for maximum discoverability on search engines.

## 🛠️ Tech Stack
*   **React 18 + Vite**
*   **Leaflet** (GIS Map Engine)
*   **Zustand** (Store)
*   **TopoJSON** (Efficient Geometry)

## 🏗️ Local Setup
1. `git clone https://github.com/rsiva2294/namma-map-v2.git`
2. `cp .env.example .env`
3. `npm install`
4. **Configure Secrets**: For Global Search to work, you must provision your Google Maps API key in Firebase:
   - `firebase functions:secrets:set GOOGLE_MAPS_API_KEY` (Paste key when prompted)
   - For local dev, create `functions/.env` and add `GOOGLE_MAPS_API_KEY=your_key`
5. **Run Locally**:
   - Terminal 1: `npm run dev` (Frontend)
   - Terminal 2: `firebase emulators:start` (Backend Proxy)
6. Open `http://localhost:5173`

---
*Built for the people of Tamil Nadu.*
