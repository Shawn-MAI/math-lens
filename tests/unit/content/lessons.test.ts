import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { getLessonCatalog } from '../../../src/sim/content/loader'
import { isTrainingLesson, type Lesson } from '../../../src/sim/content/schema'
import { createLessonStore } from '../../../src/sim/lessonStore'
import { getModel } from '../../../src/sim/models'
import { renderLesson } from '../../../src/sim/lessonView'
import { TOPICS } from '../../../src/sim/content/topics'
import { CHARTS } from '../../../src/ui/charts/chartRegistry'

const catalog = getLessonCatalog()
const lessons = catalog.lessons.filter((lesson): lesson is Lesson => !isTrainingLesson(lesson))

/** What each chart type needs from the model (contracts/chart-types.md) and which options name parameters. */
const CHART_CONTRACT: Record<string, { outputs: string[]; paramOptions: string[]; handleOptions: string[] }> = {
  'curve-tangent': { outputs: ['curveX', 'curveY', 'tangentX', 'tangentY', 'y', 'slope'], paramOptions: ['xParam'], handleOptions: ['xParam'] },
  'line-fit': {
    outputs: ['lineX', 'lineY', 'predictions', 'errors', 'squaredErrors', 'mse', 'n'],
    paramOptions: ['slopeParam', 'interceptParam'],
    handleOptions: ['slopeParam', 'interceptParam'],
  },
}

const FOUNDATIONS = ['function-and-slope', 'loss', 'weight-and-bias']

const byId = (id: string): Lesson => {
  const lesson = catalog.getLesson(id)
  if (!lesson || isTrainingLesson(lesson)) throw new Error(`missing static lesson ${id}`)
  return lesson
}

