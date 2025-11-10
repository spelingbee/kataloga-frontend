import type { 
  TenantInfo, 
  TenantBranding, 
  TenantSettings,
  TenantSwitchOptions 
} from '~/types/tenant'
import { useTenantStore } from '~/stores/tenant'

/**
 * Tenant Context Composable
 * 
 * Provides reactive access to tenant information and methods for tenant management.
 * Integrates with tenant store, routing, and URL management.
 * 
 * Requirements: 1.1, 3.3, 3.5, 5.1, 5.3
 */

export interface UseTenantReturn {
  // Reactive state
  currentTenant: ComputedRef<TenantInfo | null>
  isLoading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  
  // Computed properties
  isMultiTenant: ComputedRef<boolean>
  tenantSlug: ComputedRef<string>
  tenantId: ComputedRef<string>
  tenantName: ComputedRef<string>
  tenantDomain: ComputedRef<string | undefined>
  isTenantActive: ComputedRef<boolean>
  isTenantLoaded: ComputedRef<boolean>
  canSwitchTenant: ComputedRef<boolean>
  hasError: ComputedRef<boolean>
  
  // Branding and settings
  tenantBranding: ComputedRef<TenantBranding>
  tenantSettings: ComputedRef<TenantSettings>
  
  // Methods
  setTenant: (slug: string, options?: TenantSwitchOptions) => Promise<boolean>
  switchTenant: (slug: string, options?: TenantSwitchOptions) => Promise<boolean>
  refreshTenant: () => Promise<void>
  clearTenant: () => void
  validateTenant: (slug: string) => Promise<boolean>
  
  // URL management
  updateTenantInUrl: () => Promise<void>
  removeTenantFromUrl: () => Promise<void>
  getTenantFromUrl: () => string | null
  navigateWithTenant: (path: string, tenantSlug?: string) => Promise<void>
  
  // Utility methods
  isDataForCurrentTenant: (tenantId: string) => boolean
  getTenantContext: () => { tenantSlug: string; tenantId: string } | null
  onTenantChange: (callback: (tenant: TenantInfo | null) => void) => () => void
}

/**
 * Use Tenant Composable
 * 
 * Main composable for working with tenant context in components.
 * Provides reactive access to tenant information and management methods.
 * 
 * Requirements: 1.1, 3.5, 5.1
 * 
 * @example
 * ```typescript
 * const {
 *   currentTenant,
 *   tenantSlug,
 *   tenantBranding,
 *   setTenant,
 *   switchTenant
 * } = useTenant()
 * 
 * // Switch to a different tenant
 * await switchTenant('restaurant-abc')
 * 
 * // Access tenant branding
 * console.log(tenantBranding.value.logo)
 * ```
 */
