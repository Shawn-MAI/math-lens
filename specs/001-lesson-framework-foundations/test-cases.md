# Test Case Inventory (approval gate)

Status: Approved 2026-11-05 by the project owner, as written (121 cases).

Principle V requires these cases to be listed and approved **before implementation**. Implementation tasks must
write each test first and see it fail. IDs are referenced from `tasks.md`.

Tolerance statement: core comparisons against hand-computed or NumPy values use an absolute tolerance of
`1e-9` unless a case states otherwise. Values below were computed by hand and are re-confirmed by
`tests/fixtures/generate_reference.py` (NumPy) into `reference-values.json`.

Datasets: `loss-3` = (1,2), (2,4), (3,5). `weight-bias-4` = (1,3), (2,5), (3,7), (4,8).

## A. Core unit tests (`tests/unit/core/`)

### A1. `numeric.ts`

| ID | Case | Expected |
|----|------|----------|
| A1-01 | `snapToStep(0.30000000000000004, 0.1, -3)` | exactly `0.3` |
| A1-02 | `snapToStep(1.04, 0.1, -3)` and `snapToStep(1.06, 0.1, -3)` | `1.0` and `1.1` |
| A1-03 | `snapToStep` on a value already on the grid, at both range ends (-3 and 3) | unchanged |
| A1-04 | `clamp(5, -3, 3)`, `clamp(-9, -3, 3)`, `clamp(1, -3, 3)` | `3`, `-3`, `1` |
| A1-05 | `clamp` and `snapToStep` with `NaN`, `Infinity` | throw `RangeError` |
| A1-06 | `roundTo(0.1 + 0.2, 1)` | exactly `0.3` |
| A1-07 | `sum([1e16, 1, -1e16])` (compensated) | `1` (a naive loop gives `0`) |
| A1-08 | `sum` of one hundred values of `0.1` | `10` within `1e-12` (error does not accumulate) |
| A1-09 | `sum([])` | `0` |

### A2. `curves.ts` (exact derivative rules)

| ID | Curve | x | y | slope |
|----|-------|---|---|-------|
| A2-01 | x² | 1.5 | 2.25 | 3 |
| A2-02 | x² | 0 | 0 | 0 |
| A2-03 | x² | -1 | 1 | -2 |
| A2-04 | x² | 3 | 9 | 6 |
| A2-05 | x³ | 2 | 8 | 12 |
| A2-06 | x³ | -1.5 | -3.375 | 6.75 |
| A2-07 | x³ | 0 | 0 | 0 |
| A2-08 | sin x | 0 | 0 | 1 |
| A2-09 | sin x | 3 | 0.1411200080598672 | -0.9899924966004454 |
| A2-10 | sin x | 1.6 | 0.9995736030415051 | -0.029199522301288815 |

| ID | Case | Expected |
|----|------|----------|
| A2-11 | For each curve and x in {-3, -1.5, 0, 1.5, 3}: exact `df` vs central difference of `f` with h = 1e-5 (helper in `tests/helpers/`) | agree within `1e-6` |
| A2-12 | Unknown curve id | throws an error naming the id |
| A2-13 | Non-finite x | throws `RangeError` |

### A3. `linear.ts` and `loss.ts`

