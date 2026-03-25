/**
 * eco2grid / Green Grid Compass API Service (by 50Hertz / TenneT)
 *
 * Provides live carbon intensity data for European grid zones.
 * API portal: https://explore.traxes.io/greengrid-compass/v1/
 *
 * CORS: Likely restricted. In production, route through a backend proxy.
 *
 * Authentication: Bearer token (free self-service registration at api-portal.eco2grid.com).
 */

export interface Eco2gridConfig {
  /** Backend proxy URL */
  proxyBaseUrl: string;
  /** Bearer token (set via env var) */
  bearerToken: string;
  /** Whether the integration is active */
  enabled: boolean;
}

export const ECO2GRID_DEFAULT_CONFIG: Eco2gridConfig = {
  proxyBaseUrl: "/api/eco2grid-proxy",
  bearerToken: process.env.NEXT_PUBLIC_ECO2GRID_TOKEN ?? "",
  enabled: false,
};

export interface CO2IntensityResult {
  /** Carbon intensity in gCO2/kWh */
  intensity: number;
  /** Timestamp of the measurement */
  timestamp: string;
  /** Whether this is live or fallback data */
  isLive: boolean;
}

/**
 * Fetch current CO2 intensity for a grid zone.
 *
 * @param zone  Bidding zone code (e.g. "SE3", "DE-LU", "FR")
 * @param config  API configuration
 * @returns  CO2 intensity data or null
 */
export async function fetchCO2Intensity(
  zone: string,
  config: Eco2gridConfig = ECO2GRID_DEFAULT_CONFIG
): Promise<CO2IntensityResult | null> {
  if (!config.enabled) return null;

  try {
    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const params = new URLSearchParams({
      zone,
      start: oneHourAgo,
      end: now,
      "time-resolution": "Hourly",
      "calculation-type": "Consumption",
      "emission-type": "Operational",
      "forecast-type": "Actual",
    });

    const res = await fetch(`${config.proxyBaseUrl}?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    const latestValue = data.values?.[data.values.length - 1];

    if (!latestValue) return null;

    return {
      intensity: Math.round(latestValue.value),
      timestamp: latestValue.timestamp ?? now,
      isLive: true,
    };
  } catch (e) {
    console.warn("eco2grid API unavailable:", (e as Error).message);
    return null;
  }
}

/**
 * Map country codes to eco2grid zone identifiers.
 */
export const COUNTRY_TO_ECO2GRID_ZONE: Record<string, string> = {
  sweden: "SE3",
  norway: "NO1",
  germany: "DE-LU",
  netherlands: "NL",
  france: "FR",
  denmark: "DK1",
};
