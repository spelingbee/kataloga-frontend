/**
 * Tenant Resolver Plugin
 * 
 * Initializes the tenant system on application load.
 * Creates and provides the tenant resolver service for tenant resolution and validation.
 * Handles automatic tenant detection from multiple sources with fallback strategies.
 * Depends on api-client plugin being initialized first.
 * 
 * Requirements: 1.1, 3.1, 3.2
 */
export default defineNuxtPlugin({
  name: 'tenant-resolver' as any,
  dependsOn: ['api-client'] as any, // Ensure API client is initialized first
  async setup(nuxtApp) {
  const config = useRuntimeConfig()
  const route = useRoute()
  
  console.log('[TenantResolver] Plugin setup starting...')
  
  // Import tenant resolver service
  const { createTenantResolverService } = await import('~/services/tenant-resolver.service')
  
  // Get API client from previous plugin
  const apiClient = (nuxtApp as any).$apiClient
  
  if (!apiClient) {
    console.error('[TenantResolver] API client not available.')
    throw new Error('API client not initialized')
  }

  // Create tenant resolver service instance
  const tenantResolver = createTenantResolverService(apiClient, config)
  
  // Start periodic cache cleanup (every minute)
  const stopCacheCleanup = tenantResolver.startCacheCleanup(60000)
  
  // Cleanup on app unmount
  if (import.meta.client) {
    window.addEventListener('beforeunload', () => {
      stopCacheCleanup()
    })
  }

  // Initialize tenant store
  const { useTenantStore } = await import('~/stores/tenant')
  const tenantStore = useTenantStore()

  // Setup network recovery listeners
  if (import.meta.client) {
    setupNetworkRecovery(tenantStore)
  }

  // Handle tenant initialization NON-BLOCKING with a timeout.
  // This prevents the entire app from freezing if the backend is slow/unreachable.
  const TENANT_INIT_TIMEOUT = 8000 // 8 seconds max
  
  const tenantInitPromise = (async () => {
    try {
      console.log('[TenantResolver] Initializing tenant system...')
      await tenantStore.initializeTenant()
      
      if (tenantStore.currentTenant) {
        console.log('[TenantResolver] Tenant initialized:', tenantStore.currentTenant.slug)
        clearErrorStates()
      } else if (tenantStore.isMultiTenant) {
        console.log('[TenantResolver] Multi-tenant mode: No tenant selected')
      } else {
        console.warn('[TenantResolver] Single-tenant mode: No tenant configured')
      }
    } catch (error) {
      console.error('[TenantResolver] Failed to initialize tenant:', error)
      await handleTenantInitializationError(error, tenantStore, config)
    }
  })()
  
  // Race with timeout — don't block the entire app
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(() => {
      if (!tenantStore.isInitialized) {
        console.warn(`[TenantResolver] Tenant initialization timed out after ${TENANT_INIT_TIMEOUT}ms. App will continue loading.`)
        tenantStore.isInitialized = true
      }
      resolve()
    }, TENANT_INIT_TIMEOUT)
  })
  
  await Promise.race([tenantInitPromise, timeoutPromise])
  console.log('[TenantResolver] Plugin setup complete, app continuing...')

  // Watch for route changes to handle tenant parameter updates
  if (import.meta.client) {
    watch(
      () => route.query[String(config.public.tenantQueryParam || 'tenant')],
      async (newTenant, oldTenant) => {
        // Skip if tenant hasn't changed
        if (newTenant === oldTenant) {
          return
        }

        // Skip if no tenant in query
        if (!newTenant || typeof newTenant !== 'string') {
          return
        }

        // Skip if already on this tenant
        if (tenantStore.currentTenant?.slug === newTenant) {
          return
        }

        console.log('Tenant parameter changed in URL:', newTenant)
        
        try {
          // Handle tenant change from URL
          await tenantStore.handleTenantFromUrl(newTenant)
        } catch (error) {
          console.error('Error handling tenant from URL:', error)
          await tenantStore.handleTenantError(error as Error)
        }
      },
      { immediate: false }
    )
  }

    // Provide tenant resolver to the app (only once via return)
    return {
      provide: {
        tenantResolver,
      },
    }
  }
})

/**
 * Handle tenant initialization errors with fallback strategies
 * Requirements: 1.4, 3.2
 */
