---

description: "Task list for Lesson Framework and Foundation Lessons"
---

# Tasks: Lesson Framework and Foundation Lessons

**Input**: Design documents from `/specs/001-lesson-framework-foundations/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, test-cases.md

**Tests**: REQUIRED. Constitution Principle V (Test-First Quality) makes tests mandatory: the test inventory in
[test-cases.md](./test-cases.md) must be approved before implementation (task T001), and in every phase the test tasks
come first and MUST fail before the implementation tasks start. Test IDs (A1-01, B-03, BT-05, C-07, D-12, E-02 ...)
refer to rows in `test-cases.md`.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1 to US5, from spec.md)
- Every task names its exact file path(s)

## Path Conventions

Single project at the repository root (plan.md, "Source Code"): `src/core/`, `src/sim/`, `src/ui/`, `src/content/`,
`tests/unit/`, `tests/component/`. Layer rule (Principle VI): `ui` may import `sim` and `core`, `sim` may import `core`,
`core` imports nothing from the other layers or any framework.

## Stories (from spec.md)

| Story | Priority | Title |
|-------|----------|-------|
| US1 | P1 (MVP) | Explore a lesson by changing its parameters (three lessons) |
| US2 | P2 | Browse and open lessons by topic |
| US3 | P3 | Reset parameters to defaults |
| US4 | P3 | Switch between light and dark mode |
| US5 | P2 | Use lessons with keyboard only (and text alternatives for charts) |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Approval gate, project scaffold, tooling

- [X] T001 GATE (Principle V): Get the user's explicit approval of `specs/001-lesson-framework-foundations/test-cases.md`, then add a line `Status: Approved <date>` under its title. Also confirm you are on branch `001-lesson-framework-foundations` with a clean or intentionally staged tree (Principle IX). Do not start T002 before this is done.
- [X] T002 Scaffold the Vite + React + TypeScript project at the repository root: `package.json` (scripts `dev`, `build`, `preview`, `test`, `lint`, `typecheck`), `index.html`, `vite.config.ts`, `tsconfig.json` (`"strict": true`), `src/vite-env.d.ts`, and a `.gitignore` (node_modules, dist, coverage, `.specify/feature.json`)
- [X] T003 Install dependencies listed in plan.md Technical Context: runtime `react`, `react-dom`, `react-router-dom`, `zustand`, `d3-scale`, `d3-shape`, `katex`, `react-markdown`, `remark-math`, `rehype-katex`, `zod`; dev `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`, `eslint` with TypeScript and React plugins, matching `@types/*`. Use `package.json` and `package-lock.json`
- [X] T004 [P] Configure Vitest in `vite.config.ts` (environment `jsdom`, `setupFiles: ['tests/setup.ts']`, include `tests/**/*.test.{ts,tsx}`) and create `tests/setup.ts` (register jest-dom and vitest-axe matchers, cleanup after each test)
- [X] T005 [P] Create `eslint.config.js` with `no-restricted-imports` layer rules: `src/core/**` may not import `react`, `zustand`, `d3-*`, `katex`, or anything under `src/sim`, `src/ui`; `src/sim/**` may not import `react`, `react-dom`, `src/ui` (research.md, layer enforcement)
- [X] T006 [P] Create `tests/fixtures/generate_reference.py` (NumPy, seeded) that writes `tests/fixtures/reference-values.json` with 20 random `(slope, intercept)` pairs and their MSE for datasets `loss-3` and `weight-bias-4` (A3-16), then run it and commit the generated JSON
- [X] T007 [P] Create the test-only helper `tests/helpers/numericDerivative.ts` (central difference, `h = 1e-5`) for the cross-check in A2-11

**Checkpoint**: `npm run lint` and `npm run test` run (zero tests is acceptable) and `npm run dev` serves a blank page.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core numerics, content schema/loader, template engine and the app shell. All stories depend on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundational (write first, they MUST fail)

- [X] T008 [P] Write `tests/unit/core/numeric.test.ts` for `numeric.ts`: A1-01 to A1-09 (snap to 0.1 grid without float drift, clamp, NaN/Infinity throw `RangeError`, `roundTo`, compensated `sum` of `[1e16, 1, -1e16]`, 100 × 0.1, empty array)
- [X] T009 [P] Write `tests/unit/sim/layerBoundaries.test.ts`: A5-01 (scan `src/core/**` imports: nothing from `sim`, `ui`, `react`, `zustand`, `d3`, `katex`, DOM globals) and A5-02 (scan `src/sim/**` imports: nothing from `ui`, `react`)
- [X] T010 [P] Write `tests/unit/sim/template.test.ts` for the template engine: BT-01 to BT-10 (`{{name}}`, `{{name[i]}}`, `{{name[]|sep}}`, `|paren`, negative zero, unknown name, index past the end, unbalanced `{{`, Weight and bias worked-example default, variant selection)

### Implementation for Foundational

- [X] T011 [P] Create `src/core/types.ts`: `Point`, `ModelOutput`, `Model` (id, roles, inputs, `outputKeys`, pure `compute`) as defined in contracts/model-and-template.md
- [X] T012 [P] Create `src/core/numeric.ts`: `clamp`, `snapToStep(value, step, min)` (decimal-safe, snaps "to the nearest step from `min`", then clamps), `roundTo`, `sum` (Neumaier compensated summation). Non-finite input throws `RangeError`. Makes T008 pass
- [X] T013 [P] Create `src/sim/content/topics.ts`: the four topics in fixed order: `foundations` "Foundations" (1), `optimization` "Optimization" (2), `models` "Models" (3), `neural-networks` "Neural Networks" (4). `order` is "1 to 4, unique"
- [X] T014 [P] Create `src/sim/content/schema.ts`: zod schemas matching `contracts/lesson.schema.json` and data-model.md, with the constraints verbatim: Lesson `id` kebab-case; `title` "1 to 60 characters"; `summary` "1 to 160 characters"; `order` "integer ≥ 1"; `parameters` "At least 1", ids unique and matching `[a-zA-Z][a-zA-Z0-9]*`; NumberParameter `min < max`, "both multiples of `step`", `step` "> 0", `default` "In `[min, max]` and a multiple of `step` from `min`", `control` one of `slider | chart-handle | both`; ChoiceParameter "At least 2" options, unique values, `default` one of the options; OutputSpec `decimals` "integer 0 to 6"; Dataset "1 to 10 points, finite numbers"; `Variant<T>` where `variantBy` names a choice parameter and `variants` has exactly one key per option
- [X] T015 Create `src/sim/template.ts`: the template engine from contracts/model-and-template.md (`{{name}}`, `{{name[i]}}`, `{{name[]|sep}}`, `|paren`), context = params + outputs (formatted with each output's `decimals`) + `dataX`/`dataY`, no negative zero, throws a descriptive error for unknown names, bad indexes and unbalanced `{{`. Makes T010 pass
- [X] T016 Create `src/sim/models.ts`: model registry `Record<string, Model>` (initially empty, models are registered in US1) and `getModel(id)` that throws for unknown ids. Depends on T011
- [X] T017 Create `src/sim/content/loader.ts`: discover `src/content/lessons/*/*/lesson.json` and `intuition.md` and `src/content/datasets/*.json` with `import.meta.glob`, validate with T014, enforce the cross-field rules from data-model.md (id equals folder name, topic equals parent folder, unique ids, unique `order` per topic, model bindings cover every role, template references resolve), and expose `getLessonCatalog()`, `getLesson(id)`, `getDataset(id)`. Export a pure `buildCatalog(modules)` so tests can inject a temporary content root (C-14). Depends on T013, T014, T015, T016
- [X] T018 [P] Create `src/ui/styles/tokens.css` (CSS variables for spacing, type scale, light-theme colours, driven by a `data-theme` attribute on `<html>`; dark values arrive in US4) and `src/ui/styles/app.css` (page layout for widths 1024 px and above, FR-019)
- [X] T019 [P] Create `src/ui/charts/palette.ts`: Okabe-Ito colour set, exposed as CSS variables so charts follow the theme (research.md, accessibility decision)
- [X] T020 [P] Create `src/ui/charts/chartRegistry.ts`: `Record<string, ComponentType<ChartProps>>` (initially empty) and `getChart(type)`, per contracts/chart-types.md
- [X] T021 Create the app shell: `src/ui/app/main.tsx` (mount, import styles) and `src/ui/app/App.tsx` (`HashRouter`, header with site name, `<Routes>` placeholder). Routes themselves are added in US1 and US2

**Checkpoint**: T008, T009, T010 pass, `npm run build` succeeds, and the layer-boundary tests stay green from here on.

---

## Phase 3: User Story 1 - Explore a lesson by changing its parameters (Priority: P1) 🎯 MVP

**Goal**: A learner opens any of the three lessons (by address `#/lessons/<id>`), reads the intuition, changes
parameters and sees chart, numbers, formula values and the worked example update immediately (under 100 ms).

**Independent Test**: Open `#/lessons/weight-and-bias`, set w = 2.0 and b = 1.0. The line, the four error values
and the MSE show the hand-calculated values (quickstart.md scenarios for US1), and the worked example substitutes
the same numbers and ends in the displayed MSE.

### Tests for User Story 1 (write first, they MUST fail)

- [X] T022 [P] [US1] Write `tests/unit/core/curves.test.ts`: A2-01 to A2-13 (f and exact derivative for x², x³, sin x at the listed values, cross-check against `tests/helpers/numericDerivative.ts`, unknown curve id, non-finite x)
- [X] T023 [P] [US1] Write `tests/unit/core/linear.test.ts` (A3-01) and `tests/unit/core/loss.test.ts` (A3-02 to A3-16: hand values for both datasets, perfect fit, single point, empty dataset throws, mismatched lengths throw, 1e8 and 1e-8 magnitudes, error = prediction − actual, NumPy reference fixture from T006 within `1e-9`)
- [X] T024 [P] [US1] Write `tests/unit/core/models.test.ts`: A4-01 to A4-11 (`slope-of-curve` and `line-loss` outputs against hand values, sample arrays of 201 points over -3..3, tangent passes through the point, unknown curve choice throws, `outputKeys` match exactly, `compute` is pure)
- [X] T025 [P] [US1] Write `tests/unit/sim/lessonStore.test.ts`: B-01 to B-05, B-08 to B-11, B-13 (defaults on creation, `setParam` snapping to 0.1, clamping, rejecting `NaN` and non-numeric text, independent stores per lesson open, choice change re-validates `x`, 1000 random valid calls, 1000 calls timing)
- [X] T026 [P] [US1] Write `tests/unit/content/lessons.test.ts`: C-01 to C-13 and C-15 (every `lesson.json` validates, ids and topics match folders, model bindings, output keys, ranges and defaults on the step grid, chart contract, symbols covered by the formula, `intuition.md` non-empty, templates resolve at default/min/max, worked example final value equals displayed output at 3 settings per lesson, KaTeX parses with `throwOnError: true`, datasets valid, chart-handle lessons use a chart that exposes handles, Loss lesson does not use "w" or "b")
- [X] T027 [P] [US1] Write `tests/component/slopeLesson.test.tsx`: D-04, D-05, D-06 (x = 1.5 on x² gives handle value 1.5, slope readout `3.0`, worked example with substituted values ending in 3.0; choosing x³ then sin x changes the curve path, formula, symbols and worked example; x = 0 on x² gives slope `0.0` and a horizontal tangent)
- [X] T028 [P] [US1] Write `tests/component/lossLesson.test.tsx`: D-07, D-08, D-09, D-10 (arrow key on the height handle changes it by 0.1 and updates errors and MSE, Shift + arrow on the slope handle changes it by 1.0, pointer drag follows the pointer snapped to 0.1, default view shows error labels -1.00, -2.00, -2.00 and loss 3.000, with no "w" or "b" shown)
- [X] T029 [P] [US1] Write `tests/component/weightBiasLesson.test.tsx`: D-11, D-12, D-13 (sliders w = 2.0, b = 1.0 update line, errors, MSE and worked example; typing `9` clamps to 3.0 and shows "Enter a number from -3.0 to 3.0"; typing `abc` keeps the previous value and shows the same message)
- [X] T030 [P] [US1] Write `tests/component/lessonLayout.test.tsx` (D-03: intuition, then demo with controls, then formula, then worked example) and `tests/component/updateTiming.test.tsx` (D-25 under 100 ms from `fireEvent.change` to updated DOM, D-26 no debounce on the control-to-chart path, D-27 rapid 50 changes end in the final value)

### Implementation for User Story 1

**Core (pure TypeScript, no UI imports)**

- [X] T031 [P] [US1] Create `src/core/curves.ts`: `f(curveId, x)` and `df(curveId, x)` for `x2` (2x), `x3` (3x²), `sin` (cos x), unknown id throws, non-finite x throws
- [X] T032 [P] [US1] Create `src/core/linear.ts`: `predict(slope, intercept, x) = slope * x + intercept`
- [X] T033 [US1] Create `src/core/loss.ts`: `residuals` (prediction − actual), `squaredErrors`, `mse = sum(squaredErrors) / n` using the compensated `sum`. Empty dataset and mismatched lengths throw. Depends on T012, T032
- [X] T034 [P] [US1] Create `src/core/models/slopeOfCurve.ts`: role `x`, choice input `curve`; outputs `y`, `slope`, `tangentIntercept`, `curveX[]`, `curveY[]` (201 samples over -3..3), `tangentX[]`, `tangentY[]`. Slope comes from the exact rule, not from nearby points
- [X] T035 [US1] Create `src/core/models/lineLoss.ts`: roles `slope` and `intercept`; outputs `n`, `predictions[]`, `errors[]`, `squaredErrors[]`, `mse`, `lineX[]`, `lineY[]`. Depends on T032, T033
- [X] T036 [US1] Create `src/core/index.ts` exporting the public core API, then register both models in `src/sim/models.ts`. Depends on T034, T035. Makes T022, T023, T024 pass

**Content data**

- [X] T037 [P] [US1] Create `src/content/datasets/loss-3.json` with `id` `loss-3`, points (1,2), (2,4), (3,5)
- [X] T038 [P] [US1] Create `src/content/datasets/weight-bias-4.json` with `id` `weight-bias-4`, points (1,3), (2,5), (3,7), (4,8)

**Simulation layer**

- [X] T039 [US1] Create `src/sim/lessonStore.ts`: a factory `createLessonStore(lesson)` returning a Zustand store with `params`, derived `outputs`, and `setParam(id, value)`. A number is "snapped to the nearest step from `min`, then clamped to `[min, max]`". A typed value that "is not a finite number is rejected, the previous value is kept" and the message is "Enter a number from -3.0 to 3.0" (range of that parameter, 1 decimal). Changing the choice parameter re-validates dependent values (B-09, B-10). Outputs are recomputed synchronously from the core model, with no debounce. Depends on T016, T017. Makes T025 pass

**Presentation**

- [X] T040 [P] [US1] Create `src/ui/charts/SliderHandle.tsx`: shared draggable handle with `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`, arrow key moves one step, Shift + arrow moves ten steps, pointer drag snaps via `snapToStep`
- [X] T041 [P] [US1] Create `src/ui/charts/CurveTangentChart.tsx`: SVG chart (d3-scale and d3-shape for geometry, React renders) showing the curve, the point and a dashed tangent line, reading `curveX/curveY/tangentX/tangentY/x/y` from outputs
- [X] T042 [US1] Create `src/ui/charts/LineFitChart.tsx`: data points, the line, vertical error segments with value labels, option `handles` (true for Loss, false for Weight and bias) using `SliderHandle` for steepness and height. Depends on T040
- [X] T043 [US1] Register `curve-tangent` and `line-fit` in `src/ui/charts/chartRegistry.ts`. Depends on T041, T042
- [X] T044 [P] [US1] Create `src/ui/components/ControlPanel.tsx`: for each parameter a labelled slider plus number input (step 0.1, value shown with "1 decimal place"), a select for `choice` parameters, inline validation message from the store. Parameters with `control: "chart-handle"` get no slider here
- [X] T045 [P] [US1] Create `src/ui/components/FormulaBlock.tsx`: KaTeX-rendered formula and a symbol table (`symbol`, `meaning`), every symbol explained
- [X] T046 [P] [US1] Create `src/ui/components/WorkedExample.tsx`: renders the substituted steps (template engine output) through KaTeX
- [X] T047 [P] [US1] Create `src/ui/components/IntuitionText.tsx`: `react-markdown` with `remark-math` and `rehype-katex`
- [X] T048 [US1] Create `src/ui/components/ChartPanel.tsx`: picks the chart from the registry, shows the output values (labels, symbols, `decimals`) and a visible text summary from `chartSummary` with `role="img"` and `aria-label` on the chart. Depends on T043
- [X] T049 [US1] Create `src/ui/components/LessonLayout.tsx`: creates the lesson store when the lesson opens (so a refresh or direct link always starts at defaults), renders in order: title, `IntuitionText`, `ChartPanel` + `ControlPanel`, `FormulaBlock`, `WorkedExample`. Depends on T039, T044, T045, T046, T047, T048
- [X] T050 [US1] Create `src/ui/app/routes.tsx` with the route `#/lessons/:id` rendering `LessonLayout`, and use it in `src/ui/app/App.tsx`. Depends on T049

**Lesson content (content-only, no engine edits)**

- [X] T051 [P] [US1] Create `src/content/lessons/foundations/function-and-slope/lesson.json` and `intuition.md`: model `slope-of-curve`, chart `curve-tangent`, parameter `x` (range -3 to 3, step 0.1, default 1.0), choice `curve` (x², x³, sin x, default x²), variants for `formula`, `workedExample` and `chartSummary` keyed by `curve`
- [X] T052 [P] [US1] Create `src/content/lessons/foundations/loss/lesson.json` and `intuition.md`: model `line-loss`, dataset `loss-3`, chart `line-fit` with `handles: true`, parameters `steepness` (-3 to 3, default 1.0) and `height` (-5 to 5, default 0.0) both `control: "chart-handle"` and no `symbol` (w and b are not introduced yet), MSE formula with every symbol explained
- [X] T053 [P] [US1] Create `src/content/lessons/foundations/weight-and-bias/lesson.json` and `intuition.md`: model `line-loss`, dataset `weight-bias-4`, chart `line-fit` with `handles: false`, parameters `w` (-3 to 3, default 1.0) and `b` (-5 to 5, default 0.0) as sliders with symbols, formulas for `y = w·x + b` and MSE, worked example with the current w and b substituted

**Checkpoint**: T022 to T030 pass. Each of the three lessons works at its direct address, and quickstart.md US1 scenarios give the expected values. This is the MVP.

---

## Phase 4: User Story 2 - Browse and open lessons by topic (Priority: P2)

**Goal**: The home page lists lessons grouped under four topics, any lesson opens from the list, and the learner can
return. Empty topics show "coming soon".

**Independent Test**: Open `#/`, see Foundations with 3 lessons and Optimization, Models, Neural Networks as "coming soon". Open "Loss", use the back link to return, then open an unknown address and see the not-found page.

### Tests for User Story 2 (write first, they MUST fail)

- [X] T054 [P] [US2] Write `tests/component/lessonList.test.tsx`: D-01 (four topics in order, three lessons under Foundations, others "coming soon" without links) and D-02 (open a lesson from the list, then use the "back to list" link)
- [X] T055 [P] [US2] Write `tests/component/notFound.test.tsx`: D-18 (unknown lesson address shows the not-found message and a link to the list)
- [X] T056 [P] [US2] Write `tests/unit/content/extension.test.tsx` (renders, so `.tsx`): C-14 (a fixture lesson injected through `buildCatalog` under a temporary content root, reusing `line-loss` and `line-fit`, appears in the catalog and renders with no change to `src/sim`, `src/ui` or the engine)

### Implementation for User Story 2

- [X] T057 [P] [US2] Create `src/ui/components/LessonList.tsx`: topics from `topics.ts`, lessons from the catalog sorted by `order` (title and summary as links), topics with no lessons shown as "coming soon" without a link (FR-001, FR-002)
- [X] T058 [P] [US2] Create `src/ui/components/NotFound.tsx`: "lesson not found" message with a link back to the list (FR-020)
- [X] T059 [US2] Update `src/ui/app/routes.tsx` with route `#/` for `LessonList` and a catch-all route (and unknown lesson id) for `NotFound`, and add a "back to list" link in the lesson route (kept out of `LessonLayout`, which renders without a router in tests) (FR-003). Depends on T057, T058

**Checkpoint**: T054 to T056 pass, and FR-022 is demonstrated (a new lesson is content only).

---

## Phase 5: User Story 3 - Reset parameters to defaults (Priority: P3)

**Goal**: Every lesson has a reset action that restores all parameters (including the chosen curve) to defaults.

**Independent Test**: In Weight and bias set w = 2.0, b = 1.0, press Reset, and see w = 1.0, b = 0.0 with chart and numbers back at the default values. Reset on defaults changes nothing.

### Tests for User Story 3 (write first, they MUST fail)

- [ ] T060 [P] [US3] Write `tests/unit/sim/lessonStoreReset.test.ts`: B-06 (`reset()` after several changes restores every default, including the curve choice) and B-07 (`reset()` at defaults is a no-op)
- [ ] T061 [P] [US3] Write `tests/component/reset.test.tsx`: D-14 (reset after changes in each of the three lessons) and D-15 (reset at defaults)

### Implementation for User Story 3

- [ ] T062 [US3] Add `reset()` to `src/sim/lessonStore.ts`: restores every parameter to its declared default and recomputes outputs. Makes T060 pass
- [ ] T063 [US3] Add a "Reset" button to `src/ui/components/ControlPanel.tsx` calling `reset()` (it is a native `<button>` so it is keyboard operable), visible in all three lessons including Loss where parameters are chart handles. Makes T061 pass

**Checkpoint**: T060 and T061 pass, and reset also works from the keyboard.

---

## Phase 6: User Story 4 - Switch between light and dark mode (Priority: P3)

**Goal**: A toggle on every page switches light and dark, persists while navigating (in memory only), and keeps
charts, controls and text legible.

**Independent Test**: Toggle to dark on the list, open a lesson (still dark), change a parameter and press Reset (still dark), toggle back.

### Tests for User Story 4 (write first, they MUST fail)

- [ ] T064 [P] [US4] Write `tests/unit/sim/themeStore.test.ts`: B-12 (initial value follows `prefers-color-scheme`, `toggle()` flips it, value is held in memory only)
- [ ] T065 [P] [US4] Write `tests/component/themeToggle.test.tsx`: D-16 (toggle available on the list and on every lesson, `data-theme` changes, the mode survives navigation) and D-17 (Reset does not change the theme)
- [ ] T066 [P] [US4] Write `tests/unit/ui/paletteContrast.test.ts`: D-23 (computed contrast ratios between every palette token and each theme background meet WCAG AA for text and 3:1 for graphics)

### Implementation for User Story 4

- [ ] T067 [P] [US4] Create `src/sim/themeStore.ts`: Zustand store with `theme: 'light' | 'dark'`, initial value from `prefers-color-scheme`, `toggle()`. No persistence. Makes T064 pass
- [ ] T068 [P] [US4] Add the dark-theme variables (`[data-theme="dark"]`) to `src/ui/styles/tokens.css` and make `src/ui/charts/palette.ts` expose theme-specific Okabe-Ito values. Makes T066 pass
- [ ] T069 [US4] Create `src/ui/components/ThemeToggle.tsx` (native button with `aria-pressed` and a text label, sets `data-theme` on `<html>`) and render it in the header of `src/ui/app/App.tsx`. Depends on T067, T068. Makes T065 pass

**Checkpoint**: T064 to T066 pass, and charts remain legible in both themes.

---

## Phase 7: User Story 5 - Use lessons with keyboard only (Priority: P2)

**Goal**: All actions in all lessons work by keyboard alone, with visible focus, a logical focus order, and text
alternatives for every chart. Colour is never the only carrier of information.

**Independent Test**: With the mouse unplugged, go from the list to each lesson, change every parameter, reset, and toggle the theme. Run the axe scan on every page in both themes.

### Tests for User Story 5 (write first, they MUST fail)

- [ ] T070 [P] [US5] Write `tests/component/keyboardAccess.test.tsx`: D-19 (tab order in a lesson follows reading order: header, intuition, chart handles/controls, reset, formula) and D-20 (all controls in all three lessons reachable and operable using keyboard only)
- [ ] T071 [P] [US5] Write `tests/component/accessibility.test.tsx`: D-21 (vitest-axe scan of the list, each lesson and the not-found page, in both themes, no critical violations)
- [ ] T072 [P] [US5] Write `tests/component/chartAlternatives.test.tsx`: D-22 (each chart has a visible text summary that updates when a parameter changes, and the chart has `role="img"` with an accessible name) and D-24 (the tangent is dashed, errors have text labels, points are filled markers, so no information relies on colour alone)

### Implementation for User Story 5

- [ ] T073 [P] [US5] Add a visible `:focus-visible` indicator for all interactive elements, including SVG slider handles, to `src/ui/styles/app.css`, with sufficient contrast in both themes
- [ ] T074 [US5] Audit and fix accessible names, roles and DOM order in `src/ui/components/ControlPanel.tsx`, `src/ui/components/ChartPanel.tsx`, `src/ui/components/LessonLayout.tsx`, `src/ui/charts/SliderHandle.tsx`, `src/ui/charts/CurveTangentChart.tsx` and `src/ui/charts/LineFitChart.tsx` until T070, T071 and T072 pass. Do not add features that no lesson needs (skip links, shortcuts)

**Checkpoint**: T070 to T072 pass and SC-005 (keyboard only) holds for all three lessons.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Manual checks (E-01 to E-05), final verification and documentation.

- [ ] T075 [P] Run manual check E-01 (layout at 1024, 1280 and 1920 px, nothing overlaps or is cut off, SC-008) and record the result in `specs/001-lesson-framework-foundations/quickstart.md`
- [ ] T076 [P] Run manual check E-02 (drag a handle with the DevTools performance panel, frames stay near 60 fps, updates under 100 ms) and record the result in `specs/001-lesson-framework-foundations/quickstart.md`
- [ ] T077 [P] Run manual check E-03 (rendered contrast and colour-blind simulation for deuteranopia, protanopia, tritanopia, in both themes) and record the result in `specs/001-lesson-framework-foundations/quickstart.md`
- [ ] T078 [P] Run manual check E-04 (one screen-reader pass of a lesson: handle names, values and summary announced sensibly) and record the result in `specs/001-lesson-framework-foundations/quickstart.md`
- [ ] T079 Run manual check E-05 (`npm run build`, serve `dist/` from a static folder, a deep link and a refresh load the lesson at default values) and record the result in `specs/001-lesson-framework-foundations/quickstart.md`
- [ ] T080 Run the full gate: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` all pass, and confirm every test ID in `test-cases.md` (A1-A5, B, BT, C, D) is covered by an existing test file (coverage map at the end of `test-cases.md`)
- [ ] T081 [P] Confirm out-of-scope items (FR-021): no accounts, saved progress, training animation, gradient or history code, and no neural-network lesson exist in `src/` (YAGNI, Principle VI)
- [ ] T082 [P] Add a short `README.md` at the repository root with install, `dev`, `test`, `build` commands and a link to `specs/001-lesson-framework-foundations/quickstart.md`
- [ ] T083 SC-007 follow-up (not a code task): schedule the learner comprehension check with 5 test learners and record the outcome in `specs/001-lesson-framework-foundations/quickstart.md`

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: T001 gate first, then T002 → T003. T004 to T007 follow T003 in parallel.
- **Phase 2 (Foundational)**: Depends on Phase 1. Blocks all stories. Tests T008 to T010 first, then T011 to T021.
- **Phases 3 to 7 (stories)**: Each depends only on Phase 2, except where noted below.
- **Phase 8 (Polish)**: After all wanted stories are complete.

### Story dependencies

```text
Phase 1 Setup ──► Phase 2 Foundational ──► US1 (P1, MVP) ──┬──► US2 (P2)  ──┐
                                                            ├──► US3 (P3)    ├──► Phase 8 Polish
                                                            ├──► US4 (P3)    │
                                                            └──► US5 (P2) ◄──┘ (best after US2, US3, US4 for the full scan)
```

- **US1**: no dependency on other stories. Provides the lesson page, store and controls.
- **US2**: needs US1's `LessonLayout` for the back link only. The list itself is independent.
- **US3**: extends `lessonStore.ts` and `ControlPanel.tsx` from US1.
- **US4**: independent of US1 logic, extends `tokens.css`, `palette.ts` and `App.tsx`.
- **US5**: audits the output of US1 to US4. Run its tests last so the axe scan covers the list, the not-found page and both themes.

### Within each story

1. Tests first, confirm they fail for the right reason.
2. Core, then sim, then UI. A lower layer never imports a higher one.
3. Lesson content files after the engine pieces they use.
4. Story checkpoint before moving on.

### Parallel opportunities

- Phase 1: T004, T005, T006, T007 together.
- Phase 2: T008, T009, T010 together. T011, T012, T013, T014, T018, T019, T020 together.
- US1 tests: T022 to T030 all together. US1 core: T031, T032, T034 together. Datasets T037, T038 together. Charts T040, T041 together. Components T044 to T047 together. Lessons T051, T052, T053 together.
- US2 to US5 test tasks are all `[P]` within their phase. After US1 is finished, US2, US3, US4 can be built by different people at the same time (US3 touches `lessonStore.ts` and `ControlPanel.tsx`, so avoid merging it at the same moment as US5's audit).

### Parallel example: User Story 1

```text
# Tests together (different files)
T022 tests/unit/core/curves.test.ts
T023 tests/unit/core/linear.test.ts, loss.test.ts
T024 tests/unit/core/models.test.ts
T025 tests/unit/sim/lessonStore.test.ts
T026 tests/unit/content/lessons.test.ts
T027-T030 tests/component/*.test.tsx

# Core modules together
T031 src/core/curves.ts      T032 src/core/linear.ts      T034 src/core/models/slopeOfCurve.ts

# Lesson content together
T051 function-and-slope     T052 loss     T053 weight-and-bias
```

---

## Implementation Strategy

### MVP first (User Story 1 only)

1. Phase 1 (with the T001 approval gate) and Phase 2.
2. Phase 3 (US1): tests first, then core, sim, UI, content.
3. **Stop and validate**: run the quickstart US1 scenarios and show the three lessons at their direct addresses.

### Incremental delivery

1. Setup + Foundational.
2. US1 (MVP: three working lessons).
3. US2 (home page list, back link, not-found).
4. US3 (reset) and US4 (theme) in any order.
5. US5 (accessibility audit) once the pages it scans exist.
6. Polish (manual checks E-01 to E-05, full gate).

### Notes

- Commit on the feature branch only (Principle IX). Commit after each task or logical group, for example by running `/speckit-git-commit`.
- If branch creation, the current branch or a dirty working tree is wrong at any point, stop and tell the user.
- Never fake or hard-code values for charts (Principle III). Every number shown must come from `src/core`.
