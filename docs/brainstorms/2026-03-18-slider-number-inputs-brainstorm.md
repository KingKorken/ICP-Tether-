# Brainstorm: Number Input Fields for Calculator Sliders

**Date:** 2026-03-18
**Status:** Complete

## What We're Building

Add a number input field to the right of each of the three calculator sliders (Number of Charge Points, Average Utilization Rate, Flexibility Potential) so users can type exact values instead of dragging the slider. The slider and input stay bidirectionally synced — moving the slider updates the input, typing in the input moves the slider.

### User Problem

Users who already know their exact numbers (e.g. "I have 2,347 charge points") find it difficult to hit precise values using only the slider. A direct-entry input field eliminates this friction.

## Why This Approach

**Keep both the formatted value label AND the input field.** The label above the slider (right-aligned) continues showing the formatted value as it does today. A new input field sits to the right of the slider track, providing a second entry method.

This preserves the existing visual design while adding precision. Users who prefer sliders see no change; users who want exact entry have a clear input field.

## Key Decisions

1. **Value display: Keep both** — The existing formatted label above the slider stays. The new input field is an additional element beside the slider track.

2. **Percentage format: Number + suffix** — For the two percentage sliders (utilization, flexibility), users type a plain number (e.g. "25") and see a "%" suffix label next to the input. Internal conversion to decimal (0.25) happens automatically.

3. **Out-of-range handling: Show error** — If a user types a value outside the slider's min/max range, highlight the input field red and show an error indicator. Don't update the slider or calculations until the value is corrected.

4. **Input width: Medium (~100-120px)** — A comfortable, fixed width that's easy to read and type into. Balanced with the slider, which remains the dominant element.

5. **Update timing: Real-time (instant)** — The slider and charts update on every keystroke, matching the slider's own instant-feedback behavior. Invalid/out-of-range values prevent updates (per decision #3).

6. **Styling: Match existing design system** — Use the brand colors (forest green primary, off-white surfaces), the same font sizes and weights, and the established spacing/border patterns from the rest of the calculator form.

## Scope

### In Scope
- Add `<input type="text">` (not `type="number"` to allow formatting control) next to each of the 3 sliders
- Bidirectional sync: slider <-> input
- Format display: commas for chargers (e.g. "1,500"), plain number for percentages with "%" suffix
- Validation: red highlight for out-of-range values
- Responsive behavior within the existing sticky sidebar layout

### Out of Scope
- Changing the slider behavior itself
- Changing min/max ranges
- Adding new sliders or inputs
- Mobile-specific input UX (numeric keyboard hints are fine, but no custom mobile controls)
