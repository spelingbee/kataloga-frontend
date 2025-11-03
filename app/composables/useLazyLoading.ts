import { ref, onMounted, nextTick } from 'vue'

export interface LazyLoadOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useLazyLoading(options: LazyLoadOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    once = true,
  } = options

  const isVisible = ref(false)
  const target = ref<HTMLElement>()

  let observer: IntersectionObserver | null = null

  const observe = () => {
    if (!target.value || !window.IntersectionObserver) {
      isVisible.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            if (once && observer) {
              observer.disconnect()
            }
          } else if (!once) {
            isVisible.value = false
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(target.value)
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onMounted(() => {
    nextTick(() => {
      observe()
    })
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isVisible: readonly(isVisible),
    target,
    observe,
    disconnect,
  }
}

// Lazy load components
export function useLazyComponent<T = any>(
  loader: () => Promise<T>,
  options: { delay?: number; timeout?: number } = {}
) {
  const { delay = 0, timeout = 10000 } = options
  
  const component = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const load = async () => {
    if (component.value || loading.value) return

    loading.value = true
    error.value = null

    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Component load timeout')), timeout)
      })

      const loadPromise = loader()
      component.value = await Promise.race([loadPromise, timeoutPromise])
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to load component')
    } finally {
      loading.value = false
    }
  }

  return {
    component: readonly(component),
    loading: readonly(loading),
    error: readonly(error),
    load,
  }
}

// Preload resources
export function usePreloader() {
  const preloadedResources = new Set<string>()

  const preloadImage = (src: string): Promise<void> => {
    if (preloadedResources.has(src)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        preloadedResources.add(src)
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }

  const preloadImages = async (sources: string[]): Promise<void> => {
    const promises = sources.map(src => preloadImage(src))
    await Promise.allSettled(promises)
  }

  const preloadRoute = async (route: string): Promise<void> => {
    if (import.meta.client) {
      try {
        await navigateTo(route, { replace: false, external: false })
      } catch (error) {
        console.warn('Failed to preload route:', route, error)
      }
    }
  }

  return {
    preloadImage,
    preloadImages,
    preloadRoute,
    preloadedResources: readonly(preloadedResources),
  }
}

// Bundle size analyzer
export function useBundleAnalyzer() {
  const analyzeBundle = () => {
    if (import.meta.client && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && !resource.name.includes('hot-update')
      )

      const cssResources = resources.filter(resource => 
        resource.name.includes('.css')
      )

      const totalJSSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0)
      }, 0)

      const totalCSSSize = cssResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0)
      }, 0)

      return {
        navigation,
        resources: {
          js: jsResources,
          css: cssResources,
        },
        sizes: {
          js: totalJSSize,
          css: totalCSSSize,
          total: totalJSSize + totalCSSSize,
        },
        metrics: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        }
      }
    }

    return null
  }

  return {
    analyzeBundle,
  }
}