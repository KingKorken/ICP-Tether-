---
title: "Phase 1a: Calculator UX Improvements"
type: feat
status: completed
date: 2026-03-24
origin: docs/brainstorms/2026-03-24-customer-feedback-improvements-brainstorm.md
---

# Phase 1a: Calculator UX Improvements

## Overview

Five quick UX wins from the Tether customer feedback call (2026-03-18). These are isolated, low-risk changes that can ship fast to show the client momentum. They do not touch the data model or external APIs.

1. Calculate button with randomized animation delay
2. Remove Contact Sales button
3. Projection horizon: 3/6/12 months with real month names
4. Lock Y-axis scaling on charts
5. Re-add MethodologyPanel accordion (opening downward)

## Problem Statement / Motivation

The customer identified several trust and usability issues:
- **Instant calculation feels untrustworthy** — "If it's instant, people don't trust it" (Farid). Users need to feel the system is doing real work.
- **24-month horizon implies forecasting** — "How does Tether know what the revenue will be in two years? Impossible." They use historical prices, not predictions.
- **Y-axis rescaling is confusing** — When inputs change, the axis rescales and bars appear flat or declining even when values increase.
- **Contact Sales button is irrelevant** — Sales motion is outbound; the button doesn't match the workflow.
- **Methodology hidden** — The "See the Math" panel exists in code but isn't rendered.

(see brainstorm: docs/brainstorms/2026-03-24-customer-feedback-improvements-brainstorm.md)

## Proposed Solution

### Task 1: Calculate Button + Animation

**Current behavior:** `SimulatorClient.tsx` uses `useDeferredValue(inputs)` piped into `useMemo(() => calculateRevenue(...))` for live recalculation on every input change. A debounced save (2s) fires a `SNAPSHOT_SAVED` tracking event on slider movement.

**New behavior:**
- Remove live auto-update: decouple `useMemo` from `deferredInputs`. Instead, store a separate `calculatedResults` state that only updates when the user clicks "Calculate."
- On page load (first visit or returning): show an **empty placeholder state** — no charts, no revenue numbers, just a prompt: "Configure your inputs and click 'Calculate' to see your revenue projections."
- On Calculate click:
  1. Disable the form inputs and the Calculate button
  2. Show a "Recalculating..." overlay on the results area
  3. Wait a **randomized** 1–3 seconds (using `Math.random() * 2000 + 1000`)
  4. Run `calculateRevenue(inputs)` and set `calculatedResults`
  5. Save the snapshot to the database (needs new API route)
  6. Re-enable the form
- Remove the existing debounced save mechanism entirely — the Calculate button is the single save trigger.
- For the `/demo` page: skip the DB save (guard on `tokenId === "demo-token"`).

**Files to modify:**

| File | Change |
|------|--------|
| `src/app/(simulator)/sim/t/[token]/SimulatorClient.tsx` | Replace `useMemo` auto-calc with `calculatedResults` state; add `handleCalculate` function; remove `debouncedSave`; add loading/empty states; disable form during calculation |
| `src/components/calculator/CalculatorForm.tsx` | Add Calculate button at the bottom of the form; accept `disabled` and `onCalculate` props |
| `src/components/calculator/ResultsHero.tsx` | Accept optional `isEmpty` prop to render placeholder state |
| `src/components/calculator/SeasonalChart.tsx` | Accept optional `isEmpty` prop to render empty chart placeholder |
| `src/components/calculator/CumulativeTimeline.tsx` | Accept optional `isEmpty` prop to render empty chart placeholder |
| `src/app/api/snapshots/route.ts` | **NEW** — POST endpoint that calls `saveSnapshot` from `queries.ts` |
| `src/app/(simulator)/demo/page.tsx` | Pass `isDemoMode` prop to skip DB save |

**Calculate button design:**
```
┌──────────────────────────────────────┐
│  [Form inputs...]                    │
│                                      │
│  ┌──────────────────────────────────┐│
│  │       ⚡ Calculate Revenue       ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```
Full-width primary button (`bg-brand-primary text-white`) at the bottom of the `CalculatorForm` card.

**Overlay design:**
```
┌──────────────────────────────────────┐
│                                      │
│         ⟳ Recalculating...          │
│                                      │
│    Analyzing market conditions...    │
│                                      │
└──────────────────────────────────────┘
```
Semi-transparent overlay covering the entire results column. Spinner animation + text. Background blur optional.

---

### Task 2: Remove Contact Sales Button

**Current:** `ContactSalesCTA` rendered at `SimulatorClient.tsx:255-261`, after LossCounter.

