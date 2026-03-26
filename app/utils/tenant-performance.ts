/**
 * Tenant Performance Optimization Utilities
 * 
 * Provides utilities for optimizing tenant operations including:
 * - Request deduplication
 * - Intelligent caching
 * - Lazy loading helpers
 * - Performance monitoring
 * 
 * Requirements: All (Performance optimization)
 */

import { isDefined } from '~/types/utils/type-guards'

/**
 * Request deduplication manager
 * Prevents duplicate API requests for the same resource
 */
export class RequestDeduplicator<T> {
  private pendingRequests: Map<string, Promise<T>> = new Map()

  /**
   * Execute a request with deduplication
   * If the same key is already pending, return the existing promise
   */
  async deduplicate(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(key)
    if (pending) {
      return pending
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Remove from pending after completion
      this.pendingRequests.delete(key)
    })

    // Store pending request
    this.pendingRequests.set(key, promise)

    return promise
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear()
  }

  /**
   * Clear specific request
   */
  clearKey(key: string): void {
    this.pendingRequests.delete(key)
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }
}

/**
 * Lazy component loader with tenant context
 * Provides optimized lazy loading for tenant-specific components
 */
export function createTenantLazyLoader() {
  const loadedComponents = new Map<string, any>()

  return {
    /**
     * Load component lazily with caching
     */
    async loadComponent(
      componentPath: string,
      tenantSlug?: string
    ): Promise<any> {
      const cacheKey = tenantSlug 
        ? `${componentPath}:${tenantSlug}` 
        : componentPath

      // Return cached component if available
      if (loadedComponents.has(cacheKey)) {
        return loadedComponents.get(cacheKey)
      }

      // Load component dynamically
      try {
        const component = await import(/* @vite-ignore */ componentPath)
        loadedComponents.set(cacheKey, component)
        return component
      } catch (error) {
        console.error(`Failed to load component: ${componentPath}`, error)
        throw error
      }
    },

    /**
     * Preload component for better performance
     */
    async preloadComponent(
      componentPath: string,
      tenantSlug?: string
    ): Promise<void> {
      try {
        await this.loadComponent(componentPath, tenantSlug)
      } catch (error) {
        // Silently fail for preload
        console.debug('Preload failed:', componentPath, error)
      }
    },

    /**
     * Clear cached components
     */
    clearCache(tenantSlug?: string): void {
      if (tenantSlug) {
        // Clear only components for specific tenant
        for (const [key] of loadedComponents) {
          if (key.endsWith(`:${tenantSlug}`)) {
            loadedComponents.delete(key)
          }
        }
      } else {
        // Clear all cached components
        loadedComponents.clear()
      }
    },

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
      return {
        size: loadedComponents.size,
        keys: Array.from(loadedComponents.keys())
      }
    }
  }
}

/**
 * Batch request manager
 * Batches multiple requests into a single API call
 */
export class BatchRequestManager<T> {
  private queue: Array<{
    key: string
    resolve: (value: T) => void
    reject: (error: any) => void
  }> = []
  private batchTimeout: NodeJS.Timeout | null = null
  private batchDelay: number

  constructor(
    private batchFn: (keys: string[]) => Promise<Map<string, T>>,
    batchDelay: number = 50
  ) {
    this.batchDelay = batchDelay
  }

  /**
   * Add request to batch queue
   */
  request(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject })

      // Schedule batch execution
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.executeBatch()
        }, this.batchDelay)
      }
    })
  }

  /**
   * Execute batched requests
   */
  private async executeBatch(): Promise<void> {
    if (this.queue.length === 0) {
      return
    }

    // Get current queue and reset
    const currentQueue = [...this.queue]
    this.queue = []
    this.batchTimeout = null

    // Extract unique keys
    const keys = [...new Set(currentQueue.map(item => item.key))]

    try {
      // Execute batch request
      const results = await this.batchFn(keys)

      // Resolve individual promises
      for (const item of currentQueue) {
        const result = results.get(item.key)
        if (result !== undefined) {
          item.resolve(result)
        } else {
          item.reject(new Error(`No result for key: ${item.key}`))
        }
      }
    } catch (error) {
      // Reject all promises on batch error
      for (const item of currentQueue) {
        item.reject(error)
      }
    }
  }

  /**
   * Clear pending batch
   */
  clear(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
    this.queue = []
  }
}

/**
 * Adaptive cache with TTL and size limits
 */
export class AdaptiveCache<T> {
  private cache: Map<string, {
    value: T
    timestamp: number
    accessCount: number
    lastAccess: number
  }> = new Map()

