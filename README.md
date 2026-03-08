# Tether × Esade I2P — Project Folder README

## Project Goal

We are an Esade student team working on the **Innovation to Practice (I2P)** course. Our client is **Tether** (tetherev.io) — a clean-energy startup that turns EV charging infrastructure into a revenue source for Charge Point Operators (CPOs) via grid balancing and regulatory e-credits.

**Tether's challenge to us:** *"How could we show our target clients (CPOs) the potential revenue they can earn from our services, in a visual, simple and compelling way?"*

In other words, Tether needs a **lead-magnet tool** — a standalone calculator or interactive experience that lets a CPO input basic information about their charging network and instantly see estimated annual revenue from Tether's two revenue streams (e-credits + grid flexibility). The tool must be visual, simple, compelling, and should not require Tether's backend or any sensitive data.

### Deliverable

We must produce **a minimum of 3 Concept Pitch Pages** (one per solution idea), each as a standalone PDF. At least one concept can be a direct answer to the brief; the others should push beyond it creatively. See `I2P_Concept_Pitch_Guide.md` for full assignment structure and rubric.

---

## Folder Structure

```
ICP - Solution Brainstorm/
├── README.md                                   ← You are here. Start here.
├── I2P_Concept_Pitch_Guide.md                  ← Assignment rules & deliverable structure
└── Tether Company Information/
    ├── Tether_Deck_Esade_I2P.pdf               ← Pitch deck, business context, challenge brief
    ├── Swedish_market_overview_Esade_I2P.pdf    ← Revenue mechanics & formulas
    └── CPO_Revenue_model_Esade_I2P.xlsx         ← Calculator logic & raw market price data
```

---

## File Descriptions

### 1. `I2P_Concept_Pitch_Guide.md`
**What it is:** The assignment specification from our I2P course.
**Use it for:** Understanding exactly what each Concept Pitch Page must contain (Header, Problem, Research & Insights, The Concept, Why This Matters with scorecard, Next Steps, Appendix) and the formatting/content rules.

---

### 2. `Tether Company Information/Tether_Deck_Esade_I2P.pdf`
**What it is:** Tether's official pitch deck (14 slides).
**Use it for:** Understanding Tether's business, positioning, and the challenge they've set for us.

**Key contents:**
- **Problem (slide 2):** The grid uses fossil fuel plants to hedge renewable energy risk because renewables are unpredictable and storage is insufficient.
- **Opportunity (slide 3):** EVs are massive batteries on wheels — 130M+ EVs in Europe by 2035, 95%+ of time spent parked, 5× more power than the average household.
- **What Tether does (slides 4–5):** Software that integrates into CPOs' existing tech stack (no CAPEX) and generates **dual recurring revenues** — from EU Balancing Markets (grid flexibility) and EU e-Credit Markets (regulatory carbon credits). Revenue is shared between a Balancing Responsible Party (BRP/BSP) at 10%, Tether at 40%, and the CPO at 40%.
- **Grid Balancing flow (slide 6):** Plug In → Predict (ML/AI) → Optimize (scheduling) → Bid (on balancing markets) → Adapt (to grid conditions). End-to-end flexibility service.
- **E-Credits flow (slide 7):** CPOs' raw kWh → Tether converts to Renewable Certificates → automates agency-compliant reporting → aggregates small volumes to market scale → sells to Fuel Distributors.
- **Impact (slide 8):** Contributes to SDGs 7, 9, 11, 13. Reduces ~3.7k tons CO2 per MW over 10 years.
- **Traction (slide 9):** Already present in Sweden. Expansion phases: I) Nordics, II) Western Europe, III) Southern Europe.
- **The Challenge (slides 10–11):** Build a "lead magnet" that quantifies and personalizes Tether's value proposition for CPO outreach. Must be standalone (no backend dependency), clearly labeled as estimates, require no sensitive data, and be adaptable to other countries over time. Open questions: How much info will CPOs provide? Can it speed up outreach? How to present complex grid data as a simple financial product?
- **Competitor references (slides 12–13):** Screenshots of AFS Energy's ERE calculator and Volt Time's revenue calculator — existing tools in the market that show simple input → estimated earnings output.
- **Team (slide 14):** CEO Luis Medina Rivas (Northvolt, GE, FPL background), plus 6 team members with strong ML, energy engineering, and software backgrounds.

