import { z } from "zod";

// =============================================
// Simulator Input State
// =============================================

export const COUNTRIES = [
  "sweden",
  "norway",
  "germany",
  "netherlands",
  "france",
] as const;
export type Country = (typeof COUNTRIES)[number];

// =============================================
// ENTSOE Bidding Zones (UI layer — maps to Country for engine)
// =============================================

export const BIDDING_ZONES = [
  // Supported zones (clickable, map to a Country)
  "SE1", "SE2", "SE3", "SE4",           // Sweden
  "NO1", "NO2", "NO3", "NO4", "NO5",    // Norway
  "DE_LU",                               // Germany/Luxembourg
  "NL",                                  // Netherlands
  "FR",                                  // France
  // Unsupported zones (greyed out, "Coming soon")
  "DK1", "DK2",                          // Denmark
  "FI",                                  // Finland
  "EE", "LV", "LT",                     // Baltics
  "PL",                                  // Poland
  "CZ", "SK",                           // Czech Republic, Slovakia
  "AT",                                  // Austria
  "CH",                                  // Switzerland
  "BE",                                  // Belgium
  "GB",                                  // Great Britain
  "IE",                                  // Ireland
  "ES", "PT",                           // Iberia
  "IT",                                  // Italy (simplified)
  "GR",                                  // Greece
  "RO", "BG", "HR", "SI", "HU",         // SE Europe
  "RS", "BA", "ME", "MK", "AL",         // Balkans
] as const;

export type BiddingZone = (typeof BIDDING_ZONES)[number];

export interface ZoneMetadata {
  id: BiddingZone;
  label: string;
  country: Country | null; // null = unsupported / "Coming soon"
  center: { lat: number; lng: number };
}

export const CHARGER_TYPES = ["public", "residential"] as const;
export type ChargerType = (typeof CHARGER_TYPES)[number];

export const POWER_OPTIONS_AC = [0.0074, 0.011, 0.022] as const;
export const POWER_OPTIONS_DC = [0.05, 0.15, 0.35] as const;
export const POWER_OPTIONS = [...POWER_OPTIONS_AC, ...POWER_OPTIONS_DC] as const;
export type PowerMW = (typeof POWER_OPTIONS)[number];

export const GRID_CONNECTIONS = ["single_phase", "three_phase"] as const;
export type GridConnection = (typeof GRID_CONNECTIONS)[number];

/**
 * A single additional charger bank. Used when a site has a mix of charger
 * types/power levels. Each bank contributes independently to revenue.
 * The "primary" charger lives on the top-level SimulatorState fields.
 */
export const AdditionalChargerSchema = z.object({
  id: z.string(),
  type: z.enum(CHARGER_TYPES),
  powerMW: z.number().refine((v) => [0.0074, 0.011, 0.022, 0.05, 0.15, 0.35].includes(v), {
    message: "Invalid power value",
  }),
  chargers: z.number().int().min(1).max(10000),
});

export type AdditionalCharger = z.infer<typeof AdditionalChargerSchema>;

/**
 * Zod schema for simulator state — used for API boundary validation.
 */
export const SimulatorStateSchema = z.object({
  company: z.string().max(200).default(""),
  country: z.enum(COUNTRIES),
  type: z.enum(CHARGER_TYPES),
  chargers: z.number().int().min(1).max(10000),
  powerMW: z.number().refine((v) => [0.0074, 0.011, 0.022, 0.05, 0.15, 0.35].includes(v), {
    message: "Invalid power value",
  }),
  utilization: z.number().min(0.05).max(0.40),
  flexPotential: z.number().min(0.20).max(0.80),
  horizonMonths: z.union([z.literal(3), z.literal(6), z.literal(12)]).default(12),
  smartCharging: z.boolean().default(true),
  gridConnection: z.enum(["single_phase", "three_phase"]).default("three_phase"),
  /** Additional charger banks — added via "Add another charger" button. */
  additionalChargers: z.array(AdditionalChargerSchema).max(5).default([]),
});

export type SimulatorState = z.infer<typeof SimulatorStateSchema>;

// =============================================
// Calculation Results
// =============================================

export interface MonthlyBreakdown {
  month: string;
  ecredits: number;
  flexibility: number;
  combined: number;
}

export interface CumulativeData {
  month: string;
  cumulativeCombined: number;
  cumulativeEcredits: number;
}

export interface CalculationResult {
  /** Total annual CPO revenue */
  totalCPO: number;
  /** E-credits portion of annual revenue */
  ecreditCPO: number;
  /** Grid flexibility portion of annual revenue */
  flexCPO: number;
  /** Revenue per charger per year */
  perCharger: number;
  /** Monthly breakdown (12 months) for seasonal chart */
  monthly: MonthlyBreakdown[];
  /** Cumulative data for timeline chart */
  cumulative: CumulativeData[];
  /** Total months in horizon */
  totalMonths: number;
}

// =============================================
// Default State
// =============================================

export const DEFAULT_STATE: SimulatorState = {
  company: "",
  country: "sweden",
  type: "public",
  chargers: 500,
  powerMW: 0.011,
  utilization: 0.15,
  flexPotential: 0.50,
  horizonMonths: 12,
  smartCharging: true,
  gridConnection: "three_phase",
  additionalChargers: [],
};

// =============================================
// Input Field Config (for form generation)
// =============================================

export interface SliderConfig {
  field: keyof SimulatorState;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  /** Convert internal value to display value (e.g. 0.15 -> 15 for percentages) */
  toDisplay: (value: number) => number;
  /** Convert display value back to internal value (e.g. 15 -> 0.15 for percentages) */
  fromDisplay: (display: number) => number;
  displayMin: number;
  displayMax: number;
  displayStep: number;
  /** Suffix shown outside the input (e.g. "%") */
  suffix?: string;
  /** Format the internal value for the text input (no suffix) */
  formatInput: (value: number) => string;
}

export const SLIDER_CONFIGS: SliderConfig[] = [
  {
    field: "chargers",
    label: "Number of Charge Points",
    min: 1,
    max: 10000,
    step: 1,
    format: (v) => v.toLocaleString("en-US"),
    toDisplay: (v) => v,
    fromDisplay: (d) => d,
    displayMin: 1,
    displayMax: 10000,
    displayStep: 1,
    formatInput: (v) => v.toLocaleString("en-US"),
  },
  {
    field: "utilization",
    label: "Average Utilization Rate",
    min: 0.05,
    max: 0.40,
    step: 0.01,
    format: (v) => `${Math.round(v * 100)}%`,
    toDisplay: (v) => Math.round(v * 100),
    fromDisplay: (d) => d / 100,
    displayMin: 5,
    displayMax: 40,
    displayStep: 1,
    suffix: "%",
    formatInput: (v) => String(Math.round(v * 100)),
  },
  {
    field: "flexPotential",
    label: "Flexibility Potential",
    min: 0.20,
    max: 0.80,
    step: 0.05,
    format: (v) => `${Math.round(v * 100)}%`,
    toDisplay: (v) => Math.round(v * 100),
    fromDisplay: (d) => d / 100,
    displayMin: 20,
    displayMax: 80,
    displayStep: 5,
    suffix: "%",
    formatInput: (v) => String(Math.round(v * 100)),
  },
];
