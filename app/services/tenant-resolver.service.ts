import type { 
  TenantInfo, 
  TenantValidationResult, 
  TenantResolverOptions,
  TenantError 
} from '~/types/tenant'

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
  

  constructor(apiClient: any, config: any) {
    this.apiClient = apiClient
    this.config = config
    
    // Extract cache timeout from config (Requirements: 3.4 Performance)
    const cacheTimeout = config?.public?.tenantCacheTimeout || 300000
    
    // Initialize optimized caches
    this.tenantCache = new AdaptiveCache<TenantInfo>(50, cacheTimeout)
    this.validationCache = new AdaptiveCache<boolean>(100, cacheTimeout)
    
    // Initialize deduplicators
    this.requestDeduplicator = new RequestDeduplicator<TenantInfo>()
    this.validationDeduplicator = new RequestDeduplicator<TenantValidationResult>()
  }

  /**
   * Resolve tenant from multiple sources with fallback
   * Requirements: 1.1, 3.1, 4.1
   */
  async resolveTenantWithFallback(options: TenantResolverOptions): Promise<{
    tenant: TenantInfo | null
    requiresSelection: boolean
  }> {
    // 1. From Path Parameter (/t/slug)
    if (options.fromRoute) {
      const tenant = await this.getTenantInfo(options.fromRoute)
      if (tenant) return { tenant, requiresSelection: false }
    }

    // 2. From Query Parameter (?tenant=slug)
    if (options.fromQuery) {
      const tenant = await this.getTenantInfo(options.fromQuery)
      if (tenant) return { tenant, requiresSelection: false }
    }

    // 2. From Environment Variable (Default Tenant)
    if (this.config.public.tenantSlug) {
      const tenant = await this.getTenantInfo(this.config.public.tenantSlug)
      console.log('Запрос был здесь', tenant)
      if (tenant) return { tenant, requiresSelection: false }
    }

    // 3. From LocalStorage
    if (options.fromLocalStorage) {
      const tenant = await this.getTenantInfo(options.fromLocalStorage)
      if (tenant) return { tenant, requiresSelection: false }
    }

    // 4. Fallback to Multi-tenant selection if enabled
    if (this.config.public.multiTenantMode || !this.config.public.tenantSlug) {
      return { tenant: null, requiresSelection: true }
    }

    return { tenant: null, requiresSelection: false }
  }

  /**
   * Get tenant information with caching and deduplication
   * Requirements: 1.1, 3.4
   */
  async getTenantInfo(slug: string): Promise<TenantInfo | null> {
    if (!slug) return null

    // Check cache
    const cached = this.tenantCache.get(slug)
    if (cached) return cached

    // Deduplicate request
    return await this.requestDeduplicator.deduplicate(slug, async () => {
      try {
        const response = await this.apiClient.get<any>(`/tenants/${slug}`, {
          headers: { 'X-Bypass-Tenant': 'true' }
        })
        const data = response && typeof response === 'object' && 'success' in response && 'data' in response
          ? response.data
          : response

        if (data) {
          if (response && typeof response === 'object' && response.success === false) {
            throw new Error('Tenant not found')
          }
          this.tenantCache.set(slug, data)
          return data
        }
        throw new Error('Tenant not found')
      } catch (error) {
        console.error(`Failed to resolve tenant: ${slug}`, error)
        throw error
      }
    })
  }

  /**
   * Validate tenant existence and status
   * Requirements: 3.2
   */
  async validateTenant(slug: string): Promise<TenantValidationResult> {
    if (!slug) {
      return { isValid: false, error: 'Tenant slug is required' }
    }
    const cacheKey = `val:${slug}`
    
    // Check validation cache
    const cached = this.validationCache.get(slug)
    if (cached !== null) return { isValid: cached }

    // Deduplicate validation request
    return await this.validationDeduplicator.deduplicate(cacheKey, async () => {
      try {
        const response = await this.apiClient.get<any>(`/tenants/${slug}/validate`, {
          headers: { 'X-Bypass-Tenant': 'true' }
        })
        const data = response && typeof response === 'object' && 'success' in response && 'data' in response
          ? response.data
          : response

        const isValid = !!(data?.isValid || data?.valid)
        this.validationCache.set(slug, isValid)
        
        if (isValid) {
          return { isValid, tenant: data?.tenant }
        } else {
          return { isValid, error: data?.error || 'Tenant not found or inactive' }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Validation failed'
        return { isValid: false, error: message }
      }
    })
  }

  /**
   * Prefetch tenant info to warm up cache
   */
  async prefetchTenant(slug: string): Promise<void> {
    try {
      await this.getTenantInfo(slug)
    } catch (e) {
      // Prefetch should fail silently
    }
  }

  /**
   * Prefetch multiple tenants
   */
  async prefetchTenants(slugs: string[]): Promise<void> {
    await Promise.all(slugs.map(slug => this.prefetchTenant(slug)))
  }

  /**
   * Sync check for cached tenant info
   */
  getCachedTenantInfo(slug: string): TenantInfo | null {
    return this.tenantCache.get(slug)
  }

  /**
   * Storage management
   */
  getStoredTenant(): string | null {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem('selectedTenant')
    } catch (e) {
      return null
    }
  }

  saveStoredTenant(slug: string): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('selectedTenant', slug)
    } catch (e) {
      // Handle storage errors gracefully
    }
  }

  clearStoredTenant(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem('selectedTenant')
    } catch (e) {
      // Handle storage errors gracefully
    }
  }

  /**
   * Cache maintenance
   */
  startCacheCleanup(intervalMs: number = 60000): () => void {
    const interval = setInterval(() => {
      this.tenantCache.clearExpired()
      this.validationCache.clearExpired()
    }, intervalMs)

    return () => clearInterval(interval)
  }

  clearTenantCache(slug?: string): void {
    if (slug) {
      this.tenantCache.delete(slug)
      this.validationCache.delete(slug)
    } else {
      this.tenantCache.clear()
      this.validationCache.clear()
    }
  }

  clearCache(): void {
    this.clearTenantCache()
  }

  getCacheStats() {
    return {
      tenantCache: {
        size: this.tenantCache.getStats().size
      },
      validationCache: {
        size: this.validationCache.getStats().size
      }
    }
  }

  /**
   * Tenant change listeners
   */
  onTenantChange(listener: (tenant: TenantInfo | null) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  setCurrentTenant(tenant: TenantInfo | null): void {
    this.currentTenant = tenant
    this.listeners.forEach(listener => {
      try {
        listener(tenant)
      } catch (e) {
        console.error('Error in tenant change listener', e)
      }
    })
  }

  /**
   * Resolve tenant slug from options
   */
  async resolveTenantSlug(options: TenantResolverOptions = {}): Promise<string | null> {
    if (this.config.public.tenantSlug) {
      return this.config.public.tenantSlug
    }
    if (options.fromQuery) {
      return options.fromQuery
    }
    if (options.fromLocalStorage) {
      return options.fromLocalStorage
    }
    if (this.config.public.defaultTenant) {
      return this.config.public.defaultTenant
    }
    return null
  }

  /**
   * Resolve and validate tenant from options
   */
  async resolveAndValidateTenant(options: TenantResolverOptions = {}): Promise<TenantInfo | null> {
    const slug = await this.resolveTenantSlug(options)
    if (!slug) return null

    const validation = await this.validateTenant(slug)
    if (validation.isValid && validation.tenant) {
      this.saveStoredTenant(slug)
      return validation.tenant
    } else {
      this.clearStoredTenant()
      return null
    }
  }
}

/**
 * Factory function for backward compatibility
 */
export const createTenantResolverService = (apiClient: any, config: any) => {
  return new TenantResolverService(apiClient, config)
}
