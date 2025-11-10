/**
 * Environment validation utilities for multi-tenant configuration
 */

export interface EnvironmentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates the current environment configuration for multi-tenant setup
 */
export function validateEnvironmentConfig(): EnvironmentValidationResult {
  const config = useRuntimeConfig()
  const errors: string[] = []
  const warnings: string[] = []

  // Check API base URL
  if (!config.public.apiBaseUrl) {
    errors.push('NUXT_PUBLIC_API_BASE_URL is required')
  }

  // Check WebSocket URL
  if (!config.public.websocketUrl) {
    warnings.push('NUXT_PUBLIC_WEBSOCKET_URL is not set, real-time features may not work')
  }

  // Validate multi-tenant configuration
  const isMultiTenant = config.public.multiTenantMode
  const tenantSlug = config.public.tenantSlug

  if (isMultiTenant) {
    // Multi-tenant mode validations
    if (tenantSlug && tenantSlug !== '') {
      warnings.push('NUXT_PUBLIC_TENANT_SLUG is set in multi-tenant mode, it will be ignored')
    }

    if (!config.public.allowTenantSwitching) {
      warnings.push('Tenant switching is disabled in multi-tenant mode')
    }
  } else {
    // Single-tenant mode validations
    if (!tenantSlug || tenantSlug === '') {
      errors.push('NUXT_PUBLIC_TENANT_SLUG is required in single-tenant mode')
    }

    if (config.public.allowTenantSwitching) {
      warnings.push('Tenant switching is enabled in single-tenant mode, this may cause confusion')
    }
  }

  // Validate cache timeout
  const cacheTimeout = Number(config.public.tenantCacheTimeout)
  if (cacheTimeout && cacheTimeout < 60000) {
    warnings.push('Tenant cache timeout is less than 1 minute, this may cause performance issues')
  }

  // Validate tenant query parameter
  if (!config.public.tenantQueryParam) {
    errors.push('NUXT_PUBLIC_TENANT_QUERY_PARAM is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Gets the deployment mode based on environment configuration
 */
export function getDeploymentMode(): 'multi-tenant' | 'single-tenant' {
  const config = useRuntimeConfig()
  return config.public.multiTenantMode ? 'multi-tenant' : 'single-tenant'
}

/**
 * Checks if the current environment is properly configured for the deployment mode
 */
export function isEnvironmentConfigured(): boolean {
  const validation = validateEnvironmentConfig()
  return validation.isValid
}

/**
 * Gets environment-specific tenant configuration
 */
export function getTenantEnvironmentConfig() {
  const config = useRuntimeConfig()
  
  return {
    tenantSlug: config.public.tenantSlug || null,
    multiTenantMode: config.public.multiTenantMode,
    defaultTenant: config.public.defaultTenant || null,
    tenantQueryParam: config.public.tenantQueryParam || 'tenant',
    preserveTenantInUrl: config.public.preserveTenantInUrl,
    requireTenantValidation: config.public.requireTenantValidation,
    tenantCacheTimeout: config.public.tenantCacheTimeout || 300000,
    allowTenantSwitching: config.public.allowTenantSwitching,
  }
}

/**
 * Logs environment validation results (development only)
 */
export function logEnvironmentValidation() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const validation = validateEnvironmentConfig()
  const mode = getDeploymentMode()

  console.log(`🏢 Deployment Mode: ${mode}`)
  
  if (validation.errors.length > 0) {
    console.error('❌ Environment Configuration Errors:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment Configuration Warnings:')
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  if (validation.isValid) {
    console.log('✅ Environment configuration is valid')
  }
}