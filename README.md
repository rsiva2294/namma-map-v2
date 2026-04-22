# 🗺️ NammaMap V2

**NammaMap** is a high-performance, context-aware GIS portal designed to help citizens of Tamil Nadu find their relevant administrative and utility jurisdictions with precision.

[![Deploy to Firebase](https://img.shields.io/badge/Deploy-Firebase-orange?style=flat-square&logo=firebase)](https://namma-map.web.app)

## 🚀 Live Demo
Visit the live application: [**https://namma-map.web.app**](https://namma-map.web.app)

## ✨ Features
*   **Three Integrated Layers**: PINCODE, PDS (Ration Shops), and TNEB (Electricity).
*   **Off-Thread GIS Resolution**: Lightning-fast spatial queries powered by Web Workers.
*   **Lazy Loading Architecture**: Loads data dynamically to ensure minimal initial load time.
*   **Locate Me**: One-tap geolocation with automatic boundary resolution.
*   **Modern UI**: Glassmorphism design with responsive support for mobile and desktop.

## 📖 Documentation
*   [**User Guide**](./docs/user_guide.md): Features, tips, and how to use the map.
*   [**Developer Guide**](./docs/developer_guide.md): Architecture, tech stack, and development setup.

## 🛠️ Tech Stack
*   **React + Vite**
*   **Leaflet** (Map Engine)
*   **Zustand** (State Management)
*   **TopoJSON** (Compressed Spatial Data)
*   **Web Workers** (Background Processing)

## 🏗️ Getting Started
1. Clone the repo: `git clone https://github.com/rsiva2294/namma-map-v2.git`
2. Install deps: `npm install`
3. Run dev: `npm run dev`

---
Developed with ❤️ for Tamil Nadu.
