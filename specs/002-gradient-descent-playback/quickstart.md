# Quickstart: Validating Training Playback

## Prerequisites and setup

Node.js 22+ and npm; a current desktop browser and a tablet-class device/browser at 1024 px or
wider for manual checks. From the project root after implementation:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

Open the printed preview URL and use the lesson list or hash lesson routes. The checks below are
acceptance scenarios, not claims that the feature is already implemented. Before implementation,
list test cases for user approval; write each task's tests first.

## 1. Playback and exact history

Open the 1D convex lesson. Set start to `-4`, rate to `0.2`, and step once: the weight is `-2.8`,
loss is `11.52`, gradient is `-4.8`, and the selected outgoing preview is `-2.8 - 0.2 * (-4.8)
≈ -1.84`. At step 0 the performed update is `-4 - 0.2 * (-6) ≈ -2.8`. Play, pause, adjust speed,
step forward and backward, and scrub; all views must select the same state and backward/forward
must reproduce the recorded values exactly.

After at least 10 updates, seek to step 3 and play without editing the rate: later states replay
unchanged. Seek to 3 again, change the rate, and confirm the old recorded transition and separate
preview remain visible until advancing; then verify the active future follows the new computation.
Use the branch selector to return to the original branch, scrub its unchanged future and switch
back to the new branch. Check that selecting a branch pauses playback.
Select presets while playing and paused; selection and play/pause state must not reset.

## 2. Presets and local minima

For each lesson, reset to its default start between small, good and large presets. Step 10 times
and compare loss ratios to the thresholds in [research](./research.md). Check the displayed notes
describe actual recorded behavior. On the non-convex lesson use the good rate `0.08` from `-0.5`
and `0.5`; the two stationary points and losses must match the independent values in research.
Use both pointer drag and keyboard/input to set starts; in 2D check both coordinate controls.

## 3. Limits, divergence and recovery

Set the 1D default start `-4` and rate `0.0005`. Run 1,000 updates with a test-clock-assisted component test
or a browser test harness using the real store and controls; verify all 1,001 states exist,
scrub and navigate forward and backward across every index, and compare the displayed values with
their first display. Verify the limit message, terminal behavior and reset; separately check the
zero-rate no-progress message. Do not use fabricated history to
claim the performance target; generated test history must come from the real algorithm.

For each lesson, use its large preset and advance until non-finite arithmetic is attempted; a
message identifies the attempted step, playback stops, prior finite states remain inspectable and
no invalid number is displayed. A changed rate clears the message and allows a new continuation.
Check a non-finite outgoing preview is explicitly unavailable without corrupting history.

## 4. Rendering, accessibility and responsiveness

Run the app on desktop and a tablet-class browser. At 1024, 1280 and 1920 px in both themes,
check paired charts, controls, long/scientific numbers and labels without overlap or horizontal
overflow. Use keyboard-only controls including 2D coordinates and timeline; inspect chart text
summaries and run axe. Perform a human screen-reader pass and color-blind simulation; record any
remaining unverified checks rather than treating an accessibility-tree snapshot as a screen reader.

Measure event-to-visible-update for control changes and repeated scrubbing of the real 1,001-state
history, including worst latency and sample count; require under 100 ms. Capture browser rendering
traces during continuous interaction and verify 60 fps. Record device/browser and refresh rate.
If heavy computation blocks the UI, implement and validate a worker before accepting the gate.
See [UI contract](./contracts/lesson-and-ui.md).

## 5. Regression and learner check

Verify the existing three Foundation lessons, list, dark mode, keyboard access, direct hash links
and refresh-to-default still work. With five target learners, record whether at least four correctly
explain the three learning-rate behaviors after using the presets; schedule this as a human study.
