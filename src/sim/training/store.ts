import { createStore } from 'zustand/vanilla'
import { assertCompatibleDimensions, type AlgorithmAdapter, type Landscape, type TrainingSnapshot } from '../../core/training/types'
import { appendTrainingStep, createTrainingHistory, forkTrainingHistory, selectTrainingBranch } from './history'
import { createTrainingScheduler, type PlaybackSpeed } from './scheduler'
import type { TrainingHistory } from './types'

type StopReason = 'stationary' | 'diverged' | 'limit' | null

export interface TrainingState {
  readonly start: readonly number[]
  readonly rate: number
  readonly snapshot: TrainingSnapshot
  readonly history: TrainingHistory
  readonly playing: boolean
  readonly speed: PlaybackSpeed
  readonly stopReason: StopReason
  readonly message: string
  readonly pendingRate: boolean
  play(): void
  pause(): void
  stepForward(): void
  stepBackward(): void
  seek(index: number): void
  selectBranch(id: string): void
  setSpeed(speed: PlaybackSpeed): void
  setRate(rate: number): void
  setStart(weights: readonly number[]): void
  reset(): void
  activate(): void
  dispose(): void
}

interface TrainingStoreOptions {
  readonly adapter: AlgorithmAdapter
  readonly landscape: Landscape
  readonly start: readonly number[]
  readonly rate: number
}

