# Research: Lesson Framework and Foundation Lessons

All items in the plan's Technical Context are decided. No `NEEDS CLARIFICATION` remains. Where the stack brief
offered a choice or conflicted with the spec or constitution, the decision and its reason are recorded here.

## R1. Chart library: D3 modules vs Plotly.js

- **Decision**: Use `d3-scale` and `d3-shape` for math and path generation, and render the SVG with React.
  Do not use Plotly.
- **Rationale**:
  - The lessons need draggable on-chart handles (a point on a curve, a prediction line) that are also
    keyboard-operable `role="slider"` elements. With hand-rendered SVG this is direct. Plotly's editable shapes
    do not give keyboard-operable handles or accessible names.
  - Plotly adds a bundle in the megabyte range. The charts here have fewer than a few hundred elements, so SVG
    is comfortably within 60 fps.
  - Full control of colours and patterns makes the colour-blind-safe and dark-mode requirements simple.
- **Alternatives considered**:
  - Plotly.js: strong built-in zoom and hover, but poor fit for custom handles and accessibility, and heavy.
  - Full `d3` with D3-driven DOM: it fights React's rendering. Only the pure modules are used.
  - Canvas: faster for large data, but harder to make accessible, and not needed at this scale.

## R2. Lesson content format: MDX vs JSON plus Markdown

- **Decision**: One folder per lesson with `lesson.json` (structure and data) and `intuition.md` (prose with
  inline `$...$` math).
- **Rationale**:
  - The spec requires that adding a lesson not need engine edits. JSON can be validated against a schema at
    build time, MDX cannot be validated in the same way without executing code.
  - Parameters, symbol tables and worked-example templates are structured data. Prose is the only free text.
  - MDX would let lesson authors embed arbitrary components, which breaks the rule that lessons only declare
    data.
- **Alternatives considered**: MDX (flexible, but unvalidated and code-adjacent), a TypeScript module per lesson
  (type-checked, but is code and invites engine coupling), YAML (extra parser for no gain).

## R3. Worked-example substitution

- **Decision**: A tiny template language in `src/sim/template.ts`: `{{key}}` for scalars, `{{key[i]}}` for one
  array element, `{{key[]|sep}}` to join all elements, and a `|paren` filter that wraps negative numbers in
  parentheses. Parameters are formatted with 1 decimal and outputs with the decimals declared for them.
- **Rationale**: The worked example must show current values substituted into the formula and equal the number
  shown in the visualization (SC-003). Reading both from the same store state guarantees it. A fixed small syntax
  keeps templates declarative and testable. Datasets are fixed-size, so authors can write per-point steps.
- **Alternatives considered**: JavaScript template literals in content (executes content as code), a general
  template engine such as Handlebars (a dependency with features no lesson needs), computing the example inside
  each chart component (duplicates logic and breaks the content-only rule).

## R4. Variants for choice parameters

- **Decision**: `formula`, `workedExample` and `chartSummary` may be a `Variant`: either one value, or
  `{ variantBy: "<choice param id>", variants: { "<option>": value } }`.
- **Rationale**: In "Function and slope" the slope rule differs per curve (2x, 3x², cos x), so the formula,
  symbols and worked example must change when the learner picks another curve. A generic variant avoids
  special-casing that lesson in the engine.
- **Alternatives considered**: three separate lessons (contradicts the clarified spec), engine code per curve
  (violates content-only extension).

## R5. Exact derivative, with finite difference only as a test cross-check

- **Decision**: The core stores each curve as `{ f, df }` with the exact derivative. A central-difference helper
  exists only in `tests/helpers/` and is used to confirm that `df` agrees with `f` within 1e-6.
- **Rationale**: The clarified spec says the slope comes from the exact slope rule, so nothing in the product
  needs an approximation (Principle VI). Keeping an independent approximation in tests still protects against a
  wrong hand-derived rule. This replaces "derivative approximation" in the stack brief.
- **Alternatives considered**: Shipping a numerical derivative in the core (unused code), symbolic algebra
  library (heavy, unneeded).

## R6. State management: Zustand store per lesson

- **Decision**: A factory `createLessonStore(lesson, dataset)` returns a Zustand store holding `params`,
  `outputs`, `setParam` and `reset`. `setParam` snaps to the step, clamps to the range, then calls the model
  synchronously and stores the new `outputs` in the same update. A separate global `themeStore` holds the theme.
- **Rationale**: Computing outputs inside the same state transition means the chart and every number are always
  from the same parameters (no flicker or stale numbers) and nothing is debounced. Creating the store per lesson
  gives "always start at defaults" for free, since opening a lesson creates a fresh store.
