---
title: "feat: Live ENTSO-E Market Pricing for Revenue Calculator"
type: feat
status: completed
date: 2026-04-13
origin: docs/brainstorms/2026-04-13-live-mfrr-fcrd-pricing-brainstorm.md
---

# Live ENTSO-E Market Pricing for Revenue Calculator

## Overview

Replace the hardcoded monthly mFRR and FCR-D capacity price arrays in `market-data.ts` with real market data from the **ENTSO-E Transparency Platform API**. A daily Vercel cron job fetches contracted reserve capacity prices for all supported bidding zones, computes monthly averages, and caches them in Supabase. The calculator engine reads live prices instead of static constants — with zero structural changes to the engine itself.

## Problem Statement / Motivation

The revenue calculator currently uses hardcoded price arrays from an "Excel model / Mimer" source:

- **Prices go stale** — no automatic update mechanism; updating requires a code change
- **Incomplete data** — months 8-11 repeat month 7's value (extrapolated)
- **Country-level only** — SE1-SE4 all share one Swedish price set despite real zone-level differences
- **Non-Swedish estimates** — Norway, Germany, Netherlands, France use estimated benchmarks, not real auction data

This undermines credibility during sales conversations and limits Tether's ability to give prospects accurate, location-specific revenue projections.

## Proposed Solution

*See brainstorm: [docs/brainstorms/2026-04-13-live-mfrr-fcrd-pricing-brainstorm.md](../brainstorms/2026-04-13-live-mfrr-fcrd-pricing-brainstorm.md)*

### Architecture

```
ENTSO-E Transparency Platform API (free, XML)
         |
         | Daily cron (23:30 UTC)
         v
+---------------------------+
| Vercel Cron Function      |
| GET /api/cron/prices      |
|                           |
| For each zone x product:  |
|  1. Fetch XML             |
|  2. Parse with            |
|     fast-xml-parser       |
|  3. Compute monthly avg   |
|  4. Upsert to Supabase   |
+---------------------------+
         |
         v
+---------------------------+
| Supabase                  |
| market_prices table       |
| (zone, product, month_idx,|
|  avg_price, sample_count, |
|  updated_at)              |
+---------------------------+
         |
         | page.tsx reads at request time
         | (all countries fetched, cached 1hr)
         v
+---------------------------+
| Calculator Engine         |
| (UNCHANGED structure)     |
|                           |
| Receives same shape:      |
| { mfrr_up: number[12],   |
|   mfrr_down: number[12],  |
|   fcrd_up: number[12],    |
|   fcrd_down: number[12],  |
|   resE_pct: number }      |
+---------------------------+
```

### Key Design Decisions

(All from brainstorm — see origin document)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data source | ENTSO-E only | Single API covers all 12 target zones |
| Granularity | **Country-level** (resolved from SpecFlow Q1) | Engine operates on `state.country`; zones within a country share prices. Simpler, avoids cascading schema changes. Zone-level differentiation deferred to Phase 2 |
| Refresh cadence | Daily at 23:30 UTC | FCR/mFRR capacity prices published day-ahead |
| Engine resolution | Monthly averages (12 values) | Engine structure unchanged |
| Fallback | Static `market-data.ts` when DB empty | Graceful degradation on first deploy or DB outage |
| Transparency | Subtle — no "live data" badge | Existing tooltip disclaimers sufficient |
| `resE_pct` | Stays in static config | Not available from ENTSO-E; remains hardcoded per country |

### Resolved Questions from SpecFlow Analysis

| Question | Resolution |
|----------|-----------|
| **Q1: Zone vs. country level?** | Country-level. Store one price set per country (not per zone). SE1-SE4 share Swedish prices. This preserves the current engine, state model, and snapshot format. Zone-level is a Phase 2 enhancement. |
| **Q2: Which 12 months?** | Trailing 12 complete calendar months. On April 13, fetch March 2025 through February 2026. The cron always replaces all 12 months for each country/product. |
| **Q3: Where does `resE_pct` come from?** | Remains hardcoded in `market-data.ts`. ENTSO-E does not provide this. |
| **Q4: How do prices reach the client?** | All 5 countries' prices fetched at page load in `page.tsx` (240 rows = 5 countries x 4 products x 12 months). Serialized as a prop to `SimulatorClient`. Instant country switching preserved. |
| **Q5: Empty database fallback?** | Fall back to static `market-data.ts`. The function `getMarketData()` tries DB first, returns static data if empty. |
| **Q6: PDF re-calculate vs. snapshot?** | Re-calculate with current prices. PDF disclaimer already says "based on real auction data." |
| **Q8: Vercel plan tier?** | Pro plan assumed. `maxDuration = 300` (5 min). 48 sequential calls at 200ms delay = ~30s total. |
| **Q9: Zero prices?** | Store as-is. Engine handles zeros correctly (zero revenue contribution). |
| **Q10: Negative prices?** | Store as-is. Add `Math.max(0, ...)` floor in engine for flex revenue per month. |
| **Q12: Admin UI for prices?** | Out of scope for Phase 1. |

