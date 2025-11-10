import type { 
  TenantInfo, 
  TenantValidationResult, 
  TenantResolverOptions,
  TenantError 
} from '~/types/tenant'
import { 
  useTenantMonitoring, 
  TenantEventType 
} from '~/utils/tenant-monitoring'
import { 
  RequestDeduplicator,
  AdaptiveCache 
} from '~/utils/tenant-performance'

/**
 * Cache entry for tenant information
 */
interface TenantCacheEntry {
  tenant: TenantInfo
  timestamp: number
  validationResult: boolean
}

/**
 * Tenant Resolver Service
 * 
 * Handles tenant resolution from multiple sources with priority:
 * 1. Environment variable (NUXT_PUBLIC_TENANT_SLUG)
 * 2. Query parameter (?tenant=slug)
 * 3. LocalStorage (saved user preference)
 * 4. Default tenant (fallback)
 * 
 * Requirements: 1.1, 3.1, 3.2, 3.3, 3.4
 */
export class TenantResolverService {
  private apiClient: any
  private config: any
  private currentTenant: TenantInfo | null = null
  private listeners: Array<(tenant: TenantInfo | null) => void> = []
  
  // Optimized caching with adaptive cache
  private tenantCache: AdaptiveCache<TenantInfo>
  private validationCache: AdaptiveCache<boolean>
  
  // Request deduplication
  private requestDeduplicator: RequestDeduplicator<TenantInfo>
  private validationDeduplicator: RequestDeduplicator<TenantValidationResult>
  
  // Monitoring service
  private monitoring = useTenantMonitoring()

  constructor(apiClient: any, config: any) {
    this.apiClient = apiClient
    this.config = config
    
    // Initialize optimized caches
    const cacheTimeout = this.getCacheTimeout()
    this.tenantCache = new AdaptiveCache<TenantInfo>(50, cacheTimeout)
    this.validationCache = new AdaptiveCache<boolean>(100, cacheTimeout)
    
    // Initialize deduplicators
    this.requestDeduplicator = new RequestDeduplicator<TenantInfo>()
    this.validationDeduplicator = new RequestDeduplicator<TenantValidationResult>()
  }

  /**
   * Get cache timeout from config (default 5 minutes)
   */
  private getCacheTimeout(): number {
    return this.config.public.tenantCacheTimeout || 300000 // 5 minutes
  }

  /**
   * Get tenant from cache (private)
   */
  private getCachedTenant(slug: string): TenantInfo | null {
    const cached = this.tenantCache.get(slug)
    
    if (cached) {
      // Log cache hit
      this.monitoring.logEvent({
        type: TenantEventType.CACHE_HIT,
        tenantSlug: slug
      })
    } else {
      // Log cache miss
      this.monitoring.logEvent({
        type: TenantEventType.CACHE_MISS,
        tenantSlug: slug
      })
    }
    
    return cached
  }

  /**
   * Get tenant from cache (public accessor for offline mode)
   * Requirements: 1.4, 3.2
   */
  getCachedTenantInfo(slug: string): TenantInfo | null {
    return this.getCachedTenant(slug)
  }

  /**
   * Set tenant in cache
   */
  private setCachedTenant(slug: string, tenant: TenantInfo): void {
    this.tenantCache.set(slug, tenant)
    
    // Log caching event
    this.monitoring.logEvent({
      type: TenantEventType.CACHED,
      tenantSlug: slug
    })
  }

  /**
   * Get validation result from cache
   */
  private getCachedValidation(slug: string): boolean | null {
    return this.validationCache.get(slug)
  }

  /**
   * Set validation result in cache
   */
  private setCachedValidation(slug: string, isValid: boolean): void {
    this.validationCache.set(slug, isValid)
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.tenantCache.clear()
    this.validationCache.clear()
    this.requestDeduplicator.clear()
    this.validationDeduplicator.clear()
  }

