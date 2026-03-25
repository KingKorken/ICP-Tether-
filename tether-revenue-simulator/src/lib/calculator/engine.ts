/**
 * Tether Revenue Calculation Engine
 *
 * Supports multi-configuration with per-config location (country).
 * Each ChargerGroup uses its own country's market data for pricing.
 */

import { MARKET_DATA } from "./market-data";
import {
  PROFILES,
  ECREDIT,
  HOURS_PER_MONTH,
  CPO_SHARE,
  MONTH_LABELS,
} from "./constants";
import type {
  SimulatorState,
  CalculationResult,
  ChargerGroup,
} from "./types";

/** Fixed Y-axis ceiling for monthly charts (EUR) */
export const Y_AXIS_CEILING = 25000;

// ---------------------------------------------------------------------------
// Single-config calculation (backward compatible)
// ---------------------------------------------------------------------------

export function calculateRevenue(state: SimulatorState): CalculationResult {
  return calculateMultiRevenue(
    [
      {
        id: 0,
        chargers: state.chargers,
        powerMW: state.powerMW,
        utilization: state.utilization,
        flexPotential: state.flexPotential,
        type: state.type,
        country: state.country,
      },
    ],
    state.horizonMonths
  );
}

// ---------------------------------------------------------------------------
// Per-config annual revenue (for sidebar preview)
// ---------------------------------------------------------------------------

export function calculateGroupAnnualRevenue(group: ChargerGroup): number {
  const market = MARKET_DATA[group.country];
  const profile = PROFILES[group.type];
  const { chargers, powerMW, utilization: util, flexPotential: flex } = group;

  const power_kW = powerMW * 1000;
  const annualKWh = chargers * power_kW * util * profile.accessibleHoursDay * 365;
  const avoidedCO2_kg = ECREDIT.avoidedCO2_g / 1000;
  const effectiveRate = market.resE_pct * ECREDIT.multiplier * avoidedCO2_kg * ECREDIT.co2Price * ECREDIT.marketDiscount;
  const ecreditCPO = annualKWh * effectiveRate * CPO_SHARE;
  const monthlyEcreditCPO = ecreditCPO / 12;

  let annualEcredits = 0;
  let annualFlex = 0;

  for (let mi = 0; mi < 12; mi++) {
    annualEcredits += monthlyEcreditCPO * market.resSeasonalFactor[mi];
    const mwAvailable = chargers * util * powerMW * flex;
    const accessRatio = profile.accessibleHoursDay / 24;
    const accessibleHours = HOURS_PER_MONTH[mi] * accessRatio;
    annualFlex += (
      mwAvailable * profile.mfrrUp * market.mfrr_up[mi] * accessibleHours +
      mwAvailable * profile.mfrrDown * market.mfrr_down[mi] * accessibleHours +
      mwAvailable * profile.fcrUp * market.fcrd_up[mi] * accessibleHours +
      mwAvailable * profile.fcrDown * market.fcrd_down[mi] * accessibleHours
    ) * CPO_SHARE;
  }

  return annualEcredits + annualFlex;
}

// ---------------------------------------------------------------------------
// Multi-config aggregated calculation (per-config country)
// ---------------------------------------------------------------------------

export function calculateMultiRevenue(
  groups: ChargerGroup[],
  horizonMonths: number
): CalculationResult {
  const totalMonths = horizonMonths;
  const startMonth = 12 - totalMonths;

  const monthlyEcreditsAgg = new Array<number>(totalMonths).fill(0);
  const monthlyFlexAgg = new Array<number>(totalMonths).fill(0);
  let annualEcredits = 0;
  let annualFlex = 0;
  let totalChargers = 0;

  for (const group of groups) {
    const market = MARKET_DATA[group.country]; // Per-config country
    const profile = PROFILES[group.type];
    const { chargers, powerMW, utilization: util, flexPotential: flex } = group;
    totalChargers += chargers;

    const power_kW = powerMW * 1000;
    const annualKWh = chargers * power_kW * util * profile.accessibleHoursDay * 365;
    const avoidedCO2_kg = ECREDIT.avoidedCO2_g / 1000;
    const effectiveRate = market.resE_pct * ECREDIT.multiplier * avoidedCO2_kg * ECREDIT.co2Price * ECREDIT.marketDiscount;
    const ecreditCPO = annualKWh * effectiveRate * CPO_SHARE;
    const monthlyEcreditCPO = ecreditCPO / 12;

    // Full-year annual
    for (let mi = 0; mi < 12; mi++) {
      annualEcredits += monthlyEcreditCPO * market.resSeasonalFactor[mi];
      const mwAvailable = chargers * util * powerMW * flex;
      const accessRatio = profile.accessibleHoursDay / 24;
      const accessibleHours = HOURS_PER_MONTH[mi] * accessRatio;
      annualFlex += (
        mwAvailable * profile.mfrrUp * market.mfrr_up[mi] * accessibleHours +
        mwAvailable * profile.mfrrDown * market.mfrr_down[mi] * accessibleHours +
        mwAvailable * profile.fcrUp * market.fcrd_up[mi] * accessibleHours +
        mwAvailable * profile.fcrDown * market.fcrd_down[mi] * accessibleHours
      ) * CPO_SHARE;
    }

    // Visible-window monthly
    for (let m = 0; m < totalMonths; m++) {
      const mi = startMonth + m;
      monthlyEcreditsAgg[m] += monthlyEcreditCPO * market.resSeasonalFactor[mi];
      const mwAvailable = chargers * util * powerMW * flex;
      const accessRatio = profile.accessibleHoursDay / 24;
      const accessibleHours = HOURS_PER_MONTH[mi] * accessRatio;
      monthlyFlexAgg[m] += (
        mwAvailable * profile.mfrrUp * market.mfrr_up[mi] * accessibleHours +
        mwAvailable * profile.mfrrDown * market.mfrr_down[mi] * accessibleHours +
        mwAvailable * profile.fcrUp * market.fcrd_up[mi] * accessibleHours +
        mwAvailable * profile.fcrDown * market.fcrd_down[mi] * accessibleHours
      ) * CPO_SHARE;
    }
  }

  const totalCPO = annualEcredits + annualFlex;

  const monthly = monthlyFlexAgg.map((flexValue, i) => ({
    month: MONTH_LABELS[startMonth + i],
    ecredits: monthlyEcreditsAgg[i],
    flexibility: flexValue,
    combined: flexValue + monthlyEcreditsAgg[i],
  }));

  const cumulative: CalculationResult["cumulative"] = [];
  let runCombined = 0;
  let runEcredits = 0;
  for (let m = 0; m < totalMonths; m++) {
    runCombined += monthlyFlexAgg[m] + monthlyEcreditsAgg[m];
    runEcredits += monthlyEcreditsAgg[m];
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
    perCharger: totalChargers > 0 ? totalCPO / totalChargers : 0,
    monthly,
    cumulative,
    totalMonths,
    totalChargers,
  };
}
