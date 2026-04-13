# Live mFRR & FCR-D Pricing for Revenue Calculator

**Date:** 2026-04-13
**Status:** Brainstorm complete
**Author:** Tim Buhrow + Claude

---

## What We're Building

Replace the hardcoded monthly mFRR and FCR-D price arrays in `market-data.ts` with real market data sourced from the **ENTSO-E Transparency Platform API**. A daily server-side cron job fetches capacity prices for all supported bidding zones, computes monthly averages, and caches them in a `market_prices` Supabase table. The calculator engine reads from the database instead of static constants, getting real prices without any structural changes.

**Phase 1 (this brainstorm):** Accurate sales tool with daily-refreshed real market data.
**Phase 2 (future):** Evolve toward a post-sale live monitoring dashboard.

---

## Why This Approach

### Current State
- All mFRR (up/down) and FCR-D (up/down) prices are hardcoded in `src/lib/calculator/market-data.ts`
- 5 countries, 4 price arrays each, 12 monthly values (EUR/MW/h)
- Months 8-11 repeat month 7's value (incomplete data, extrapolated)
- All bidding zones within a country share the same prices (SE1=SE2=SE3=SE4)
- Source: "Excel model / Mimer" with Sweden using real data, other countries using estimates

### Problems
1. Prices go stale — no automatic update mechanism
2. Country-level granularity misses zone-level price differences
3. Non-Swedish prices are estimates, not real market data
4. Updating requires a code change and redeploy

### Solution: ENTSO-E API + Daily Cron + Supabase Cache

**ENTSO-E Transparency Platform** is the canonical pan-European data source (free, covers all target zones). A daily cron job:
1. Fetches contracted reserve capacity prices (mFRR + FCR) for each bidding zone
2. Parses the XML responses and computes rolling monthly averages
3. Writes results to a `market_prices` table in Supabase
4. The calculator reads from this table at page load (server-side, in `page.tsx`)

The engine structure stays identical — it still receives `{ mfrr_up: number[], mfrr_down: number[], fcrd_up: number[], fcrd_down: number[] }` per zone. Only the data source changes.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Primary goal** | Both (sales accuracy now, monitoring later) | Phase 1 focuses on sales credibility |
| **Transparency to users** | Subtle — no visible badge | Existing tooltip disclaimers mention "real auction data"; no flashy "live data" labels |
| **Data source** | ENTSO-E only | Single API covers all target zones (SE1-SE4, NO1-NO5, DE_LU, NL, FR). Simpler than multi-TSO approach |
| **Zone granularity** | Zone-level where available | Use zone-specific prices when ENTSO-E provides them, fall back to country average |
| **Refresh cadence** | Daily | FCR/mFRR capacity prices are published day-ahead (~22:00 CET). Nightly fetch is sufficient for sales |
| **Fallback strategy** | Last known good data | If today's fetch fails, serve the most recent successful fetch. No static fallback needed |
| **Engine resolution** | Monthly averages | Aggregate hourly ENTSO-E data into 12 monthly averages. Engine stays unchanged |
| **Architecture** | Cron + DB cache | Daily Vercel cron writes to Supabase; calculator reads cached data. Most robust |

---

## ENTSO-E API Details

### Authentication
- Free security token from transparency.entsoe.eu
- Sent as `securityToken` query parameter
- Rate limit: 400 requests/minute

### Key Endpoints

**Contracted Reserve Prices (capacity, EUR/MW/h):**
```
GET https://web-api.tp.entsoe.eu/api?
  securityToken={TOKEN}
  &documentType=A81
  &businessType=A97          # A97=mFRR, A95=FCR
  &type_MarketAgreement.Type=A01
  &controlArea_Domain={EIC}
  &periodStart={YYYYMMDD}0000
  &periodEnd={YYYYMMDD}0000
```

### Bidding Zone EIC Codes

| Zone | EIC Code |
|------|----------|
| SE1 | 10Y1001A1001A44P |
| SE2 | 10Y1001A1001A45N |
| SE3 | 10Y1001A1001A46L |
| SE4 | 10Y1001A1001A47J |
| NO1 | 10YNO-1--------2 |
| NO2 | 10YNO-2--------T |
| NO3 | 10YNO-3--------J |
| NO4 | 10YNO-4--------9 |
| NO5 | 10Y1001A1001A48H |
| DE_LU | 10Y1001A1001A82H |
| NL | 10YNL----------L |
| FR | 10YFR-RTE------C |

### Data Format
- Responses are XML (no native JSON)
- Need server-side XML parsing (e.g., `fast-xml-parser` npm package)
- Prices are per-hour or per-auction-period