| ID | Case | Expected |
|----|------|----------|
| A3-01 | `predict(2, 1, 3)` | `7` |
| A3-02 | `loss-3`, slope 2, intercept 0 | predictions 2, 4, 6. errors 0, 0, 1. squared errors 0, 0, 1. MSE `1/3` |
| A3-03 | `loss-3`, slope 1, intercept 0 (Loss default) | errors -1, -2, -2. squared 1, 4, 4. MSE `3` |
| A3-04 | `loss-3`, slope 1.5, intercept 0.5 | predictions 2, 3.5, 5. errors 0, -0.5, 0. MSE `0.25 / 3` |
| A3-05 | `weight-bias-4`, w 1, b 0 (Weight and bias default) | errors -2, -3, -4, -4. squared 4, 9, 16, 16. MSE `11.25` |
| A3-06 | `weight-bias-4`, w 2, b 1 | errors 0, 0, 0, 1. MSE `0.25` |
| A3-07 | `weight-bias-4`, w 1.5, b 2 | predictions 3.5, 5, 6.5, 8. errors 0.5, 0, -0.5, 0. MSE `0.125` |
| A3-08 | Perfect fit: points (1,2), (2,4), (3,6), line y = 2x | every error 0, MSE exactly `0` |
| A3-09 | Single data point (1, 3), slope 1, intercept 0 | error -2, MSE `4` |
| A3-10 | Empty dataset | `mse` throws `RangeError` (no divide-by-zero NaN) |
| A3-11 | Mismatched input array lengths | throws `RangeError` |
| A3-12 | Large magnitude: points (1, 1e8), (2, 2e8), slope 1e8 + 1, intercept 0 | errors 1, 2. MSE `2.5` |
| A3-13 | Large magnitude, exact fit: same points, slope 1e8 | MSE exactly `0` |
| A3-14 | Small magnitude: points (1, 1e-8), (2, 2e-8), slope 0, intercept 0 | MSE `2.5e-16` within relative `1e-12` |
| A3-15 | Sign convention: error is prediction minus actual | A3-03 errors are negative when the line is below the data |
| A3-16 | NumPy reference: 20 random (slope, intercept) pairs on both datasets | match `reference-values.json` within `1e-9` |

### A4. Models (`slopeOfCurve.ts`, `lineLoss.ts`)

| ID | Case | Expected |
|----|------|----------|
| A4-01 | `slope-of-curve`, x² at x = 1 (default) | y 1, slope 2, tangentIntercept -1 |
| A4-02 | `slope-of-curve`, x² at x = 1.5 | y 2.25, slope 3, tangentIntercept -2.25 |
| A4-03 | `slope-of-curve`, x³ at x = 2 | y 8, slope 12, tangentIntercept -16 |
| A4-04 | `slope-of-curve`, sin x at x = 0 | y 0, slope 1, tangentIntercept 0 |
| A4-05 | `slope-of-curve`, x² at x = 0 | slope 0, tangent horizontal (`tangentY` values equal) |
| A4-06 | `slope-of-curve` sample arrays | `curveX` has 201 values from -3 to 3, and `curveY[i] = f(curveX[i])` |
| A4-07 | Tangent passes through the point | `tangentY` evaluated at x equals `y` within `1e-12` |
| A4-08 | `slope-of-curve` with an unknown curve choice | throws |
| A4-09 | `line-loss` outputs cover `outputKeys` exactly | no missing or extra keys |
| A4-10 | `line-loss` with A3-02 to A3-07 inputs | same values as A3 |
| A4-11 | `compute` is pure | same input called twice gives equal output, and input objects are not mutated |

### A5. Layer boundary

| ID | Case | Expected |
|----|------|----------|
| A5-01 | Scan `src/core/**` imports | none of `react`, `react-dom`, `zustand`, `d3-*`, `katex`, `src/sim`, `src/ui`, and no `window` or `document` references |
| A5-02 | Scan `src/sim/**` imports | no `src/ui` imports and no `react` or `react-dom` imports |

## B. Simulation layer unit tests (`tests/unit/sim/`)

| ID | Case | Expected |
|----|------|----------|
| B-01 | New Weight and bias store | `params` w 1, b 0. `outputs.mse` 11.25 |
| B-02 | `setParam("w", 2)` then `setParam("b", 1)` | `mse` 0.25, and `outputs` equals a fresh `compute` for the same params |
| B-03 | `setParam("w", 1.04)` | stored value `1`. `setParam("w", 1.06)` stored `1.1` |
| B-04 | `setParam("w", 9)` | clamped to `3`, result `{ ok: false, message }` naming the range "-3.0 to 3.0" |
| B-05 | `setParam("w", NaN)` and `setParam("w", "abc")` | rejected, `params` and `outputs` unchanged |
| B-06 | `reset()` after several changes | all params at defaults, `outputs` equal to the initial outputs |
| B-07 | `reset()` at defaults | no change and no error |
| B-08 | Two stores for the same lesson | independent (changing one does not change the other) |
| B-09 | Slope lesson: set x 1.5, then change curve to x³ | x stays 1.5, outputs recomputed (y 3.375, slope 6.75) |
| B-10 | Slope lesson: set x to a value past the range | clamped to the range end |
| B-11 | Any sequence of 1000 random valid `setParam` calls | after each call `outputs` equals a fresh `compute` of `params` (no stale outputs) |
| B-12 | Theme store | initial value follows the system setting (mocked), `toggle()` flips it and sets `data-theme` on the root element |
| B-13 | Timing: 1000 `setParam` calls on the Weight and bias store | 95th percentile under 5 ms per call |

