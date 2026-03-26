/**
 * Tenant Monitoring and Logging Utilities
 * 
 * Provides comprehensive monitoring and logging for tenant operations:
 * - Tenant switching events
 * - Performance metrics
 * - Error tracking
 * - Analytics integration
 * 
 * Requirements: All (Monitoring and logging)
 */

/**
 * Tenant event types
 */
export enum TenantEventType {
  INITIALIZED = 'tenant.initialized',
  SWITCHED = 'tenant.switched',
  VALIDATED = 'tenant.validated',
  VALIDATION_FAILED = 'tenant.validation_failed',
  LOADED = 'tenant.loaded',
  LOAD_FAILED = 'tenant.load_failed',
  CACHED = 'tenant.cached',
  CACHE_HIT = 'tenant.cache_hit',
  CACHE_MISS = 'tenant.cache_miss',
  PREFETCHED = 'tenant.prefetched',
  ERROR = 'tenant.error',
}

/**
 * Tenant event data
 */
export interface TenantEvent {
  type: TenantEventType
  timestamp: number
  tenantSlug?: string
  tenantId?: string
  source?: string
  duration?: number
  error?: string
  metadata?: Record<string, any>
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: number
  tenantSlug?: string
  success: boolean
  metadata?: Record<string, any>
}

/**
 * Tenant error log
 */
export interface TenantErrorLog {
  errorType: string
  message: string
  timestamp: number
  tenantSlug?: string
  stack?: string
  context?: Record<string, any>
}

/**
 * Tenant monitoring service
 */
export class TenantMonitoringService {
  private events: TenantEvent[] = []
  private metrics: PerformanceMetric[] = []
  private errors: TenantErrorLog[] = []
  private maxEventsSize = 1000
  private maxMetricsSize = 500
  private maxErrorsSize = 100
  private listeners: Array<(event: TenantEvent) => void> = []

  /**
   * Log tenant event
   */
  logEvent(event: Omit<TenantEvent, 'timestamp'>): void {
    const fullEvent: TenantEvent = {
      ...event,
      timestamp: Date.now()
    }

    // Add to events array
    this.events.push(fullEvent)

    // Trim if exceeds max size
    if (this.events.length > this.maxEventsSize) {
      this.events = this.events.slice(-this.maxEventsSize)
    }

    // Notify listeners
    this.notifyListeners(fullEvent)

    // Log to console in development
    if (import.meta.dev) {
      this.logToConsole(fullEvent)
    }

    // Send to analytics if available
    this.sendToAnalytics(fullEvent)
  }

