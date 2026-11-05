import { useId, useMemo, useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { line } from 'd3-shape'
import type { Landscape, TrainingSnapshot } from '../../core/training/types'
import { formatTrainingNumber } from '../../sim/training/format'
import { palette } from './palette'
import { buildTrainingContours, contourPoint, type Domain } from './trainingContours'

interface Props {
  landscape: Landscape
  snapshot: TrainingSnapshot
  history: readonly TrainingSnapshot[]
  xDomain: Domain
  yDomain: Domain
  start: {
    value: readonly [number, number]
    step: readonly [number, number]
    onChange(value: readonly [number, number]): void
  }
}

export function TrainingContourChart({ landscape, snapshot, history, xDomain, yDomain, start }: Props) {
  const summaryId = useId()
  const clipId = useId()
  const overlayRef = useRef<SVGSVGElement>(null)
  const [xMin, xMax] = xDomain
  const [yMin, yMax] = yDomain
  const geometry = useMemo(() => {
    const sampled = buildTrainingContours(landscape, [xMin, xMax], [yMin, yMax])
    return sampled.contours.map((contour) => contour.coordinates.map((polygon) => polygon.map((ring) =>
      ring.map(([x, y], index) =>
        `${index === 0 ? 'M' : 'L'}${40 + (x! - 0.5) / (sampled.size - 1) * 520},${40 + (y! - 0.5) / (sampled.size - 1) * 320}`,
      ).join('') + 'Z',
    ).join('')).join(''))
  }, [landscape, xMin, xMax, yMin, yMax])
  const inView = (weights: readonly number[]) => weights[0]! >= xDomain[0] && weights[0]! <= xDomain[1]
    && weights[1]! >= yDomain[0] && weights[1]! <= yDomain[1]
  const point = (weights: readonly number[]) => contourPoint([weights[0]!, weights[1]!], xDomain, yDomain)
  const trajectory = line<TrainingSnapshot>().defined((item) => inView(item.weights))
    .x((item) => point(item.weights)[0]).y((item) => point(item.weights)[1])(
      history.slice(0, snapshot.index + 1),
    )
  const offscreen = !inView(snapshot.weights)
  const marker = offscreen ? null : point(snapshot.weights)
  const handle = point(start.value)

  function movePointer(event: PointerEvent<SVGGElement>) {
    if (event.currentTarget.dataset.dragging !== 'true' || !overlayRef.current) return
    const rect = overlayRef.current.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = (event.clientX - rect.left) * 600 / rect.width
    const y = (event.clientY - rect.top) * 400 / rect.height
    start.onChange([
      xDomain[0] + (x - 40) / 520 * (xDomain[1] - xDomain[0]),
      yDomain[0] + (360 - y) / 320 * (yDomain[1] - yDomain[0]),
    ])
  }

  function moveKeyboard(event: KeyboardEvent<SVGGElement>) {
    const directions: Record<string, readonly [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowDown: [0, -1], ArrowUp: [0, 1],
    }
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault()
    const multiplier = event.shiftKey ? 10 : 1
    start.onChange([
      start.value[0] + direction[0] * start.step[0] * multiplier,
      start.value[1] + direction[1] * start.step[1] * multiplier,
    ])
  }

  return (
    <div className="chart-panel">
      <div className="chart-frame">
        <svg className="chart-svg" viewBox="0 0 600 400" role="img" aria-label="Loss contour map" aria-describedby={summaryId}>
          <defs><clipPath id={clipId}><rect x="40" y="40" width="520" height="320" /></clipPath></defs>
          <path d="M40 40V360H560" fill="none" stroke={palette.axis} />
          <g fill={palette.axis} fontSize="12">
            <text x="40" y="378">{xMin}</text><text x="550" y="378" textAnchor="end">{xMax}</text>
            <text x="35" y="360" textAnchor="end">{yMin}</text><text x="35" y="44" textAnchor="end">{yMax}</text>
            <text x="300" y="395" textAnchor="middle">First weight</text>
            <text x="12" y="200" textAnchor="middle" transform="rotate(-90 12 200)">Second weight</text>
          </g>
          <g clipPath={`url(#${clipId})`}>
            {geometry.map((path, index) => <path key={index} d={path} fill="none" stroke={palette.curve} strokeWidth="1.5" />)}
            <path data-testid="training-contour-trajectory" d={trajectory ?? undefined} fill="none" stroke={palette.tangent} strokeWidth="2" strokeDasharray="6 4" />
            {marker && <circle data-testid="training-contour-marker" data-x={snapshot.weights[0]} data-y={snapshot.weights[1]} cx={marker[0]} cy={marker[1]} r="6" fill={palette.tangent} />}
          </g>
        </svg>
        <svg ref={overlayRef} className="chart-overlay" viewBox="0 0 600 400">
          <g
            className="chart-handle" role="button" tabIndex={0} aria-label="Drag starting point"
            aria-describedby={summaryId}
            onKeyDown={moveKeyboard}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture?.(event.pointerId)
              event.currentTarget.dataset.dragging = 'true'
              event.currentTarget.focus()
            }}
            onPointerMove={movePointer}
            onPointerUp={(event) => {
              delete event.currentTarget.dataset.dragging
              event.currentTarget.releasePointerCapture?.(event.pointerId)
            }}
            onPointerCancel={(event) => { delete event.currentTarget.dataset.dragging }}
          >
            <circle cx={handle[0]} cy={handle[1]} r="14" className="handle-ring" fill="transparent" />
            <circle cx={handle[0]} cy={handle[1]} r="7" fill={palette.handle} stroke={palette.point} strokeWidth="2" />
          </g>
        </svg>
      </div>
      <p id={summaryId} className="chart-summary">
        Step {snapshot.index}: first weight {formatTrainingNumber(snapshot.weights[0]!)}, second weight {formatTrainingNumber(snapshot.weights[1]!)}, loss {formatTrainingNumber(snapshot.loss)}.
        {offscreen && ' The selected point is off-screen.'} Use the separate weight controls or arrow keys to set the starting point.
      </p>
    </div>
  )
}
