---
description: "Task list for gradient descent training playback"
---

# Tasks: Training Playback for Gradient Descent

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), and [quickstart.md](./quickstart.md).

**Tests are required**: Constitution Principle V requires a complete test-case inventory and
explicit user approval **before implementation begins**. For each phase, write the approved tests
first and demonstrate the relevant behavior fails before implementing it. Present the applicable
test cases for explicit approval before implementing each task. If an earlier, already
tested shared task legitimately satisfies a later test, record that it was already green rather
than deliberately breaking working behavior. Run the smallest relevant tests after each
implementation task; do not mark a failing or unverified task complete. Numerical
tests state their tolerances, and UI tests verify real parameter-to-chart connections.

**Format**: `- [ ] Tnnn [P?] [USn?] Description with paths`. `[P]` means no dependency on another
unfinished task in the same parallel group and no shared file writes. Story labels appear only in
story phases. Paths are relative to the repository root.

## Phase 1: Setup and Approval

**Purpose**: Establish test-first approval and independent numerical references.

- [ ] T001 Create `specs/002-gradient-descent-playback/test-cases.md` with identifiable, expected-result cases for every task and FR/SC: all three landscapes, ≥10 independent reference runs and their displayed values, validation, replay/selectable retained branches, overflow/preview, 1,001 distinct states, charts, accessibility, performance and regressions; include the tolerances and hand values in `specs/002-gradient-descent-playback/research.md` and `specs/002-gradient-descent-playback/quickstart.md`.
- [ ] T002 Present `specs/002-gradient-descent-playback/test-cases.md` to the user and obtain explicit approval before any implementation or dependency change; record approval in that file. Stop if approval is withheld.
- [ ] T003 Add runtime `d3-contour` and matching `@types/d3-contour` development dependency to `package.json` and update `package-lock.json` with the package manager; run the existing dependency and build checks after the manifest change.
- [ ] T004 Create `tests/fixtures/training-reference-values.json` with at least 10 independently hand- or NumPy-calculated runs for all landscapes, including at least four 1D convex, three non-convex and three 2D finite display-ready cases reachable through lesson controls; cover both signs, simultaneous 2D updates, changing rates, stationary and finite overflow boundary cases. Record provenance and `1e-10 + 1e-10 * abs(reference)` core tolerance alongside the fixtures.

**Checkpoint**: Approval is recorded; no implementation began before approval.

## Phase 2: Foundational Training Contracts

**Purpose**: Pure math interfaces, immutable history, validated content and compatible formatting
shared by all stories. These tasks block the story phases.

### Tests first

- [ ] T005 [P] Write `tests/unit/core/trainingTypes.test.ts` for the foundational adapter/landscape contract and dimensional compatibility using a test-only adapter; assert core imports no UI, state, timer or DOM dependencies. Actual gradient-descent behavior is tested first in T016.
- [ ] T006 [P] Write `tests/unit/sim/trainingHistory.test.ts` for the invariants “Index `0..1000`; immutable finite weights, finite loss and finite gradient at those weights”, “`snapshots.length = transitions.length + 1`”, and “at most 1,001 snapshots and 1,000 transitions per branch”, including exact stored rates, retained branches and no rounding.
- [ ] T007 [P] Write `tests/unit/content/trainingSchema.test.ts` for the training discriminator and unchanged static lessons, injecting test-only registered adapters/landscapes; exercise invalid dimensions, duplicated IDs, non-finite/invalid ranges, grid defaults/presets, negative rate, missing bindings/symbols and unknown adapter/landscape/chart with explicit errors.
- [ ] T008 [P] Write `tests/unit/sim/trainingFormat.test.ts` for six decimals in the planned magnitude range, scientific notation outside it, negative zero, real unrounded operands, `≈` equations, precision bounds, and the `0.0005` rate not displaying as zero.
- [ ] T073 [P] Write `tests/component/ControlPanelPrecision.test.tsx` before T014 to verify a fine-precision parameter shows `0.0005`, preserves existing controls and connects parameter changes to the chart; run it and observe the precision assertion fail before implementing T014.

### Implementation

