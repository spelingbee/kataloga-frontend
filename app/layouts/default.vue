<template>
  <div class="layout-screen u-bg-background-dark u-text-neutral-20">
    <!-- Desktop Navigation Sidebar -->
    <AppNavbar class="u-hidden u-lg-block" />

    <!-- Main Content Area -->
    <main class="layout-main">
      <!-- Content -->
      <div class="layout-main__content">
        <slot />
      </div>
    </main>

    <!-- Mobile Navigation (bottom tabs on mobile) -->
    <nav class="mobile-navigation">
      <AppNavigation />
    </nav>

    <!-- Mobile Cart Drawer -->
    <CartDrawer 
      v-if="showCart" 
      class="u-lg-hidden"
      @close="toggleCart"
    />

    <!-- Mobile Category Sidebar -->
    <MobileCategorySidebar 
      v-if="showMobileSidebar" 
      class="u-lg-hidden"
      @close="toggleMobileSidebar"
    />

    <!-- Mobile Dish Detail Modal -->
    <DishDetailModal 
      v-if="selectedDish && isMobile" 
      :dish="selectedDish"
      class="u-xl-hidden"
      @close="clearSelectedDish"
    />

    <!-- Web Footer (only on web, not in Telegram) -->
    <AppFooter v-if="!isTelegram" class="u-hidden u-lg-block" />

    <!-- PWA Components -->
    <InstallPrompt />
    <UpdateNotification />
    <OfflineIndicator />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Stores
import { useUserStore } from '~/stores/user'
import { useMenuStore } from '~/stores/menu'
import { useTenantStore } from '~/stores/tenant'

const userStore = useUserStore()
const menuStore = useMenuStore()
const tenantStore = useTenantStore()

// Reactive state
const showSidebar = ref(true)
const showCart = ref(false)
const showMobileSidebar = ref(false)
const showDetailPanel = ref(true)
const windowWidth = ref(0)

// Computed properties
const isMobile = computed(() => windowWidth.value < 1024)
const isTelegram = computed(() => userStore.platform === 'telegram')
const selectedDish = computed(() => menuStore.selectedDish)
const tenantBranding = computed(() => tenantStore.tenantBranding)

// Apply tenant branding to document
watch(
  () => tenantBranding.value,
  (branding) => {
    if (branding && process.client) {
      // Update CSS variables for tenant colors
      document.documentElement.style.setProperty('--tenant-primary-color', branding.primaryColor)
      document.documentElement.style.setProperty('--tenant-secondary-color', branding.secondaryColor)
      
      // Update favicon
      if (branding.favicon) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
        link.type = 'image/x-icon'
        link.rel = 'shortcut icon'
        link.href = branding.favicon
        document.getElementsByTagName('head')[0].appendChild(link)
      }
      
      // Update page title
      if (branding.appName) {
        document.title = branding.appName
      }
    }
  },
  { immediate: true }
)

// Methods
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const toggleCart = () => {
  if (isMobile.value) {
    showCart.value = !showCart.value
  }
}

const toggleMobileSidebar = () => {
  showMobileSidebar.value = !showMobileSidebar.value
}

const clearSelectedDish = () => {
  menuStore.clearSelectedDish()
}

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

// Lifecycle
onMounted(() => {
  updateWindowWidth()
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

// Watch for route changes to close mobile overlays
const route = useRoute()
watch(() => route.path, () => {
  showCart.value = false
  showMobileSidebar.value = false
})
</script>

<style lang="scss" scoped>
@import '~/assets/scss/abstracts/variables';

.layout-screen {
  min-height: 100vh;
  display: flex;
}

.layout-main {
  flex: 1;
  margin-left: 0;
  width: 100%;
  
  @media (min-width: $breakpoint-lg) {
    // margin-left: 240px;  Width of navbar
  }

  &__content {
    max-width: 1400px;
    margin: 0 auto;
    padding: $spacing-xl $spacing-lg;
    width: 100%;

    @media (min-width: $breakpoint-md) {
      padding: $spacing-2xl $spacing-xl;
    }
  }
}

.mobile-navigation {
  @media (min-width: $breakpoint-lg) {
    display: none;
  }
}
</style>