  /**
   * Clear cache for specific tenant
   */
  clearTenantCache(slug: string): void {
    this.tenantCache.delete(slug)
    this.validationCache.delete(slug)
    this.requestDeduplicator.clearKey(slug)
    this.validationDeduplicator.clearKey(slug)
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    this.tenantCache.clearExpired()
    this.validationCache.clearExpired()
  }

  /**
   * Resolve tenant slug from multiple sources with priority
   * Requirements: 3.1, 3.2
   */
  async resolveTenantSlug(options: TenantResolverOptions = {}): Promise<string | null> {
    // Priority 1: Environment variable (highest priority)
    if (this.config.public.tenantSlug && this.config.public.tenantSlug !== 'default') {
      return this.config.public.tenantSlug
    }

    // Priority 2: Explicit option from environment
    if (options.fromEnvironment) {
      return options.fromEnvironment
    }

    // Priority 3: Query parameter
    if (options.fromQuery) {
      return options.fromQuery
    }

    // Priority 4: LocalStorage (saved user preference)
    if (options.fromLocalStorage) {
      return options.fromLocalStorage
    }

    // Priority 5: Default tenant
    if (options.defaultTenant) {
      return options.defaultTenant
    }

    // Priority 6: Config default tenant
    if (this.config.public.defaultTenant) {
      return this.config.public.defaultTenant
    }

    return null
  }

  /**
   * Resolve and validate tenant with fallback mechanisms
   * Requirements: 3.1, 3.2, 3.3
   */
  async resolveAndValidateTenant(options: TenantResolverOptions = {}): Promise<TenantInfo | null> {
    const sources = [
      { name: 'environment', value: options.fromEnvironment || this.config.public.tenantSlug },
      { name: 'query', value: options.fromQuery },
      { name: 'localStorage', value: options.fromLocalStorage || this.getStoredTenant() },
      { name: 'default', value: options.defaultTenant || this.config.public.defaultTenant }
    ]

    // Try each source in priority order
    for (const source of sources) {
      if (!source.value || source.value === 'default') {
        continue
      }

      try {
        const validationResult = await this.validateTenant(source.value)
        
        if (validationResult.isValid && validationResult.tenant) {
          console.log(`Tenant resolved from ${source.name}: ${source.value}`)
          
          // Save to localStorage if not from environment (for future visits)
          if (source.name !== 'environment' && source.name !== 'localStorage') {
            this.saveStoredTenant(source.value)
          }
          
          return validationResult.tenant
        } else {
          console.warn(`Tenant validation failed for ${source.name}: ${source.value}`, validationResult.error)
          
          // Clear localStorage if it was the source and validation failed
          if (source.name === 'localStorage') {
            this.clearStoredTenant()
          }
        }
      } catch (error) {
        console.error(`Error validating tenant from ${source.name}:`, error)
        
        // Clear localStorage if it was the source and caused an error
        if (source.name === 'localStorage') {
          this.clearStoredTenant()
        }
        
        // Continue to next source
        continue
      }
    }

    // No valid tenant found
    return null
  }

  /**
   * Handle invalid tenant with fallback strategies
   * Requirements: 3.2, 3.3
   */
  async handleInvalidTenant(slug: string, error?: string): Promise<TenantInfo | null> {
    console.warn(`Invalid tenant: ${slug}`, error)
    
    // Clear stored tenant if it's invalid
    const storedTenant = this.getStoredTenant()
    if (storedTenant === slug) {
      this.clearStoredTenant()
    }

    // Try default tenant as fallback
    const defaultTenant = this.config.public.defaultTenant
    if (defaultTenant && defaultTenant !== slug) {
      try {
        const validationResult = await this.validateTenant(defaultTenant)
        if (validationResult.isValid && validationResult.tenant) {
          console.log(`Fallback to default tenant: ${defaultTenant}`)
          return validationResult.tenant
        }
      } catch (error) {
        console.error('Default tenant validation failed:', error)
      }
    }

    return null
  }

