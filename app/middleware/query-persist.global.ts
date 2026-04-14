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
  // Priority: 
  // - Target route query (already present)
  // - Current route query (propagating forward)
  // - Store (fallback)
  const tenant = to.query.tenant || from.query.tenant || tenantStore.tenantSlug

  // 2. If we have a tenant but it's not in the target route, redirect with it
  if (tenant && to.query.tenant !== tenant) {
    return navigateTo({
      path: to.path,
      query: {
        ...to.query,
        tenant: String(tenant)
      }
    }, { replace: true }) // Use replace to avoid polluting browser history with intermediate states
  }
})
