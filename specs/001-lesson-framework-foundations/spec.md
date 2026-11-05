# Feature Specification: Lesson Framework and Foundation Lessons

**Feature Branch**: `001-lesson-framework-foundations`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "Build the foundation of MathLens: a lesson framework where a learner opens a lesson, reads short explanations, and interacts with a visualization panel that has parameter controls. First lessons: Function and slope, Loss, Weight and bias."

## Clarifications

### Session 2026-11-05

- Q: Should "Function and slope" let the learner switch between several curves, or use one fixed curve? → A: The learner can choose from 3 curves: y = x², y = x³ and y = sin x (default y = x²).
- Q: How should the slope at the chosen point be shown? → A: As the exact slope rule for the chosen curve (e.g. 2x for y = x²) evaluated at the point; no nearby-points estimate is shown.
- Q: In the "Loss" lesson, how does the learner move the prediction line? → A: By dragging the line directly on the chart (arrow keys for keyboard users); w and b are not named until "Weight and bias".
- Q: Should dragged values snap to fixed steps or move smoothly? → A: They snap to 0.1 steps and parameter values are displayed with 1 decimal place.
- Q: On refresh or opening a lesson link directly, should values start at defaults or be restored? → A: Always start at the lesson's default values; nothing is remembered.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore a lesson by changing its parameters (Priority: P1)

A self-learner with high-school math opens a lesson. They read a short plain-language intuition, then move a control (for example, a point on a curve) and watch the chart and the displayed numbers change immediately. Below the demo they read the formula with every symbol explained, followed by a worked numeric example that uses the exact parameter values currently set on the controls.

**Why this priority**: This is the core learning loop of MathLens. Without a lesson that reacts to the learner's input, there is no product.

**Independent Test**: Open the "Function and slope" lesson, drag the point along the curve, and confirm the tangent line, the slope value and the worked example all update to match the new position.

**Acceptance Scenarios**:

1. **Given** the "Function and slope" lesson is open with default parameters, **When** the learner moves the point to x = 1.5 on the curve y = x², **Then** the tangent line is drawn at that point, the slope shows 3, and the worked example shows the formula with 1.5 substituted and a result of 3.
2. **Given** the "Loss" lesson is open, **When** the learner moves the prediction line, **Then** each data point shows its own error, and the total loss (mean squared error) updates to the hand-calculated value for that line.
3. **Given** the "Weight and bias" lesson is open, **When** the learner changes w or b of y = w·x + b, **Then** the line moves on the chart, the loss value updates, and the worked example shows the current w and b substituted into the formula.
4. **Given** any lesson is open, **When** the learner reads it from top to bottom, **Then** the sections appear in this order: intuition, interactive demo, formula with symbol explanations, worked numeric example.

---

### User Story 2 - Browse and open lessons by topic (Priority: P2)

A learner lands on MathLens and sees the list of lessons grouped under four topics: Foundations, Optimization, Models and Neural Networks. They pick a lesson and open it, and can return to the list at any time.

**Why this priority**: Browsing is how learners reach lessons. It matters less than the lesson itself because a lesson can be reached by direct link before the list exists.

**Independent Test**: Open the home page, confirm the four topic groups are shown with the three foundation lessons under Foundations, open one lesson, and return to the list.

**Acceptance Scenarios**:

1. **Given** the learner is on the lesson list, **When** the page loads, **Then** lessons are shown grouped under Foundations, Optimization, Models and Neural Networks.
2. **Given** a topic has no available lessons yet, **When** the learner views the list, **Then** that topic is still shown and is clearly marked as coming soon, and it cannot be opened as a lesson.
3. **Given** the learner is on the list, **When** they select a lesson, **Then** that lesson opens, and they can return to the list without using the browser's back button.

---

### User Story 3 - Reset parameters to defaults (Priority: P3)

While experimenting, the learner wants to get back to a known starting point. A single reset action restores every parameter in the open lesson to its default, and the chart, numbers and worked example return to their default state.

**Why this priority**: It makes experimenting safe, but the lesson is still usable without it.

**Independent Test**: In the "Weight and bias" lesson, change w and b to non-default values, activate reset, and confirm both controls, the chart, the loss and the worked example show defaults again.

**Acceptance Scenarios**:

1. **Given** the learner has changed one or more parameters, **When** they activate reset, **Then** every parameter returns to its default value and all visuals and numbers match the defaults.
2. **Given** all parameters are already at their defaults, **When** the learner activates reset, **Then** nothing changes and no error appears.

---

### User Story 4 - Switch between light and dark mode (Priority: P3)

