/**
 * Core Web Vitals monitoring and optimization
 * Tracks FCP, LCP, FID, CLS, TTFB and provides optimization recommendations
 */

interface WebVitalsMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  inp?: number // Interaction to Next Paint (new metric)
}

interface WebVitalsThresholds {
  fcp: { good: number; needsImprovement: number }
  lcp: { good: number; needsImprovement: number }
  fid: { good: number; needsImprovement: number }
  cls: { good: number; needsImprovement: number }
  ttfb: { good: number; needsImprovement: number }
  inp: { good: number; needsImprovement: number }
}

// Web Vitals thresholds (Google recommendations)
const WEB_VITALS_THRESHOLDS: WebVitalsThresholds = {
  fcp: { good: 1800, needsImprovement: 3000 },
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  ttfb: { good: 800, needsImprovement: 1800 },
  inp: { good: 200, needsImprovement: 500 }
}

/**
 * Core Web Vitals monitor class
 */
export class CoreWebVitalsMonitor {
  private metrics: WebVitalsMetrics = {}
  private observers: PerformanceObserver[] = []
  private callbacks: Array<(metrics: WebVitalsMetrics) => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    // First Contentful Paint
    this.observePaintMetrics()
    
    // Largest Contentful Paint
    this.observeLCP()
    
    // First Input Delay
    this.observeFID()
    
    // Cumulative Layout Shift
    this.observeCLS()
    
    // Time to First Byte
    this.measureTTFB()
    