- [ ] T009 Define pure landscape and algorithm-adapter contracts and dimensional compatibility guard in `src/core/training/types.ts`: dimensions one or two, finite evaluation/gradient, immutable snapshots, typed non-finite results, and simultaneous per-coordinate updates without UI/state imports.
- [ ] T010 Implement immutable run/history helpers in `src/sim/training/history.ts` and `src/sim/training/types.ts` with the exact per-branch snapshot and transition invariants in T006; preserve binary64 values, retained branches and never snap computed weights.
- [ ] T011 Extend `src/sim/content/schema.ts` for backwards-compatible `kind: training` content and quoted constraints “finite ordered ranges, grid-aligned defaults and presets, non-negative rate” and “one or two” ordered weight parameters; preserve existing static schemas.
- [ ] T012 Extend `src/sim/content/loader.ts` and add `src/sim/training/registry.ts` to validate adapter/landscape/chart dimension, bindings, template references, required symbol explanations, unique IDs and registered names; retain existing catalog behavior and surface field-specific errors.
- [ ] T013 Extend `src/sim/template.ts` and `src/sim/lessonView.ts` for the planned six-decimal/scientific training formatting and selected-snapshot context, while preserving existing lesson formatting and template behavior.
- [ ] T014 Update `src/ui/components/ControlPanel.tsx` to support the declared parameter precision rather than always one decimal; preserve existing controls and explicitly show `0.0005` correctly.
- [ ] T015 Run the focused T005–T008 and T073 suites plus `tests/unit/content/lessons.test.ts`, `tests/unit/sim/loader.test.ts`, `tests/unit/sim/template.test.ts` and `tests/unit/sim/layerBoundaries.test.ts`; fix regressions before beginning US1.

**Checkpoint**: Valid training content can coexist with existing lessons; foundational tests pass.

## Phase 3: User Story 1 — Watch 1D Gradient Descent (P1, MVP)

**Goal**: Start a convex run and watch real steps using play, pause, forward, backward, reset and
speed, with a live loss chart.

**Independent test**: Open the 1D lesson, play and pause, step forward/back, change speed and
reset; verify the marker and loss chart follow real values, including `-4 -> -2.8` at rate `0.2`.

### Tests first

- [ ] T016 [P] [US1] Write `tests/unit/core/gradientDescent.test.ts` for convex loss `0.5*(x-2)^2`, exact gradient `x-2`, simultaneous formula, NaN/Infinity in inputs, gradients, products, updates and resulting loss/gradient, explicit unexpected errors, edge values and independent references from `tests/fixtures/training-reference-values.json`.
- [ ] T017 [P] [US1] Write `tests/unit/sim/trainingPlayback.test.ts` using fake timers for play/pause, one-step forward/back, speed 1/2/4 steps per second, reset, stationary criterion `max(abs(gradient)) <= 1e-6`, zero-rate no-progress, and timer cleanup on disposal; add `tests/unit/sim/trainingExtension.test.ts` proving a test adapter can reuse generic playback/history.
- [ ] T018 [P] [US1] Write `tests/component/TrainingPlayback.test.tsx` for controls, lesson order, live chart/number updates, chosen-start reset, speed without accidental play, step-0 boundary, keyboard operation and leaving the route without background updates. Compare every displayed weight, loss, gradient and update against at least four convex finite reference cases from T004 using the stated display tolerance.
- [ ] T019 [P] [US1] Write `tests/component/TrainingCharts1D.test.tsx` proving the loss curve and loss-vs-step chart render computed values, synchronized markers/cursors, text summaries, and no fabricated/clamped data.

### Implementation

