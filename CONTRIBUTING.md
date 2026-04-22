# Contributing to NammaMap V2

First off, thank you for considering contributing to NammaMap! It's people like you that make this tool better for everyone.

## 🚀 Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally: `git clone https://github.com/YOUR_USERNAME/namma-map-v2.git`
3.  **Create a branch** for your feature or fix: `git checkout -b feat/my-new-feature`
4.  **Install dependencies**: `npm install`
5.  **Start the dev server**: `npm run dev`

## 🛠️ Development Guidelines

### Coding Standards
*   We use **TypeScript** for everything. Please ensure your types are correct and avoid `any` where possible.
*   The map logic is split between the UI and the **Web Worker**. If you are adding spatial logic, it belongs in `src/workers/gis.worker.ts`.
*   We use **Modern CSS** (Variables) for styling. Avoid inline styles where a utility class or CSS variable could be used.

### Data Privacy
*   **NEVER** commit raw PII (Personally Identifiable Information) datasets to the repository. 
*   Ensure all GeoJSON/TopoJSON files in `public/data` are optimized and stripped of redundant metadata.

## 📮 Submitting Changes
1.  **Commit your changes** using [Conventional Commits](https://www.conventionalcommits.org/):
    *   `feat: add support for new layer`
    *   `fix: resolve marker alignment issue`
    *   `docs: update readme`
2.  **Push to your fork** and **Submit a Pull Request** to the `main` branch.
3.  Include a clear description of the changes and any screenshots for UI updates.

## ⚖️ License
By contributing, you agree that your contributions will be licensed under the project's MIT License.