  /**
   * Resolve tenant with comprehensive error handling
   * Requirements: 3.1, 3.2, 3.3
   */
  async resolveTenantWithFallback(options: TenantResolverOptions = {}): Promise<{
    tenant: TenantInfo | null
    source: string
    requiresSelection: boolean
  }> {
    try {
      // Try to resolve and validate tenant
      const tenant = await this.resolveAndValidateTenant(options)
      
      if (tenant) {
        // Determine which source was used
        let source = 'unknown'
        if (this.config.public.tenantSlug && this.config.public.tenantSlug !== 'default') {
          source = 'environment'
        } else if (options.fromQuery) {
          source = 'query'
        } else if (this.getStoredTenant()) {
          source = 'localStorage'
        } else {
          source = 'default'
        }
        
        return {
          tenant,
          source,
          requiresSelection: false
        }
      }

      // No valid tenant found, user needs to select
      return {
        tenant: null,
        source: 'none',
        requiresSelection: true
      }
    } catch (error) {
      console.error('Error resolving tenant:', error)
      
      return {
        tenant: null,
        source: 'error',
        requiresSelection: true
      }
    }
  }

  /**
   * Validate tenant slug through API with caching
   * Requirements: 1.1, 3.2, 3.3, 3.4
   */
  async validateTenant(slug: string): Promise<TenantValidationResult> {
    if (!slug || slug.trim() === '') {
      return {
        isValid: false,
        error: 'Tenant slug is required'
      }
    }

    // Check cache first
    const cachedValidation = this.getCachedValidation(slug)
    if (cachedValidation !== null) {
      const cachedTenant = this.getCachedTenant(slug)
      return {
        isValid: cachedValidation,
        tenant: cachedTenant || undefined,
        error: cachedValidation ? undefined : 'Tenant not found or inactive'
      }
    }

    // Use deduplicator to prevent duplicate requests
    return this.validationDeduplicator.deduplicate(slug, async () => {
      const startTime = performance.now()
      
      try {
        // Call API to validate tenant
        const response = await this.apiClient.get(
          `/tenants/${slug}/validate`,
          { 
            headers: { 
              'X-Bypass-Tenant': 'true' // System-wide request
            } 
          }
        ) as { success: boolean; data: { valid: boolean; tenant?: TenantInfo } }

        const duration = performance.now() - startTime

        if (response.success && response.data.valid && response.data.tenant) {
          // Cache the result
          this.setCachedValidation(slug, true)
          this.setCachedTenant(slug, response.data.tenant)
          
          // Log successful validation
          this.monitoring.logEvent({
            type: TenantEventType.VALIDATED,
            tenantSlug: slug,
            duration
          })
          
          this.monitoring.logMetric({
            operation: 'tenant.validate',
            duration,
            tenantSlug: slug,
            success: true
          })
          
          return {
            isValid: true,
            tenant: response.data.tenant
          }
        }

        // Cache negative result
        this.setCachedValidation(slug, false)
        
        // Log validation failure
        this.monitoring.logEvent({
          type: TenantEventType.VALIDATION_FAILED,
          tenantSlug: slug,
          duration,
          error: 'Tenant not found or inactive'
        })
        
        this.monitoring.logMetric({
          operation: 'tenant.validate',
          duration,
          tenantSlug: slug,
          success: false
        })
        
        return {
          isValid: false,
          error: 'Tenant not found or inactive'
        }
      } catch (error) {
        const duration = performance.now() - startTime
        const errorMessage = error instanceof Error ? error.message : 'Validation failed'
        
        // Log error
        this.monitoring.logError({
          errorType: 'VALIDATION_ERROR',
          message: errorMessage,
          tenantSlug: slug,
          stack: error instanceof Error ? error.stack : undefined
        })
        
        this.monitoring.logMetric({
          operation: 'tenant.validate',
          duration,
          tenantSlug: slug,
          success: false,
          metadata: { error: errorMessage }
        })
        
        // Don't cache errors, allow retry
        return {
          isValid: false,
          error: errorMessage
        }
      }
    })
  }

