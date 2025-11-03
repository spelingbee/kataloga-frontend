import { useNetworkStatus } from '~/composables/useNetworkStatus'

export default defineNuxtPlugin(() => {
  // Initialize network status monitoring on client side
  if (typeof window !== 'undefined') {
    const { checkNetworkStatus } = useNetworkStatus()
    
    // Perform initial network check
    nextTick(() => {
      checkNetworkStatus()
    })
    
    // Add global error handler for network errors
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Network error detected, checking connection status')
        checkNetworkStatus()
      }
    })
    
    // Add visibility change handler to check network when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Check network status when user returns to tab
        setTimeout(() => {
          checkNetworkStatus()
        }, 1000)
      }
    })
  }
})