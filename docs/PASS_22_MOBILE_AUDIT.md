# Pass 22 — Mobile Responsive Audit (Batch 5)

Companion to `PASS_22_REPORT.md`. Documents what shipped in B5 vs what was identified for Pass 23.

## Viewports audited

- iPhone 14 (390 × 844)
- iPhone SE (375 × 667)
- Pixel 7 (412 × 915)
- iPad Mini (768 × 1024)

## What shipped in B5 (Bugs 22.18, 22.19, 22.20)

### Bug 22.18 — admin desktop-only gate

`src/pages/AdminPage.tsx` now shows an explicit "Admin is desktop-only" message below the `lg` breakpoint (< 1024 px). The dashboard renders dense KPI tiles, multi-column tables, and side-by-side charts that don't condense usefully on mobile; gating with a message is more honest than shipping a half-broken layout.

### Pre-existing mobile work (Pass 21 + earlier)

The following components/pages already have mobile breakpoints in place from earlier passes and were verified during this audit. No regressions found:

- `MobilePriceSummary.tsx` — sticky bottom bar on Mission Setup
- `StickyActionFooter.tsx` — touch-friendly continue button
- `TopNav.tsx` — hamburger menu below `md`
- `QuestionEngine.tsx` — stacked layout on small screens
- `AdminRevenue.tsx` — already gates desktop-only on its own

Recharts' `ResponsiveContainer` handles chart width fluidly. Charts remain readable at 390 px viewport, though donut → horizontal bar conversion below 480 px (Bug 22.20) is deferred to Pass 23 (see below).

## Deferred to Pass 23

These were identified during the audit but not shipped in B5 to keep scope contained. Each is a tactical CSS or component change with no architectural concerns.

### Mission Control mobile rewrite (Bug 22.19)

**Current state:** `MissionSetupPage.tsx` is multi-column with a fixed-width sidebar. Pre-existing `MobilePriceSummary` covers the sticky bottom CTA; the form itself stacks reasonably under existing breakpoints. Form-field touch targets are ≥ 44 px.

**Pass 23 work:**

- Sidebar → bottom drawer or accordion above main form on mobile
- Slider min-height bump to 44 px (currently 32 px)
- Screener preview card (Bug 22.24 follow-up) when the user-editable UI ships

### Chart horizontal-bar fallback below 480 px (Bug 22.20)

**Current state:** Recharts donuts and bar charts render at all viewports but legend labels can crowd below 360 px.

**Pass 23 work:**

- Wrap chart selection in a `useEffect` that swaps donut → horizontal bar at `window.innerWidth < 480`
- Stack legend below the chart at `< 360 px`
- Test specifically with cat hotel results page on iPhone SE

### Per-route micro-fixes

These are tactical and low-risk. Picked up during the next non-B5 frontend touch:

- `/missions` — long mission titles wrap awkwardly at 375 px (use `truncate` + tooltip)
- `/results/:id` — KPI tile gap collapses to 12 px below `sm` (currently 16 px → too cramped)
- `/auth/*` — input padding could be 16 px instead of 12 px for thumb comfort
- Landing hero: `> _` prompt indicator was lost in the Pass 21 Bug 14 `min-w-0` fix; restore as a separate sibling element
- Landing "FROM $35" pricing labels: bump 12-14 px → 16-18 px
- Landing whitespace between research category cards: tighten 200 px → 80-120 px gap

## How to verify shipped work

Open `https://www.vettit.ai/admin` on a viewport < 1024 px (Chrome DevTools mobile mode is fine). The gate message renders. Above 1024 px the dashboard renders as before.

## Owner of the punch list

These are not blockers. They land naturally as the next frontend touch on each route. Pass 22 ships the highest-impact item (admin gate) and documents the rest for Pass 23 sequencing.
