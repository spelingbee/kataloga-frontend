// Performance utilities for bundle analysis and optimization

export interface BundleAnalysis {
  chunks: {
    name: string
    size: number
    type: 'js' | 'css'
    loadTime: number
  }[]
  totalSize: number
  loadTime: number
  metrics: {
    ttfb: number
    fcp: number
    lcp: number
    cls: number
    fid: number
  }
}

export interface PerformanceMetrics {
  navigation: {
    ttfb: number
    domContentLoaded: number
    loadComplete: number
  }
  resources: {
    js: { count: number; size: number }
    css: { count: number; size: number }
    images: { count: number; size: number }
    fonts: { count: number; size: number }
  }
  vitals: {
    fcp?: number
    lcp?: number
    cls?: number
    fid?: number
  }
}

export class PerformanceAnalyzer {
  private metrics: PerformanceMetrics | null = null
  private observers: PerformanceObserver[] = []

  constructor() {
    if (import.meta.client && 'performance' in window) {
      this.initializeObservers()
    }
  }

  private initializeObservers() {
    // First Contentful Paint
    this.createObserver(['paint'], (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.updateVital('fcp', entry.startTime)
        }
      })
    })

    // Largest Contentful Paint
    this.createObserver(['largest-contentful-paint'], (entries) => {
      const lastEntry = entries[entries.length - 1]
      this.updateVital('lcp', lastEntry.startTime)
    })

    // Cumulative Layout Shift
    let clsValue = 0
    this.createObserver(['layout-shift'], (entries) => {
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      this.updateVital('cls', clsValue)
    })

    // First Input Delay
    this.createObserver(['first-input'], (entries) => {
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime
        this.updateVital('fid', fid)
      })
    })
  }

  private createObserver(entryTypes: string[], callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      observer.observe({ entryTypes })
      this.observers.push(observer)
    } catch (error) {
      console.warn('Failed to create performance observer:', error)
    }
  }

  private updateVital(name: keyof PerformanceMetrics['vitals'], value: number) {
    if (!this.metrics) {
      this.metrics = this.initializeMetrics()
    }
    this.metrics.vitals[name] = value
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      navigation: { ttfb: 0, domContentLoaded: 0, loadComplete: 0 },
      resources: {
        js: { count: 0, size: 0 },
        css: { count: 0, size: 0 },
        images: { count: 0, size: 0 },
        fonts: { count: 0, size: 0 },
      },
      vitals: {},
    }
  }

  public analyzeBundle(): BundleAnalysis | null {
    if (!import.meta.client || !('performance' in window)) {
      return null
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    const chunks = resources
      .filter(resource => resource.name.includes('.js') || resource.name.includes('.css'))
      .map(resource => ({
        name: resource.name.split('/').pop() || 'unknown',
        size: resource.transferSize || 0,
        type: resource.name.includes('.js') ? 'js' as const : 'css' as const,
        loadTime: resource.duration || 0,
      }))
      .sort((a, b) => b.size - a.size)

    const totalSize = chunks.reduce((total, chunk) => total + chunk.size, 0)

    return {
      chunks,
      totalSize,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      metrics: {
        ttfb: navigation.responseStart - navigation.requestStart,
        fcp: this.metrics?.vitals.fcp || 0,
        lcp: this.metrics?.vitals.lcp || 0,
        cls: this.metrics?.vitals.cls || 0,
        fid: this.metrics?.vitals.fid || 0,
      },
    }
  }

  public getMetrics(): PerformanceMetrics | null {
    if (!import.meta.client || !('performance' in window)) {
      return null
    }

    if (!this.metrics) {
      this.metrics = this.initializeMetrics()
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    // Update navigation metrics
    this.metrics.navigation = {
      ttfb: navigation.responseStart - navigation.requestStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    }

    // Analyze resources
    const resourceTypes = {
      js: resources.filter(r => r.name.includes('.js')),
      css: resources.filter(r => r.name.includes('.css')),
      images: resources.filter(r => /\.(jpg|jpeg|png|gif|webp|avif|svg)/.test(r.name)),
      fonts: resources.filter(r => /\.(woff|woff2|ttf|otf)/.test(r.name)),
    }

    Object.entries(resourceTypes).forEach(([type, typeResources]) => {
      this.metrics!.resources[type as keyof typeof resourceTypes] = {
        count: typeResources.length,
        size: typeResources.reduce((total, r) => total + (r.transferSize || 0), 0),
      }
    })

    return this.metrics
  }

  public logPerformanceReport() {
    const analysis = this.analyzeBundle()
    const metrics = this.getMetrics()

    if (!analysis || !metrics) {
      console.warn('Performance analysis not available')
      return
    }

    console.group('🚀 Performance Report')
    
    console.group('📊 Core Web Vitals')
    console.log(`FCP: ${analysis.metrics.fcp.toFixed(2)}ms`)
    console.log(`LCP: ${analysis.metrics.lcp.toFixed(2)}ms`)
    console.log(`CLS: ${analysis.metrics.cls.toFixed(4)}`)
    console.log(`FID: ${analysis.metrics.fid.toFixed(2)}ms`)
    console.groupEnd()

    console.group('📦 Bundle Analysis')
    console.log(`Total Size: ${(analysis.totalSize / 1024).toFixed(2)} KB`)
    console.log(`Load Time: ${analysis.loadTime.toFixed(2)}ms`)
    console.table(analysis.chunks.slice(0, 10)) // Top 10 chunks
    console.groupEnd()

    console.group('🌐 Resource Breakdown')
    Object.entries(metrics.resources).forEach(([type, data]) => {
      console.log(`${type.toUpperCase()}: ${data.count} files, ${(data.size / 1024).toFixed(2)} KB`)
    })
    console.groupEnd()

    console.group('⏱️ Navigation Timing')
    console.log(`TTFB: ${metrics.navigation.ttfb.toFixed(2)}ms`)
    console.log(`DOM Content Loaded: ${metrics.navigation.domContentLoaded.toFixed(2)}ms`)
    console.log(`Load Complete: ${metrics.navigation.loadComplete.toFixed(2)}ms`)
    console.groupEnd()

    console.groupEnd()
  }

  public getRecommendations(): string[] {
    const analysis = this.analyzeBundle()
    const metrics = this.getMetrics()
    const recommendations: string[] = []

    if (!analysis || !metrics) {
      return recommendations
    }

    // Bundle size recommendations
    if (analysis.totalSize > 500 * 1024) { // > 500KB
      recommendations.push('Consider code splitting to reduce bundle size')
    }

    // Core Web Vitals recommendations
    if (analysis.metrics.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint (LCP) - consider image optimization and lazy loading')
    }

    if (analysis.metrics.fid > 100) {
      recommendations.push('Optimize First Input Delay (FID) - reduce JavaScript execution time')
    }

    if (analysis.metrics.cls > 0.1) {
      recommendations.push('Optimize Cumulative Layout Shift (CLS) - ensure proper image dimensions and avoid layout shifts')
    }

    // Resource recommendations
    if (metrics.resources.js.size > 300 * 1024) { // > 300KB JS
      recommendations.push('JavaScript bundle is large - consider lazy loading and tree shaking')
    }

    if (metrics.resources.images.size > 1024 * 1024) { // > 1MB images
      recommendations.push('Optimize images - use WebP format and appropriate sizing')
    }

    return recommendations
  }

  public dispose() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Singleton instance
let performanceAnalyzer: PerformanceAnalyzer | null = null

export function usePerformanceAnalyzer(): PerformanceAnalyzer {
  if (!performanceAnalyzer) {
    performanceAnalyzer = new PerformanceAnalyzer()
  }
  return performanceAnalyzer
}

// Utility functions
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function getPerformanceGrade(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    fcp: { good: 1800, poor: 3000 },
    ttfb: { good: 800, poor: 1800 },
  }

  const threshold = thresholds[metric.toLowerCase()]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}