async function handleTenantInitializationError(
  error: any,
  tenantStore: any,
  config: any
): Promise<void> {
  console.error('Tenant initialization error:', error)
  
  // Set error in store
  tenantStore.setError(error instanceof Error ? error.message : 'Failed to initialize tenant')

  // Check if this is a network/offline error first
  const isOffline = isNetworkError(error)
  
  if (isOffline) {
    console.warn('Network error detected. Attempting offline mode...')
    
    // Try offline mode with cached tenant
    const offlineSuccess = await tryOfflineMode(tenantStore, config)
    if (offlineSuccess) {
      return
    }
  }

  // Strategy 1: Try default tenant if available
  const defaultTenant = config.public.defaultTenant
  if (defaultTenant && defaultTenant !== 'default') {
    console.log('Attempting fallback to default tenant:', defaultTenant)
    
    try {
      const success = await tenantStore.setTenant(defaultTenant, {
        validateAccess: !isOffline, // Skip validation if offline
        clearCache: false,
        updateUrl: false,
      })
      
      if (success) {
        console.log('Successfully fell back to default tenant')
        if (isOffline) {
          tenantStore.setError('Running in offline mode with default tenant')
        } else {
          tenantStore.clearError()
        }
        return
      }
    } catch (fallbackError) {
      console.error('Default tenant fallback failed:', fallbackError)
    }
  }

  // Strategy 2: Check if in multi-tenant mode
  const isMultiTenant = Boolean(config.public.multiTenantMode) || !config.public.tenantSlug
  
  if (isMultiTenant && !isOffline) {
    // In multi-tenant mode (and online), redirect to tenant selection page
    console.log('Redirecting to tenant selection page...')
    
    try {
      await navigateTo('/select-restaurant')
      return
    } catch (navError) {
      console.error('Failed to navigate to tenant selection:', navError)
    }
  }

  // Strategy 3: If offline and multi-tenant, try any cached tenant
  if (isOffline && isMultiTenant) {
    const offlineSuccess = await tryOfflineMode(tenantStore, config)
    if (offlineSuccess) {
      return
    }
    
    // Show offline error with instructions
    showOfflineError('Unable to load tenant data. Please check your internet connection.')
    return
  }

  // Strategy 4: Show error page for unrecoverable errors
  console.error('Unrecoverable tenant initialization error')
  showTenantError(error)
}

/**
 * Try to run in offline mode with cached data
 * Requirements: 1.4, 3.2
 */
async function tryOfflineMode(tenantStore: any, config: any): Promise<boolean> {
  console.log('Attempting offline mode with cached data...')
  
  // Try to get stored tenant from localStorage
  const nuxtApp = useNuxtApp()
  const tenantResolver = (nuxtApp as any).$tenantResolver
  
  if (!tenantResolver) {
    console.error('Tenant resolver not available')
    return false
  }
  
  const storedTenant = tenantResolver.getStoredTenant()
  
  if (!storedTenant) {
    console.warn('No cached tenant found in localStorage')
    return false
  }
  
  console.log('Found cached tenant:', storedTenant)
  
  try {
    // Try to load cached tenant info from service cache
    const cachedTenantInfo = tenantResolver.getCachedTenantInfo?.(storedTenant)
    
    if (cachedTenantInfo) {
      // Use cached tenant info directly
      tenantStore.currentTenant = cachedTenantInfo
      tenantStore.isInitialized = true
      tenantStore.setError('Running in offline mode with cached data')
      
      console.log('Successfully loaded cached tenant in offline mode:', storedTenant)
      
      // Dispatch offline mode event
      if (import.meta.client) {
        window.dispatchEvent(new CustomEvent('tenant-offline-mode', {
          detail: { tenantSlug: storedTenant }
        }))
      }
      
      return true
    }
    
    // If no cached info, try to set tenant without validation
    const success = await tenantStore.setTenant(storedTenant, {
      validateAccess: false, // Skip validation in offline mode
      clearCache: false,
      updateUrl: false,
    })
    
    if (success) {
      console.log('Successfully set cached tenant in offline mode')
      tenantStore.setError('Running in offline mode with cached data')
      
      // Dispatch offline mode event
      if (import.meta.client) {
        window.dispatchEvent(new CustomEvent('tenant-offline-mode', {
          detail: { tenantSlug: storedTenant }
        }))
      }
      
      return true
    }
  } catch (offlineError) {
    console.error('Failed to use cached tenant in offline mode:', offlineError)
  }
  
  return false
}

/**
 * Retry tenant initialization with exponential backoff
 * Requirements: 1.4, 3.2
 */
