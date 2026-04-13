/**
 * Tether Revenue Calculation Engine
 *
 * Ported from the HTML prototype (lines 1296-1423).
 * Pure function — no DOM dependencies, no side effects.
 *
 * Two revenue streams:
 * 1. E-credits: Based on energy consumption × avoided CO2 × market factors
 * 2. Grid Flexibility: Based on available capacity × market prices (mFRR + FCR-D)
 *
 * Multi-charger support: The primary charger (top-level state fields) plus
 * any number of additional charger banks (state.additionalChargers) are each
 * calculated independently and summed. Utilization, flexPotential, horizon,
 * smart charging, and grid connection are shared across all banks.
 */

import { MARKET_DATA, type CountryMarketData } from "./market-data";
import {
  PROFILES,
  ECREDIT,
  RES_SEASONAL,
  HOURS_PER_MONTH,
  CPO_SHARE,
  MONTH_LABELS,
} from "./constants";
import type {
  SimulatorState,
  CalculationResult,
  ChargerType,
  Country,
} from "./types";

interface BankRevenue {
  monthlyEcredits: number[];
  monthlyFlex: number[];
}

/**
 * Calculate revenue contribution from a single charger bank (primary or
 * additional). Utilization / flex / grid / smart-charging / market / horizon
 * are shared across all banks and passed in as context.
 */
function calculateBank(
  chargers: number,
  powerMW: number,
  type: ChargerType,
  ctx: {
    country: SimulatorState["country"];
    util: number;
    flex: number;
    totalMonths: number;
    startMonth: number;
    smartCharging: boolean;
    gridConnection: SimulatorState["gridConnection"];
    allMarkets: Record<Country, CountryMarketData>;
  }
): BankRevenue {
  const profile = PROFILES[type];
  const market = ctx.allMarkets[ctx.country];

  // Grid connection cap: single-phase limits effective power to 7.4kW for flex
  const flexPowerMW =
    ctx.gridConnection === "single_phase" ? Math.min(powerMW, 0.0074) : powerMW;

  // --- E-Credits Calculation ---
  const power_kW = powerMW * 1000;
  const annualKWh =
    chargers * power_kW * ctx.util * profile.accessibleHoursDay * 365;
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

  for (let m = 0; m < ctx.totalMonths; m++) {
    const mi = (ctx.startMonth + m) % 12;

    // E-credits with seasonal adjustment
    monthlyEcredits.push(monthlyEcreditCPO * RES_SEASONAL[mi]);

    // Grid Flexibility
    if (!ctx.smartCharging) {
      monthlyFlex.push(0);
    } else {
      const mwAvailable = chargers * ctx.util * flexPowerMW * ctx.flex;
      const accessRatio = profile.accessibleHoursDay / 24;
      const accessibleHours = HOURS_PER_MONTH[mi] * accessRatio;

      const mfrrUpRev =
        mwAvailable * profile.mfrrUp * market.mfrr_up[mi] * accessibleHours;
      const mfrrDownRev =
        mwAvailable *
        profile.mfrrDown *
        market.mfrr_down[mi] *
        accessibleHours;
      const fcrUpRev =
        mwAvailable * profile.fcrUp * market.fcrd_up[mi] * accessibleHours;
      const fcrDownRev =
        mwAvailable * profile.fcrDown * market.fcrd_down[mi] * accessibleHours;

      monthlyFlex.push(
        Math.max(0, (mfrrUpRev + mfrrDownRev + fcrUpRev + fcrDownRev) * CPO_SHARE)
      );
    }
  }

  return { monthlyEcredits, monthlyFlex };
}

/**
 * Calculate revenue projections for the given simulator state.
 * This is the core calculation — must complete in <16ms for 60fps.
 */
export function calculateRevenue(
  state: SimulatorState,
  startMonth: number = new Date().getMonth(),
  marketData?: Record<Country, CountryMarketData>
): CalculationResult {
  const totalMonths = state.horizonMonths;
  const smartCharging = state.smartCharging ?? true;
  const gridConnection = state.gridConnection ?? "three_phase";
  const additionalChargers = state.additionalChargers ?? [];
  const allMarkets = marketData ?? MARKET_DATA;

  const ctx = {
    country: state.country,
    util: state.utilization,
    flex: state.flexPotential,
    totalMonths,
    startMonth,
    smartCharging,
    gridConnection,
    allMarkets,
  };

  // All charger banks: primary + any additional banks added via the UI
  const banks: BankRevenue[] = [
    calculateBank(state.chargers, state.powerMW, state.type, ctx),
    ...additionalChargers.map((ac) =>
      calculateBank(ac.chargers, ac.powerMW, ac.type, ctx)
    ),
  ];

  // Sum month-by-month across all banks
  const monthlyEcredits: number[] = new Array(totalMonths).fill(0);
  const monthlyFlex: number[] = new Array(totalMonths).fill(0);
  for (const bank of banks) {
    for (let m = 0; m < totalMonths; m++) {
      monthlyEcredits[m] += bank.monthlyEcredits[m];
      monthlyFlex[m] += bank.monthlyFlex[m];
    }
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

  // Total charge points across all banks (for per-charger metric)
  const totalChargers =
    state.chargers +
    additionalChargers.reduce((sum, ac) => sum + ac.chargers, 0);

  return {
    totalCPO,
    ecreditCPO: totalEcreditsCPO,
    flexCPO: totalFlex,
    perCharger: totalChargers > 0 ? totalCPO / totalChargers : 0,
    monthly,
    cumulative,
    totalMonths,
  };
}
