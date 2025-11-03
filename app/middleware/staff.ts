export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side
  if (import.meta.server) return

  const { isAuthenticated, user, initializeAuth } = useAuth()

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

  // Check if user has staff, manager, or admin role
  if (!user.value || !['ADMIN', 'MANAGER', 'STAFF'].includes(user.value.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access Forbidden: Staff privileges required'
    })
  }
})