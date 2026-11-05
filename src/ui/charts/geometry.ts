import { scaleLinear, type ScaleLinear } from 'd3-scale'

/** All charts draw in this coordinate system and the SVG scales it to its container. */
export const W = 600
export const H = 400
export const MARGIN = { top: 20, right: 24, bottom: 48, left: 56 }
export const PLOT = { left: MARGIN.left, right: W - MARGIN.right, top: MARGIN.top, bottom: H - MARGIN.bottom }

export type Scale = ScaleLinear<number, number>

export function makeScales(xDomain: [number, number], yDomain: [number, number]): { x: Scale; y: Scale } {
  return {
    x: scaleLinear().domain(xDomain).range([PLOT.left, PLOT.right]),
    y: scaleLinear().domain(yDomain).range([PLOT.bottom, PLOT.top]),
  }
}

/** The smallest range holding all values, with a margin so that curves do not touch the frame. */
export function paddedDomain(values: number[], fraction = 0.1): [number, number] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max - min < 1e-9) return [min - 1, max + 1]
  const pad = (max - min) * fraction
  return [min - pad, max + pad]
}

export type Segment = [[number, number], [number, number]]

/** Cuts a segment to the part whose y lies in [yMin, yMax]. Returns null when none of it is inside. */
export function clipToYRange([[x1, y1], [x2, y2]]: Segment, yMin: number, yMax: number): Segment | null {
  const dy = y2 - y1
  if (dy === 0) return y1 >= yMin && y1 <= yMax ? [[x1, y1], [x2, y2]] : null
  const a = (yMin - y1) / dy
  const b = (yMax - y1) / dy
  const enter = Math.max(0, Math.min(a, b))
  const exit = Math.min(1, Math.max(a, b))
  if (enter > exit) return null
  const at = (t: number): [number, number] => [x1 + t * (x2 - x1), y1 + t * dy]
  return [at(enter), at(exit)]
}

/** Keeps a drawn position inside the plot area, so a handle never leaves the chart. */
export function keepInPlot(sx: number, sy: number): [number, number] {
  return [Math.min(Math.max(sx, PLOT.left), PLOT.right), Math.min(Math.max(sy, PLOT.top), PLOT.bottom)]
}
