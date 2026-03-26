import { defineStore } from 'pinia'
import { useApiClient } from '~/utils/api'
import type {
  TenantInfo,
  TenantBranding,
  TenantSettings,
  TenantStoreState,
  TenantSwitchOptions,
  TenantResolverOptions
} from '~/types/tenant'
import { useTenantMonitoring, TenantEventType } from '~/utils/tenant-monitoring'

/**
 * Tenant Store
 * 
 * Manages tenant state and provides reactive access to tenant information.
 * Integrates with Tenant Resolver Service for tenant resolution and validation.
 * 
 * Requirements: 1.1, 2.1, 3.4, 4.1, 5.1
 */
export const useTenantStore = defineStore('tenant', {
  state: (): TenantStoreState => ({
    currentTenant: null,
    availableTenants: [],
    isLoading: false,
    error: null,
    isInitialized: false,
  }),

  getters: {
    /**
     * Get current tenant slug
     * Requirements: 1.1, 3.4
     */
    tenantSlug: (state): string => {
      return state.currentTenant?.slug || ''
    },

    /**
     * Get current tenant ID
     * Requirements: 1.1, 4.1
     */
    tenantId: (state): string => {
      return state.currentTenant?.id || ''
    },

    /**
     * Check if app is in multi-tenant mode
     * Requirements: 2.1, 5.1
     */
    isMultiTenant(): boolean {
      const config = useRuntimeConfig()
      const tenantSlug = config.public.tenantSlug
      return Boolean(config.public.multiTenantMode) || (tenantSlug == null || tenantSlug === '')
    },

    /**
     * Get tenant branding information
     * Requirements: 2.4, 4.3
     */
    tenantBranding: (state): TenantBranding => {
      if (state.currentTenant?.branding) {
        return state.currentTenant.branding
      }

      // Return default branding
      return getDefaultBranding()
    },

    /**
     * Get tenant settings
     * Requirements: 2.4, 4.3
     */
    tenantSettings: (state): TenantSettings => {
      if (state.currentTenant?.settings) {
        return state.currentTenant.settings
      }

      // Return default settings
      return getDefaultSettings()
    },

    /**
     * Check if tenant is active
     * Requirements: 1.4, 3.2
     */
    isTenantActive: (state): boolean => {
      return state.currentTenant?.isActive ?? false
    },

    /**
     * Check if tenant switching is allowed
     * Requirements: 3.4, 5.1
     */
    canSwitchTenant(): boolean {
      const config = useRuntimeConfig()
      return Boolean(config.public.allowTenantSwitching) &&
        (Boolean(config.public.multiTenantMode) || !config.public.tenantSlug)
    },

    /**
     * Get tenant name for display
     * Requirements: 2.4, 5.4
     */
    tenantName: (state): string => {
      return state.currentTenant?.name || 'Restaurant'
    },

    /**
     * Get tenant domain if available
     * Requirements: 2.1
     */
    tenantDomain: (state): string | undefined => {
      return state.currentTenant?.domain
    },

    /**
     * Check if store has error
     */
    hasError: (state): boolean => {
      return state.error !== null
    },

    /**
     * Check if tenant is loaded
     */
    isTenantLoaded: (state): boolean => {
      return state.currentTenant !== null && !state.isLoading
    },
  },

  actions: {
    /**
     * Initialize tenant system
     * Requirements: 1.1, 2.1, 3.1, 3.2
     */
    async initializeTenant(resolverParam?: any): Promise<void> {
      // Prevent multiple initializations
      if (this.isInitialized) {
        return
      }

      const startTime = performance.now()
      this.isLoading = true
      this.error = null
      const monitoring = useTenantMonitoring()

      try {
        const nuxtApp = useNuxtApp()
        const tenantResolver = resolverParam || nuxtApp.$tenantResolver

        if (!tenantResolver) {
          throw new Error('Tenant resolver service not available')
        }

        // Get tenant from various sources
        const route = useRoute()
        const rawTenant = route.query.tenant
        const queryTenant = Array.isArray(rawTenant) ? (rawTenant[0] as string | undefined) : (rawTenant as string | undefined)

        const options: TenantResolverOptions = {
          fromQuery: queryTenant,
          fromLocalStorage: tenantResolver.getStoredTenant() ?? undefined,
        }

        // Resolve tenant with fallback
        const result = await tenantResolver.resolveTenantWithFallback(options)

        if (result.tenant) {
          this.currentTenant = result.tenant
          this.isInitialized = true

          const duration = performance.now() - startTime

          // Log initialization event
          monitoring.logEvent({
            type: TenantEventType.INITIALIZED,
            tenantSlug: result.tenant.slug,
            tenantId: result.tenant.id,
            source: result.source,
            duration
          })

          monitoring.logMetric({
            operation: 'tenant.initialize',
            duration,
            tenantSlug: result.tenant.slug,
            success: true,
            metadata: { source: result.source }
          })

          console.log(`Tenant initialized from ${result.source}:`, result.tenant.slug)
        } else if (result.requiresSelection) {
          // No tenant found from API, user needs to select
          this.isInitialized = true

          // In multi-tenant mode, redirect to selection page
          if (this.isMultiTenant) {
            console.log('No tenant found, redirecting to selection page')
            await navigateTo('/select-restaurant')
          } else {
            // Single-tenant mode: use configured slug as fallback when API is unavailable
            const config = useRuntimeConfig()
            const configuredSlug = config.public.tenantSlug
            if (configuredSlug) {
              console.log('Single-tenant fallback: using configured slug:', configuredSlug)
              this.currentTenant = {
                id: configuredSlug,
                slug: configuredSlug,
                name: String(config.public.appName || configuredSlug),
                isActive: true,
              } as TenantInfo
            } else {
              throw new Error('No tenant configured for single-tenant mode')
            }
          }
        }
      } catch (err) {
        const duration = performance.now() - startTime
        this.error = err instanceof Error ? err.message : 'Failed to initialize tenant'

        // Log error
        monitoring.logError({
          errorType: 'INITIALIZATION_ERROR',
          message: this.error,
          stack: err instanceof Error ? err.stack : undefined
        })

        monitoring.logMetric({
          operation: 'tenant.initialize',
          duration,
          success: false,
          metadata: { error: this.error }
        })

        console.error('Tenant initialization error:', err)

        // Mark as initialized even on error to prevent infinite loops
        this.isInitialized = true
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Set tenant by slug
     * Requirements: 1.1, 3.4, 4.1
     */
    async setTenant(slug: string, options: TenantSwitchOptions = {}): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        const nuxtApp = useNuxtApp()
        const tenantResolver = nuxtApp.$tenantResolver

        if (!tenantResolver) {
          throw new Error('Tenant resolver service not available')
        }

        // Validate tenant if required
        if (options.validateAccess !== false) {
          const validationResult = await tenantResolver.validateTenant(slug)

          if (!validationResult.isValid) {
            throw new Error(validationResult.error || `Invalid tenant: ${slug}`)
          }
        }

        // Fetch tenant info
        const tenantInfo = await tenantResolver.getTenantInfo(slug)

        // Clear tenant-specific data before switching
        if (options.clearCache !== false && this.currentTenant?.slug !== slug) {
          await this.clearTenantData()
        }

        // Update current tenant
        this.currentTenant = tenantInfo

        // Save to localStorage for future visits
        tenantResolver.saveStoredTenant(slug)

        // Update URL if needed
        if (options.updateUrl !== false) {
          const config = useRuntimeConfig()
          if (config.public.preserveTenantInUrl) {
            const route = useRoute()
            const router = useRouter()
            const tenantParam = String(config.public.tenantQueryParam || 'tenant')

            await router.push({
              ...route,
              query: {
                ...route.query,
                [tenantParam]: slug
              }
            })
          }
        }

        console.log('Tenant set successfully:', slug)
        return true
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to set tenant'
        console.error('Set tenant error:', err)
        return false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch tenant information
     * Requirements: 1.1, 3.3
     */
    async fetchTenantInfo(slug: string): Promise<TenantInfo> {
      const nuxtApp = useNuxtApp()
      const tenantResolver = nuxtApp.$tenantResolver

      if (!tenantResolver) {
        throw new Error('Tenant resolver service not available')
      }

      return await tenantResolver.getTenantInfo(slug)
    },

    /**
     * Validate tenant slug
     * Requirements: 1.1, 3.2
     */
    async validateTenant(slug: string): Promise<boolean> {
      const nuxtApp = useNuxtApp()
      const tenantResolver = nuxtApp.$tenantResolver

      if (!tenantResolver) {
        throw new Error('Tenant resolver service not available')
      }

      const result = await tenantResolver.validateTenant(slug)
      return result.isValid
    },

    /**
     * Clear current tenant
     * Requirements: 3.4, 4.2
     */
    clearTenant(): void {
      this.currentTenant = null
      this.error = null

      // Clear from localStorage
      if (import.meta.client) {
        const nuxtApp = useNuxtApp()
        const tenantResolver = nuxtApp.$tenantResolver

        if (tenantResolver) {
          tenantResolver.clearStoredTenant()
        }
      }
    },

    /**
     * Refresh current tenant information
     * Requirements: 3.3, 3.4
     */
    async refreshTenant(): Promise<void> {
      if (!this.currentTenant) {
        return
      }

      this.isLoading = true
      this.error = null

      try {
        const nuxtApp = useNuxtApp()
        const tenantResolver = nuxtApp.$tenantResolver

        if (!tenantResolver) {
          throw new Error('Tenant resolver service not available')
        }

        // Clear cache for current tenant
        tenantResolver.clearTenantCache(this.currentTenant.slug)

        // Fetch fresh tenant info
        const tenantInfo = await tenantResolver.getTenantInfo(this.currentTenant.slug)
        this.currentTenant = tenantInfo

        console.log('Tenant refreshed:', tenantInfo.slug)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to refresh tenant'
        console.error('Refresh tenant error:', err)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Switch to a different tenant
     * Requirements: 3.4, 3.5, 5.1, 5.3
     */
    async switchTenant(slug: string, options: TenantSwitchOptions = {}): Promise<boolean> {
      // Check if switching is allowed
      if (!this.canSwitchTenant) {
        console.warn('Tenant switching is not allowed in current configuration')
        return false
      }

      // Check if already on this tenant
      if (this.currentTenant?.slug === slug) {
        console.log('Already on tenant:', slug)
        return true
      }

      const startTime = performance.now()
      this.isLoading = true
      this.error = null
      const monitoring = useTenantMonitoring()

      try {
        const nuxtApp = useNuxtApp()
        const tenantResolver = nuxtApp.$tenantResolver

        if (!tenantResolver) {
          throw new Error('Tenant resolver service not available')
        }

        // Store previous tenant for rollback if needed
        const previousTenant = this.currentTenant

        // Validate new tenant
        const validationResult = await tenantResolver.validateTenant(slug)

        if (!validationResult.isValid) {
          throw new Error(validationResult.error || `Invalid tenant: ${slug}`)
        }

        // Fetch new tenant info
        const newTenant = await tenantResolver.getTenantInfo(slug)

        // Clear tenant-specific data before switching
        await this.clearTenantData()

        // Update current tenant
        this.currentTenant = newTenant

        // Save to localStorage
        tenantResolver.saveStoredTenant(slug)

        // Update URL if needed
        const config = useRuntimeConfig()
        if (options.updateUrl !== false && config.public.preserveTenantInUrl) {
          const route = useRoute()
          const router = useRouter()
          const tenantParam = String(config.public.tenantQueryParam || 'tenant')

          await router.push({
            path: route.path,
            query: {
              ...route.query,
              [tenantParam]: slug
            }
          })
        }

        const duration = performance.now() - startTime

        // Log tenant switch event
        monitoring.logEvent({
          type: TenantEventType.SWITCHED,
          tenantSlug: slug,
          tenantId: newTenant.id,
          duration,
          metadata: {
            fromTenant: previousTenant?.slug,
            toTenant: slug
          }
        })

        monitoring.logMetric({
          operation: 'tenant.switch',
          duration,
          tenantSlug: slug,
          success: true,
          metadata: {
            fromTenant: previousTenant?.slug
          }
        })

        console.log('Switched to tenant:', slug)

        // Emit tenant change event
        if (import.meta.client) {
          window.dispatchEvent(new CustomEvent('tenant-changed', {
            detail: {
              previousTenant: previousTenant?.slug,
              currentTenant: slug
            }
          }))
        }

        return true
      } catch (err) {
        const duration = performance.now() - startTime
        this.error = err instanceof Error ? err.message : 'Failed to switch tenant'

        // Log error
        monitoring.logError({
          errorType: 'SWITCH_ERROR',
          message: this.error,
          tenantSlug: slug,
          stack: err instanceof Error ? err.stack : undefined
        })

        monitoring.logMetric({
          operation: 'tenant.switch',
          duration,
          tenantSlug: slug,
          success: false,
          metadata: { error: this.error }
        })

        console.error('Switch tenant error:', err)
        return false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Handle tenant change from URL
     * Requirements: 1.1, 3.3, 3.5
     */
    async handleTenantFromUrl(tenantSlug: string): Promise<void> {
      // Skip if already on this tenant
      if (this.currentTenant?.slug === tenantSlug) {
        return
      }

      // Switch to the tenant from URL
      await this.switchTenant(tenantSlug, { updateUrl: false })
    },

    /**
     * Clear tenant-specific data from other stores
     * Requirements: 4.1, 4.2, 4.4
     */
    async clearTenantData(): Promise<void> {
      console.log('Clearing tenant-specific data from all stores...')

      try {
        // Import stores dynamically to avoid circular dependencies
        const { useCartStore } = await import('./cart')
        const { useMenuStore } = await import('./menu')
        const { useOrderStore } = await import('./order')

        // Clear cart store
        const cartStore = useCartStore()
        cartStore.clearCart()
        console.log('Cart cleared')

        // Clear menu store
        const menuStore = useMenuStore()
        menuStore.categories = []
        menuStore.menuItems = []
        // Clear favorites through the favorites store
        try {
          const { useFavoritesStore } = await import('./favorites')
          const favoritesStore = useFavoritesStore()
          favoritesStore.clearAllFavorites()
        } catch (error) {
          console.error('Failed to clear favorites:', error)
        }
        menuStore.currentCategory = null
        menuStore.searchQuery = ''
        menuStore.filters = {}
        menuStore.selectedDish = null
        console.log('Menu cleared')

        // Clear order store
        const orderStore = useOrderStore()
        orderStore.currentOrder = null
        orderStore.orderHistory = []
        console.log('Orders cleared')

        // Clear notification store if it exists
        try {
          const { useNotificationStore } = await import('./notification')
          const notificationStore = useNotificationStore()
          if (notificationStore && typeof notificationStore.$reset === 'function') {
            notificationStore.$reset()
            console.log('Notifications cleared')
          }
        } catch (error) {
          // Notification store might not exist, ignore
          console.debug('Notification store not available')
        }

        // Clear delivery store if it exists
        try {
          const { useDeliveryStore } = await import('./delivery')
          const deliveryStore = useDeliveryStore()
          if (deliveryStore && typeof deliveryStore.$reset === 'function') {
            deliveryStore.$reset()
            console.log('Delivery data cleared')
          }
        } catch (error) {
          // Delivery store might not exist, ignore
          console.debug('Delivery store not available')
        }

        // Clear location store if it exists
        try {
          const { useLocationStore } = await import('./location')
          const locationStore = useLocationStore()
          if (locationStore && typeof locationStore.$reset === 'function') {
            locationStore.$reset()
            console.log('Location data cleared')
          }
        } catch (error) {
          // Location store might not exist, ignore
          console.debug('Location store not available')
        }

        // Clear tenant-specific localStorage items
        if (import.meta.client) {
          const keysToRemove = [
            'cart',
            'favourites',
            'lastViewedCategory',
            'recentSearches',
            'deliveryAddress',
          ]

          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key)
            } catch (error) {
              console.debug(`Failed to remove ${key} from localStorage:`, error)
            }
          })

          console.log('Tenant-specific localStorage cleared')
        }

        console.log('All tenant-specific data cleared successfully')
      } catch (error) {
        console.error('Error clearing tenant data:', error)
        // Don't throw error, just log it
      }
    },

    /**
     * Fetch available tenants for selection
     * Requirements: 5.1
     */
    async fetchAvailableTenants(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const apiClient = useApiClient()

        const tenants = await apiClient.get<TenantInfo[]>('/tenants', {
          headers: {
            'X-Bypass-Tenant': 'true' // System-wide request
          }
        })

        this.availableTenants = tenants
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch tenants'
        console.error('Fetch tenants error:', err)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Set error state
     */
    setError(error: string | null): void {
      this.error = error
    },

    /**
     * Clear error state
     */
    clearError(): void {
      this.error = null
    },

    /**
     * Update URL with current tenant
     * Requirements: 3.3, 3.5
     */
    async updateTenantInUrl(): Promise<void> {
      if (!this.currentTenant) {
        return
      }

      const config = useRuntimeConfig()
      if (!config.public.preserveTenantInUrl) {
        return
      }

      const route = useRoute()
      const router = useRouter()
      const tenantParam = String(config.public.tenantQueryParam || 'tenant')

      // Only update if tenant parameter is different
      if (route.query[tenantParam] !== this.currentTenant.slug) {
        await router.replace({
          ...route,
          query: {
            ...route.query,
            [tenantParam]: this.currentTenant.slug
          }
        })
      }
    },

    /**
     * Remove tenant from URL
     * Requirements: 3.5
     */
    async removeTenantFromUrl(): Promise<void> {
      const config = useRuntimeConfig()
      const route = useRoute()
      const router = useRouter()
      const tenantParam = String(config.public.tenantQueryParam || 'tenant')

      if (route.query[tenantParam]) {
        const query = { ...route.query }
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete query[tenantParam]

        await router.replace({
          ...route,
          query
        })
      }
    },

    /**
     * Reset tenant to default
     * Requirements: 3.2, 3.3
     */
    async resetToDefaultTenant(): Promise<boolean> {
      const config = useRuntimeConfig()
      const defaultTenant = String(config.public.defaultTenant || '')

      if (!defaultTenant) {
        console.warn('No default tenant configured')
        return false
      }

      return await this.setTenant(defaultTenant, {
        clearCache: true,
        updateUrl: true
      })
    },

    /**
     * Handle tenant error and fallback
     * Requirements: 3.2, 3.3
     */
    async handleTenantError(error: Error): Promise<void> {
      console.error('Tenant error:', error)
      this.error = error.message

      // Try to fallback to default tenant
      const config = useRuntimeConfig()
      const defaultTenant = String(config.public.defaultTenant || '')

      if (defaultTenant && this.currentTenant?.slug !== defaultTenant) {
        console.log('Attempting fallback to default tenant...')
        const success = await this.setTenant(defaultTenant, {
          clearCache: false,
          updateUrl: true
        })

        if (success) {
          console.log('Fallback to default tenant successful')
          return
        }
      }

      // If fallback fails or no default, redirect to selection page
      if (this.isMultiTenant) {
        await navigateTo('/select-restaurant')
      }
    },

    /**
     * Check if data belongs to current tenant
     * Requirements: 4.1, 4.2, 4.4
     */
    isDataForCurrentTenant(tenantId: string): boolean {
      return this.currentTenant?.id === tenantId
    },

    /**
     * Get tenant context for API requests
     * Requirements: 4.1, 4.5
     */
    getTenantContext(): { tenantSlug: string; tenantId: string } | null {
      if (!this.currentTenant) {
        return null
      }

      return {
        tenantSlug: this.currentTenant.slug,
        tenantId: this.currentTenant.id,
      }
    },

    /**
     * Subscribe to tenant changes
     * Requirements: 4.1, 5.1
     */
    onTenantChange(callback: (tenant: TenantInfo | null) => void): () => void {
      // Watch for tenant changes
      const stopWatch = watch(
        () => this.currentTenant,
        (newTenant) => {
          callback(newTenant)
        },
        { immediate: false }
      )

      // Return unsubscribe function
      return stopWatch
    },

    /**
     * Prefetch tenant data for better performance
     * Requirements: 3.4
     */
    async prefetchTenant(slug: string): Promise<void> {
      const nuxtApp = useNuxtApp()
      const tenantResolver = (nuxtApp as any).$tenantResolver

      if (tenantResolver) {
        await tenantResolver.prefetchTenant(slug)
      }
    },
  },
})

/**
 * Get default branding when no tenant is loaded
 */
function getDefaultBranding(): TenantBranding {
  const config = useRuntimeConfig()

  return {
    logo: '/icon-192x192.png',
    primaryColor: '#1a1a1a',
    secondaryColor: '#f5f5f5',
    favicon: '/favicon.ico',
    appName: config.public.appName || 'Menu Ordering App',
    description: 'Universal menu ordering system',
  }
}

/**
 * Get default settings when no tenant is loaded
 */
function getDefaultSettings(): TenantSettings {
  return {
    currency: 'KGS',
    timezone: 'UTC',
    language: 'en',
    features: {
      deliveryEnabled: true,
      pickupEnabled: true,
      paymentMethods: ['cash', 'card'],
      loyaltyProgram: false,
      onlineOrdering: true,
      tableReservation: false,
      multiLanguage: false,
      pushNotifications: false,
    },
    businessHours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      saturday: { isOpen: true, openTime: '10:00', closeTime: '23:00' },
      sunday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
    },
    contactInfo: {
      phone: '',
      email: '',
      address: '',
    },
    deliverySettings: {
      enabled: true,
      minOrderAmount: 10,
      deliveryFee: 5,
      freeDeliveryThreshold: 50,
      maxDeliveryDistance: 10,
      estimatedDeliveryTime: 30,
      zones: [],
    },
  }
}