  /**
   * Log performance metric
   */
  logMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    }

    // Add to metrics array
    this.metrics.push(fullMetric)

    // Trim if exceeds max size
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize)
    }

    // Log slow operations
    if (fullMetric.duration > 1000) {
      console.warn(
        `[Tenant Performance] Slow operation: ${fullMetric.operation} took ${fullMetric.duration}ms`,
        fullMetric
      )
    }
  }

  /**
   * Log tenant error
   */
  logError(error: Omit<TenantErrorLog, 'timestamp'>): void {
    const fullError: TenantErrorLog = {
      ...error,
      timestamp: Date.now()
    }

    // Add to errors array
    this.errors.push(fullError)

    // Trim if exceeds max size
    if (this.errors.length > this.maxErrorsSize) {
      this.errors = this.errors.slice(-this.maxErrorsSize)
    }

    // Log to console
    console.error('[Tenant Error]', fullError.message, fullError)

    // Send to error tracking service
    this.sendToErrorTracking(fullError)
  }

  /**
   * Start performance measurement
   */
  startMeasure(operation: string): () => void {
    const startTime = performance.now()

    return () => {
      const duration = performance.now() - startTime
      return duration
    }
  }

  /**
   * Measure async operation
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    tenantSlug?: string
  ): Promise<T> {
    const startTime = performance.now()
    let success = false
    let error: any = null

    try {
      const result = await fn()
      success = true
      return result
    } catch (err) {
      error = err
      throw err
    } finally {
      const duration = performance.now() - startTime

      this.logMetric({
        operation,
        duration,
        tenantSlug,
        success,
        metadata: error ? { error: error.message } : undefined
      })
    }
  }

  /**
   * Get events by type
   */
  getEventsByType(type: TenantEventType): TenantEvent[] {
    return this.events.filter(e => e.type === type)
  }

  /**
   * Get events by tenant
   */
  getEventsByTenant(tenantSlug: string): TenantEvent[] {
    return this.events.filter(e => e.tenantSlug === tenantSlug)
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 50): TenantEvent[] {
    return this.events.slice(-count)
  }

  /**
   * Get metrics by operation
   */
  getMetricsByOperation(operation: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operation)
  }

  /**
   * Get average duration for operation
   */
  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetricsByOperation(operation)
    
    if (operationMetrics.length === 0) {
      return 0
    }

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0)
    return total / operationMetrics.length
  }

  /**
   * Get success rate for operation
   */
  getSuccessRate(operation: string): number {
    const operationMetrics = this.getMetricsByOperation(operation)
    
    if (operationMetrics.length === 0) {
      return 0
    }

    const successful = operationMetrics.filter(m => m.success).length
    return (successful / operationMetrics.length) * 100
  }

  /**
   * Get errors by tenant
   */
  getErrorsByTenant(tenantSlug: string): TenantErrorLog[] {
    return this.errors.filter(e => e.tenantSlug === tenantSlug)
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 20): TenantErrorLog[] {
    return this.errors.slice(-count)
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEvents: number
    totalMetrics: number
    totalErrors: number
    eventsByType: Record<string, number>
    averageDurations: Record<string, number>
    successRates: Record<string, number>
    errorsByType: Record<string, number>
  } {
    // Count events by type
    const eventsByType: Record<string, number> = {}
    for (const event of this.events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
    }

    // Calculate average durations
    const operations = [...new Set(this.metrics.map(m => m.operation))]
    const averageDurations: Record<string, number> = {}
    const successRates: Record<string, number> = {}
    
    for (const operation of operations) {
      averageDurations[operation] = this.getAverageDuration(operation)
      successRates[operation] = this.getSuccessRate(operation)
    }

    // Count errors by type
    const errorsByType: Record<string, number> = {}
    for (const error of this.errors) {
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1
    }

    return {
      totalEvents: this.events.length,
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      eventsByType,
      averageDurations,
      successRates,
      errorsByType
    }
  }

  /**
   * Subscribe to events
   */
  onEvent(callback: (event: TenantEvent) => void): () => void {
    this.listeners.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify listeners
   */
  private notifyListeners(event: TenantEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in event listener:', error)
      }
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(event: TenantEvent): void {
    const emoji = this.getEventEmoji(event.type)
    const color = this.getEventColor(event.type)
    
    console.log(
      `%c${emoji} [Tenant] ${event.type}`,
      `color: ${color}; font-weight: bold`,
      {
        tenant: event.tenantSlug,
        source: event.source,
        duration: event.duration ? `${event.duration}ms` : undefined,
        ...event.metadata
      }
    )
  }

  /**
   * Get emoji for event type
   */
  private getEventEmoji(type: TenantEventType): string {
    const emojiMap: Record<TenantEventType, string> = {
      [TenantEventType.INITIALIZED]: '🚀',
      [TenantEventType.SWITCHED]: '🔄',
      [TenantEventType.VALIDATED]: '✅',
      [TenantEventType.VALIDATION_FAILED]: '❌',
      [TenantEventType.LOADED]: '📦',
      [TenantEventType.LOAD_FAILED]: '⚠️',
      [TenantEventType.CACHED]: '💾',
      [TenantEventType.CACHE_HIT]: '⚡',
      [TenantEventType.CACHE_MISS]: '🔍',
      [TenantEventType.PREFETCHED]: '🎯',
      [TenantEventType.ERROR]: '🔥',
    }

    return emojiMap[type] || '📌'
  }

  /**
   * Get color for event type
   */
  private getEventColor(type: TenantEventType): string {
    const colorMap: Record<TenantEventType, string> = {
      [TenantEventType.INITIALIZED]: '#4CAF50',
      [TenantEventType.SWITCHED]: '#2196F3',
      [TenantEventType.VALIDATED]: '#4CAF50',
      [TenantEventType.VALIDATION_FAILED]: '#F44336',
      [TenantEventType.LOADED]: '#9C27B0',
      [TenantEventType.LOAD_FAILED]: '#FF9800',
      [TenantEventType.CACHED]: '#607D8B',
      [TenantEventType.CACHE_HIT]: '#00BCD4',
      [TenantEventType.CACHE_MISS]: '#FFC107',
      [TenantEventType.PREFETCHED]: '#3F51B5',
      [TenantEventType.ERROR]: '#F44336',
    }

    return colorMap[type] || '#757575'
  }

  /**
   * Send event to analytics service
   */
  private sendToAnalytics(event: TenantEvent): void {
    // Integration with analytics services (Google Analytics, Mixpanel, etc.)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('event', event.type, {
          event_category: 'tenant',
          event_label: event.tenantSlug,
          value: event.duration,
          ...event.metadata
        })
      } catch (error) {
        console.debug('Failed to send to analytics:', error)
      }
    }
  }

  /**
   * Send error to error tracking service
   */
  private sendToErrorTracking(error: TenantErrorLog): void {
    // Integration with error tracking services (Sentry, Rollbar, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        (window as any).Sentry.captureException(new Error(error.message), {
          tags: {
            tenant: error.tenantSlug,
            errorType: error.errorType
          },
          extra: error.context
        })
      } catch (err) {
        console.debug('Failed to send to error tracking:', err)
      }
    }
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.events = []
    this.metrics = []
    this.errors = []
  }

  /**
   * Clear old logs (older than specified time)
   */
  clearOld(maxAge: number = 3600000): void {
    const now = Date.now()
    
    this.events = this.events.filter(e => now - e.timestamp < maxAge)
    this.metrics = this.metrics.filter(m => now - m.timestamp < maxAge)
    this.errors = this.errors.filter(e => now - e.timestamp < maxAge)
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): {
    events: TenantEvent[]
    metrics: PerformanceMetric[]
    errors: TenantErrorLog[]
    stats: {
      totalEvents: number
      totalMetrics: number
      totalErrors: number
      eventsByType: Record<string, number>
      averageDurations: Record<string, number>
      successRates: Record<string, number>
      errorsByType: Record<string, number>
    }
  } {
    return {
      events: [...this.events],
      metrics: [...this.metrics],
      errors: [...this.errors],
      stats: this.getStats()
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getStats()
    
    let report = '=== Tenant Performance Report ===\n\n'
    
    report += `Total Events: ${stats.totalEvents}\n`
    report += `Total Metrics: ${stats.totalMetrics}\n`
    report += `Total Errors: ${stats.totalErrors}\n\n`
    
    report += '--- Events by Type ---\n'
    for (const [type, count] of Object.entries(stats.eventsByType)) {
      report += `${type}: ${count}\n`
    }
    
    report += '\n--- Average Durations ---\n'
    for (const [operation, duration] of Object.entries(stats.averageDurations)) {
      report += `${operation}: ${duration.toFixed(2)}ms\n`
    }
    
    report += '\n--- Success Rates ---\n'
    for (const [operation, rate] of Object.entries(stats.successRates)) {
      report += `${operation}: ${rate.toFixed(2)}%\n`
    }
    
    report += '\n--- Errors by Type ---\n'
    for (const [type, count] of Object.entries(stats.errorsByType)) {
      report += `${type}: ${count}\n`
    }
    
    return report
  }
}

