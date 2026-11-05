import { useId } from 'react'
import { line } from 'd3-shape'
import type { TrainingSnapshot } from '../../core/training/types'
import { formatTrainingNumber } from '../../sim/training/format'
import { palette } from './palette'

interface Props {
  snapshots: readonly TrainingSnapshot[]
  selectedIndex: number
}

export function LossHistoryChart({ snapshots, selectedIndex }: Props) {
  const summaryId = useId()
  const selected = snapshots[selectedIndex]
  if (!selected || !Number.isInteger(selectedIndex) || snapshots.some((item) => !Number.isFinite(item.loss))) {
    throw new Error('Loss history requires finite snapshots and a valid selected index')
  }
  const low = Math.min(0, ...snapshots.map((item) => item.loss))
  const high = Math.max(0, ...snapshots.map((item) => item.loss))
  const scale = Math.max(1, Math.abs(low), Math.abs(high))
  const span = high / scale - low / scale
  const x = (index: number) => 40 + index / Math.max(1, snapshots.length - 1) * 520
  const y = (loss: number) => span === 0 ? 150 : 260 - (loss / scale - low / scale) / span * 220
  const path = line<TrainingSnapshot>().x((point) => x(point.index)).y((point) => y(point.loss))(snapshots)
  return (
    <div className="chart-panel">
      <div className="chart-frame">
        <svg className="chart-svg" viewBox="0 0 600 300" role="img" aria-label="Loss history" aria-describedby={summaryId}>
          <path d="M40 40V260H560" fill="none" stroke={palette.axis} />
          <path data-testid="loss-history-path" d={path ?? undefined} fill="none" stroke={palette.curve} strokeWidth="3" />
          <line data-testid="loss-history-cursor" data-step={selectedIndex} x1={x(selectedIndex)} x2={x(selectedIndex)} y1="40" y2="260" stroke={palette.tangent} strokeDasharray="6 4" />
          <circle cx={x(selectedIndex)} cy={y(selected.loss)} r="5" fill={palette.tangent} />
        </svg>
      </div>
      <p id={summaryId} className="chart-summary">
        Step {selectedIndex} of {snapshots.length - 1}: loss {formatTrainingNumber(selected.loss)}.
      </p>
    </div>
  )
}
