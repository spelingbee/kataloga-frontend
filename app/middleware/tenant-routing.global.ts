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
  
  // 1. Extract tenant slug from path /t/[slug]
  const tenantSlugFromParams = to.params.slug as string | undefined
  
  // 2. Extract tenant slug from legacy query parameter ?tenant=slug
  const tenantSlugFromQuery = to.query.tenant as string | undefined

  // Handle redirection from legacy query param to new path format
  if (tenantSlugFromQuery && !tenantSlugFromParams) {
    const isValid = await tenantStore.validateTenant(tenantSlugFromQuery)
    if (isValid) {
      // Build new path: /t/slug/original-path (e.g., /menu -> /t/slug/menu)
      const cleanPath = to.path === '/' ? '' : to.path
      const query = { ...to.query }
      delete query.tenant

      return navigateTo({
        path: `/t/${tenantSlugFromQuery}${cleanPath}`,
        query,
        replace: true
      })
    }
  }

  // Handle tenant detection from the new path format
  if (tenantSlugFromParams && tenantSlugFromParams !== tenantStore.tenantSlug) {
    try {
      const isValid = await tenantStore.validateTenant(tenantSlugFromParams)
      
      if (isValid) {
        await tenantStore.setTenant(tenantSlugFromParams)
      } else {
        console.warn(`Invalid tenant slug in path: ${tenantSlugFromParams}`)
        // Redirect to a safe place if slug is garbage
        return navigateTo('/select-restaurant')
      }
    } catch (error) {
      console.error('Error setting tenant from path:', error)
    }
  }

  // 3. Handle specific redirections within tenant context
  if (tenantSlugFromParams) {
    // Redirect /t/[slug]/menu to /t/[slug]/ to avoid duplication and 404 confusion
    if (to.path.endsWith('/menu') || to.path.endsWith('/menu/')) {
      const targetPath = to.path.replace(/\/menu\/?$/, '') || `/t/${tenantSlugFromParams}/`
      return navigateTo({
        path: targetPath,
        query: to.query,
        replace: true
      })
    }
  }

  // 4. Fallback: If at a root legacy path and we have a tenant, redirect
  if (!tenantSlugFromParams && tenantStore.tenantSlug) {
    const rootPaths = ['/cart', '/checkout', '/orders', '/profile', '/favourites']
    if (rootPaths.some(p => to.path === p)) {
      return navigateTo({
        path: `/t/${tenantStore.tenantSlug}${to.path}`,
        query: to.query,
        replace: true
      })
    }
  }

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
