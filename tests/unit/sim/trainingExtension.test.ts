import { expect, it } from 'vitest'
import type { AlgorithmAdapter, Landscape } from '../../../src/core/training/types'
import lesson from '../../../src/content/lessons/optimization/gradient-descent-1d/lesson.json'
import { buildCatalog } from '../../../src/sim/content/loader'
import { createTrainingStore } from '../../../src/sim/training/store'

it('loads an additional lesson using the registered training components from content alone', () => {
  const extra = { ...lesson, id: 'additional-training-lesson', order: 2 }
  const root = '/lessons/optimization/additional-training-lesson'
  const catalog = buildCatalog({
    lessons: { [`${root}/lesson.json`]: extra },
    intuitions: { [`${root}/intuition.md`]: 'Explore this training lesson.' },
    datasets: {},
  })
  expect(catalog.getLesson(extra.id)).toMatchObject({
    kind: 'training', training: { adapter: 'gradient-descent', landscape: 'convex-1d' },
  })
})

it('reuses the generic store and history for a non-gradient test adapter', () => {
  const landscape: Landscape = {
    id: 'test-landscape',
    dimensions: 1,
    loss: ([x = 0]) => x * x,
    gradient: ([x = 0]) => [2 * x],
  }
  const adapter: AlgorithmAdapter = {
    id: 'test-translation',
    dimensions: 1,
    step: (previous, rate, target) => {
      const weights = [previous.weights[0]! + rate]
      return {
        kind: 'success',
        snapshot: { index: previous.index + 1, weights, loss: target.loss(weights), gradient: target.gradient(weights) },
        transition: {
          rate, oldWeights: previous.weights, gradient: previous.gradient, update: [rate], newWeights: weights,
        },
      }
    },
  }
  const store = createTrainingStore({ adapter, landscape, start: [1], rate: 0.5 })
  store.getState().stepForward()
  expect(store.getState().snapshot.weights).toEqual([1.5])
  store.getState().stepBackward()
  expect(store.getState().snapshot.weights).toEqual([1])
  store.getState().stepForward()
  expect(store.getState().snapshot.weights).toEqual([1.5])
  store.getState().dispose()
})

it('retains the last valid snapshot and reports a non-finite adapter result', () => {
  const landscape: Landscape = {
    id: 'test-landscape', dimensions: 1, loss: () => 1, gradient: () => [1],
  }
  const adapter: AlgorithmAdapter = {
    id: 'test-overflow', dimensions: 1, step: () => ({ kind: 'non-finite', stage: 'product' }),
  }
  const store = createTrainingStore({ adapter, landscape, start: [1], rate: 1 })
  store.getState().stepForward()
  expect(store.getState().snapshot.index).toBe(0)
  expect(store.getState().stopReason).toBe('diverged')
  expect(store.getState().message).toMatch(/step 1/i)
  store.getState().dispose()
})
