"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { COUNTRY_OPTIONS } from "@/lib/calculator/market-data";
import {
  type ChargerGroup,
  type ChargerType,
  type Country,
  CHARGER_TYPES,
} from "@/lib/calculator/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CalculatorFormProps {
  configs: ChargerGroup[];
  country: Country;
  horizonMonths: number;
  onConfigsChange: (configs: ChargerGroup[]) => void;
  onCountryChange: (country: Country) => void;
  onHorizonChange: (months: number) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

// ---------------------------------------------------------------------------
// Power label helper
// ---------------------------------------------------------------------------

const POWER_OPTS = [
  { value: 0.0074, label: "7.4 kW" },
  { value: 0.011, label: "11 kW" },
  { value: 0.022, label: "22 kW" },
] as const;

function powerLabel(mw: number): string {
  return POWER_OPTS.find((p) => Math.abs(p.value - mw) < 0.0001)?.label ?? `${mw * 1000} kW`;
}

// ---------------------------------------------------------------------------
// Single-config editor (inline, not a modal)
// ---------------------------------------------------------------------------

function ConfigEditor({
  config,
  index,
  onChange,
  onSave,
  onCancel,
}: {
  config: ChargerGroup;
  index: number;
  onChange: (updated: ChargerGroup) => void;
  onSave: () => void;
  onCancel: (() => void) | null;
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
          <button
            onClick={onCancel}
            className="text-xs text-brand-muted hover:text-brand-text transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Charger Type */}
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
                  : "bg-brand-surface text-brand-muted hover:text-brand-text"
              }`}
            >
              {type === "public" ? "Public" : "Residential"}
            </button>
          ))}
        </div>
      </div>

      {/* Charger Power */}
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
                  : "bg-brand-surface text-brand-muted hover:text-brand-text"
              }`}
            >
              {power.label}
            </button>
          ))}
        </div>
      </div>

      {/* Number of Chargers */}
      <SliderField
        label="Number of Chargers"
        value={config.chargers}
        min={10}
        max={10000}
        step={10}
        format={(v) => v.toLocaleString("en-US")}
        onChange={(v) => update("chargers", v)}
      />

      {/* Utilization */}
      <SliderField
        label="Utilization Rate"
        value={config.utilization}
        min={0.05}
        max={0.40}
        step={0.01}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => update("utilization", v)}
      />

      {/* Flexibility */}
      <SliderField
        label="Flexibility Potential"
        value={config.flexPotential}
        min={0.20}
        max={0.80}
        step={0.05}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => update("flexPotential", v)}
      />

      <button
        onClick={onSave}
        className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand-ecredit/15 text-brand-ecredit border border-brand-ecredit/25 hover:bg-brand-ecredit/25 transition-colors"
      >
        Save Configuration
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Compact slider (simpler than the original — just range + value display)
// ---------------------------------------------------------------------------

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-brand-text">{label}</label>
        <span className="text-sm font-semibold text-brand-ecredit tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-brand-muted mt-0.5">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saved-config summary row
// ---------------------------------------------------------------------------

