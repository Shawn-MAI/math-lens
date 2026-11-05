# Test Cases: Gradient Descent Playback

**Status**: Approved on 2026-11-05. The user authorized automatic approval for all listed task
cases; implementation remains test-first and each task must be validated.

## Numerical references

Reference values below are calculated independently by substituting the listed inputs into the
loss and gradient formulas in [research.md](./research.md), then applying
`next = old - rate * gradient`. The rate is applied to every coordinate simultaneously.
Compare finite core results using `abs(actual - reference) <= 1e-10 + 1e-10 * abs(reference)`.
Display comparisons allow at most `5e-7` absolute error for fixed decimals or `5e-7` relative error
for scientific notation, plus a small binary floating-point allowance. State any different
tolerance in the individual test. These are references, not chart data.

| Case | Landscape | Start | Rate | Initial loss | Initial gradient | Next weights | Next loss |
|---|---|---|---:|---:|---|---|---:|
| N01 | Convex 1D | `-4` | `0.2` | `18` | `-6` | `-2.8` | `11.52` |
| N02 | Convex 1D | `0` | `0.5` | `2` | `-2` | `1` | `0.5` |
| N03 | Convex 1D | `4` | `0.5` | `2` | `2` | `3` | `0.5` |
| N04 | Convex 1D | `2` | `0.2` | `0` | `0` | `2` | `0` |
| N05 | Non-convex 1D | `-1` | `0.1` | `0.1` | `0.2` | `-1.02` | `0.09763216` |
| N06 | Non-convex 1D | `0` | `0.1` | `1.3` | `0.2` | `-0.02` | `1.29520016` |
| N07 | Non-convex 1D | `1` | `0.1` | `0.5` | `0.2` | `0.98` | `0.49756816` |
| N08 | Convex 2D | `(4, 2)` | `0.15` | `28` | `(4, 20)` | `(3.4, -1)` | `10.78` |
| N09 | Convex 2D | `(1, -1)` | `0.1` | `5.5` | `(1, -10)` | `(0.9, 0)` | `0.405` |
| N10 | Convex 2D | `(-2, 1)` | `0.1` | `7` | `(-2, 10)` | `(-1.8, 0)` | `1.62` |

N04 is a stationary state: a pure-step preview yields the shown values, but playback stops at
step 0 rather than performing the update. Display tests cover each weight, loss, gradient and
update operand/result using the corresponding four convex, three non-convex and three 2D cases.
Separate approved fixtures cover multiple steps, rate edits, flat points and overflow.

## Setup and foundation

| Case | Tasks | Inputs and expected result |
|---|---|---|
| F01 | T001, T002 | Inventory covers each task, FR and applicable SC with expected outcomes and tolerances. Explicit approval is recorded; no implementation or dependency change occurs before approval. Approval of the applicable cases is also obtained before each implementation task. |
| F02 | T003 | Add `d3-contour` and matching types using npm. Dependency checks, typecheck and build succeed; existing lesson behavior remains unchanged. |
| F03 | T004 | Independent hand/NumPy fixture values agree with N01–N10 and include multi-step, changed-rate and overflow cases with documented provenance and tolerance. |
| F04 | T005, T009 | A one- or two-dimensional test adapter accepts a matching landscape; mismatched dimensions are rejected. Core dependency checks reject UI, state, timer and DOM imports. |
| F05 | T006, T010 | Each branch retains immutable, finite snapshots and exact transition rates; snapshots equal transitions plus one, and neither exceeds 1,001 snapshots or 1,000 transitions. Shared prefixes never mutate either branch. |
| F06 | T007, T011, T012 | Valid training content and original static lessons load. Duplicate IDs, unknown bindings/adapters/landscapes/charts, mismatched dimensions, invalid ranges, non-finite values, off-grid presets and unexplained symbols produce explicit field-specific errors. |
| F07 | T008, T013 | Six-decimal and scientific formatting follow the stated thresholds, preserve unrounded operands, normalize negative zero and show `0.0005` correctly. Selected-snapshot template context changes when selection changes; existing static contexts and formatting remain unchanged. Write and observe the selected-context test fail before T013. |
| F08 | T073, T014 | A component with a `0.0005` parameter displays `0.0005` in its value and accessible value text; changing it updates the connected chart. Existing coarse-precision controls retain their behavior. Observe the precision assertion fail before T014. |
| F09 | T015 | Run the foundational suites including F07 and F08 and the existing content, loader, template and layer-boundary suites. All pass before US1 begins. |
| F10 | Project setup | Git ignores generated `build/` output; ESLint ignores generated `build/` and minified JavaScript while preserving existing source checks. Verify these rules before continuing. |

