<template>
  <div class="layout-screen u-bg-background-dark u-text-neutral-20">
    <!-- Three-column responsive layout -->
    <div class="u-flex layout-screen--full u-overflow-hidden">
      <!-- Left Sidebar - Categories (hidden on mobile, shown on tablet+) -->
      <aside 
        :class="[
          'layout-sidebar',
          { 'layout-sidebar--hidden': !showSidebar }
        ]"
      >
        <AppSidebar />
      </aside>

      <!-- Main Content Area -->
      <main class="layout-main">
        <!-- Header -->
        <div class="layout-main__header">
          <AppHeader 
            @toggle-sidebar="toggleSidebar"
            @toggle-cart="toggleCart"
          />
        </div>
        
        <!-- Content -->
        <div class="layout-main__content">
          <!-- Main content -->
          <div class="layout-main__body">
            <slot />
          </div>
          
          <!-- Right Panel - Dish Details (hidden on mobile, shown on desktop) -->
          <aside 
            :class="[
              'layout-detail',
              { 'layout-detail--hidden': !showDetailPanel }
            ]"
          >
            <DishDetailPanel v-if="selectedDish" :dish="selectedDish" />
            <div v-else class="layout-detail__content">
              <AppText class="u-text-center">
                Select a dish to view details
              </AppText>
            </div>
          </aside>
        </div>
      </main>
    </div>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Stores
import { useUserStore } from '~/stores/user'
import { useMenuStore } from '~/stores/menu'

const userStore = useUserStore()
const menuStore = useMenuStore()

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
  
  // Auto-hide sidebar on tablet
  if (windowWidth.value >= 768 && windowWidth.value < 1024) {
    showSidebar.value = false
  }
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