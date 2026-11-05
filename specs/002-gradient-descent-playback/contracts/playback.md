# Contract: Playback and History

This is a design contract, not implementation code. See [data model](../data-model.md) for
entities and [research](../research.md) for numeric thresholds.

## Pure stepper boundary

A registered algorithm accepts a readonly, finite snapshot, current rate and declared landscape,
and returns either a complete finite transition plus resulting finite snapshot, or a typed
non-finite result identifying the attempted update. Its pure computation does not import Zustand,
React, timers, DOM or charting. The generic playback layer does not call a gradient-descent-specific
function; the adapter encapsulates that algorithm. Unknown adapters and malformed content are
explicit errors, not successful empty runs.

Per transition the stored weights, gradients, loss and rate are binary64 values as computed; the
UI's decimal formatting is never fed back into math. Any non-finite intermediate or resulting
loss/gradient prevents appending either state or transition. Overflow in an outgoing preview is
reported as unavailable, without changing history or drawing invalid values.

## Operations

| Action | Contract |
|--------|----------|
| `play` | At a nonterminal selection, schedule one advancement at the selected speed; replay existing history or compute at the tip. No duplicate scheduler. |
| `pause` | Cancel pending work; retain selected snapshot and run. |
| `stepForward` | While paused, advance by exactly one recorded or computed transition; never skip. At the tip, enforce stationary, divergence and 1,000-update stops. |
| `stepBackward` | While paused, select the previous recorded snapshot; at 0, remain at 0. Never recompute. |
| `seek(index)` | Accept integer index in recorded bounds, pause if playing, select exactly that snapshot and synchronize all views. |
| `setRate(value)` / preset | Validate finite non-negative value against content range/grid. Keep play/pause and selection. Recorded outgoing transitions retain their rates; show pending preview when edited. A successful advancement creates a selected branch and retains the original future. |
| `selectBranch(id)` | Pause playback, clear the pending rate edit, select an existing branch and restore its last selected index and branch-specific stop state. Synchronize its timeline, charts and inspection. Unknown ids are explicit errors. |
| `setStart(values)` | Validate/snap only user inputs, cancel playback and reset history to a new snapshot 0. 1D pointer and input or 2D pointer and two inputs must agree. |
| `setSpeed(level)` | Select 1, 2 or 4 steps/second; update timer scheduling without changing selection or play/pause. |
| `reset` | Pause, cancel timer/work, retain current chosen start and rate, recreate initial state, clear history after index 0 and clear stop/error messages. |
| `dispose` | Cancel timer and outstanding worker requests; late callbacks cannot mutate the disposed store. |

Replay uses the original rate of **each** recorded transition, even if a run historically changed
rate. Changing the rate at an earlier snapshot is an explicit new continuation; it does not alter
the original transition until advancement succeeds. On success, preserve the original branch for
selection and scrubbing; on failure, create no branch, leave the original future intact, report
divergence and pause. An invalid rate input leaves the last valid value in force and shows
the validation message; invalid start inputs likewise. Out-of-range finite inputs clamp according
to the existing lesson convention, with a message. Computed weights are never clamped.

## Stop and recovery

- Stop with a stationary-point message when the maximum absolute gradient component is at most
  `1e-6`; do not assert that a stationary point is a minimum.
- At 1,000 successful updates, stop and retain all 1,001 states. Selecting earlier history is
  always possible, as is replay; a changed rate at an earlier state can create a new continuation.
- On a non-finite attempted update, pause and report its 1-based number. Keep all valid snapshots;
  no non-finite number reaches the rendered charts or readouts. Reset or rate change clears the
  error, and the next step operates from the selected snapshot, including the last valid tip.
- A non-finite preview alone does not stop or change playback. A real attempt triggers divergence.
- Timer cancellation and generation tokens prevent callbacks from old runs from appending after
  pause, reset, seek, branch or disposal. Timer/worker failures are surfaced, not swallowed.
