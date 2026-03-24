/**
 * Tether Revenue Calculation Engine
 *
 * Ported from the HTML prototype (lines 1296-1423).
 * Pure function — no DOM dependencies, no side effects.
 *
 * Two revenue streams:
 * 1. E-credits: Based on energy consumption × avoided CO2 × market factors
 * 2. Grid Flexibility: Based on available capacity × market prices (mFRR + FCR-D)
 */

import { MARKET_DATA } from "./market-data";
import {
  PROFILES,
  ECREDIT,
  RES_SEASONAL,
  HOURS_PER_MONTH,
  CPO_SHARE,
  MONTH_LABELS,
} from "./constants";
import type { SimulatorState, CalculationResult } from "./types";

/**
 * Calculate revenue projections for the given simulator state.
 * This is the core calculation — must complete in <16ms for 60fps.
 */
export function calculateRevenue(
  state: SimulatorState,
  startMonth: number = new Date().getMonth()
): CalculationResult {
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
  const monthlyEcredits: number[] = [];
  const monthlyFlex: number[] = [];

  for (let m = 0; m < totalMonths; m++) {
    const mi = (startMonth + m) % 12; // Calendar month index

    // E-credits with seasonal adjustment
    monthlyEcredits.push(monthlyEcreditCPO * RES_SEASONAL[mi]);

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

  // --- Aggregate Values for Selected Horizon ---
  const totalEcreditsCPO = monthlyEcredits.reduce((a, b) => a + b, 0);
  const totalFlex = monthlyFlex.reduce((a, b) => a + b, 0);
  const totalCPO = totalEcreditsCPO + totalFlex;

  // --- Monthly Breakdown (for seasonal chart) ---
  const monthly = monthlyFlex.map((flexValue, i) => ({
    month: MONTH_LABELS[(startMonth + i) % 12],
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
      month: MONTH_LABELS[(startMonth + m) % 12],
      cumulativeCombined: runCombined,
      cumulativeEcredits: runEcredits,
    });
  }

  return {
    totalCPO,
    ecreditCPO: totalEcreditsCPO,
    flexCPO: totalFlex,
    perCharger: chargers > 0 ? totalCPO / chargers : 0,
    monthly,
    cumulative,
    totalMonths,
  };
}