### B-T. Template engine

| ID | Case | Expected |
|----|------|----------|
| BT-01 | `{{w}}` with w 1.5 | `1.5` |
| BT-02 | `{{predictions[0]}}` with outputs decimals 2 | `2.00` for the A3-02 case |
| BT-03 | `{{squaredErrors[]\| + }}` for A3-03 | `1.00 + 4.00 + 4.00` |
| BT-04 | `{{b\|paren}}` with b -0.5 and with b 2 | `(-0.5)` and `2` |
| BT-05 | A value that rounds to negative zero | shown as `0` |
| BT-06 | Unknown name | error naming the lesson, field and name |
| BT-07 | Index past the end, and `[]` on a scalar | error |
| BT-08 | Unbalanced `{{` | error |
| BT-09 | Worked example for the Weight and bias default | final value in the text equals `outputs.mse` formatted with its decimals |
| BT-10 | Variant selection | the steps for the current choice are returned, and a missing variant for any option is a validation error |

## C. Content tests (`tests/unit/content/`)

| ID | Case | Expected |
|----|------|----------|
| C-01 | Every `lesson.json` validates against `contracts/lesson.schema.json` | pass |
| C-02 | Lesson id equals folder name, topic equals parent folder, ids unique, `order` unique per topic | pass |
| C-03 | Model id exists, `bind` covers every role, bound parameters exist and are number parameters | pass |
| C-04 | Every output key is produced by the model | pass |
| C-05 | Parameter ranges and defaults sit on the step grid, and `min < max` | pass |
| C-06 | Chart type exists, required outputs are produced, and options satisfy the chart contract | pass |
| C-07 | Every `symbols[].symbol` appears in the formula `latex`. Every letter, Greek command or accent in `latex` that is not an operator (`\sum`, `\frac`, `\cdot`, and so on, from an allow-list) has a `symbols` entry | pass (Principle IV) |
| C-08 | `intuition.md` exists and is non-empty for every lesson | pass |
| C-09 | Every template resolves for default parameters and for the min and max of each parameter | pass, no unknown names |
| C-10 | Every worked example, evaluated at 3 parameter settings per lesson, has a final value equal to the displayed output | pass (SC-003) |
| C-11 | Formula and worked-example LaTeX parses in KaTeX with `throwOnError: true` after substitution | pass |
| C-12 | Datasets: 1 to 10 finite points, id equals file name | pass |
| C-13 | Lessons with `handles: true` or `control: "chart-handle"` use a chart that exposes those handles | pass |
| C-14 | Content-only extension: a fixture lesson added under a temporary content root, reusing `line-loss` and `line-fit`, appears in the list and opens with no source file edited | pass (FR-022) |
| C-15 | The Loss lesson does not use "w" or "b" as parameter symbols (FR-011) | pass |

## D. Component tests (`tests/component/`)

Use React Testing Library with user-event. Each wiring test asserts that the chart, the numbers, the worked
example and the text summary all changed together and agree with one another.

