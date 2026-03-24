/**
 * Hours per month (non-leap year).
 */
export const HOURS_PER_MONTH = [
  744, 672, 744, 720, 744, 720, 744, 744, 720, 744, 720, 744,
] as const;

/**
 * Month labels.
 */
export const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/**
 * Charger type profiles with default operating parameters.
 */
export const PROFILES = {
  public: {
    utilization: 0.15,
    accessibleHoursDay: 24,
    flexPotential: 0.50,
    mfrrUp: 0.30,
    mfrrDown: 0.70,
    fcrUp: 0.30,
    fcrDown: 0.70,
  },
  residential: {
    utilization: 0.25,
    accessibleHoursDay: 14,
    flexPotential: 0.60,
    mfrrUp: 0.30,
    mfrrDown: 0.70,
    fcrUp: 0.30,
    fcrDown: 0.70,
  },
} as const;

/**
 * E-credit calculation constants.
 */
export const ECREDIT = {
  /** Multiplier for e-credit calculation */
  multiplier: 4,
  /** Avoided CO2 in grams per kWh */
  avoidedCO2_g: 323.4,
  /** CO2 price in EUR per kg */
  co2Price: 0.34,
  /** Market discount factor */
  marketDiscount: 0.035,
} as const;

/**
 * Residential seasonal adjustment factors (monthly).
 */
export const RES_SEASONAL = [
  0.85, 0.88, 0.95, 1.05, 1.10, 1.12,
  1.08, 1.02, 0.98, 0.92, 0.88, 0.87,
] as const;

/**
 * CPO's revenue share percentage.
 */
export const CPO_SHARE = 0.40;

/**
 * Fixed Y-axis ceiling for the seasonal (monthly) chart.
 * Derived from theoretical max: 10,000 chargers, 22 kW, 40% util,
 * 80% flex, public type, best country/month ≈ 1.53M EUR.
 * Rounded up to 2M for generous headroom.
 */
export const MAX_MONTHLY_CEILING = 2_000_000;
