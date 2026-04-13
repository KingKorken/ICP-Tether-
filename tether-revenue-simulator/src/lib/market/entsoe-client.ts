/**
 * ENTSO-E Transparency Platform API Client
 *
 * Fetches contracted reserve capacity prices (mFRR + FCR-D) for European
 * bidding zones. Returns hourly price data that is then aggregated into
 * monthly averages by the price-aggregator module.
 *
 * API docs: https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html
 */

import { XMLParser } from "fast-xml-parser";

// =============================================
// Types
// =============================================

export interface HourlyPrice {
  timestamp: Date;
  price: number;
}

export type Product = "mfrr_up" | "mfrr_down" | "fcrd_up" | "fcrd_down";

// =============================================
// ENTSO-E Business Type Codes
// =============================================

/**
 * ENTSO-E document/business type codes for reserve capacity prices.
 *
 * - A81 = Contracted reserves
 * - A97 = Manual Frequency Restoration Reserve (mFRR)
 * - A95 = Frequency Containment Reserve (FCR)
 * - A01 = Upward direction
 * - A02 = Downward direction
 */
const PRODUCT_CODES: Record<Product, { businessType: string; direction: string }> = {
  mfrr_up: { businessType: "A97", direction: "A01" },
  mfrr_down: { businessType: "A97", direction: "A02" },
  fcrd_up: { businessType: "A95", direction: "A01" },
  fcrd_down: { businessType: "A95", direction: "A02" },
};

/**
 * Representative bidding zone EIC code per country.
 * For country-level aggregation, we pick one representative zone.
 */
export const COUNTRY_ZONES: Record<string, string> = {
  sweden: "10Y1001A1001A46L", // SE3 (Stockholm, largest market)
  norway: "10YNO-1--------2", // NO1 (Oslo)
  germany: "10Y1001A1001A82H", // DE_LU
  netherlands: "10YNL----------L", // NL
  france: "10YFR-RTE------C", // FR
};

const ENTSOE_BASE_URL = "https://web-api.tp.entsoe.eu/api";
const REQUEST_TIMEOUT_MS = 30_000;

// =============================================
// XML Parser
// =============================================

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => {
    // Ensure these are always arrays even when there's only one element
    return ["TimeSeries", "Period", "Point"].includes(name);
  },
});

// =============================================
// Public API
// =============================================

/**
 * Fetch hourly capacity prices from ENTSO-E for a given country and product.
 *
 * @param country - Country key (e.g. 'sweden', 'norway')
 * @param product - Product key (e.g. 'mfrr_up', 'fcrd_down')
 * @param periodStart - Start of date range (inclusive)
 * @param periodEnd - End of date range (exclusive)
 * @returns Array of hourly prices, or empty array on failure
 */