### Limitations
- FCR-D up vs down may not always be disaggregated (some TSOs report aggregated FCR)
- Max query span: ~1 year per request
- Publication delays: hours to a day for some data types

---

## Data Pipeline Architecture

```
                    ENTSO-E API
                         |
              (daily cron, ~23:30 CET)
                         |
                         v
              +-----------------------+
              | Vercel Cron Function  |
              | /api/cron/prices      |
              |                       |
              | 1. Fetch XML for each |
              |    zone x product     |
              | 2. Parse XML          |
              | 3. Compute monthly    |
              |    averages           |
              | 4. Upsert into        |
              |    Supabase           |
              +-----------------------+
                         |
                         v
              +-----------------------+
              | Supabase              |
              | market_prices table   |
              |                       |
              | zone (PK)             |
              | product (PK)          |  (mfrr_up, mfrr_down,
              | month (PK)            |   fcrd_up, fcrd_down)
              | avg_price_eur_mwh     |
              | sample_count          |
              | last_updated          |
              +-----------------------+
                         |
              (page.tsx server component
               reads at request time)
                         |
                         v
              +-----------------------+
              | Calculator Engine     |
              | (unchanged structure) |
              |                       |
              | Receives same shape:  |
              | { mfrr_up: number[],  |
              |   mfrr_down: number[],|
              |   fcrd_up: number[],  |
              |   fcrd_down: number[] |
              |   resE_pct: number }  |
              +-----------------------+
```

### Zone-Level Resolution

When ENTSO-E returns zone-specific data (e.g., separate prices for SE1 vs SE4):
- Store per-zone in the DB
- `page.tsx` looks up by the user's selected bidding zone
- If zone-level data unavailable, aggregate to country level

### Fallback Chain
1. Try zone-level data from `market_prices` table
2. If missing, try country-level average from `market_prices`
3. If table empty (fresh deploy), use hardcoded `market-data.ts` as bootstrap

---

## Impact on Existing Code

### Files That Change
| File | Change |
|------|--------|
| `src/lib/calculator/market-data.ts` | Keep as static fallback; add `getMarketData(zone)` async function |
| `src/app/(simulator)/sim/t/[token]/page.tsx` | Fetch live prices from Supabase, pass to SimulatorClient |
| `src/app/(simulator)/demo/page.tsx` | Use static fallback (demo doesn't need live data) |
| `src/app/api/reports/pdf/route.ts` | Fetch live prices for PDF generation |

### New Files
| File | Purpose |
|------|---------|
| `src/app/api/cron/prices/route.ts` | Vercel cron handler — fetches ENTSO-E, writes to Supabase |
| `src/lib/market/entsoe-client.ts` | ENTSO-E API client — fetch + XML parse |
| `src/lib/market/price-aggregator.ts` | Compute monthly averages from hourly data |
| `src/lib/db/market-prices.ts` | Supabase queries for reading/writing market prices |
| `vercel.json` (or update) | Add cron schedule |

### Files That DON'T Change
| File | Why |
|------|-----|
| `src/lib/calculator/engine.ts` | Engine receives the same `CountryMarketData` shape |
| `src/lib/calculator/constants.ts` | PROFILES, ECREDIT, CPO_SHARE unchanged |
| `src/lib/calculator/types.ts` | SimulatorState, CalculationResult unchanged |
| All chart/result components | They consume CalculationResult, not raw prices |

---

## Database Schema

```sql
CREATE TABLE market_prices (
  zone TEXT NOT NULL,           -- e.g. 'SE1', 'NO3', 'DE_LU'
  product TEXT NOT NULL,        -- 'mfrr_up', 'mfrr_down', 'fcrd_up', 'fcrd_down'
  month INTEGER NOT NULL,       -- 0-11 (Jan=0, Dec=11)
  avg_price NUMERIC NOT NULL,   -- EUR/MW/h monthly average
  sample_count INTEGER NOT NULL,-- number of hourly data points averaged
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (zone, product, month)
);

-- Index for fast zone lookup
CREATE INDEX idx_market_prices_zone ON market_prices(zone);
```

---

## Resolved Questions

- **Q: Which API?** A: ENTSO-E Transparency Platform only (single source for all zones)
- **Q: Zone vs country level?** A: Zone-level where ENTSO-E provides it, country fallback
- **Q: How often to refresh?** A: Daily cron (~23:30 CET)
- **Q: What if API is down?** A: Serve last known good data from Supabase
- **Q: Engine changes?** A: None — aggregate to monthly averages, same shape as today
- **Q: Show "live data" badge?** A: No — keep it subtle, existing disclaimers are sufficient

---

## Open Questions

*None remaining — all design questions resolved during brainstorming.*

---

## Next Steps

Run `/workflows:plan` to create the implementation plan for Phase 1.
