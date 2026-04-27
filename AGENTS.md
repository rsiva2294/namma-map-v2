# AGENTS.md

Repository-wide instructions for AI coding tools working on NammaMap V2.

## Purpose

NammaMap V2 is a React + TypeScript GIS application for Tamil Nadu service discovery.
The app relies on:

- `react` + `vite` for the UI shell
- `zustand` for shared app state
- `leaflet` + `react-leaflet` for map rendering
- `src/workers/gis.worker.ts` for GIS, search, and dataset processing
- static datasets in `public/data`

This file defines the default engineering rules an AI tool must follow for every change.

## AI Interaction Rules

- **MANDATORY APPROVAL:** You are NOT allowed to perform `git commit`, `git push`, `npm run build`, `firebase deploy`, or any browser-based automated testing without taking explicit approval from the USER first. Always ask before execution.
- **PLANNING FIRST:** If a request requires a significant amount of work or affects multiple files, you MUST prepare a detailed implementation plan and wait for explicit approval before starting any execution.

## Source Of Truth

- Treat the running code as the primary source of truth.
- Treat markdown docs as helpful context, not guaranteed current state.
- Before changing behavior, inspect the relevant implementation files first.
- If code and docs disagree, trust the code, then update the relevant docs only if your change makes the docs materially incorrect.

## Required Workflow

For any non-trivial change:

1. Read the affected implementation before editing.
2. Make the smallest coherent change that solves the actual problem.
3. Preserve existing architecture unless a refactor is clearly justified.
4. Run validation before finishing.
5. Summarize what changed, how it was validated, and any remaining risk.

## Architecture Rules

- Keep UI rendering logic in React components under `src/components` and `src/features`.
- Keep cross-component state in `src/store/useMapStore.ts`.
- Keep map-worker communication in `src/hooks/useGisWorker.ts`.
- Keep heavy GIS logic, spatial indexing, dataset fetches, and geometry resolution in `src/workers/gis.worker.ts`.
- Do not move computationally heavy loops from the worker back to the React/main thread.
- Prefer extending existing layer patterns instead of inventing a parallel architecture.

## TypeScript Standards

- Maintain strict, explicit TypeScript types.
- Do not introduce `any` unless there is no practical alternative, and if used, keep it narrow and documented.
- Reuse and extend shared GIS types in `src/types/gis.ts` instead of redefining ad hoc shapes in components.
- Prefer narrowing and discriminated unions over casting.
- Keep public function signatures typed, especially for store actions, worker messages, and geometry helpers.

## State Management Rules

- Use Zustand selectors instead of reading the whole store when a component only needs a few values.
- Keep state minimal and derived where possible.
- Avoid duplicating the same truth in multiple store fields unless there is a clear UX or performance reason.
- When adding store fields, also consider reset behavior in `clearSearch` and layer-switch behavior in `setActiveLayer`.

## Worker And GIS Rules

- Spatial resolution, dataset filtering, and indexing belong in the worker.
- Preserve or improve the current indexed approach using `rbush` where applicable.
- Prefer targeted dataset loading and caching over eager statewide loading.
- Avoid repeated full-array scans when an existing index or cache can be reused.
- Be careful with coordinate order: this codebase uses `[lng, lat]` in GeoJSON and often converts to `[lat, lng]` for Leaflet.
- If you change polygon resolution or geometry filtering, add or update tests.

## UI And UX Rules

- Preserve the current app structure: sidebar, floating search, result cards, and lazy-loaded map.
- Prefer CSS classes and CSS variables over inline styles when changing presentation.
- Reuse existing visual patterns before creating new ones.
- Keep map interactions responsive and mobile-friendly.
- Use `dvh` (dynamic viewport height) units for bottom sheets and floating panels to account for mobile browser toolbars.
- Use `env(safe-area-inset-bottom)` for padding in bottom-anchored UI to support modern mobile device navigation bars.
- For accessibility, prefer semantic buttons, labels, and ARIA only where it adds real value.
- Do not add UI controls that have no behavior behind them unless the task explicitly calls for placeholders.

## Performance Rules

- Protect first-load performance and interactivity.
- Lazy-load heavy UI modules when it fits the current architecture.
- Avoid unnecessary rerenders from broad store subscriptions.
- Avoid recomputing large GeoJSON transformations in render paths.
- Do not load large datasets in components if the worker can own that lifecycle.

## Data Rules

- Do not commit raw PII or unreviewed sensitive data.
- Keep dataset changes scoped and intentional.
- If you modify files under `public/data`, preserve naming conventions and verify the app still resolves the affected layer.
- Do not silently change schema assumptions for pincode, PDS, or TNEB properties without updating the consuming code paths.

## Testing And Validation

Before finishing a change, run:

- `npm run lint`
- `npm run build`

When changing worker logic, geometry helpers, or indexing behavior, also run:

- `npx vitest run src/workers/gis.worker.test.ts`

If a validation step cannot be run, say so explicitly in the final summary.

## Documentation Rules

- Do not update markdown files just because they exist.
- Update docs only when behavior, architecture, setup, commands, or user-facing workflows materially changed.
- Keep docs concise and aligned with the codebase as it exists now.
- If a change makes a doc inaccurate, update the smallest relevant doc instead of rewriting all docs.
- Avoid creating new roadmap or review markdown files unless the user explicitly asks for them.

## Deployment And Versioning Rules

- The application uses an automated versioning system triggered by `npm run build`.
- Do not manually edit `public/version.json` or the `APP_VERSION` constant in `src/App.tsx`; they are synchronized during the build process.
- When adding a new feature that requires a specific data schema, ensure the build version is updated to force user-side cache invalidation.
- **DOCS SYNC:** All relevant documentation (README, ARCHITECTURE, CHANGELOG, and Guides) MUST be updated to reflect current behavior before any `firebase deploy`.

## Editing Rules

- Prefer focused edits over broad rewrites.
- Do not rename files, move modules, or reorganize directories unless the change benefits are clear and immediate.
- Do not introduce new dependencies unless they are justified by the task and fit the existing stack.
- Follow existing naming conventions and component boundaries.
- Keep comments sparse and useful.

## Completion Bar

A change is not complete unless:

- the implementation is coherent with the current architecture
- types remain sound
- validation passes or failures are explained
- any materially affected docs are updated
- the final summary includes changed files, validation performed, and follow-up risks if any
