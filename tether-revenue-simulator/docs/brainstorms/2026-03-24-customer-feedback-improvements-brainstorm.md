# Customer Feedback Improvements — Brainstorm

**Date:** 2026-03-24
**Source:** Customer call feedback (Wed 2026-03-18)
**Status:** Brainstorm complete

---

## What We're Building

A major overhaul of the Tether Revenue Simulator based on direct customer feedback. The work is split into two phases:

- **Phase 1 — Calculator Improvements:** UX changes, data model restructuring, API integrations
- **Phase 2 — Admin Dashboard:** Control panel for Tether to configure calculator options per customer

Phase 1 is further divided into three sub-phases using a progressive enhancement approach:

### Phase 1a — Quick UX Wins

1. **Calculate Button + Animation**
   - Remove live auto-update (currently recalculates on every slider/input change)
   - Add a prominent "Calculate" button on the input panel
   - On click: show "Recalculating..." overlay on the output area for a randomised 1–3 second delay, then reveal results
   - Randomise the delay interval (a fixed delay reads as fake per the client)
   - The Calculate button also saves inputs to the database (combines "Submit" and "Calculate" into one action)
   - Decouple the data save event from slider movement — tie it to the Calculate click only

2. **Remove Contact Sales Button**
   - Remove the ContactSalesCTA from the UI entirely
   - Keep the component code as a stub for potential future re-enabling (website lead magnet)
   - Sales motion is outbound; inbound button is not part of Tether's workflow

3. **Projection Horizon**
   - Change from 12/24 month toggle to a 3/6/12 month selector
   - Start from the CURRENT calendar month (e.g., visiting in March 2026 shows Mar–Aug for 6mo)
   - Use real month names (Mar, Apr, May...) instead of M1, M2, M3...
   - Rationale: 24-month horizon made clients think Tether was forecasting the future. They're using historical prices.

4. **Y-Axis Scaling on Graphs**
   - Lock y-axis at a generous fixed ceiling — do NOT rescale dynamically
   - Current behavior: y-axis rescales when inputs change, making bars look flat/declining — confusing
   - Determine ceiling per chart type (seasonal vs cumulative) based on reasonable maximum inputs

5. **Fix MethodologyPanel Accordion**
   - Re-add the "See the Math" MethodologyPanel to the simulator page (currently defined but not rendered)
   - Fix it to expand DOWNWARD (was opening upward, obscuring content)

### Phase 1b — Data Model Overhaul

6. **Multiple Charger Configurations**
   - Replace the current flat input model with an array of charger configuration rows
   - Each row is fully independent: charger type, power level, count, utilization rate, flexibility potential
   - "+" button to add a new config row in the UI
   - CSV template download: user downloads a pre-formatted CSV, fills it in, re-uploads via drag-and-drop
   - Outputs summed across all charger groups
   - CSV upload should feel "professional" — drag-and-drop zone, less intimidating than forms

7. **Grid Zone / Region Selection**
   - Nordic countries get multi-zone support with multi-select: Sweden (SE1-SE4), Norway (NO1-NO5), Denmark (DK1-DK2), Finland (FI)
   - Germany (DE-LU), Netherlands (NL), France (FR) remain single-zone
   - Multi-select for Nordics: user can pick one or combine multiple zones (e.g., SE1 + SE3)
   - Pricing data varies by zone — engine must aggregate/weight across selected zones

8. **Add Finland and Denmark**
   - Add as new country options
   - Finland: single zone or zonal if data supports it
   - Denmark: DK1 (West) and DK2 (East)
   - Source initial market data from ENTSO-E or regional TSO data

9. **Show Available Markets Per Country/Zone**
   - Display which energy markets each country/zone participates in (mFRR up/down, FCR-D up/down, aFRR, etc.)
   - Show with their identifiers/codes
   - Helps the customer understand what revenue streams apply to their location

### Phase 1c — Live Data & Visual Polish

