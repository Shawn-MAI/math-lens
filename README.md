# MathLens

An interactive website that teaches the math behind AI, machine learning and deep learning through visualization.
It is a static, client-side site: every number and chart is computed in the browser.

The Foundations topic includes **Function and slope**, **Loss** and **Weight and bias**.
Optimization adds **Gradient descent on a curve**, **Different starting points** and
**Two weights, one loss**.

Training lessons show each computed gradient and update. Play or pause, adjust the speed, step
through or scrub the retained history, and compare learning-rate presets. Editing the rate at an
earlier step creates a new history branch when training continues; the branch selector keeps
previous futures available. Changing the starting weights restarts the run.

## Requirements

- Node.js 22 or newer and npm

## Commands

```bash
npm install         # install dependencies
npm run dev         # start the dev server and print the local URL
npm test            # run all tests once
npm run test:watch  # run tests in watch mode
npm run lint        # lint, including the layer-boundary rules
npm run typecheck   # type check
npm run build       # type check, then produce the static site in dist/
npm run preview     # serve dist/ locally
```

## Layout

| Folder | Layer | Rule |
|--------|-------|------|
| `src/core/` | Pure TypeScript math | No React, no state library, no DOM |
| `src/sim/` | State, content loading, templates | May import `core`, never `ui` |
| `src/ui/` | React components and SVG charts | May import `sim` and `core` |
| `src/content/` | Lessons (JSON and Markdown) and datasets | Content only |

To add a lesson, add a folder under `src/content/lessons/<topic>/<lesson-id>/` with `lesson.json` and `intuition.md`
(plus a dataset in `src/content/datasets/` if it needs one). A training lesson can use an existing
registered adapter, landscape and compatible chart by specifying `kind: "training"`, its weight
and rate parameter bindings, dimensions and presets; see the Optimization lesson JSON files for
examples. New algorithms or landscapes require implementation and tests in the appropriate core
and simulation layers. The content loader checks bindings and dimensions at startup.

## More

- [Quickstart and manual checks](specs/001-lesson-framework-foundations/quickstart.md)
- [Training playback verification and manual checks](specs/002-gradient-descent-playback/quickstart.md)
- [Plan and architecture](specs/001-lesson-framework-foundations/plan.md)
- [Test cases](specs/001-lesson-framework-foundations/test-cases.md)
