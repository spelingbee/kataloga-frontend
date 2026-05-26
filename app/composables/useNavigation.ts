import { useRouter, useRoute } from 'vue-router'
import { useTenant } from './useTenant'

export function useNavigation() {
  const router = useRouter()
  const route = useRoute()
  const { tPath, tenantSlug } = useTenant()

  /**
   * Smart back navigation.
   * If there is history, goes back.
   * Otherwise, redirects to the tenant's home page.
   */
  const goBack = () => {
    const slug = tenantSlug.value
    const isHome = route.path === '/' || (slug && (route.path === `/t/${slug}` || route.path === `/t/${slug}/`))
    if (isHome) return

    if (typeof window !== 'undefined' && window.history.state && window.history.state.back) {
      router.back()
    } else {
      router.push(tPath('/'))
    }
  }

  return {
    goBack
  }
}
