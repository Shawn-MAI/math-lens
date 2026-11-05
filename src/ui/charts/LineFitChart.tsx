import { useRef } from 'react'
import { formatNumber } from '../../sim/template'
import { Axes } from './Axes'
import { ChartFrame } from './ChartFrame'
import type { ChartProps } from './chartRegistry'
import { clipToYRange, keepInPlot, makeScales, PLOT } from './geometry'
import { dash, palette } from './palette'
import { SliderHandle } from './SliderHandle'

/** Data points, the prediction line, and one error segment per point. Optionally two handles to drag the line. */
export function LineFitChart({ params, outputs, dataset = [], options, setParam, parameters, decimals, ariaLabel, describedBy }: ChartProps) {
  const overlayRef = useRef<SVGSVGElement | null>(null)
  const numberParam = (option: string) => {
    const p = parameters.find((q) => q.id === options[option])
    if (p?.type !== 'number') throw new Error(`line-fit needs a number parameter named by options.${option}, got "${String(options[option])}"`)
    return p
  }
  const slopeParam = numberParam('slopeParam')
  const interceptParam = numberParam('interceptParam')
  const handles = options.handles === true

  const lineX = outputs.lineX as number[]
  const lineY = outputs.lineY as number[]
  const predictions = outputs.predictions as number[]
  const errors = outputs.errors as number[]
  const slope = params[slopeParam.id] as number
  const intercept = params[interceptParam.id] as number
  const errorDecimals = decimals.errors ?? 2

  // The y range comes from the data and the intercept range, so it does not move while a handle is dragged.
  const ys = [...dataset.map((p) => p.y), interceptParam.min, interceptParam.max]
  const scales = makeScales([lineX[0]!, lineX[1]!], [Math.min(...ys) - 1, Math.max(...ys) + 1])
  const [yMin, yMax] = scales.y.domain() as [number, number]
  const xEnd = lineX[1]!

  const fit = clipToYRange([[lineX[0]!, lineY[0]!], [lineX[1]!, lineY[1]!]], yMin, yMax)

  const [interceptX, interceptY] = keepInPlot(scales.x(0), scales.y(intercept))
  const [slopeX, slopeY] = keepInPlot(scales.x(xEnd), scales.y(lineY[1]!))

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      describedBy={describedBy}
      overlayRef={overlayRef}
      overlay={
        handles && (
          <>
            <SliderHandle
              label={`${slopeParam.label} (chart handle)`}
              value={slope}
              min={slopeParam.min}
              max={slopeParam.max}
              step={slopeParam.step}
              valueText={formatNumber(slope, 1)}
              axis="y"
              cx={slopeX}
              cy={slopeY}
              svgRef={overlayRef}
              // The line pivots around its height at x = 0, which stays fixed.
              fromPointer={(_, sy) => (scales.y.invert(sy) - intercept) / xEnd}
              onChange={(value) => setParam(slopeParam.id, value)}
            />
            <SliderHandle
              label={`${interceptParam.label} (chart handle)`}
              value={intercept}
              min={interceptParam.min}
              max={interceptParam.max}
              step={interceptParam.step}
              valueText={formatNumber(intercept, 1)}
              axis="y"
              cx={interceptX}
              cy={interceptY}
              svgRef={overlayRef}
              fromPointer={(_, sy) => scales.y.invert(sy)}
              onChange={(value) => setParam(interceptParam.id, value)}
            />
          </>
        )
      }
    >
      <Axes x={scales.x} y={scales.y} xTitle="x" yTitle="y" />
      {dataset.map((point, i) => {
        const segment = clipToYRange([[point.x, point.y], [point.x, predictions[i]!]], yMin, yMax)
        const mid = (point.y + predictions[i]!) / 2
        const labelY = Math.min(Math.max(scales.y(mid), PLOT.top + 10), PLOT.bottom - 6)
        return (
          <g key={i}>
            {segment && (
              <line
                data-testid="error-segment"
                x1={scales.x(segment[0][0])}
                y1={scales.y(segment[0][1])}
                x2={scales.x(segment[1][0])}
                y2={scales.y(segment[1][1])}
                strokeWidth={2}
                strokeDasharray={dash.dashed}
                style={{ stroke: palette.error }}
              />
            )}
            <text data-testid="error-label" x={scales.x(point.x) + 8} y={labelY} fontSize={13} dominantBaseline="middle" style={{ fill: palette.error }}>
              {formatNumber(errors[i]!, errorDecimals)}
            </text>
          </g>
        )
      })}
      {fit && (
        <line
          data-testid="fit-line"
          x1={scales.x(fit[0][0])}
          y1={scales.y(fit[0][1])}
          x2={scales.x(fit[1][0])}
          y2={scales.y(fit[1][1])}
          strokeWidth={3}
          style={{ stroke: palette.line }}
        />
      )}
      {dataset.map((point, i) => (
        <circle key={i} data-testid="data-point" cx={scales.x(point.x)} cy={scales.y(point.y)} r={5.5} style={{ fill: palette.data }} />
      ))}
    </ChartFrame>
  )
}
