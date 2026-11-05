import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { convex1d } from '../../src/core/training/landscapes'
import type { TrainingSnapshot } from '../../src/core/training/types'
import { TrainingCurveChart } from '../../src/ui/charts/TrainingCurveChart'
import { LossHistoryChart } from '../../src/ui/charts/LossHistoryChart'

const snapshots: TrainingSnapshot[] = [
  { index: 0, weights: [-4], loss: 18, gradient: [-6] },
  { index: 1, weights: [-2.8], loss: 11.52, gradient: [-4.8] },
]

describe('1D training charts', () => {
  it('draws a computed curve and marks the selected true weight and loss', () => {
    const { rerender } = render(<TrainingCurveChart landscape={convex1d} snapshot={snapshots[0]!} domain={[-5, 5]} />)
    expect(screen.getByRole('img', { name: /loss curve/i })).toBeInTheDocument()
    expect(screen.getByTestId('training-curve-path').getAttribute('d')).toMatch(/^M/)
    expect(screen.getByTestId('training-curve-marker')).toHaveAttribute('data-weight', '-4')
    expect(screen.getByText(/18\.000000/)).toBeInTheDocument()
    rerender(<TrainingCurveChart landscape={convex1d} snapshot={snapshots[1]!} domain={[-5, 5]} />)
    expect(screen.getByTestId('training-curve-marker')).toHaveAttribute('data-weight', '-2.8')
    expect(screen.getByText(/11\.520000/)).toBeInTheDocument()
  })

  it('samples the provided landscape to construct curve geometry', () => {
    const loss = vi.fn(convex1d.loss)
    render(<TrainingCurveChart landscape={{ ...convex1d, loss }} snapshot={snapshots[0]!} domain={[-5, 5]} />)
    expect(loss).toHaveBeenCalled()
    expect(loss.mock.calls.some(([weights]) => weights[0]! < 0)).toBe(true)
    expect(loss.mock.calls.some(([weights]) => weights[0]! > 0)).toBe(true)
  })

  it('draws the recorded loss history and moves its selected cursor', () => {
    const { rerender } = render(<LossHistoryChart snapshots={snapshots} selectedIndex={0} />)
    expect(screen.getByRole('img', { name: /loss history/i })).toBeInTheDocument()
    expect(screen.getByTestId('loss-history-path').getAttribute('d')).toMatch(/^M/)
    expect(screen.getByTestId('loss-history-cursor')).toHaveAttribute('data-step', '0')
    rerender(<LossHistoryChart snapshots={snapshots} selectedIndex={1} />)
    expect(screen.getByTestId('loss-history-cursor')).toHaveAttribute('data-step', '1')
    expect(screen.getByText(/11\.520000/)).toBeInTheDocument()
  })

  it('draws a path from recorded states only through the selected step', () => {
    const { rerender } = render(<TrainingCurveChart landscape={convex1d} snapshot={snapshots[0]!} domain={[-5, 5]} history={snapshots} />)
    const first = screen.getByTestId('training-trajectory').getAttribute('d')
    rerender(<TrainingCurveChart landscape={convex1d} snapshot={snapshots[1]!} domain={[-5, 5]} history={snapshots} />)
    expect(screen.getByTestId('training-trajectory').getAttribute('d')).not.toBe(first)
  })

  it('exposes an independently keyboard-operable starting-point handle', () => {
    const onStart = vi.fn()
    render(<TrainingCurveChart landscape={convex1d} snapshot={snapshots[0]!} domain={[-5, 5]}
      start={{ value: -4, step: 0.1, onChange: onStart }} />)
    fireEvent.keyDown(screen.getByRole('slider', { name: /start weight on chart/i }), { key: 'ArrowRight' })
    expect(onStart).toHaveBeenCalledWith(-3.9)
  })

  it('reports an off-screen true weight without presenting a clamped position as actual', () => {
    const offscreen = { index: 0, weights: [8], loss: 18, gradient: [6] }
    render(<TrainingCurveChart landscape={convex1d} snapshot={offscreen} domain={[-5, 5]} />)
    expect(screen.getByText(/off.screen/i)).toHaveTextContent('8.000000')
    expect(screen.queryByTestId('training-curve-marker')).not.toBeInTheDocument()
  })
})
