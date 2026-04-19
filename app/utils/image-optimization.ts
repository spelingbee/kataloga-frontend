 /* Handles lazy loading, WebP format conversion, and performance optimization */
import { useRuntimeConfig } from '#app'

interface ImageOptimizationOptions {
  quality?: number
  format?: 'webp' | 'avif' | 'jpg' | 'png'
  width?: number
  height?: number
  lazy?: boolean
  placeholder?: 'blur' | 'empty' | 'data-url'
  sizes?: string
  priority?: boolean
}

interface OptimizedImageResult {
  src: string
  srcSet: string
  sizes: string
  placeholder?: string
  loading: 'lazy' | 'eager'
  decoding: 'async' | 'sync'
}

/**
 * Generate optimized image configuration
 */
export function generateOptimizedImage(
  src: string,
  options: ImageOptimizationOptions = {}
): OptimizedImageResult {
  const {
    quality = 80,
    format = 'webp',
    width,
    height,
    lazy = true,
    placeholder = 'blur',
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    priority = false
  } = options

  // Generate srcSet for responsive images
  const srcSet = generateSrcSet(src, { quality, format, width, height })
  
  // Generate placeholder if needed
  const placeholderSrc = placeholder === 'blur' ? generateBlurPlaceholder(src) : undefined
  
  return {
    src: optimizeImageUrl(src, { quality, format, width, height }),
    srcSet,
    sizes,
    placeholder: placeholderSrc,
    loading: priority ? 'eager' : (lazy ? 'lazy' : 'eager'),
    decoding: 'async'
  }
}

/**
 * Generate srcSet for responsive images
 */
function generateSrcSet(
  src: string,
  options: { quality?: number; format?: string; width?: number; height?: number }
): string {
  const { quality = 80, format = 'webp' } = options
  
  // Standard responsive breakpoints
  const breakpoints = [320, 640, 768, 1024, 1280, 1536]
  
  const srcSetEntries = breakpoints.map(width => {
    const optimizedUrl = optimizeImageUrl(src, { ...options, width, quality, format })
    return `${optimizedUrl} ${width}w`
  })
  
  return srcSetEntries.join(', ')
}

/**
 * Optimize image URL with parameters
 */
function optimizeImageUrl(
  src: string,
  options: { quality?: number; format?: string; width?: number; height?: number }
): string {
  const { quality = 80, format = 'webp', width, height } = options
  
  // If using Nuxt Image, construct optimized URL
  const params = new URLSearchParams()
  
  if (quality !== 80) params.set('q', quality.toString())
  if (format !== 'jpg') params.set('f', format)
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  
  const queryString = params.toString()
  const separator = src.includes('?') ? '&' : '?'
  
  return queryString ? `${src}${separator}${queryString}` : src
}

/**
 * Resolve absolute image URL from relative path or any backend URL.
 *
 * Handles three cases:
 * 1. Relative upload path (/uploads/...) → prepend backend base URL
 * 2. Absolute URL pointing to any host (/uploads/ in pathname) → extract
 *    pathname and prepend correct backend base URL (fixes stale localhost URLs)
 * 3. Everything else (data:, /icons/, etc.) → return as-is
 */
export function resolveImageUrl(src: string): string {
  if (!src) return ''

  // Data URLs and non-upload local assets — return as-is
  if (src.startsWith('data:')) return src

  const config = useRuntimeConfig()
  const apiBaseUrl = (config.public.apiBaseUrl as string || '').replace(/\/$/, '')

  // Absolute URL — check if it's an upload path on any host
  if (src.startsWith('http')) {
    try {
      const parsed = new URL(src)
      if (parsed.pathname.startsWith('/uploads/')) {
        // Re-attach to the correct backend origin
        return `${apiBaseUrl}${parsed.pathname}`
      }
    } catch {
      // malformed URL — fall through
    }
    return src
  }

  // Relative upload path
  if (src.startsWith('/uploads/')) {
    return `${apiBaseUrl}${src}`
  }

  // Other relative paths (local assets)
  return src
}

/**
 * Generate blur placeholder for image
 */
function generateBlurPlaceholder(src: string): string {
  // Generate a low-quality, small version for blur effect
  const placeholderUrl = optimizeImageUrl(src, {
    quality: 10,
    width: 40,
    height: 40,
    format: 'jpg'
  })
  
  return placeholderUrl
}