## Technical Approach

### Implementation Phases

---

#### Phase 1: Database + ENTSO-E Client (Foundation)

**Goal:** Create the Supabase table, ENTSO-E client, and XML parser. Can be tested in isolation.

##### Task 1.1: Create `market_prices` table in Supabase

```sql
-- Run in Supabase SQL Editor
CREATE TABLE market_prices (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  country     TEXT NOT NULL,        -- 'sweden', 'norway', 'germany', 'netherlands', 'france'
  product     TEXT NOT NULL,        -- 'mfrr_up', 'mfrr_down', 'fcrd_up', 'fcrd_down'
  month_idx   INTEGER NOT NULL,     -- 0-11 (Jan=0, Dec=11), matches engine array index
  avg_price   NUMERIC(10, 4) NOT NULL,  -- EUR/MW/h monthly average
  sample_count INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (country, product, month_idx)
);

CREATE INDEX idx_market_prices_country ON market_prices(country);
```

**Files:** Supabase SQL console only (no code file)

##### Task 1.2: Install `fast-xml-parser`

```bash
npm install fast-xml-parser
```

**Files:** `package.json`, `package-lock.json`

##### Task 1.3: Create ENTSO-E API client

**New file:** `src/lib/market/entsoe-client.ts`

Responsibilities:
- Build ENTSO-E API URLs with correct query parameters
- Fetch XML for a given zone + product + date range
- Parse XML using `fast-xml-parser` with `isArray` callback for `TimeSeries`, `Period`, `Point`
- Extract hourly `price.amount` values with timestamps
- Handle 429 rate limit (60s backoff + single retry)
- Handle timeouts (30s per request)

Key constants:
```typescript
// ENTSO-E business type codes
const PRODUCT_CODES = {
  mfrr_up: { businessType: 'A97', direction: 'A01' },   // mFRR, upward
  mfrr_down: { businessType: 'A97', direction: 'A02' }, // mFRR, downward
  fcrd_up: { businessType: 'A95', direction: 'A01' },   // FCR, upward
  fcrd_down: { businessType: 'A95', direction: 'A02' }, // FCR, downward
};

// Representative zone per country (for country-level aggregation)
const COUNTRY_ZONES: Record<string, string> = {
  sweden: '10Y1001A1001A46L',    // SE3 (Stockholm, largest market)
  norway: '10YNO-1--------2',    // NO1 (Oslo)
  germany: '10Y1001A1001A82H',   // DE_LU
  netherlands: '10YNL----------L', // NL
  france: '10YFR-RTE------C',    // FR
};
```

Returns: `{ timestamp: Date, price: number }[]` per request

##### Task 1.4: Create price aggregator

**New file:** `src/lib/market/price-aggregator.ts`

Responsibilities:
- Group hourly prices by month (UTC)
- Compute simple arithmetic mean per month
- Return 12-element array indexed 0-11 (Jan-Dec)
- Handle months with no data points (return `null` or previous value)
- Floor negative averages to 0

##### Task 1.5: Create Supabase market price queries

**New file:** `src/lib/db/market-prices.ts`

Functions:
- `upsertMarketPrices(rows: MarketPriceRow[])` — batch upsert with `onConflict: 'country,product,month_idx'`, chunk size 500
- `getMarketPricesForCountry(country: string)` — fetch 48 rows (4 products x 12 months) for one country
- `getAllMarketPrices()` — fetch all 240 rows (5 countries x 4 products x 12 months)
- `getLatestUpdateTime()` — `SELECT MAX(updated_at) FROM market_prices`

---

#### Phase 2: Cron Job (Daily Ingestion)

**Goal:** Wire the ENTSO-E client + aggregator + DB into a Vercel cron route.

##### Task 2.1: Create cron route handler

**New file:** `src/app/api/cron/prices/route.ts`

```typescript
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  // 1. Verify CRON_SECRET
  // 2. Compute trailing 12-month window
  // 3. For each country (5) x product (4) = 20 fetches:
  //    a. Call entsoe-client.fetchPrices(zone, product, start, end)
  //    b. Aggregate to monthly averages
  //    c. Collect rows
  //    d. Sleep 200ms between requests
  // 4. Batch upsert all rows to Supabase
  // 5. Return summary JSON { success, fetched, errors, rowsUpserted }
}
```

