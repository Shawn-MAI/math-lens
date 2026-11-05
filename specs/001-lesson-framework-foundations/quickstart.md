# Quickstart: Validating the Lesson Framework

A run-and-check guide for the finished feature. It does not contain implementation code. See
[plan.md](./plan.md) for the architecture, [data-model.md](./data-model.md) for entities, and
[contracts/](./contracts/) for the lesson, model, template and chart contracts. Test cases are in
[test-cases.md](./test-cases.md).

## Prerequisites

- Node.js 22 or newer and npm
- A current desktop browser (Chrome, Edge, Firefox or Safari)
- Optional: Python 3 with NumPy, only to regenerate `tests/fixtures/reference-values.json`

## Setup and commands

```bash
npm install            # install dependencies
npm run dev            # start the dev server and print the local URL
npm test               # run all unit, content and component tests once
npm run test:watch     # run tests in watch mode while developing
npm run lint           # type check and lint, including the layer-boundary rules
npm run build          # produce the static site in dist/
npm run preview        # serve dist/ locally to check the production build
```

Regenerate reference values (rarely needed, the JSON is committed):

```bash
python3 tests/fixtures/generate_reference.py
```

## Scenario 1: Automated checks pass (all stories)

1. Run `npm run lint` and `npm test`.
2. **Expect**: no lint errors, all tests pass, including the layer-boundary test (A5), the content tests (C) and
   the 100 ms timing tests (B-13, D-25).

## Scenario 2: Browse lessons (User Story 2)

1. Run `npm run dev` and open the printed URL.
2. **Expect**: four topics in order (Foundations, Optimization, Models, Neural Networks). Foundations lists
   Function and slope, Loss, and Weight and bias. The other three topics say "coming soon" and have no link.
3. Open a lesson, then use the back-to-list link.
4. **Expect**: the lesson opens and you return to the list without the browser back button.
5. Visit `#/lessons/does-not-exist`.
6. **Expect**: a "Lesson not found" message with a link to the list.

## Scenario 3: Function and slope (User Story 1)

1. Open Function and slope. Default: curve y = x², x = 1.0.
2. **Expect** section order: intuition, chart with controls, formula with symbol explanations, worked example.
   The slope reads 2.0 and the tangent is drawn at (1.0, 1.0).
3. Drag the point (or use the arrow keys on it) to x = 1.5.
4. **Expect**: slope 3.0, and the worked example shows `2 · 1.5 = 3.0`.
5. Choose y = x³ and set x = 2.0, then choose y = sin x and set x = 0.0.
6. **Expect**: slopes 12.0 and 1.0. The formula, symbols and worked example change with the curve.
7. Set x = 0.0 on y = x².
8. **Expect**: slope 0.0 and a horizontal tangent.

## Scenario 4: Loss (User Story 1)

1. Open Loss. Default line: steepness 1.0, height 0.0, data (1,2), (2,4), (3,5).
2. **Expect**: errors -1.00, -2.00, -2.00 and loss 3.000.
3. Drag the line (or focus a handle and use arrow keys) until steepness is 2.0 and height is 0.0.
4. **Expect**: errors 0.00, 0.00, 1.00 and loss 0.333. The worked example matches.
5. Confirm the lesson never names the parameters w and b.

## Scenario 5: Weight and bias (User Story 1)

1. Open Weight and bias. Default: w = 1.0, b = 0.0.
2. **Expect**: loss 11.250.
3. Set w = 2.0 and b = 1.0.
4. **Expect**: the line moves and loss shows 0.250. The worked example shows the substituted values.
5. Set w = 1.5 and b = 2.0.
6. **Expect**: loss 0.125.
7. Type `9` in the w input.
8. **Expect**: the value clamps to 3.0 and a message states the allowed range.

## Scenario 6: Reset (User Story 3)

1. In any lesson change several parameters, then activate Reset.
2. **Expect**: every control, the chart, numbers, worked example and summary return to the defaults. Activating
   Reset again changes nothing and shows no error.
3. Reload the page.
4. **Expect**: the lesson starts at its defaults.

## Scenario 7: Light and dark mode (User Story 4)

1. Toggle the mode on the list, then open a lesson.
2. **Expect**: the whole site and the chart switch, remain legible, and the mode stays when navigating between
   the list and lessons. Reset does not change it.

## Scenario 8: Keyboard and text alternatives (User Story 5)

1. Using only the keyboard, complete a lesson: reach every control with Tab, change each parameter, reset,
   toggle the mode and go back to the list.
2. **Expect**: logical focus order, a visible focus indicator everywhere, and arrow keys changing values by 0.1
   (by 1.0 with Shift).
3. **Expect**: each chart has a visible text summary that changes with the parameters.

## Scenario 9: Manual checks (cannot be automated in jsdom)

Record the results in the pull request.

- Layout at 1024, 1280 and 1920 px: nothing overlaps or is cut off.
- Drag a handle with the browser performance panel open: updates complete well under 100 ms and frames stay near
  60 fps.
- Rendered contrast and colour-blind simulation in both themes.
- One screen-reader pass through a lesson.
- Serve `dist/` from a plain static server: deep links and refresh load the lesson at defaults.

### Results (recorded during T075–T083)

Run with Playwright (Chromium) against `npx vite preview` of the production build.

| ID | Check | Result |
|----|-------|--------|
| E-01 | Layout at 1024, 1280, 1920 px, 3 lessons, light and dark | **Pass.** No horizontal scroll, nothing wider than the viewport, no overlap between chart, controls, summary and readouts. Chart 681×454 at 1024 px, 720×480 from 1280 px. |
| E-02 | Drag performance (handle drag on slope and loss; weight slider on weight and bias) | **Pass.** Frame time p50 8.3 ms, p95 ≤ 9.0 ms (display refreshes at 120 Hz, so no dropped frames). Pointer-event handling latency p95 ≤ 4.0 ms, max 4.3 ms, far below 100 ms. Headless Chromium on one machine, so repeat on a real tablet-class device if available. |
| E-03 | Colour-blind simulation (deuteranopia, protanopia, tritanopia, achromatopsia, both themes) | **Pass on the Loss lesson.** Line, points, handles and error markers stay distinguishable through luminance, dash style and text labels. Contrast ratios are also enforced by test D-23. Other lessons share the same palette. |
| E-04 | Screen reader | **Partial.** The accessibility tree shows named sliders ("Steepness of the line (chart handle)"), a labelled chart image, a "Controls" group, live readouts, and a symbol table. axe-core in the browser reports 0 violations on all pages in both themes. A real screen-reader pass (VoiceOver or NVDA) is **still pending** for a human. |
| E-05 | Static build, deep link, refresh | **Pass.** `#/lessons/weight-and-bias` opens at defaults (loss 11.250). After changing w and reloading, defaults return. An unknown lesson id shows "Lesson not found". No console errors. |
| T083 / SC-007 | 5-learner comprehension check | **To be scheduled** with 5 learners. It is not a code task. |

## Scenario 10: Adding a lesson without touching the engine (FR-022)

1. Copy `src/content/lessons/foundations/weight-and-bias/` to a new folder with a new `id`, a new `order`, and
   edit its content (title, dataset id, text).
2. Run `npm test`, then `npm run dev`.
3. **Expect**: the content tests validate the new lesson, and it appears under its topic in the list and opens.
   No file in `src/core/`, `src/sim/` or `src/ui/` was edited.
