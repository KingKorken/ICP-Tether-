/**
 * GET /api/cron/prices
 *
 * Daily cron job that fetches reserve capacity prices from the ENTSO-E
 * Transparency Platform API for all supported countries, computes monthly
 * averages, and upserts them into the Supabase market_prices table.
 *
 * Triggered by Vercel Cron at 23:30 UTC daily.
 * Can also be triggered manually via curl for testing.
 *
 * 20 requests total: 5 countries x 4 products
 * ~200ms delay between requests to stay well within ENTSO-E rate limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchPrices, COUNTRY_ZONES, type Product } from "@/lib/market/entsoe-client";
import {
  aggregateToMonthly,
  fillAndFloor,
  getSampleCounts,
} from "@/lib/market/price-aggregator";
import {
  upsertMarketPrices,
  startCronRun,
  completeCronRun,
  type MarketPriceRow,
} from "@/lib/db/market-prices";

export const maxDuration = 300; // 5 minutes (Vercel Pro)
export const dynamic = "force-dynamic";

const PRODUCTS: Product[] = ["mfrr_up", "mfrr_down", "fcrd_up", "fcrd_down"];
const DELAY_BETWEEN_REQUESTS_MS = 200;

export async function GET(request: NextRequest) {
  // -------------------------------------------------------
  // 1. Verify CRON_SECRET (Vercel sends this as Authorization header)
  // -------------------------------------------------------
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // -------------------------------------------------------
  // 2. Start cron run log
  // -------------------------------------------------------
  const cronRunId = await startCronRun();

  // -------------------------------------------------------
  // 3. Compute trailing 12-month window
  // -------------------------------------------------------
  const now = new Date();
  // Start: first day of the month, 12 months ago
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1)
  );
  // End: first day of current month (exclusive end for ENTSO-E)
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  console.log(
    `[cron/prices] Fetching prices from ${periodStart.toISOString()} to ${periodEnd.toISOString()}`
  );

  // -------------------------------------------------------
  // 4. Fetch + aggregate for each country x product
  // -------------------------------------------------------
  const countries = Object.keys(COUNTRY_ZONES);
  const allRows: MarketPriceRow[] = [];
  const errors: string[] = [];
  let countriesSucceeded = 0;
  let countriesFailed = 0;

  for (const country of countries) {
    let countrySuccess = true;

    for (const product of PRODUCTS) {
      try {
        // Fetch hourly data
        const prices = await fetchPrices(country, product, periodStart, periodEnd);

        if (prices.length === 0) {
          console.warn(`[cron/prices] No data for ${country}/${product}`);
          // Not a fatal error — some products may not be available for all countries
          continue;
        }

        // Aggregate to monthly averages
        const rawMonthly = aggregateToMonthly(prices);
        const monthly = fillAndFloor(rawMonthly);
        const sampleCounts = getSampleCounts(prices);

        // Build rows for upsert
        for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
          allRows.push({
            country,
            product,
            month_idx: monthIdx,
            avg_price: Math.round(monthly[monthIdx] * 10000) / 10000, // 4 decimal places
            sample_count: sampleCounts[monthIdx],
          });
        }

        console.log(
          `[cron/prices] ${country}/${product}: ${prices.length} hourly prices -> ${monthly.filter((_, i) => sampleCounts[i] > 0).length}/12 months with data`
        );
      } catch (error) {
        const msg = `${country}/${product}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[cron/prices] Error: ${msg}`);
        errors.push(msg);
        countrySuccess = false;
      }

      // Rate limit delay between requests
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }

    if (countrySuccess) {
      countriesSucceeded++;
    } else {
      countriesFailed++;
    }
  }

  // -------------------------------------------------------
  // 5. Batch upsert all rows to Supabase
  // -------------------------------------------------------
  let rowsUpserted = 0;
  try {
    rowsUpserted = await upsertMarketPrices(allRows);
    console.log(`[cron/prices] Upserted ${rowsUpserted} rows to market_prices`);
  } catch (error) {
    const msg = `Upsert failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[cron/prices] ${msg}`);
    errors.push(msg);
  }

  // -------------------------------------------------------
  // 6. Complete cron run log
  // -------------------------------------------------------
  const status =
    countriesFailed === 0 && errors.length === 0
      ? "success"
      : countriesSucceeded > 0
        ? "partial"
        : "failed";

  if (cronRunId) {
    await completeCronRun(cronRunId, {
      status,
      countriesSucceeded,
      countriesFailed,
      rowsUpserted,
      errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
    });
  }

  // -------------------------------------------------------
  // 7. Return summary
  // -------------------------------------------------------
  return NextResponse.json({
    success: status !== "failed",
    status,
    countriesSucceeded,
    countriesFailed,
    rowsUpserted,
    errors: errors.length > 0 ? errors : undefined,
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
