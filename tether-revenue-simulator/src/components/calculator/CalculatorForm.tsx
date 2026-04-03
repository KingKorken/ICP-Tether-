"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/shared/Card";
import { BiddingZoneMap } from "./BiddingZoneMap";
import { GoogleMapsLookup } from "./GoogleMapsLookup";
import {
  SLIDER_CONFIGS,
  type SimulatorState,
  type SliderConfig,
  CHARGER_TYPES,
} from "@/lib/calculator/types";

interface CalculatorFormProps {
  state: SimulatorState;
  onChange: (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => void;
  onCalculate?: () => void;
  isCalculating?: boolean;
}

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

function parseAndValidate(
  text: string,
  config: SliderConfig
): { valid: boolean; value?: number } {
  // Strip commas, whitespace, and any trailing % sign
  const cleaned = text.replace(/[,%\s]/g, "");
  if (cleaned === "") return { valid: false };

  const num = parseFloat(cleaned);
  if (isNaN(num)) return { valid: false };

  // Convert from display value to internal value
  const internal = config.fromDisplay(num);

  // Range check (use small epsilon for floating-point comparison)
  if (internal < config.min - 1e-9 || internal > config.max + 1e-9)
    return { valid: false };

  // Snap to nearest step
  const snapped =
    Math.round((internal - config.min) / config.step) * config.step +
    config.min;

  // Clamp after snapping to avoid floating-point overshoot
  const clamped = Math.min(config.max, Math.max(config.min, snapped));

  return { valid: true, value: clamped };
}

// ---------------------------------------------------------------------------
// SliderWithInput — single slider + text input pair
// ---------------------------------------------------------------------------

function SliderWithInput({
  config,
  value,
  onChange,
}: {
  config: SliderConfig;
  value: number;
  onChange: (
    field: keyof SimulatorState,
    value: SimulatorState[keyof SimulatorState]
  ) => void;
}) {
  const [localText, setLocalText] = useState(config.formatInput(value));
  const [isFocused, setIsFocused] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  // Sync from parent state when not focused
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
    // Revert to last valid value (parent state is always valid)
    setLocalText(config.formatInput(value));
    setIsInvalid(false);
  }, [config, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
        return;
      }

      // Arrow key increment/decrement
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const direction = e.key === "ArrowUp" ? 1 : -1;
        const newInternal = value + direction * config.step;
        const clamped = Math.min(
          config.max,
          Math.max(config.min, newInternal)
        );
        const snapped =
          Math.round((clamped - config.min) / config.step) * config.step +
          config.min;
        onChange(config.field, Math.min(config.max, Math.max(config.min, snapped)));
      }
    },
    [config, value, onChange]
  );

  return (
    <div>
      {/* Label row — unchanged */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-brand-text">
          {config.label}
        </label>
        <span className="text-sm font-semibold text-brand-primary tabular-nums">
          {config.format(value)}
        </span>
      </div>

      {/* Slider + Input row */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(e) =>
            onChange(config.field, parseFloat(e.target.value))
          }
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
            className={`w-[100px] px-2 py-1.5 text-sm text-right tabular-nums bg-brand-light border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
              isInvalid
                ? "border-red-400 focus:ring-red-400/15 focus:border-red-400"
                : "border-brand-border focus:ring-brand-primary/15 focus:border-brand-primary-light"
            }`}
          />
          {config.suffix && (
            <span className="text-sm text-brand-muted">
              {config.suffix}
            </span>
          )}
        </div>
      </div>

      {/* Min/max labels — unchanged */}
      <div className="flex justify-between mt-0.5 text-xs text-brand-muted">
        <span>{config.format(config.min)}</span>
        <span>{config.format(config.max)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CalculatorForm
// ---------------------------------------------------------------------------

export function CalculatorForm({ state, onChange, onCalculate, isCalculating }: CalculatorFormProps) {
  return (
    <Card className="sticky top-16" padding="md">
      <h2 className="text-base font-semibold text-brand-text mb-5">
        Fleet Configuration
      </h2>

      <div className="space-y-5">
        {/* Electricity Market Map */}
        <div>
          <BiddingZoneMap
            selectedCountry={state.country}
            onChange={onChange}
          />
          <GoogleMapsLookup onChange={onChange} />
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
          <div className="space-y-1.5">
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
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { value: 0.05, label: "50 kW" },
                { value: 0.15, label: "150 kW" },
                { value: 0.35, label: "350 kW" },
              ].map((power) => (
                <button
                  key={power.value}
                  onClick={() => onChange("powerMW", power.value)}
                  className={`
                    px-2 py-2 rounded-md text-xs font-medium transition-colors
                    ${
                      state.powerMW === power.value
                        ? "bg-brand-revenue text-white"
                        : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
                    }
                  `}
                >
                  {power.label} DC
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sliders with Input Fields */}
        {SLIDER_CONFIGS.map((config) => (
          <SliderWithInput
            key={config.field}
            config={config}
            value={state[config.field] as number}
            onChange={onChange}
          />
        ))}

        {/* Horizon Toggle */}
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">
            Projection Horizon
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[3, 6, 12].map((months) => (
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
                {months} mo
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <AdvancedSettings state={state} onChange={onChange} />

      {/* Calculate Button */}
      {onCalculate && (
        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className={`
            mt-6 w-full py-3 rounded-lg text-sm font-semibold transition-colors
            ${
              isCalculating
                ? "bg-brand-subtle text-brand-muted cursor-not-allowed"
                : "bg-brand-primary text-white hover:bg-brand-primary-light active:bg-brand-primary"
            }
          `}
        >
          {isCalculating ? "Calculating..." : "Calculate Revenue"}
        </button>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Advanced Settings — collapsible section
// ---------------------------------------------------------------------------

function AdvancedSettings({
  state,
  onChange,
}: {
  state: SimulatorState;
  onChange: (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleClass = (isActive: boolean) => `
    px-3 py-2 rounded-md text-sm font-medium transition-colors
    ${isActive
      ? "bg-brand-primary text-white"
      : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
    }
  `;

  return (
    <div className="border-t border-brand-border/50 pt-4 mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-primary transition-colors w-full"
        type="button"
      >
        <span className="text-xs">{isOpen ? "\u25BE" : "\u25B8"}</span>
        <span className="font-medium">Advanced Settings</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Smart Charging */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Smart Charging Capable
            </label>
            <p className="text-xs text-brand-muted mb-2">
              Does your charger support OCPP smart charging? Required for grid flexibility revenue.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onChange("smartCharging", true)}
                className={toggleClass(state.smartCharging !== false)}
              >
                Yes
              </button>
              <button
                onClick={() => onChange("smartCharging", false)}
                className={toggleClass(state.smartCharging === false)}
              >
                No
              </button>
            </div>
            {state.smartCharging === false && (
              <p className="text-xs text-brand-warm mt-2">
                Without smart charging, grid flexibility revenue is not available. Only e-credit revenue will be calculated.
              </p>
            )}
          </div>

          {/* Grid Connection */}
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1.5">
              Grid Connection
            </label>
            <p className="text-xs text-brand-muted mb-2">
              Single-phase connections limit flexibility power to 7.4 kW per charger.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onChange("gridConnection", "three_phase")}
                className={toggleClass(state.gridConnection !== "single_phase")}
              >
                Three Phase
              </button>
              <button
                onClick={() => onChange("gridConnection", "single_phase")}
                className={toggleClass(state.gridConnection === "single_phase")}
              >
                Single Phase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