export function useTenant(): UseTenantReturn {
  const tenantStore = useTenantStore()
  const route = useRoute()
  const router = useRouter()
  const config = useRuntimeConfig()

  // Reactive state from store
  const currentTenant = computed(() => tenantStore.currentTenant)
  const isLoading = computed(() => tenantStore.isLoading)
  const error = computed(() => tenantStore.error)

  // Computed properties
  const isMultiTenant = computed(() => tenantStore.isMultiTenant)
  const tenantSlug = computed(() => tenantStore.tenantSlug)
  const tenantId = computed(() => tenantStore.tenantId)
  const tenantName = computed(() => tenantStore.tenantName)
  const tenantDomain = computed(() => tenantStore.tenantDomain)
  const isTenantActive = computed(() => tenantStore.isTenantActive)
  const isTenantLoaded = computed(() => tenantStore.isTenantLoaded)
  const canSwitchTenant = computed(() => tenantStore.canSwitchTenant)
  const hasError = computed(() => tenantStore.hasError)

  // Branding and settings
  const tenantBranding = computed(() => tenantStore.tenantBranding)
  const tenantSettings = computed(() => tenantStore.tenantSettings)

  /**
   * Set tenant by slug
   * Requirements: 1.1, 3.4, 4.1
   */
  const setTenant = async (slug: string, options: TenantSwitchOptions = {}): Promise<boolean> => {
    return await tenantStore.setTenant(slug, options)
  }

  /**
   * Switch to a different tenant
   * Requirements: 3.4, 3.5, 5.1, 5.3
   */
  const switchTenant = async (slug: string, options: TenantSwitchOptions = {}): Promise<boolean> => {
    return await tenantStore.switchTenant(slug, options)
  }

  /**
   * Refresh current tenant information
   * Requirements: 3.3, 3.4
   */
  const refreshTenant = async (): Promise<void> => {
    await tenantStore.refreshTenant()
  }

  /**
   * Clear current tenant
   * Requirements: 3.4, 4.2
   */
  const clearTenant = (): void => {
    tenantStore.clearTenant()
  }

  /**
   * Validate tenant slug
   * Requirements: 1.1, 3.2
   */
  const validateTenant = async (slug: string): Promise<boolean> => {
    return await tenantStore.validateTenant(slug)
  }

  /**
   * Update URL with current tenant
   * Requirements: 3.3, 3.5
   */
  const updateTenantInUrl = async (): Promise<void> => {
    await tenantStore.updateTenantInUrl()
  }

  /**
   * Remove tenant from URL
   * Requirements: 3.5
   */
  const removeTenantFromUrl = async (): Promise<void> => {
    await tenantStore.removeTenantFromUrl()
  }

  /**
   * Get tenant slug from URL query parameter
   * Requirements: 1.1, 3.3
   */
  const getTenantFromUrl = (): string | null => {
    const tenantParam = String(config.public.tenantQueryParam || 'tenant')
    const tenantValue = route.query[tenantParam]
    
    if (typeof tenantValue === 'string' && tenantValue.trim() !== '') {
      return tenantValue
    }
    
    return null
  }

  /**
   * Navigate to a path with tenant parameter
   * Requirements: 1.1, 3.3, 3.5
   * 
   * @param path - The path to navigate to
   * @param tenantSlug - Optional tenant slug (uses current tenant if not provided)
   */
  const navigateWithTenant = async (path: string, tenantSlug?: string): Promise<void> => {
    const targetTenant = tenantSlug || tenantStore.tenantSlug
    
    if (!targetTenant) {
      // No tenant available, navigate without tenant parameter
      await router.push(path)
      return
    }

    // Check if we should preserve tenant in URL
    if (!config.public.preserveTenantInUrl) {
      await router.push(path)
      return
    }

    const tenantParam = String(config.public.tenantQueryParam || 'tenant')
    
    // Parse the path to handle existing query parameters
    const [pathname, queryString] = path.split('?')
    const existingQuery = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {}
    
    // Add tenant parameter
    const query = {
      ...existingQuery,
      [tenantParam]: targetTenant
    }

    await router.push({
      path: pathname,
      query
    })
  }

  /**
   * Check if data belongs to current tenant
   * Requirements: 4.1, 4.2, 4.4
   */
  const isDataForCurrentTenant = (tenantId: string): boolean => {
    return tenantStore.isDataForCurrentTenant(tenantId)
  }

  /**
   * Get tenant context for API requests
   * Requirements: 4.1, 4.5
   */
  const getTenantContext = (): { tenantSlug: string; tenantId: string } | null => {
    return tenantStore.getTenantContext()
  }

  /**
   * Subscribe to tenant changes
   * Requirements: 4.1, 5.1
   */
  const onTenantChange = (callback: (tenant: TenantInfo | null) => void): () => void => {
    return tenantStore.onTenantChange(callback)
  }

  return {
    // Reactive state
    currentTenant,
    isLoading,
    error,
    
    // Computed properties
    isMultiTenant,
    tenantSlug,
    tenantId,
    tenantName,
    tenantDomain,
    isTenantActive,
    isTenantLoaded,
    canSwitchTenant,
    hasError,
    
    // Branding and settings
    tenantBranding,
    tenantSettings,
    
    // Methods
    setTenant,
    switchTenant,
    refreshTenant,
    clearTenant,
    validateTenant,
    
    // URL management
    updateTenantInUrl,
    removeTenantFromUrl,
    getTenantFromUrl,
    navigateWithTenant,
    
    // Utility methods
    isDataForCurrentTenant,
    getTenantContext,
    onTenantChange,
  }
}

/**
 * Watch for tenant changes in URL and update store
 * Requirements: 1.1, 3.3, 3.5
 * 
 * This composable should be used in layouts or app.vue to handle
 * tenant changes from URL navigation.
 * 
 * @example
 * ```typescript
 * // In app.vue or layout
 * useTenantUrlWatcher()
 * ```
 */
