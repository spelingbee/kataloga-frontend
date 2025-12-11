export default defineNuxtRouteMiddleware((to, from) => {
  const cartStore = useCartStore()

  // Check if cart is empty
  if (cartStore.isEmpty) {
    // Redirect to cart page with a message
    return navigateTo('/cart')
  }
})
