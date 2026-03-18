---
title: "feat: Add number input fields to calculator sliders"
type: feat
status: completed
date: 2026-03-18
origin: docs/brainstorms/2026-03-18-slider-number-inputs-brainstorm.md
---

# feat: Add Number Input Fields to Calculator Sliders

## Overview

Add a text input field to the right of each of the three calculator sliders so users can type exact values instead of dragging the slider. The slider and input stay bidirectionally synced. This eliminates friction for users who already know their exact numbers (e.g. "I have 2,347 charge points").

(see brainstorm: `docs/brainstorms/2026-03-18-slider-number-inputs-brainstorm.md`)

## Proposed Solution

Add a compact `<input type="text">` beside each range slider, sharing a flex row. The input maintains **local state** that syncs to the parent `SimulatorState` when the value is valid. Invalid values show a red border but don't propagate to the slider or charts. On blur with an invalid value, the input reverts to the last valid value.

### Layout Change

```
BEFORE:
┌─────────────────────────────────────┐
│ Number of Charge Points       500   │  <- label + formatted value
│ ═══════════●════════════════════    │  <- slider (w-full)
│ 10                         10,000   │  <- min/max labels
└─────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────┐
│ Number of Charge Points       500   │  <- label + formatted value (unchanged)
│ ══════════●══════════════  [ 500 ]  │  <- slider + input field
│ 10                         10,000   │  <- min/max labels
└─────────────────────────────────────┘

For percentage sliders:
┌─────────────────────────────────────┐
│ Average Utilization Rate      15%   │
│ ══════════●══════════════  [ 15 ]%  │  <- input + "%" suffix outside input
│ 5%                            40%   │
└─────────────────────────────────────┘
```

## Technical Approach

### Architecture: Local State Pattern

The text input maintains its own `useState` separate from the parent `SimulatorState`. This resolves the conflict between "real-time updates" and "don't update on invalid values" — the input can show intermediate typing states (like "1" on the way to "1500") without pushing invalid values to the slider or charts.

