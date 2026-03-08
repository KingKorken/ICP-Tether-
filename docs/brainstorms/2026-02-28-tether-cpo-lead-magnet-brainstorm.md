# Brainstorm: Tether CPO Lead-Magnet Concepts

**Date:** 2026-02-28
**Author:** Tim Buhrow
**Client:** Tether (tetherev.io)
**Course:** Esade I2P (Innovation to Practice)
**Status:** Draft

---

## What We're Building

Two standalone concept pitches for Tether's CPO lead-magnet challenge: tools that visually and simply show Charge Point Operators how much revenue they could earn from Tether's grid flexibility and e-credit services.

**Scope:** 2 of the team's minimum 3 Concept Pitch Pages — one pragmatic/safe, one creative.

**Users:**
- **Primary:** Tether's sales team, using the tool during CPO outreach
- **Secondary:** CPO decision-makers (CEOs, CFOs, operations leads) accessing via shared link

**Constraints (from Tether's brief):**
- Standalone — no backend dependency
- No sensitive data required from CPOs
- Clearly labeled as estimates
- Adaptable to other countries over time

---

## Why These Approaches

### Industry Context

Our research revealed several critical dynamics shaping these concepts:

1. **CPOs are desperate for new revenue.** Public DC charging networks report single-digit utilization (~8%). EV charging is a low-margin business with high fixed costs. CPOs need revenue streams that don't depend solely on more drivers showing up.

2. **CPOs are deeply skeptical of startup projections.** The EV charging industry has seen exits and bankruptcies. Reliability rates sit at 64-80%. Regulatory mechanisms (Reduktionsplikt, RED III) are new and uncertain. Trust is the #1 barrier.

3. **No competitor combines both revenue streams.** Every existing calculator shows either charging revenue OR flexibility revenue — never both together. Tether's dual-stream model (e-credits + grid balancing) is unique, and showing them together amplifies the value proposition.

4. **Existing tools are static and opaque.** Competitors like Sympower, Voltus, and PowerFlex show a single number with no methodology. CPOs can't verify the claim, which feeds skepticism.

5. **Interactive tools dramatically outperform static content.** B2B interactive calculators achieve 8.3% conversion (vs. 3.8% for gated PDFs), 4:27 dwell time (vs. 1:24), and 125% higher SQL conversion.

### Competitive Landscape

| Competitor | Approach | Gap |
|---|---|---|
| **PowerFlex** | 7 inputs, instant visual, 10-year bar chart | No flexibility revenue, no methodology shown |
| **Sympower** | 4 inputs, email-gated, single earnings figure | Targets heavy industry, not CPOs |
| **Voltus** | Minimal friction (postal codes), bold headline | No transparency on how numbers are derived |
| **Stable Auto** | ML-powered, 70+ variables, pro formas | Paid product, overly complex for a lead magnet |
| **GridBeyond** | 3 inputs, split Revenue + Savings, PDF report | Targets industrial/commercial, not CPOs |

**Key gap nobody fills:** A CPO-specific tool that combines charging + flexibility + e-credit revenue with transparent, verifiable methodology.

---

## Concept A: "The Open-Book Estimator"

### Classification: Safe / Pragmatic

### What It Is

A standalone revenue estimator that differentiates itself by showing its work. CPOs input 3-4 basics and receive a clean, compelling dual-stream revenue estimate. Unlike every competitor, an expandable "See how we calculated this" layer reveals the real market data, formulas, and sources behind the number.

### Who It's For

CPO decision-makers evaluating whether Tether's services are worth exploring. Also used by Tether's sales team as a live demo tool during outreach calls.

### How It Works

**Step 1 — Input (30 seconds):**
CPO provides 3-4 inputs:
- Number of chargers
- Charger power (kW) — dropdown: 7kW, 11kW, 22kW, 50kW, 150kW
- Country/Region — dropdown: Sweden (SE1-SE4), Finland, Norway
- Charging type — toggle: Public vs. Residential

**Step 2 — Instant Result:**
A single screen showing:
- **Total estimated annual revenue** (the CPO's 40% share, clearly labeled)
- **Broken into two streams:** E-Credits (passive) + Grid Flexibility (active)
- **Per-charger revenue** — makes it tangible regardless of fleet size
- Visual bar or donut chart splitting the two streams
- Clear "This is an estimate" disclaimer

**Step 3 — Progressive Disclosure (optional):**
An expandable "How we calculated this" section revealing:
- **E-Credits methodology:** Formula shown, RES-E% source (Green Grid Compass), CO2 market price (EUR 0.34/kg, 2026 estimate), RED III 4x multiplier explained
- **Grid Flexibility methodology:** MW Bid formula shown, actual average FCR-D and mFRR prices from Mimer/Svenska kraftnat (2025 data), utilization assumptions stated
- **Revenue split:** 40% CPO / 40% Tether / 10% BRP-BSP — displayed transparently
- **Data sources:** Linked to Mimer, Green Grid Compass, EU RED III directive

**Step 4 — Call to Action:**
- "Want a detailed breakdown? Talk to Tether" — lead capture
- Option to download a one-page PDF summary (shareable with board/investors)

### What Makes It Different

1. **Transparency as differentiator.** No competitor shows their methodology. In a market where CPOs are skeptical of projections, showing real market data and formulas builds trust faster than any sales pitch.
2. **Both revenue streams in one view.** First tool in the market to combine e-credits + flexibility revenue. The combined number is significantly more compelling than either alone.
3. **Progressive disclosure respects two user types.** Sales team gets the clean headline for demos. Curious CPOs can dive into the data. Both are served by one tool.
4. **Real data, not fabricated assumptions.** Uses actual 2025 FCR/mFRR prices from Svenska kraftnat and real RES-E% data. This is verifiable — a CPO could check the sources themselves.

### Key Assumptions & Defaults

| Parameter | Default Value | Source |
|---|---|---|
| Utilization rate (Public) | 15% | Tether's model |
| Utilization rate (Residential) | Charges every 4 days | Tether's model |
| Flexibility potential | 50% (public), 60% (residential) | Tether's model |
| CO2 market price | EUR 0.34/kg | 2026 estimate from Tether |
| Fossil baseline CI | 338.4g CO2e/kWh | Swedish market overview |
| Grid CI | ~15g CO2e/kWh | Green Grid Compass |
| Revenue split (CPO share) | 40% | Tether's standard terms |
| mFRR allocation | 30% UP / 70% DOWN | Tether's model |
| FCR allocation | 30% D-UP / 70% D-DOWN | Tether's model |

### Concept Scorecard

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| **Impact** | 5 | Directly solves the brief. Quantifies value for CPOs in a way no competitor currently does by combining both streams. |
| **Innovation** | 2 | The calculator format is well-established. The transparency layer is a meaningful twist but not a radical departure. |
| **Feasibility** | 5 | All data and formulas exist in Tether's materials. Can be built as a simple web page with client-side JS. No backend needed. |

---

## Concept B: "The Revenue Timeline"

### Classification: Creative / Beyond the Brief

### What It Is

An interactive, time-based visualization that shows a CPO's potential revenue building month-over-month over 12-24 months. Instead of a static number, CPOs see their revenue "grow" as an animated timeline with toggleable scenarios. The visual gap between revenue lines makes the opportunity cost of inaction visceral.

### Who It's For

Same as Concept A — Tether's sales team and CPO decision-makers. But this concept is especially powerful in live sales demos where the animation creates a "wow" moment.

### How It Works

**Step 1 — Input (30 seconds):**
Same minimal inputs as Concept A:
- Number of chargers
- Charger power (kW)
- Country/Region
- Public vs. Residential

**Step 2 — The Timeline Unfolds:**
An animated line chart appears, building month by month over 24 months:
- **Line 1 (baseline):** "Your current additional revenue: EUR 0" — a flat line at zero. This is what the CPO earns from flexibility/e-credits today without Tether.
- **Line 2 (e-credits only):** Revenue from e-credits alone, growing steadily. Passive income, no operational change needed.
- **Line 3 (e-credits + flexibility):** Combined revenue, visibly higher. The gap between Line 2 and Line 3 shows the incremental value of grid balancing.

As the animation plays, the **cumulative "revenue left on the table"** counter ticks up — showing the total opportunity cost of each month of delay.

**Step 3 — Interactive Scenario Toggling:**
After the animation, CPOs can:
- **Toggle revenue streams on/off** — see e-credits alone, flexibility alone, or both combined
- **Adjust charger count** with a slider — watch all lines rescale in real-time
- **Switch between 12-month and 24-month views**
- **Hover over any month** to see: monthly revenue, cumulative revenue, market price data for that period, seasonal context (e.g., "Winter months: higher grid balancing demand")

**Step 4 — Seasonal Insight Layer:**
The timeline naturally reveals seasonal patterns:
- **Winter peaks:** Grid balancing prices spike due to heating demand — revenue is higher
- **Summer troughs:** Lower prices but still meaningful passive e-credit income
- **Growth compounding:** The 2% MoM growth assumption means month 24 revenue is ~60% higher than month 1

This educates CPOs about the market dynamics, building understanding and trust simultaneously.

**Step 5 — Shareable Output:**
- "Share your revenue story" — generates a personalized snapshot (image or one-page PDF) showing the timeline with the CPO's specific numbers
- Designed to be forwarded to a board, investors, or internal stakeholders
- Includes a "Powered by Tether" watermark and CTA link

### What Makes It Different

1. **Narrative over numbers.** A static "EUR 305K/year" is abstract. Watching revenue build month by month over 24 months is a story — and stories are remembered.
2. **Loss aversion is powerful.** The "revenue left on the table" counter exploits a well-documented cognitive bias. Every month of delay has a visible cost, creating urgency without being pushy.
3. **Scenario toggling builds understanding.** By letting CPOs see each revenue stream independently and then combined, they learn what Tether actually does. The tool educates and sells simultaneously.
4. **Seasonal patterns build credibility.** Showing that revenue isn't a flat line — it has winter peaks and summer troughs — proves that the estimate is grounded in real market dynamics, not fabricated.
5. **No one in the market does this.** Every competitor shows a flat, static number. A temporal, animated, scenario-based visualization is unprecedented in the CPO lead-magnet space.
6. **Shareability drives virality.** A personalized "revenue story" snapshot is more compelling to forward to a board than a generic calculator screenshot.

### Key Assumptions & Defaults

Same as Concept A, plus:

| Parameter | Default Value | Source |
|---|---|---|
| Monthly growth rate | 2% MoM | Tether's model |
| Timeline length | 24 months (default), 12 months (toggle) | Design choice |
| Seasonal price variation | Based on actual 2025 monthly averages from Mimer data | Tether's Excel data |
| Animation duration | ~5 seconds for full 24-month build | UX best practice |

### Concept Scorecard

| Dimension | Score (1-5) | Rationale |
|---|---|---|
| **Impact** | 5 | Extremely compelling for sales conversations. The animation creates emotional engagement that static calculators can't match. Shareability extends reach. |
| **Innovation** | 4 | No competitor uses time-based visualization or scenario toggling for CPO revenue estimation. The loss-aversion framing is psychologically sophisticated. |
| **Feasibility** | 3 | More complex than a static calculator — requires animated charting (e.g., Chart.js, D3.js), scenario logic, and shareable output generation. Still fully client-side, no backend. But needs more development time. |

---

## Key Decisions Made

1. **One safe, one creative** — balances feasibility with differentiation in the team's overall portfolio of 3+ concepts.
2. **Trust/transparency is Concept A's core differentiator** — addressing the #1 barrier (CPO skepticism) head-on.
3. **Temporal narrative is Concept B's core differentiator** — turning a static number into a story, exploiting loss aversion.
4. **Progressive disclosure pattern** — both concepts serve two user types (sales team needing clean demos, curious CPOs wanting to verify claims) without compromising either experience.
5. **Both revenue streams combined** — filling the market gap where no competitor shows e-credits + flexibility together.
6. **Minimal inputs (3-4)** — research shows abandonment spikes beyond 5 inputs, and 78% completion rate at 3-5 inputs.
7. **CPO's 40% share shown, not gross** — honesty about the revenue split builds trust rather than eroding it later.

---

## Open Questions

*None — all key decisions have been resolved through the brainstorming dialogue.*

---

## Appendix: Research Sources

### Competitive Analysis
- PowerFlex revenue calculator
- Sympower energy flexibility calculator (sympower.net/calculator)
- Voltus demand response estimator (voltus.co)
- Stable Auto Evaluate platform
- GridBeyond Energy Opportunity Calculator

### Industry Data
- Nordic Balancing Model — mFRR EAM (launched March 2025)
- Sourceful Energy — FCR prices in Sweden (April 2025 market update)
- Swedish Energy Agency — Greenhouse Gas Reduction Mandate (Reduktionsplikt)
- ChargeUp Europe — RED Credit Mechanism
- Transport & Environment — RED III and Renewable Electricity
- EY/Eurelectric — "Plugging into Potential" (2025)
- gridX — European EV Charging Report 2025
- Rabobank — "From Niche to Norm" (2025)
- Strategy& (PwC) — EV Charging Market Outlook 2025

### Tether Materials
- Tether Deck (Esade I2P) — 14-slide pitch deck
- Swedish Market Overview (Esade I2P) — Revenue mechanics and formulas
- CPO Revenue Model (Esade I2P) — Excel calculator with market price data (Sweden, Finland, Norway)

### B2B Calculator Best Practices
- Interactive calculators: 8.3% conversion rate (vs. 3.8% for gated PDFs)
- Average dwell time: 4:27 (vs. 1:24 for static content)
- Charts improve memorability by 65% over numbers alone
- 78% completion rate with 3-5 inputs
- Post-registration results get 3.4x lower conversion than instant results
