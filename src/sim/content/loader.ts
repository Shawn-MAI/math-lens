import type { Model, Point } from '../../core/types'
import { MODELS } from '../models'
import { assertVariantCovers } from '../template'
import { datasetSchema, lessonSchema, type Dataset, type Lesson } from './schema'
import { TOPICS, type TopicId } from './topics'

/** Raw content files keyed by their path. JSON files are already parsed, Markdown files are text. */
export interface ContentFiles {
  lessons: Record<string, unknown>
  intuitions: Record<string, string>
  datasets: Record<string, unknown>
}

export interface Catalog {
  /** Sorted by topic order, then lesson order. */
  lessons: Lesson[]
  datasets: Record<string, Dataset>
  getLesson(id: string): Lesson | undefined
  getDataset(id: string): Dataset | undefined
  getLessonsByTopic(topic: TopicId): Lesson[]
}

const RESERVED_NAMES = ['dataX', 'dataY']

const lessonPath = /(?:^|\/)lessons\/([^/]+)\/([^/]+)\/lesson\.json$/
const intuitionPath = /(?:^|\/)lessons\/([^/]+)\/([^/]+)\/intuition\.md$/
const datasetPath = /(?:^|\/)datasets\/([^/]+)\.json$/

function formatZodError(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues.map((i) => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`).join('; ')
}

/** Validates content files and builds the catalog. Throws one error listing every problem found. */
export function buildCatalog(files: ContentFiles, models: Record<string, Model> = MODELS): Catalog {
  const problems: string[] = []
  const fail = (where: string, message: string) => problems.push(`${where}: ${message}`)

  const datasets: Record<string, Dataset> = {}
  for (const [path, raw] of Object.entries(files.datasets)) {
    const match = datasetPath.exec(path)
    const parsed = datasetSchema.safeParse(raw)
    if (!match || !parsed.success) {
      fail(path, parsed.success ? 'not a dataset file path' : formatZodError(parsed.error))
      continue
    }
    if (parsed.data.id !== match[1]) fail(path, `dataset id "${parsed.data.id}" must equal the file name "${match[1]}"`)
    datasets[parsed.data.id] = parsed.data
  }

  const intuitions = new Map<string, string>()
  for (const [path, text] of Object.entries(files.intuitions)) {
    const match = intuitionPath.exec(path)
    if (match) intuitions.set(`${match[1]}/${match[2]}`, text)
  }

  const lessons: Lesson[] = []
  const seenIds = new Set<string>()
  const seenOrders = new Set<string>()

  for (const [path, raw] of Object.entries(files.lessons)) {
    const match = lessonPath.exec(path)
    if (!match) {
      fail(path, 'lesson files must be at lessons/<topic>/<id>/lesson.json')
      continue
    }
    const [, folderTopic, folderId] = match as unknown as [string, string, string]
    const parsed = lessonSchema.safeParse(raw)
    if (!parsed.success) {
      fail(path, formatZodError(parsed.error))
      continue
    }
    const data = parsed.data
    const where = `lesson "${data.id}"`

    if (data.id !== folderId) fail(where, `id must equal the folder name "${folderId}"`)
    if (data.topic !== folderTopic) fail(where, `topic "${data.topic}" must equal the parent folder "${folderTopic}"`)
    if (seenIds.has(data.id)) fail(where, 'id is not unique')
    seenIds.add(data.id)
    const orderKey = `${data.topic}:${data.order}`
    if (seenOrders.has(orderKey)) fail(where, `order ${data.order} is already used in topic "${data.topic}"`)
    seenOrders.add(orderKey)

    const intuition = intuitions.get(`${folderTopic}/${folderId}`)
    if (intuition === undefined || intuition.trim() === '') fail(where, 'intuition.md is missing or empty')

    checkModelAndParameters(data, models, datasets, where, fail)

    const choiceOptions: Record<string, string[]> = {}
    for (const p of data.parameters) if (p.type === 'choice') choiceOptions[p.id] = p.options.map((o) => o.value)
    for (const field of ['formula', 'workedExample', 'chartSummary'] as const) {
      try {
        assertVariantCovers(data[field], choiceOptions, `${where} ${field}`)
      } catch (error) {
        problems.push((error as Error).message)
      }
    }

    lessons.push({ ...data, intuition: intuition ?? '' })
  }

  if (problems.length > 0) throw new Error(`Invalid lesson content:\n- ${problems.join('\n- ')}`)

  const topicOrder = new Map(TOPICS.map((t) => [t.id, t.order]))
  lessons.sort((a, b) => topicOrder.get(a.topic)! - topicOrder.get(b.topic)! || a.order - b.order)
  const byId = new Map(lessons.map((l) => [l.id, l]))

  return {
    lessons,
    datasets,
    getLesson: (id) => byId.get(id),
    getDataset: (id) => datasets[id],
    getLessonsByTopic: (topic) => lessons.filter((l) => l.topic === topic),
  }
}

function checkModelAndParameters(
  lesson: Omit<Lesson, 'intuition'>,
  models: Record<string, Model>,
  datasets: Record<string, Dataset>,
  where: string,
  fail: (where: string, message: string) => void,
): void {
  const outputKeys = new Set(lesson.outputs.map((o) => o.key))
  for (const p of lesson.parameters) {
    if (outputKeys.has(p.id) || RESERVED_NAMES.includes(p.id)) fail(where, `parameter id "${p.id}" clashes with an output key or reserved name`)
  }

  const model = models[lesson.model.id]
  if (!model) {
    fail(where, `unknown model "${lesson.model.id}"`)
    return
  }

  const bind = lesson.model.bind ?? {}
  for (const role of model.roles) {
    const target = bind[role]
    const parameter = lesson.parameters.find((p) => p.id === target)
    if (!target) fail(where, `model role "${role}" is not bound to a parameter`)
    else if (!parameter) fail(where, `role "${role}" is bound to unknown parameter "${target}"`)
    else if (parameter.type !== 'number') fail(where, `role "${role}" must be bound to a number parameter`)
  }
  for (const role of Object.keys(bind)) {
    if (!model.roles.includes(role)) fail(where, `model "${model.id}" has no role "${role}"`)
  }

  for (const name of model.choiceInputs) {
    const parameter = lesson.parameters.find((p) => p.id === name)
    if (parameter?.type !== 'choice') fail(where, `model input "${name}" needs a choice parameter with the same id`)
  }

  if (model.needsDataset && !lesson.datasetId) fail(where, `model "${model.id}" needs a datasetId`)
  if (lesson.datasetId && !datasets[lesson.datasetId]) fail(where, `unknown dataset "${lesson.datasetId}"`)

  for (const output of lesson.outputs) {
    if (!model.outputKeys.includes(output.key)) fail(where, `output "${output.key}" is not produced by model "${model.id}"`)
  }
}

export function datasetPoints(dataset: Dataset | undefined): Point[] | undefined {
  return dataset?.points.map((p) => ({ x: p.x, y: p.y }))
}

let cached: Catalog | undefined

/** The catalog of the bundled content in `src/content`, validated once on first use. */
export function getLessonCatalog(): Catalog {
  cached ??= buildCatalog({
    lessons: import.meta.glob('/src/content/lessons/*/*/lesson.json', { eager: true, import: 'default' }),
    intuitions: import.meta.glob('/src/content/lessons/*/*/intuition.md', { eager: true, import: 'default', query: '?raw' }),
    datasets: import.meta.glob('/src/content/datasets/*.json', { eager: true, import: 'default' }),
  })
  return cached
}

export function getLesson(id: string): Lesson | undefined {
  return getLessonCatalog().getLesson(id)
}

export function getDataset(id: string): Dataset | undefined {
  return getLessonCatalog().getDataset(id)
}
