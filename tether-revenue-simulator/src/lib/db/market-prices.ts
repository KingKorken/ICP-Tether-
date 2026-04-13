/**
 * Supabase queries for the market_prices table.
 *
 * Read/write operations for cached ENTSO-E market data.
 * Uses the service role client (bypasses RLS).
 */

import { createServerClient } from "./server";

// =============================================
// Types
// =============================================

export interface MarketPriceRow {
  country: string;
  product: string;
  month_idx: number;
  avg_price: number;
  sample_count: number;
}

export interface CronRunRow {
  id?: number;
  started_at?: string;
  completed_at?: string;
  countries_succeeded?: number;
  countries_failed?: number;
  rows_upserted?: number;
  error_message?: string | null;
  status: "running" | "success" | "partial" | "failed";
}

// =============================================
// Market Prices
// =============================================

/**
 * Batch upsert market prices. Uses ON CONFLICT (country, product, month_idx)
 * to update existing rows.
 */
export async function upsertMarketPrices(rows: MarketPriceRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const supabase = createServerClient();
  const CHUNK_SIZE = 500;
  let totalUpserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE).map((row) => ({
      ...row,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("market_prices")
      .upsert(chunk, {
        onConflict: "country,product,month_idx",
      });

    if (error) {
      console.error("[market-prices] Upsert error:", error.message);
      throw error;
    }

    totalUpserted += chunk.length;
  }

  return totalUpserted;
}

/**
 * Fetch all market prices for a single country (48 rows: 4 products x 12 months).
 */
export async function getMarketPricesForCountry(country: string) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("market_prices")
    .select("country, product, month_idx, avg_price, sample_count, updated_at")
    .eq("country", country)
    .order("product")
    .order("month_idx");

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch all market prices (240 rows: 5 countries x 4 products x 12 months).
 */
export async function getAllMarketPrices() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("market_prices")
    .select("country, product, month_idx, avg_price, sample_count, updated_at")
    .order("country")
    .order("product")
    .order("month_idx");

  if (error) throw error;
  return data ?? [];
}

/**
 * Get the most recent update timestamp across all market prices.
 */
export async function getLatestUpdateTime(): Promise<string | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("market_prices")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data?.updated_at ?? null;
}

// =============================================
// Cron Runs (audit log)
// =============================================

/**
 * Start a new cron run log entry.
 */
export async function startCronRun(): Promise<number | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("cron_runs")
    .insert({ status: "running" })
    .select("id")
    .single();

  if (error) {
    console.error("[market-prices] Failed to log cron start:", error.message);
    return null;
  }
  return data.id;
}

/**
 * Complete a cron run log entry.
 */
export async function completeCronRun(
  id: number,
  result: {
    status: "success" | "partial" | "failed";
    countriesSucceeded: number;
    countriesFailed: number;
    rowsUpserted: number;
    errorMessage?: string;
  }
) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("cron_runs")
    .update({
      status: result.status,
      completed_at: new Date().toISOString(),
      countries_succeeded: result.countriesSucceeded,
      countries_failed: result.countriesFailed,
      rows_upserted: result.rowsUpserted,
      error_message: result.errorMessage ?? null,
    })
    .eq("id", id);

  if (error) {
    console.error("[market-prices] Failed to log cron completion:", error.message);
  }
}
