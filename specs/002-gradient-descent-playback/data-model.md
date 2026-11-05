# Data Model: Training Playback

## Training lesson

A backwards-compatible discriminated variant of the existing lesson content: `kind: training`
selects training rendering; existing content without `kind` remains the current static variant.
Common id, topic, title, summary, intuition, formula and worked-example content retain existing
catalog validation and rendering order. Training content declares an algorithm adapter id,
landscape id, ordered weight metadata (one or two), start ranges/defaults/steps, learning-rate
range/default/step and three named preset values, chart configuration, and localized teaching
text. Validate uniqueness, dimensions, finite ordered ranges, grid-aligned defaults and presets,
non-negative rate, existing adapter/landscape, adapter/landscape dimensional compatibility,
required explanation symbols and template bindings. Invalid content is an explicit catalog error.

## Landscape and algorithm

A landscape provides a stable id, dimensionality, finite-domain rendering configuration,
loss and exact gradient evaluators in the pure math core. Sampled lines and contours are produced
by evaluating the same landscape, not by authored coordinates. A pure algorithm adapter takes a
snapshot and settings and proposes an update, independent of React, timers and UI. Adding an
algorithm not already implemented requires a new core adapter and registry entry, but not a change
to playback controls, scheduling or history; additional lessons using registered algorithms and
landscapes require content only.

## State and transitions

| Entity | Fields and invariants |
|--------|------------------------|
| `Snapshot` | Index `0..1000`; immutable finite weights, finite loss and finite gradient at those weights. Index 0 is the starting state. |
| `Transition` | Stored between snapshots `i` and `i+1`: finite learning rate, gradient used, per-weight old value, update and new value. The gradient and old weights match snapshot `i`; new weights match snapshot `i+1`. |
| `Run` | Starting weights; ordered snapshots and transitions, where `snapshots.length = transitions.length + 1`; at most 1,001 snapshots and 1,000 transitions. All arrays retain full precision and are never rounded or snapped during training. |
| `Selection` | Selected index in `[0, last]`; determines all current displays and the loss-chart cursor. A recorded outgoing transition uses its stored rate. The tip has an explicitly labelled outgoing preview. |
| `Rate edit` | Current configured non-negative rate and a pending edit marker. Changing rate at an earlier snapshot leaves history visible until the next advance; show the recorded transition and separate preview, then truncate future and append a newly calculated transition. A same-value selection is not an edit. |
| `Playback` | Playing/paused, selected speed, stop reason (`stationary`, `diverged`, `limit`, or none) and optional failed step number. Selection is independent of terminal run status so old snapshots remain inspectable. |

Transition calculation must check input, gradient, each `rate * gradient`, new weights, new loss
and new gradient for finiteness. If any is non-finite, do not append a partial state or a
transition; stop, report the attempted update number, and retain every previous snapshot. Preview
failure is labelled as unavailable and does not mutate the run. Unexpected programming or content
errors are surfaced separately, not silently reported as divergence.

At the 1,000th successful transition, retain indices `0..1000`, stop and indicate the limit. A
stationary criterion uses the gradient, not zero change in weights: zero rate at a non-stationary
point is a valid no-progress run. A zero gradient indicates a stationary point, not necessarily
a minimum. Threshold and numeric display/reference tolerances are specified in research.

## Selection and lifecycle

- Play and Step forward replay recorded transitions if there is no pending rate edit. At the tip,
  compute one transition; if a rate edit is pending, truncate only on successful continuation
  (failed calculations preserve the previous history), and create the new continuation.
- Scrub/Step backward select existing states without recomputation. Scrubbing during play pauses
  playback so the chosen state remains inspectable. Speed changes leave play/pause unchanged.
- Rate changes and presets do not reset or change play/pause. A change at the selected point applies
  to the next newly computed transition; on replay, recorded rates remain attached to transitions.
  Reset preserves the selected starting point and rate, pauses, clears the run and its messages,
  and recomputes snapshot 0. Changing a starting weight resets and pauses with the new start.
- On divergence, changing the rate clears the divergence message without changing selection or
  history; the next advance computes from the selected state. Reset clears it as above.
- At a terminal tip, Play/Step forward cannot append without reset or a valid new continuation
  from an earlier selected snapshot. Leaving the lesson cancels pending timers and worker work.
