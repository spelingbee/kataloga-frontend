<template>
  <div id="app" class="app-root">
    <!-- Skip Links for Keyboard Navigation -->
    <SkipLinks />

    <NuxtLayout>
      <NuxtRouteAnnouncer />
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'
import { useTenantStore } from '~/stores/tenant'
import { useAnimations } from '~/composables/useAnimations'
import { useResponsive } from '~/composables/useResponsive'
import SkipLinks from '~/components/base/SkipLinks.vue'
import { onMounted, computed } from 'vue'
import { useHead, useRuntimeConfig, useRoute } from '#app'
import { useI18n } from 'vue-i18n'
import { useTelegram } from '~/composables/useTelegram'
import { useNavigation } from '~/composables/useNavigation'
import { watch } from 'vue'

// Initialize stores on app startup
const userStore = useUserStore()
const cartStore = useCartStore()
const menuStore = useMenuStore()
const tenantStore = useTenantStore()

// Initialize animations and responsive utilities
const { pageTransition } = useAnimations()
const { deviceInfo } = useResponsive()

// Initialize i18n at the top level
const { locale } = useI18n()

// Telegram Back Button Sync
const { isTelegram, showBackButton, hideBackButton } = useTelegram()
const { goBack } = useNavigation()
const route = useRoute()

if (process.client) {
  watch(() => route.path, (newPath) => {
    if (isTelegram.value) {
      // Check if we are on a "home" page (root or tenant root)
      // Tenant root looks like /t/[slug]
      const pathParts = newPath.split('/').filter(Boolean)
      const isHome = newPath === '/' || (pathParts.length === 2 && pathParts[0] === 't')
      
      if (isHome) {
        hideBackButton()
      } else {
        showBackButton(goBack)
      }
    }
  }, { immediate: true })
}

// Set viewport meta tags for responsive design
useHead({
  meta: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
    },
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
  console.log('[App] 🚀 onMounted - initialization sequence started')

  try {
    console.log('[App] 🏢 Initializing tenant...')
    await tenantStore.initializeTenant()
    console.log('[App] ✅ Tenant initialization complete')

    console.log('[App] 📥 Restoring cart...')
    cartStore.restoreCart()

    console.log('[App] 📥 Initializing favorites...')
    menuStore.initializeFavourites()

    console.log('[App] 📥 Initializing user data...')
    await userStore.initializeUser()
    console.log('[App] ✅ User initialization complete')
  } catch (error) {
    console.error('[App] ❌ Initialization failed:', error)
  }

  console.log('[App] ✨ onMounted - sequence complete')
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
