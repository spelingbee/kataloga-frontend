/**
 * Advanced caching strategies for performance optimization
 */

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size
  strategy?: 'lru' | 'lfu' | 'fifo' // Cache eviction strategy
}

interface CacheEntry<T> {
  value: T
  timestamp: number
  accessCount: number
  size: number
}

/**
 * In-memory cache with configurable eviction strategies
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 100,
      strategy: options.strategy || 'lru',
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update access count for LFU
    entry.accessCount++
    entry.timestamp = Date.now() // Update timestamp for LRU

    return entry.value
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, size: number = 1): void {
    // Check if cache is full
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evict()
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
      size,
    })
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Evict entries based on strategy
   */
  private evict(): void {
    if (this.cache.size === 0) return

    let keyToEvict: string | null = null

    switch (this.options.strategy) {
      case 'lru': // Least Recently Used
        keyToEvict = this.evictLRU()
        break
      case 'lfu': // Least Frequently Used
        keyToEvict = this.evictLFU()
        break
      case 'fifo': // First In First Out
        keyToEvict = this.evictFIFO()
        break
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict)
    }
  }

  private evictLRU(): string | null {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  private evictLFU(): string | null {
    let leastUsedKey: string | null = null
    let leastCount = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount
        leastUsedKey = key
      }
    }

    return leastUsedKey
  }

  private evictFIFO(): string | null {
    const firstKey = this.cache.keys().next().value
    return firstKey || null
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalSize = 0
    let totalAccess = 0

    for (const entry of this.cache.values()) {
      totalSize += entry.size
      totalAccess += entry.accessCount
    }

    return {
      size: this.cache.size,
      totalSize,
      totalAccess,
      avgAccessCount: totalAccess / this.cache.size || 0,
    }
  }
}

/**
 * API response cache with stale-while-revalidate strategy
 */
export class APICache {
  private cache = new MemoryCache<any>()
  private revalidating = new Set<string>()

  constructor(options?: CacheOptions) {
    this.cache = new MemoryCache(options)
  }

  /**
   * Get cached response or fetch new one
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: { staleTime?: number } = {}
  ): Promise<T> {
    const { staleTime = 60000 } = options // 1 minute default

    // Check cache
    const cached = this.cache.get(key)

    if (cached) {
      // Return cached value immediately
      const age = Date.now() - cached.timestamp

      // If stale, revalidate in background
      if (age > staleTime && !this.revalidating.has(key)) {
        this.revalidate(key, fetcher)
      }

      return cached.value
    }

    // Fetch new data
    const data = await fetcher()
    this.cache.set(key, data)
    return data
  }

  /**
   * Revalidate cache in background
   */
  private async revalidate<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
    this.revalidating.add(key)

    try {
      const data = await fetcher()
      this.cache.set(key, data)
    } catch (error) {
      console.error('Cache revalidation failed:', error)
    } finally {
      this.revalidating.delete(key)
    }
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }
}

/**
 * Image cache for optimized loading
 */
export class ImageCache {
  private cache = new Map<string, HTMLImageElement>()
  private loading = new Map<string, Promise<HTMLImageElement>>()

  /**
   * Preload image
   */
  async preload(url: string): Promise<HTMLImageElement> {
    // Check if already cached
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }

    // Check if already loading
    if (this.loading.has(url)) {
      return this.loading.get(url)!
    }

    // Load image
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        this.cache.set(url, img)
        this.loading.delete(url)
        resolve(img)
      }

      img.onerror = () => {
        this.loading.delete(url)
        reject(new Error(`Failed to load image: ${url}`))
      }

      img.src = url
    })

    this.loading.set(url, promise)
    return promise
  }

  /**
   * Preload multiple images
   */
  async preloadBatch(urls: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(urls.map((url) => this.preload(url)))
  }

  /**
   * Check if image is cached
   */
  has(url: string): boolean {
    return this.cache.has(url)
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear()
    this.loading.clear()
  }
}

// Export singleton instances
export const memoryCache = new MemoryCache()
export const apiCache = new APICache()
export const imageCache = new ImageCache()
