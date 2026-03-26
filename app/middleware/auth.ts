export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()

  // If not authenticated, redirect to login with return path
  if (!authStore.isAuthenticated) {
    const redirectPath = encodeURIComponent(to.fullPath)
    return navigateTo(`/auth/login?redirect=${redirectPath}`)
  }
})