function ConfigRow({
  config,
  index,
  onEdit,
  onRemove,
  canRemove,
}: {
  config: ChargerGroup;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-surface border border-brand-border/40"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-text truncate">
          Config {index + 1}: {config.chargers.toLocaleString()} {config.type === "public" ? "Public" : "Residential"}
        </p>
        <p className="text-xs text-brand-muted">
          {powerLabel(config.powerMW)} &middot; {Math.round(config.utilization * 100)}% util &middot; {Math.round(config.flexPotential * 100)}% flex
        </p>
      </div>

      {/* Edit */}
      <button
        onClick={onEdit}
        aria-label="Edit configuration"
        className="p-1.5 rounded-md text-brand-muted hover:text-brand-ecredit hover:bg-brand-ecredit/10 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

      {/* Remove */}
      {canRemove && (
        <button
          onClick={onRemove}
          aria-label="Remove configuration"
          className="p-1.5 rounded-md text-brand-muted hover:text-brand-warm hover:bg-brand-warm/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main CalculatorForm
// ---------------------------------------------------------------------------

let nextConfigId = 1;

export function CalculatorForm({
  configs,
  country,
  horizonMonths,
  onConfigsChange,
  onCountryChange,
  onHorizonChange,
  onCalculate,
  isCalculating,
}: CalculatorFormProps) {
  // Which config is currently being edited (index), or "new" for a fresh one, or null for sidebar view
  const [editingIndex, setEditingIndex] = useState<number | "new" | null>(
    configs.length === 0 ? "new" : null
  );
  const [draftConfig, setDraftConfig] = useState<ChargerGroup>({
    id: 0,
    chargers: 500,
    powerMW: 0.011,
    utilization: 0.15,
    flexPotential: 0.50,
    type: "public",
  });

  // When we start editing, populate the draft
  const startEdit = useCallback((index: number) => {
    setDraftConfig({ ...configs[index] });
    setEditingIndex(index);
  }, [configs]);

  const startNew = useCallback(() => {
    setDraftConfig({
      id: nextConfigId++,
      chargers: 500,
      powerMW: 0.011,
      utilization: 0.15,
      flexPotential: 0.50,
      type: "public",
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

  const removeConfig = useCallback(
    (index: number) => {
      onConfigsChange(configs.filter((_, i) => i !== index));
      if (editingIndex === index) setEditingIndex(null);
    },
    [configs, onConfigsChange, editingIndex]
  );

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
  }, []);

  // If all configs were removed, open new editor
  useEffect(() => {
    if (configs.length === 0 && editingIndex === null) {
      startNew();
    }
  }, [configs.length, editingIndex, startNew]);

  const isEditing = editingIndex !== null;

  return (
    <Card className="sticky top-16" padding="md">
      {/* Global settings (always visible) */}
      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Market</label>
          <select
            value={country}
            onChange={(e) => onCountryChange(e.target.value as Country)}
            className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-ecredit/15 focus:border-brand-ecredit transition-colors"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-text mb-1.5">Historical View</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[3, 6, 12].map((months) => (
              <button
                key={months}
                onClick={() => onHorizonChange(months)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  horizonMonths === months
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
      </div>

      {/* Divider */}
      <div className="border-t border-brand-border/40 mb-4" />

      {/* Saved configurations list */}
      <AnimatePresence mode="popLayout">
        {!isEditing && configs.length > 0 && (
          <motion.div
            key="sidebar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 mb-4"
          >
            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
              Charger Configurations ({configs.length})
            </p>
            {configs.map((cfg, i) => (
              <ConfigRow
                key={cfg.id}
                config={cfg}
                index={i}
                onEdit={() => startEdit(i)}
                onRemove={() => removeConfig(i)}
                canRemove={configs.length > 1}
              />
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

      {/* Add button (only visible when not editing) */}
      {!isEditing && (
        <button
          onClick={startNew}
          className="w-full py-2.5 mb-4 rounded-lg text-sm font-semibold border-2 border-dashed border-brand-ecredit/25 text-brand-ecredit hover:bg-brand-ecredit/5 hover:border-brand-ecredit/40 transition-colors"
        >
          + Add different chargers
        </button>
      )}

      {/* Calculate button (always visible) */}
      {!isEditing && (
        <button
          onClick={onCalculate}
          disabled={isCalculating || configs.length === 0}
          className={`w-full py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
            isCalculating
              ? "bg-brand-ecredit/30 text-brand-muted cursor-wait"
              : configs.length === 0
              ? "bg-brand-surface text-brand-muted cursor-not-allowed"
              : "bg-brand-ecredit text-brand-dark hover:brightness-110 hover:shadow-lg hover:shadow-brand-ecredit/20 active:scale-[0.98]"
          }`}
        >
          {isCalculating ? "Calculating..." : "Calculate Revenue"}
        </button>
      )}
    </Card>
  );
}
