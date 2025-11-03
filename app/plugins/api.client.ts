export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const { createApiClient } = await import('~/utils/api')
  
  // Create API client with configuration
  const apiClient = createApiClient({
    baseURL: config.public.apiBaseUrl,
    tenantSlug: config.public.tenantSlug,
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
  })

  // Initialize auth store and connect it to API client
  const { useAuthStore } = await import('~/stores/auth')
  const { useErrorStore } = await import('~/stores/error')
  const authStore = useAuthStore()
  const errorStore = useErrorStore()
  
  apiClient.setTokenStore(authStore)
  apiClient.setErrorStore(errorStore)

  // Initialize authentication on client side
  if (import.meta.client) {
    await authStore.initializeAuth()
  }

  return {
    provide: {
      apiClient,
    },
  }
})