## Playback and history

| Case | Tasks | Inputs and expected result |
|---|---|---|
| P01 | T016, T020 | N01–N04 match pure loss, gradient and simultaneous-update references. Invalid and non-finite inputs/intermediates cannot produce an accepted partial transition; unexpected errors remain explicit. |
| P02 | T017, T021, T022 | Fake-timer playback advances exactly once per scheduled tick at 1, 2 and 4 steps/second; pause, speed change and disposal cancel stale work, and changing speed while paused does not play. A test adapter reuses playback without changing the engine. |
| P03 | T018, T024, T025, T026, T027 | Open the 1D lesson, choose start and rate, play, pause, step and reset. The selected marker, readouts and worked update show N01–N04 accurately, with intuition → demo → formula → example order and keyboard operation. Include the minimal selected-state update display in US1 before T027; T033 subsequently extends it for recorded/pending historical updates. |
| P04 | T019, T023 | Curve and loss-history paths are derived from computed finite values; marker and cursor follow the selected snapshot, summaries agree, and no fabricated or clamped weight is presented as actual data. |
| P05 | T028, T031 | Record 20 real updates, seek to 7, and replay with no edit: every stored snapshot and its recorded rate is identical. Bounds are enforced, scrubbing pauses playback, and all 1,001 states can be retained. |
| P06 | T028, T029, T031, T032, T033, T034, T035 | At an earlier state change the rate. Before advancing, show both recorded transition and separate preview. A successful step selects a new branch and leaves the original selectable and unchanged; switch branches via keyboard, scrub each future, and compare stored values exactly. |
| P07 | T028, T029, T031, T032 | Configure branch A at `0.2` and branch B at `0.4`. Switching to A pauses and restores A's selected index, terminal status and last configured rate `0.2`; switching back restores B's corresponding state and `0.4`. Clear pending edits on selection and replay recorded transitions with their original rates. |
| P08 | T028, T031, T043, T046 | Force a non-finite attempted branch step: no branch or partial transition is created, playback pauses with the attempted step, and the original future remains selectable and exact. |
| P09 | T029, T033 | The selected weights, loss, gradient and outgoing update use the same unrounded snapshot. Recorded transitions show their actual rate; an unperformed update is labelled preview; rounded equations use `≈`. |
| P10 | T030, T031, T035 | From `-4` at `0.0005`, perform 1,000 actual updates. Record each displayed state, then navigate forward and backward across every index: all displayed values are identical to the first display. The limit message appears; reset and earlier-state branching remain usable. |
| P11 | T017, T021, T030 | A non-stationary point at zero rate is labelled no progress and can reach the limit. A point with maximum absolute gradient at most `1e-6` stops as stationary, without claiming it is a minimum. |

## Rates, divergence and landscapes

