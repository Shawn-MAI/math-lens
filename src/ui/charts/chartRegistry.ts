import type { ComponentType } from 'react'
import type { Point } from '../../core/types'
import type { Parameter } from '../../sim/content/schema'
import { CurveTangentChart } from './CurveTangentChart'
import { LineFitChart } from './LineFitChart'

export interface ChartProps {
  params: Record<string, number | string>
  outputs: Record<string, number | number[]>
  dataset?: Point[]
  options: Record<string, unknown>
  setParam: (id: string, raw: number | string) => { ok: boolean; message?: string }
  parameters: Parameter[]
  /** Decimals per output key, from the lesson's `outputs`. */
  decimals: Record<string, number>
  /** Accessible name of the chart, and the id of the visible text that describes it. */
  ariaLabel: string
  describedBy: string
}

export interface ChartEntry {
  component: ComponentType<ChartProps>
  requiredOutputs: string[]
}

/** Chart type name to component. Adding a chart type is one component file and one line here. */
export const CHARTS: Record<string, ChartEntry> = {
  'curve-tangent': { component: CurveTangentChart, requiredOutputs: ['curveX', 'curveY', 'tangentX', 'tangentY', 'y', 'slope'] },
  'line-fit': { component: LineFitChart, requiredOutputs: ['lineX', 'lineY', 'predictions', 'errors', 'squaredErrors', 'mse', 'n'] },
}

export function getChart(type: string): ChartEntry {
  const entry = CHARTS[type]
  if (!entry) throw new Error(`Unknown chart type "${type}". Registered: ${Object.keys(CHARTS).join(', ') || 'none'}`)
  return entry
}
