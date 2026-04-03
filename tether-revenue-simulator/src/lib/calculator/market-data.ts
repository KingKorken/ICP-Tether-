import type { Country, BiddingZone, ZoneMetadata } from "./types";

/**
 * Market data per country.
 * Monthly mFRR and FCR-D prices from Excel model / Mimer.
 * Sweden: real data. Others: estimated.
 */
export interface CountryMarketData {
  label: string;
  currency: string;
  /** mFRR up-regulation prices (12 months) */
  mfrr_up: readonly number[];
  /** mFRR down-regulation prices (12 months) */
  mfrr_down: readonly number[];
  /** FCR-D up-regulation prices (12 months) */
  fcrd_up: readonly number[];
  /** FCR-D down-regulation prices (12 months) */
  fcrd_down: readonly number[];
  /** Renewable energy share percentage */
  resE_pct: number;
}

export const MARKET_DATA: Record<Country, CountryMarketData> = {
  sweden: {
    label: "Sweden",
    currency: "EUR",
    mfrr_up: [12.3, 38.4, 74.6, 36.7, 31.8, 31.8, 48.7, 39.2, 39.2, 39.2, 39.2, 39.2],
    mfrr_down: [8.0, 9.3, 45.8, 50.7, 50.7, 39.2, 53.6, 36.8, 36.8, 36.8, 36.8, 36.8],
    fcrd_up: [6.0, 2.7, 5.9, 8.9, 5.5, 4.7, 5.2, 5.6, 5.6, 5.6, 5.6, 5.6],
    fcrd_down: [4.1, 2.9, 7.4, 11.4, 14.7, 6.4, 2.4, 7.1, 7.1, 7.1, 7.1, 7.1],
    resE_pct: 0.65,
  },
  norway: {
    label: "Norway",
    currency: "EUR",
    mfrr_up: [14.0, 40.0, 70.0, 35.0, 30.0, 30.0, 46.0, 38.0, 38.0, 38.0, 38.0, 38.0],
    mfrr_down: [9.0, 10.0, 43.0, 48.0, 48.0, 37.0, 50.0, 35.0, 35.0, 35.0, 35.0, 35.0],
    fcrd_up: [5.5, 2.5, 5.5, 8.5, 5.0, 4.5, 5.0, 5.2, 5.2, 5.2, 5.2, 5.2],
    fcrd_down: [3.8, 2.7, 7.0, 10.8, 14.0, 6.0, 2.2, 6.8, 6.8, 6.8, 6.8, 6.8],
    resE_pct: 0.72,
  },
  germany: {
    label: "Germany",
    currency: "EUR",
    mfrr_up: [18.0, 42.0, 65.0, 38.0, 33.0, 33.0, 50.0, 40.0, 40.0, 40.0, 40.0, 40.0],
    mfrr_down: [10.0, 11.0, 48.0, 52.0, 52.0, 40.0, 55.0, 38.0, 38.0, 38.0, 38.0, 38.0],
    fcrd_up: [7.0, 3.2, 6.5, 9.5, 6.0, 5.2, 5.8, 6.0, 6.0, 6.0, 6.0, 6.0],
    fcrd_down: [4.5, 3.2, 8.0, 12.0, 15.5, 7.0, 2.8, 7.5, 7.5, 7.5, 7.5, 7.5],
    resE_pct: 0.52,
  },
  netherlands: {
    label: "Netherlands",
    currency: "EUR",
    mfrr_up: [15.0, 39.0, 68.0, 36.0, 31.0, 31.0, 47.0, 39.0, 39.0, 39.0, 39.0, 39.0],
    mfrr_down: [8.5, 9.8, 44.0, 49.0, 49.0, 38.0, 52.0, 36.0, 36.0, 36.0, 36.0, 36.0],
    fcrd_up: [6.2, 2.8, 6.0, 9.0, 5.6, 4.8, 5.3, 5.7, 5.7, 5.7, 5.7, 5.7],
    fcrd_down: [4.2, 3.0, 7.5, 11.5, 14.8, 6.5, 2.5, 7.2, 7.2, 7.2, 7.2, 7.2],
    resE_pct: 0.38,
  },
  france: {
    label: "France",
    currency: "EUR",
    mfrr_up: [13.0, 37.0, 66.0, 35.0, 30.0, 30.0, 45.0, 38.0, 38.0, 38.0, 38.0, 38.0],
    mfrr_down: [7.5, 8.8, 42.0, 47.0, 47.0, 36.0, 50.0, 34.0, 34.0, 34.0, 34.0, 34.0],
    fcrd_up: [5.8, 2.6, 5.7, 8.7, 5.3, 4.5, 5.0, 5.4, 5.4, 5.4, 5.4, 5.4],
    fcrd_down: [3.9, 2.8, 7.2, 11.0, 14.2, 6.2, 2.3, 6.9, 6.9, 6.9, 6.9, 6.9],
    resE_pct: 0.25,
  },
};

/**
 * Get country display info.
 */
export const COUNTRY_OPTIONS = [
  { value: "sweden" as const, label: "Sweden", flag: "\uD83C\uDDF8\uD83C\uDDEA" },
  { value: "norway" as const, label: "Norway", flag: "\uD83C\uDDF3\uD83C\uDDF4" },
  { value: "germany" as const, label: "Germany", flag: "\uD83C\uDDE9\uD83C\uDDEA" },
  { value: "netherlands" as const, label: "Netherlands", flag: "\uD83C\uDDF3\uD83C\uDDF1" },
  { value: "france" as const, label: "France", flag: "\uD83C\uDDEB\uD83C\uDDF7" },
];

// =============================================
// Bidding Zone → Country Mapping
// =============================================