- [ ] T020 [US1] Implement the convex landscape and exact gradient in `src/core/training/landscapes.ts`, and finite-safe simultaneous gradient-descent update in `src/core/training/gradientDescent.ts`; export through `src/core/index.ts`.
- [ ] T021 [US1] Implement the generic training store in `src/sim/training/store.ts` and gradient-descent adapter registration in `src/sim/training/registry.ts`; expose finite snapshots, current selection, step/forward/back/reset, stationary stop and no-progress message without coupling history to a specific optimizer.
- [ ] T022 [US1] Implement the cancellable single-shot playback scheduler in `src/sim/training/scheduler.ts`; use 1, 2 and 4 steps/second, prevent duplicate/stale callbacks and dispose on navigation or unmount.
- [ ] T023 [US1] Implement computed SVG curve/path and loss-vs-step views in `src/ui/charts/TrainingCurveChart.tsx` and `src/ui/charts/LossHistoryChart.tsx`; use finite data and text alternatives, no per-step DOM explosion.
- [ ] T024 [US1] Implement accessible playback, start/rate controls and speed controls in `src/ui/components/TrainingControls.tsx`; wire input validation and precision to the training store.
- [ ] T025 [US1] Create `src/ui/components/TrainingLessonLayout.tsx` and update `src/ui/components/LessonLayout.tsx` to dispatch the validated training variant while retaining existing intuition → demo → formula → worked-example order and existing static lesson behavior.
- [ ] T026 [US1] Add `src/content/lessons/optimization/gradient-descent-1d/lesson.json` and `src/content/lessons/optimization/gradient-descent-1d/intuition.md` with the convex function, start `-4`, range `[-5,5]`, start step `0.1`, rate range `[0,4]`, rate step `0.0005` and presets from research; register it through the existing catalog.
- [ ] T027 [US1] Run T016–T019 plus `tests/component/lessonLayout.test.tsx`, `tests/component/lessonList.test.tsx` and `tests/component/reset.test.tsx`; confirm the independent US1 journey before proceeding.

## Phase 4: User Story 2 — Inspect and Scrub History (P1)

**Goal**: Inspect any recorded state, replay existing steps and branch only after a changed-rate
continuation, retaining up to 1,000 updates.

**Independent test**: Run 20 steps, seek to 7, compare weights/loss/gradient/outgoing calculation
to a reference; replay unchanged, then change rate at an earlier state and verify both branches
remain selectable and scrubbable.

### Tests first

- [ ] T028 [P] [US2] Write `tests/unit/sim/trainingTimeline.test.ts` for exact snapshot restoration, original rates across a variable-rate replay, seek bounds, pause-on-seek, pending same/different rate edits, retained successful branches, failed-branch preservation, branch selection including branch-specific stop state, and all 1,001 real states per branch.
- [ ] T029 [P] [US2] Write `tests/component/TrainingInspection.test.tsx` for keyboard/pointer scrub and branch selection, pause on branch selection, selected marker/cursor/readouts, stored versus preview outgoing update, simultaneous formulas, `≈` formatting and exact back/forward display restoration on both branches.
- [ ] T030 [P] [US2] Write `tests/component/TrainingLimit.test.tsx` using the real convex computation from `-4` at rate `0.0005`: retain indices 0 through 1000, stop at 1,000 updates, report the limit, and compare every distinct displayed state after forward/backward navigation with its first display. Separately test zero-rate no-progress, scrub/replay/reset and stored values.

### Implementation

- [ ] T031 [US2] Extend `src/sim/training/store.ts` and `src/sim/training/history.ts` with bounds-checked seek, original-rate replay, pending rate edits, atomic successful branching, selectable retained prior branches, failure-preserved futures and the 1,000-update cap per branch.
- [ ] T032 [US2] Create `src/ui/components/TrainingTimeline.tsx` with a labelled keyboard-operable range input showing current/total steps and a labelled branch selector; pause on scrub or branch selection and synchronize the selected snapshot with both charts.
- [ ] T033 [US2] Create `src/ui/components/TrainingInspection.tsx` and update `src/ui/components/WorkedExample.tsx` and `src/sim/lessonView.ts` to show selected weights, loss, gradient and per-coordinate recorded or labelled preview calculations from unrounded values, including a distinct pending-rate preview.
- [ ] T034 [US2] Update `src/ui/components/TrainingLessonLayout.tsx` and `src/ui/charts/LossHistoryChart.tsx` to show the full selected branch and cursor, retain visible future until successful branching, provide access to every retained branch, and render all selected-state summaries consistently.
- [ ] T035 [US2] Run T028–T030 plus `tests/component/TrainingPlayback.test.tsx`; verify 1,001-state exact restore and branch semantics.

## Phase 5: User Story 3 — Compare Learning Rates (P2)