**Changes:**
- Remove the `<ContactSalesCTA>` JSX and its import from `SimulatorClient.tsx`
- Keep `ContactSalesCTA.tsx` component file intact (stub for future re-enabling)
- Keep event definitions in `events.ts` (dead code but harmless)
- Keep `createContactRequest` in `queries.ts` (historical data still visible in admin)
- Fix bottom spacing: adjust margin on LossCounter wrapper since the CTA's `mb-16` is removed

**Note:** The `"contact-sales.submitted"` event type was never in `VALID_EVENT_TYPES` — it was silently dropped in production. No analytics data was lost by this removal because submissions were never persisted.

**Files to modify:**

| File | Change |
|------|--------|
| `src/app/(simulator)/sim/t/[token]/SimulatorClient.tsx` | Remove ContactSalesCTA import and JSX; adjust spacing |

---

### Task 3: Projection Horizon — 3/6/12 Months with Real Month Names

**Current:** 12/24 month toggle. Engine starts at month index 0 (January). Labels are "Jan"–"Dec" for 12mo or "M1"–"M24" for 24mo. Zod validates `min(12).max(24)`.

**New behavior:**
- **Selector:** 3-button toggle: "3 mo", "6 mo", "12 mo"
- **Start month:** Current calendar month via `new Date().getMonth()`, computed once at page load and passed to the engine
- **Month labels:** Real month names starting from current month (e.g., visiting in March → "Mar, Apr, May, Jun, Jul, Aug...")
- **Revenue semantics:** Hero number matches the horizon period — "Estimated 3-Month Revenue", "Estimated 6-Month Revenue", "Estimated Annual Revenue"
- **All input changes (including horizon) require clicking Calculate** (see brainstorm: decision #3)

**Engine changes (`engine.ts`):**
- Add `startMonth` parameter (0-11) to `calculateRevenue` function signature
- Change loop indexing from `m % 12` to `(startMonth + m) % 12` for all monthly data lookups: `RES_SEASONAL`, `HOURS_PER_MONTH`, `mfrr_up/down`, `fcrd_up/down`
- Change `totalCPO` to sum only `totalMonths` months (not always 12): `monthlyEcredits.slice(0, totalMonths).reduce(...)`
- Generate month labels by rotating `MONTH_LABELS` to start from `startMonth`
- Remove the `totalMonths > 12 ? M${m+1}` label logic

**Schema changes (`types.ts`):**
- Change Zod: `horizonMonths: z.union([z.literal(3), z.literal(6), z.literal(12)]).default(12)`
- Change `DEFAULT_STATE`: keep `horizonMonths: 12`
- Remove unused `MONTH_LABELS_24` from `constants.ts`

**Chart changes:**
- `SeasonalChart.tsx`: Accept variable-length data (3, 6, or 12 points). Update subtitle to "Monthly revenue breakdown ({N} months)". For 3-month views, the area chart still works — bars are wider.
- `CumulativeTimeline.tsx`: Already handles variable `totalMonths`. Update subtitle dynamically.
- `ResultsHero.tsx`: Dynamic label: "Estimated {N}-Month Revenue" (or "Estimated Annual Revenue" for 12).

**Files to modify:**

| File | Change |
|------|--------|
| `src/lib/calculator/engine.ts` | Add `startMonth` param; fix month indexing with `(startMonth + m) % 12`; change `totalCPO` to sum `totalMonths` not 12; rotate month labels |
| `src/lib/calculator/types.ts` | Update Zod schema for 3/6/12; update DEFAULT_STATE |
| `src/lib/calculator/constants.ts` | Remove unused `MONTH_LABELS_24` |
| `src/components/calculator/CalculatorForm.tsx` | Change horizon toggle from 2-button (12/24) to 3-button (3/6/12) with labels "3 mo", "6 mo", "12 mo" |
| `src/components/calculator/SeasonalChart.tsx` | Handle 3/6/12 data points; dynamic subtitle |
| `src/components/calculator/CumulativeTimeline.tsx` | Dynamic subtitle; adjust XAxis interval for 3/6 months |
| `src/components/calculator/ResultsHero.tsx` | Dynamic "Estimated {N}-Month Revenue" label |
| `src/components/calculator/LossCounter.tsx` | Already uses `totalMonths` dynamically — verify it still works with 3/6 |
| `src/app/(simulator)/sim/t/[token]/SimulatorClient.tsx` | Compute `startMonth` from current date; pass to engine |

---

### Task 4: Lock Y-Axis Scaling

**Current:** Both `SeasonalChart` and `CumulativeTimeline` use Recharts auto-scaling (no `domain` prop on `<YAxis>`). The axis rescales when inputs change, making bars appear to shrink even when values increase.

**New behavior:**
- Compute a fixed Y-axis ceiling from the theoretical maximum revenue using max possible inputs (10,000 chargers, 22 kW, 40% utilization, 80% flexibility, public type, best country)
- Set `domain={[0, ceiling]}` on each chart's `<YAxis>`
- Two different ceilings needed:
  - **Seasonal chart (monthly):** Max possible monthly combined revenue (e-credits + flexibility) for a single month
  - **Cumulative chart:** Scale proportionally with horizon — `ceiling_cumulative = maxMonthlyCeiling * horizonMonths`

**Computing the ceilings:**
- Run `calculateRevenue()` with max-input state for each country and take the highest monthly value
- Round up to a "nice" number (next 50K, 100K, or 1M boundary)
- Store as constants: `MAX_MONTHLY_CEILING` and derive cumulative from it

**Small-input visibility:** With 10 chargers against a 10,000-charger ceiling, bars will be tiny (~0.1% of chart height). This is acceptable — the visual contrast communicates the scale of opportunity with a larger fleet. No special mitigation needed per brainstorm decision.

**Files to modify:**

| File | Change |
|------|--------|
| `src/lib/calculator/constants.ts` | Add `MAX_MONTHLY_CEILING` constant (computed from max inputs) |
| `src/components/calculator/SeasonalChart.tsx` | Add `domain={[0, MAX_MONTHLY_CEILING]}` to `<YAxis>`; add `allowDataOverflow={false}` |
| `src/components/calculator/CumulativeTimeline.tsx` | Accept `horizonMonths` prop; add `domain={[0, MAX_MONTHLY_CEILING * horizonMonths]}` to `<YAxis>` |

---

### Task 5: Re-add MethodologyPanel Accordion

**Current:** `MethodologyPanel.tsx` exists as a complete component but is not imported anywhere. It already expands downward (content below button). Tracks `METHODOLOGY_EXPANDED` event (properly defined in `events.ts`).

**Changes:**
- Import and render `MethodologyPanel` in `SimulatorClient.tsx` **after LossCounter**, full-width
- Position where `ContactSalesCTA` used to be
- Verify expand direction is downward (it already is per current code)
- Add bottom margin (`mb-16`) for footer spacing

**Note:** The panel's formula values are hardcoded strings that match the current constants. Leave as-is — this is low-frequency change risk and can be dynamicized later if constants change.

**Files to modify:**

| File | Change |
|------|--------|
| `src/app/(simulator)/sim/t/[token]/SimulatorClient.tsx` | Import `MethodologyPanel`; add JSX after LossCounter with `mt-6 mb-16` wrapper |

---

## Technical Considerations

### Architecture Impact
- The main architectural change is decoupling calculation from input state. Currently `useMemo(calculateRevenue(deferredInputs))` is the core reactive pattern. After Task 1, this becomes an imperative `handleCalculate()` function triggered by button click.
- The `useDeferredValue` wrapper becomes unnecessary and should be removed.
- A new API route (`/api/snapshots`) is needed for the Calculate button's save action.

### State Management
After Task 1, `SimulatorClient` will manage:
- `inputs` (SimulatorState) — updated on every slider/input change (no calculation triggered)
- `calculatedResults` (CalculationResult | null) — updated only on Calculate click
- `isCalculating` (boolean) — true during the fake delay
- `startMonth` (number) — computed once from `new Date().getMonth()`

### Performance
- No regression concern. The engine completes in <16ms. The fake delay (1-3s) is intentionally slower than the real calculation.
- Removing `useDeferredValue` and `useMemo` actually simplifies the React render cycle.

### Demo Page Guard
The `/demo` page uses fake IDs (`tokenId="demo-token"`). The new `/api/snapshots` route will reject these. Pass an `isDemoMode` flag to `SimulatorClient` so it skips the save call in demo mode but still shows the calculation overlay.

## System-Wide Impact

- **Event tracking:** The debounced `SNAPSHOT_SAVED` event currently fires on slider movement. After Task 1, it fires only on Calculate click. This changes event volume significantly (fewer events). Analytics dashboards relying on `SNAPSHOT_SAVED` frequency may need attention.
- **PDF report:** `RevenueReport.tsx` still references "Estimated Annual Revenue." With Task 3's horizon-aware labels, the PDF template should be updated to match. However, the PDF route is not yet implemented (`/api/reports/pdf` returns "not yet implemented"), so this is future work.
- **Admin dashboard:** `getLeadsForAdmin` counts contact requests per lead. After removing the CTA, no new contact requests will be created. Historical data remains. No code change needed in admin.

## Acceptance Criteria

### Task 1: Calculate Button
- [x] No results shown on initial page load (empty placeholder state)
- [x] "Calculate Revenue" button at the bottom of the form card
- [x] Clicking Calculate shows "Recalculating..." overlay for 1-3 seconds (randomized)
- [x] Results reveal after the delay completes
- [x] Form inputs and Calculate button disabled during calculation
- [x] Inputs saved to database on Calculate click (via new `/api/snapshots` POST route)
- [x] No auto-save on slider movement (debounced save removed)
- [x] Demo page works without DB save errors
- [x] Changing any input after calculation shows stale results until Calculate is clicked again (or reverts to empty state)

### Task 2: Remove Contact Sales
- [x] ContactSalesCTA not rendered in the simulator page
- [x] `ContactSalesCTA.tsx` component file still exists (stub)
- [x] No layout gaps or spacing issues after removal

### Task 3: Projection Horizon
- [x] 3-button toggle showing "3 mo", "6 mo", "12 mo" (default: 12 mo)
- [x] Month labels are real month names starting from current calendar month
- [x] Hero shows "Estimated {N}-Month Revenue" matching selected horizon
- [x] Seasonal chart shows correct number of data points (3, 6, or 12)
- [x] Cumulative chart shows correct number of data points
- [x] LossCounter text matches selected horizon
- [x] Changing horizon requires Calculate click (same as other inputs)
- [x] Zod schema accepts 3, 6, or 12 (rejects other values)

### Task 4: Y-Axis Lock
- [x] Y-axis does not rescale when inputs change
- [x] Seasonal chart Y-axis ceiling is based on theoretical maximum monthly revenue
- [x] Cumulative chart Y-axis ceiling scales proportionally with selected horizon
- [x] Charts remain readable with maximum inputs (bars fill most of chart height)

### Task 5: MethodologyPanel
- [x] "See the Math" accordion visible after LossCounter
- [x] Expands downward on click, does not obscure other content
- [x] Shows E-Credit formulas, Grid Flexibility formulas, Data Sources
- [x] `METHODOLOGY_EXPANDED` event tracked on expansion

## Implementation Order

These tasks can be implemented in any order, but this sequence minimizes conflicts:

1. **Task 2: Remove Contact Sales** — trivial, clears space for Task 5
2. **Task 5: Re-add MethodologyPanel** — trivial, fills the space from Task 2
3. **Task 3: Projection Horizon** — engine + UI change, independent of Task 1
4. **Task 4: Y-Axis Lock** — depends on Task 3 (cumulative ceiling scales with horizon)
5. **Task 1: Calculate Button** — largest change, touches SimulatorClient extensively. Do last to avoid merge conflicts with Tasks 3/4 which also modify chart components.

## Dependencies & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| New `/api/snapshots` route needs auth/session handling | Task 1 blocked | Follow existing pattern from `/api/events/track` route |
| Max ceiling computation may produce awkward numbers | Task 4 visual quality | Round up to nice numbers (nearest 50K/100K) |
| 3-month area chart may look sparse | Task 3 visual quality | Test with real data; consider bar chart if area chart looks thin |
| Removing debounced save means crash = lost inputs | Task 1 data loss | Accept this trade-off per brainstorm decision; the user explicitly clicks to save |
| Engine `startMonth` makes tests date-dependent | Task 3 test stability | Allow `startMonth` to be passed explicitly in tests (default to `new Date().getMonth()` in production) |

## Sources & References

### Origin
- **Brainstorm document:** [docs/brainstorms/2026-03-24-customer-feedback-improvements-brainstorm.md](../brainstorms/2026-03-24-customer-feedback-improvements-brainstorm.md) — Key decisions carried forward: single Calculate button (decision #3), randomized 1-3s delay (decision #4), 3/6/12 month horizons starting from current month (decisions #5-6), y-axis ceiling from max inputs (resolved question #6)

### Key File Paths
- `src/app/(simulator)/sim/t/[token]/SimulatorClient.tsx` — Main orchestrator (Tasks 1, 2, 3, 5)
- `src/components/calculator/CalculatorForm.tsx` — Input form + horizon toggle (Tasks 1, 3)
- `src/lib/calculator/engine.ts` — Revenue calculation engine (Tasks 3, 4)
- `src/lib/calculator/types.ts` — Zod schema + state types (Task 3)
- `src/lib/calculator/constants.ts` — Month labels, seasonal constants (Tasks 3, 4)
- `src/components/calculator/SeasonalChart.tsx` — Seasonal chart (Tasks 3, 4)
- `src/components/calculator/CumulativeTimeline.tsx` — Cumulative chart (Tasks 3, 4)
- `src/components/calculator/ResultsHero.tsx` — Revenue hero numbers (Tasks 1, 3)
- `src/components/calculator/ContactSalesCTA.tsx` — Being removed from render (Task 2)
- `src/components/calculator/MethodologyPanel.tsx` — Being re-added to render (Task 5)
- `src/components/calculator/LossCounter.tsx` — Verify horizon text (Task 3)
- `src/lib/db/queries.ts:282` — `saveSnapshot` function for new API route (Task 1)
- `src/app/(simulator)/demo/page.tsx` — Demo mode guard (Task 1)
