# Health Module UI Redesign Requirements

## Purpose

This document defines the redesign requirements for the `HEALTH` module UI in NammaMap.

The current implementation is functionally strong but cognitively heavy. Even a developer can feel intimidated by the current health interface. For the general public, the experience should be far simpler, more guided, and easier to understand without medical-system knowledge.

This is a refinement and simplification effort, not a greenfield rebuild.

## Core Problem

The current HEALTH module exposes too much complexity too early:

- too many filters are visible at once
- medical abbreviations are front-loaded
- the screen reflects the dataset structure more than the public user’s mental model
- the UI does not provide a clear “happy path” for first-time users

The public should be able to answer questions like:

- Where is the nearest hospital?
- What hospitals are in my district?
- Which place offers delivery services?
- What is available in my area?
- Which is the major hospital near me?

without needing to understand abbreviations such as:

- `HSC`
- `PHC`
- `CHC`
- `SDH`
- `MCH`
- `FRU`
- `SNCU`
- `NBSU`
- `DEIC`
- `CBNAAT`
- `STEMI`

## Design Goal

The HEALTH module should feel understandable to an ordinary citizen within a few seconds.

The experience should:

- be task-first, not filter-first
- use plain language before abbreviations
- reduce visible controls on first load
- reveal complexity progressively
- make the next action obvious at all times

## Constraints

- Do not redesign the whole app from scratch
- Reuse the existing React + Zustand + Leaflet + worker architecture
- Preserve existing HEALTH functionality
- Do not weaken the data model
- Do not remove advanced health capability support
- Prefer progressive disclosure over permanent simplification

## Existing References

- `docs/health-module-integration-plan.md`
- `docs/health-facilities-reference-chart.md`

## Required Redesign Direction

### 1. Shift From Filter-First To Task-First

The HEALTH module should not open into a dense control surface.

The first view should help the user begin immediately.

Required first-view structure:

- keep the search bar prominent
- add a small “How do you want to explore?” section
- show 3 simple top-level entry modes:
  - `Statewide`
  - `District`
  - `My Area`
- show 4 quick service shortcuts:
  - `Emergency`
  - `Delivery`
  - `Child Care`
  - `Diagnostics`
- show one secondary entry point:
  - `More filters`

Expected outcome:

- a new user should immediately know how to start
- the first screen should contain only the most understandable choices
- medical/data-model complexity should remain accessible, but not front-loaded

### 2. Redesign Scope Labels

Current labels like `Priority / District / Local` are not public-friendly.

Replace them with plain language:

- `Statewide`
- `District`
- `My Area`

Alternative acceptable wording:

- `Major Hospitals`
- `District View`
- `Local Area`

The meaning of each scope must be immediately understandable without explanation.

### 3. Redesign The Filter Panel

The current panel exposes too many filters at once and reads like an admin tool.

Split filters into:

- `Quick filters`
- `More filters`

#### Quick Filters

These should be visible by default:

- `Emergency`
- `Delivery`
- `Child Care`
- `Diagnostics`
- `Major Hospitals`
- `Primary Care`

#### More Filters

All other filters should live under `More filters`, organized into collapsible groups.

Recommended groups:

##### A. Care level

- Major hospitals
- Primary care centres
- All facilities

##### B. Area

- Statewide
- District
- Pincode / My Area
- Urban
- Rural

##### C. Common services

- Delivery
- Emergency referral
- Newborn care
- Scans / diagnostics
- Dialysis

##### D. Advanced medical filters

- Health & Wellness Centre
- Blood Bank
- Blood Storage
- CBNAAT
- Tele-Consultation
- STEMI Hub
- STEMI Spoke
- Cath Lab
- and other advanced capability filters already supported by the data

Requirements:

- only one or two groups should be expanded by default
- keep visible first-screen controls low
- use stronger visual hierarchy and spacing to reduce cognitive load

### 4. Use Plain Language Before Abbreviations

The current interface assumes knowledge of health-system abbreviations.

Use plain-language labels first and abbreviations second.

Examples:

- `District Hospital (DH)`
- `Medical College Hospital (MCH)`
- `Community Health Centre (CHC)`
- `Primary Health Centre (PHC)`
- `Health Sub Centre (HSC)`

For capability labels, use human-readable language:

- `First Referral Unit` instead of `FRU` as the main label
- `Newborn Care Unit` instead of raw abbreviations when practical
- `CT Scan`
- `Dialysis Centre`
- `Tele-Consultation`

