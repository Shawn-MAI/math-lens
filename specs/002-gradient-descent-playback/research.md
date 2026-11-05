# Research: Training Playback

## 1. Lesson landscapes and presets

**Decision**: Use these pure scalar functions, exact gradients and defaults. Coordinates below are
weights, not dataset points. All three use a learning-rate control from 0 to 4 in increments of
0.0005; start controls use step 0.1. Starts are limited to the visible domains, but computed
training weights are never clamped or snapped.

| Lesson | Loss and exact gradient | Default start | Small / good / large rate |
|--------|-------------------------|---------------|---------------------------|
| 1D convex | `L(x) = 0.5 * (x - 2)^2`; `g(x) = x - 2` | `x = -4` | `0.0005 / 0.2 / 4` |
| 1D non-convex | `L(x) = (x^2 - 1)^2 + 0.2*x + 0.3`; `g(x) = 4*x*(x^2 - 1) + 0.2` | `x = 0.5`; compare `-0.5` | `0.0005 / 0.08 / 0.5` |
| 2D convex | `L(x,y) = 0.5*(x^2 + 10*y^2)`; `g = (x, 10*y)` | `(4, 2)` | `0.0005 / 0.15 / 0.4` |

Use start domains `[-5, 5]` for the convex 1D lesson, `[-2, 2]` for the non-convex lesson,
and `[-5, 5]` on each 2D axis. The additional 0.3 in the non-convex loss keeps its minima
positive without changing its gradient or training path.

**Preset acceptance**: Starting from each default, after ten updates the small rate's loss must
be at least 90% and less than 100% of the starting loss, the good rate's loss must be under 80%,
and the large rate's loss must exceed the starting loss. Reset between comparisons. The good
non-convex rate from `-0.5` and `0.5` reaches separate stationary points approximately
`-1.02412030` and `0.97399435`, with losses approximately `0.09755957` and `0.49743415`.
The 2D good rate's first update is `(4,2) -> (3.4,-1)`. Values are not frozen chart data.

**Verification**: Local binary64 recurrence checks, with explicit non-finite checks, showed the
large 1D and 2D presets attempt a non-finite update at step 322 and the large non-convex preset
at step 13. Counts are for these formulas and starts; tests should assert detection and history
integrity rather than assume identical overflow boundaries for all platforms.

**Rationale**: The formulas have hand-checkable derivatives, the convex minima are easy to see,
and the non-convex curve has unequal wells. Small, good and large cases differ on a bounded,
measurable interval. Non-convex basins depend on both start and rate; do not imply otherwise.

**Alternatives considered**: A symmetric double well has equal loss at both minima and weakens
the comparison. A 3D surface was excluded in clarification. Pre-authored contour geometry or
trajectory values would violate math correctness.

## 2. Numerical rules and validation

**Decision**: Use binary64 and simultaneous `next[i] = old[i] - rate*gradient[i]`, deriving every
gradient from the same unrounded selected weights. Define stationary as `max(abs(gradient[i])) <=
1e-6`; label it stationary rather than claiming a minimum. The predicate is evaluated even at
step 0 and never treats a zero rate alone as convergence.

Use at least 10 independent hand/NumPy sample runs spanning each lesson, both signs, 2D
simultaneous updates, changed rates, flat points, and divergent/overflow boundaries. For finite
core results, compare each scalar with `abs(actual-reference) <= 1e-10 + 1e-10*abs(reference)`;
state any test-specific tolerance explicitly. For visual numbers, use six decimal places for zero
and magnitudes `[1e-4, 1e6)`, and scientific notation with six digits after the decimal outside
that range. Thus decimal rounding error is at most approximately `5e-7` absolute, and scientific
rounding at most `5e-7` relative; assert these bounds with a small binary floating-point allowance.
For rounded equations, display `≈` and derive each printed operand and result from the unrounded
calculation; do not require arithmetic on rounded operands to produce an exact printed result.

**Rationale**: Approximate stopping avoids endless floating-point tails. Exact snapshots support
replay, while predictable formatting keeps small and large values legible.