---

### 3. `Tether Company Information/Swedish_market_overview_Esade_I2P.pdf`
**What it is:** A detailed briefing document from Tether explaining how their two revenue streams work in Sweden — the primary market.
**Use it for:** Understanding the revenue mechanics, formulas, market structure, and data sources needed for any calculator concept.

**Key contents:**

#### Revenue Stream 1: E-Credits (Regulatory / Passive Income)
- **Mechanism:** Sweden's Reduktionsplikt (GHG mandate) requires fuel companies (Preem, Circle K, etc.) to lower CO2 impact. They buy credits from CPOs to offset fossil fuel sales.
- **4× Multiplier:** Under EU RED III, every 1 kWh of renewable electricity counts as 4 kWh toward GHG targets — effectively quadrupling the credit value.
- **Revenue Formula:** `Total Revenue = (Total kWh × Hourly RES-E% × 4) × (Avoided CO2 per kWh × CO2 Market Price)`
  - *Total kWh:* From CPO charging logs
  - *Hourly RES-E%:* Renewable share of the grid at time of charging (from Green Grid Compass)
  - *Avoided CO2 per kWh:* Fossil Baseline CI (338.4g CO2e/kWh) minus Verified Grid CI (e.g. 15g/kWh) = ~323.4g
  - *CO2 Market Price:* ~€0.34 per kg CO2 (2026 estimate)