A learner who prefers a dark or light screen toggles the appearance from anywhere in the site. The whole site, including charts, switches while staying readable.

**Why this priority**: It improves comfort but does not affect whether learners can learn the math.

**Independent Test**: Toggle the mode on the lesson list and on a lesson page and confirm text, controls and charts remain legible in both modes.

**Acceptance Scenarios**:

1. **Given** the site is in light mode, **When** the learner toggles the mode, **Then** the site, including chart colours and labels, switches to dark mode and remains legible.
2. **Given** the learner has chosen a mode, **When** they navigate between the list and lessons, **Then** the chosen mode stays in effect.

---

### User Story 5 - Use lessons with keyboard only (Priority: P2)

A learner who cannot or prefers not to use a mouse operates every control (parameter controls, reset, mode toggle, lesson navigation) using only the keyboard, and can read a text summary of what each chart currently shows.

**Why this priority**: Keyboard operability and text alternatives are constitution requirements, and they are far cheaper to build into the framework now than to retrofit.

**Independent Test**: Complete the "Loss" lesson without a pointing device: navigate to it, change every parameter, reset and toggle the mode. Confirm the chart summary text reflects the current values.

**Acceptance Scenarios**:

1. **Given** a lesson is open, **When** the learner presses Tab, **Then** focus moves through all interactive elements in a logical order with a visible focus indicator.
2. **Given** a parameter control has focus, **When** the learner uses the arrow keys, **Then** the parameter changes in small steps and the visuals update as they do for mouse input.
3. **Given** a chart is displayed, **When** the parameters change, **Then** a text summary of the chart (for example, the line equation and the total loss) updates to match.

---

### Edge Cases

- A parameter is set to the minimum or maximum of its range: the chart still renders correctly, and the control cannot go beyond the range.
- The learner types a value outside the allowed range or a non-number into a numeric input: the previous valid value is kept, and the learner sees a brief message explaining the allowed range.
- The learner drags a control rapidly: the displayed numbers never lag behind or contradict the chart.
- In the Loss and Weight and bias lessons, the line passes exactly through every data point: the total loss shows 0 and the errors show 0.
- The slope at the chosen point is 0 (for example at x = 0 on y = x²): the tangent line is horizontal and the slope displays 0, not a blank or an error.
- The slope is steep or negative: the tangent line stays visible within the chart area.
- A lesson topic has no lessons yet: the list shows it as coming soon instead of hiding it or showing an empty or broken link.
- The learner opens a lesson link that does not exist: they see a clear "lesson not found" message with a way back to the list.
- The window is narrower than 1024 px: the page remains usable and nothing is lost, although no layout guarantees are made below that width.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a lesson list grouped under four topics: Foundations, Optimization, Models and Neural Networks.
- **FR-002**: The system MUST list the three first lessons (Function and slope, Loss, Weight and bias) under Foundations, and MUST show topics without lessons as "coming soon".
- **FR-003**: Learners MUST be able to open any available lesson from the list and return to the list from inside a lesson.
- **FR-004**: Every lesson MUST present, in this order: an intuition text, an interactive visualization with a parameter control panel, a formula section, and a worked numeric example.
- **FR-005**: The formula section MUST explain every symbol used in the lesson's formulas in plain language.
- **FR-006**: The worked numeric example MUST substitute the current parameter values into the lesson's formula and show the step-by-step result, updating whenever a parameter changes.
- **FR-007**: Changing any parameter MUST update the chart, all displayed numeric values and the worked example together, within 100 ms.
- **FR-008**: Every numeric value shown MUST be computed from the current parameters and MUST NOT be hard-coded or pre-drawn.
- **FR-009**: Every lesson MUST provide a reset action that restores all of its parameters to their defaults. Opening a lesson, including by direct link or page refresh, MUST always start at those defaults.
- **FR-010**: The "Function and slope" lesson MUST let the learner choose one of three curves (y = x², y = x³, y = sin x; default y = x²), move a point along the chosen curve, and MUST display the tangent line at that point and the numeric slope there, calculated from the curve's exact slope rule (for example 2x for y = x²) at the point's x position. The worked example MUST show that rule with the current x substituted. Changing the curve MUST update the chart, slope, formula and worked example together and keep the point at the same x position where it lies within the curve's range.
- **FR-011**: The "Loss" lesson MUST let the learner move a prediction line over a set of data points by dragging the line directly on the chart (keyboard: arrow keys give the same control), and MUST display each point's error and the total loss as mean squared error (MSE). This lesson MUST NOT introduce the names w and b; they are introduced in "Weight and bias".
- **FR-012**: The "Weight and bias" lesson MUST let the learner change w and b of y = w·x + b using separate controls, MUST draw the resulting line, and MUST display the loss for that line.
- **FR-013**: Each parameter MUST have a defined range, a step size of 0.1 and a default value. Dragging, arrow keys and typed values MUST snap to that step, and out-of-range input MUST be rejected or clamped with a clear message. Parameter values MUST be displayed with 1 decimal place.
- **FR-014**: The system MUST offer a light/dark mode toggle available on every page, and the chosen mode MUST persist while the learner navigates within the site.
- **FR-015**: Charts, controls and text MUST remain legible in both modes.
- **FR-016**: All interactive elements MUST be operable by keyboard alone, with a visible focus indicator and a logical focus order.
- **FR-017**: Every chart MUST have a text summary of its current state that updates as parameters change.
- **FR-018**: Chart colours MUST be distinguishable by people with common forms of colour-blindness, and no information MAY be conveyed by colour alone.
- **FR-019**: The layout MUST work at viewport widths of 1024 px and above.
- **FR-020**: The system MUST show a clear "lesson not found" message with a link back to the list when a lesson address does not exist.
- **FR-021**: The system MUST NOT include accounts, saved progress, training animation or neural network lessons in this feature.
- **FR-022**: Adding a new lesson to the framework MUST NOT require changes to the list, navigation or mode toggle beyond registering the lesson and its topic.

