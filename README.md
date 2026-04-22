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
*   **Context-Aware Engine**: Search and map interactions adapt to the active layer (PINCODE | PDS | TNEB).
*   **Off-Thread Processing**: All spatial queries run in Web Workers to ensure 60fps UI performance.
*   **Mobile-First Design**: Optimized for field use with glassmorphism and responsive layouts.
*   **Automated Geolocation**: Resolve jurisdictions with a single tap.

## 🛠️ Tech Stack
*   **React 18 + Vite**
*   **Leaflet** (GIS Map Engine)
*   **Zustand** (Store)
*   **TopoJSON** (Efficient Geometry)

## 🏗️ Local Setup
1. `git clone https://github.com/rsiva2294/namma-map-v2.git`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

---
*Built for the people of Tamil Nadu.*
