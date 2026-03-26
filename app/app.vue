<template>
  <div id="app" class="app-root">
    <!-- Skip Links for Keyboard Navigation -->
    <SkipLinks />
    
    <!-- Network Status Indicator -->
    <NetworkStatusIndicator position="top" :auto-hide="true" :auto-hide-delay="5000" />
    
    <NuxtLayout>
      <NuxtRouteAnnouncer />
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from './stores/user'
import { useMenuStore } from './stores/menu'
import { useFavoritesStore } from './stores/favorites'
import { useCartStore } from '~/stores/cart'
import { useTenantStore } from '~/stores/tenant'
import { useTenantUrlWatcher } from '~/composables/useTenant'
import { useOfflineCart } from '~/composables/useOfflineCart'
import { useAnimations } from '~/composables/useAnimations'
import { useResponsive } from '~/composables/useResponsive'
import NetworkStatusIndicator from '~/components/base/NetworkStatusIndicator.vue'
import SkipLinks from '~/components/base/SkipLinks.vue'

// Initialize stores on app startup
const userStore = useUserStore()
const cartStore = useCartStore()
const menuStore = useMenuStore()
const favoritesStore = useFavoritesStore()
const tenantStore = useTenantStore()

// Initialize tenant system and URL watcher
useTenantUrlWatcher()

// Initialize offline functionality
const { initializeOfflineCart } = useOfflineCart()

// Initialize animations and responsive utilities
const { pageTransition } = useAnimations()
const { deviceInfo } = useResponsive()

// Initialize i18n at the top level
const { locale } = useI18n()

// Set viewport meta tags for responsive design
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes' },
    { name: 'theme-color', content: '#1a1a1a' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'format-detection', content: 'telephone=no' },
  ],
  htmlAttrs: {
    lang: computed(() => locale.value),
  },
  bodyAttrs: {
    class: computed(() => {
      const classes = []
      if (deviceInfo.value.isMobile) classes.push('is-mobile')
      if (deviceInfo.value.isTablet) classes.push('is-tablet')
      if (deviceInfo.value.isDesktop) classes.push('is-desktop')
      if (deviceInfo.value.isTouch) classes.push('is-touch')
      if (deviceInfo.value.prefersReducedMotion) classes.push('prefers-reduced-motion')
      return classes.join(' ')
    }),
  },
})

// Initialize user and restore cart on app start
onMounted(async () => {
  await userStore.initializeUser()
  cartStore._restoreFromStorage()
  favoritesStore.initializeFavorites()
  
  // Initialize offline cart functionality
  initializeOfflineCart()
})
</script>

<style lang="scss">
// Global app styles
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// Touch device optimizations
.is-touch {
  // Disable hover effects on touch devices
  * {
    -webkit-tap-highlight-color: transparent;
  }
  
  // Improve scrolling on iOS
  -webkit-overflow-scrolling: touch;
}

// Mobile optimizations
.is-mobile {
  // Optimize font rendering on mobile
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Reduced motion support
.prefers-reduced-motion {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
