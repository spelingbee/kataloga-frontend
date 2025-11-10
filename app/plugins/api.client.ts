/**
 * API Client Plugin
 * 
 * Initializes the API client and integrates it with stores.
 * Connects tenant store for automatic tenant header management.
 * Must be initialized before tenant-resolver plugin.
 * 
 * Requirements: 1.5, 4.1, 4.5
 */
export default defineNuxtPlugin({
  name: 'api-client' as any,
  enforce: 'pre' as any, // Ensure this runs before tenant-resolver
  async setup() {
    const config = useRuntimeConfig()
    const { createApiClient } = await import('~/utils/api')
    
    // Create API client with configuration
    const apiClient = createApiClient({
      baseURL: config.public.apiBaseUrl,
      tenantSlug: config.public.tenantSlug,
      timeout: 10000,
      retries: 2, // Reduced from 3 to 2 for faster failure
      retryDelay: 1000,
    })

    // Initialize stores and connect them to API client
    const { useAuthStore } = await import('~/stores/auth')
    const { useErrorStore } = await import('~/stores/error')
    
    const authStore = useAuthStore()
    const errorStore = useErrorStore()
    
    apiClient.setTokenStore(authStore)
    apiClient.setErrorStore(errorStore)

    // Note: Tenant store will be connected after tenant-resolver plugin initializes
    // This is done to avoid circular dependency issues

    // Set up reactive tenant synchronization
    // Requirements: 4.1, 4.5
    if (import.meta.client) {
      // Defer tenant store connection until after tenant-resolver plugin
      const nuxtApp = useNuxtApp()
      
      nuxtApp.hook('app:mounted', async () => {
        const { useTenantStore } = await import('~/stores/tenant')
        const tenantStore = useTenantStore()
        
        // Connect tenant store to API client
        apiClient.setTenantStore(tenantStore)
        
        // Watch for tenant changes and update API client
        watch(
          () => tenantStore.tenantSlug,
          (newTenantSlug) => {
            if (newTenantSlug) {
              apiClient.setTenant(newTenantSlug)
              console.log('API Client tenant updated from store:', newTenantSlug)
            } else {
              apiClient.clearTenant()
              console.log('API Client tenant cleared')
            }
          },
          { immediate: true }
        )
      })

      // Initialize authentication on client side
      await authStore.initializeAuth()
    }

    return {
      provide: {
        apiClient,
      },
    }
  }
})