  /**
   * Get tenant information from API with caching
   * Requirements: 1.1, 3.3, 3.4
   */
  async getTenantInfo(slug: string): Promise<TenantInfo> {
    // Check cache first
    const cachedTenant = this.getCachedTenant(slug)
    if (cachedTenant) {
      return cachedTenant
    }

    // Use deduplicator to prevent duplicate requests
    return this.requestDeduplicator.deduplicate(slug, async () => {
      const startTime = performance.now()
      
      try {
        const response = await this.apiClient.get(
          `/tenants/${slug}`,
          { 
            headers: { 
              'X-Bypass-Tenant': 'true' // System-wide request
            } 
          }
        ) as { success: boolean; data: TenantInfo }

        const duration = performance.now() - startTime

        if (!response.success || !response.data) {
          const error = this.createTenantError(
            'TENANT_NOT_FOUND',
            `Tenant not found: ${slug}`,
            slug
          )
          
          // Log load failure
          this.monitoring.logEvent({
            type: TenantEventType.LOAD_FAILED,
            tenantSlug: slug,
            duration,
            error: error.message
          })
          
          this.monitoring.logMetric({
            operation: 'tenant.load',
            duration,
            tenantSlug: slug,
            success: false
          })
          
          throw error
        }

        // Cache the result
        this.setCachedTenant(slug, response.data)

        // Log successful load
        this.monitoring.logEvent({
          type: TenantEventType.LOADED,
          tenantSlug: slug,
          tenantId: response.data.id,
          duration
        })
        
        this.monitoring.logMetric({
          operation: 'tenant.load',
          duration,
          tenantSlug: slug,
          success: true
        })

        return response.data
      } catch (error) {
        const duration = performance.now() - startTime
        
        if (this.isTenantError(error)) {
          // Log tenant-specific error
          this.monitoring.logError({
            errorType: (error as TenantError).errorType,
            message: error.message,
            tenantSlug: slug,
            stack: error.stack
          })
          
          throw error
        }
        
        const tenantError = this.createTenantError(
          'TENANT_VALIDATION_FAILED',
          error instanceof Error ? error.message : 'Failed to fetch tenant info',
          slug
        )
        
        // Log error
        this.monitoring.logError({
          errorType: 'LOAD_ERROR',
          message: tenantError.message,
          tenantSlug: slug,
          stack: tenantError.stack
        })
        
        this.monitoring.logMetric({
          operation: 'tenant.load',
          duration,
          tenantSlug: slug,
          success: false,
          metadata: { error: tenantError.message }
        })
        
        throw tenantError
      }
    })
  }

  /**
   * Set current tenant
   * Requirements: 1.1, 3.1
   */
  setCurrentTenant(tenant: TenantInfo | null): void {
    this.currentTenant = tenant
    this.notifyListeners(tenant)
  }

  /**
   * Get current tenant
   */
  getCurrentTenant(): TenantInfo | null {
    return this.currentTenant
  }

  /**
   * Clear current tenant
   */
  clearCurrentTenant(): void {
    this.currentTenant = null
    this.notifyListeners(null)
  }