**Alternatives considered**: Exact-zero stopping can fail to terminate; rounding each training
step accumulates error. An arbitrary magnitude cutoff must not be presented as non-finite
divergence. Detect non-finite arithmetic explicitly; if values leave the visible plot, show a
clipped/off-screen indication with finite numeric values rather than changing the math.

## 3. Playback, scheduling and histories

**Decision**: Store each finite snapshot and performed transition immutably; replay stored
transitions until the tip, with a pending rate edit branching on the next successful advancement.
Retain the original branch and expose a keyboard-operable selector so every branch remains
scrubbable; immutable prefixes may be shared. Reset or a start change starts a new run.
Use one per-lesson Zustand vanilla store and a cancellable single-shot timer scheduler, with slow
1 step/second, normal 2 steps/second and fast 4 steps/second. No batched skipped steps. Pause on
timeline drag/keyboard scrub and start-point edits, not on rate/preset or speed changes. See
[playback contract](./contracts/playback.md) for precise operations and error rules.

**Rationale**: Values and recorded rates survive inspection, a successful branch does not erase
the earlier future, and stopping timers on unmount prevents hidden training.

**Alternatives considered**: Recompute on backward movement loses exact prior transitions and
potentially changes floating-point results. Discarding earlier branches conflicts with the
constitution's full-history requirement.

## 4. Contours, scaling and 1,001-state performance

**Decision**: Sample loss on a fixed, finite 2D grid, compute actual isolines using `d3-contour`,
and render them as SVG with explicit axis scales. Add `d3-contour` and matching type package at
implementation; validate against direct landscape samples. Cache the static grid and contours by
landscape/domain; do not rebuild them on every scrub. Draw the finite selected path and loss history
as SVG paths, with the selected cursor and explicit off-screen indication for out-of-domain
weights. Derive line/curve samples from the core. Clamp only drawing to the viewport, never data;
use overflow-safe scaling and scientific axis formatting for extreme finite loss values.

Use retained branch histories of at most 1,001 states each, shared immutable prefixes where useful,
selectors that avoid unrelated rerenders, memoized
static geometry and batched DOM updates. Profile before deciding whether a worker is needed. If
sampling, contours or computation blocks interaction, move the measured heavy portion to a worker;
use serializable messages with request ids/revisions, ignore stale replies on reset/branch/unmount,
surface worker errors and preserve current-state consistency.

**Rationale**: SVG and the existing D3 primitives fit the app; contours are generated from real
math. A narrowly scoped contour library is preferable to a custom untested isoline algorithm.

**Alternatives considered**: Re-rendering a separate DOM element for each history point can
degrade scrub performance; eagerly introducing a worker complicates cancellation before evidence
of blocking. Both alternatives remain subject to actual browser measurements.

## 5. Lesson integration and accessible teaching

**Decision**: Extend the strict content schema and loader for a training lesson variant; dispatch
to a training presentation in the existing lesson shell. Preserve existing lessons, hash routes,
theme behavior and controls. The 2D start point supports pointer drag plus two separately named
keyboard-operable coordinate controls. Timeline is a native range input. Derive summaries and
worked examples from the same selected snapshot.

Only describe observed behavior: before sufficient steps say the run has not yet established a
trend; after ten transitions compare actual first/last losses in that window (for a positive
initial loss: small progress if the ratio is in `[0.9,1)`, decrease if below `0.9`, increase if
above `1`, unchanged if equal). If the initial loss is zero, compare the finite losses directly
instead of dividing by zero.
Report non-finite divergence separately. Where successive coordinate changes reverse sign, the
note may also say the path alternates; it must not claim convergence solely from a preset name.

**Rationale**: The existing `lessonSchema` is strict, and its layout assumes a static model and
single chart, so the changes need explicit catalog, validation, layout and test coverage rather
than content alone. Labels and summaries do not rely on color or pointer access.

**Alternatives considered**: Replacing the current framework would risk regressions. Hard-wiring
gradient descent into generic playback would prevent later iterative algorithms from using it.