| ID | Case | Expected |
|----|------|----------|
| D-01 | Lesson list | Four topic headings in order. Three lessons under Foundations. Other three topics show "coming soon" and have no link |
| D-02 | Open a lesson from the list, then use the "back to list" link | Lesson opens, and the list shows again |
| D-03 | Lesson section order | In the document: intuition, demo (chart and controls), formula, worked example, in that order |
| D-04 | Slope lesson: set x to 1.5 with x² | Handle `aria-valuenow` 1.5, slope readout `3.0`, worked example contains the substituted values and result 3.0, summary mentions slope 3.0 |
| D-05 | Slope lesson: choose x³, then sin x | Chart curve path changes, formula and symbols change, worked example shows the matching rule |
| D-06 | Slope lesson: x = 0 on x² | Slope readout `0.0`, no error, tangent drawn horizontal |
| D-07 | Loss lesson: arrow key on the height handle | Value changes by 0.1, errors and MSE update |
| D-08 | Loss lesson: Shift + arrow on the slope handle | Value changes by 1.0 |
| D-09 | Loss lesson: pointer drag of the height handle | Value follows pointer position, snapped to 0.1 |
| D-10 | Loss lesson: default view | Three error labels -1.00, -2.00, -2.00 and loss 3.000 |
| D-11 | Weight and bias: change w to 2 and b to 1 through the sliders | Line moves, loss shows 0.250, worked example uses `(2.0)` and `(1.0)` correctly |
| D-12 | Weight and bias: type `9` into the w input | Value clamps to 3.0 and the message "Enter a number from -3.0 to 3.0" shows |
| D-13 | Weight and bias: type `abc` into the w input | Previous value is kept and the message shows |
| D-14 | Reset after changes, in each lesson | Controls, chart, numbers, worked example and summary all show defaults |
| D-15 | Reset at defaults | No change, no error |
| D-16 | Theme toggle | `data-theme` flips and chart colours come from the new tokens. Choice survives navigating list to lesson and back |
| D-17 | Reset does not change the theme | Theme unchanged after reset |
| D-18 | Unknown lesson address | "Lesson not found" message with a link to the list |
| D-19 | Tab order in a lesson | Back link, theme toggle, controls and handles, reset. Each shows a visible focus indicator (focus style present in computed style) |
| D-20 | All controls reachable and operable using keyboard only | A full scripted keyboard session completes in each lesson |
| D-21 | Accessibility scan (vitest-axe) on list, each lesson, not-found, in both themes | No violations (colour-contrast rule excluded because jsdom cannot compute it, see D-23) |
| D-22 | Chart text alternative | Each chart has `role="img"`, an accessible name, and a visible summary that changes with parameters |
| D-23 | Palette contrast | WCAG contrast ratios computed from the tokens: text at least 4.5:1, chart series and focus ring at least 3:1 against each theme background |
| D-24 | No information by colour alone | Tangent line is dashed, error labels carry text values, series have different line styles |
| D-25 | Timing: from `fireEvent.change` on a slider to the updated DOM in the Weight and bias lesson | Completed synchronously in the same act, and measured under 100 ms (target 16 ms) |
| D-26 | No debounce on the control-to-chart path | DOM is already updated immediately after the event, with no timers pending |
| D-27 | Rapid sequence of 50 changes | Final DOM equals the result for the last value, numbers never disagree with the chart |

## E. Manual checks recorded in `quickstart.md`

These cannot be proven in jsdom and are checked once before merge.

| ID | Check |
|----|-------|
| E-01 | Layout at 1024, 1280 and 1920 px wide: nothing overlaps or is cut off (SC-008) |
| E-02 | Drag a handle in the browser with the DevTools performance panel: frames stay at or near 60 fps, update under 100 ms |
| E-03 | Rendered colour contrast and colour-blind simulation (deuteranopia, protanopia, tritanopia) in both themes |
| E-04 | One screen-reader pass of a lesson (handle names, values and summary announced sensibly) |
| E-05 | Build output works from a static folder, and a deep link and refresh both load the lesson at default values |

## Coverage map

| Spec item | Cases |
|-----------|-------|
| FR-001 to FR-003 | D-01, D-02, D-18 |
| FR-004, FR-005 | D-03, C-07, C-08 |
| FR-006, FR-007, SC-001, SC-003 | BT-09, C-10, D-04, D-11, D-25 to D-27, B-13 |
| FR-008 | A4-06, A4-07, D-05 |
| FR-009 | B-06, B-07, B-08, D-14, D-15, E-05 |
| FR-010 | A2-xx, A4-01 to A4-08, D-04 to D-06 |
| FR-011 | A3-02 to A3-04, D-07 to D-10, C-15 |
| FR-012 | A3-05 to A3-07, D-11 |
| FR-013 | A1-xx, B-03 to B-05, D-12, D-13 |
| FR-014, FR-015 | B-12, D-16, D-17, D-21 |
| FR-016, FR-017 | D-19 to D-22 |
| FR-018 | D-23, D-24, E-03 |
| FR-019, SC-008 | E-01 |
| FR-020 | D-18 |
| FR-021 | Scope check in review (no accounts, progress, animation, neural network content) |
| FR-022 | C-14 |
| SC-002 | A2-xx, A3-xx, A4-xx |
| SC-004, SC-007 | Usability checks with test learners after implementation (outside automated tests) |
| SC-005 | D-20 |
| SC-006 | D-21, D-22 |