### Key Entities

- **Topic**: A named group of lessons (Foundations, Optimization, Models, Neural Networks), with a display order. A topic may have zero lessons.
- **Lesson**: A single teachable concept belonging to one topic. It has a title, a short summary, an intuition text, a set of parameters, a formula with symbol explanations, and a worked example.
- **Curve**: One of the three selectable functions in the "Function and slope" lesson, with its formula and its slope rule.
- **Parameter**: An adjustable value in a lesson. It has a name, the symbol it represents, a minimum, a maximum, a step, a default and a current value.
- **Dataset**: A fixed set of (x, y) points used by the Loss and Weight and bias lessons. It is the same each time the lesson is opened.
- **Formula Symbol**: A symbol in a lesson's formula with its plain-language meaning.
- **Display Preference**: The learner's chosen light or dark mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In every lesson, 100% of parameter changes show updated chart and numbers within 100 ms.
- **SC-002**: For each lesson, at least three different parameter settings produce displayed values that match hand-calculated results exactly to the displayed precision. For example, with the curve y = x² and x = 1.5, the slope is 3; with y = x³ and x = 2, the slope is 12; with y = sin x and x = 0, the slope is 1. For data points (1, 2), (2, 4), (3, 5) and the line y = 2x, the errors are 0, 0 and 1 and the MSE is 1/3 ≈ 0.333.
- **SC-003**: In 100% of lessons, the worked example shows the current parameter values and its final result equals the value displayed in the visualization.
- **SC-004**: A first-time learner can open a lesson from the list and change a parameter within 30 seconds, without instructions.
- **SC-005**: A learner can complete all actions in all three lessons (navigate, change every parameter, reset, toggle mode) using only the keyboard.
- **SC-006**: All pages pass an automated accessibility check with no critical issues in both light and dark modes, and chart summaries are present for 100% of charts.
- **SC-007**: At least 4 out of 5 test learners with high-school math can correctly explain, in their own words, what slope, loss, weight and bias mean after completing the corresponding lesson.
- **SC-008**: Layout shows no overlapping or cut-off content at widths from 1024 px to 1920 px.

## Assumptions

- Target learners are self-learners with high-school math and no prior machine-learning knowledge.
- Lessons are in English only for this feature.
- The site is used on desktop and tablet-landscape screens (1024 px and wider); phone layouts are out of scope.
- The "Function and slope" lesson offers exactly three curves (y = x², y = x³, y = sin x), with y = x² as the default. Learners cannot enter their own function.
- The Loss and Weight and bias lessons use small fixed datasets (a handful of points) that learners cannot edit in this feature.
- Total loss is mean squared error: the average of the squared differences between prediction and actual value.
- Reset applies to the open lesson only. The light/dark choice is not changed by reset.
- The initial light/dark mode follows the learner's system preference, and the choice persists only while navigating the site in the current visit. Saving it between visits is not required, because saving progress is out of scope.
- Calculated results (slope, errors, loss) are shown with a fixed, lesson-defined number of decimal places, and the worked example uses the same precision.
- Topics other than Foundations have no lessons yet. Optimization, Models and Neural Networks are placeholders for later features, and training animation arrives in the next feature.
- Out of scope: accounts, saving progress, training animation, neural network content, editing datasets, and languages other than English.
