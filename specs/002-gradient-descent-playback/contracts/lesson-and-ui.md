# Contract: Training Lessons and UI

## Content and catalog

The existing lesson path, catalog, hash routes, topic sorting and static lesson behavior remain
compatible. A `training` lesson variant declares the adapter, landscape, dimension, weight
parameters, input ranges and defaults, three named presets, speed choices, chart configuration,
formula/symbol explanations, worked example and text summaries. It inherits ordinary lesson
metadata and `intuition.md`; training-only fields are validated alongside existing fields.

The loader checks that adapter, landscape and chart support the same dimension, parameter
bindings exist and are numeric, ranges and defaults are finite and valid, all presets lie on the
learning-rate grid, and output/template references and symbols resolve. Failures report the lesson
id and field. Existing lessons with no training discriminator must still validate and render with
their present content and default behavior.

## Layout and behavior

- Preserve intuition, interactive demo, formula and worked example in that order. Both chart views,
  numeric inspector, worked example and text summaries use the same selected snapshot.
- Show 1D loss curve or a 2D contour map, the path through the selected step and an explicit
  current marker. A side-by-side loss-vs-step chart shows the recorded run and selected cursor;
  recorded future is still visible until a successful branch replaces it.
- Chart surface/path samples are calculated from the declared landscape and recorded history.
  When finite data leaves the view, clip the drawing and provide a textual off-screen indication;
  never draw a clamped position as if it were the actual weight.
- Provide keyboard-operable controls for start, rate, preset, play/pause, forward, backward,
  reset, speed and timeline. On 2D, pointer drag sets both start coordinates; separate named input
  controls make each coordinate keyboard accessible. Pointer, touch and keyboard use the same
  validation rules. Controls expose labels, ranges, values and inline validation messages.
- A selected snapshot displays index, weights, loss and gradient. Recorded outgoing updates use
  their own recorded rate; unperformed updates show a clearly labelled preview. A pending changed
  rate at an earlier step shows the recorded update and distinct preview. Each weight gets its own
  `old - rate × gradient ≈ new` worked calculation with explanatory symbols.
- All charts have meaningful text alternatives describing selected step, weights and loss, as well
  as off-screen or non-finite conditions. Do not rely on color alone. Announce state changes without
  flooding live regions during rapid playback.
- Maintain the selected appearance on light/dark themes and at 1024 px and larger. Refresh or
  direct navigation creates a default run; leaving a lesson stops its scheduler.

## Timing and rendering verification

Measure actual control-event to committed chart/readout change in a browser, including 1,001-state
scrubbing and start/slider dragging: all measured actions must complete under 100 ms. Capture a
browser rendering trace over continuous interaction, on desktop and a tablet-class device, and
verify 60 fps. Record device/browser, refresh rate, sample counts, worst latency, frame timing and
conditions; don't treat timer callback latency or jsdom execution as rendered-frame proof. Worker
use is required if heavy computation blocks the UI.
