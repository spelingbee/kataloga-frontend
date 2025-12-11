/**
 * Code splitting utilities for lazy loading components and routes
 * Improves initial load time by splitting code into smaller chunks
 */

import { defineAsyncComponent, type Component } from 'vue'

/**
 * Lazy load component with loading and error states
 * Note: useLazyComponent is also available in useLazyLoading.ts
 * This version is specific to code splitting scenarios
 */
export function useLazyComponentWithSplitting(
  loader: () => Promise<Component>,
  options: {
    loadingComponent?: Component
    errorComponent?: Component
    delay?: number
    timeout?: number
  } = {}
) {
  const {
    loadingComponent,
    errorComponent,
    delay = 200,
    timeout = 10000,
  } = options

  return defineAsyncComponent({
    loader,
    loadingComponent,
    errorComponent,
    delay,
    timeout,
  })
}

/**
 * Preload component for better UX
 */
export function useComponentPreload() {
  const preloadedComponents = new Set<string>()

  const preloadComponent = async (
    name: string,
    loader: () => Promise<Component>
  ) => {
    if (preloadedComponents.has(name)) {
      return
    }

    try {
      await loader()
      preloadedComponents.add(name)
    } catch (error) {
      console.error(`Failed to preload component: ${name}`, error)
    }
  }

  const isPreloaded = (name: string) => preloadedComponents.has(name)

  return {
    preloadComponent,
    isPreloaded,
  }
}

/**
 * Route-based code splitting helper
 */
export function useRoutePreload() {
  const router = useRouter()

  const preloadRoute = async (routeName: string) => {
    const route = router.resolve({ name: routeName })
    if (route.matched.length > 0) {
      // Preload route components
      const components = route.matched.map((record) => record.components?.default)
      await Promise.all(
        components.filter(Boolean).map((component) => {
          if (typeof component === 'function') {
            return component()
          }
          return Promise.resolve()
        })
      )
    }
  }

  const preloadOnHover = (routeName: string) => {
    return {
      onMouseenter: () => preloadRoute(routeName),
      onFocus: () => preloadRoute(routeName),
    }
  }

  return {
    preloadRoute,
    preloadOnHover,
  }
}

/**
 * Dynamic import with retry logic
 */
export function useDynamicImport<T = any>(
  importFn: () => Promise<T>,
  options: {
    maxRetries?: number
    retryDelay?: number
  } = {}
) {
  const { maxRetries = 3, retryDelay = 1000 } = options

  const importWithRetry = async (retryCount = 0): Promise<T> => {
    try {
      return await importFn()
    } catch (error) {
      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        return importWithRetry(retryCount + 1)
      }
      throw error
    }
  }

  return importWithRetry
}

/**
 * Chunk loading optimization
 */
export function useChunkOptimization() {
  const loadedChunks = new Set<string>()
  const failedChunks = new Set<string>()

  const trackChunkLoad = (chunkName: string, success: boolean) => {
    if (success) {
      loadedChunks.add(chunkName)
    } else {
      failedChunks.add(chunkName)
    }
  }

  const isChunkLoaded = (chunkName: string) => loadedChunks.has(chunkName)
  const isChunkFailed = (chunkName: string) => failedChunks.has(chunkName)

  return {
    trackChunkLoad,
    isChunkLoaded,
    isChunkFailed,
    loadedChunks,
    failedChunks,
  }
}