20 requests (not 48) because we fetch one representative zone per country.

Sequential with 200ms delay = ~8 seconds total fetch time. Well within 300s limit.

Partial failure: log the error, skip the failed country/product, upsert what succeeded. Response includes `errors` count.

##### Task 2.2: Add cron schedule to `vercel.json`

**Modified file:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/prices",
      "schedule": "30 23 * * *"
    }
  ]
}
```

##### Task 2.3: Add environment variables

Add to Vercel project settings + `.env.local`:
- `ENTSOE_API_TOKEN` — ENTSO-E security token (register at transparency.entsoe.eu)
- `CRON_SECRET` — random 32-character string for cron authentication

**Modified file:** `.env.local` (add template entries)

---

#### Phase 3: Calculator Integration (Data Consumption)

**Goal:** Wire the calculator to read from DB instead of static imports.

##### Task 3.1: Create `getMarketData()` bridge function

**Modified file:** `src/lib/calculator/market-data.ts`

Add a new async function alongside the existing static data:

```typescript
/**
 * Fetch live market data from Supabase, falling back to static data.
 * Returns the same CountryMarketData shape the engine expects.
 */
export async function getMarketData(): Promise<Record<Country, CountryMarketData>> {
  try {
    const rows = await getAllMarketPrices();
    if (rows.length === 0) return MARKET_DATA; // static fallback

    // Transform DB rows into Record<Country, CountryMarketData>
    // Merge with static MARKET_DATA for resE_pct, label, currency
    return mergeWithStatic(rows);
  } catch {
    return MARKET_DATA; // DB error fallback
  }
}
```

The static `MARKET_DATA` export remains for: fallback, demo page, `resE_pct`/`label`/`currency` fields.

##### Task 3.2: Update `page.tsx` to fetch live prices

**Modified file:** `src/app/(simulator)/sim/t/[token]/page.tsx`

```typescript
// Before: engine uses MARKET_DATA (static import) automatically
// After: fetch live data server-side, pass as prop

import { getMarketData } from "@/lib/calculator/market-data";

export default async function SimulatorPage({ params }) {
  // ... existing token validation and snapshot loading ...

  const marketData = await getMarketData();

  return (
    <SimulatorClient
      accessToken={accessToken}
      tokenId={token.id}
      leadId={token.lead_id}
      initialState={{ ...initialState, company: companyName }}
      hasExistingSnapshot={!!snapshot}
      marketData={marketData}  // NEW PROP
    />
  );
}
```

##### Task 3.3: Update `SimulatorClient.tsx` to accept + use market data

**Modified file:** `src/app/(simulator)/sim/t/[token]/SimulatorClient.tsx`

- Add `marketData: Record<Country, CountryMarketData>` to `SimulatorClientProps`
- Pass it to `calculateRevenue(committedInputs, startMonth, marketData)`
- Pass it to `debouncedSave` for the server-side recalculation

##### Task 3.4: Update `calculateRevenue` to accept market data as parameter

**Modified file:** `src/lib/calculator/engine.ts`

```typescript
// Before:
import { MARKET_DATA } from "./market-data";
export function calculateRevenue(state, startMonth) {
  // ... const market = MARKET_DATA[state.country] ...
}

// After:
import { MARKET_DATA, type CountryMarketData } from "./market-data";
import type { Country } from "./types";

export function calculateRevenue(
  state: SimulatorState,
  startMonth: number = new Date().getMonth(),
  marketData?: Record<Country, CountryMarketData>
): CalculationResult {
  // Use provided data or fall back to static
  const allMarkets = marketData ?? MARKET_DATA;
  // ... const market = allMarkets[state.country] ...
}
```

The `marketData` parameter is optional — when omitted (demo page, PDF fallback), the static `MARKET_DATA` is used. This keeps all existing call sites working without changes.

##### Task 3.5: Update demo page

**Modified file:** `src/app/(simulator)/demo/page.tsx`

No changes needed — `calculateRevenue` without `marketData` parameter falls back to static data. Demo page continues to work as-is.

##### Task 3.6: Update PDF report route

**Modified file:** `src/app/api/reports/pdf/route.ts`

```typescript
import { getMarketData } from "@/lib/calculator/market-data";

