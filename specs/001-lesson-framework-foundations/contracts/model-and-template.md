# Contract: Models and Templates

Two small contracts connect lesson content to the engine: the **model contract** (what the core returns) and the
**template syntax** (how content refers to those values).

## 1. Model contract (`src/core`, registered in `src/sim/models.ts`)

```ts
interface Model {
  id: string;
  roles: string[];            // numeric inputs the lesson must bind to number parameters
  choiceInputs: string[];     // choice inputs the lesson must bind to choice parameters
  needsDataset: boolean;
  outputKeys: string[];       // every key compute() returns
  compute(
    input: { values: Record<string, number>; choices: Record<string, string> },
    dataset?: Point[],
  ): Record<string, number | number[]>;
}
```

Rules:

- `compute` is a pure function: same input, same output, no I/O, no globals, no randomness.
- It never imports React, a state library or a chart library, and never touches the DOM.
- Inputs arrive already snapped and clamped by the store. `compute` still guards against non-finite input by
  throwing a `RangeError`, so a bug cannot silently draw a wrong chart.
- Charts and templates may only use values the model returns. Nothing is hard-coded in a chart.
- Exact definitions:
  - `error = prediction − actual`
  - `squaredError = error²`
  - `mse = sum(squaredErrors) / n` (compensated summation, `n ≥ 1`)
  - `slope = f'(x)` from the curve's exact derivative

### Model: `slope-of-curve`

| Item | Value |
|------|-------|
| Roles | `x` |
| Choice inputs | `curve`: `x2` (x²), `x3` (x³), `sin` (sin x) |
| Dataset | not needed |
| Outputs | `y`, `slope`, `tangentIntercept`, `curveX[]`, `curveY[]` (sampled over the parameter range, 201 points), `tangentX[]`, `tangentY[]` (2 points spanning the visible x-range) |

Exact rules: `x²` → `2x`, `x³` → `3x²`, `sin x` → `cos x`. Tangent line: `y = slope·(t − x) + y(x)`, so
`tangentIntercept = y − slope·x`.

### Model: `line-loss`

| Item | Value |
|------|-------|
| Roles | `slope`, `intercept` |
| Dataset | required, 1 to 10 points |
| Outputs | `n`, `predictions[]`, `errors[]`, `squaredErrors[]`, `mse`, `lineX[]`, `lineY[]` (2 points at the chart's x-range ends) |

`predictions[i] = slope·x_i + intercept`.

### Adding a model

1. Add `src/core/models/<name>.ts` exporting a `Model`, with tests (known values, edge cases, stability).
2. Add one line to the registry in `src/sim/models.ts`.
3. Reference it from a lesson with `"model": { "id": "<name>", "bind": { ... } }`.

## 2. Template syntax (`src/sim/template.ts`)

Templates are used in `workedExample[].text`, `workedExample[].latex` and `chartSummary`.

| Syntax | Meaning | Example (w = 1.5, b = −0.5) |
|--------|---------|-----------------------------|
| `{{name}}` | Scalar parameter or output | `{{w}}` → `1.5` |
| `{{name[i]}}` | Element `i` (0-based) of an array | `{{predictions[0]}}` |
| `{{name[]\|sep}}` | All elements joined by `sep` | `{{squaredErrors[]\| + }}` → `0.00 + 0.25 + 0.00 + 0.25` |
| `{{name\|paren}}` | Wraps negative numbers in parentheses | `{{b\|paren}}` → `(-0.5)` |

Context available to a template:

| Name | Source | Formatting |
|------|--------|------------|
| Parameter ids | current `params` | Number: 1 decimal. Choice: the option's label |
| Output keys | current `outputs` | `decimals` from the lesson's `outputs` entry. Keys with no entry use up to 6 decimals with trailing zeros trimmed |
| `dataX`, `dataY` | dataset | Trailing zeros trimmed |

Rules:

- Only these four forms are valid. There is no expression evaluation, conditionals or loops.
- An unknown name, an index past the end of an array, or a `[]` on a scalar is a content error. The loader
  reports it at build or test time (never at runtime in front of a learner), with the lesson id and field path.
- Substitution happens on the string before KaTeX renders it, so the displayed math and the displayed numbers
  always come from the same store state.
- `{{` and `}}` that are not part of a reference are not allowed in templates. In LaTeX, write a space between
  adjacent braces (`{ {{w}} }`) so a template reference is never confused with a LaTeX group.
- Negative zero is displayed as `0`.

### Variants

`formula`, `workedExample` and `chartSummary` can depend on a choice parameter:

```json
"workedExample": {
  "variantBy": "curve",
  "variants": {
    "x2": [ { "text": "...", "latex": "f'(x) = 2x = 2 \\cdot {{x|paren}} = {{slope}}" } ],
    "x3": [ { "text": "...", "latex": "f'(x) = 3x^2 = 3 \\cdot {{x|paren}}^2 = {{slope}}" } ],
    "sin": [ { "text": "...", "latex": "f'(x) = \\cos x = \\cos({{x}}) = {{slope}}" } ]
  }
}
```

`variants` must have exactly one entry for each option of the named choice parameter. The loader checks this.
