import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  
  // If user is authenticated, redirect to home page
  if (isAuthenticated.value) {
    const redirectTo = (to.query.redirect as string) || '/'
    return navigateTo(redirectTo)
  }
})
