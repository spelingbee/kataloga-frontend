/**
 * Performance optimization plugin
 * Integrates all performance monitoring and optimization features
 */

import { isDefined, hasElements, isValidNumber } from '~/types/utils/type-guards'
import { webVitalsMonitor } from '~/utils/core-web-vitals'
import { lazyImageLoader, imagePerformanceMonitor, getBestImageFormat } from '~/utils/image-optimization'
import { memoryCache, apiCache, imageCache } from '~/utils/cache-strategies'

export default defineNuxtPlugin({
  name: 'performance-optimization',
  async setup() {
    const performanceOptimization = {
      webVitals: null as any,
      imageLoader: null as any,
      cache: {
        memory: null as any,
        api: null as any,
        image: null as any
      },
      monitor: null as any
    }

    // Only run on client side
    if (import.meta.server) {
      return {
        provide: {
          performanceOptimization
        }
      }
    }

  console.log('🚀 Initializing performance optimizations...')

  // 1. Initialize Core Web Vitals monitoring with null safety
  if (isDefined(webVitalsMonitor)) {
    webVitalsMonitor.onMetricsUpdate((metrics) => {
      // Log metrics for debugging
      console.log('📊 Web Vitals Update:', metrics)
      
      // Check for performance issues
      const recommendations = webVitalsMonitor.getOptimizationRecommendations()
      if (hasElements(recommendations)) {
        console.warn('⚠️ Performance recommendations:', recommendations)
      }
    })
  }

  // 2. Initialize image optimization with null safety
  try {
    const bestFormat = await getBestImageFormat()
    if (isDefined(bestFormat)) {
      console.log(`🖼️ Best image format: ${bestFormat}`)
    }
    
    // Set up image performance monitoring
    const images = document.querySelectorAll('img[data-src]')
    if (hasElements(Array.from(images))) {
      images.forEach(img => {
        const imgElement = img as HTMLImageElement
        const src = img.getAttribute('data-src') ?? imgElement.src
        
        if (isDefined(src) && isDefined(imagePerformanceMonitor)) {
          // Monitor image loading
          imagePerformanceMonitor.startLoad(src)
          
          img.addEventListener('load', () => {
            imagePerformanceMonitor.endLoad(src)
          })
          
          img.addEventListener('error', () => {
            imagePerformanceMonitor.recordError(src, 'Failed to load')
          })
          
          // Set up lazy loading
          if (isDefined(lazyImageLoader)) {
            lazyImageLoader.observe(imgElement)
          }
        }
      })
    }
    
  } catch (error) {
    console.warn('Image optimization setup failed:', error)
  }

  // 3. Initialize caching strategies with null safety
  const cacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    strategy: 'lru' as const
  }
  
  // Configure API cache for common endpoints
  // Note: /menu removed — menu data is fetched via /public/menu/{slug} by menu service
  const commonEndpoints = [
    '/categories',
    '/restaurants'
  ]

  // 4. Preload critical resources with null safety
  const criticalImages = [
    '/images/logo.webp',
    '/images/hero-bg.webp'
  ]
  
  if (isDefined(imageCache)) {
    criticalImages.forEach(src => {
      imageCache.preload(src).catch(error => {
        console.warn(`Failed to preload image: ${src}`, error)
      })
    })
  }

  // 5. Set up performance monitoring intervals
  let performanceCheckInterval: NodeJS.Timeout | null = null

  const startPerformanceMonitoring = () => {
    performanceCheckInterval = setInterval(() => {
      // Check memory usage with null safety
      const performanceMemory = (performance as any).memory
      if (isDefined(performanceMemory)) {
        const usedMB = Math.round(performanceMemory.usedJSHeapSize / 1024 / 1024)
        const totalMB = Math.round(performanceMemory.totalJSHeapSize / 1024 / 1024)
        
        if (isValidNumber(usedMB) && isValidNumber(totalMB)) {
          console.log(`💾 Memory usage: ${usedMB}MB / ${totalMB}MB`)
          
          // Warn if memory usage is high
          if (usedMB > 100) {
            console.warn('⚠️ High memory usage detected')
          }
        }
      }
      
      // Check cache statistics with null safety
      if (isDefined(memoryCache)) {
        const cacheStats = memoryCache.getStats()
        console.log('🗄️ Cache stats:', cacheStats)
      }
      
      // Check image performance with null safety
      if (isDefined(imagePerformanceMonitor)) {
        const imageStats = imagePerformanceMonitor.getStats()
        if (hasElements(imageStats.errors)) {
          console.warn('🖼️ Image loading errors:', imageStats.errors)
        }
      }
      
    }, 30000) // Every 30 seconds
    return performanceCheckInterval
  }

  // 6. Set up critical CSS loading with null safety
  const loadRemainingCSS = () => {
    // Find remaining CSS files
    const remainingCSSLinks = document.querySelectorAll('link[data-remaining-css]')
    
    if (hasElements(Array.from(remainingCSSLinks))) {
      remainingCSSLinks.forEach(link => {
        const href = link.getAttribute('data-remaining-css')
        if (isDefined(href)) {
          // Load remaining CSS after critical content is rendered
          requestIdleCallback(() => {
            const cssLink = document.createElement('link')
            cssLink.rel = 'stylesheet'
            cssLink.href = href
            document.head.appendChild(cssLink)
          })
        }
      })
    }
  }

  // 7. Optimize third-party scripts with null safety
  const optimizeThirdPartyScripts = () => {
    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script[data-defer]')
    
    if (hasElements(Array.from(scripts))) {
      scripts.forEach(script => {
        if (script.hasAttribute('data-defer')) {
          script.setAttribute('defer', '')
          script.removeAttribute('data-defer')
        }
      })
    }
  }

  // 8. Set up resource hints with null safety
  const addResourceHints = () => {
    // Preconnect to external domains
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.example.com'
    ]
    
    preconnectDomains.forEach(domain => {
      if (isDefined(domain)) {
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = domain
        document.head.appendChild(link)
      }
    })
    
    // DNS prefetch for API endpoints
    const dnsPrefetchDomains = [
      'https://cdn.example.com',
      'https://analytics.example.com'
    ]
    
    dnsPrefetchDomains.forEach(domain => {
      if (isDefined(domain)) {
        const link = document.createElement('link')
        link.rel = 'dns-prefetch'
        link.href = domain
        document.head.appendChild(link)
      }
    })
  }

  // 9. Initialize on page load with null safety
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      console.log('📄 Page loaded, starting performance optimizations...')
      
      startPerformanceMonitoring()
      loadRemainingCSS()
      optimizeThirdPartyScripts()
      addResourceHints()
      
      // Report initial metrics after a delay
      setTimeout(() => {
        if (isDefined(webVitalsMonitor)) {
          webVitalsMonitor.reportToAnalytics()
        }
      }, 3000)
    })

    // 10. Cleanup on page unload with null safety
    window.addEventListener('beforeunload', () => {
      if (isDefined(performanceCheckInterval)) {
        clearInterval(performanceCheckInterval)
      }
      
      if (isDefined(lazyImageLoader)) {
        lazyImageLoader.disconnect()
      }
      
      if (isDefined(webVitalsMonitor)) {
        webVitalsMonitor.disconnect()
        // Final metrics report
        webVitalsMonitor.reportToAnalytics()
      }
    })

    // 11. Handle visibility changes (tab switching) with null safety
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden, report metrics
        if (isDefined(webVitalsMonitor)) {
          webVitalsMonitor.reportToAnalytics()
        }
        
        // Pause performance monitoring
        if (isDefined(performanceCheckInterval)) {
          clearInterval(performanceCheckInterval)
          performanceCheckInterval = null
        }
      } else {
        // Page is visible again, resume monitoring
        startPerformanceMonitoring()
      }
    })
  }

    // 12. Provide global performance utilities with null safety
    performanceOptimization.webVitals = webVitalsMonitor ?? null
    performanceOptimization.imageLoader = lazyImageLoader ?? null
    performanceOptimization.cache.memory = memoryCache ?? null
    performanceOptimization.cache.api = apiCache ?? null
    performanceOptimization.cache.image = imageCache ?? null
    performanceOptimization.monitor = imagePerformanceMonitor ?? null

    return {
      provide: {
        performanceOptimization
      }
    }
  }
})

