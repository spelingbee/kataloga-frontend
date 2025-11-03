import { useAuth } from '~/composables/useAuth'
import { useTelegram } from '~/composables/useTelegram'

export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side
  if (import.meta.server) return

  const { isAuthenticated, initializeAuth, user } = useAuth()
  const { isTelegram } = useTelegram()

  // Initialize authentication on first load
  if (!isAuthenticated.value && !isTelegram.value) {
    await initializeAuth()
  }

  // Define protected routes with role requirements
  const protectedRoutes = [
    { path: '/profile', roles: ['CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF'] },
    { path: '/orders', roles: ['CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF'] },
    { path: '/favourites', roles: ['CUSTOMER', 'ADMIN', 'MANAGER', 'STAFF'] },
    { path: '/admin', roles: ['ADMIN', 'MANAGER'] },
    { path: '/management', roles: ['ADMIN', 'MANAGER', 'STAFF'] }
  ]

  // Check if current route requires authentication
  const matchedRoute = protectedRoutes.find(route => to.path.startsWith(route.path))

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