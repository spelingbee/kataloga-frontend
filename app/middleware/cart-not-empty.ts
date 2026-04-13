import { useCartStore } from '../stores/cart'

export default defineNuxtRouteMiddleware(() => {
  const cartStore = useCartStore()

  // Check if cart is empty
  if (cartStore.isEmpty) {
    // Redirect to menu
    return navigateTo('/menu')
  }
})
