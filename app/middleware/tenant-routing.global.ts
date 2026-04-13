import { useTenantStore } from '~/stores/tenant'

/**
 * Global tenant routing middleware
 * Handles automatic tenant detection from URL and tenant-specific navigation
 * Runs on every route change to maintain tenant context
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client side
  if (import.meta.server) return

  const tenantStore = useTenantStore()
  const config = useRuntimeConfig()

  // Extract tenant slug from query parameter
  const tenantSlugFromQuery = to.query.tenant as string | undefined
  const previousTenantSlug = from.query.tenant as string | undefined

  // Handle tenant changes from URL
  if (tenantSlugFromQuery && tenantSlugFromQuery !== tenantStore.tenantSlug) {
    try {
      // Validate and set new tenant
      const isValid = await tenantStore.validateTenant(tenantSlugFromQuery)
      
      if (isValid) {
        await tenantStore.setTenant(tenantSlugFromQuery)
      } else {
        console.warn(`Invalid tenant slug in URL: ${tenantSlugFromQuery}`)
        
        // Remove invalid tenant parameter from URL
        const query = { ...to.query }
        delete query.tenant
        
        return navigateTo({
          path: to.path,
          query,
          replace: true
        })
      }
    } catch (error) {
      console.error('Error setting tenant from URL:', error)
    }
  }

  // Preserve tenant in URL when navigating between routes
  // Only if tenant is set and URL doesn't already have it
  if (tenantStore.currentTenant && !tenantSlugFromQuery && tenantStore.isMultiTenant) {
    // Check if we should preserve tenant in URL for this route
    const shouldPreserveTenant = shouldPreserveTenantInUrl(to.path)
    
    if (shouldPreserveTenant) {
      // Add tenant parameter to URL
      return navigateTo({
        path: to.path,
        query: {
          ...to.query,
          tenant: tenantStore.tenantSlug
        },
        replace: true
      })
    }
  }

  // Preservation logic for tenant in URL (removed the redundant / to /menu redirect)
  return
})

/**
 * Determines if tenant parameter should be preserved in URL for a given path
 */
function shouldPreserveTenantInUrl(path: string): boolean {
  // Routes that should have tenant in URL
  const tenantAwareRoutes = [
    '/menu',
    '/cart',
    '/checkout',
    '/orders',
    '/favourites',
    '/admin',
    '/management'
  ]

  // Routes that should NOT have tenant in URL
  const excludedRoutes = [
    '/auth',
    '/select-restaurant',
    '/about',
    '/contact'
  ]

  // Check if path should be excluded
  if (excludedRoutes.some(route => path.startsWith(route))) {
    return false
  }

  // Check if path is tenant-aware
  return tenantAwareRoutes.some(route => path.startsWith(route))
}
