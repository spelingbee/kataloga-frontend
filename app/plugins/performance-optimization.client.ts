/**
 * Performance optimization plugin
 * Integrates all performance monitoring and optimization features
 */

import { webVitalsMonitor } from '~/utils/core-web-vitals'
import { lazyImageLoader, imagePerformanceMonitor, getBestImageFormat } from '~/utils/image-optimization'
import { memoryCache, apiCache, imageCache } from '~/utils/cache-strategies'

export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (import.meta.server) return

  console.log('🚀 Initializing performance optimizations...')

  // 1. Initialize Core Web Vitals monitoring
  webVitalsMonitor.onMetricsUpdate((metrics) => {
    // Log metrics for debugging
    console.log('📊 Web Vitals Update:', metrics)
    
    // Check for performance issues
    const recommendations = webVitalsMonitor.getOptimizationRecommendations()
    if (recommendations.length > 0) {
      console.warn('⚠️ Performance recommendations:', recommendations)
    }
  })

  // 2. Initialize image optimization
  try {
    const bestFormat = await getBestImageFormat()
    console.log(`🖼️ Best image format: ${bestFormat}`)
    
    // Set up image performance monitoring
    const images = document.querySelectorAll('img[data-src]')
    images.forEach(img => {
      const src = img.getAttribute('data-src') || img.src
      
      // Monitor image loading
      imagePerformanceMonitor.startLoad(src)
      
      img.addEventListener('load', () => {
        imagePerformanceMonitor.endLoad(src)
      })
      
      img.addEventListener('error', () => {
        imagePerformanceMonitor.recordError(src, 'Failed to load')
      })
      
      // Set up lazy loading
      lazyImageLoader.observe(img as HTMLImageElement)
    })
    
  } catch (error) {
    console.warn('Image optimization setup failed:', error)
  }

  // 3. Initialize caching strategies
  const cacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    strategy: 'lru' as const
  }
  
  // Configure API cache for common endpoints
  const commonEndpoints = [
    '/api/menu',
    '/api/categories',
    '/api/restaurants'
  ]
  
  commonEndpoints.forEach(endpoint => {
    // Pre-warm cache if needed
    if (endpoint === '/api/menu') {
      apiCache.get(endpoint, () => 
        $fetch(endpoint).catch(() => null)
      )
    }
  })

  // 4. Preload critical resources
  const criticalImages = [
    '/images/logo.webp',
    '/images/hero-bg.webp'
  ]
  
  criticalImages.forEach(src => {
    imageCache.preload(src).catch(error => {
      console.warn(`Failed to preload image: ${src}`, error)
    })
  })

  // 5. Set up performance monitoring intervals
  let performanceCheckInterval: NodeJS.Timeout

  const startPerformanceMonitoring = () => {
    performanceCheckInterval = setInterval(() => {
      // Check memory usage
      if ((performance as any).memory) {
        const memory = (performance as any).memory
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024)
        
        console.log(`💾 Memory usage: ${usedMB}MB / ${totalMB}MB`)
        
        // Warn if memory usage is high
        if (usedMB > 100) {
          console.warn('⚠️ High memory usage detected')
        }
      }
      
      // Check cache statistics
      const cacheStats = memoryCache.getStats()
      console.log('🗄️ Cache stats:', cacheStats)
      
      // Check image performance
      const imageStats = imagePerformanceMonitor.getStats()
      if (imageStats.errors.length > 0) {
        console.warn('🖼️ Image loading errors:', imageStats.errors)
      }
      
    }, 30000) // Every 30 seconds
  }

  // 6. Set up critical CSS loading
  const loadRemainingCSS = () => {
    // Find remaining CSS files
    const remainingCSSLinks = document.querySelectorAll('link[data-remaining-css]')
    
    remainingCSSLinks.forEach(link => {
      const href = link.getAttribute('data-remaining-css')
      if (href) {
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

  // 7. Optimize third-party scripts
  const optimizeThirdPartyScripts = () => {
    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script[data-defer]')
    
    scripts.forEach(script => {
      if (script.hasAttribute('data-defer')) {
        script.setAttribute('defer', '')
        script.removeAttribute('data-defer')
      }
    })
  }

  // 8. Set up resource hints
  const addResourceHints = () => {
    // Preconnect to external domains
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.example.com'
    ]
    
    preconnectDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      document.head.appendChild(link)
    })
    
    // DNS prefetch for API endpoints
    const dnsPrefetchDomains = [
      'https://cdn.example.com',
      'https://analytics.example.com'
    ]
    
    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })
  }

  // 9. Initialize on page load
  window.addEventListener('load', () => {
    console.log('📄 Page loaded, starting performance optimizations...')
    
    startPerformanceMonitoring()
    loadRemainingCSS()
    optimizeThirdPartyScripts()
    addResourceHints()
    
    // Report initial metrics after a delay
    setTimeout(() => {
      webVitalsMonitor.reportToAnalytics()
    }, 3000)
  })

  // 10. Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (performanceCheckInterval) {
      clearInterval(performanceCheckInterval)
    }
    
    lazyImageLoader.disconnect()
    webVitalsMonitor.disconnect()
    
    // Final metrics report
    webVitalsMonitor.reportToAnalytics()
  })

  // 11. Handle visibility changes (tab switching)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Page is hidden, report metrics
      webVitalsMonitor.reportToAnalytics()
      
      // Pause performance monitoring
      if (performanceCheckInterval) {
        clearInterval(performanceCheckInterval)
      }
    } else {
      // Page is visible again, resume monitoring
      startPerformanceMonitoring()
    }
  })

  // 12. Provide global performance utilities
  return {
    provide: {
      performanceOptimization: {
        webVitals: webVitalsMonitor,
        imageLoader: lazyImageLoader,
        cache: {
          memory: memoryCache,
          api: apiCache,
          image: imageCache
        },
        monitor: imagePerformanceMonitor
      }
    }
  }
})

// Extend global types
declare module '#app' {
  interface NuxtApp {
    $performanceOptimization: {
      webVitals: typeof webVitalsMonitor
      imageLoader: typeof lazyImageLoader
      cache: {
        memory: typeof memoryCache
        api: typeof apiCache
        image: typeof imageCache
      }
      monitor: typeof imagePerformanceMonitor
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $performanceOptimization: {
      webVitals: typeof webVitalsMonitor
      imageLoader: typeof lazyImageLoader
      cache: {
        memory: typeof memoryCache
        api: typeof apiCache
        image: typeof imageCache
      }
      monitor: typeof imagePerformanceMonitor
    }
  }
}