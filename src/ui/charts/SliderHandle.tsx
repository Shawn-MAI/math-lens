import type { KeyboardEvent, PointerEvent, RefObject } from 'react'
import { snapToStep } from '../../core'
import { H, W } from './geometry'
import { palette } from './palette'

interface SliderHandleProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  valueText: string
  /** Which arrow keys move the handle: left and right for 'x', down and up for 'y'. */
  axis: 'x' | 'y'
  /** Drawn position, in chart units. */
  cx: number
  cy: number
  /** The SVG that the handle is drawn in, used to convert pointer positions. */
  svgRef: RefObject<SVGSVGElement | null>
  /** Converts a pointer position in chart units to a parameter value. */
  fromPointer: (x: number, y: number) => number
  /** Receives the wanted value. The store snaps it to the step and clamps it to the range. */
  onChange: (value: number) => void
}

const KEYS = {
  x: { ArrowRight: 1, ArrowLeft: -1 },
  y: { ArrowUp: 1, ArrowDown: -1 },
} as const

/** A draggable point that is also a keyboard-operable slider (arrow keys: one step, with Shift: ten steps). */
export function SliderHandle({ label, value, min, max, step, valueText, axis, cx, cy, svgRef, fromPointer, onChange }: SliderHandleProps) {
  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    const direction = (KEYS[axis] as Record<string, number>)[event.key]
    if (direction === undefined) return
    event.preventDefault()
    onChange(snapToStep(value + direction * step * (event.shiftKey ? 10 : 1), step, min))
  }

  const onPointerDown = (event: PointerEvent<SVGGElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.currentTarget.dataset.dragging = 'true'
    event.currentTarget.focus()
  }

  const onPointerMove = (event: PointerEvent<SVGGElement>) => {
    if (event.currentTarget.dataset.dragging !== 'true' || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = ((event.clientX - rect.left) * W) / rect.width
    const y = ((event.clientY - rect.top) * H) / rect.height
    onChange(fromPointer(x, y))
  }

  const onPointerEnd = (event: PointerEvent<SVGGElement>) => {
    delete event.currentTarget.dataset.dragging
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  return (
    <g
      className="chart-handle"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation={axis === 'x' ? 'horizontal' : 'vertical'}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <circle cx={cx} cy={cy} r={14} className="handle-ring" fill="transparent" />
      <circle cx={cx} cy={cy} r={7} style={{ fill: palette.handle, stroke: palette.point }} strokeWidth={2} />
    </g>
  )
}