- **Alternatives considered**: Computing outputs in components with `useMemo` (risk of components disagreeing),
  one global store keyed by lesson (needs manual cleanup to guarantee defaults), React context and reducer (works
  but the brief specifies Zustand).

## R7. Decimal handling for 0.1 steps

- **Decision**: `snapToStep(value, step, min)` computes `min + Math.round((value - min) / step) * step`, then
  rounds to the step's decimal count with `roundTo`. Parameters are therefore exact decimal values such as
  `0.3`, never `0.30000000000000004`. Sums use compensated (Neumaier) summation.
- **Rationale**: The spec requires results to match hand calculation exactly at the displayed precision. Binary
  floating point makes `0.1 + 0.2` drift, which would show up as `0.3000000001` in worked examples.
- **Alternatives considered**: Storing parameters as integer tenths (error-prone at every use site), decimal
  library (extra dependency for a rounding problem that two small functions solve).

## R8. Routing and hosting

- **Decision**: `react-router-dom` with a hash router (`#/`, `#/lessons/:id`). The build is a static folder with
  a configurable base path.
- **Rationale**: Direct links and refresh work on any static host without server rewrites. FR-020 (unknown lesson
  shows "not found") is handled by a catch-all route.
- **Alternatives considered**: History-mode routing (needs a host-side fallback rule), no router (loses
  deep links to lessons).

## R9. Theme

- **Decision**: CSS variables in `tokens.css`, switched by a `data-theme` attribute on the root element. The
  initial theme follows `prefers-color-scheme`. The choice lives in `themeStore` (memory only), so it persists
  while navigating and resets on reload.
- **Rationale**: Matches the clarified assumption (no saving between visits). Chart colours read the same tokens
  so charts switch together with the page.
- **Alternatives considered**: `localStorage` persistence (outside the spec, and it adds state to reason about).

## R10. Colour-blind-safe palette

- **Decision**: Okabe-Ito colours for data series, plus a redundant non-colour cue for each meaning: tangent line
  is dashed, error segments are drawn as vertical lines with labelled values, and data points use filled circles
  while predictions use a solid line.
- **Rationale**: FR-018 requires that no information is conveyed by colour alone. A unit test computes WCAG
  contrast ratios between the palette tokens and each theme background, because jsdom cannot evaluate rendered
  colour contrast.
- **Alternatives considered**: Relying on automated axe contrast checks (not available in jsdom).

## R11. Accessible chart interaction

- **Decision**: Each draggable thing is a focusable SVG element with `role="slider"`, `aria-valuemin`,
  `aria-valuemax`, `aria-valuenow`, `aria-valuetext` and an accessible name. Arrow keys move by one step, and
  Shift plus an arrow key moves by ten steps. The chart is `role="img"` with a labelled description linked to a
  visible text summary generated from the `chartSummary` template.
- **Rationale**: Satisfies FR-016 and FR-017 with standard ARIA behaviours, and the same `setParam` path serves
  mouse, touch and keyboard so behaviour cannot diverge.
- **Alternatives considered**: Hidden duplicate form controls only (leaves the chart itself inoperable by
  keyboard).

## R12. Performance and the Web Worker rule

- **Decision**: No Web Worker. Computation stays on the main thread and is covered by a timing test.
- **Rationale**: Each update evaluates about 200 curve samples, or at most 10 data points. This is well under
  1 ms. A worker would make updates asynchronous and risk the stale-number mismatch the store design avoids.
  Principle VIII only requires a worker when computation would otherwise block the UI. Re-evaluate in the
  training-animation feature.
- **Alternatives considered**: Worker for all models (adds async plumbing for no gain).

## R13. Reference values for the math core

- **Decision**: `tests/fixtures/generate_reference.py` uses NumPy (available locally) to write
  `reference-values.json`. The JSON is committed, so running the tests does not need Python. Core tests compare
  to it with an absolute tolerance of 1e-9, and to hand-computed values listed in [test-cases.md](./test-cases.md).
- **Rationale**: Satisfies the constitution's requirement of hand or NumPy reference values with a stated
  tolerance, without making Python a test-time dependency.
- **Alternatives considered**: Computing references in TypeScript tests (circular check, not independent).

## R14. Layer-boundary enforcement

- **Decision**: ESLint `no-restricted-imports` rules (core cannot import from `sim` or `ui` or any framework,
  `sim` cannot import from `ui`), plus a unit test that scans import statements in `src/core` and `src/sim`.
- **Rationale**: Principles III and VI are testable rules, so they are checked by tooling, not only by review.
- **Alternatives considered**: Separate packages in a workspace (heavier setup than needed for one app).
