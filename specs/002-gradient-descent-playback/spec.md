# Feature Specification: Training Playback for Gradient Descent

**Feature Branch**: `002-gradient-descent-playback`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Add a training playback system for iterative algorithms, starting with gradient descent on a 1D and a 2D loss surface. The learner chooses a starting point and a learning rate, presses Play and watches the optimizer move step by step; can pause, step forward and backward, reset, change speed, scrub the timeline, inspect any step (weights, loss, gradient, update calculation with real numbers), see a live loss-vs-step chart, change the learning rate and use presets (too small, good, too large), and change the starting point to see different minima on a non-convex curve."

## Clarifications

### Session 2026-11-05

- Q: When a learner returns to an earlier step and presses Play without changing the learning rate, what should happen to the later recorded steps? → A: Replay existing steps; replace later steps only when the learning rate changes.
- Q: How is the original future retained when a changed rate creates a replacement continuation? → A: Replace it in the active timeline, but retain the original branch and let the learner select and scrub it.
- Q: For a selected step, which weight update should the inspection panel show? → A: Show the next update from the selected point, labeling unperformed updates as previews.
- Q: Which views should the first 2D lesson provide? → A: A contour map only; a 3D surface is outside this feature.
- Q: What should happen when a run reaches 1,000 training updates? → A: Stop at 1,000 updates and retain the complete run, including the starting state.
- Q: When a learner selects a learning-rate preset during a run, should the run restart or continue from the current step? → A: Apply the new rate at the current step without resetting.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Watch gradient descent on a 1D curve (Priority: P1)

A learner opens the 1D gradient descent lesson, picks a starting point and a learning rate, and presses Play. A marker moves down the loss curve one step at a time, while a second chart shows the loss at each step. The learner can pause at any moment, take one step forward or backward, reset, and choose a slower or faster speed.

**Why this priority**: This is the core of the feature and the first time the learner sees training as a sequence of steps. Every other story builds on it.

**Independent Test**: Open the lesson, press Play, and check that the marker moves down the curve, the loss chart grows by one point per step, and Pause stops it. Press Step forward and Step backward and check that the marker moves by exactly one step each time.

**Acceptance Scenarios**:

1. **Given** a lesson at its default start and learning rate, **When** the learner presses Play, **Then** the marker advances one step at a time along the curve and the loss chart gains one point per step.
2. **Given** training is playing, **When** the learner presses Pause, **Then** the steps stop and the current step stays on screen.
3. **Given** training is paused at step 5, **When** the learner presses Step forward, **Then** the view shows step 6, and **When** the learner presses Step backward twice, **Then** the view shows step 4.
4. **Given** training is at any step, **When** the learner presses Reset, **Then** the view returns to step 0 at the chosen starting point and the history is cleared.
5. **Given** training is playing, **When** the learner picks a different speed, **Then** the rate of steps changes from the next step on.
6. **Given** the learner is at step 0, **When** they press Step backward, **Then** nothing changes and no error appears.

---

### User Story 2 - Inspect and scrub any step (Priority: P1)

A learner drags a timeline scrubber to any earlier step. The chart, the marker and the loss chart all show that step. A panel lists the step's weight, loss and gradient, and shows the update calculation with real numbers, for example `w_new = 2.00 - 0.10 * 4.00 = 1.60`.

**Why this priority**: Seeing the numbers behind each step is what turns the animation into understanding. It is also required by the constitution (training is visible, history is kept and scrubbable).

**Independent Test**: Run 20 steps, drag the scrubber to step 7, and compare the shown weight, loss, gradient and update line with a hand calculation for step 7.

**Acceptance Scenarios**:

1. **Given** at least 20 steps have run, **When** the learner drags the scrubber to step 7, **Then** the marker, loss chart cursor and inspection panel all show step 7.
2. **Given** any step is shown, **When** the learner reads the update calculation, **Then** it uses the selected step's weight and gradient to show the learning rate and resulting next weight with real values, and the arithmetic is correct. If that update has not been performed, it is labelled as a preview.
3. **Given** the learner steps forward from step 10 to step 11 and then backward to step 10, **When** they compare the two views of step 10, **Then** every displayed value is identical.
4. **Given** the learner scrubs back to step 3 without changing the learning rate, **When** they press Play or Step forward, **Then** the recorded subsequent steps are replayed unchanged.
5. **Given** the learner selects an earlier step and changes the learning rate, **When** the next update succeeds, **Then** the active timeline follows the new continuation while the original branch remains available for selection and scrubbing.
6. **Given** a recorded future and a pending changed rate, **When** the attempted update diverges, **Then** no new branch is created and the original future remains intact.

---

