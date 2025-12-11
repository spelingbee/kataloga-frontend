/**
 * Performance monitoring composable
 * Tracks and reports performance metrics
 */

import { onMounted } from 'vue'

interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  tti?: number // Time to Interactive
}

export function usePerformanceMonitoring() {
  const metrics = ref<PerformanceMetrics>({})

  // Measure First Contentful Paint
  const measureFCP = () => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          metrics.value.fcp = entry.startTime
          console.log('FCP:', entry.startTime)
        }
      }
    })
    observer.observe({ entryTypes: ['paint'] })
  }

  // Measure Largest Contentful Paint
  const measureLCP = () => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      metrics.value.lcp = lastEntry.startTime
      console.log('LCP:', lastEntry.startTime)
    })
    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  }

  // Measure First Input Delay
  const measureFID = () => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        metrics.value.fid = (entry as any).processingStart - entry.startTime
        console.log('FID:', metrics.value.fid)
      }
    })
    observer.observe({ entryTypes: ['first-input'] })
  }

  // Measure Cumulative Layout Shift
  const measureCLS = () => {
    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
          metrics.value.cls = clsValue
          console.log('CLS:', clsValue)
        }
      }
    })
    observer.observe({ entryTypes: ['layout-shift'] })
  }

  // Measure Time to First Byte
  const measureTTFB = () => {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationTiming) {
      metrics.value.ttfb = navigationTiming.responseStart - navigationTiming.requestStart
      console.log('TTFB:', metrics.value.ttfb)
    }
  }

  // Report metrics to analytics
  const reportMetrics = () => {
    // Send to analytics service (Google Analytics, custom endpoint, etc.)
    if (process.client && window.gtag) {
      Object.entries(metrics.value).forEach(([key, value]) => {
        if (value !== undefined) {
          window.gtag('event', 'performance_metric', {
            metric_name: key,
            metric_value: value,
          })
        }
      })
    }
  }

  onMounted(() => {
    if (process.client && 'PerformanceObserver' in window) {
      measureFCP()
      measureLCP()
      measureFID()
      measureCLS()
      measureTTFB()

      // Report metrics after page load
      window.addEventListener('load', () => {
        setTimeout(reportMetrics, 3000)
      })
    }
  })

  return {
    metrics,
    reportMetrics,
  }
}

/**
 * Component performance tracking
 */
export function useComponentPerformance(componentName: string) {
  const startTime = ref(0)
  const endTime = ref(0)
  const renderTime = computed(() => endTime.value - startTime.value)

  const startTracking = () => {
    startTime.value = performance.now()
  }

  const endTracking = () => {
    endTime.value = performance.now()
    console.log(`${componentName} render time:`, renderTime.value, 'ms')
  }

  onMounted(() => {
    startTracking()
  })

  onUpdated(() => {
    endTracking()
  })

  return {
    renderTime,
    startTracking,
    endTracking,
  }
}

/**
 * Memory usage monitoring
 */
export function useMemoryMonitoring() {
  const memoryInfo = ref<{
    usedJSHeapSize?: number
    totalJSHeapSize?: number
    jsHeapSizeLimit?: number
  }>({})

  const checkMemory = () => {
    if (process.client && (performance as any).memory) {
      const memory = (performance as any).memory
      memoryInfo.value = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      }
    }
  }

  onMounted(() => {
    checkMemory()
    // Check memory every 30 seconds
    const interval = setInterval(checkMemory, 30000)
    onUnmounted(() => clearInterval(interval))
  })

  return {
    memoryInfo,
    checkMemory,
  }
}
