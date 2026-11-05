import { useId } from 'react'
import { useStore } from 'zustand'
import type { StoreApi } from 'zustand/vanilla'
import type { TrainingState } from '../../sim/training/store'

export function TrainingTimeline({ store }: { store: StoreApi<TrainingState> }) {
  const state = useStore(store)
  const timelineId = useId()
  const branchId = useId()
  const active = state.history.branches.find((branch) => branch.id === state.history.activeBranchId)
  if (!active) throw new Error('Active training branch is missing')
  const last = active.snapshots.length - 1
  return (
    <div className="training-timeline">
      <label htmlFor={timelineId}>Training timeline</label>
      <input
        id={timelineId}
        type="range"
        min={0}
        max={last}
        step={1}
        value={state.snapshot.index}
        aria-valuetext={`Step ${state.snapshot.index} of ${last}`}
        onChange={(event) => state.seek(Number(event.target.value))}
        onKeyDown={(event) => {
          let next: number
          switch (event.key) {
            case 'ArrowRight':
            case 'ArrowUp': next = state.snapshot.index + 1; break
            case 'ArrowLeft':
            case 'ArrowDown': next = state.snapshot.index - 1; break
            case 'Home': next = 0; break
            case 'End': next = last; break
            case 'PageUp': next = state.snapshot.index + 10; break
            case 'PageDown': next = state.snapshot.index - 10; break
            default: return
          }
          event.preventDefault()
          state.seek(Math.min(last, Math.max(0, next)))
        }}
      />
      <output htmlFor={timelineId}>Step {state.snapshot.index} of {last}</output>
      <label htmlFor={branchId}>Branch</label>
      <select id={branchId} value={active.id} onChange={(event) => state.selectBranch(event.target.value)}>
        {state.history.branches.map((branch, index) => <option key={branch.id} value={branch.id}>Branch {index + 1}</option>)}
      </select>
    </div>
  )
}