    // Interaction to Next Paint (if supported)
    this.observeINP()
  }

  /**
   * Observe paint metrics (FCP)
   */
  private observePaintMetrics(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime
            this.notifyCallbacks()
            console.log('FCP:', entry.startTime)
          }
        }
      })
      
      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('FCP observation not supported:', error)
    }
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
        this.notifyCallbacks()
        console.log('LCP:', lastEntry.startTime)
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('LCP observation not supported:', error)
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime
          this.metrics.fid = fid
          this.notifyCallbacks()
          console.log('FID:', fid)
        }
      })
      
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('FID observation not supported:', error)
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS(): void {
    try {
      let clsValue = 0
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only count layout shifts without recent user input
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
            this.metrics.cls = clsValue
            this.notifyCallbacks()
            console.log('CLS:', clsValue)
          }
        }
      })
      
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('CLS observation not supported:', error)
    }
  }

  /**
   * Measure Time to First Byte
   */
  private measureTTFB(): void {
    try {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationTiming) {
        this.metrics.ttfb = navigationTiming.responseStart - navigationTiming.requestStart
        this.notifyCallbacks()
        console.log('TTFB:', this.metrics.ttfb)
      }
    } catch (error) {
      console.warn('TTFB measurement not supported:', error)
    }
  }

  /**
   * Observe Interaction to Next Paint (experimental)
   */
  private observeINP(): void {
    try {
      // INP is still experimental, fallback to event timing
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const inp = (entry as any).processingEnd - entry.startTime
          if (inp > (this.metrics.inp || 0)) {
            this.metrics.inp = inp
            this.notifyCallbacks()
            console.log('INP:', inp)
          }
        }
      })
      
      observer.observe({ entryTypes: ['event'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('INP observation not supported:', error)
    }
  }

  /**
   * Add callback for metric updates
   */
  onMetricsUpdate(callback: (metrics: WebVitalsMetrics) => void): void {
    this.callbacks.push(callback)
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback(this.metrics))
  }

  /**
   * Get current metrics
   */
  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics }
  }

  /**
   * Get metrics with ratings
   */
  getMetricsWithRatings() {
    return Object.entries(this.metrics).map(([key, value]) => {
      const threshold = WEB_VITALS_THRESHOLDS[key as keyof WebVitalsThresholds]
      let rating: 'good' | 'needs-improvement' | 'poor' = 'good'
      
      if (value !== undefined && threshold) {
        if (value > threshold.needsImprovement) {
          rating = 'poor'
        } else if (value > threshold.good) {
          rating = 'needs-improvement'
        }
      }
      
      return {
        metric: key,
        value,
        rating,
        threshold
      }
    })
  }

  /**
   * Generate optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = []
    const metricsWithRatings = this.getMetricsWithRatings()
    
    metricsWithRatings.forEach(({ metric, rating, value }) => {
      if (rating === 'poor' || rating === 'needs-improvement') {
        switch (metric) {
          case 'fcp':
            recommendations.push(
              'Improve First Contentful Paint by:',
              '• Reducing server response time',
              '• Eliminating render-blocking resources',
              '• Minifying CSS and JavaScript',
              '• Using a CDN for static assets'
            )
            break
            
          case 'lcp':
            recommendations.push(
              'Improve Largest Contentful Paint by:',
              '• Optimizing images (WebP, proper sizing)',
              '• Preloading critical resources',
              '• Reducing server response time',
              '• Using efficient cache policies'
            )
            break
            
          case 'fid':
            recommendations.push(
              'Improve First Input Delay by:',
              '• Reducing JavaScript execution time',
              '• Code splitting and lazy loading',
              '• Using web workers for heavy tasks',
              '• Optimizing third-party scripts'
            )
            break
            
          case 'cls':
            recommendations.push(
              'Improve Cumulative Layout Shift by:',
              '• Setting size attributes on images and videos',
              '• Reserving space for ads and embeds',
              '• Avoiding inserting content above existing content',
              '• Using CSS aspect-ratio for responsive media'
            )
            break
            
          case 'ttfb':
            recommendations.push(
              'Improve Time to First Byte by:',
              '• Optimizing server performance',
              '• Using a CDN',
              '• Implementing server-side caching',
              '• Reducing database query time'
            )
            break
            
          case 'inp':
            recommendations.push(
              'Improve Interaction to Next Paint by:',
              '• Optimizing event handlers',
              '• Reducing main thread blocking',
              '• Using requestIdleCallback for non-critical tasks',
              '• Debouncing frequent interactions'
            )
            break
        }
      }
    })
    
    return recommendations
  }

  /**
   * Report metrics to analytics
   */
  reportToAnalytics(): void {
    const metricsWithRatings = this.getMetricsWithRatings()
    
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      metricsWithRatings.forEach(({ metric, value, rating }) => {
        if (value !== undefined) {
          (window as any).gtag('event', 'web_vitals', {
            metric_name: metric,
            metric_value: Math.round(value),
            metric_rating: rating
          })
        }
      })
    }
    
    // Send to custom analytics endpoint
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: this.metrics,
          ratings: metricsWithRatings,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      }).catch(error => {
        console.warn('Failed to report Web Vitals:', error)
      })
    }
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.callbacks = []
  }
}

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  private budget: WebVitalsMetrics
  
  constructor(budget: WebVitalsMetrics) {
    this.budget = budget
  }
  
  /**
   * Check if metrics are within budget
   */
  checkBudget(metrics: WebVitalsMetrics): {
    passed: boolean
    violations: Array<{ metric: string; actual: number; budget: number }>
  } {
    const violations: Array<{ metric: string; actual: number; budget: number }> = []
    
    Object.entries(this.budget).forEach(([metric, budgetValue]) => {
      const actualValue = metrics[metric as keyof WebVitalsMetrics]
      
      if (actualValue !== undefined && budgetValue !== undefined && actualValue > budgetValue) {
        violations.push({
          metric,
          actual: actualValue,
          budget: budgetValue
        })
      }
    })
    
    return {
      passed: violations.length === 0,
      violations
    }
  }
}

/**
 * Default performance budget (aggressive targets)
 */
export const DEFAULT_PERFORMANCE_BUDGET: WebVitalsMetrics = {
  fcp: 1500, // 1.5s
  lcp: 2000, // 2s
  fid: 50,   // 50ms
  cls: 0.05, // 0.05
  ttfb: 500, // 500ms
  inp: 150   // 150ms
}

/**
 * Create and start Core Web Vitals monitoring
 */
export function startWebVitalsMonitoring(): CoreWebVitalsMonitor {
  const monitor = new CoreWebVitalsMonitor()
  
  // Report metrics after page load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        monitor.reportToAnalytics()
      }, 3000) // Wait 3 seconds for metrics to stabilize
    })
    
    // Report on page visibility change (user leaving)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        monitor.reportToAnalytics()
      }
    })
  }
  
  return monitor
}

// Export singleton instance
export const webVitalsMonitor = startWebVitalsMonitoring()