import { describe, expect, it, vi } from 'vitest'
import { convex2d } from '../../../src/core/training/landscapes'
import { buildTrainingContours, contourPoint } from '../../../src/ui/charts/trainingContours'

describe('data-derived contours', () => {
  it('samples the actual landscape, produces finite isolines and caches identical geometry', () => {
    const loss = vi.fn(convex2d.loss)
    const landscape = { ...convex2d, loss }
    const contours = buildTrainingContours(landscape, [-5, 5], [-5, 5])
    expect(loss).toHaveBeenCalled()
    expect(contours.values.every(Number.isFinite)).toBe(true)
    const center = Math.floor(contours.size / 2)
    expect(contours.values[center * contours.size + center]).toBe(0)
    expect(contours.contours.length).toBeGreaterThan(0)
    expect(contours.contours.every((contour) => Number.isFinite(contour.value))).toBe(true)
    for (const contour of contours.contours) {
      for (const polygon of contour.coordinates) {
        for (const ring of polygon) {
          expect(ring.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true)
        }
      }
    }
    const calls = loss.mock.calls.length
    expect(buildTrainingContours(landscape, [-5, 5], [-5, 5])).toBe(contours)
    expect(loss).toHaveBeenCalledTimes(calls)
  })

  it('maps domain endpoints and origin consistently into the plot', () => {
    expect(contourPoint([-5, -5], [-5, 5], [-5, 5])).toEqual([40, 360])
    expect(contourPoint([5, 5], [-5, 5], [-5, 5])).toEqual([560, 40])
    expect(contourPoint([0, 0], [-5, 5], [-5, 5])).toEqual([300, 200])
  })

  it('rejects invalid sample domains and non-finite samples explicitly', () => {
    expect(() => buildTrainingContours(convex2d, [5, -5], [-5, 5])).toThrow(/domain/i)
    expect(() => buildTrainingContours({ ...convex2d, loss: () => Infinity }, [-5, 5], [-5, 5])).toThrow(/finite/i)
  })

  it('rejects extreme off-screen coordinates rather than producing invalid SVG coordinates', () => {
    expect(() => contourPoint([Number.MAX_VALUE, -Number.MAX_VALUE], [-5, 5], [-5, 5])).toThrow(/outside/i)
  })
})
