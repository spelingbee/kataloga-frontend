<template>
  <header class="app-header">
    <!-- Left section -->
    <div class="app-header__left">
      <!-- Mobile menu button -->
      <BaseButton
        variant="ghost"
        size="sm"
        @click="$emit('toggle-sidebar')"
        class="app-header__menu-btn app-header__menu-btn--mobile"
        aria-label="Toggle menu"
      >
        <BaseIcon name="menu" size="md" />
      </BaseButton>

      <!-- Desktop sidebar toggle -->
      <BaseButton
        variant="ghost"
        size="sm"
        @click="$emit('toggle-sidebar')"
        class="app-header__menu-btn app-header__menu-btn--desktop"
        aria-label="Toggle sidebar"
      >
        <BaseIcon name="sidebar" size="md" />
      </BaseButton>

      <!-- Logo/Brand -->
      <NuxtLink to="/" class="app-header__logo">
        <img 
          v-if="tenantBranding?.logo" 
          :src="tenantBranding.logo" 
          :alt="tenantBranding.appName || appName"
          class="app-header__logo-image"
        />
        <BaseIcon v-else name="logo" size="lg" class="u-text-primary-red" />
        <AppHeading level="h1" size="heading-lg" class="app-header__brand">
          {{ tenantBranding?.appName || appName }}
        </AppHeading>
      </NuxtLink>
      
      <!-- Tenant Indicator (multi-tenant mode only) -->
      <div v-if="isMultiTenant && currentTenant" class="app-header__tenant-indicator">
        <BaseBadge variant="secondary" size="sm">
          {{ currentTenant.name }}
        </BaseBadge>
      </div>
    </div>

    <!-- Center section - Search (hidden on mobile) -->
    <div class="app-header__center">
      <MenuSearch />
    </div>

    <!-- Right section -->
    <div class="app-header__right">
      <!-- Mobile search button -->
      <BaseButton
        variant="ghost"
        size="sm"
        @click="openMobileSearch"
        class="app-header__search-btn"
        aria-label="Search"
      >
        <BaseIcon name="search" size="md" />
      </BaseButton>

      <!-- Notifications (web only) -->
      <BaseButton
        v-if="!isTelegram"
        variant="ghost"
        size="sm"
        @click="openNotifications"
        class="u-relative"
        aria-label="Notifications"
      >
        <BaseIcon name="bell" size="md" />
        <BaseBadge
          v-if="unreadNotifications > 0"
          :count="unreadNotifications"
          class="app-header__notification-badge"
        />
      </BaseButton>

      <!-- Cart button -->
      <BaseButton
        variant="ghost"
        size="sm"
        @click="$emit('toggle-cart')"
        class="u-relative"
        aria-label="Shopping cart"
      >
        <BaseIcon name="cart" size="md" />
        <BaseBadge
          v-if="cartItemCount > 0"
          :count="cartItemCount"
          class="app-header__cart-badge"
        />
      </BaseButton>

      <!-- User menu (web only) -->
      <div v-if="!isTelegram" class="app-header__user-menu">
        <BaseButton
          variant="ghost"
          size="sm"
          @click="toggleUserMenu"
          class="u-flex u-items-center u-gap-2"
          aria-label="User menu"
        >
          <BaseIcon name="user" size="md" />
          <span class="app-header__brand u-text-body-sm">{{ userName }}</span>
        </BaseButton>

        <!-- User dropdown menu -->
        <div
          v-if="showUserMenu"
          class="app-header__dropdown"
        >
          <NuxtLink
            to="/profile"
            class="app-header__dropdown-item"
            @click="closeUserMenu"
          >
            Profile
          </NuxtLink>
          <NuxtLink
            to="/orders"
            class="app-header__dropdown-item"
            @click="closeUserMenu"
          >
            Order History
          </NuxtLink>
          <NuxtLink
            to="/favourites"
            class="app-header__dropdown-item"
            @click="closeUserMenu"
          >
            Favourites
          </NuxtLink>
          <hr class="app-header__dropdown-divider">
          <button
            @click="logout"
            class="app-header__dropdown-item"
          >
            Logout
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile search overlay -->
    <div
      v-if="showMobileSearch"
      class="app-header__mobile-search"
    >
      <BaseButton
        variant="ghost"
        size="sm"
        @click="closeMobileSearch"
        aria-label="Close search"
      >
        <BaseIcon name="arrow-left" size="md" />
      </BaseButton>
      <div class="app-header__mobile-search-content">
        <MenuSearch @close="closeMobileSearch" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useUserStore } from '~/stores/user'
import { useTenantStore } from '~/stores/tenant'
import { useTenant } from '~/composables/useTenant'

// Emits
defineEmits<{
  'toggle-sidebar': []
  'toggle-cart': []
}>()

// Stores
const userStore = useUserStore()
const cartStore = useCartStore()
const tenantStore = useTenantStore()
const notificationStore = useNotificationStore()
const { $router } = useNuxtApp()

// Tenant composable
const { currentTenant, isMultiTenant, tenantBranding } = useTenant()

// Reactive state
const showUserMenu = ref(false)
const showMobileSearch = ref(false)

// Computed properties
const isTelegram = computed(() => userStore.platform === 'telegram')
const userName = computed(() => userStore.user?.name || 'Guest')
const cartItemCount = computed(() => cartStore.itemCount)
const unreadNotifications = computed(() => notificationStore.unreadCount)
const appName = computed(() => useRuntimeConfig().public.appName)

// Methods
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const openMobileSearch = () => {
  showMobileSearch.value = true
}

const closeMobileSearch = () => {
  showMobileSearch.value = false
}

const openNotifications = () => {
  $router.push('/notifications')
}

const logout = async () => {
  await userStore.logout()
  closeUserMenu()
  $router.push('/')
}

// Close dropdowns when clicking outside
onClickOutside(showUserMenu, () => {
  showUserMenu.value = false
})
</script>