- **Data source for RES-E% and Carbon Intensity:** Green Grid Compass (split by Sweden's 4 energy zones: SE1–SE4)

#### Revenue Stream 2: Flexibility / Grid Balancing (Active Income)
- Tether pauses or slows EV charging for seconds/minutes to stabilize the grid at 50Hz.
- Two relevant sub-markets:
  - **FCR (Frequency Containment Reserve):** Instant response within seconds, sustained 20–30 min. Paid an availability (standby) fee even if never activated. Like an insurance policy. Sub-markets: FCR-D Up and FCR-D Down (can bid both simultaneously). Status: prices declining as market saturates, but remains reliable baseline.
  - **mFRR (manual Frequency Restoration Reserve):** For larger, longer grid events (~15 min). Gets both a standby fee and a delivery fee — but for the calculator, only consider the standby fee (capacity remuneration) since activations are rare. Status: Sweden moved to 15-minute settlement in 2025, creating price spikes EVs can capture.
- Revenue stacking: By participating in multiple reserve markets, Tether can stack revenues.
- **Price data source:** Mimer (Svenska kraftnät) — use FCR-D Up, FCR-D Down, and mFRR CM.

---

### 4. `Tether Company Information/CPO_Revenue_model_Esade_I2P.xlsx`
**What it is:** Tether's internal revenue model spreadsheet — the core calculation engine showing how they estimate balancing market revenues for CPOs.
**Use it for:** Understanding the exact formulas, assumptions, input parameters, and market price data that would feed into any calculator tool.

**Sheets:**

#### Sheet: `Revenue_PUBLIC` (Public Charging Scenario)
- **Purpose:** Models monthly revenue for a **public charging** CPO over 2025–2026.
- **Default assumptions:** 1,000 chargers, 11 kW each, 15% utilization rate (weekday & weekend), 24 accessible hours/day, 50% flexibility potential, 2% MoM growth.
- **Two scenarios calculated:**
  - *Scenario 1 (mFRR):* Revenue from mFRR UP (30% allocation) + mFRR DOWN (70% allocation). Estimated annual total: ~€305,960.
  - *Scenario 2 (FCR):* Revenue from FCR-D UP (30%) + FCR-D DOWN (70%) + FCR-N (0%). Estimated annual total: ~€53,620.
- **Revenue split:** BRP/BSP 10%, Tether 40%, CPO 40%.
- **Key formula:** `Monthly Revenue = MW_Bid × Price_per_MW × Total_Hours_Per_Month`
- **MW Bid formula:** `Nº_of_chargers × Utilization_Rate × MW_per_charger × Flex_Potential`
- **Combined estimated annual revenue potential:** ~€305,960 (displayed at top).

#### Sheet: `Revenue_RESIDENTIAL` (Residential Charging Scenario)
- **Purpose:** Models monthly revenue for a **residential/home charging** CPO.
- **Default assumptions:** 5,500 chargers, 11 kW each, 14 accessible hours/day (not 24), charges every 4 days, 60% flexibility potential, 2% MoM growth.
- **Combined estimated annual revenue potential:** ~€1,963,245.
- Same scenario structure as PUBLIC sheet but with different utilization patterns.

#### Sheet: `SWE FCR Prices`
- **Purpose:** Raw hourly FCR price data for Sweden.
- **Columns:** Date, FCR-N Price (EUR/MW), FCR-D Up Price (EUR/MW), FCR-D Down Price (EUR/MW) — broken down by Swedish zones SE1–SE4 and DK2.
- **Size:** ~5,090 rows of hourly data (2025).
- **Source:** Mimer / Svenska kraftnät.

#### Sheet: `SWE mFRR Prices`
- **Purpose:** Raw hourly mFRR capacity market price data for Sweden.
- **Columns:** Date, Period, Region (SN1–SN4), mFRR Up Price (EUR/MW), mFRR Up Volume (MW), mFRR Down Price (EUR/MW), mFRR Down Volume (MW).
- **Size:** ~20,351 rows of hourly data (2025).
- **Source:** Mimer / Svenska kraftnät.

#### Sheet: `FIN FCR Prices`
- **Purpose:** Raw hourly FCR price data for Finland.
- **Columns:** Date, FCR-N (Bids, Volume, Price), FCR-D UP (Bids, Volume, Price), FCR-D DOWN (Bids, Volume, Price).
- **Size:** ~5,087 rows (2025).

#### Sheet: `FIN mFRR Prices`
- **Purpose:** Raw hourly mFRR price data for Finland.
- **Columns:** Date, mFRR UP (Bids, Volume, Price), mFRR DOWN (Bids, Volume, Price).
- **Size:** ~5,087 rows (2025).

#### Sheet: `NOR mFRR Prices`
- **Purpose:** Raw hourly mFRR price data for Norway.
- **Columns:** Date, Hour, mFRR UP and DOWN data for 5 Norwegian zones (NO1–NO5) with volumes and prices.
- **Size:** ~2,426 rows (starting April 2025).

---

## Key Terminology Quick Reference

| Term | Meaning |
|---|---|
| **CPO** | Charge Point Operator — Tether's target customer |
| **FCR** | Frequency Containment Reserve — fast grid response (seconds) |
| **mFRR** | Manual Frequency Restoration Reserve — slower grid response (minutes) |
| **E-Credits** | Carbon credits generated from renewable EV charging under Reduktionsplikt |
| **RES-E%** | Renewable Energy Sources – Electricity (% of grid that is renewable at a given hour) |
| **RED III** | EU Renewable Energy Directive III — provides the 4× multiplier for EV charging |
| **Reduktionsplikt** | Sweden's GHG mandate requiring fuel companies to reduce CO2 |
| **BRP/BSP** | Balancing Responsible Party / Balancing Service Provider |
| **SE1–SE4** | Sweden's four electricity price zones |
| **MW Bid** | The megawatt capacity Tether offers to the grid market |

---

## How to Use This Folder

1. **Start with this README** to understand the project scope and what each file contains.
2. **Read `I2P_Concept_Pitch_Guide.md`** (root folder) for the exact deliverable structure and rules.
3. **Reference `Tether Company Information/Tether_Deck_Esade_I2P.pdf`** for Tether's business context, the challenge brief, and competitor examples.
4. **Reference `Tether Company Information/Swedish_market_overview_Esade_I2P.pdf`** for the detailed revenue mechanics and formulas.
5. **Reference `Tether Company Information/CPO_Revenue_model_Esade_I2P.xlsx`** for the actual calculation logic, assumptions, and raw market price data across Sweden, Finland, and Norway.
