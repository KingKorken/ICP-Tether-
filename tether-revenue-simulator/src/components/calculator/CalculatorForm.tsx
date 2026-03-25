"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/shared/Card";
import { COUNTRY_OPTIONS } from "@/lib/calculator/market-data";
import {
  SLIDER_CONFIGS,
  type SimulatorState,
  type SliderConfig,
  CHARGER_TYPES,
} from "@/lib/calculator/types";

interface CalculatorFormProps {
  state: SimulatorState;
  onChange: (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

function parseAndValidate(
  text: string,
  config: SliderConfig
): { valid: boolean; value?: number } {
  const cleaned = text.replace(/[,%\s]/g, "");
  if (cleaned === "") return { valid: false };
  const num = parseFloat(cleaned);
  if (isNaN(num)) return { valid: false };
  const internal = config.fromDisplay(num);
  if (internal < config.min - 1e-9 || internal > config.max + 1e-9)
    return { valid: false };
  const snapped =
    Math.round((internal - config.min) / config.step) * config.step + config.min;
  const clamped = Math.min(config.max, Math.max(config.min, snapped));
  return { valid: true, value: clamped };
}

function SliderWithInput({
  config,
  value,
  onChange,
}: {
  config: SliderConfig;
  value: number;
  onChange: (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => void;
}) {
  const [localText, setLocalText] = useState(config.formatInput(value));
  const [isFocused, setIsFocused] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalText(config.formatInput(value));
      setIsInvalid(false);
    }
  }, [value, isFocused, config]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      setLocalText(text);
      const result = parseAndValidate(text, config);
      if (result.valid && result.value !== undefined) {
        setIsInvalid(false);
        onChange(config.field, result.value);
      } else {
        setIsInvalid(true);
      }
    },
    [config, onChange]
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setLocalText(config.formatInput(value));
    setIsInvalid(false);
  }, [config, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const direction = e.key === "ArrowUp" ? 1 : -1;
        const newInternal = value + direction * config.step;
        const clamped = Math.min(config.max, Math.max(config.min, newInternal));
        const snapped =
          Math.round((clamped - config.min) / config.step) * config.step + config.min;
        onChange(config.field, Math.min(config.max, Math.max(config.min, snapped)));
      }
    },
    [config, value, onChange]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-brand-text">{config.label}</label>
        <span className="text-sm font-semibold text-brand-ecredit tabular-nums">{config.format(value)}</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(e) => onChange(config.field, parseFloat(e.target.value))}
          className="flex-1 min-w-0"
        />
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="text"
            inputMode={config.suffix ? "decimal" : "numeric"}
            value={localText}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            aria-label={`${config.label} value`}
            aria-invalid={isInvalid || undefined}
            className={`w-[100px] px-2 py-1.5 text-sm text-right tabular-nums bg-brand-surface border rounded-lg transition-colors focus:outline-none focus:ring-2 text-brand-text ${
              isInvalid
                ? "border-red-400 focus:ring-red-400/15 focus:border-red-400"
                : "border-brand-border focus:ring-brand-ecredit/15 focus:border-brand-ecredit"
            }`}
          />
          {config.suffix && <span className="text-sm text-brand-muted">{config.suffix}</span>}
        </div>
      </div>
      <div className="flex justify-between mt-0.5 text-xs text-brand-muted">
        <span>{config.format(config.min)}</span>
        <span>{config.format(config.max)}</span>
      </div>
    </div>
  );
}

export function CalculatorForm({ state, onChange, onCalculate, isCalculating }: CalculatorFormProps) {
  return (
    <Card className="sticky top-16" padding="md">
      <h2 className="text-base font-semibold text-brand-text mb-5">Fleet Configuration</h2>

      <div className="space-y-5">
        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Market</label>
          <select
            value={state.country}
            onChange={(e) => onChange("country", e.target.value)}
            className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-ecredit/15 focus:border-brand-ecredit transition-colors"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Charger Type */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Charger Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {CHARGER_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => onChange("type", type)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  state.type === type
                    ? "bg-brand-ecredit text-brand-dark"
                    : "bg-brand-surface text-brand-muted hover:text-brand-text"
                }`}
              >
                {type === "public" ? "Public" : "Residential"}
              </button>
            ))}
          </div>
        </div>

        {/* Power */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Charger Power</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 0.0074, label: "7.4 kW" },
              { value: 0.011, label: "11 kW" },
              { value: 0.022, label: "22 kW" },
            ].map((power) => (
              <button
                key={power.value}
                onClick={() => onChange("powerMW", power.value)}
                className={`px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  state.powerMW === power.value
                    ? "bg-brand-ecredit text-brand-dark"
                    : "bg-brand-surface text-brand-muted hover:text-brand-text"
                }`}
              >
                {power.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        {SLIDER_CONFIGS.map((config) => (
          <SliderWithInput
            key={config.field}
            config={config}
            value={state[config.field] as number}
            onChange={onChange}
          />
        ))}

        {/* Horizon — 3 / 6 / 12 months (historical) */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Historical View</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[3, 6, 12].map((months) => (
              <button
                key={months}
                onClick={() => onChange("horizonMonths", months)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  state.horizonMonths === months
                    ? "bg-brand-ecredit text-brand-dark"
                    : "bg-brand-surface text-brand-muted hover:text-brand-text"
                }`}
              >
                {months} mo
              </button>
            ))}
          </div>
          <p className="text-xs text-brand-muted/60 mt-1">Based on historical prices, not a forecast</p>
        </div>

        {/* Calculate Button */}
        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className={`w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
            isCalculating
              ? "bg-brand-ecredit/30 text-brand-muted cursor-wait"
              : "bg-brand-ecredit text-brand-dark hover:brightness-110 hover:shadow-lg hover:shadow-brand-ecredit/20 active:scale-[0.98]"
          }`}
        >
          {isCalculating ? "Calculating..." : "Calculate Revenue"}
        </button>
      </div>
    </Card>
  );
}