describe('lesson content', () => {
  it('C-01: the three foundation lessons exist, in order, and validate', () => {
    expect(catalog.getLessonsByTopic('foundations').map((l) => l.id)).toEqual(FOUNDATIONS)
  })

  describe.each(lessons.map((l) => [l.id, l] as const))('%s', (_id, lesson) => {
    it('C-02: topic is one of the four topics, order is positive', () => {
      expect(TOPICS.map((t) => t.id)).toContain(lesson.topic)
      expect(lesson.order).toBeGreaterThan(0)
    })

    it('C-03: model exists and every role is bound to a number parameter', () => {
      const model = getModel(lesson.model.id)
      for (const role of model.roles) {
        const target = lesson.parameters.find((p) => p.id === lesson.model.bind?.[role])
        expect(target?.type).toBe('number')
      }
    })

    it('C-04: every output key is produced by the model', () => {
      const model = getModel(lesson.model.id)
      for (const o of lesson.outputs) expect(model.outputKeys).toContain(o.key)
    })

    it('C-05: ranges and defaults sit on the 0.1 step grid', () => {
      for (const p of lesson.parameters) {
        if (p.type !== 'number') continue
        expect(p.min).toBeLessThan(p.max)
        expect(p.step).toBe(0.1)
        for (const v of [p.min, p.max, p.default]) expect(Math.abs((v - p.min) / p.step - Math.round((v - p.min) / p.step))).toBeLessThan(1e-9)
      }
    })

    it('C-06: the chart type exists, its required outputs are produced, and its options name real parameters', () => {
      const contract = CHART_CONTRACT[lesson.chart.type]
      expect(contract, `chart type ${lesson.chart.type}`).toBeDefined()
      expect(CHARTS[lesson.chart.type]).toBeDefined()
      expect(CHARTS[lesson.chart.type]!.requiredOutputs).toEqual(expect.arrayContaining(contract!.outputs))
      const model = getModel(lesson.model.id)
      for (const key of contract!.outputs) expect(model.outputKeys).toContain(key)
      for (const option of contract!.paramOptions) {
        const id = lesson.chart.options?.[option]
        expect(lesson.parameters.some((p) => p.type === 'number' && p.id === id), `${option} = ${String(id)}`).toBe(true)
      }
    })

    it('C-07: every symbol appears in the formula and every letter or command in the formula has a symbol', () => {
      const choiceValues = lesson.formula && 'variants' in lesson.formula ? Object.keys(lesson.formula.variants) : [undefined]
      for (const choice of choiceValues) {
        const formula = choice === undefined ? (lesson.formula as { latex: string; symbols: { symbol: string }[] }) : (lesson.formula as { variants: Record<string, { latex: string; symbols: { symbol: string }[] }> }).variants[choice]!
        for (const s of formula.symbols) expect(formula.latex, `symbol ${s.symbol}`).toContain(s.symbol)

        const withoutText = formula.latex.replace(/\\text\{[^}]*\}/g, '')
        const commands = withoutText.match(/\\[a-zA-Z]+/g) ?? []
        const allowed = ['\\frac', '\\cdot', '\\quad', '\\qquad', '\\Rightarrow', '\\sum', '\\sin', '\\cos', '\\hat', '\\text', '\\dots']
        for (const c of commands) {
          if (['\\sum', '\\sin', '\\cos'].includes(c)) expect(formula.symbols.some((s) => s.symbol.includes(c)), `command ${c}`).toBe(true)
          else expect(allowed, `command ${c}`).toContain(c)
        }
        const letters = withoutText.replace(/\\[a-zA-Z]+/g, '').match(/[a-zA-Z]/g) ?? []
        for (const letter of new Set(letters)) {
          expect(formula.symbols.some((s) => s.symbol.includes(letter)), `letter ${letter}`).toBe(true)
        }
        const mentionsMse = withoutText.length !== formula.latex.length && formula.latex.includes('\\text{MSE}')
        if (mentionsMse) expect(formula.symbols.some((s) => s.symbol === 'MSE')).toBe(true)
      }
    })

    it('C-08: intuition.md is non-empty', () => {
      expect(lesson.intuition.trim().length).toBeGreaterThan(50)
    })
  })

  describe('rendering at the default, minimum and maximum of every parameter', () => {
    const settings = (lesson: Lesson): Record<string, number | string>[] => {
      const out: Record<string, number | string>[] = [{}]
      for (const p of lesson.parameters) {
        if (p.type === 'number') out.push({ [p.id]: p.min }, { [p.id]: p.max })
        else for (const o of p.options) out.push({ [p.id]: o.value })
      }
      return out
    }

    it.each(lessons.map((l) => [l.id, l] as const))('C-09, C-11: %s resolves every template and its LaTeX parses', (_id, lesson) => {
      for (const change of settings(lesson)) {
        const store = createLessonStore(lesson)
        for (const [id, value] of Object.entries(change)) store.getState().setParam(id, value)
        const { params, outputs } = store.getState()
        const view = renderLesson(lesson, params, outputs)
        expect(view.summary).not.toContain('{{')
        katex.renderToString(view.formula.latex, { throwOnError: true })
        for (const s of view.formula.symbols) katex.renderToString(s.symbol, { throwOnError: true })
        for (const step of view.workedExample) {
          expect(step.text + step.latex).not.toContain('{{')
          katex.renderToString(step.latex, { throwOnError: true })
        }
      }
    })

    const threeSettings: Record<string, Record<string, number | string>[]> = {
      'function-and-slope': [{ x: 1.5 }, { x: -2.3, curve: 'x3' }, { x: 0, curve: 'sin' }],
      loss: [{ steepness: 2, height: 0 }, { steepness: -1.5, height: 3.3 }, { steepness: 3, height: -5 }],
      'weight-and-bias': [{ w: 2, b: 1 }, { w: 1.5, b: 2 }, { w: -2.7, b: -0.5 }],
    }

    it.each(FOUNDATIONS)('C-10: the worked example of %s ends in the displayed value', (id) => {
      const lesson = byId(id)
      for (const change of threeSettings[id]!) {
        const store = createLessonStore(lesson)
        for (const [key, value] of Object.entries(change)) store.getState().setParam(key, value)
        const view = renderLesson(lesson, store.getState().params, store.getState().outputs)
        const last = view.workedExample.at(-1)!.latex.split('=').pop()!.trim()
        expect(view.readouts.map((r) => r.text), `final value "${last}"`).toContain(last)
      }
    })
  })

  it('C-12: datasets have 1 to 10 finite points', () => {
    for (const lesson of lessons) {
      if (!lesson.datasetId) continue
      const dataset = catalog.getDataset(lesson.datasetId)!
      expect(dataset.points.length).toBeGreaterThanOrEqual(1)
      expect(dataset.points.length).toBeLessThanOrEqual(10)
    }
    expect(catalog.getDataset('loss-3')!.points).toEqual([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 5 }])
    expect(catalog.getDataset('weight-bias-4')!.points).toEqual([{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }, { x: 4, y: 8 }])
  })

  it('C-13: handle controls use a chart that exposes handles, bound to the right parameters', () => {
    for (const lesson of lessons) {
      const contract = CHART_CONTRACT[lesson.chart.type]!
      const handled = lesson.parameters.filter((p) => p.type === 'number' && p.control !== 'slider')
      const exposed = contract.handleOptions.map((o) => lesson.chart.options?.[o])
      const handlesOn = lesson.chart.options?.handles === true || lesson.chart.type === 'curve-tangent'
      for (const p of handled) {
        expect(handlesOn, `${lesson.id}: ${p.id} needs chart handles`).toBe(true)
        expect(exposed, `${lesson.id}: ${p.id} is not exposed by the chart`).toContain(p.id)
      }
      if (lesson.chart.options?.handles === true) {
        for (const id of exposed) {
          const p = lesson.parameters.find((q) => q.id === id)
          expect(p?.type === 'number' && p.control !== 'slider').toBe(true)
        }
      }
    }
  })

  it('C-15: the Loss lesson does not introduce w or b', () => {
    const loss = byId('loss')
    for (const p of loss.parameters) {
      expect(['w', 'b']).not.toContain(p.id)
      if (p.type === 'number') expect(p.symbol).toBeUndefined()
    }
    const text = JSON.stringify([loss.formula, loss.workedExample, loss.chartSummary]) + loss.intuition
    expect(text).not.toMatch(/(^|[^A-Za-z\\])[wb]($|[^A-Za-z])/)
  })
})