  /**
   * Subscribe to tenant changes
   */
  onTenantChange(callback: (tenant: TenantInfo | null) => void): () => void {
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
   * Notify all listeners of tenant change
   */
  private notifyListeners(tenant: TenantInfo | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(tenant)
      } catch (error) {
        console.error('Error in tenant change listener:', error)
      }
    })
  }

  /**
   * Create a tenant-specific error
   */
  private createTenantError(
    errorType: TenantError['errorType'],
    message: string,
    tenantSlug?: string
  ): TenantError {
    const error = new Error(message) as TenantError
    error.errorType = errorType
    error.tenantSlug = tenantSlug
    error.name = 'TenantError'
    
    // Set status code based on error type
    switch (errorType) {
      case 'TENANT_NOT_FOUND':
        error.statusCode = 404
        break
      case 'TENANT_INACTIVE':
        error.statusCode = 403
        break
      case 'TENANT_ACCESS_DENIED':
        error.statusCode = 403
        break
      case 'TENANT_VALIDATION_FAILED':
        error.statusCode = 400
        break
    }
    
    return error
  }

  /**
   * Type guard for TenantError
   */
  private isTenantError(error: any): error is TenantError {
    return error && 
           typeof error === 'object' && 
           'errorType' in error &&
           ['TENANT_NOT_FOUND', 'TENANT_INACTIVE', 'TENANT_ACCESS_DENIED', 'TENANT_VALIDATION_FAILED'].includes(error.errorType)
  }

  /**
   * Check if tenant is valid and active
   */
  async isTenantValid(slug: string): Promise<boolean> {
    const result = await this.validateTenant(slug)
    return result.isValid
  }

  /**
   * Get tenant from localStorage
   */
  getStoredTenant(): string | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      return localStorage.getItem('selectedTenant')
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  }

  /**
   * Save tenant to localStorage
   */
  saveStoredTenant(slug: string): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.setItem('selectedTenant', slug)
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }

  /**
   * Clear stored tenant from localStorage
   */
  clearStoredTenant(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.removeItem('selectedTenant')
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }

  /**
   * Start periodic cache cleanup
   * Requirements: 3.4
   */
  startCacheCleanup(intervalMs: number = 60000): () => void {
    const intervalId = setInterval(() => {
      this.clearExpiredCache()
    }, intervalMs)

    // Return cleanup function
    return () => {
      clearInterval(intervalId)
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    tenantCache: ReturnType<AdaptiveCache<TenantInfo>['getStats']>
    validationCache: ReturnType<AdaptiveCache<boolean>['getStats']>
    pendingRequests: number
    pendingValidations: number
  } {
    return {
      tenantCache: this.tenantCache.getStats(),
      validationCache: this.validationCache.getStats(),
      pendingRequests: this.requestDeduplicator.getPendingCount(),
      pendingValidations: this.validationDeduplicator.getPendingCount()
    }
  }

  /**
   * Prefetch tenant information for better performance
   * Requirements: 3.4
   */
  async prefetchTenant(slug: string): Promise<void> {
    try {
      // Only prefetch if not already cached
      if (!this.getCachedTenant(slug)) {
        await this.getTenantInfo(slug)
        
        // Log prefetch event
        this.monitoring.logEvent({
          type: TenantEventType.PREFETCHED,
          tenantSlug: slug
        })
      }
    } catch (error) {
      // Silently fail for prefetch
      console.debug('Prefetch failed for tenant:', slug, error)
    }
  }

  /**
   * Prefetch multiple tenants
   * Requirements: 3.4
   */
  async prefetchTenants(slugs: string[]): Promise<void> {
    await Promise.allSettled(
      slugs.map(slug => this.prefetchTenant(slug))
    )
  }
  
  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    return this.monitoring.getStats()
  }
  
  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    return this.monitoring.generateReport()
  }
}

// Singleton instance
let tenantResolverService: TenantResolverService | null = null

/**
 * Create tenant resolver service instance
 */
export function createTenantResolverService(apiClient: any, config: any): TenantResolverService {
  tenantResolverService = new TenantResolverService(apiClient, config)
  return tenantResolverService
}

/**
 * Get tenant resolver service instance
 */
export function useTenantResolverService(): TenantResolverService {
  if (!tenantResolverService) {
    throw new Error('Tenant resolver service not initialized. Call createTenantResolverService first.')
  }
  return tenantResolverService
}
