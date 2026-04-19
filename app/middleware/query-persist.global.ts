import { useTenantStore } from '~/stores/tenant'

/**
 * Global Middleware for Query Persistence
 * 
 * Ensures that critical query parameters (like 'tenant') are preserved 
 * during navigation between pages.
 */
export default defineNuxtRouteMiddleware((to, from) => {
  // Skip during server-side rendering to avoid unnecessary redirects
  if (import.meta.server) return

  const tenantStore = useTenantStore()
  
  // 1. Determine the tenant slug to persist
  const queryTenant = to.query.tenant as string | undefined
  const fromQueryTenant = from.query.tenant as string | undefined
  
  // Skip persistence on root path if no tenant is explicitly requested in current query
  // This allows the landing page to load without tenant context
  if (to.path === '/' && !queryTenant) {
    return
  }

  const tenant = queryTenant || fromQueryTenant || tenantStore.tenantSlug

  // 2. If we have a tenant but it's not in the target route, redirect with it
  if (tenant && queryTenant !== tenant) {
    // Only persist if we're not explicitly trying to clear it
    return navigateTo({
      path: to.path,
      query: {
        ...to.query,
        tenant: String(tenant)
      }
    }, { replace: true })
  }
})
