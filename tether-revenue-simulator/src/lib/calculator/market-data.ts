import type { Country } from "./types";

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