  constructor(
    private maxSize: number = 100,
    private defaultTTL: number = 300000 // 5 minutes
  ) {}

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    const now = Date.now()
    if (now - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key)
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccess = now

    return entry.value
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now()

    // Check size limit and evict if necessary
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed()
    }

    this.cache.set(key, {
      value,
      timestamp: now,
      accessCount: 1,
      lastAccess: now
    })
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete specific key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null
    let leastUsedScore = Infinity

    for (const [key, entry] of this.cache) {
      // Calculate score based on access count and recency
      const recencyScore = Date.now() - entry.lastAccess
      const score = recencyScore / (entry.accessCount + 1)

      if (score < leastUsedScore) {
        leastUsedScore = score
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    entries: Array<{ key: string; accessCount: number; age: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      age: now - entry.timestamp
    }))

    // Calculate hit rate (simplified)
    const totalAccesses = entries.reduce((sum, e) => sum + e.accessCount, 0)
    const hitRate = entries.length > 0 ? totalAccesses / entries.length : 0

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      entries
    }
  }
}

/**
 * Prefetch manager for tenant data
 */
export class TenantPrefetchManager {
  private prefetchQueue: Set<string> = new Set()
  private prefetchInProgress: Set<string> = new Set()

  constructor(
    private prefetchFn: (slug: string) => Promise<void>,
    private maxConcurrent: number = 3
  ) {}

  /**
   * Add tenant to prefetch queue
   */
  queue(tenantSlug: string): void {
    if (!this.prefetchInProgress.has(tenantSlug)) {
      this.prefetchQueue.add(tenantSlug)
      this.processPrefetchQueue()
    }
  }

  /**
   * Add multiple tenants to prefetch queue
   */
  queueMultiple(tenantSlugs: string[]): void {
    for (const slug of tenantSlugs) {
      this.queue(slug)
    }
  }

  /**
   * Process prefetch queue
   */
  private async processPrefetchQueue(): Promise<void> {
    // Check if we can start more prefetch operations
    while (
      this.prefetchQueue.size > 0 &&
      this.prefetchInProgress.size < this.maxConcurrent
    ) {
      const slug = this.prefetchQueue.values().next().value
      
      if (!isDefined(slug)) {
        break
      }
      
      this.prefetchQueue.delete(slug)
      this.prefetchInProgress.add(slug)

      // Start prefetch (don't await)
      this.prefetchFn(slug)
        .catch(error => {
          console.debug('Prefetch failed for tenant:', slug, error)
        })
        .finally(() => {
          this.prefetchInProgress.delete(slug)
          // Process next in queue
          this.processPrefetchQueue()
        })
    }
  }

  /**
   * Clear prefetch queue
   */
  clear(): void {
    this.prefetchQueue.clear()
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueSize: number
    inProgress: number
  } {
    return {
      queueSize: this.prefetchQueue.size,
      inProgress: this.prefetchInProgress.size
    }
  }
}

// Note: debounce and throttle functions are imported from utils/debounce.ts
// to avoid duplication and maintain consistency across the application

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  } as T
}

/**
 * Create optimized tenant data loader
 */
export function createOptimizedTenantLoader() {
  const deduplicator = new RequestDeduplicator<any>()
  const cache = new AdaptiveCache<any>(50, 300000) // 50 items, 5 min TTL

  return {
    /**
     * Load tenant data with deduplication and caching
     */
    async load<T>(
      key: string,
      loaderFn: () => Promise<T>,
      options: {
        useCache?: boolean
        cacheTTL?: number
      } = {}
    ): Promise<T> {
      const { useCache = true, cacheTTL } = options

      // Check cache first
      if (useCache) {
        const cached = cache.get(key)
        if (cached !== null) {
          return cached
        }
      }

      // Deduplicate request
      const result = await deduplicator.deduplicate(key, loaderFn)

      // Store in cache
      if (useCache) {
        cache.set(key, result, cacheTTL)
      }

      return result
    },

    /**
     * Invalidate cache for key
     */
    invalidate(key: string): void {
      cache.delete(key)
      deduplicator.clearKey(key)
    },

    /**
     * Clear all cache
     */
    clearCache(): void {
      cache.clear()
      deduplicator.clear()
    },

    /**
     * Get statistics
     */
    getStats() {
      return {
        cache: cache.getStats(),
        pendingRequests: deduplicator.getPendingCount()
      }
    }
  }
}