// Singleton instance
let monitoringService: TenantMonitoringService | null = null

/**
 * Get or create monitoring service instance
 */
export function useTenantMonitoring(): TenantMonitoringService {
  if (!monitoringService) {
    monitoringService = new TenantMonitoringService()
  }
  return monitoringService
}

/**
 * Composable for tenant monitoring in components
 */
export function useTenantMonitoringComposable() {
  const monitoring = useTenantMonitoring()

  /**
   * Log tenant switch event
   */
  const logTenantSwitch = (
    fromTenant: string | null,
    toTenant: string,
    duration: number
  ): void => {
    monitoring.logEvent({
      type: TenantEventType.SWITCHED,
      tenantSlug: toTenant,
      duration,
      metadata: {
        fromTenant,
        toTenant
      }
    })
  }

  /**
   * Log tenant initialization
   */
  const logTenantInit = (
    tenantSlug: string,
    source: string,
    duration: number
  ): void => {
    monitoring.logEvent({
      type: TenantEventType.INITIALIZED,
      tenantSlug,
      source,
      duration
    })
  }

  /**
   * Log tenant validation
   */
  const logTenantValidation = (
    tenantSlug: string,
    isValid: boolean,
    duration: number
  ): void => {
    monitoring.logEvent({
      type: isValid ? TenantEventType.VALIDATED : TenantEventType.VALIDATION_FAILED,
      tenantSlug,
      duration
    })
  }

  /**
   * Log cache hit/miss
   */
  const logCacheAccess = (
    tenantSlug: string,
    hit: boolean
  ): void => {
    monitoring.logEvent({
      type: hit ? TenantEventType.CACHE_HIT : TenantEventType.CACHE_MISS,
      tenantSlug
    })
  }

  /**
   * Track async operation
   */
  const trackOperation = async <T>(
    operation: string,
    fn: () => Promise<T>,
    tenantSlug?: string
  ): Promise<T> => {
    return monitoring.measureAsync(operation, fn, tenantSlug)
  }

  /**
   * Get monitoring statistics
   */
  const getStats = () => monitoring.getStats()

  /**
   * Generate report
   */
  const generateReport = () => monitoring.generateReport()

  /**
   * Export logs
   */
  const exportLogs = () => monitoring.exportLogs()

  return {
    logTenantSwitch,
    logTenantInit,
    logTenantValidation,
    logCacheAccess,
    trackOperation,
    getStats,
    generateReport,
    exportLogs,
    monitoring
  }
}