**Sync rules:**
- **Slider -> Input:** When `state[field]` changes (from slider drag or external update), update the local input state — BUT only if the input is not currently focused (user's typing takes precedence).
- **Input -> State:** On every keystroke, parse the input. If the parsed value is valid (in range, numeric), immediately call `onChange(field, value)` to update parent state, slider, and charts. If invalid, keep the local state but don't propagate.
- **On blur with invalid value:** Revert the input text to the last valid committed value.
- **On blur with valid value:** Commit the value and re-format the display (e.g. add commas for chargers).
- **On Enter:** Same behavior as blur — commit valid value, revert invalid value.

### Files to Modify

1. **`src/components/calculator/CalculatorForm.tsx`** (primary change)
   - Modify the `SLIDER_CONFIGS.map()` loop (lines 93-119) to add the text input beside the range input
   - Extract the slider+input pair into a new `SliderWithInput` inline component or keep it inline

2. **`src/lib/calculator/types.ts`** (minor addition)
   - Add a `parse` function to `SliderConfig` interface — the inverse of `format`, converting display string to raw number
   - Add an optional `suffix` field for the "%" display
   - Add `inputMin` / `inputMax` fields for display-value ranges (e.g. 5-40 for utilization display vs 0.05-0.40 internal)

3. **`src/app/globals.css`** (minor addition)
   - Add error state styling for the input (red border, light red background)
   - Hide any default browser styling on the text input

### Slider Config Extension

```typescript
// In types.ts — extend SliderConfig
export interface SliderConfig {
  field: keyof SimulatorState;
  label: string;
  min: number;       // internal min (e.g. 0.05)
  max: number;       // internal max (e.g. 0.40)
  step: number;      // internal step (e.g. 0.01)
  format: (value: number) => string;
  // NEW fields:
  toDisplay: (value: number) => number;    // internal -> display (e.g. 0.15 -> 15)
  fromDisplay: (display: number) => number; // display -> internal (e.g. 15 -> 0.15)
  displayMin: number;   // display min (e.g. 5)
  displayMax: number;   // display max (e.g. 40)
  displayStep: number;  // display step (e.g. 1)
  suffix?: string;      // "%" for percentage fields
  formatInput: (value: number) => string;  // format for the input field (no suffix)
}
```

Updated configs:

```typescript
{
  field: "chargers",
  label: "Number of Charge Points",
  min: 10, max: 10000, step: 10,
  format: (v) => v.toLocaleString("en-US"),
  toDisplay: (v) => v,
  fromDisplay: (d) => d,
  displayMin: 10, displayMax: 10000, displayStep: 10,
  formatInput: (v) => v.toLocaleString("en-US"),
},
{
  field: "utilization",
  label: "Average Utilization Rate",
  min: 0.05, max: 0.40, step: 0.01,
  format: (v) => `${Math.round(v * 100)}%`,
  toDisplay: (v) => Math.round(v * 100),
  fromDisplay: (d) => d / 100,
  displayMin: 5, displayMax: 40, displayStep: 1,
  suffix: "%",
  formatInput: (v) => String(Math.round(v * 100)),
},
{
  field: "flexPotential",
  label: "Flexibility Potential",
  min: 0.20, max: 0.80, step: 0.05,
  format: (v) => `${Math.round(v * 100)}%`,
  toDisplay: (v) => Math.round(v * 100),
  fromDisplay: (d) => d / 100,
  displayMin: 20, displayMax: 80, displayStep: 5,
  suffix: "%",
  formatInput: (v) => String(Math.round(v * 100)),
}
```

### Input Component Behavior (in CalculatorForm.tsx)

Within the `SLIDER_CONFIGS.map()` loop, add the input beside the range slider:

```tsx
{SLIDER_CONFIGS.map((config) => {
  // Local state for the text input
  const displayValue = config.toDisplay(state[config.field] as number);
  // ... local state management with useState ...

  return (
    <div key={config.field}>
      {/* Label row — unchanged */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-brand-text">
          {config.label}
        </label>
        <span className="text-sm font-semibold text-brand-primary tabular-nums">
          {config.format(state[config.field] as number)}
        </span>
      </div>

      {/* Slider + Input row — NEW layout */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={state[config.field] as number}
          onChange={(e) => onChange(config.field, parseFloat(e.target.value))}
          className="flex-1 min-w-0"
        />
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode={config.suffix ? "decimal" : "numeric"}
            value={localInputValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            aria-label={`${config.label} value`}
            aria-invalid={isInvalid}
            className={`w-[100px] px-2 py-1.5 text-sm text-right tabular-nums
              bg-brand-light border rounded-lg transition-colors
              focus:outline-none focus:ring-2
              ${isInvalid
                ? 'border-red-400 focus:ring-red-400/15 focus:border-red-400'
                : 'border-brand-border focus:ring-brand-primary/15 focus:border-brand-primary-light'
              }`}
          />
          {config.suffix && (
            <span className="text-sm text-brand-muted">{config.suffix}</span>
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
})}
```

Since hooks can't be called inside a `.map()`, the slider+input pair should be extracted into a small component:

```tsx
// New component within CalculatorForm.tsx or as a separate file
function SliderWithInput({ config, value, onChange }: {
  config: SliderConfig;
  value: number;
  onChange: (field: keyof SimulatorState, value: SimulatorState[keyof SimulatorState]) => void;
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

  // ... event handlers ...
}
```

### Validation & Parsing Logic

```typescript
function parseAndValidate(text: string, config: SliderConfig): { valid: boolean; value?: number } {
  // Strip commas and whitespace
  const cleaned = text.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);

  if (isNaN(num)) return { valid: false };

  // Convert from display value to internal value
  const internal = config.fromDisplay(num);

  // Range check against internal min/max
  if (internal < config.min || internal > config.max) return { valid: false };

  // Snap to nearest step
  const snapped = Math.round(internal / config.step) * config.step;

  return { valid: true, value: snapped };
}
```

### Edge Case Handling

| Scenario | Behavior |
|----------|----------|
| User types "1" on the way to "1500" | Input shows "1", red border (below min), slider/charts unchanged |
| User types "abc" | Input shows "abc", red border, slider/charts unchanged |
| User clears input (empty) | Input shows "", red border, slider/charts unchanged |
| User blurs with invalid value | Input reverts to last valid formatted value, red border removed |
| User blurs with valid value | Value committed, input re-formatted (commas added for chargers) |
| User presses Enter with valid value | Same as blur — commit and re-format |
| User pastes "1,500" | Commas stripped during parsing, value 1500 accepted |
| User pastes "25%" | "%" stripped during parsing, value 25 accepted for percentage fields |
| User types off-step value (e.g. "155") | Snapped to nearest step (160) on commit |
| User focuses input | All text selected for easy replacement |
| Slider dragged while input is focused | Input not updated (user's typing takes precedence) |
| Slider dragged while input is blurred | Input updates to show new slider value |
| Arrow Up/Down in input | Increment/decrement by display step |

### Styling

**Input field classes (matching existing select pattern from `CalculatorForm.tsx:26-35`):**
- Base: `bg-brand-light border border-brand-border rounded-lg text-sm text-brand-text`
- Focus: `focus:outline-none focus:ring-2 focus:ring-brand-primary/15 focus:border-brand-primary-light`
- Error: `border-red-400 focus:ring-red-400/15` (using Tailwind red, not brand-warm, for clear error signaling)
- Size: `w-[100px] px-2 py-1.5` (compact to fit sidebar)
- Text: `text-right tabular-nums` (right-aligned numbers with stable digit widths)

**No changes to slider styling.** The slider gets `flex-1 min-w-0` instead of `w-full` to share space with the input.

### Accessibility

- `aria-label` on each text input: `"{config.label} value"`
- `aria-invalid="true"` when showing red error state
- `inputmode="numeric"` for chargers, `inputmode="decimal"` for percentage fields
- Tab order: natural DOM order — Slider 1 -> Input 1 -> Slider 2 -> Input 2 -> Slider 3 -> Input 3
- Arrow key increment/decrement: Up adds `displayStep`, Down subtracts `displayStep`
- Select all text on focus for easy full-value replacement

### Responsive Behavior

- At `lg` breakpoint (~330px sidebar): slider gets `flex-1`, input stays `w-[100px]` — slider will be approximately 200px which is usable
- Below `lg` breakpoint (full width): plenty of room, same layout works well
- No layout changes needed — the flex row naturally handles width distribution

## Acceptance Criteria

- [x] Each of the 3 sliders has a text input field to its right
- [x] Typing a valid value in the input updates the slider position and chart results
- [x] Dragging the slider updates the text input value
- [x] The existing formatted value label above each slider is preserved and unchanged
- [x] Percentage inputs show a "%" suffix outside the input element
- [x] Charger input accepts and strips commas (e.g. pasting "1,500")
- [x] Out-of-range values show a red border on the input without updating slider/charts
- [x] Blurring with an invalid value reverts the input to the last valid value
- [x] Pressing Enter commits a valid value (same as blur behavior)
- [x] Text is selected on focus for easy replacement
- [x] Off-step values are snapped to the nearest step on commit
- [x] Input has `aria-label` and `aria-invalid` attributes
- [x] Input uses `inputmode` for appropriate mobile keyboard
- [x] Layout works at the `lg` breakpoint (~330px sidebar width)
- [x] Analytics events fire only on committed values, not on every keystroke

## Implementation Steps

### Step 1: Extend SliderConfig type

**File:** `src/lib/calculator/types.ts`

Add `toDisplay`, `fromDisplay`, `displayMin`, `displayMax`, `displayStep`, `suffix`, and `formatInput` to the `SliderConfig` interface and update all three config entries.

### Step 2: Create SliderWithInput component

**File:** `src/components/calculator/CalculatorForm.tsx`

Extract the slider rendering into a `SliderWithInput` component that:
- Accepts `config`, `value`, and `onChange` props
- Manages local input state with `useState`
- Syncs from parent state via `useEffect` (when not focused)
- Handles text change, blur, focus, and keydown events
- Renders the slider + input in a flex row

### Step 3: Add validation and parsing

**File:** `src/components/calculator/CalculatorForm.tsx` (inline or utility function)

Implement `parseAndValidate` that strips formatting, parses to number, checks range, and snaps to step.

### Step 4: Add error state styling

**File:** `src/app/globals.css` (if needed, otherwise Tailwind classes suffice)

Red border and focus ring for invalid state. The Tailwind classes `border-red-400 focus:ring-red-400/15` should work without custom CSS.

### Step 5: Update the map loop

**File:** `src/components/calculator/CalculatorForm.tsx`

Replace the inline slider rendering in the `.map()` with `<SliderWithInput>` component calls.

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-18-slider-number-inputs-brainstorm.md](docs/brainstorms/2026-03-18-slider-number-inputs-brainstorm.md) — Key decisions carried forward: keep both value label and input, show "%" suffix outside input, red highlight for out-of-range values, medium input width, real-time instant updates.

### Internal References

- Calculator form component: `src/components/calculator/CalculatorForm.tsx:93-119` (slider loop)
- Slider configs and types: `src/lib/calculator/types.ts:93-127`
- Simulator state and Zod schema: `src/lib/calculator/types.ts:25-38`
- Input styling pattern (select): `src/components/calculator/CalculatorForm.tsx:26-35`
- Custom range slider CSS: `src/app/globals.css:86-136`
- SimulatorClient state management: `src/app/(simulator)/sim/t/[token]/SimulatorClient.tsx:135-156`
- Design tokens: `src/app/globals.css:4-28`