| Case | Tasks | Inputs and expected result |
|---|---|---|
| R01 | T036, T037, T038, T040, T041 | Presets set the lesson's small, good and large rates without resetting selection or changing play/pause. A mid-run change is used on the next new transition; existing transitions retain their rates. Invalid input is rejected or clamped with the specified message. |
| R02 | T036, T037, T039, T040, T041 | From each default start, compare ten actual updates: small loss ratio is `[0.9, 1)`, good is `< 0.8`, and large is `> 1`. Before ten transitions report insufficient evidence; notes derive from data, handle a zero baseline and distinguish alternating motion. |
| R03 | T042, T045 | Inject NaN/Infinity into inputs, gradient, product, updated weight, resulting loss and resulting gradient. Every non-finite attempt yields typed divergence with no partial state; unrelated exceptions are surfaced. |
| R04 | T043, T044, T046, T047, T048 | A large-rate run stops on non-finite arithmetic, identifies the attempted step, displays no `NaN` or `Infinity`, and retains all finite history. Rate change clears the error and permits retry from the last valid tip; reset also recovers. A failed preview alone does not stop or mutate playback. |
| R05 | T049, T050, T051, T052, T053, T054 | N05–N07 match the non-convex function and gradient. At the good rate `0.08`, starts `-0.5` and `0.5` reach distinct stationary valleys near the references in research; at rate `0.5` divergence is handled instead of promising either valley. Pointer, keyboard and negative typed starts reset to step 0 without snapping computed weights. |
| R06 | T055, T057, T058, T061, T062, T063 | N08–N10 match both weights, loss, both gradients and both simultaneous updates; `(4, 2)` at `0.15` reaches `(3.4, -1)`. Playback, branches, presets and divergence work in 2D without adding 3D. |
| R07 | T056, T059, T060 | Contours derive from finite loss samples, use the correct coordinate axes and cache static geometry. Finite off-screen coordinates are labelled rather than replaced; no non-finite SVG coordinates are emitted. Pointer/touch and separate keyboard controls set the same start. |

## Cross-cutting validation

| Case | Tasks | Inputs and expected result |
|---|---|---|
| X01 | T057, T064 | Three Optimization lessons and the original Foundation lessons appear in the correct catalog. Existing routes, refresh-to-default, direct hash links and both themes remain functional. |
| X02 | T017, T065 | A test adapter uses the existing history and playback unchanged; a new lesson using registered bindings is content-only. Unknown adapters fail explicitly. |
| X03 | T066, T067, T068 | On desktop and tablet-class browsers, measure actual visible-update latency for controls, 1,001-state scrub/drag and switching between multiple retained histories; every measured update is under 100 ms. Record device, refresh rate, sample count and worst latency. Browser traces sustain 60 fps; if heavy computation blocks the UI, test the serializable worker, cancellation, stale replies and surfaced errors. |
| X04 | T069 | At 1024, 1280 and 1920 px, keyboard-only operation includes branch selection and both 2D coordinates; both themes pass axe, charts have text alternatives, and colour-blind and human screen-reader checks are recorded. Unavailable checks remain pending. |
| X05 | T070, T071 | README documents the new lessons, playback, lesson extension and verification. Lint, typecheck, full test suite and build pass; feature-caused errors are fixed and results recorded. |
| X06 | T072 | Schedule a five-learner study; mark SC-007 passed only if at least four learners correctly explain the three rate behaviours. Record pending status if the study cannot be performed. |

## Requirement and success-criteria coverage

| Requirement | Cases |
|---|---|
| FR-001–005 | P02–P03, P06–P07, R01 |
| FR-006–010 | F05, P05–P08, P10 |
| FR-011–015 | N01–N10, F07–F08, P03–P04, P09, R05–R06 |
| FR-016–020 | P04, R06–R07, X03–X04 |
| FR-021–023 | P06–P08, R01–R02 |
| FR-024–026 | R05–R07 |
| FR-027–030 | P10–P11, R03–R04 |
| FR-031–035 | F06, P03, R05–R07, X01–X02, X04 |
| SC-001–002 | P10, X03 |
| SC-003–004 | N01–N10, P03, P09–P10, R05–R06 |
| SC-005–006 | R03–R05 |
| SC-007 | X06 |
| SC-008 | F08, P03, P06–P07, R07, X04 |
