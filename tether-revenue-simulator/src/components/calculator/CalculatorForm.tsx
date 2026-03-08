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
    <Card className="sticky top-20">
      <h2 className="text-lg font-semibold text-brand-dark mb-6">
        Your Fleet Configuration
      </h2>

      <div className="space-y-6">
        {/* Country Selector */}
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-2">
            Market
          </label>
          <select
            value={state.country}
            onChange={(e) => onChange("country", e.target.value)}
            className="w-full px-3 py-2.5 bg-brand-light border border-brand-secondary rounded-lg text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-tether/30 focus:border-brand-tether transition-colors"
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
          <label className="block text-sm font-medium text-brand-dark mb-2">
            Charger Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CHARGER_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => onChange("type", type)}
                className={`
                  px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${
                    state.type === type
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-brand-light text-brand-muted hover:bg-brand-secondary"
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
          <label className="block text-sm font-medium text-brand-dark mb-2">
            Charger Power
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 0.0074, label: "7.4 kW" },
              { value: 0.011, label: "11 kW" },
              { value: 0.022, label: "22 kW" },
            ].map((power) => (
              <button
                key={power.value}
                onClick={() => onChange("powerMW", power.value)}
                className={`
                  px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${
                    state.powerMW === power.value
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-brand-light text-brand-muted hover:bg-brand-secondary"
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-brand-dark">
                {config.label}
              </label>
              <span className="text-sm font-semibold text-brand-tether tabular-nums">
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
              className="w-full h-2 bg-brand-secondary rounded-full appearance-none cursor-pointer accent-brand-tether [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-brand-tether [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between mt-1 text-xs text-brand-muted">
              <span>{config.format(config.min)}</span>
              <span>{config.format(config.max)}</span>
            </div>
          </div>
        ))}

        {/* Horizon Toggle */}
        <div>
          <label className="block text-sm font-medium text-brand-dark mb-2">
            Projection Horizon
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[12, 24].map((months) => (
              <button
                key={months}
                onClick={() => onChange("horizonMonths", months)}
                className={`
                  px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${
                    state.horizonMonths === months
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-brand-light text-brand-muted hover:bg-brand-secondary"
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
