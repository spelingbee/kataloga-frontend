export default defineNuxtPlugin(async (nuxtApp) => {
  console.log('[LoadingInterceptor] Initializing...')
  const { useLoadingStore } = await import('~/stores/loading')
  const loadingStore = useLoadingStore()

  // Intercept $fetch calls to show loading states
  const originalFetch = $fetch
  
  // Override $fetch to add loading states
  nuxtApp.provide('fetch', async (url: string, options: any = {}) => {
    // Skip loading for certain requests
    const skipLoading = options.skipLoading || 
                       url.includes('/health') || 
                       url.includes('/ping') ||
                       options.method === 'HEAD'

    if (skipLoading) {
      return originalFetch(url, options)
    }

    const taskName = `${options.method || 'GET'} ${url}`
    const taskId = loadingStore.startTask(taskName, `Loading ${url}...`)

    try {
      const result = await originalFetch(url, options)
      return result
    } catch (error) {
      throw error
    } finally {
      loadingStore.finishTask(taskId)
    }
  })

  // Intercept navigation to show loading states
  nuxtApp.hook('page:start', () => {
    loadingStore.setGlobalLoading(true, 'Loading page...')
  })

  nuxtApp.hook('page:finish', () => {
    loadingStore.setGlobalLoading(false)
  })

  // Handle app loading states
  nuxtApp.hook('app:mounted', () => {
    // App is fully loaded
    loadingStore.clearAllTasks()
    loadingStore.setGlobalLoading(false)
  })

  // Provide loading utilities
  nuxtApp.provide('loading', {
    start: (name: string, message?: string) => loadingStore.startTask(name, message),
    update: (id: string, updates: any) => loadingStore.updateTask(id, updates),
    finish: (id: string) => loadingStore.finishTask(id),
    withLoading: loadingStore.withGlobalLoading,
    withTask: loadingStore.withTask,
  })
})

// Extend the global $fetch type
declare module '#app' {
  interface NuxtApp {
    $loading: {
      start: (name: string, message?: string) => string
      update: (id: string, updates: any) => void
      finish: (id: string) => void
      withLoading: <T>(asyncFn: () => Promise<T>, message?: string) => Promise<T>
      withTask: <T>(
        name: string,
        asyncFn: (updateProgress: (progress: number, message?: string) => void) => Promise<T>,
        initialMessage?: string
      ) => Promise<T>
    }
  }
}
