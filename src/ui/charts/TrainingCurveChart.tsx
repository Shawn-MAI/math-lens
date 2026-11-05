import { useId, useMemo, useRef } from 'react'
import { line } from 'd3-shape'
import type { Landscape, TrainingSnapshot } from '../../core/training/types'
import { formatTrainingNumber } from '../../sim/training/format'
import { palette } from './palette'
import { SliderHandle } from './SliderHandle'

interface Props {
  landscape: Landscape
  snapshot: TrainingSnapshot
  domain: readonly [number, number]
  history?: readonly TrainingSnapshot[]
  start?: { value: number; step: number; onChange(value: number): void }
}

export function TrainingCurveChart({ landscape, snapshot, domain, history = [snapshot], start }: Props) {
  const summaryId = useId()
  const overlayRef = useRef<SVGSVGElement>(null)
  const [min, max] = domain
  const samples = useMemo(() => {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw new Error('Invalid curve domain')
    return Array.from({ length: 201 }, (_, index) => {
      const x = min + (max - min) * index / 200
      return { x, loss: landscape.loss([x]) }
    })
  }, [landscape, min, max])
  const finite = samples.filter((point) => Number.isFinite(point.loss))
  if (finite.length !== samples.length) throw new Error('Curve samples must be finite')
  const low = Math.min(...finite.map((point) => point.loss), snapshot.loss)
  const high = Math.max(...finite.map((point) => point.loss), snapshot.loss)
  const scale = Math.max(1, Math.abs(low), Math.abs(high))
  const span = high / scale - low / scale
  const x = (value: number) => 40 + (value - min) / (max - min) * 520
  const y = (value: number) => span === 0 ? 200 : 360 - (value / scale - low / scale) / span * 320
  const path = line<(typeof samples)[number]>().x((point) => x(point.x)).y((point) => y(point.loss))(samples)
  const trajectory = line<TrainingSnapshot>()
    .defined((point) => point.weights[0]! >= min && point.weights[0]! <= max)
    .x((point) => x(point.weights[0]!))
    .y((point) => y(point.loss))(history.slice(0, snapshot.index + 1))
  const weight = snapshot.weights[0]!
  const offscreen = weight < min || weight > max
  return (
    <div className="chart-panel">
      <div className="chart-frame">
        <svg className="chart-svg" viewBox="0 0 600 400" role="img" aria-label="Loss curve" aria-describedby={summaryId}>
          <path d="M40 40V360H560" fill="none" stroke={palette.axis} />
          <path data-testid="training-curve-path" d={path ?? undefined} fill="none" stroke={palette.curve} strokeWidth="3" />
          <path data-testid="training-trajectory" d={trajectory ?? undefined} fill="none" stroke={palette.tangent} strokeWidth="2" strokeDasharray="6 4" />
          {!offscreen && <circle data-testid="training-curve-marker" data-weight={weight} cx={x(weight)} cy={y(snapshot.loss)} r="6" fill={palette.tangent} />}
        </svg>
        {start && (
          <svg ref={overlayRef} className="chart-overlay" viewBox="0 0 600 400">
            <SliderHandle
              label="Start weight on chart" value={start.value} min={min} max={max} step={start.step}
              valueText={formatTrainingNumber(start.value)} axis="x" cx={x(start.value)}
              cy={y(landscape.loss([start.value]))} svgRef={overlayRef}
              fromPointer={(position) => min + (position - 40) / 520 * (max - min)}
              onChange={start.onChange}
            />
          </svg>
        )}
      </div>
      <p id={summaryId} className="chart-summary">
        Step {snapshot.index}: weight {formatTrainingNumber(weight)}, loss {formatTrainingNumber(snapshot.loss)}.
        {offscreen && ' The weight is off-screen.'}
      </p>
    </div>
  )
}
