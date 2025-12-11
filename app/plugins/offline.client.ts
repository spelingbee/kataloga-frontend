export default defineNuxtPlugin(() => {
  // Initialize offline functionality on client side only
  if (typeof window !== 'undefined') {
    // Service worker registration is handled by @vite-pwa/nuxt
    // We just need to ensure offline cart is initialized
    
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('Cache updated:', event.data.url)
        }
      })
    }
    
    // Log offline capability status
    if ('serviceWorker' in navigator && 'caches' in window) {
      console.log('✓ Offline support enabled')
    } else {
      console.warn('⚠ Offline support not available in this browser')
    }
  }
})