export function useTenantUrlWatcher(): void {
  const tenantStore = useTenantStore()
  const route = useRoute()
  const config = useRuntimeConfig()

  // Watch for tenant parameter changes in URL
  watch(
    () => route.query[String(config.public.tenantQueryParam || 'tenant')],
    async (newTenant, oldTenant) => {
      // Skip if tenant hasn't changed
      if (newTenant === oldTenant) {
        return
      }

      // Skip if new tenant is the same as current tenant
      if (newTenant === tenantStore.tenantSlug) {
        return
      }

      // Handle tenant change from URL
      if (newTenant && typeof newTenant === 'string') {
        console.log('Tenant changed in URL:', newTenant)
        await tenantStore.handleTenantFromUrl(newTenant)
      } else if (!newTenant && tenantStore.currentTenant) {
        // Tenant removed from URL - decide what to do based on configuration
        const isMultiTenant = tenantStore.isMultiTenant
        
        if (isMultiTenant) {
          // In multi-tenant mode, keep current tenant but don't clear it
          console.log('Tenant removed from URL, keeping current tenant')
        } else {
          // In single-tenant mode, tenant should always be set
          console.log('Tenant removed from URL in single-tenant mode')
        }
      }
    },
    { immediate: false }
  )
}

/**
 * Sync tenant to URL on mount
 * Requirements: 3.3, 3.5
 * 
 * Ensures the URL reflects the current tenant when component mounts.
 * Useful for pages that should always show the tenant in URL.
 * 
 * @example
 * ```typescript
 * // In a page component
 * useTenantUrlSync()
 * ```
 */
export function useTenantUrlSync(): void {
  const tenantStore = useTenantStore()
  const config = useRuntimeConfig()

  onMounted(async () => {
    // Only sync if we should preserve tenant in URL
    if (!config.public.preserveTenantInUrl) {
      return
    }

    // Only sync if tenant is loaded
    if (tenantStore.currentTenant) {
      await tenantStore.updateTenantInUrl()
    }
  })
}

/**
 * Tenant Branding Composable
 * 
 * Provides easy access to tenant branding information with fallback values.
 * Requirements: 2.4, 4.3
 * 
 * @example
 * ```typescript
 * const {
 *   logo,
 *   primaryColor,
 *   appName,
 *   applyBrandingColors
 * } = useTenantBranding()
 * 
 * // Apply branding colors to document
 * applyBrandingColors()
 * ```
 */
export function useTenantBranding() {
  const tenantStore = useTenantStore()
  const config = useRuntimeConfig()

  // Branding properties with fallbacks
  const logo = computed(() => {
    return tenantStore.tenantBranding.logo || '/icon-192x192.png'
  })

  const primaryColor = computed(() => {
    return tenantStore.tenantBranding.primaryColor || '#1a1a1a'
  })

  const secondaryColor = computed(() => {
    return tenantStore.tenantBranding.secondaryColor || '#f5f5f5'
  })

  const favicon = computed(() => {
    return tenantStore.tenantBranding.favicon || '/favicon.ico'
  })

  const appName = computed(() => {
    return tenantStore.tenantBranding.appName || config.public.appName || 'Menu Ordering App'
  })

  const description = computed(() => {
    return tenantStore.tenantBranding.description || 'Universal menu ordering system'
  })

  const heroImage = computed(() => {
    return tenantStore.tenantBranding.heroImage
  })

  const socialLinks = computed(() => {
    return tenantStore.tenantBranding.socialLinks || {}
  })

  /**
   * Apply branding colors to document root
   * Requirements: 2.4
   */
  const applyBrandingColors = (): void => {
    if (import.meta.client) {
      const root = document.documentElement
      root.style.setProperty('--primary-color', primaryColor.value)
      root.style.setProperty('--secondary-color', secondaryColor.value)
    }
  }

  /**
   * Update document title with tenant name
   * Requirements: 2.4
   */
  const updateDocumentTitle = (pageTitle?: string): void => {
    if (import.meta.client) {
      if (pageTitle) {
        document.title = `${pageTitle} - ${appName.value}`
      } else {
        document.title = appName.value
      }
    }
  }

  /**
   * Update favicon with tenant favicon
   * Requirements: 2.4
   */
  const updateFavicon = (): void => {
    if (import.meta.client) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (link) {
        link.href = favicon.value
      }
    }
  }

  /**
   * Apply all branding to document
   * Requirements: 2.4
   */
  const applyBranding = (pageTitle?: string): void => {
    applyBrandingColors()
    updateDocumentTitle(pageTitle)
    updateFavicon()
  }

  // Watch for tenant changes and reapply branding
  watch(
    () => tenantStore.currentTenant,
    () => {
      if (import.meta.client) {
        applyBranding()
      }
    },
    { immediate: true }
  )

  return {
    // Branding properties
    logo,
    primaryColor,
    secondaryColor,
    favicon,
    appName,
    description,
    heroImage,
    socialLinks,
    
    // Methods
    applyBrandingColors,
    updateDocumentTitle,
    updateFavicon,
    applyBranding,
  }
}

