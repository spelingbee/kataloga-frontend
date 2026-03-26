/**
 * Type-Safe API Client Plugin
 *
 * Initializes the API client with full TypeScript support and integrates it with stores.
 * Provides type-safe $apiClient injection to all components and composables.
 * Connects tenant store for automatic tenant header management.
 * Must be initialized before tenant-resolver plugin.
 *
 * Requirements: 1.1, 1.2, 1.5, 4.1, 4.5
 */

export default defineNuxtPlugin({
  name: 'api-client',
  async setup(nuxtApp) {
    console.log('🔌 API Client Plugin - Initializing with TypeScript support...')

    const config = useRuntimeConfig()
    console.log('⚙️ API Client Plugin - Config:', {
      apiBaseUrl: config.public.apiBaseUrl,
      tenantSlug: config.public.tenantSlug
    })

    // Import the createApiClient factory function
    const { createApiClient } = await import('~/utils/api')

    // Create type-safe API client with configuration
    const apiClient = createApiClient({
      baseURL: config.public.apiBaseUrl,
      tenantSlug: config.public.tenantSlug,
      timeout: 10000,
      retries: 2, // Reduced from 3 to 2 for faster failure
      retryDelay: 1000,
    })

    console.log('✅ API Client Plugin - Type-safe API Client created')

    // Initialize stores and connect them to API client
    const { useAuthStore } = await import('~/stores/auth')
    const { useErrorStore } = await import('~/stores/error')

    const authStore = useAuthStore()
    const errorStore = useErrorStore()

    // Connect stores to API client for automatic integration
    apiClient.setTokenStore(authStore)
    apiClient.setErrorStore(errorStore)

    // Note: Tenant store will be connected after tenant-resolver plugin initializes
    // This is done to avoid circular dependency issues

    // Set up reactive tenant synchronization
    // Requirements: 4.1, 4.5
    if (import.meta.client) {
      // Defer tenant store connection until after tenant-resolver plugin
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

    console.log('🎯 API Client Plugin - Providing type-safe $apiClient to Nuxt App')

    // Provide the type-safe API client to the Nuxt app context
    // This enables $apiClient usage in components with full TypeScript support
    return {
      provide: {
        apiClient,
      },
    }
  }
})