### User Story 3 - Compare learning rates with presets (Priority: P2)

A learner changes the learning rate with a control, before or during training, and sees how the path changes. One-click presets set a learning rate that is too small (slow progress), a good one (converges), and one that is too large (oscillates or diverges). A short note explains what the learner is seeing.

**Why this priority**: The learning rate is the main lesson of gradient descent, but it needs the playback from the first two stories to be useful.

**Independent Test**: Click each preset, press Play, and check that the "too small" run is still far from the minimum after many steps, the "good" run reaches it, and the "too large" run bounces across it or moves away.

**Acceptance Scenarios**:

1. **Given** the lesson is open, **When** the learner clicks the "too small" preset and plays, **Then** the loss decreases very slowly and the note says so.
2. **Given** the lesson is open, **When** the learner clicks the "good" preset and plays, **Then** the loss falls quickly and the marker settles near the minimum.
3. **Given** the lesson is open, **When** the learner clicks the "too large" preset and plays, **Then** the marker jumps from side to side or moves away, and the note says so.
4. **Given** training is playing, **When** the learner changes the learning rate, **Then** the new rate is used for the next step and earlier steps keep the rate they were computed with.
5. **Given** a run is playing or paused, **When** the learner selects a preset, **Then** the rate changes without resetting the current step or changing whether playback is playing or paused.

---

### User Story 4 - Divergence is shown clearly (Priority: P2)

When a run blows up (the values become infinite or not a number), the learner sees a clear message explaining that the learning rate is too large and the run has diverged. The page keeps working: playback stops, earlier steps can still be scrubbed, and Reset works.

**Why this priority**: A too-large learning rate is a taught case, so the page must handle it well. A crash here would break the lesson.

**Independent Test**: Choose a very large learning rate, press Play, and check that a message appears, playback stops, and the earlier steps are still inspectable.

**Acceptance Scenarios**:

1. **Given** a learning rate large enough to diverge, **When** the learner plays, **Then** a message says the training diverged and at which step, and playback stops.
2. **Given** divergence has been reported, **When** the learner scrubs to an earlier step, **Then** that step shows normal numbers and charts.
3. **Given** divergence has been reported, **When** the learner presses Reset or changes the learning rate, **Then** the message goes away and training can start again.
4. **Given** divergence has been reported, **Then** no impossible value (such as `NaN` or `Infinity`) is drawn in the charts or the number panel.

---

### User Story 5 - Different starting points reach different minima (Priority: P2)

On a curve with more than one valley, the learner chooses the starting point and sees that different starts end in different minima. A learner can also set the starting point by dragging the marker or by typing a value.

**Why this priority**: It shows that gradient descent finds a nearby minimum, not necessarily the best one. It needs only the 1D playback.

**Independent Test**: On the non-convex curve, run from a start on the left and from a start on the right, and check that the runs end in two different valleys with different final losses.

**Acceptance Scenarios**:

1. **Given** the non-convex curve, **When** the learner starts left of the central hill and plays, **Then** the run ends in the left valley.
2. **Given** the non-convex curve, **When** the learner starts right of the central hill and plays, **Then** the run ends in the right valley, and the final loss differs from the left run.
3. **Given** a run is in progress or finished, **When** the learner changes the starting point, **Then** training resets to step 0 at the new start.

---

### User Story 6 - Gradient descent on a 2D surface (Priority: P3)

The learner opens the 2D lesson. A loss surface is shown as a contour map. The learner picks a starting point (two weights) and a learning rate, and plays. The path is drawn on the map, a loss-vs-step chart sits next to it, and the inspection panel shows both weights, both gradient components and the update for each weight.

**Why this priority**: It builds on all earlier stories and is the more advanced view. The 1D lessons already deliver the core value.

**Independent Test**: Open the 2D lesson, press Play, and check that the path moves toward the minimum on the contour map, the loss chart falls, and the panel shows the two weights and two gradient values for the selected step.

**Acceptance Scenarios**:

1. **Given** the 2D lesson, **When** the learner plays, **Then** the path is drawn step by step on the contour map and the loss chart gains one point per step.
2. **Given** any step, **When** the learner reads the inspection panel, **Then** both weights, both gradient components and both update calculations are shown with real numbers.
3. **Given** the 2D lesson, **When** the learner uses the same playback controls, scrubber, presets and divergence message as in 1D, **Then** they behave the same way.

---

### Edge Cases