/**
 * Tenant Settings Composable
 * 
 * Provides easy access to tenant settings with fallback values.
 * Requirements: 2.4, 4.3
 * 
 * @example
 * ```typescript
 * const {
 *   currency,
 *   isDeliveryEnabled,
 *   isFeatureEnabled,
 *   formatCurrency
 * } = useTenantSettings()
 * 
 * // Check if feature is enabled
 * if (isFeatureEnabled('loyaltyProgram')) {
 *   // Show loyalty program UI
 * }
 * 
 * // Format price with tenant currency
 * const price = formatCurrency(29.99)
 * ```
 */
export function useTenantSettings() {
  const tenantStore = useTenantStore()

  // Settings properties with fallbacks
  const currency = computed(() => {
    return tenantStore.tenantSettings.currency || 'USD'
  })

  const timezone = computed(() => {
    return tenantStore.tenantSettings.timezone || 'UTC'
  })

  const language = computed(() => {
    return tenantStore.tenantSettings.language || 'en'
  })

  const features = computed(() => {
    return tenantStore.tenantSettings.features || {
      deliveryEnabled: true,
      pickupEnabled: true,
      paymentMethods: ['cash', 'card'],
      loyaltyProgram: false,
      onlineOrdering: true,
      tableReservation: false,
      multiLanguage: false,
      pushNotifications: false,
    }
  })

  const businessHours = computed(() => {
    return tenantStore.tenantSettings.businessHours
  })

  const contactInfo = computed(() => {
    return tenantStore.tenantSettings.contactInfo
  })

  const deliverySettings = computed(() => {
    return tenantStore.tenantSettings.deliverySettings
  })

  // Feature flags
  const isDeliveryEnabled = computed(() => {
    return features.value.deliveryEnabled && deliverySettings.value.enabled
  })

  const isPickupEnabled = computed(() => {
    return features.value.pickupEnabled
  })

  const isOnlineOrderingEnabled = computed(() => {
    return features.value.onlineOrdering
  })

  const isLoyaltyProgramEnabled = computed(() => {
    return features.value.loyaltyProgram
  })

  const isTableReservationEnabled = computed(() => {
    return features.value.tableReservation
  })

  const isPushNotificationsEnabled = computed(() => {
    return features.value.pushNotifications
  })

  /**
   * Check if a specific feature is enabled
   * Requirements: 4.3
   */
  const isFeatureEnabled = (featureName: keyof typeof features.value): boolean => {
    return features.value[featureName] as boolean
  }

  /**
   * Check if a payment method is supported
   * Requirements: 4.3
   */
  const isPaymentMethodSupported = (method: string): boolean => {
    return features.value.paymentMethods.includes(method)
  }

  /**
   * Get supported payment methods
   * Requirements: 4.3
   */
  const getSupportedPaymentMethods = (): string[] => {
    return features.value.paymentMethods
  }

  /**
   * Format currency value with tenant currency
   * Requirements: 2.4, 4.3
   */
  const formatCurrency = (amount: number, options?: Intl.NumberFormatOptions): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency.value,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    }

    try {
      return new Intl.NumberFormat(language.value, defaultOptions).format(amount)
    } catch (error) {
      console.error('Error formatting currency:', error)
      // Fallback to simple format
      return `${currency.value} ${amount.toFixed(2)}`
    }
  }

  /**
   * Check if restaurant is currently open
   * Requirements: 4.3
   */
  const isRestaurantOpen = (): boolean => {
    if (!businessHours.value) {
      return true // Assume open if no hours configured
    }

    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[now.getDay()] as keyof typeof businessHours.value
    const todaySchedule = businessHours.value[currentDay]

    if (!todaySchedule || !todaySchedule.isOpen) {
      return false
    }

    if (!todaySchedule.openTime || !todaySchedule.closeTime) {
      return true // Assume open if times not configured
    }

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    return currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime
  }

  /**
   * Get today's business hours
   * Requirements: 4.3
   */
  const getTodayHours = () => {
    if (!businessHours.value) {
      return null
    }

    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[now.getDay()] as keyof typeof businessHours.value
    
    return businessHours.value[currentDay]
  }

  /**
   * Calculate delivery fee for order amount
   * Requirements: 4.3
   */
  const calculateDeliveryFee = (orderAmount: number): number => {
    if (!deliverySettings.value || !deliverySettings.value.enabled) {
      return 0
    }

    // Check if order qualifies for free delivery
    if (
      deliverySettings.value.freeDeliveryThreshold && 
      orderAmount >= deliverySettings.value.freeDeliveryThreshold
    ) {
      return 0
    }

    return deliverySettings.value.deliveryFee || 0
  }

  /**
   * Check if order meets minimum amount
   * Requirements: 4.3
   */
  const meetsMinimumOrder = (orderAmount: number): boolean => {
    if (!deliverySettings.value || !deliverySettings.value.enabled) {
      return true
    }

    return orderAmount >= (deliverySettings.value.minOrderAmount || 0)
  }

  /**
   * Get minimum order amount
   * Requirements: 4.3
   */
  const getMinimumOrderAmount = (): number => {
    if (!deliverySettings.value || !deliverySettings.value.enabled) {
      return 0
    }

    return deliverySettings.value.minOrderAmount || 0
  }

  /**
   * Get estimated delivery time
   * Requirements: 4.3
   */
  const getEstimatedDeliveryTime = (): number => {
    if (!deliverySettings.value || !deliverySettings.value.enabled) {
      return 30 // Default 30 minutes
    }

    return deliverySettings.value.estimatedDeliveryTime || 30
  }

  return {
    // Settings properties
    currency,
    timezone,
    language,
    features,
    businessHours,
    contactInfo,
    deliverySettings,
    
    // Feature flags
    isDeliveryEnabled,
    isPickupEnabled,
    isOnlineOrderingEnabled,
    isLoyaltyProgramEnabled,
    isTableReservationEnabled,
    isPushNotificationsEnabled,
    
    // Methods
    isFeatureEnabled,
    isPaymentMethodSupported,
    getSupportedPaymentMethods,
    formatCurrency,
    isRestaurantOpen,
    getTodayHours,
    calculateDeliveryFee,
    meetsMinimumOrder,
    getMinimumOrderAmount,
    getEstimatedDeliveryTime,
  }
}

