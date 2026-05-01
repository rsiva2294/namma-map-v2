---
name: NammaMap Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fd'
  surface-container: '#ededf8'
  surface-container-high: '#e7e7f2'
  surface-container-highest: '#e1e2ec'
  on-surface: '#191b23'
  on-surface-variant: '#434654'
  inverse-surface: '#2e3038'
  inverse-on-surface: '#f0f0fb'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#7b2600'
  on-tertiary: '#ffffff'
  tertiary-container: '#a33500'
  on-tertiary-container: '#ffc6b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ec'
  health-rose: '#E11D48'
  police-slate: '#475569'
  transport-indigo: '#4F46E5'
  revenue-amber: '#D97706'
  glass-surface: rgba(255, 255, 255, 0.8)
  glass-border: rgba(255, 255, 255, 0.3)
typography:
  headline-xl:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Public Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  bilingual-subtext:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
  safe-area-bottom: env(safe-area-inset-bottom)
  bottom-sheet-peak: 25dvh
  bottom-sheet-expanded: 85dvh
---

# NammaMap Design Document

Welcome to the central design repository for **NammaMap V2**, the Tamil Nadu Civic GIS Portal. This document outlines the core design philosophy, user experience principles, and the structural logic that governs the application.

---

## 🏛️ Design Philosophy

NammaMap is built on the belief that civic data should be **accessible, intuitive, and actionable**. We prioritize utility over decoration, ensuring that users can answer the question *"Who is responsible for my area?"* in under 10 seconds.

### Core Pillars
1.  **Map-Centricity**: The map is the primary interface, not a secondary feature. All interactions either originate from or reflect back onto the map.
2.  **Low Friction**: Minimal steps between "search" and "result." We avoid complex forms and multi-page flows.
3.  **Local Context**: We use familiar civic hierarchies (Districts, Pincodes, Local Bodies) to anchor the data in the user's lived reality.
4.  **Bilingual by Design**: Tamil and English are treated with equal visual weight and priority.

---

## 📱 User Experience (UX) Strategy

### 1. Mobile-First Architecture
Over 80% of our users access the portal via mobile devices.
*   **Bottom Sheet Pattern**: We use dynamic bottom sheets (`dvh` units) for results and filters to ensure easy one-handed operation.
*   **Safe Areas**: Padding is meticulously managed using `env(safe-area-inset-bottom)` to support modern gesture-based navigation.
*   **Responsive Controls**: Floating action buttons and search bars are positioned for thumb-reachability.

### 2. Search & Discovery
The search experience is designed as a "Command Surface":
*   **Contextual Suggestions**: Results are categorized (Place, Pincode, Landmark) to guide user intent.
*   **Direct Navigation**: Clicking a result immediately triggers a "Fly-To" animation and highlights the relevant boundary.
*   **Deep Linking**: Every state (location + active layer) is represented in the URL, allowing for perfect shareability.

### 3. Progressive Disclosure
To prevent cognitive overload:
*   We only show high-level summaries on initial selection.
*   Deep details (contact numbers, office addresses) are revealed only when the user interacts with a specific result card.

---

## 🎨 Visual System

Our visual identity, **"Namma Glass,"** is defined by a modern, premium aesthetic that balances transparency with clarity.

*   **Glassmorphism**: We use frosted glass surfaces (`backdrop-filter`) to maintain map visibility even when UI panels are open.
*   **Color Semantics**: Layers are color-coded to aid mental categorization (e.g., Rose for Health, Slate for Police).
*   **Typography**: Clean, high-contrast sans-serif typefaces that ensure legibility in both English and Tamil script.

> [!TIP]
> For specific color tokens and component rules, refer to the **[Style Guide](docs/STYLE_GUIDE.md)**.

---

## 🏗️ Technical Implementation Summary

The design is powered by a high-performance engine optimized for the browser.

*   **Engine**: A dedicated Web Worker (GIS Worker) handles all spatial computations (RBush) to keep the UI at a fluid 60fps.
*   **State**: Zustand manages the "Global Location" and "Active Layer" as the unified source of truth.
*   **Data**: TopoJSON datasets are lazy-loaded and cached in IndexedDB to ensure sub-second performance on repeat visits.

> [!NOTE]
> For a deep dive into the engineering patterns, see the **[Architecture Manual](ARCHITECTURE.md)**.

---

## 🛤️ Design Roadmap

*   **Interactive Overlays**: Enhancing boundary highlights with dynamic metadata on hover.
*   **Offline Mode**: Expanding IndexedDB capabilities to allow basic map usage without an active connection.
*   **Accessibility+**: Moving beyond contrast to full screen-reader optimization for spatial data.

---

*Last Updated: May 2026*