- A learning rate of 0 means no movement: unless the point is stationary, the run continues without error and the message says that nothing changes.
- A starting point with a gradient of 0 shows a stationary-point message and stops stepping on its own; a zero gradient alone does not establish that the point is a minimum.
- A negative or non-numeric learning rate, or a non-numeric starting point, is rejected with a short message, and the previous valid value stays. Negative starting points are allowed when they are within the lesson's range.
- A value outside the allowed range is limited to the range, with a short message (same behaviour as the existing lessons).
- Completing 1,000 updates stops playback with a message; the starting state and all 1,000 resulting states remain available.
- Changing the speed while paused does not start playback.
- Pressing Play at the last step of a run stopped at a stationary point does not advance it; the learner is told why and may Reset.
- Pressing Step forward at the end of the stored history computes a new step; at the maximum length it shows the limit message.
- Very small or very large loss values stay readable in the loss chart and the number panel (for example by using scientific notation or a log scale option).
- If an outgoing update preview would be non-finite, show that it cannot be computed without printing a non-finite number; attempting that update reports divergence.
- Playback stops when the learner leaves the lesson, and nothing keeps running in the background.

## Requirements *(mandatory)*

### Functional Requirements

**Playback controls**

- **FR-001**: Learners MUST be able to choose a starting point and a learning rate before training, using the same kind of controls as the existing lessons (values limited to a range, step 0.1 unless the lesson says otherwise).
- **FR-002**: Learners MUST be able to Play, Pause, Step forward, Step backward and Reset.
- **FR-003**: Learners MUST be able to choose the playback speed from at least three levels (slow, normal, fast); the current speed MUST be visible.
- **FR-004**: The controls MUST show only the actions that make sense in the current state (for example, Play is replaced by Pause while playing), and MUST be usable with the keyboard.
- **FR-005**: The current step number and the total number of steps stored MUST be shown at all times.

**History and timeline**

- **FR-006**: The system MUST keep the full history of every step of the current run, including the starting state.
- **FR-007**: The system MUST store and allow scrubbing of the starting state and all 1,000 resulting states of a run of 1,000 updates, within the response time in SC-002.
- **FR-008**: Learners MUST be able to drag a timeline scrubber to any stored step, and also move it with the keyboard.
- **FR-009**: Stepping backward MUST restore the exact earlier state: the shown parameters, loss, gradient and update are identical to what was shown at that step the first time.
- **FR-010**: When the learner plays or steps forward from an earlier step without changing the learning rate, the system MUST replay the recorded subsequent steps unchanged. If the learner changes the learning rate at an earlier step, the next successful update MUST create and select a new continuation from that point. The prior branch MUST remain available through a keyboard-operable branch selector and its entire history MUST remain scrubbable. A failed update MUST leave the prior branch selected and unchanged.

**Inspection**

- **FR-011**: For the selected step, the system MUST show the current parameters, the loss, and the gradient.
- **FR-012**: For the selected step, the system MUST show the outgoing update calculation with real numbers (`w_new = w_old - lr * gradient`, with each symbol replaced by its value, and the result), for every parameter. A recorded transition uses its recorded learning rate; an unperformed update uses the current learning rate and is labelled as a preview. When a new learning rate is selected at an earlier step, distinguish its preview from the recorded transition until continuation replaces it.
- **FR-013**: Every symbol in the update formula MUST be explained in plain language, in keeping with the existing lessons.
- **FR-014**: Every displayed number MUST come from the real computation; no value or path may be drawn from pre-made or invented data.
- **FR-015**: Displayed numbers MUST use a consistent number of decimals, and numbers that are too small or too large to read MUST switch to scientific notation.

**Charts**

- **FR-016**: A 1D lesson MUST show the loss curve with a marker at the current step, and the path of earlier steps.
- **FR-017**: A 2D lesson MUST show the loss surface as a contour map with the path and the current step.
- **FR-018**: Every lesson MUST show a live loss-versus-step line chart next to the surface view, with a cursor at the selected step.
- **FR-019**: The charts and the number panel MUST update within 100 ms of any control change, step, or scrubber move.
- **FR-020**: Charts MUST have text summaries that give the current step, parameters and loss, and MUST not rely on colour alone (colour-blind-safe palette).

**Learning rate and presets**

- **FR-021**: Learners MUST be able to change the learning rate before, during, or after training; a change during training applies from the next step.
- **FR-022**: The system MUST offer one-click presets for "too small", "good" and "too large" learning rates. Selecting a preset changes the rate at the current step without resetting or changing the playback state, and follows the continuation rules in FR-010 and FR-021.
- **FR-023**: After a preset or a run, the lesson MUST show a short plain-language note describing what the learner is seeing (slow, converging, oscillating, diverging), based on the real run and not on which preset was clicked.

**Starting points and minima**

- **FR-024**: The lessons MUST include a non-convex 1D curve with at least two valleys of different depth, so that different starting points reach different minima.
- **FR-025**: Changing the starting point MUST reset the run to step 0 at the new start.
- **FR-026**: The learner MUST be able to set the starting point by typing a value or by dragging a marker on the chart.