// In the handler:
const marketData = await getMarketData();
const result = calculateRevenue(state, startMonth, marketData);
```

`RevenueReport.tsx` still imports static `MARKET_DATA` for `label`, `resE_pct`, `currency` display fields. These remain static since ENTSO-E doesn't provide them.

---

#### Phase 4: Resilience + Monitoring

##### Task 4.1: Add negative price floor in engine

**Modified file:** `src/lib/calculator/engine.ts`

In `calculateBank`, after computing `monthlyFlex` for each month:

```typescript
monthlyFlex.push(
  Math.max(0, (mfrrUpRev + mfrrDownRev + fcrUpRev + fcrDownRev) * CPO_SHARE)
);
```

##### Task 4.2: Add `cron_runs` logging table

```sql
CREATE TABLE cron_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  countries_succeeded INTEGER DEFAULT 0,
  countries_failed INTEGER DEFAULT 0,
  rows_upserted INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'running'  -- 'running', 'success', 'partial', 'failed'
);
```

The cron handler inserts a `running` row at start, updates it to `success`/`partial`/`failed` at end.

##### Task 4.3: Add server-side caching

In `getMarketData()`, add a simple in-memory cache with 1-hour TTL:

```typescript
let cachedData: Record<Country, CountryMarketData> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getMarketData() {
  if (cachedData && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedData;
  }
  // ... fetch from DB ...
  cachedData = result;
  cachedAt = Date.now();
  return result;
}
```

Note: On Vercel serverless, this cache is per-function-instance (not shared across requests on different instances). It reduces DB hits during bursts of traffic but doesn't eliminate them entirely. Acceptable for Phase 1.

---

## System-Wide Impact

### Interaction Graph

1. Cron fires (Vercel scheduler) -> `GET /api/cron/prices` -> `entsoe-client.ts` -> ENTSO-E API (external) -> `price-aggregator.ts` -> `market-prices.ts` -> Supabase `market_prices` table
2. User loads page -> `page.tsx` -> `getMarketData()` -> Supabase -> serialize to client -> `SimulatorClient` -> `calculateRevenue(state, startMonth, marketData)` -> render charts
3. User clicks Calculate -> `calculateRevenue` (client-side, uses prop data) -> update results
4. User clicks PDF -> `POST /api/reports/pdf` -> `getMarketData()` -> `calculateRevenue` -> render PDF

### Error Propagation

- ENTSO-E API failure -> cron logs error, skips that country/product -> stale but valid data served
- Supabase failure at page load -> `getMarketData()` catches error -> returns static `MARKET_DATA`
- `fast-xml-parser` throws on malformed XML -> caught in cron, logged, that request skipped

### State Lifecycle Risks

- **Snapshot consistency:** Snapshots store `outputResults` computed with whatever prices were active at save time. If prices update overnight, the stored results become slightly stale. This is acceptable — snapshots are a point-in-time record.
- **No orphaned data:** Upserts on `(country, product, month_idx)` are idempotent. Duplicate cron runs produce identical state.

### API Surface Parity

All interfaces that call `calculateRevenue` need the optional `marketData` parameter:
- `SimulatorClient.tsx` (client-side, via prop)
- `POST /api/reports/pdf` (server-side, via `getMarketData()`)
- `POST /api/snapshots/save` (server-side, currently recalculates — needs `getMarketData()`)

## Acceptance Criteria

### Functional Requirements

- [ ] `market_prices` table created in Supabase with correct schema and constraints
- [x] ENTSO-E client fetches capacity prices for 5 countries x 4 products = 20 API calls
- [x] XML responses parsed correctly; monthly averages computed and upserted
- [x] Cron runs daily at 23:30 UTC via Vercel cron schedule
- [x] Cron authenticates with `CRON_SECRET` and rejects unauthorized requests
- [x] Calculator reads from DB on page load; falls back to static data when DB is empty
- [x] Engine accepts optional `marketData` parameter; defaults to static when omitted
- [x] Demo page continues to work without DB access (uses static fallback)
- [x] PDF report uses live prices from DB
- [x] Negative flex revenue floored to zero

### Non-Functional Requirements

- [ ] Cron completes within 60 seconds (20 requests x ~1.5s each + processing)
- [ ] Page load adds < 100ms from DB price fetch (240 rows, indexed query)
- [ ] In-memory cache reduces DB hits to 1/hour per serverless instance
- [ ] Partial cron failure (some countries fail) does not break succeeding countries
- [ ] `cron_runs` table logs every execution with status and error details

### Quality Gates

- [x] `npx tsc --noEmit` passes with zero errors
- [ ] ESLint passes with zero errors
- [ ] Manual test: trigger cron locally with curl, verify DB rows
- [ ] Manual test: load simulator, confirm results use live data (compare to static)
- [ ] Manual test: empty `market_prices` table, confirm fallback to static data

## Dependencies & Prerequisites

1. **ENTSO-E API token** — Must register at transparency.entsoe.eu and request a security token. Free but requires email approval (1-2 business days).
2. **Vercel Pro plan** — Hobby plan limits cron to once/day with imprecise timing. Pro gives per-minute precision and 800s maxDuration.
3. **Supabase access** — Need permissions to create tables and add RLS policies.
4. **`fast-xml-parser` dependency** — New npm package (zero native dependencies, ~50KB).

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ENTSO-E API changes/deprecates | Low | High | Pin to known endpoint; monitor responses; static fallback always available |
| ENTSO-E rate limit exceeded | Very Low | Medium | 20 requests per day is trivial vs. 400/min limit; 200ms delay per request |
| Cron fails silently for days | Medium | Medium | `cron_runs` logging table; future: add Slack/email alerting |
| Malformed XML from ENTSO-E | Low | Low | try-catch per request; skip bad data; log error |
| DB empty on first deploy | Certain (once) | Low | Static fallback built into `getMarketData()` |
| Prices wildly different from current hardcoded values | Medium | Medium | Compare first cron results to static data; investigate large deviations before going live |

## Files Summary

### New Files (6)

| File | Purpose |
|------|---------|
| `src/lib/market/entsoe-client.ts` | ENTSO-E API client — fetch + XML parse |
| `src/lib/market/price-aggregator.ts` | Compute monthly averages from hourly data |
| `src/lib/db/market-prices.ts` | Supabase read/write for `market_prices` table |
| `src/app/api/cron/prices/route.ts` | Vercel cron handler |
| SQL: `market_prices` table | Price cache table |
| SQL: `cron_runs` table | Ingestion audit log |

### Modified Files (7)

| File | Change |
|------|--------|
| `package.json` | Add `fast-xml-parser` dependency |
| `vercel.json` | Add cron schedule |
| `.env.local` | Add `ENTSOE_API_TOKEN`, `CRON_SECRET` templates |
| `src/lib/calculator/market-data.ts` | Add `getMarketData()` async function with cache + fallback |
| `src/lib/calculator/engine.ts` | Add optional `marketData` parameter to `calculateRevenue` + `calculateBank`; add `Math.max(0, ...)` floor |
| `src/app/(simulator)/sim/t/[token]/page.tsx` | Fetch live prices, pass as prop |
| `src/app/(simulator)/sim/t/[token]/SimulatorClient.tsx` | Accept `marketData` prop, pass to engine |
| `src/app/api/reports/pdf/route.ts` | Fetch live prices for PDF generation |

### Unchanged Files

| File | Why |
|------|-----|
| `src/lib/calculator/types.ts` | SimulatorState, CalculationResult unchanged |
| `src/lib/calculator/constants.ts` | PROFILES, ECREDIT, CPO_SHARE unchanged |
| `src/app/(simulator)/demo/page.tsx` | Uses static fallback (no `marketData` prop needed) |
| All chart/result components | Consume `CalculationResult`, not raw prices |
| Admin pages | Read from snapshots, not live prices |

## Future Considerations (Phase 2)

- **Zone-level pricing:** Fetch per-zone data from ENTSO-E, add `zone` to `SimulatorState`, update engine to use zone-specific prices
- **Admin price dashboard:** Show current market prices, freshness, and historical trends
- **Slack alerting:** Notify on cron failure or stale data (>48h)
- **`resE_pct` from external source:** Eurostat or similar API for renewable energy share by country
- **Real-time monitoring dashboard:** Post-sale tool showing actual vs. projected revenue

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-04-13-live-mfrr-fcrd-pricing-brainstorm.md](../brainstorms/2026-04-13-live-mfrr-fcrd-pricing-brainstorm.md)
- Key decisions carried forward: ENTSO-E as sole source, daily cron + DB cache, monthly averages, subtle transparency, static fallback

### Internal References

- Engine calculation: `src/lib/calculator/engine.ts`
- Static market data: `src/lib/calculator/market-data.ts`
- Supabase client pattern: `src/lib/db/server.ts`
- DB query patterns: `src/lib/db/queries.ts`
- API route patterns: `src/lib/api-utils.ts`
- Existing vercel.json: `vercel.json`

### External References

- [ENTSO-E Transparency Platform API Guide](https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html)
- [ENTSO-E API Postman Collection](https://documenter.getpostman.com/view/7009892/2s93JtP3F6)
- [fast-xml-parser docs](https://github.com/NaturalIntelligence/fast-xml-parser)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Supabase JS upsert](https://supabase.com/docs/reference/javascript/upsert)
- [entsoe-py parsers (XML structure reference)](https://github.com/EnergieID/entsoe-py/blob/master/entsoe/parsers.py)
