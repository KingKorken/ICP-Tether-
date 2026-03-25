/**
 * ENTSO-E Transparency Platform API Service
 *
 * Provides live grid pricing and seasonality data for European bidding zones.
 * API docs: https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html
 *
 * CORS: The ENTSO-E API does NOT support CORS. In production, route requests
 * through a backend proxy (e.g. Next.js API route at /api/entsoe-proxy).
 *
 * Authentication: Requires a security token (free registration, email approval ~3 days).
 */

export interface EntsoeConfig {
  /** Backend proxy URL (required — direct browser calls blocked by CORS) */
  proxyBaseUrl: string;
  /** ENTSO-E security token (set via env var, passed to proxy) */
  securityToken: string;
  /** Whether the integration is active */
  enabled: boolean;
}

export const ENTSOE_DEFAULT_CONFIG: EntsoeConfig = {
  proxyBaseUrl: "/api/entsoe-proxy",
  securityToken: process.env.NEXT_PUBLIC_ENTSOE_TOKEN ?? "",
  enabled: false, // Enable when proxy is deployed
};

/**
 * Fetch day-ahead prices from ENTSO-E for a bidding zone.
 *
 * @param biddingZone  ENTSO-E EIC code (e.g. "10Y1001A1001A44P" for Sweden SE3)
 * @param startDate    Format: YYYYMMDDHHmm
 * @param endDate      Format: YYYYMMDDHHmm
 * @param config       API configuration
 * @returns            Parsed price data or null if unavailable
 */
export async function fetchDayAheadPrices(
  biddingZone: string,
  startDate: string,
  endDate: string,
  config: EntsoeConfig = ENTSOE_DEFAULT_CONFIG
): Promise<number[] | null> {
  if (!config.enabled) return null;

  try {
    const params = new URLSearchParams({
      documentType: "A44",
      in_Domain: biddingZone,
      out_Domain: biddingZone,
      periodStart: startDate,
      periodEnd: endDate,
    });

    const res = await fetch(`${config.proxyBaseUrl}?${params}`);
    if (!res.ok) return null;

    const xmlText = await res.text();
    return parseEntsoeXml(xmlText);
  } catch (e) {
    console.warn("ENTSO-E API unavailable:", (e as Error).message);
    return null;
  }
}

/**
 * Fetch mFRR reserve prices.
 */
export async function fetchMfrrPrices(
  biddingZone: string,
  startDate: string,
  endDate: string,
  config: EntsoeConfig = ENTSOE_DEFAULT_CONFIG
): Promise<number[] | null> {
  if (!config.enabled) return null;

  try {
    const params = new URLSearchParams({
      documentType: "A81",
      businessType: "A97",
      controlArea_Domain: biddingZone,
      periodStart: startDate,
      periodEnd: endDate,
    });

    const res = await fetch(`${config.proxyBaseUrl}?${params}`);
    if (!res.ok) return null;

    const xmlText = await res.text();
    return parseEntsoeXml(xmlText);
  } catch (e) {
    console.warn("ENTSO-E mFRR API unavailable:", (e as Error).message);
    return null;
  }
}

/**
 * Fetch FCR reserve prices.
 */
export async function fetchFcrPrices(
  biddingZone: string,
  startDate: string,
  endDate: string,
  config: EntsoeConfig = ENTSOE_DEFAULT_CONFIG
): Promise<number[] | null> {
  if (!config.enabled) return null;

  try {
    const params = new URLSearchParams({
      documentType: "A81",
      businessType: "A95",
      controlArea_Domain: biddingZone,
      periodStart: startDate,
      periodEnd: endDate,
    });

    const res = await fetch(`${config.proxyBaseUrl}?${params}`);
    if (!res.ok) return null;

    const xmlText = await res.text();
    return parseEntsoeXml(xmlText);
  } catch (e) {
    console.warn("ENTSO-E FCR API unavailable:", (e as Error).message);
    return null;
  }
}

/**
 * Parse ENTSO-E XML response to extract price values.
 * Stub — full implementation would use DOMParser to extract
 * TimeSeries > Period > Point > price.amount values.
 */
function parseEntsoeXml(_xmlText: string): number[] {
  // TODO: Implement XML parsing when proxy is live
  // const parser = new DOMParser();
  // const doc = parser.parseFromString(xmlText, "text/xml");
  // const points = doc.querySelectorAll("Point");
  // return Array.from(points).map(p => parseFloat(p.querySelector("price.amount")?.textContent ?? "0"));
  return [];
}