**Goal**: Change rates during playback or select presets without resetting, and explain observed
slow, falling or rising loss using the actual run.

**Independent test**: From each lesson's default, reset between presets and compare ten-update
loss ratios to `research.md`; change a preset during play and verify the next new transition.

### Tests first

- [ ] T036 [P] [US3] Write `tests/unit/sim/trainingPresets.test.ts` for rates `0.0005`, `0.2`, `4` in 1D; ten-step small ratio `[0.9,1)`, good `<0.8`, large `>1`; mid-run edits, recorded rates, validation and pending branch behavior.
- [ ] T037 [P] [US3] Write `tests/component/TrainingPresets.test.tsx` for three named presets, play/pause preservation, no reset, actual-data trend notes, zero-baseline handling and displaying `0.0005` accurately.

### Implementation

- [ ] T038 [US3] Extend `src/sim/training/store.ts` for rate/preset edits before, during and after play, preserving selection/play state and per-transition rates; reject negative/non-numeric values and message clamped finite out-of-range inputs.
- [ ] T039 [US3] Implement actual-history trend classification in `src/sim/training/trend.ts`: before ten transitions report insufficient evidence; then use the planned loss-ratio thresholds and safe zero-baseline comparison; distinguish alternating motion and do not infer behavior from preset identity.
- [ ] T040 [US3] Add preset buttons, current rate and observed trend text to `src/ui/components/TrainingControls.tsx` and `src/ui/components/TrainingLessonLayout.tsx` with keyboard labels and non-flooding announcements.
- [ ] T041 [US3] Verify all 1D preset values and explanatory symbols in `src/content/lessons/optimization/gradient-descent-1d/lesson.json`, then run T036–T037 and the US1–US2 focused suites in `tests/`.

## Phase 6: User Story 4 — Divergence and Recovery (P2)

**Goal**: Safely report non-finite updates and preserve every earlier finite state.

**Independent test**: Play a large-rate run until overflow; verify the attempted step is reported,
playback stops, prior history remains inspectable, and rate change or reset permits recovery.

### Tests first

- [ ] T042 [P] [US4] Write `tests/unit/core/trainingFinite.test.ts` for NaN/Infinity in inputs, gradients, products, updates, resulting loss and gradient; ensure no partial snapshot/transition is accepted and unrelated exceptions are surfaced.
- [ ] T043 [P] [US4] Write `tests/unit/sim/trainingDivergence.test.ts` for non-finite attempted step, paused playback, retained prior/future history on failed branch, unavailable preview without mutation, and rate-change/reset recovery including retry at the last valid divergence tip.
- [ ] T044 [P] [US4] Write `tests/component/TrainingDivergence.test.tsx` for clear divergence and step messages, no `NaN`/`Infinity` in charts/readouts, finite off-screen indicators, scrub after failure and valid continuation.

### Implementation

- [ ] T045 [US4] Harden `src/core/training/gradientDescent.ts` and `src/core/training/landscapes.ts` to check every intermediate/result for finiteness and return typed divergence only for non-finite arithmetic; preserve explicit programming/content errors.
- [ ] T046 [US4] Extend `src/sim/training/store.ts` and `src/sim/training/history.ts` for atomic failed updates, attempted step number, retained history, error clearing and safe preview behavior.
- [ ] T047 [US4] Add accessible divergence/unavailable-preview messages and finite off-screen rendering to `src/ui/components/TrainingInspection.tsx`, `src/ui/charts/TrainingCurveChart.tsx` and `src/ui/charts/LossHistoryChart.tsx`.
- [ ] T048 [US4] Run T042–T044 plus `tests/unit/sim/trainingPlayback.test.ts`; verify the large 1D preset eventually detects a non-finite attempt rather than merely reaching a finite plotting boundary.

## Phase 7: User Story 5 — Non-Convex Starting Points (P2)

**Goal**: Compare different starting points on a non-convex curve with unequal minima.

**Independent test**: Use rate `0.08` from starts `-0.5` and `0.5` and verify distinct stationary
weights and losses against the independent values in `research.md`.

### Tests first

