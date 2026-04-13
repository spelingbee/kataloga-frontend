import { defineStore } from 'pinia'
import type { 
  TenantInfo, 
  TenantBranding, 
  TenantSettings,
  TenantStoreState,
  TenantSwitchOptions,
  TenantResolverOptions
} from '~/types/tenant'

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
    locations: [],
    isLoading: false,
    error: null,
    isInitialized: false,
    isRecovering: false,
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
      return Boolean(config.public.multiTenantMode) || !config.public.tenantSlug
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
    async initializeTenant(): Promise<void> {
      if (this.isInitialized) return

      this.isLoading = true
      this.error = null

      try {
        const tenantResolver = (this as any).$services.tenantResolver
        const route = useRoute()
        const queryTenant = route.query.tenant as string | undefined
        
        const options: TenantResolverOptions = {
          fromQuery: queryTenant,
          fromLocalStorage: tenantResolver.getStoredTenant(),
        }

        const result = await tenantResolver.resolveTenantWithFallback(options)
        if (result.tenant) {
          this.currentTenant = result.tenant
          this.locations = result.tenant.locations || []
          this.isInitialized = true
        } else if (result.requiresSelection) {
          this.isInitialized = true
          if (this.isMultiTenant) {
            await navigateTo('/select-restaurant')
          } else {
            throw new Error('No tenant configured for single-tenant mode')
          }
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to initialize tenant'
        this.isInitialized = true
      } finally {
        this.isLoading = false
      }
    },

    async setTenant(slug: string, options: TenantSwitchOptions = {}): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        const tenantResolver = (this as any).$services.tenantResolver
        
        if (options.validateAccess !== false) {
          const validationResult = await tenantResolver.validateTenant(slug)
          if (!validationResult.isValid) {
            throw new Error(validationResult.error || `Invalid tenant: ${slug}`)
          }
        }

        const tenantInfo = await tenantResolver.getTenantInfo(slug)
        this.currentTenant = tenantInfo
        this.locations = tenantInfo?.locations || []
        tenantResolver.saveStoredTenant(slug)

        if (options.updateUrl !== false) {
          const config = useRuntimeConfig()
          if (config.public.preserveTenantInUrl) {
            const route = useRoute()
            const router = useRouter()
            const tenantParam = String(config.public.tenantQueryParam || 'tenant')
            
            await router.push({
              ...route,
              query: { ...route.query, [tenantParam]: slug }
            })
          }
        }

        return true
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to set tenant'
        return false
      } finally {
        this.isLoading = false
      }
    },

    async fetchTenantInfo(slug: string): Promise<TenantInfo> {
      return await (this as any).$services.tenantResolver.getTenantInfo(slug)
    },

    async validateTenant(slug: string): Promise<boolean> {
      const result = await (this as any).$services.tenantResolver.validateTenant(slug)
      return result.isValid
    },

    clearTenant(): void {
      this.currentTenant = null
      this.error = null
      if (import.meta.client) {
        (this as any).$services.tenantResolver.clearStoredTenant()
      }
    },

    async refreshTenant(): Promise<void> {
      if (!this.currentTenant) return

      this.isLoading = true
      this.error = null

      try {
        const tenantResolver = (this as any).$services.tenantResolver
        tenantResolver.clearTenantCache(this.currentTenant.slug)
        const tenantInfo = await tenantResolver.getTenantInfo(this.currentTenant.slug)
        this.currentTenant = tenantInfo
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to refresh tenant'
      } finally {
        this.isLoading = false
      }
    },

    async switchTenant(slug: string, options: TenantSwitchOptions = {}): Promise<boolean> {
      if (!this.canSwitchTenant) return false
      if (this.currentTenant?.slug === slug) return true

      this.isLoading = true
      this.error = null

      try {
        const tenantResolver = (this as any).$services.tenantResolver
        const validationResult = await tenantResolver.validateTenant(slug)
        
        if (!validationResult.isValid) {
          throw new Error(validationResult.error || `Invalid tenant: ${slug}`)
        }

        const newTenant = await tenantResolver.getTenantInfo(slug)
        this.currentTenant = newTenant
        tenantResolver.saveStoredTenant(slug)

        const config = useRuntimeConfig()
        if (options.updateUrl !== false && config.public.preserveTenantInUrl) {
          const route = useRoute()
          const router = useRouter()
          const tenantParam = String(config.public.tenantQueryParam || 'tenant')
          
          await router.push({
            path: route.path,
            query: { ...route.query, [tenantParam]: slug }
          })
        }

        return true
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to switch tenant'
        return false
      } finally {
        this.isLoading = false
      }
    },

    async handleTenantFromUrl(tenantSlug: string): Promise<void> {
      if (this.currentTenant?.slug === tenantSlug) return
      await this.switchTenant(tenantSlug, { updateUrl: false })
    },

    async fetchAvailableTenants(): Promise<void> {
      this.isLoading = true
      this.error = null

      try {
        const response = await (this as any).$apiClient.get<TenantInfo[]>('/tenants', {
          headers: { 'X-Bypass-Tenant': 'true' }
        })

        if (Array.isArray(response)) {
          this.availableTenants = response
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch tenants'
      } finally {
        this.isLoading = false
      }
    },

    async fetchLocations(): Promise<void> {
      if (!this.currentTenant) return
      
      this.isLoading = true
      this.error = null

      try {
        const response = await (this as any).$apiClient.get<any[]>(`/locations/public/${this.currentTenant.slug}`)

        if (Array.isArray(response)) {
          this.locations = response
        }
      } catch (err) {
        console.error('Failed to fetch locations:', err)
        this.error = 'Failed to load locations'
      } finally {
        this.isLoading = false
      }
    },

    setError(error: string | null): void {
      this.error = error
    },

    clearError(): void {
      this.error = null
    },

    async updateTenantInUrl(): Promise<void> {
      if (!this.currentTenant) return

      const config = useRuntimeConfig()
      if (!config.public.preserveTenantInUrl) return

      const route = useRoute()
      const router = useRouter()
      const tenantParam = String(config.public.tenantQueryParam || 'tenant')

      if (route.query[tenantParam] !== this.currentTenant.slug) {
        await router.replace({
          ...route,
          query: { ...route.query, [tenantParam]: this.currentTenant.slug }
        })
      }
    },

    async removeTenantFromUrl(): Promise<void> {
      const config = useRuntimeConfig()
      const route = useRoute()
      const router = useRouter()
      const tenantParam = String(config.public.tenantQueryParam || 'tenant')

      if (route.query[tenantParam]) {
        const query = { ...route.query }
        delete query[tenantParam]
        await router.replace({ ...route, query })
      }
    },

    async resetToDefaultTenant(): Promise<boolean> {
      const config = useRuntimeConfig()
      const defaultTenant = String(config.public.defaultTenant || '')
      if (!defaultTenant) return false

      return await this.setTenant(defaultTenant, { 
        clearCache: true,
        updateUrl: true 
      })
    },

    async handleTenantError(error: Error): Promise<void> {
      if (this.isRecovering) return
      this.isRecovering = true
      
      console.warn('⚠️ [TenantStore] Handling tenant error:', error.message)
      this.error = error.message
      
      const config = useRuntimeConfig()
      const defaultTenant = String(config.public.defaultTenant || '')

      try {
        if (defaultTenant && this.currentTenant?.slug !== defaultTenant) {
          console.log(`📡 [TenantStore] Attempting recovery with default tenant: ${defaultTenant}`)
          const success = await this.setTenant(defaultTenant, { 
            clearCache: false,
            updateUrl: true 
          })
          if (success) {
            console.log('✅ [TenantStore] Recovery successful')
            return
          }
        }

        if (this.isMultiTenant) {
          console.log('📡 [TenantStore] Multi-tenant mode: Redirecting to selection page')
          await navigateTo('/select-restaurant')
        }
      } catch (recoveryErr) {
        console.error('❌ [TenantStore] Recovery failed:', recoveryErr)
      } finally {
        this.isRecovering = false
      }
    },

    isDataForCurrentTenant(tenantId: string): boolean {
      return this.currentTenant?.id === tenantId
    },

    getTenantContext(): { tenantSlug: string; tenantId: string } | null {
      if (!this.currentTenant) return null
      return {
        tenantSlug: this.currentTenant.slug,
        tenantId: this.currentTenant.id,
      }
    },

    onTenantChange(callback: (tenant: TenantInfo | null) => void): () => void {
      const stopWatch = watch(
        () => this.currentTenant,
        (newTenant) => {
          callback(newTenant)
        },
        { immediate: false }
      )
      return stopWatch
    },

    async prefetchTenant(slug: string): Promise<void> {
      const tenantResolver = (this as any).$services.tenantResolver
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
    timezone: 'Asia/Bishkek',
    language: 'ru',
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
