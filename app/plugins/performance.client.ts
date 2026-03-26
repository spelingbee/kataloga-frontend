/**
 * Performance optimization plugin
 * Initializes performance monitoring and optimizations
 */

export default defineNuxtPlugin(() => {
  if (!process.client) return

  // Initialize performance monitoring
  const { metrics, reportMetrics } = usePerformanceMonitoring()

  // Report metrics on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      reportMetrics()
    }, 3000)
  })

  // Preload critical resources
  const preloadCriticalResources = () => {
    // Preload fonts
    const fontLink = document.createElement('link')
    fontLink.rel = 'preload'
    fontLink.as = 'font'
    fontLink.type = 'font/woff2'
    fontLink.crossOrigin = 'anonymous'
    fontLink.href = '/fonts/work-sans-v18-latin-regular.woff2'
    document.head.appendChild(fontLink)

    // Preload critical images
    const criticalImages = [
      '/images/logo.png',
      '/images/placeholder.png',
    ]

    criticalImages.forEach((src) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })
  }

  // Optimize images
  const optimizeImages = () => {
    // Add loading="lazy" to all images that don't have it
    const images = document.querySelectorAll('img:not([loading])')
    images.forEach((img) => {
      img.setAttribute('loading', 'lazy')
    })

    // Add decoding="async" for better performance
    const allImages = document.querySelectorAll('img')
    allImages.forEach((img) => {
      img.setAttribute('decoding', 'async')
    })
  }

  // Optimize third-party scripts
  const optimizeThirdPartyScripts = () => {
    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])')
    scripts.forEach((script) => {
      if (!script.getAttribute('data-critical')) {
        script.setAttribute('defer', '')
      }
    })
  }

  // Enable resource hints
  const enableResourceHints = () => {
    const config = useRuntimeConfig()
    const apiUrl = config.public.apiBaseUrl

    // DNS prefetch for API
    const dnsPrefetch = document.createElement('link')
    dnsPrefetch.rel = 'dns-prefetch'
    dnsPrefetch.href = apiUrl
    document.head.appendChild(dnsPrefetch)

    // Preconnect to API
    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = apiUrl
    document.head.appendChild(preconnect)
  }

  // Reduce layout shifts
  const reduceLayoutShifts = () => {
    // Add aspect ratio to images without dimensions
    const images = document.querySelectorAll('img:not([width]):not([height])')
    images.forEach((img) => {
      const imgElement = img as HTMLImageElement
      imgElement.style.aspectRatio = '16 / 9'
    })
  }

  // Initialize optimizations
  preloadCriticalResources()
  enableResourceHints()

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeImages()
      optimizeThirdPartyScripts()
      reduceLayoutShifts()
    })
  } else {
    optimizeImages()
    optimizeThirdPartyScripts()
    reduceLayoutShifts()
  }

  // Provide performance utilities
  return {
    provide: {
      performance: {
        metrics,
        reportMetrics,
      },
    },
  }
})