async function retryTenantInitialization(
  tenantStore: any,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Retry attempt ${attempt}/${maxRetries} for tenant initialization`)
    
    try {
      await tenantStore.initializeTenant()
      
      if (tenantStore.currentTenant) {
        console.log('Tenant initialization successful on retry')
        return true
      }
    } catch (error) {
      console.error(`Retry attempt ${attempt} failed:`, error)
      
      // Don't retry on network errors (offline mode should handle this)
      if (isNetworkError(error)) {
        console.log('Network error detected, stopping retries')
        return false
      }
      
      // Wait before next retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`Waiting ${delay}ms before next retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  console.error('All retry attempts failed')
  return false
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message?.toLowerCase() || ''
  const errorName = error.name?.toLowerCase() || ''
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('connection') ||
    errorName === 'networkerror' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND'
  )
}

/**
 * Show offline error to user
 * Requirements: 1.4, 3.2
 */
function showOfflineError(message?: string): void {
  const errorMessage = message || 'Application is offline. Some features may not be available.'
  console.warn(errorMessage)
  
  if (import.meta.client) {
    // Dispatch custom event for offline state
    window.dispatchEvent(new CustomEvent('app-offline', {
      detail: { 
        message: errorMessage,
        timestamp: new Date().toISOString(),
        canRetry: true
      }
    }))
    
    // Store offline state in sessionStorage for UI components
    try {
      sessionStorage.setItem('app-offline', JSON.stringify({
        message: errorMessage,
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.debug('Failed to store offline state:', error)
    }
  }
}

/**
 * Show tenant error to user
 * Requirements: 1.4, 3.2
 */
function showTenantError(error: any): void {
  const errorMessage = error instanceof Error ? error.message : 'Failed to initialize tenant'
  console.error('Tenant error:', errorMessage, error)
  
  if (import.meta.client) {
    // Dispatch custom event for tenant error
    window.dispatchEvent(new CustomEvent('tenant-error', {
      detail: { 
        message: errorMessage,
        error,
        timestamp: new Date().toISOString(),
        errorType: error?.errorType || 'UNKNOWN',
        tenantSlug: error?.tenantSlug
      }
    }))
    
    // Store error state in sessionStorage for UI components
    try {
      sessionStorage.setItem('tenant-error', JSON.stringify({
        message: errorMessage,
        timestamp: new Date().toISOString(),
        errorType: error?.errorType || 'UNKNOWN'
      }))
    } catch (storageError) {
      console.debug('Failed to store error state:', storageError)
    }
  }
}

/**
 * Clear error states
 */
function clearErrorStates(): void {
  if (import.meta.client) {
    try {
      sessionStorage.removeItem('app-offline')
      sessionStorage.removeItem('tenant-error')
    } catch (error) {
      console.debug('Failed to clear error states:', error)
    }
  }
}

/**
 * Setup online/offline event listeners for automatic recovery
 * Requirements: 1.4, 3.2
 */
function setupNetworkRecovery(tenantStore: any): void {
  if (!import.meta.client) return
  
  // Listen for online event to retry tenant initialization
  window.addEventListener('online', async () => {
    console.log('Network connection restored, attempting to recover tenant...')
    
    // Clear offline error state
    clearErrorStates()
    
    // Dispatch recovery event
    window.dispatchEvent(new CustomEvent('app-online', {
      detail: { timestamp: new Date().toISOString() }
    }))
    
    // If no tenant is loaded or in error state, try to reinitialize
    if (!tenantStore.currentTenant || tenantStore.hasError) {
      try {
        await tenantStore.initializeTenant()
        
        if (tenantStore.currentTenant) {
          console.log('Tenant recovered successfully after network restoration')
          tenantStore.clearError()
          
          // Dispatch recovery success event
          window.dispatchEvent(new CustomEvent('tenant-recovered', {
            detail: { 
              tenantSlug: tenantStore.currentTenant.slug,
              timestamp: new Date().toISOString()
            }
          }))
        }
      } catch (error) {
        console.error('Failed to recover tenant after network restoration:', error)
      }
    }
  })
  
  // Listen for offline event
  window.addEventListener('offline', () => {
    console.warn('Network connection lost')
    
    // Dispatch offline event
    window.dispatchEvent(new CustomEvent('app-offline', {
      detail: { 
        message: 'Network connection lost',
        timestamp: new Date().toISOString(),
        canRetry: false
      }
    }))
    
    // Update tenant store error if no tenant is loaded
    if (!tenantStore.currentTenant) {
      tenantStore.setError('Network connection lost. Running in offline mode.')
    }
  })
}