export async function fetchPrices(
  country: string,
  product: Product,
  periodStart: Date,
  periodEnd: Date
): Promise<HourlyPrice[]> {
  const token = process.env.ENTSOE_API_TOKEN;
  if (!token) {
    console.error("[entsoe-client] Missing ENTSOE_API_TOKEN environment variable");
    return [];
  }

  const zone = COUNTRY_ZONES[country];
  if (!zone) {
    console.error(`[entsoe-client] Unknown country: ${country}`);
    return [];
  }

  const codes = PRODUCT_CODES[product];
  if (!codes) {
    console.error(`[entsoe-client] Unknown product: ${product}`);
    return [];
  }

  const url = buildUrl(token, zone, codes, periodStart, periodEnd);

  try {
    const xml = await fetchWithRetry(url);
    if (!xml) return [];
    return parseXmlResponse(xml, periodStart);
  } catch (error) {
    console.error(
      `[entsoe-client] Failed to fetch ${product} for ${country}:`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

// =============================================
// Internal Helpers
// =============================================

function buildUrl(
  token: string,
  zone: string,
  codes: { businessType: string; direction: string },
  periodStart: Date,
  periodEnd: Date
): string {
  const params = new URLSearchParams({
    securityToken: token,
    documentType: "A81", // Contracted reserves
    businessType: codes.businessType,
    "type_MarketAgreement.Type": "A01", // Daily
    "controlArea_Domain": zone,
    periodStart: formatDate(periodStart),
    periodEnd: formatDate(periodEnd),
    // Direction: up or down
    "flowDirection.direction": codes.direction,
  });

  return `${ENTSOE_BASE_URL}?${params.toString()}`;
}

/**
 * Format date as YYYYMMDD0000 for ENTSO-E API
 */
function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}0000`;
}

/**
 * Fetch URL with single retry on 429 (rate limit).
 * Returns XML string or null on failure.
 */
async function fetchWithRetry(url: string, attempt = 1): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.status === 429 && attempt === 1) {
      console.warn("[entsoe-client] Rate limited (429). Waiting 60s before retry...");
      await sleep(60_000);
      return fetchWithRetry(url, 2);
    }

    if (res.status === 400) {
      // ENTSO-E returns 400 for "no data" scenarios
      const text = await res.text();
      if (text.includes("No matching data found")) {
        console.warn("[entsoe-client] No data found for this query");
        return null;
      }
      console.error(`[entsoe-client] Bad request (400): ${text.slice(0, 200)}`);
      return null;
    }

    if (!res.ok) {
      console.error(`[entsoe-client] HTTP ${res.status}: ${res.statusText}`);
      return null;
    }

    return await res.text();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[entsoe-client] Request timed out");
    } else {
      throw error;
    }
    return null;
  }
}

/**
 * Parse ENTSO-E XML response and extract hourly prices.
 *
 * XML structure:
 * <Publication_MarketDocument>
 *   <TimeSeries>
 *     <Period>
 *       <timeInterval>
 *         <start>2025-01-01T00:00Z</start>
 *         <end>2025-01-02T00:00Z</end>
 *       </timeInterval>
 *       <resolution>PT60M</resolution>
 *       <Point>
 *         <position>1</position>
 *         <price.amount>12.34</price.amount>
 *       </Point>
 *       ...
 *     </Period>
 *   </TimeSeries>
 * </Publication_MarketDocument>
 */
function parseXmlResponse(xml: string, _periodStart: Date): HourlyPrice[] {
  const prices: HourlyPrice[] = [];

  try {
    const parsed = xmlParser.parse(xml);
    const doc =
      parsed["Publication_MarketDocument"] ||
      parsed["Balancing_MarketDocument"] ||
      parsed;

    const timeSeriesList = doc?.TimeSeries;
    if (!timeSeriesList || !Array.isArray(timeSeriesList)) {
      return prices;
    }

    for (const ts of timeSeriesList) {
      const periods = ts?.Period;
      if (!periods || !Array.isArray(periods)) continue;

      for (const period of periods) {
        const interval = period?.timeInterval;
        const startStr = interval?.start;
        if (!startStr) continue;

        const periodStart = new Date(startStr);
        const resolution = period?.resolution || "PT60M";
        const resolutionMinutes = parseResolution(resolution);

        const points = period?.Point;
        if (!points || !Array.isArray(points)) continue;

        for (const point of points) {
          const position = parseInt(point?.position, 10);
          const amount = parseFloat(point?.["price.amount"]);

          if (isNaN(position) || isNaN(amount)) continue;

          // Position is 1-indexed; each step is one resolution period
          const offsetMs = (position - 1) * resolutionMinutes * 60 * 1000;
          const timestamp = new Date(periodStart.getTime() + offsetMs);

          prices.push({ timestamp, price: amount });
        }
      }
    }
  } catch (error) {
    console.error(
      "[entsoe-client] XML parse error:",
      error instanceof Error ? error.message : error
    );
  }

  return prices;
}

/**
 * Parse ISO 8601 duration to minutes.
 * Handles: PT60M, PT15M, PT30M, PT1H
 */
function parseResolution(resolution: string): number {
  if (resolution === "PT60M" || resolution === "PT1H") return 60;
  if (resolution === "PT30M") return 30;
  if (resolution === "PT15M") return 15;
  // Fallback: try to parse PT{X}M
  const match = resolution.match(/PT(\d+)M/);
  if (match) return parseInt(match[1], 10);
  return 60; // default to hourly
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
