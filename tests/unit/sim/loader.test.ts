import { describe, expect, it } from 'vitest'
import type { Model } from '../../../src/core/types'
import { buildCatalog, type ContentFiles } from '../../../src/sim/content/loader'

const fakeModel: Model = {
  id: 'fake',
  roles: ['a'],
  choiceInputs: ['mode'],
  needsDataset: true,
  outputKeys: ['total'],
  compute: () => ({ total: 0 }),
}
const models = { fake: fakeModel }

const lesson = (over: Record<string, unknown> = {}) => ({
  id: 'one',
  topic: 'foundations',
  order: 1,
  title: 'One',
  summary: 'First lesson',
  model: { id: 'fake', bind: { a: 'p' } },
  datasetId: 'pts',
  chart: { type: 'line-fit' },
  parameters: [
    { type: 'number', id: 'p', label: 'P', min: -3, max: 3, step: 0.1, default: 1, control: 'slider' },
    { type: 'choice', id: 'mode', label: 'Mode', options: [{ value: 'u', label: 'U' }, { value: 'v', label: 'V' }], default: 'u' },
  ],
  outputs: [{ key: 'total', label: 'Total', decimals: 2 }],
  formula: { latex: 'x', symbols: [{ symbol: 'x', meaning: 'an unknown' }] },
  workedExample: [{ text: 'a', latex: 'b' }],
  chartSummary: 'summary',
  ...over,
})

const files = (l: unknown = lesson(), extra: Partial<ContentFiles> = {}): ContentFiles => ({
  lessons: { '/src/content/lessons/foundations/one/lesson.json': l },
  intuitions: { '/src/content/lessons/foundations/one/intuition.md': 'Some text' },
  datasets: { '/src/content/datasets/pts.json': { id: 'pts', label: 'Points', points: [{ x: 1, y: 2 }] } },
  ...extra,
})

describe('buildCatalog', () => {
  it('accepts valid content and indexes it', () => {
    const catalog = buildCatalog(files(), models)
    expect(catalog.getLesson('one')?.intuition).toBe('Some text')
    expect(catalog.getLessonsByTopic('foundations')).toHaveLength(1)
    expect(catalog.getLessonsByTopic('models')).toHaveLength(0)
    expect(catalog.getDataset('pts')?.points).toHaveLength(1)
  })

  it.each([
    ['id differs from folder', lesson({ id: 'other' }), /equal the folder name/],
    ['topic differs from folder', lesson({ topic: 'models' }), /parent folder/],
    ['unknown model', lesson({ model: { id: 'nope' } }), /unknown model/],
    ['unbound role', lesson({ model: { id: 'fake', bind: {} } }), /not bound/],
    ['role bound to a missing parameter', lesson({ model: { id: 'fake', bind: { a: 'zzz' } } }), /unknown parameter/],
    ['role bound to a choice parameter', lesson({ model: { id: 'fake', bind: { a: 'mode' } } }), /number parameter/],
    ['unknown dataset', lesson({ datasetId: 'missing' }), /unknown dataset/],
    ['output not produced', lesson({ outputs: [{ key: 'ghost', label: 'G', decimals: 1 }] }), /not produced/],
    ['default off the step grid', lesson({ parameters: [{ type: 'number', id: 'p', label: 'P', min: 0, max: 1, step: 0.1, default: 0.25, control: 'slider' }] }), /multiple of step/],
    ['variant missing an option', lesson({ chartSummary: { variantBy: 'mode', variants: { u: 'only u' } } }), /missing variant for "v"/],
  ])('rejects: %s', (_name, bad, message) => {
    expect(() => buildCatalog(files(bad), models)).toThrowError(message)
  })

  it('rejects a missing or empty intuition.md', () => {
    expect(() => buildCatalog(files(lesson(), { intuitions: {} }), models)).toThrowError(/intuition\.md/)
    expect(() => buildCatalog(files(lesson(), { intuitions: { '/src/content/lessons/foundations/one/intuition.md': '  ' } }), models)).toThrowError(/intuition\.md/)
  })

  it('rejects a duplicate order within a topic', () => {
    const two = lesson({ id: 'two' })
    const f = files()
    f.lessons['/src/content/lessons/foundations/two/lesson.json'] = two
    f.intuitions['/src/content/lessons/foundations/two/intuition.md'] = 'x'
    expect(() => buildCatalog(f, models)).toThrowError(/order 1 is already used/)
  })

  it('rejects a dataset whose id differs from its file name', () => {
    const f = files(lesson(), { datasets: { '/src/content/datasets/pts.json': { id: 'other', label: 'x', points: [{ x: 1, y: 1 }] } } })
    expect(() => buildCatalog(f, models)).toThrowError(/file name/)
  })
})
