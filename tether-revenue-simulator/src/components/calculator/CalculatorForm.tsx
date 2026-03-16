"use client";

import { Card } from "@/components/shared/Card";
import { COUNTRY_OPTIONS } from "@/lib/calculator/market-data";
import { SLIDER_CONFIGS, type SimulatorState, CHARGER_TYPES } from "@/lib/calculator/types";

interface CalculatorFormProps {
  state: SimulatorState;
  onChange: (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => void;
}

export function CalculatorForm({ state, onChange }: CalculatorFormProps) {
  return (
    <Card className="sticky top-16" padding="md">
      <h2 className="text-base font-semibold text-brand-text mb-5">
        Fleet Configuration
      </h2>

      <div className="space-y-5">
        {/* Country Selector */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">
            Market
          </label>
          <select
            value={state.country}
            onChange={(e) => onChange("country", e.target.value)}
            className="w-full px-3 py-2 bg-brand-light border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/15 focus:border-brand-primary-light transition-colors"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.flag} {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Charger Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">
            Charger Type
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {CHARGER_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => onChange("type", type)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    state.type === type
                      ? "bg-brand-primary text-white"
                      : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
                  }
                `}
              >
                {type === "public" ? "Public" : "Residential"}
              </button>
            ))}
          </div>
        </div>

        {/* Power Level Selector */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">
            Charger Power
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 0.0074, label: "7.4 kW" },
              { value: 0.011, label: "11 kW" },
              { value: 0.022, label: "22 kW" },
            ].map((power) => (
              <button
                key={power.value}
                onClick={() => onChange("powerMW", power.value)}
                className={`
                  px-2 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    state.powerMW === power.value
                      ? "bg-brand-primary text-white"
                      : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
                  }
                `}
              >
                {power.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        {SLIDER_CONFIGS.map((config) => (
          <div key={config.field}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-brand-text">
                {config.label}
              </label>
              <span className="text-sm font-semibold text-brand-primary tabular-nums">
                {config.format(state[config.field] as number)}
              </span>
            </div>
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step}
              value={state[config.field] as number}
              onChange={(e) =>
                onChange(config.field, parseFloat(e.target.value))
              }
              className="w-full"
            />
            <div className="flex justify-between mt-0.5 text-xs text-brand-muted">
              <span>{config.format(config.min)}</span>
              <span>{config.format(config.max)}</span>
            </div>
          </div>
        ))}

        {/* Horizon Toggle */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">
            Projection Horizon
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[12, 24].map((months) => (
              <button
                key={months}
                onClick={() => onChange("horizonMonths", months)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    state.horizonMonths === months
                      ? "bg-brand-primary text-white"
                      : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
                  }
                `}
              >
                {months} months
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
