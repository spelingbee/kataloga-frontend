import { useAuth } from '~/composables/useAuth'
import { useTenantStore } from '~/stores/tenant'

export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side
  if (import.meta.server) return

  const { isAuthenticated, user, initializeAuth } = useAuth()
  const tenantStore = useTenantStore()

  // Initialize authentication if not already done
  if (!isAuthenticated.value) {
    await initializeAuth()
  }

  // Check if user is authenticated
  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
  }

  // Check if user has admin or manager role
  if (!user.value || !['ADMIN', 'MANAGER'].includes(user.value.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access Forbidden: Admin privileges required'
    })
  }

  // Ensure tenant is initialized for admin routes
  if (!tenantStore.currentTenant) {
    try {
      await tenantStore.initializeTenant()
    } catch (error) {
      console.error('Failed to initialize tenant in admin middleware:', error)
      
      // In multi-tenant mode, redirect to tenant selector
      if (tenantStore.isMultiTenant) {
        return navigateTo('/select-restaurant')
      }
    }
  }

  // Validate tenant access for admin operations
  // In multi-tenant mode, ensure a valid tenant is selected
  if (tenantStore.isMultiTenant && !tenantStore.currentTenant) {
    return navigateTo('/select-restaurant')
  }
})