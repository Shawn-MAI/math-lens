# MathLens Constitution

MathLens is an interactive website that teaches the math behind AI, machine learning and deep
learning through visualization.

## Core Principles

### I. Learn by Manipulation
Every concept MUST have at least one interactive control (slider, numeric input or toggle) that
changes a parameter or weight and updates the visualization in real time. Updates MUST complete
in under 100 ms. A static explanation alone is never an acceptable deliverable.

Rationale: understanding comes from seeing how the output reacts when an input changes.

### II. Training Is Visible
Every iterative algorithm MUST expose each training step. The user MUST be able to play, pause,
step forward, step back, reset and change playback speed. Per-step values (parameters, loss,
gradient and update) MUST be inspectable, and the full history MUST be retained so the user can
scrub the timeline.

Rationale: optimization is a process; hiding the steps hides the lesson.

### III. Math Correctness First
All algorithms MUST live in a framework-free math core with no UI imports. Results MUST match
reference values computed by hand or with NumPy within a stated tolerance. Visuals MUST NEVER be
faked or hard-coded; every chart MUST be driven by real computation.

Rationale: a teaching tool that shows wrong or simulated math is worse than none.

### IV. Intuition Before Formalism
Each lesson MUST follow this order: intuition, interactive demo, the formula, then a worked
numeric example. Every symbol in a formula (loss, weight, bias, gradient, learning rate, etc.)
MUST be explained. Lessons MUST use plain language and MUST NOT use unexplained jargon.

Rationale: learners retain formulas better when they already hold the intuition behind them.

### V. Test-First Quality (NON-NEGOTIABLE)
Test cases MUST be written and listed for approval before implementation begins. The math core
MUST have unit tests for every function covering known values, edge cases and numerical
stability. UI behavior MUST have component tests that verify the parameter-to-chart connection.

Rationale: correctness is the product; tests define it before code can bend it.

### VI. Simplicity and Separation
The architecture MUST have exactly three layers: math core (pure functions), simulation/state
layer (training history, playback) and presentation (charts, controls). A layer MUST NOT depend
on any layer above it. No feature MAY be added unless a lesson needs it (YAGNI).

Rationale: pure, layered code is testable, reusable and easy to reason about.

### VII. Accessible and Responsive
The site MUST work on desktop and tablet. All controls MUST be keyboard-operable. Palettes MUST
be colour-blind-safe. Every chart MUST have a text alternative or summary.

Rationale: a learning tool must be usable by every learner regardless of device or ability.

### VIII. Performance Budget
Heavy computation MUST run in a Web Worker whenever it would otherwise block the UI.
Visualizations MUST sustain 60 fps for the datasets used in the lessons.

Rationale: lag breaks the link between action and result that Principle I depends on.

### IX. Branch-per-Feature Git Workflow
Every new feature MUST have its own git branch, created automatically when `/speckit.specify`
runs, using the installed Spec Kit git extension.

- Naming: the branch name MUST match the feature folder in the form `NNN-short-kebab-name`
  (for example `003-linear-regression-training`), where `NNN` is the next sequential feature
  number.
- A spec, plan, tasks file or any code MUST NEVER be created while on `main` or the default
  branch. If `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` or `/speckit.implement` is
  started and the current branch is not the feature branch, the agent MUST stop and tell the
  user instead of continuing.
- If automatic branch creation fails or the working tree has uncommitted changes, the agent
  MUST stop and tell the user instead of continuing. It MUST NOT fall back to working on `main`
  or silently create the branch by hand.

Rationale: isolated branches keep `main` stable and make each feature reviewable on its own.

## Technical Constraints

- The math core MUST NOT import any UI framework, DOM API or charting library.
- Dependencies flow downward only: presentation → simulation/state → math core.
- Numerical tolerances used to compare against NumPy or hand-computed references MUST be stated
  in the test that uses them.
- Web Worker boundaries MUST pass plain serializable data so the math core stays framework-free.
- Supported targets are current desktop and tablet browsers; phone layouts are out of scope
  until a lesson requires them.

## Development Workflow and Quality Gates

- Work follows the Spec Kit sequence: specify → plan → tasks → implement, each on the feature
  branch defined in Principle IX.
- Test cases MUST be listed and approved before implementation (Principle V); tests MUST fail
  before the code that satisfies them is written.
- Every lesson MUST pass these gates before merge: interactive control present and under
  100 ms (I), step-through controls for iterative algorithms (II), math-core tests green
  (III, V), section order intuition → demo → formula → worked example (IV), keyboard and
  colour-blind check (VII), and 60 fps check (VIII).
- Pull requests MUST be reviewed against this constitution. Any added complexity MUST be
  justified by a lesson that needs it (Principle VI).

## Governance

This constitution supersedes all other practices in this repository. Amendments require a
written proposal, a documented rationale, an update to this file with a Sync Impact Report, and
a migration note for any existing work that no longer complies.

Versioning follows semantic versioning: MAJOR for backward-incompatible removals or
redefinitions of principles or governance; MINOR for a new principle or section or materially
expanded guidance; PATCH for clarifications, wording or typo fixes.

Compliance MUST be checked at the plan phase (Constitution Check) and again during pull-request
review. Violations MUST be fixed or explicitly justified in the plan's complexity tracking.

**Version**: 1.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
