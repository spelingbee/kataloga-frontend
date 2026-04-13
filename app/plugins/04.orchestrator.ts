import { useTenantStore } from '~/stores/tenant'
import { useCartStore } from '~/stores/cart'
import { useMenuStore } from '~/stores/menu'
import { useUserStore } from '~/stores/user'

/**
 * Cross-Store Orchestrator Plugin
 * 
 * Handles complex side-effects and synchronization between different Pinia stores
 * to prevent circular dependencies and state pollution.
 * 
 * Pattern:
 * 1. Subscribe to store mutations/actions
 * 2. Execute cross-store logic in a centralized place
 * 3. Keep stores focused on their own state only
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Use a hook to ensure all stores are registered
  nuxtApp.hook('app:mounted', () => {
    console.log('🎻 [Orchestrator] app:mounted hook executing...')
    const tenantStore = useTenantStore()
    const cartStore = useCartStore()
    const menuStore = useMenuStore()
    const authStore = useUserStore()

    // 1. Sync Cart when Tenant changes
    // If tenant changes, we must reset the cart to prevent cross-tenant ordering
    watch(() => tenantStore.tenantSlug, async (newSlug, oldSlug) => {
      if (oldSlug && newSlug !== oldSlug) {
        console.log(`🔄 [Orchestrator] Tenant changed from ${oldSlug} to ${newSlug}. Resetting dependent stores...`)
        
        // Reset Cart
        cartStore.clearCart()
        
        // Reset Menu
        menuStore.categories = []
        menuStore.menuItems = []
        menuStore.currentCategory = null
        
        // Refetch Menu for new tenant
        await menuStore.fetchMenu()
        
        // Trigger haptic feedback if available (now in orchestrator!)
        try {
          const { cartActions } = useTelegramHaptic()
          cartActions.clearCart()
        } catch (e) {}
      }
    })

    // 2. Load Cart when User logs in
    // If user's auth status changes to authenticated, load their server-side cart
    watch(() => authStore.isAuthenticated, async (isAuth) => {
      if (isAuth) {
        console.log('👤 [Orchestrator] User authenticated. Syncing cart...')
        await cartStore.loadCartFromServer()
      }
    })

    // 3. Handle global auth errors
    // Centralized place to handle session expiration across all stores
    authStore.$onAction(({ name, onError }) => {
      if (name === 'fetchUserProfile' || name === 'login') {
        onError((error: any) => {
          if (error.status === 401) {
            console.warn('📡 [Orchestrator] Session expired. Redirecting to login...')
            // We can handle global redirects here
          }
        })
      }
    })

    console.log('🎻 [Orchestrator] Cross-Store Orchestrator initialized')
  })
})
