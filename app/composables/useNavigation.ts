import { useRouter, useRoute } from 'vue-router'
import { useTenant } from './useTenant'

export function useNavigation() {
  const router = useRouter()
  const route = useRoute()
  const { tPath } = useTenant()

  /**
   * Smart back navigation.
   * If there is history, goes back.
   * Otherwise, redirects to the tenant's home page.
   */
  const goBack = () => {
    // In many browsers, window.history.length starts at 1 or 2.
    // However, if the user came from an external site, length is 1.
    // If they refreshed, it might be > 1 but we can't go "back" to a previous state easily.
    // Nuxt router usually handles this, but we can check if there's a previous route.
    
    // A simple check: if we are at the home page, do nothing.
    const isHome = route.path === '/' || route.path.endsWith('/') || route.path.split('/').length <= 3
    if (isHome) return

    // Use router.back() and if it doesn't navigate (e.g. no history), go to home.
    // Since router.back() is asynchronous and doesn't return a "success" boolean easily,
    // we can use a small hack or just trust the history check.
    
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(tPath('/'))
    }
  }

  return {
    goBack
  }
}
