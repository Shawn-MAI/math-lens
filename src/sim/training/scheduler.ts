export type PlaybackSpeed = 1 | 2 | 4

export function createTrainingScheduler(advance: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let generation = 0
  let active = false
  let speed: PlaybackSpeed = 1

  function cancel() {
    generation++
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  function schedule() {
    const current = generation
    timer = setTimeout(() => {
      timer = undefined
      if (!active || current !== generation) return
      advance()
      if (active && current === generation) schedule()
    }, 1000 / speed)
  }

  return {
    start(nextSpeed: PlaybackSpeed) {
      cancel()
      speed = nextSpeed
      active = true
      schedule()
    },
    stop() {
      active = false
      cancel()
    },
    dispose() {
      active = false
      cancel()
    },
  }
}
