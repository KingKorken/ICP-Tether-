/**
 * Tether Revenue Calculation Engine
 *
 * Always computes all 12 months. Timeframe (3/6/12) is a VIEW-LAYER slice.
 * Supports multi-config with per-config location (country).
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

/** Fixed Y-axis ceiling for cumulative chart (EUR) */
export const Y_AXIS_CEILING_CUMULATIVE = 30000;

// ---------------------------------------------------------------------------
// Single-config (backward compat)
// ---------------------------------------------------------------------------

export function calculateRevenue(state: SimulatorState): CalculationResult {
  return calculateMultiRevenue([
    {
      id: 0,
      chargers: state.chargers,
      powerMW: state.powerMW,
      utilization: state.utilization,
      flexPotential: state.flexPotential,
      type: state.type,
      country: state.country,
    },
  ]);
}

// ---------------------------------------------------------------------------
// Per-config annual revenue (sidebar preview)
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
// Multi-config — ALWAYS produces 12 months. Slicing is done at the view layer.
// ---------------------------------------------------------------------------

export function calculateMultiRevenue(
  groups: ChargerGroup[]
): CalculationResult {
  const monthlyEcreditsAgg = new Array<number>(12).fill(0);
  const monthlyFlexAgg = new Array<number>(12).fill(0);
  let annualEcredits = 0;
  let annualFlex = 0;
  let totalChargers = 0;

  for (const group of groups) {
    const market = MARKET_DATA[group.country];
    const profile = PROFILES[group.type];
    const { chargers, powerMW, utilization: util, flexPotential: flex } = group;
    totalChargers += chargers;

    const power_kW = powerMW * 1000;
    const annualKWh = chargers * power_kW * util * profile.accessibleHoursDay * 365;
    const avoidedCO2_kg = ECREDIT.avoidedCO2_g / 1000;
    const effectiveRate = market.resE_pct * ECREDIT.multiplier * avoidedCO2_kg * ECREDIT.co2Price * ECREDIT.marketDiscount;
    const ecreditCPO = annualKWh * effectiveRate * CPO_SHARE;
    const monthlyEcreditCPO = ecreditCPO / 12;

    for (let mi = 0; mi < 12; mi++) {
      const ecMo = monthlyEcreditCPO * market.resSeasonalFactor[mi];
      monthlyEcreditsAgg[mi] += ecMo;
      annualEcredits += ecMo;

      const mwAvailable = chargers * util * powerMW * flex;
      const accessRatio = profile.accessibleHoursDay / 24;
      const accessibleHours = HOURS_PER_MONTH[mi] * accessRatio;
      const flexMo = (
        mwAvailable * profile.mfrrUp * market.mfrr_up[mi] * accessibleHours +
        mwAvailable * profile.mfrrDown * market.mfrr_down[mi] * accessibleHours +
        mwAvailable * profile.fcrUp * market.fcrd_up[mi] * accessibleHours +
        mwAvailable * profile.fcrDown * market.fcrd_down[mi] * accessibleHours
      ) * CPO_SHARE;
      monthlyFlexAgg[mi] += flexMo;
      annualFlex += flexMo;
    }
  }

  const totalCPO = annualEcredits + annualFlex;

  // All 12 months of monthly data
  const monthly = monthlyFlexAgg.map((flexValue, i) => ({
    month: MONTH_LABELS[i],
    ecredits: monthlyEcreditsAgg[i],
    flexibility: flexValue,
    combined: flexValue + monthlyEcreditsAgg[i],
  }));

  // All 12 months of cumulative data
  const cumulative: CalculationResult["cumulative"] = [];
  let runCombined = 0;
  let runEcredits = 0;
  for (let m = 0; m < 12; m++) {
    runCombined += monthlyFlexAgg[m] + monthlyEcreditsAgg[m];
    runEcredits += monthlyEcreditsAgg[m];
    cumulative.push({
      month: MONTH_LABELS[m],
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
    totalMonths: 12,
    totalChargers,
  };
}