10. **ENTSO-E API Integration**
    - Replace hardcoded pricing in market-data.ts with live data from ENTSO-E Transparency Platform
    - API key needed (user has account, needs to generate API token)
    - Fetch mFRR, FCR-D, and other market prices per country/zone
    - Build a caching layer (don't hit ENTSO-E on every page load)
    - Fallback to hardcoded data if API is unavailable

11. **Per-Country Seasonality Curves**
    - Replace the single shared `RES_SEASONAL` array with country-specific seasonal patterns
    - Source from ENTSO-E historical data
    - Sweden and France should show visibly different seasonal patterns (currently identical — customer flagged this)

12. **Brand Colors**
    - Update to match Tether's official brandbook (HEX codes pending from client)
    - Target: dark blue background, white text, green highlights, orange-red secondary
    - Brandbook reference: Google Slides link provided, need to extract HEX codes

### Phase 2 — Admin Dashboard (Separate Initiative)

13. **Tether Control Dashboard**
    - Admin panel where Tether staff can configure which options are shown in the calculator per customer
    - Full control and personalization: toggle features, set defaults, customize available countries/zones
    - Builds on the existing admin infrastructure (admin routes, token management already exist)

### Deferred Items

14. **eco2grid CO2 Intensity** — Need to clarify with Tether what role CO2 data plays (new metric vs. replacing resE_pct). Defer until next client conversation.

---

## Why This Approach

**Progressive Enhancement (Phase 1a → 1b → 1c)** was chosen because:

- **Fast client feedback loop:** Phase 1a items (calculate button, horizon fix, y-axis, accordion) are isolated UX changes that can ship in days. The client sees momentum immediately.
- **Risk reduction:** ENTSO-E API integration (1c) is the riskiest item (external dependency, data quality unknowns). By deferring it, we avoid blocking visible improvements.
- **Testable increments:** Each sub-phase produces a working, shippable simulator. No big-bang risk.
- **Data model before data source:** Phase 1b restructures the engine for multi-charger and zones using improved hardcoded data. Phase 1c then swaps in live data — the engine is already built to handle it.

---

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Two-phase structure (Calculator then Admin Dashboard) | Admin dashboard is a separate scope; calculator improvements are the immediate priority |
| 2 | Progressive enhancement (1a → 1b → 1c) | Ship visible improvements fast, reduce risk, testable increments |
| 3 | Single "Calculate" button (no separate Save button) | One button saves inputs AND triggers calculation — simpler UX |
| 4 | Randomised 1-3s calculation delay | Fixed delay reads as fake per customer feedback (Farid's insight) |
| 5 | Projection starts from current calendar month | Customer wants real months, not abstract M1/M2 labels |
| 6 | 3/6/12 month horizons (not 12/24) | 24-month horizon implied forecasting, which Tether doesn't do |
| 7 | Fully independent charger config rows | Each charger group has its own type, power, count, utilization, and flexibility |
| 8 | Both +button AND CSV upload for chargers | +button for quick entry, CSV for power users with large fleets |
| 9 | All countries get grid zones, multi-select | Customer explicitly requested region granularity for all markets |
| 10 | ENTSO-E replaces hardcoded pricing | Current non-Nordic data is from an unverified source; ENTSO-E is the standard |
| 11 | Keep Contact Sales code stub | May re-enable for website lead magnet later |
| 12 | eco2grid deferred | Role of CO2 data unclear — needs client clarification |
| 13 | Brand colors deferred | Waiting for HEX codes from brandbook |

---

## Open Questions

1. **Brand HEX codes:** Need exact colors from the Tether brandbook (Google Slides link provided but requires auth). Who can extract these?

2. **eco2grid scope:** Is CO2 intensity a new output metric, a replacement for renewable energy share, or something else? Needs client clarification.

---

## Resolved Questions

5. **CSV template fields:** Yes — all 5 fields per row: charger_type (public/residential), power_kw, count, utilization_pct, flexibility_pct.

6. **Y-axis ceiling values:** Derive from the theoretical maximum revenue based on max possible inputs. Lock y-axis at that ceiling so it never rescales.

7. **Power level options:** Custom free-form numeric input for power level (kW). Allows DC fast chargers (50, 150, 350 kW) beyond the current AC-only presets.

8. **Calculate vs Save button:** Single "Calculate" button that both saves inputs to the database and triggers calculation. No separate Save button.

9. **Projection start month:** Starts from the current calendar month (not next month).

10. **ENTSO-E API key:** User has account, will generate API token this week. Not blocking — Phase 1c comes after 1a and 1b.

11. **Grid zone granularity:** Nordic countries get multi-zone (SE1-SE4, NO1-NO5, DK1-DK2, FI). Germany (DE-LU), Netherlands (NL), and France (FR) are single-zone countries. No TSO-area breakdown needed for non-Nordics.