Requirements:

- public copy must be readable without domain expertise
- abbreviations may still appear in smaller labels, badges, or tooltips
- avoid raw schema-like wording

### 5. Redesign The Right-Side Summary / Guidance Card

The card should behave like a guide, not just a dashboard.

#### Statewide View

Recommended structure:

- title: `Major Hospitals Across Tamil Nadu`
- guidance copy:
  - `Showing major hospitals across the state. Search a district or choose My Area to narrow results.`
- show only the most useful summary numbers
- do not overload the card with too many counts at once

#### District View

Recommended structure:

- title: `Health Facilities in [District]`
- guidance copy:
  - `Use quick filters to find delivery, emergency, or diagnostics services.`
- show counts by facility level
- show a short list of top available services

#### My Area View

Recommended structure:

- title: `Facilities in Your Selected Area`
- guidance copy:
  - `Tap a marker to view details and directions.`
- show total results and a short service summary

Requirements:

- every mode should make the next step obvious
- the card should guide, not simply report

### 6. Redesign The Facility Detail Card

The data is valuable, but the presentation should be more human-friendly.

Recommended display order:

- facility name
- facility level/type in plain language
- district / area
- key services available
- timing / `24x7` if applicable
- directions action

Capability badges should be simplified and translated into user language.

Recommended badge groups:

- Delivery
- Emergency Referral
- Newborn Care
- Blood Bank
- Blood Storage
- CT Scan
- MRI
- Dialysis
- Tele-Consultation
- Cardiac Care

If many badges are present:

- show the most important first
- collapse the rest behind `More details`

### 7. Improve Marker Hierarchy On The Map

The user should understand relative facility importance visually.

Required visual hierarchy:

- `Medical College Hospital / District Hospital`
  - largest and strongest markers
- `Sub-District Hospital / Community Health Centre`
  - medium markers
- `Primary Health Centre`
  - smaller markers
- `Health Sub Centre`
  - smallest and quietest markers

Requirements:

- a user should sense importance without reading a legend
- selected marker state must remain very obvious
- clusters should remain readable and not feel noisy

Optional:

- add a small legend or helper note such as:
  - `Larger markers indicate major hospitals`

### 8. Redesign Interaction Flow

The HEALTH module should feel guided.

Desired flow:

1. Choose an area or task
2. Narrow by need
3. View facilities
4. Tap for details

Expected common flows:

- Statewide -> Delivery -> District -> Facility
- Search district -> View facilities -> Filter by diagnostics
- My Area -> View nearby facilities -> Tap for directions

Requirements:

- at each stage, the screen should imply the next action
- avoid leaving users in ambiguous states where they must guess what to do next

### 9. Progressive Disclosure Rules

Implement the following simplification rules:

- show only essential controls by default
- hide advanced filters under `More filters`
- collapse advanced medical groupings by default
- prefer 4 to 6 visible actions, not 20+
- prefer service categories before expert medical jargon

### 10. Preserve Existing Strengths

Do not remove:

- worker-driven filtering architecture
- district and local drill-down capability
- advanced health filtering capability in principle
- clustered map exploration
- directions actions
- health summaries
- search support

These should be refined and simplified, not removed.

## Execution Plan

Implement the redesign in phases.

### Phase A: Immediate Simplification

Focus on the highest-impact usability fixes:

- rename scope controls
- reduce first-screen filter density
- add quick task/service shortcuts
- add clearer guidance copy in the summary card
- replace technical wording with public-facing labels

### Phase B: Progressive Disclosure

Restructure complexity without losing capability:

- move advanced filters into `More filters`
- group filters into collapsible sections
- show only common needs by default
- refine facility card language and badge presentation

### Phase C: Visual Clarity And Polish

Strengthen legibility and confidence:

- improve marker hierarchy by facility level
- improve summary-card readability
- improve empty states and guidance text
- add small helper copy or legend where useful

## Success Criteria

The redesigned HEALTH module should be understandable to a non-technical citizen within a few seconds.

A first-time user should immediately understand:

- how to start
- what the current view represents
- what the next action should be
- how to find a relevant hospital or service

## Delivery Expectations

When executing this redesign:

1. review the current HEALTH implementation first
2. preserve existing functionality while reducing cognitive load
3. execute the redesign phase by phase
4. after each phase, summarize:
   - what was simplified
   - what was moved behind progressive disclosure
   - how the redesign improves public usability