**Divergence and limits**

- **FR-027**: The system MUST detect when a step produces a value that is not a finite number, MUST stop playback, and MUST show a clear message that the run has diverged and at which step.
- **FR-028**: After divergence, the earlier valid steps MUST stay available for scrubbing, and no non-finite value MUST be drawn or printed.
- **FR-029**: The system MUST detect a stationary point (the gradient is effectively zero), stop and tell the learner rather than step forever. It MUST NOT identify a stationary point as a minimum solely because the gradient is zero.
- **FR-030**: An active branch MUST stop after 1,000 updates and tell the learner that the limit has been reached. Its starting state and all 1,000 resulting states MUST remain available; an earlier state can still start a separate continuation.

**Lessons and framework**

- **FR-031**: The feature MUST add these lessons to the lesson list, under "Optimization": gradient descent in 1D, gradient descent on a non-convex curve, and gradient descent in 2D.
- **FR-032**: Lessons MUST follow the existing order of intuition, interactive demo, formula and worked example, and the worked example MUST use the values of the selected step.
- **FR-033**: Adding a lesson using a registered iterative algorithm and landscape MUST require only lesson content. Adding a new algorithm MAY require a core adapter and registry entry, but MUST NOT require changes to the playback controls, history or scrubber.
- **FR-034**: The feature MUST work at 1024 px width and above, in both light and dark themes, and keep the keyboard and text-alternative behaviour of the existing lessons.
- **FR-035**: A refresh or direct link MUST start the lesson at its defaults (no saved progress), as in the existing lessons.

### Key Entities

- **Training run**: One attempt of an iterative algorithm. It has a starting point, a current learning rate, and one or more selectable branches of steps; the rate can change between updates. Each branch has at most 1,000 updates. Reset or changing the start begins a new run and clears its branches.
- **Step**: One entry in the history. It records the step number, the parameters at that point, the loss and the gradient; a performed outgoing transition also records its learning rate and resulting update.
- **Playback state**: Whether the run is playing, paused, stopped at a stationary point or diverged, the selected step, and the speed.
- **Loss landscape**: The function being minimised, in 1D (curve) or 2D (surface), including the non-convex curve.
- **Learning rate preset**: A named learning rate ("too small", "good", "too large") for a given lesson.
- **Training lesson**: A lesson described by content (landscape, parameter ranges, presets, texts) that uses the playback system.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After any control action (Play, Pause, step, scrub, speed, learning rate or start change), the charts and numbers show the new state within 100 ms.
- **SC-002**: A run of 1,000 updates can be scrubbed from its starting state through its final state and back, with each position shown within 100 ms and the charts staying smooth.
- **SC-003**: For at least 10 sample runs checked against hand or reference calculations, every displayed weight, loss, gradient and update value matches the reference within the stated tolerance.
- **SC-004**: For every stored step in a 1,000-step run, moving forward then backward shows values identical to the first time (0 differences).
- **SC-005**: With a learning rate that diverges, 100% of runs end with a visible message and without an error screen, and no impossible number is shown.
- **SC-006**: On the non-convex curve, learners can reach at least two different minima by changing only the starting point.
- **SC-007**: In a check with 5 learners, at least 4 can say correctly why a "too small", "good" and "too large" learning rate behave differently after using the presets.
- **SC-008**: Every control of the feature can be reached and used with the keyboard alone, and no automated accessibility check reports a violation on the new lessons in either theme.

## Assumptions

- The learners are the same self-learners with high-school maths as in the first feature.
- The default speeds are slow, normal and fast; their exact rates will be set during planning.
- Each branch holds at most 1,000 updates, plus its starting state; retained sibling branches are not counted against that limit.
- "Good" and "too small" and "too large" learning rates are chosen per lesson, based on the lesson's loss function.
- The 1D lesson uses a simple convex curve; the non-convex lesson uses a curve with two valleys of different depth.
- The 2D lesson uses one smooth bowl-shaped surface by default; other surfaces can be added later as content.
- The step formula is plain gradient descent with the learner-selected rate for each update; momentum and other optimizers are not included.
- The gradient is the exact one derived from the loss function (not an approximation), so that the displayed numbers match hand calculation.
- Training runs on the learner's device; the first feature's structure for lessons, content and charts is reused.
- Out of scope: 3D surface views, accounts, saved progress, other optimizers (momentum, Adam, stochastic gradient descent), training of neural networks or data-fitting models, importing the learner's own functions, and sharing or exporting runs.
- Next features (such as fitting a line with gradient descent on data) will reuse the playback system.
