// Tenant core types
export interface TenantInfo {
  slug: string
  id: string
  name: string
  domain?: string
  branding: TenantBranding
  settings: TenantSettings
  locations: TenantLocation[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TenantLocation {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  latitude: number
  longitude: number
  isActive: boolean
}

export interface TenantBranding {
  logo: string
  primaryColor: string
  secondaryColor: string
  favicon: string
  appName: string
  description?: string
  heroImage?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
    twitter?: string
    website?: string
  }
}

export interface TenantSettings {
  currency: string
  timezone: string
  language: string
  features: TenantFeatures
  businessHours: BusinessHours
  contactInfo: ContactInfo
  deliverySettings: DeliverySettings
}

export interface TenantFeatures {
  deliveryEnabled: boolean
  pickupEnabled: boolean
  paymentMethods: string[]
  loyaltyProgram: boolean
  onlineOrdering: boolean
  tableReservation: boolean
  multiLanguage: boolean
  pushNotifications: boolean
}

export interface BusinessHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface DaySchedule {
  isOpen: boolean
  openTime?: string
  closeTime?: string
  breaks?: Array<{
    startTime: string
    endTime: string
  }>
}

export interface ContactInfo {
  phone?: string
  email?: string
  address?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface DeliverySettings {
  enabled: boolean
  minOrderAmount: number
  deliveryFee: number
  freeDeliveryThreshold?: number
  maxDeliveryDistance: number
  estimatedDeliveryTime: number
  zones: DeliveryZone[]
}

export interface DeliveryZone {
  id: string
  name: string
  polygon: Array<{ lat: number; lng: number }>
  deliveryFee: number
  minOrderAmount: number
}

// Tenant configuration types
export interface TenantConfig {
  // Environment-based configuration
  defaultTenant: string
  multiTenantMode: boolean
  tenantFromEnvironment: string | null
  
  // Runtime configuration
  allowTenantSwitching: boolean
  requireTenantValidation: boolean
  tenantCacheTimeout: number
  
  // URL configuration
  tenantQueryParam: string
  preserveTenantInUrl: boolean
}

// Tenant cache types
export interface TenantCache {
  tenants: Map<string, TenantInfo>
  lastUpdated: Map<string, Date>
  validationResults: Map<string, boolean>
}

// Tenant error types
export interface TenantError extends Error {
  tenantSlug?: string
  errorType: 'TENANT_NOT_FOUND' | 'TENANT_INACTIVE' | 'TENANT_ACCESS_DENIED' | 'TENANT_VALIDATION_FAILED'
  statusCode?: number
}

// Tenant request configuration
export interface TenantRequestConfig {
  bypassTenant?: boolean // For system-wide requests
  targetTenant?: string  // Override current tenant
  headers?: Record<string, string>
}

// Tenant resolver types
export interface TenantResolverOptions {
  fromEnvironment?: string
  fromQuery?: string
  fromLocalStorage?: string
  defaultTenant?: string
}

// Tenant store state
export interface TenantStoreState {
  currentTenant: TenantInfo | null
  availableTenants: TenantInfo[]
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  locations: TenantLocation[]
}

// Tenant validation result
export interface TenantValidationResult {
  isValid: boolean
  tenant?: TenantInfo
  error?: string
}

// Tenant switching options
export interface TenantSwitchOptions {
  updateUrl?: boolean
  clearCache?: boolean
  validateAccess?: boolean
}

// Tenant context for composables
export interface TenantContext {
  currentTenant: Ref<TenantInfo | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  isMultiTenant: ComputedRef<boolean>
  tenantSlug: ComputedRef<string>
  tenantBranding: ComputedRef<TenantBranding>
  tenantSettings: ComputedRef<TenantSettings>
}

// Tenant middleware types
export interface TenantMiddlewareContext {
  tenant: TenantInfo | null
  isValid: boolean
  requiresRedirect: boolean
  redirectPath?: string
}

// Tenant notification types
export interface TenantNotificationSubscription {
  tenantId: string
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  isActive: boolean
}

// Tenant WebSocket types
export interface TenantWebSocketConfig {
  tenantSlug: string
  userId?: string
  channels: string[]
}

// Export utility types
export type TenantSlug = string
export type TenantId = string

// Tenant selection types for UI
export interface TenantOption {
  slug: string
  name: string
  description?: string
  logo?: string
  isAvailable: boolean
}

export interface TenantSearchFilters {
  query?: string
  location?: {
    latitude: number
    longitude: number
    radius?: number
  }
  features?: string[]
  isActive?: boolean
}
