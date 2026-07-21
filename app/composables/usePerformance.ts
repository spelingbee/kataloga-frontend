import { usePerformanceAnalyzer } from '~/utils/performance'

const startTimes = new Map<string, number>()

/**
 * Composable for measuring application performance metrics
 */
export function usePerformance() {
  const startMeasure = (name: string) => {
    startTimes.set(name, typeof performance !== 'undefined' ? performance.now() : Date.now())
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${name}-start`)
      } catch (e) {}
    }
  }

  const endMeasure = (name: string): number => {
    const startTime = startTimes.get(name)
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const fallbackDuration = startTime ? (endTime - startTime) : 0

    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${name}-end`)
        performance.measure(name, `${name}-start`, `${name}-end`)
        const entries = performance.getEntriesByName(name)
        const duration = entries[entries.length - 1]?.duration || 0
        return duration || fallbackDuration
      } catch (e) {
        return fallbackDuration
      }
    }
    return fallbackDuration
  }

  return {
    startMeasure,
    endMeasure,
    analyzer: usePerformanceAnalyzer()
  }
}
