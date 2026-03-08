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

export const CHARGER_TYPES = ["public", "residential"] as const;
export type ChargerType = (typeof CHARGER_TYPES)[number];

export const POWER_OPTIONS = [0.0074, 0.011, 0.022] as const;
export type PowerMW = (typeof POWER_OPTIONS)[number];

/**
 * Zod schema for simulator state — used for API boundary validation.
 */
export const SimulatorStateSchema = z.object({
  company: z.string().max(200).default(""),
  country: z.enum(COUNTRIES),
  type: z.enum(CHARGER_TYPES),
  chargers: z.number().int().min(10).max(10000),
  powerMW: z.number().refine((v) => [0.0074, 0.011, 0.022].includes(v), {
    message: "Invalid power value",
  }),
  utilization: z.number().min(0.05).max(0.40),
  flexPotential: z.number().min(0.20).max(0.80),
  horizonMonths: z.number().int().min(12).max(24).default(12),
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
}

export const SLIDER_CONFIGS: SliderConfig[] = [
  {
    field: "chargers",
    label: "Number of Charge Points",
    min: 10,
    max: 10000,
    step: 10,
    format: (v) => v.toLocaleString("en-US"),
  },
  {
    field: "utilization",
    label: "Average Utilization Rate",
    min: 0.05,
    max: 0.40,
    step: 0.01,
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    field: "flexPotential",
    label: "Flexibility Potential",
    min: 0.20,
    max: 0.80,
    step: 0.05,
    format: (v) => `${Math.round(v * 100)}%`,
  },
];