- [ ] T049 [P] [US5] Write `tests/unit/core/nonconvexLandscape.test.ts` for `L=(x²-1)²+0.2x+0.3`, exact gradient `4x(x²-1)+0.2`, reference minima, both signs, non-finite handling and rate-dependent basins.
- [ ] T050 [P] [US5] Write `tests/component/NonconvexLesson.test.tsx` for pointer/keyboard/typed negative starts, restart to step 0, unequal minima, synchronized true curve/path and each preset's ten-step threshold. Compare every displayed weight, loss, gradient and update against at least three non-convex finite reference cases from T004 using the stated display tolerance.

### Implementation

- [ ] T051 [US5] Add the non-convex landscape and exact gradient to `src/core/training/landscapes.ts` and register it in `src/sim/training/registry.ts`, reusing the generic playback contract.
- [ ] T052 [US5] Extend `src/ui/charts/TrainingCurveChart.tsx` with draggable start marker and keyboard-equivalent input, clipping only drawing when trained weights leave the viewport.
- [ ] T053 [US5] Add `src/content/lessons/optimization/gradient-descent-nonconvex/lesson.json` and `src/content/lessons/optimization/gradient-descent-nonconvex/intuition.md` with start `0.5`, range `[-2,2]`, preset rates `0.0005/0.08/0.5`, formula symbols and live worked example.
- [ ] T054 [US5] Run T049–T050 plus `tests/component/TrainingPlayback.test.tsx` and `tests/component/TrainingDivergence.test.tsx`; confirm changing the start pauses and resets without snapping computed weights.

## Phase 8: User Story 6 — Gradient Descent on a 2D Surface (P3)

**Goal**: Render an actual contour map and train two weights with the same playback, history,
presets, inspection and divergence behavior.

**Independent test**: From `(4,2)` at rate `0.15`, verify the first state `(3.4,-1)`, both
gradient components and outgoing calculations, and synchronized contour and loss charts.

### Tests first

- [ ] T055 [P] [US6] Write `tests/unit/core/twoDimensionalLandscape.test.ts` for `L=0.5*(x²+10y²)`, gradient `(x,10y)`, simultaneous updates, independent fixture runs, stationary and overflow cases.
- [ ] T056 [P] [US6] Write `tests/unit/ui/trainingContours.test.ts` for finite sampled grid values and data-derived isolines, coordinate/axis mapping, cached geometry, extreme finite off-screen values and no non-finite SVG coordinates.
- [ ] T057 [P] [US6] Write `tests/component/Training2D.test.tsx` for two-weight inspection, pointer/touch start drag, separate keyboard coordinate controls, playback/timeline/presets/branch/divergence reuse, responsive accessible summaries and ten-step preset thresholds. Compare every displayed weight, loss, gradient and update against at least three 2D finite reference cases from T004 using the stated display tolerance; add `tests/component/TrainingCatalogRegression.test.tsx` for all three Optimization lessons and existing catalog, routes and theme behavior.

### Implementation

- [ ] T058 [US6] Add the 2D bowl and exact gradient to `src/core/training/landscapes.ts` and register dimensional compatibility in `src/sim/training/registry.ts`; compute both updated weights from the same old snapshot.
- [ ] T059 [US6] Implement cached sampled-grid contours in `src/ui/charts/trainingContours.ts` using `d3-contour`, derived only from core landscape evaluations and with overflow-safe scaling.
- [ ] T060 [US6] Create `src/ui/charts/TrainingContourChart.tsx` for computed isolines, selected path/marker, pointer/touch start setting, accessible alternatives and explicit out-of-view state; keep contour geometry stable across scrubs.
- [ ] T061 [US6] Extend `src/ui/components/TrainingControls.tsx`, `src/ui/components/TrainingInspection.tsx` and `src/ui/components/TrainingLessonLayout.tsx` for two separately labelled coordinate controls and both real gradient/update calculations.
- [ ] T062 [US6] Add `src/content/lessons/optimization/gradient-descent-2d/lesson.json` and `src/content/lessons/optimization/gradient-descent-2d/intuition.md` with start `(4,2)`, axes `[-5,5]`, rates `0.0005/0.15/0.4`, formula and all symbol explanations.
- [ ] T063 [US6] Run T055–T057 plus `tests/component/TrainingPlayback.test.tsx` and `tests/component/NonconvexLesson.test.tsx`; verify no 3D view or unrelated optimizer was added.

