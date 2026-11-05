import type { ComponentType } from 'react'
import type { Point } from '../../core/types'
import type { Parameter } from '../../sim/content/schema'

export interface ChartProps {
  params: Record<string, number | string>
  outputs: Record<string, number | number[]>
  dataset?: Point[]
  options: Record<string, unknown>
  setParam: (id: string, raw: number | string) => { ok: boolean; message?: string }
  parameters: Parameter[]
}

export interface ChartEntry {
  component: ComponentType<ChartProps>
  requiredOutputs: string[]
}

/** Chart type name to component. Adding a chart type is one component file and one line here. */
export const CHARTS: Record<string, ChartEntry> = {}

export function getChart(type: string): ChartEntry {
  const entry = CHARTS[type]
  if (!entry) throw new Error(`Unknown chart type "${type}". Registered: ${Object.keys(CHARTS).join(', ') || 'none'}`)
  return entry
}
