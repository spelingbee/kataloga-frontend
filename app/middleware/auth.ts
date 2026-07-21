import { useAuth } from '~/composables/useAuth'
import { useTelegram } from '~/composables/useTelegram'
import { useUserStore } from '~/stores/user'
import { useTenantStore } from '~/stores/tenant'

export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side
  if (import.meta.server) return

  const { isAuthenticated, initializeAuth, user } = useAuth()
  const { isTelegram } = useTelegram()
  const tenantStore = useTenantStore()

  // Initialize authentication on first load
  // Always initialize auth to ensure tokens are picked up from storage
  await initializeAuth()

  // Ensure tenant is initialized for tenant-specific routes
  const tenantSpecificRoutes = ['/orders', '/favourites', '/menu', '/cart', '/checkout']
  const isTenantSpecificRoute = tenantSpecificRoutes.some(route => to.path.startsWith(route))
  
  if (isTenantSpecificRoute && !tenantStore.currentTenant) {
    try {
      await tenantStore.initializeTenant()
    } catch (error) {
      console.error('Failed to initialize tenant in auth middleware:', error)
    }
  }

  // Define protected routes with role requirements
  const protectedRoutes = [
    { path: '/profile', roles: ['CLIENT', 'MEMBER', 'TENANT_STAFF', 'ADMIN', 'TENANT_ADMIN', 'OWNER', 'SUPER_ADMIN'] },
    { path: '/orders', roles: ['CLIENT', 'MEMBER', 'TENANT_STAFF', 'ADMIN', 'TENANT_ADMIN', 'OWNER', 'SUPER_ADMIN'] },
    { path: '/favourites', roles: ['CLIENT', 'MEMBER', 'TENANT_STAFF', 'ADMIN', 'TENANT_ADMIN', 'OWNER', 'SUPER_ADMIN'] },
    { path: '/admin', roles: ['ADMIN', 'TENANT_ADMIN', 'OWNER', 'SUPER_ADMIN'] },
    { path: '/management', roles: ['MEMBER', 'TENANT_STAFF', 'ADMIN', 'TENANT_ADMIN', 'OWNER', 'SUPER_ADMIN'] }
  ]

  // Check if current route requires authentication
  // Use a more robust check that handles /t/:slug/ prefix
  const matchedRoute = protectedRoutes.find(route => {
    // Exact match for root paths (non-tenant)
    if (to.path === route.path || to.path.startsWith(`${route.path}/`)) {
      return true
    }
    // Match tenant-prefixed paths: /t/[slug]/path
    const tenantPattern = new RegExp(`^/t/[^/]+${route.path}(/|$)`)
    return tenantPattern.test(to.path)
  })

  if (matchedRoute) {
    // In Telegram, users are automatically authenticated
    if (isTelegram.value) {
      return
    }

    // For web users, check authentication
    if (!isAuthenticated.value) {
      // Redirect to login page with return URL
      return navigateTo({
        path: '/auth/login',
        query: { redirect: to.fullPath }
      })
    }

    // Check user role permissions
    if (user.value && matchedRoute.roles.length > 0) {
      const userRole = user.value.role
      if (!matchedRoute.roles.includes(userRole)) {
        // User doesn't have required role, redirect to unauthorized page or home
        throw createError({
          statusCode: 403,
          statusMessage: 'Access Forbidden: Insufficient permissions'
        })
      }
    }
  }

  // Handle auth pages redirect for authenticated users
  const authPages = ['/auth/login', '/auth/register']
  if (authPages.includes(to.path) && isAuthenticated.value) {
    const redirectTo = (to.query.redirect as string) || '/'
    return navigateTo(redirectTo)
  }
})