/**
 * Lazy loading with Intersection Observer
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null
  private images = new Set<HTMLImageElement>()
  
  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
        rootMargin: '50px 0px',
        threshold: 0.01,
        ...options
      })
    }
  }
  
  /**
   * Observe image for lazy loading
   */
  observe(img: HTMLImageElement): void {
    if (this.observer) {
      this.images.add(img)
      this.observer.observe(img)
    } else {
      // Fallback: load immediately if no Intersection Observer
      this.loadImage(img)
    }
  }
  
  /**
   * Unobserve image
   */
  unobserve(img: HTMLImageElement): void {
    if (this.observer) {
      this.observer.unobserve(img)
      this.images.delete(img)
    }
  }
  
  /**
   * Handle intersection changes
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        this.loadImage(img)
        this.unobserve(img)
      }
    })
  }
  
  /**
   * Load image with optimizations
   */
  private loadImage(img: HTMLImageElement): void {
    const dataSrc = img.dataset.src
    const dataSrcSet = img.dataset.srcset
    
    if (dataSrc) {
      img.src = dataSrc
      img.removeAttribute('data-src')
    }
    
    if (dataSrcSet) {
      img.srcset = dataSrcSet
      img.removeAttribute('data-srcset')
    }
    
    img.classList.remove('lazy-loading')
    img.classList.add('lazy-loaded')
  }
  
  /**
   * Disconnect observer
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.images.clear()
    }
  }
}

/**
 * WebP format detection and fallback
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * AVIF format detection
 */
export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image()
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2)
    }
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}

/**
 * Get best supported image format
 */
export async function getBestImageFormat(): Promise<'avif' | 'webp' | 'jpg'> {
  if (await supportsAVIF()) {
    return 'avif'
  }
  if (await supportsWebP()) {
    return 'webp'
  }
  return 'jpg'
}

/**
 * Preload critical images
 */
export function preloadCriticalImages(images: string[]): void {
  images.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  })
}

/**
 * Image performance monitoring
 */
export class ImagePerformanceMonitor {
  private loadTimes = new Map<string, number>()
  private errors = new Map<string, string>()
  
  /**
   * Start monitoring image load
   */
  startLoad(src: string): void {
    this.loadTimes.set(src, performance.now())
  }
  
  /**
   * End monitoring image load
   */
  endLoad(src: string): void {
    const startTime = this.loadTimes.get(src)
    if (startTime) {
      const loadTime = performance.now() - startTime
      console.log(`Image loaded: ${src} (${loadTime.toFixed(2)}ms)`)
      this.loadTimes.delete(src)
    }
  }
  
  /**
   * Record image error
   */
  recordError(src: string, error: string): void {
    this.errors.set(src, error)
    console.error(`Image failed to load: ${src} - ${error}`)
  }
  
  /**
   * Get performance stats
   */
  getStats() {
    return {
      pendingLoads: this.loadTimes.size,
      errors: Array.from(this.errors.entries())
    }
  }
}

/**
 * Image optimization presets for different use cases
 */
export const imagePresets = {
  // Menu item thumbnails
  menuThumb: {
    width: 150,
    height: 150,
    quality: 75,
    format: 'webp' as const,
    lazy: true,
    placeholder: 'blur' as const
  },
  
  // Menu item cards
  menuCard: {
    width: 300,
    height: 300,
    quality: 85,
    format: 'webp' as const,
    lazy: true,
    placeholder: 'blur' as const
  },
  
  // Large menu item images
  menuLarge: {
    width: 600,
    height: 600,
    quality: 90,
    format: 'webp' as const,
    lazy: false,
    placeholder: 'blur' as const
  },
  
  // Category images
  category: {
    width: 200,
    height: 200,
    quality: 80,
    format: 'webp' as const,
    lazy: true,
    placeholder: 'blur' as const
  },
  
  // Hero images (critical)
  hero: {
    width: 1200,
    height: 600,
    quality: 85,
    format: 'webp' as const,
    lazy: false,
    priority: true,
    placeholder: 'blur' as const
  },
  
  // Avatar images
  avatar: {
    width: 100,
    height: 100,
    quality: 80,
    format: 'webp' as const,
    lazy: true,
    placeholder: 'blur' as const
  }
}

/**
 * Get image preset configuration
 */
export function getImagePreset(presetName: keyof typeof imagePresets): ImageOptimizationOptions {
  return imagePresets[presetName] || imagePresets.menuCard
}

// Export singleton instances
export const lazyImageLoader = new LazyImageLoader()
export const imagePerformanceMonitor = new ImagePerformanceMonitor()
