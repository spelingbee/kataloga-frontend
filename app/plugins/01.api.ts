/**
 * API Client Plugin
 *
 * Initializes the API client and integrates it with Nuxt and Pinia.
 * Provides a universal $apiClient instance.
 */
export default defineNuxtPlugin({
  name: 'api-client',
  async setup(nuxtApp) {
    const config = useRuntimeConfig()
    const { createApiClient } = await import('~/utils/api')

    // Create API client with configuration
    const apiClient = createApiClient({
      baseURL: config.public.apiUrl,
      tenantSlug: config.public.tenantSlug,
      timeout: 10000,
      retries: 2,
      retryDelay: 1000,
    })

    // Inject into Pinia stores to allow access via this.$apiClient
    if (nuxtApp.$pinia) {
      (nuxtApp.$pinia as any).use(({ store }: { store: any }) => {
        store.$apiClient = apiClient
      })
    }

    // Connect tenant store reactively on the client side
    if (import.meta.client) {
      nuxtApp.hook('app:mounted', async () => {
        const { useTenantStore } = await import('~/stores/tenant')
        const { useUserStore } = await import('~/stores/user')
        const { useErrorStore } = await import('~/stores/error')
        
        const tenantStore = useTenantStore()
        const authStore = useUserStore()
        const errorStore = useErrorStore()

        // Configure API client with stores
        apiClient.setTokenStore(authStore)
        apiClient.setErrorStore(errorStore)
        apiClient.setTenantStore(tenantStore)

        // Initialize authentication
        await authStore.initializeAuth()

        // Sync tenant slug
        watch(
          () => tenantStore.tenantSlug,
          (newSlug) => {
            if (newSlug) apiClient.setTenant(newSlug)
            else apiClient.clearTenant()
          },
          { immediate: true }
        )
      })
    }

    return {
      provide: {
        apiClient,
      },
    }
  }
})
