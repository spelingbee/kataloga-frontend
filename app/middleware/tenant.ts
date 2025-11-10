import { useTenantStore } from '~/stores/tenant'

/**
 * Tenant validation middleware
 * Ensures that a valid tenant is set before accessing tenant-specific routes
 * Handles tenant resolution from URL parameters and redirects on validation errors
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side
  if (import.meta.server) return

  const tenantStore = useTenantStore()
  const config = useRuntimeConfig()

  // Check if tenant query parameter is present in URL
  const tenantSlugFromQuery = to.query.tenant as string | undefined

  // If tenant parameter is in URL, attempt to set it
  if (tenantSlugFromQuery) {
    try {
      const isValid = await tenantStore.validateTenant(tenantSlugFromQuery)
      
      if (!isValid) {
        // Invalid tenant slug provided
        console.error(`Invalid tenant slug: ${tenantSlugFromQuery}`)
        
        // In multi-tenant mode, redirect to tenant selector
        if (tenantStore.isMultiTenant) {
          return navigateTo('/select-restaurant')
        }
        
        // In single-tenant mode, show error
        throw createError({
          statusCode: 404,
          statusMessage: `Restaurant not found: ${tenantSlugFromQuery}`
        })
      }

      // Set the validated tenant
      await tenantStore.setTenant(tenantSlugFromQuery)
    } catch (error) {
      console.error('Tenant validation error:', error)
      
      // Redirect to tenant selector or show error
      if (tenantStore.isMultiTenant) {
        return navigateTo('/select-restaurant')
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to validate restaurant'
      })
    }
  }

  // Define routes that require a valid tenant
  const tenantRequiredRoutes = [
    '/menu',
    '/cart',
    '/checkout',
    '/orders',
    '/favourites'
  ]

  // Check if current route requires a tenant
  const requiresTenant = tenantRequiredRoutes.some(route => to.path.startsWith(route))

  if (requiresTenant) {
    // Ensure tenant is initialized
    if (!tenantStore.currentTenant) {
      // Try to initialize tenant if not already done
      try {
        await tenantStore.initializeTenant()
      } catch (error) {
        console.error('Failed to initialize tenant:', error)
      }
    }

    // If still no tenant after initialization, redirect
    if (!tenantStore.currentTenant) {
      if (tenantStore.isMultiTenant) {
        // In multi-tenant mode, redirect to tenant selector
        return navigateTo('/select-restaurant')
      } else {
        // In single-tenant mode, this is a configuration error
        throw createError({
          statusCode: 500,
          statusMessage: 'Restaurant configuration error. Please contact support.'
        })
      }
    }

    // Validate that the current tenant is active
    if (tenantStore.currentTenant && !tenantStore.currentTenant.isActive) {
      throw createError({
        statusCode: 403,
        statusMessage: 'This restaurant is currently unavailable'
      })
    }
  }

  // Allow navigation to continue
  return
})