export function createTrainingStore({ adapter, landscape, start, rate }: TrainingStoreOptions) {
  assertCompatibleDimensions(adapter, landscape)
  if (!Number.isFinite(rate) || rate < 0) throw new Error('Learning rate must be finite and non-negative')

  function initialSnapshot(weights: readonly number[]): TrainingSnapshot {
    if (weights.length !== landscape.dimensions || !weights.every(Number.isFinite)) {
      throw new Error('Start weights must be finite and match landscape dimensions')
    }
    const copied = [...weights]
    const loss = landscape.loss(copied)
    const gradient = landscape.gradient(copied)
    if (!Number.isFinite(loss) || gradient.length !== landscape.dimensions || !gradient.every(Number.isFinite)) {
      throw new Error('Starting loss and gradient must be finite and match landscape dimensions')
    }
    return { index: 0, weights: copied, loss, gradient }
  }

  const initial = initialSnapshot(start)
  const history = createTrainingHistory(initial)
  let disposed = false
  type BranchRuntime = {
    index: number
    rate: number
    terminal: { index: number; reason: Exclude<StopReason, null>; message: string } | null
  }
  let branchRuntime = new Map<string, BranchRuntime>([['branch-1', { index: 0, rate, terminal: null }]])
  const store = createStore<TrainingState>((set, get) => {
    const scheduler = createTrainingScheduler(() => {
      try {
        get().stepForward()
      } catch (error) {
        get().pause()
        throw error
      }
    })

    return {
      start: [...start],
      rate,
      snapshot: history.branches[0]!.snapshots[0]!,
      history,
      playing: false,
      speed: 1,
      stopReason: null,
      message: '',
      pendingRate: false,
      play() {
        if (disposed || get().playing) return
        if (get().stopReason !== null) return
        set({ playing: true })
        scheduler.start(get().speed)
      },
      pause() {
        scheduler.stop()
        set({ playing: false })
      },
      stepForward() {
        if (disposed) return
        const state = get()
        const branch = state.history.branches.find((item) => item.id === state.history.activeBranchId)
        if (!branch) throw new Error('Active training branch is missing')
        const runtime = branchRuntime.get(branch.id)
        if (!runtime) throw new Error('Training branch state is missing')
        const hasFuture = state.snapshot.index < branch.transitions.length
        if (hasFuture && !state.pendingRate) {
          const index = state.snapshot.index + 1
          runtime.index = index
          const terminal = runtime.terminal?.index === index ? runtime.terminal : null
          if (terminal) state.pause()
          set({ snapshot: branch.snapshots[index]!, stopReason: terminal?.reason ?? null, message: terminal?.message ?? '' })
          return
        }
        if (state.stopReason !== null) return
        if (state.snapshot.gradient.every((value) => Math.abs(value) <= 1e-6)) {
          state.pause()
          runtime.terminal = { index: state.snapshot.index, reason: 'stationary', message: 'Stationary point reached.' }
          set({ stopReason: runtime.terminal.reason, message: runtime.terminal.message })
          return
        }
        if (state.snapshot.index >= 1000) {
          state.pause()
          runtime.terminal = { index: state.snapshot.index, reason: 'limit', message: 'Reached the 1000-update limit.' }
          set({ stopReason: runtime.terminal.reason, message: runtime.terminal.message })
          return
        }
        const result = adapter.step(state.snapshot, state.rate, landscape)
        if (result.kind === 'non-finite') {
          state.pause()
          const message = `Step ${state.snapshot.index + 1} is non-finite (${result.stage}).`
          if (!hasFuture) runtime.terminal = { index: state.snapshot.index, reason: 'diverged', message }
          set({ stopReason: 'diverged', message })
          return
        }
        const nextHistory = hasFuture
          ? forkTrainingHistory(state.history, branch.id, state.snapshot.index, result.transition, result.snapshot)
          : appendTrainingStep(state.history, branch.id, result.transition, result.snapshot)
        const nextBranch = nextHistory.branches.find((item) => item.id === nextHistory.activeBranchId)!
        const nextSnapshot = nextBranch.snapshots[nextBranch.snapshots.length - 1]!
        const reachedLimit = nextBranch.transitions.length === 1000
        const nextRuntime: BranchRuntime = hasFuture
          ? { index: nextSnapshot.index, rate: state.rate, terminal: null }
          : runtime
        nextRuntime.index = nextSnapshot.index
        nextRuntime.rate = state.rate
        nextRuntime.terminal = reachedLimit
          ? { index: nextSnapshot.index, reason: 'limit', message: 'Reached the 1000-update limit.' }
          : null
        branchRuntime.set(nextBranch.id, nextRuntime)
        if (reachedLimit) state.pause()
        set({
          history: nextHistory,
          snapshot: nextSnapshot,
          stopReason: reachedLimit ? 'limit' : null,
          message: reachedLimit ? 'Reached the 1000-update limit.' : state.rate === 0 ? 'No progress: learning rate is zero.' : '',
          pendingRate: false,
        })
      },
      stepBackward() {
        if (disposed) return
        get().seek(Math.max(0, get().snapshot.index - 1))
      },
      seek(index) {
        const state = get()
        const branch = state.history.branches.find((item) => item.id === state.history.activeBranchId)
        const runtime = branchRuntime.get(state.history.activeBranchId)
        if (!branch || !runtime) throw new Error('Active training branch is missing')
        if (!Number.isInteger(index) || index < 0 || index >= branch.snapshots.length) {
          throw new Error('Training timeline index is out of bounds')
        }
        state.pause()
        runtime.index = index
        const terminal = runtime.terminal?.index === index ? runtime.terminal : null
        set({ snapshot: branch.snapshots[index]!, stopReason: terminal?.reason ?? null, message: terminal?.message ?? '' })
      },
      selectBranch(id) {
        const state = get()
        const nextHistory = selectTrainingBranch(state.history, id)
        const branch = nextHistory.branches.find((item) => item.id === id)!
        const runtime = branchRuntime.get(id)
        if (!runtime) throw new Error(`Training branch "${id}" state is missing`)
        state.pause()
        const terminal = runtime.terminal?.index === runtime.index ? runtime.terminal : null
        set({
          history: nextHistory, snapshot: branch.snapshots[runtime.index]!, rate: runtime.rate,
          pendingRate: false, stopReason: terminal?.reason ?? null, message: terminal?.message ?? '',
        })
      },
      setSpeed(nextSpeed) {
        if (![1, 2, 4].includes(nextSpeed)) throw new Error('Speed must be 1, 2 or 4 steps per second')
        set({ speed: nextSpeed })
        if (get().playing) scheduler.start(nextSpeed)
      },
      setRate(nextRate) {
        if (!Number.isFinite(nextRate) || nextRate < 0) throw new Error('Learning rate must be finite and non-negative')
        const state = get()
        const branch = state.history.branches.find((item) => item.id === state.history.activeBranchId)
        const runtime = branchRuntime.get(state.history.activeBranchId)
        if (!branch || !runtime) throw new Error('Active training branch is missing')
        const hasFuture = state.snapshot.index < branch.transitions.length
        const pendingRate = hasFuture && nextRate !== runtime.rate
        if (!hasFuture) runtime.rate = nextRate
        if (state.stopReason === 'diverged') runtime.terminal = null
        set({
          rate: nextRate, pendingRate,
          stopReason: state.stopReason === 'diverged' ? null : state.stopReason,
          message: state.stopReason === 'diverged' ? '' : state.message,
        })
      },
      setStart(weights) {
        const nextInitial = initialSnapshot(weights)
        const nextHistory = createTrainingHistory(nextInitial)
        get().pause()
        branchRuntime = new Map([['branch-1', { index: 0, rate: get().rate, terminal: null }]])
        set({
          start: [...weights], history: nextHistory, snapshot: nextHistory.branches[0]!.snapshots[0]!,
          stopReason: null, message: '', pendingRate: false,
        })
      },
      reset() {
        get().setStart(get().start)
      },
      activate() {
        disposed = false
      },
      dispose() {
        disposed = true
        scheduler.dispose()
        set({ playing: false })
      },
    }
  })
  return store
}
