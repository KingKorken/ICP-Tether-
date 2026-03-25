/**
 * Tether Revenue Calculation Engine
 *
 * Two revenue streams:
 * 1. E-credits: Based on energy consumption x avoided CO2 x market factors
 * 2. Grid Flexibility: Based on available capacity x market prices (mFRR + FCR-D)
 *
 * Supports multi-configuration: sums revenue across multiple ChargerGroup entries.
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
import type {
  SimulatorState,
  CalculationResult,
  ChargerGroup,
  ChargerType,
  Country,
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
      },
    ],
    state.country,
    state.type,
    state.horizonMonths
  );
}

// ---------------------------------------------------------------------------
// Multi-config aggregated calculation
// ---------------------------------------------------------------------------

export interface ChargerGroupWithType extends ChargerGroup {
  type: ChargerType;
}

export function calculateMultiRevenue(
  groups: ChargerGroupWithType[],
  country: Country,
  _defaultType: ChargerType,
  horizonMonths: number
): CalculationResult {
  const market = MARKET_DATA[country];
  const totalMonths = horizonMonths;
  const startMonth = 12 - totalMonths;

  // Accumulators for the visible-window monthly data
  const monthlyEcreditsAgg = new Array<number>(totalMonths).fill(0);
  const monthlyFlexAgg = new Array<number>(totalMonths).fill(0);

  // Accumulators for full-year annual totals
  let annualEcredits = 0;
  let annualFlex = 0;
  let totalChargers = 0;

  for (const group of groups) {
    const profile = PROFILES[group.type];
    const { chargers, powerMW, utilization: util, flexPotential: flex } = group;
    totalChargers += chargers;

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
    const ecreditCPO = annualKWh * effectiveRate * CPO_SHARE;
    const monthlyEcreditCPO = ecreditCPO / 12;

    // Full-year annual totals
    for (let mi = 0; mi < 12; mi++) {
      annualEcredits += monthlyEcreditCPO * market.resSeasonalFactor[mi];

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
      annualFlex +=
        (mfrrUpRev + mfrrDownRev + fcrUpRev + fcrDownRev) * CPO_SHARE;
    }

    // Visible-window monthly data
    for (let m = 0; m < totalMonths; m++) {
      const mi = startMonth + m;
      monthlyEcreditsAgg[m] +=
        monthlyEcreditCPO * market.resSeasonalFactor[mi];

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
      monthlyFlexAgg[m] +=
        (mfrrUpRev + mfrrDownRev + fcrUpRev + fcrDownRev) * CPO_SHARE;
    }
  }

  const totalCPO = annualEcredits + annualFlex;

  // Monthly breakdown for seasonal chart
  const monthly = monthlyFlexAgg.map((flexValue, i) => ({
    month: MONTH_LABELS[startMonth + i],
    ecredits: monthlyEcreditsAgg[i],
    flexibility: flexValue,
    combined: flexValue + monthlyEcreditsAgg[i],
  }));

  // Cumulative data for timeline chart
  const cumulative: CalculationResult["cumulative"] = [];
  let runCombined = 0;
  let runEcredits = 0;

  for (let m = 0; m < totalMonths; m++) {
    const combined = monthlyFlexAgg[m] + monthlyEcreditsAgg[m];
    runCombined += combined;
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
