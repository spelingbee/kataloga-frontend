export default defineNuxtPlugin(() => {
  // Performance monitoring
  if (import.meta.client && 'performance' in window) {
    // Monitor Core Web Vitals
    const observeWebVitals = () => {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('LCP:', lastEntry.startTime)
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime)
        })
      }).observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        console.log('CLS:', clsValue)
      }).observe({ entryTypes: ['layout-shift'] })
    }

    // Monitor resource loading
    const observeResources = () => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.transferSize > 100000) { // Log large resources (>100KB)
            console.warn('Large resource detected:', {
              name: entry.name,
              size: entry.transferSize,
              duration: entry.duration,
            })
          }
        })
      }).observe({ entryTypes: ['resource'] })
    }

    // Monitor long tasks
    const observeLongTasks = () => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
          })
        })
      }).observe({ entryTypes: ['longtask'] })
    }

    // Initialize observers
    observeWebVitals()
    observeResources()
    observeLongTasks()

    // Memory usage monitoring
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        console.log('Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
        })
      }
    }

    // Monitor memory every 30 seconds in development
    if (process.dev) {
      setInterval(monitorMemory, 30000)
    }

    // Bundle analysis on load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

        const jsResources = resources.filter(r => r.name.includes('.js'))
        const cssResources = resources.filter(r => r.name.includes('.css'))

        const totalJSSize = jsResources.reduce((total, r) => total + (r.transferSize || 0), 0)
        const totalCSSSize = cssResources.reduce((total, r) => total + (r.transferSize || 0), 0)

        console.log('Bundle analysis:', {
          js: {
            count: jsResources.length,
            size: Math.round(totalJSSize / 1024) + ' KB',
          },
          css: {
            count: cssResources.length,
            size: Math.round(totalCSSSize / 1024) + ' KB',
          },
          timing: {
            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
            loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          },
        })
      }, 1000)
    })
  }

  // Provide performance utilities
  return {
    provide: {
      performance: {
        mark: (name: string) => {
          if ('performance' in window && performance.mark) {
            performance.mark(name)
          }
        },
        measure: (name: string, startMark: string, endMark?: string) => {
          if ('performance' in window && performance.measure) {
            performance.measure(name, startMark, endMark)
          }
        },
        getMetrics: () => {
          if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
            return {
              ttfb: navigation.responseStart - navigation.requestStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            }
          }
          return null
        },
      },
    },
  }
})