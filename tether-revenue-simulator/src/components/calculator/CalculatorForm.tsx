"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/shared/Card";
import { BiddingZoneMap } from "./BiddingZoneMap";
import { GoogleMapsLookup } from "./GoogleMapsLookup";
import {
  SLIDER_CONFIGS,
  type SimulatorState,
  type SliderConfig,
  type AdditionalCharger,
  type ChargerType,
  type PowerMW,
  CHARGER_TYPES,
} from "@/lib/calculator/types";

interface CalculatorFormProps {
  state: SimulatorState;
  onChange: (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => void;
  onCalculate?: () => void;
  isCalculating?: boolean;
}

const MAX_ADDITIONAL_CHARGERS = 4; // 1 primary + 4 additional = 5 total

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
// ChargerBankEditor — reusable editor for type / power / count triple
// ---------------------------------------------------------------------------

const AC_POWERS: { value: PowerMW; label: string }[] = [
  { value: 0.0074, label: "7.4 kW" },
  { value: 0.011, label: "11 kW" },
  { value: 0.022, label: "22 kW" },
];

const DC_POWERS: { value: PowerMW; label: string }[] = [
  { value: 0.05, label: "50 kW" },
  { value: 0.15, label: "150 kW" },
  { value: 0.35, label: "350 kW" },
];

interface ChargerBankValue {
  type: ChargerType;
  powerMW: number;
  chargers: number;
}

function ChargerBankEditor({
  title,
  value,
  onUpdate,
  onRemove,
  minChargers,
  maxChargers,
}: {
  title: string;
  value: ChargerBankValue;
  onUpdate: (patch: Partial<ChargerBankValue>) => void;
  onRemove?: () => void;
  minChargers: number;
  maxChargers: number;
}) {
  const [countText, setCountText] = useState(value.chargers.toLocaleString("en-US"));
  const [countFocused, setCountFocused] = useState(false);

  useEffect(() => {
    if (!countFocused) setCountText(value.chargers.toLocaleString("en-US"));
  }, [value.chargers, countFocused]);

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCountText(text);
    const cleaned = text.replace(/[,\s]/g, "");
    if (cleaned === "") return;
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return;
    const clamped = Math.min(maxChargers, Math.max(minChargers, num));
    onUpdate({ chargers: clamped });
  };

  return (
    <div className="rounded-lg border border-brand-border/70 bg-brand-light/40 p-3 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-brand-text uppercase tracking-wider">
          {title}
        </h3>
        {onRemove && (
          <button
            onClick={onRemove}
            type="button"
            className="text-xs text-brand-muted hover:text-brand-warm transition-colors"
            aria-label={`Remove ${title}`}
          >
            Remove
          </button>
        )}
      </div>

      {/* Charger Type */}
      <div>
        <label className="block text-xs font-medium text-brand-muted mb-1.5">
          Type
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {CHARGER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onUpdate({ type: t })}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                value.type === t
                  ? "bg-brand-primary text-white"
                  : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
              }`}
            >
              {t === "public" ? "Public" : "Residential"}
            </button>
          ))}
        </div>
      </div>

      {/* Power */}
      <div>
        <label className="block text-xs font-medium text-brand-muted mb-1.5">
          Power
        </label>
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {AC_POWERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onUpdate({ powerMW: p.value })}
                className={`px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  value.powerMW === p.value
                    ? "bg-brand-primary text-white"
                    : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {DC_POWERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onUpdate({ powerMW: p.value })}
                className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                  value.powerMW === p.value
                    ? "bg-brand-revenue text-white"
                    : "bg-brand-light text-brand-muted hover:bg-brand-subtle hover:text-brand-text"
                }`}
              >
                {p.label} DC
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charge Points count */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-brand-muted">
            Charge Points
          </label>
          <span className="text-sm font-semibold text-brand-primary tabular-nums">
            {value.chargers.toLocaleString("en-US")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={minChargers}
            max={maxChargers}
            step={1}
            value={value.chargers}
            onChange={(e) =>
              onUpdate({ chargers: parseInt(e.target.value, 10) })
            }
            className="flex-1 min-w-0"
          />
          <input
            type="text"
            inputMode="numeric"
            value={countText}
            onChange={handleCountChange}
            onFocus={(e) => {
              setCountFocused(true);
              e.target.select();
            }}
            onBlur={() => {
              setCountFocused(false);
              setCountText(value.chargers.toLocaleString("en-US"));
            }}
            aria-label={`${title} charge points`}
            className="w-[100px] px-2 py-1.5 text-sm text-right tabular-nums bg-brand-light border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/15 focus:border-brand-primary-light"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CalculatorForm
// ---------------------------------------------------------------------------

export function CalculatorForm({ state, onChange, onCalculate, isCalculating }: CalculatorFormProps) {
  // Sliders minus the "chargers" one — that's now handled inside each bank editor.
  const sharedSliders = SLIDER_CONFIGS.filter((c) => c.field !== "chargers");

  const additionalChargers = state.additionalChargers ?? [];

  const updateAdditional = (
    idx: number,
    patch: Partial<ChargerBankValue>
  ) => {
    const next = additionalChargers.map((bank, i) =>
      i === idx ? { ...bank, ...patch } : bank
    );
    onChange("additionalChargers", next);
  };

  const removeAdditional = (idx: number) => {
    const next = additionalChargers.filter((_, i) => i !== idx);
    onChange("additionalChargers", next);
  };

  const addAnother = () => {
    if (additionalChargers.length >= MAX_ADDITIONAL_CHARGERS) return;
    const newBank: AdditionalCharger = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `bank-${Date.now()}-${Math.random()}`,
      type: "public",
      powerMW: 0.022,
      chargers: 100,
    };
    onChange("additionalChargers", [...additionalChargers, newBank]);
  };

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

        {/* Charger banks — primary + additional */}
        <div className="space-y-3">
          <ChargerBankEditor
            title={additionalChargers.length > 0 ? "Charger 1" : "Chargers"}
            value={{
              type: state.type,
              powerMW: state.powerMW,
              chargers: state.chargers,
            }}
            onUpdate={(patch) => {
              if (patch.type !== undefined) onChange("type", patch.type);
              if (patch.powerMW !== undefined)
                onChange("powerMW", patch.powerMW);
              if (patch.chargers !== undefined)
                onChange("chargers", patch.chargers);
            }}
            minChargers={1}
            maxChargers={10000}
          />

          {additionalChargers.map((bank, idx) => (
            <ChargerBankEditor
              key={bank.id}
              title={`Charger ${idx + 2}`}
              value={{
                type: bank.type,
                powerMW: bank.powerMW,
                chargers: bank.chargers,
              }}
              onUpdate={(patch) => updateAdditional(idx, patch)}
              onRemove={() => removeAdditional(idx)}
              minChargers={1}
              maxChargers={10000}
            />
          ))}

          {additionalChargers.length < MAX_ADDITIONAL_CHARGERS && (
            <button
              type="button"
              onClick={addAnother}
              className="w-full py-2.5 rounded-lg border border-dashed border-brand-border text-sm font-medium text-brand-muted hover:text-brand-primary hover:border-brand-primary/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="text-base leading-none">+</span>
              Add another charger
            </button>
          )}
        </div>

        {/* Shared sliders (utilization, flex potential) */}
        {sharedSliders.map((config) => (
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
