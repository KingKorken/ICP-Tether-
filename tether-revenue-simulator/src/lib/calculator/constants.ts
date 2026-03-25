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
  multiplier: 4,
  avoidedCO2_g: 323.4,
  co2Price: 0.34,
  marketDiscount: 0.035,
} as const;

/**
 * CPO's revenue share percentage.
 */
export const CPO_SHARE = 0.40;
