interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionTime: number
  memoryUsage?: number
}

export const usePerformance = () => {
  const metrics = ref<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
  })

  const measurePageLoad = () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        metrics.value.loadTime = navigation.loadEventEnd - navigation.loadEventStart
        metrics.value.renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      }
    }
  }

  const measureInteraction = (startTime: number) => {
    const endTime = performance.now()
    metrics.value.interactionTime = endTime - startTime
  }

  const measureMemoryUsage = () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      metrics.value.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
    }
  }

  const logMetrics = (context: string) => {
    if (process.dev) {
      console.group(`Performance Metrics - ${context}`)
      console.log('Load Time:', metrics.value.loadTime, 'ms')
      console.log('Render Time:', metrics.value.renderTime, 'ms')
      console.log('Interaction Time:', metrics.value.interactionTime, 'ms')
      if (metrics.value.memoryUsage) {
        console.log('Memory Usage:', metrics.value.memoryUsage.toFixed(2), 'MB')
      }
      console.groupEnd()
    }
  }

  const startTimer = () => performance.now()

  const endTimer = (startTime: number, label: string) => {
    const duration = performance.now() - startTime
    if (process.dev) {
      console.log(`${label}:`, duration.toFixed(2), 'ms')
    }
    return duration
  }

  // Web Vitals monitoring
  const observeWebVitals = () => {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint (LCP)
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (process.dev) {
          console.log('LCP:', lastEntry.startTime.toFixed(2), 'ms')
        }
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    }

    // First Input Delay (FID)
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (process.dev) {
            console.log('FID:', entry.processingStart - entry.startTime, 'ms')
          }
        })
      })
      observer.observe({ entryTypes: ['first-input'] })
    }

    // Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        if (process.dev) {
          console.log('CLS:', clsValue.toFixed(4))
        }
      })
      observer.observe({ entryTypes: ['layout-shift'] })
    }

    try {
      observeLCP()
      observeFID()
      observeCLS()
    } catch (error) {
      console.warn('Web Vitals observation not supported:', error)
    }
  }

  onMounted(() => {
    measurePageLoad()
    measureMemoryUsage()
    observeWebVitals()
  })

  return {
    metrics: readonly(metrics),
    measurePageLoad,
    measureInteraction,
    measureMemoryUsage,
    logMetrics,
    startTimer,
    endTimer,
    observeWebVitals,
  }
}