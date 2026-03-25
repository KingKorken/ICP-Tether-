"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { COUNTRY_OPTIONS } from "@/lib/calculator/market-data";
import { calculateGroupAnnualRevenue } from "@/lib/calculator/engine";
import { formatEur } from "@/lib/utils/formatter";
import {
  type ChargerGroup,
  type Country,
  CHARGER_TYPES,
} from "@/lib/calculator/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CalculatorFormProps {
  configs: ChargerGroup[];
  horizonMonths: number;
  onConfigsChange: (configs: ChargerGroup[]) => void;
  onHorizonChange: (months: number) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const POWER_OPTS = [
  { value: 0.0074, label: "7.4 kW" },
  { value: 0.011, label: "11 kW" },
  { value: 0.022, label: "22 kW" },
] as const;

function powerLabel(mw: number): string {
  return POWER_OPTS.find((p) => Math.abs(p.value - mw) < 0.0001)?.label ?? `${mw * 1000} kW`;
}

function countryLabel(c: Country): string {
  return COUNTRY_OPTIONS.find((o) => o.value === c)?.label ?? c;
}

// ---------------------------------------------------------------------------
// Dual-Input Slider — range + synced text input with validation
// ---------------------------------------------------------------------------

function DualSlider({
  label,
  value,
  min,
  max,
  step,
  displayFn,
  parseFn,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Format the internal value for display in the text input (e.g. 0.15 → "15") */
  displayFn: (v: number) => string;
  /** Parse the text input back to internal value (e.g. "15" → 0.15). Return NaN for invalid. */
  parseFn: (text: string) => number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const [textValue, setTextValue] = useState(displayFn(value));
  const [isFocused, setIsFocused] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync text from external value changes (when not focused)
  useEffect(() => {
    if (!isFocused) {
      setTextValue(displayFn(value));
      setIsInvalid(false);
    }
  }, [value, isFocused, displayFn]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    onChange(v);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextValue(raw);

    const cleaned = raw.replace(/[,%\s]/g, "");
    if (cleaned === "") { setIsInvalid(true); return; }

    const parsed = parseFn(cleaned);
    if (isNaN(parsed) || parsed < min || parsed > max) {
      setIsInvalid(true);
      return;
    }

    // Snap to nearest step
    const snapped = Math.round((parsed - min) / step) * step + min;
    const clamped = Math.min(max, Math.max(min, snapped));
    setIsInvalid(false);
    onChange(clamped);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTextValue(displayFn(value));
    setIsInvalid(false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { inputRef.current?.blur(); return; }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dir = e.key === "ArrowUp" ? 1 : -1;
      const next = Math.min(max, Math.max(min, value + dir * step));
      onChange(Math.round((next - min) / step) * step + min);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-brand-text">{label}</label>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="flex-1 min-w-0"
        />
        <div className="flex items-center gap-1 shrink-0">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={textValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            aria-label={`${label} value`}
            aria-invalid={isInvalid || undefined}
            className={`
              w-20 px-2.5 py-1.5 text-sm text-right tabular-nums rounded-lg
              bg-brand-dark border transition-colors focus:outline-none focus:ring-2
              ${isInvalid
                ? "border-red-500/60 focus:ring-red-500/20 text-red-400"
                : "border-brand-border text-brand-ecredit focus:ring-brand-ecredit/20 focus:border-brand-ecredit"
              }
            `}
          />
          {suffix && <span className="text-xs text-brand-muted font-medium">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config Editor
// ---------------------------------------------------------------------------

function ConfigEditor({
  config, index, onChange, onSave, onCancel,
}: {
  config: ChargerGroup; index: number;
  onChange: (updated: ChargerGroup) => void;
  onSave: () => void; onCancel: (() => void) | null;
}) {
  const update = <K extends keyof ChargerGroup>(field: K, value: ChargerGroup[K]) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-ecredit uppercase tracking-wider">
          Configuration {index + 1}
        </h3>
        {onCancel && (
          <button onClick={onCancel} className="text-xs text-brand-muted hover:text-brand-text transition-colors">
            Cancel
          </button>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-brand-text mb-1.5">Location</label>
        <select
          value={config.country}
          onChange={(e) => update("country", e.target.value as Country)}
          className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-ecredit/15 focus:border-brand-ecredit transition-colors"
        >
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-brand-text mb-1.5">Charger Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {CHARGER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => update("type", type)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                config.type === type
                  ? "bg-brand-ecredit text-brand-dark"
                  : "bg-brand-dark text-brand-muted border border-brand-border hover:text-brand-text"
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
          {POWER_OPTS.map((power) => (
            <button
              key={power.value}
              onClick={() => update("powerMW", power.value)}
              className={`px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                Math.abs(config.powerMW - power.value) < 0.0001
                  ? "bg-brand-ecredit text-brand-dark"
                  : "bg-brand-dark text-brand-muted border border-brand-border hover:text-brand-text"
              }`}
            >
              {power.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dual-input sliders */}
      <DualSlider
        label="Number of Chargers"
        value={config.chargers}
        min={10} max={10000} step={10}
        displayFn={(v) => v.toLocaleString("en-US")}
        parseFn={(t) => { const n = parseInt(t.replace(/,/g, ""), 10); return isNaN(n) || n < 0 ? NaN : n; }}
        onChange={(v) => update("chargers", v)}
      />

      <DualSlider
        label="Utilization Rate"
        value={config.utilization}
        min={0.05} max={0.40} step={0.01}
        displayFn={(v) => String(Math.round(v * 100))}
        parseFn={(t) => { const n = parseFloat(t); return isNaN(n) || n < 0 ? NaN : n / 100; }}
        suffix="%"
        onChange={(v) => update("utilization", v)}
      />

      <DualSlider
        label="Flexibility Potential"
        value={config.flexPotential}
        min={0.20} max={0.80} step={0.05}
        displayFn={(v) => String(Math.round(v * 100))}
        parseFn={(t) => { const n = parseFloat(t); return isNaN(n) || n < 0 ? NaN : n / 100; }}
        suffix="%"
        onChange={(v) => update("flexPotential", v)}
      />

      <button onClick={onSave} className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand-ecredit/15 text-brand-ecredit border border-brand-ecredit/25 hover:bg-brand-ecredit/25 transition-colors">
        Save Configuration
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Value-First Sidebar Row — revenue is the headline
// ---------------------------------------------------------------------------

function ConfigRow({ config, index, onEdit, onRemove, canRemove }: {
  config: ChargerGroup; index: number; onEdit: () => void;
  onRemove: () => void; canRemove: boolean;
}) {
  const annualRevenue = calculateGroupAnnualRevenue(config);
  const monthlyRevenue = annualRevenue / 12;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="px-3.5 py-3 rounded-lg bg-brand-dark border border-brand-border/40"
    >
      {/* Revenue — the headline */}
      <div className="flex items-start justify-between mb-1">
        <p className="text-lg font-bold text-brand-ecredit tabular-nums leading-tight">
          +{formatEur(monthlyRevenue)}<span className="text-xs font-medium text-brand-muted">/mo</span>
        </p>
        <div className="flex items-center gap-1 shrink-0 -mt-0.5">
          <button onClick={onEdit} aria-label="Edit" className="p-1.5 rounded-md text-brand-muted hover:text-brand-ecredit hover:bg-brand-ecredit/10 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {canRemove && (
            <button onClick={onRemove} aria-label="Delete" className="p-1.5 rounded-md text-brand-muted hover:text-brand-warm hover:bg-brand-warm/10 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* Context line */}
      <p className="text-xs text-brand-muted leading-relaxed">
        {countryLabel(config.country)} &middot; {config.chargers.toLocaleString()} {config.type === "public" ? "Public" : "Residential"} &middot; {powerLabel(config.powerMW)}
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main CalculatorForm
// ---------------------------------------------------------------------------

let nextConfigId = 1;

export function CalculatorForm({
  configs, horizonMonths, onConfigsChange, onHorizonChange, onCalculate, isCalculating,
}: CalculatorFormProps) {
  const [editingIndex, setEditingIndex] = useState<number | "new" | null>(
    configs.length === 0 ? "new" : null
  );
  const [draftConfig, setDraftConfig] = useState<ChargerGroup>({
    id: 0, chargers: 500, powerMW: 0.011, utilization: 0.15, flexPotential: 0.50, type: "public", country: "sweden",
  });

  const startEdit = useCallback((index: number) => {
    setDraftConfig({ ...configs[index] });
    setEditingIndex(index);
  }, [configs]);

  const startNew = useCallback(() => {
    setDraftConfig({
      id: nextConfigId++, chargers: 500, powerMW: 0.011, utilization: 0.15, flexPotential: 0.50, type: "public", country: "sweden",
    });
    setEditingIndex("new");
  }, []);

  const saveConfig = useCallback(() => {
    if (editingIndex === "new") {
      onConfigsChange([...configs, draftConfig]);
    } else if (typeof editingIndex === "number") {
      const updated = [...configs];
      updated[editingIndex] = draftConfig;
      onConfigsChange(updated);
    }
    setEditingIndex(null);
  }, [editingIndex, draftConfig, configs, onConfigsChange]);

  const removeConfig = useCallback((index: number) => {
    onConfigsChange(configs.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }, [configs, onConfigsChange, editingIndex]);

  const cancelEdit = useCallback(() => { setEditingIndex(null); }, []);

  useEffect(() => {
    if (configs.length === 0 && editingIndex === null) startNew();
  }, [configs.length, editingIndex, startNew]);

  const isEditing = editingIndex !== null;

  return (
    <Card className="sticky top-16" padding="md">
      {/* Timeframe zoom */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-brand-text mb-1.5">Timeframe</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[3, 6, 12].map((months) => (
            <button
              key={months}
              onClick={() => onHorizonChange(months)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                horizonMonths === months
                  ? "bg-brand-ecredit text-brand-dark"
                  : "bg-brand-dark text-brand-muted border border-brand-border hover:text-brand-text"
              }`}
            >
              {months} months
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-brand-border/40 mb-4" />

      {/* Value-first sidebar */}
      <AnimatePresence mode="popLayout">
        {!isEditing && configs.length > 0 && (
          <motion.div key="sidebar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
              Your Chargers ({configs.length})
            </p>
            {configs.map((cfg, i) => (
              <ConfigRow key={cfg.id} config={cfg} index={i} onEdit={() => startEdit(i)} onRemove={() => removeConfig(i)} canRemove={configs.length > 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <AnimatePresence mode="wait">
        {isEditing && (
          <ConfigEditor
            key={editingIndex === "new" ? "new" : `edit-${editingIndex}`}
            config={draftConfig}
            index={editingIndex === "new" ? configs.length : editingIndex}
            onChange={setDraftConfig}
            onSave={saveConfig}
            onCancel={configs.length > 0 ? cancelEdit : null}
          />
        )}
      </AnimatePresence>

      {!isEditing && (
        <button onClick={startNew} className="w-full py-2.5 mb-4 rounded-lg text-sm font-semibold border-2 border-dashed border-brand-ecredit/25 text-brand-ecredit hover:bg-brand-ecredit/5 hover:border-brand-ecredit/40 transition-colors">
          + Add different chargers
        </button>
      )}

      {!isEditing && (
        <button
          onClick={onCalculate}
          disabled={isCalculating || configs.length === 0}
          className={`w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
            isCalculating ? "bg-brand-ecredit/30 text-brand-muted cursor-wait"
              : configs.length === 0 ? "bg-brand-surface text-brand-muted cursor-not-allowed"
              : "bg-brand-ecredit text-brand-dark hover:brightness-110 hover:shadow-lg hover:shadow-brand-ecredit/20 active:scale-[0.98]"
          }`}
        >
          {isCalculating ? "Calculating..." : "Calculate Revenue"}
        </button>
      )}
    </Card>
  );
}
