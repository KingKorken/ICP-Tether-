/**
 * Tether Revenue Calculation Engine
 *
 * Two revenue streams:
 * 1. E-credits: Based on energy consumption x avoided CO2 x market factors
 * 2. Grid Flexibility: Based on available capacity x market prices (mFRR + FCR-D)
 *
 * Data source: ENTSO-E Transparency Platform (historical 2025 data).
 */

import { MARKET_DATA } from "./market-data";
import {
  PROFILES,
  ECREDIT,
  HOURS_PER_MONTH,
  CPO_SHARE,
  MONTH_LABELS,
} from "./constants";
import type { SimulatorState, CalculationResult } from "./types";

/** Fixed Y-axis ceiling for charts (EUR) */
export const Y_AXIS_CEILING = 25000;

/**
 * Calculate revenue projections for the given simulator state.
 * Uses country-specific seasonality from ENTSO-E data.
 */
export function calculateRevenue(state: SimulatorState): CalculationResult {
  const profile = PROFILES[state.type];
  const market = MARKET_DATA[state.country];
  const { chargers, powerMW, utilization: util, flexPotential: flex } = state;
  const totalMonths = state.horizonMonths;

  // --- E-Credits Calculation ---
  const power_kW = powerMW * 1000;
  const annualKWh =
    chargers * power_kW * util * profile.accessibleHoursDay * 365;
  const avoidedCO2_kg = ECREDIT.avoidedCO2_g / 1000;
  const effectiveRate =
    market.resE_pct *
    ECREDIT.multiplier *
    avoidedCO2_kg *
    ECREDIT.co2Price *
    ECREDIT.marketDiscount;
  const ecreditTotal = annualKWh * effectiveRate;
  const ecreditCPO = ecreditTotal * CPO_SHARE;
  const monthlyEcreditCPO = ecreditCPO / 12;

  // --- Monthly Calculations ---
  // Use the last N months of the year (historical view)
  const startMonth = 12 - totalMonths;
  const monthlyEcredits: number[] = [];
  const monthlyFlex: number[] = [];

  for (let m = 0; m < totalMonths; m++) {
    const mi = startMonth + m; // Actual month index (0-11)

    // E-credits with country-specific seasonal adjustment
    monthlyEcredits.push(monthlyEcreditCPO * market.resSeasonalFactor[mi]);

    // Grid Flexibility
    const mwAvailable = chargers * util * powerMW * flex;
    const accessRatio = profile.accessibleHoursDay / 24;
    const accessibleHours = HOURS_PER_MONTH[mi] * accessRatio;

    const mfrrUpRev =
      mwAvailable * profile.mfrrUp * market.mfrr_up[mi] * accessibleHours;
    const mfrrDownRev =
      mwAvailable * profile.mfrrDown * market.mfrr_down[mi] * accessibleHours;
    const fcrUpRev =
      mwAvailable * profile.fcrUp * market.fcrd_up[mi] * accessibleHours;
    const fcrDownRev =
      mwAvailable * profile.fcrDown * market.fcrd_down[mi] * accessibleHours;

    monthlyFlex.push(
      (mfrrUpRev + mfrrDownRev + fcrUpRev + fcrDownRev) * CPO_SHARE
    );
  }

  // --- Aggregate Annual Values (always based on full 12 months for annual figure) ---
  let annualEcredits = 0;
  let annualFlex = 0;
  for (let mi = 0; mi < 12; mi++) {
    annualEcredits += monthlyEcreditCPO * market.resSeasonalFactor[mi];

    const mwAvailable = chargers * util * powerMW * flex;
    const accessRatio = profile.accessibleHoursDay / 24;
    const accessibleHours = HOURS_PER_MONTH[mi] * accessRatio;
    const mfrrUpRev = mwAvailable * profile.mfrrUp * market.mfrr_up[mi] * accessibleHours;
    const mfrrDownRev = mwAvailable * profile.mfrrDown * market.mfrr_down[mi] * accessibleHours;
    const fcrUpRev = mwAvailable * profile.fcrUp * market.fcrd_up[mi] * accessibleHours;
    const fcrDownRev = mwAvailable * profile.fcrDown * market.fcrd_down[mi] * accessibleHours;
    annualFlex += (mfrrUpRev + mfrrDownRev + fcrUpRev + fcrDownRev) * CPO_SHARE;
  }

  const totalCPO = annualEcredits + annualFlex;

  // --- Monthly Breakdown (for seasonal chart, visible months only) ---
  const monthly = monthlyFlex.map((flexValue, i) => ({
    month: MONTH_LABELS[startMonth + i],
    ecredits: monthlyEcredits[i],
    flexibility: flexValue,
    combined: flexValue + monthlyEcredits[i],
  }));

  // --- Cumulative Data (for timeline chart) ---
  const cumulative: CalculationResult["cumulative"] = [];
  let runCombined = 0;
  let runEcredits = 0;

  for (let m = 0; m < totalMonths; m++) {
    const combined = monthlyFlex[m] + monthlyEcredits[m];
    runCombined += combined;
    runEcredits += monthlyEcredits[m];
    cumulative.push({
      month: MONTH_LABELS[startMonth + m],
      cumulativeCombined: runCombined,
      cumulativeEcredits: runEcredits,
    });
  }

  return {
    totalCPO,
    ecreditCPO: annualEcredits,
    flexCPO: annualFlex,
    perCharger: chargers > 0 ? totalCPO / chargers : 0,
    monthly,
    cumulative,
    totalMonths,
    totalChargers: chargers,
  };
}
