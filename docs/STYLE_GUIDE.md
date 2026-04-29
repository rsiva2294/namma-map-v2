# NammaMap Style Guide

This is the default visual and content language for NammaMap, the Tamil Nadu civic GIS portal at `nammamap.in`.

## 1) Brand

- Brand name: `NammaMap`
- Public descriptor: `Tamil Nadu Civic GIS Portal`
- Brand tone: helpful, local, precise, calm, trustworthy
- Preferred shorthand in UI: `NammaMap`
- Use the full scope only where clarity matters: `NammaMap - Tamil Nadu`

## 2) Brand Meaning

- `Namma` should feel community-first and rooted in place.
- The product should feel useful before it feels decorative.
- The UI should help people find services, boundaries, and locations quickly.

## 3) Visual Direction

- Primary style: glassmorphism with clear layering
- Mood: civic, modern, map-first, slightly premium
- Avoid flat generic SaaS styling
- Avoid clutter, heavy borders, and large decorative surfaces
- Let the map remain the hero of the page

## 4) Color System

Use the existing token-driven palette in `src/index.css` as the source of truth.

- Main dark base: slate / navy
- Light mode: soft white and slate surfaces
- Accent: cyan-blue
- Semantic colors:
  - red for PDS / alerts / errors
  - orange for utilities and warnings
  - indigo / violet for civic data
  - rose for health
  - slate for police / neutral states

Rules:

- Use tokens instead of hardcoded colors whenever possible
- Keep contrast strong in both light and dark mode
- Do not introduce new accent families casually

## 5) Typography

- Primary family: system / app-default sans stack already in the app
- Tone: clean, readable, functional
- Headings should be short and direct
- Body copy should be concise and action-oriented
- Tamil text must remain readable and not feel squeezed

Rules:

- Favor medium to semibold weights for labels and controls
- Avoid oversized display type
- Keep uppercase labels short and spaced

## 6) Layout Principles

- Map-first structure
- Floating search bar near the top
- Sidebar for layer navigation
- Results as floating cards on desktop and bottom sheets on mobile
- Overlays should stack clearly and never hide the primary action

Spacing and shape:

- Use rounded corners consistently
- Prefer soft shadows over hard edges
- Keep panels compact but breathable
- Use visible hierarchy rather than dense borders

## 7) Component Language

Standard surfaces:

- Glass panels for controls and overlays
- Rounded cards for results and summaries
- Bottom sheets for mobile result and filter surfaces

Standard controls:

- Icon + label buttons for key actions
- Pill badges for status and metadata
- Toggle-style controls for filters
- Clear close buttons for dismissible surfaces

Standard patterns:

- Search suggestions should feel like a command surface
- Result cards should feel informative, not editorial
- Modals should be simple, direct, and action-focused

## 8) Mobile Rules

- Mobile is a first-class layout, not a compressed desktop view
- Use bottom sheets for results and dense filter panels
- Keep tap targets large and well spaced
- Use `dvh` and safe-area padding for fixed bottom surfaces
- Avoid hover-only interactions
- Keep the map visible behind controls where possible

## 9) Motion

- Motion should be subtle and functional
- Use quick fades, slides, and small scale transitions
- Animate to clarify state changes, not to decorate
- Avoid large bouncy motion or gimmicky effects

## 10) Accessibility

- Keep focus states visible
- Ensure controls have labels
- Preserve keyboard access for search, menus, and dialogs
- Maintain readable contrast in both themes
- Keep text and buttons large enough for touch

## 11) Voice And Copy

- Friendly, not playful
- Clear, not clever
- Local, not parochial
- Helpful, not verbose

Preferred copy traits:

- Use action verbs
- Keep labels short
- Explain data states plainly
- Avoid jargon unless the user already expects it

## 12) What To Protect

Do not drift away from these core traits:

- civic utility
- map-first layout
- glass panels and layered overlays
- bilingual support
- strong mobile usability
- fast, lightweight interaction