## Phase 9: Polish and Cross-Cutting Validation

**Purpose**: Verify measured performance, accessibility, integration and project quality gates.

- [ ] T064 Run and verify `tests/component/TrainingCatalogRegression.test.tsx` covering three Optimization lessons, the original three Foundation lessons, topic order, static route behavior, theme, direct hash links and refresh-to-default.
- [ ] T065 Run `tests/unit/sim/trainingExtension.test.ts` and verify that an additional lesson using a registered adapter/landscape is content-only and a test adapter can reuse playback/history without modifying `src/sim/training/store.ts`.
- [ ] T066 Run and record desktop and tablet browser control-to-visible-update measurements in `specs/002-gradient-descent-playback/quickstart.md` for real 1,001-state scrub and drag; record device, refresh rate, sample count and worst latency, requiring every measured update under 100 ms.
- [ ] T067 Capture and record actual rendering traces in `specs/002-gradient-descent-playback/quickstart.md` during sustained 1,001-state interaction on desktop and tablet-class browsers; verify 60 fps, and do not use handler timeout or jsdom as a proxy.
- [ ] T068 If T066 or T067 identifies computation blocking the UI, implement and test the required serializable worker boundary in `src/sim/training/worker.ts` and `tests/unit/sim/trainingWorker.test.ts` with revision IDs, stale-result cancellation and surfaced errors; otherwise record the measured reason no worker is needed in `specs/002-gradient-descent-playback/quickstart.md`.
- [ ] T069 Run and record keyboard, both-theme axe, 1024/1280/1920 layout, color-blind simulation and real screen-reader checks in `specs/002-gradient-descent-playback/quickstart.md`; explicitly leave any unavailable human/device check pending rather than marking it passed.
- [ ] T070 Update `README.md` for Optimization lessons, playback, adding a training lesson and verification commands; retain the existing static-site and layer documentation.
- [ ] T071 Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` against `package.json`; record counts, failures or warnings in `specs/002-gradient-descent-playback/quickstart.md` and resolve feature-caused failures.
- [ ] T072 Schedule and record the five-learner SC-007 comprehension study in `specs/002-gradient-descent-playback/quickstart.md`; do not claim the study passed until at least four learners meet its criterion.

## Dependencies & Execution Order

### Phase dependencies

```text
Phase 1 (approval and setup) → Phase 2 (shared foundations) → US1 (MVP)
US1 → US2 → US3
US1 + US2 → US4
US1 + US2 → US5
US1 + US2 + US3 + US4 → US6
US1 + US2 + US3 + US4 + US5 + US6 → Phase 9 (polish)
```

US2 depends on US1's real run; US3 depends on US2's replay/branch semantics. US4 and US5 can be
tested after US1–US2 but their implementation touches shared files, so do not edit those files
concurrently. US6 integrates the completed common playback, preset and divergence behavior.
No milestone is complete until its focused tests pass and its independent scenario works.

### Parallel execution examples

- Foundational: T005, T006, T007, T008 and T073 write separate tests after T001–T004; T073 must
  fail on the precision behavior before T014. Implementation
  follows their prerequisite tests and shared-file ordering.
- US1: T016–T019 are independent test files; T020–T026 are sequenced where integration requires it.
- US2: T028–T030 are independent test files; the store and UI tasks follow their dependencies.
- US3: T036 and T037 are independent test files; T038–T040 share integration state and are sequential.
- US4: T042–T044 are independent test files; implement finite math before state/UI recovery.
- US5: T049 and T050 are independent test files; landscape registration precedes lesson integration.
- US6: T055–T057 are independent test files; add the landscape before contour/UI integration.

## Implementation Strategy

1. Complete T001–T015 and obtain test-case approval before writing any implementation.
2. Deliver US1 as the smallest runnable MVP; US2 is also P1 and must follow to complete the
   required history/inspection experience.
3. Add US3–US5, then US6; preserve earlier lessons and run focused tests after each code task.
4. Finish cross-cutting browser, accessibility, full-gate and learner-study checks honestly.
   The optional worker task is conditional on measured blocking; unperformed human checks stay open.
