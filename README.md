# MathLens

An interactive website that teaches the math behind AI, machine learning and deep learning through visualization.
It is a static, client-side site: every number and chart is computed in the browser.

The first feature is the lesson framework with three foundation lessons: **Function and slope**, **Loss** and
**Weight and bias**.

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
(plus a dataset in `src/content/datasets/` if it needs one). No source file needs to change.

## More

- [Quickstart and manual checks](specs/001-lesson-framework-foundations/quickstart.md)
- [Plan and architecture](specs/001-lesson-framework-foundations/plan.md)
- [Test cases](specs/001-lesson-framework-foundations/test-cases.md)
