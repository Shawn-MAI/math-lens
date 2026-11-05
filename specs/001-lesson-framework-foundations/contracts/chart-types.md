# Contract: Chart Types

A chart type is a React component registered in `src/ui/charts/chartRegistry.ts`. It receives the lesson's
current `params` and `outputs` plus a `setParam` function. It never calls core functions or computes numbers
itself, and it only draws what the model returned (Principle III).

```ts
interface ChartProps {
  params: Record<string, number | string>;
  outputs: Record<string, number | number[]>;
  dataset?: Point[];
  options: Record<string, unknown>;          // from lesson.chart.options, validated per chart type
  setParam: (id: string, raw: number | string) => { ok: boolean; message?: string };
  parameters: Parameter[];                   // ranges and steps, for handle limits and ARIA values
}
```

Common rules for every chart type:

- The chart is an SVG with `role="img"` and an accessible name, described by the visible text summary
  (`chartSummary`) rendered by `ChartPanel` below it.
- Each draggable element is focusable with `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`,
  `aria-valuetext` and `aria-label`. Arrow keys change the value by one step. Shift plus an arrow changes it by
  ten steps. Pointer movement is converted to a value and sent through `setParam`, so snapping and clamping are
  the same as for sliders.
- A visible focus ring is drawn on handles. Handles have a hit area of at least 24 px.
- Colours come from `palette.ts` (Okabe-Ito) and the theme tokens. Meaning is never carried by colour alone: line
  styles (solid, dashed) and text labels are used as well.
- Axes show tick labels and axis titles. Axis ranges come from the model outputs and parameter ranges.
- Re-render on every `params` or `outputs` change with no debounce. Fewer than 300 SVG elements.

## `curve-tangent`

Used by: Function and slope.

| Item | Value |
|------|-------|
| Required outputs | `curveX[]`, `curveY[]`, `tangentX[]`, `tangentY[]`, `y`, `slope` |
| Options | `{ "xParam": "<number param id>" }` |
| Draws | The curve (solid), the tangent line (dashed), the point at `(x, y)` as a draggable handle, and a text label with the slope value near the point |
| Handle | The point. Dragging sets `xParam` using the pointer's x position. Up and down arrow keys are ignored |
| Y-axis | Fitted to `curveY` with padding, so that switching curves rescales the chart |
| Text summary | From `chartSummary`, for example "Curve y = x². At x = 1.0 the point is at y = 1.0 and the slope is 2.0." |

## `line-fit`

Used by: Loss, Weight and bias.

| Item | Value |
|------|-------|
| Required outputs | `lineX[]`, `lineY[]`, `predictions[]`, `errors[]`, `squaredErrors[]`, `mse`, `n` |
| Options | `{ "slopeParam": "<param id>", "interceptParam": "<param id>", "handles": true \| false }` |
| Draws | Data points (filled circles), the prediction line (solid), and one vertical error segment per point from the point to the line. Each segment has its error value as a text label |
| Handles | When `handles` is true: a handle on the line at x = 0 (up and down changes `interceptParam`) and a handle on the line at the right end of the chart (up and down changes `slopeParam`, keeping the line's value at x = 0 fixed). Left and right arrows are ignored |
| Loss readout | The total loss is shown in `ControlPanel` and in the summary, not only inside the chart |
| Text summary | From `chartSummary`, for example "Line y = 1.0x + 0.0 over 3 points. Errors: -1.00, -2.00, -2.00. Loss (MSE) is 3.000." |

Lesson use of the options:

| Lesson | `handles` | Parameter `control` | Effect |
|--------|-----------|---------------------|--------|
| Loss | `true` | `chart-handle` | The learner drags the line. The control panel shows the current values read-only, with the reset action |
| Weight and bias | `false` | `slider` | The learner uses the sliders and number inputs for w and b |

The loader rejects a lesson that sets `handles: true` while the bound parameters are `slider` only, and one that
sets `control: "chart-handle"` on a parameter the chart does not expose.

## Adding a chart type

1. Add the component in `src/ui/charts/` honouring the common rules above, with a component test for
   parameter-to-chart wiring and keyboard operation.
2. Add one registry line in `chartRegistry.ts`, listing its required output keys and its options schema.
3. Reference it from a lesson with `"chart": { "type": "<name>", "options": { ... } }`.