/**
 * Tenant Contact Info Composable
 * 
 * Provides easy access to tenant contact information.
 * Requirements: 4.3
 * 
 * @example
 * ```typescript
 * const {
 *   phone,
 *   email,
 *   address,
 *   hasContactInfo
 * } = useTenantContact()
 * ```
 */
export function useTenantContact() {
  const tenantStore = useTenantStore()

  const phone = computed(() => {
    return tenantStore.tenantSettings.contactInfo?.phone || ''
  })

  const email = computed(() => {
    return tenantStore.tenantSettings.contactInfo?.email || ''
  })

  const address = computed(() => {
    return tenantStore.tenantSettings.contactInfo?.address || ''
  })

  const coordinates = computed(() => {
    return tenantStore.tenantSettings.contactInfo?.coordinates
  })

  const hasContactInfo = computed(() => {
    return !!(phone.value || email.value || address.value)
  })

  const hasLocation = computed(() => {
    return !!coordinates.value
  })

  /**
   * Format phone number for display
   */
  const formatPhone = (): string => {
    if (!phone.value) return ''
    
    // Simple formatting - can be enhanced based on locale
    return phone.value
  }

  /**
   * Get phone link for tel: protocol
   */
  const getPhoneLink = (): string => {
    if (!phone.value) return ''
    return `tel:${phone.value.replace(/\s/g, '')}`
  }

  /**
   * Get email link for mailto: protocol
   */
  const getEmailLink = (): string => {
    if (!email.value) return ''
    return `mailto:${email.value}`
  }

  /**
   * Get Google Maps link
   */
  const getMapLink = (): string => {
    if (!coordinates.value) return ''
    return `https://www.google.com/maps?q=${coordinates.value.latitude},${coordinates.value.longitude}`
  }

  return {
    // Contact properties
    phone,
    email,
    address,
    coordinates,
    hasContactInfo,
    hasLocation,
    
    // Methods
    formatPhone,
    getPhoneLink,
    getEmailLink,
    getMapLink,
  }
}