export const ZONE_TO_COUNTRY: Record<BiddingZone, Country | null> = {
  // Sweden zones
  SE1: "sweden", SE2: "sweden", SE3: "sweden", SE4: "sweden",
  // Norway zones
  NO1: "norway", NO2: "norway", NO3: "norway", NO4: "norway", NO5: "norway",
  // Single-zone countries
  DE_LU: "germany", NL: "netherlands", FR: "france",
  // Unsupported (coming soon)
  DK1: null, DK2: null, FI: null,
  EE: null, LV: null, LT: null,
  PL: null, CZ: null, SK: null,
  AT: null, CH: null, BE: null,
  GB: null, IE: null,
  ES: null, PT: null, IT: null,
  GR: null, RO: null, BG: null,
  HR: null, SI: null, HU: null,
  RS: null, BA: null, ME: null, MK: null, AL: null,
};

export const ZONE_METADATA: ZoneMetadata[] = [
  // Sweden (4 zones, north to south)
  { id: "SE1", label: "SE1 (Lule\u00e5)", country: "sweden", center: { lat: 66.5, lng: 18.0 } },
  { id: "SE2", label: "SE2 (Sundsvall)", country: "sweden", center: { lat: 62.5, lng: 16.0 } },
  { id: "SE3", label: "SE3 (Stockholm)", country: "sweden", center: { lat: 59.3, lng: 16.0 } },
  { id: "SE4", label: "SE4 (Malm\u00f6)", country: "sweden", center: { lat: 56.0, lng: 14.0 } },
  // Norway (5 zones)
  { id: "NO1", label: "NO1 (Oslo)", country: "norway", center: { lat: 59.9, lng: 10.7 } },
  { id: "NO2", label: "NO2 (Kristiansand)", country: "norway", center: { lat: 58.5, lng: 7.0 } },
  { id: "NO3", label: "NO3 (Trondheim)", country: "norway", center: { lat: 63.4, lng: 10.4 } },
  { id: "NO4", label: "NO4 (Troms\u00f8)", country: "norway", center: { lat: 69.0, lng: 18.0 } },
  { id: "NO5", label: "NO5 (Bergen)", country: "norway", center: { lat: 60.4, lng: 5.3 } },
  // Germany/Luxembourg
  { id: "DE_LU", label: "Germany", country: "germany", center: { lat: 51.2, lng: 10.4 } },
  // Netherlands
  { id: "NL", label: "Netherlands", country: "netherlands", center: { lat: 52.1, lng: 5.3 } },
  // France
  { id: "FR", label: "France", country: "france", center: { lat: 46.6, lng: 2.2 } },
  // --- Unsupported zones (coming soon) ---
  { id: "DK1", label: "DK1 (West Denmark)", country: null, center: { lat: 56.0, lng: 9.5 } },
  { id: "DK2", label: "DK2 (East Denmark)", country: null, center: { lat: 55.7, lng: 12.0 } },
  { id: "FI", label: "Finland", country: null, center: { lat: 64.0, lng: 26.0 } },
  { id: "EE", label: "Estonia", country: null, center: { lat: 58.6, lng: 25.0 } },
  { id: "LV", label: "Latvia", country: null, center: { lat: 57.0, lng: 24.5 } },
  { id: "LT", label: "Lithuania", country: null, center: { lat: 55.2, lng: 24.0 } },
  { id: "PL", label: "Poland", country: null, center: { lat: 52.0, lng: 19.5 } },
  { id: "CZ", label: "Czech Republic", country: null, center: { lat: 49.8, lng: 15.5 } },
  { id: "SK", label: "Slovakia", country: null, center: { lat: 48.7, lng: 19.7 } },
  { id: "AT", label: "Austria", country: null, center: { lat: 47.5, lng: 13.3 } },
  { id: "CH", label: "Switzerland", country: null, center: { lat: 46.8, lng: 8.2 } },
  { id: "BE", label: "Belgium", country: null, center: { lat: 50.5, lng: 4.4 } },
  { id: "GB", label: "Great Britain", country: null, center: { lat: 54.0, lng: -2.0 } },
  { id: "IE", label: "Ireland", country: null, center: { lat: 53.4, lng: -8.2 } },
  { id: "ES", label: "Spain", country: null, center: { lat: 40.4, lng: -3.7 } },
  { id: "PT", label: "Portugal", country: null, center: { lat: 39.4, lng: -8.2 } },
  { id: "IT", label: "Italy", country: null, center: { lat: 42.5, lng: 12.5 } },
  { id: "GR", label: "Greece", country: null, center: { lat: 39.1, lng: 22.0 } },
  { id: "RO", label: "Romania", country: null, center: { lat: 45.9, lng: 25.0 } },
  { id: "BG", label: "Bulgaria", country: null, center: { lat: 42.7, lng: 25.5 } },
  { id: "HR", label: "Croatia", country: null, center: { lat: 45.1, lng: 15.2 } },
  { id: "SI", label: "Slovenia", country: null, center: { lat: 46.2, lng: 14.8 } },
  { id: "HU", label: "Hungary", country: null, center: { lat: 47.2, lng: 19.5 } },
  { id: "RS", label: "Serbia", country: null, center: { lat: 44.0, lng: 21.0 } },
  { id: "BA", label: "Bosnia & Herzegovina", country: null, center: { lat: 43.9, lng: 17.7 } },
  { id: "ME", label: "Montenegro", country: null, center: { lat: 42.5, lng: 19.3 } },
  { id: "MK", label: "North Macedonia", country: null, center: { lat: 41.5, lng: 21.7 } },
  { id: "AL", label: "Albania", country: null, center: { lat: 41.3, lng: 20.0 } },
];
