<template>
  <header class="app-header">
    <!-- Left section -->
    <div class="app-header__left">
      <!-- Back button (for non-telegram) -->
      <BaseButton
        v-if="!isTelegramApp && !isHomePage"
        variant="ghost"
        size="sm"
        class="app-header__back-btn"
        aria-label="Back"
        @click="$router.back()"
      >
        <BaseIcon name="arrow-left" size="md" />
      </BaseButton>

      <!-- Mobile menu button -->
      <BaseButton
        v-if="isHomePage"
        variant="ghost"
        size="sm"
        class="app-header__menu-btn app-header__menu-btn--mobile"
        aria-label="Toggle menu"
        @click="$emit('toggle-sidebar')"
      >
        <BaseIcon name="menu" size="md" />
      </BaseButton>

      <!-- Desktop sidebar toggle -->
      <BaseButton
        variant="ghost"
        size="sm"
        class="app-header__menu-btn app-header__menu-btn--desktop"
        aria-label="Toggle sidebar"
        @click="$emit('toggle-sidebar')"
      >
        <BaseIcon name="sidebar" size="md" />
      </BaseButton>

      <!-- Logo/Brand -->
      <NuxtLink :to="tPath('/')" class="app-header__logo">
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
        class="app-header__search-btn"
        aria-label="Search"
        @click="openMobileSearch"
      >
        <BaseIcon name="search" size="md" />
      </BaseButton>

      <!-- Notifications (web only) -->
      <BaseButton
        v-if="!isTelegramApp"
        variant="ghost"
        size="sm"
        class="u-relative"
        aria-label="Notifications"
        @click="openNotifications"
      >
        <BaseIcon name="bell" size="md" />
        <BaseBadge
          v-if="unreadNotifications > 0"
          :count="unreadNotifications"
          class="app-header__notification-badge"
        />
      </BaseButton>

      <!-- Language Switcher -->
      <LanguageSwitcher class="app-header__language-switcher" />

      <!-- Cart button -->
      <BaseButton
        variant="ghost"
        size="sm"
        class="u-relative"
        aria-label="Shopping cart"
        @click="$emit('toggle-cart')"
      >
        <BaseIcon name="cart" size="md" />
        <BaseBadge v-if="cartItemCount > 0" :count="cartItemCount" class="app-header__cart-badge" />
      </BaseButton>

      <!-- User menu (visible in both web and Telegram) -->
      <div class="app-header__right-actions">
        <!-- Guest Auth Buttons -->
        <div v-if="!userStore.isAuthenticated" class="u-flex u-items-center u-gap-2">
          <NuxtLink to="/auth/login" class="app-header__link">
            <BaseButton variant="ghost" size="sm">Войти</BaseButton>
          </NuxtLink>
          <NuxtLink to="/auth/register" class="app-header__link">
            <BaseButton variant="primary" size="sm">Регистрация</BaseButton>
          </NuxtLink>
        </div>

        <!-- Logged In User Menu -->
        <div v-else class="app-header__user-menu">
        <BaseButton
          variant="ghost"
          size="sm"
          class="u-flex u-items-center u-gap-2"
          aria-label="User menu"
          @click="toggleUserMenu"
        >
          <BaseIcon name="user" size="md" />
          <span class="app-header__brand u-text-body-sm">{{ userName }}</span>
        </BaseButton>

        <!-- User dropdown menu -->
        <div v-if="showUserMenu" class="app-header__dropdown">
          <NuxtLink :to="tPath('/profile')" class="app-header__dropdown-item" @click="closeUserMenu">
            {{ $t('common.profile', 'Профиль') }}
          </NuxtLink>
          <NuxtLink :to="tPath('/orders')" class="app-header__dropdown-item" @click="closeUserMenu">
            {{ $t('common.order_history', 'История заказов') }}
          </NuxtLink>

          <hr class="app-header__dropdown-divider" />
          <button class="app-header__dropdown-item" @click="logout">
            {{ $t('common.logout', 'Выйти') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile search overlay -->
    <div v-if="showMobileSearch" class="app-header__mobile-search">
      <BaseButton variant="ghost" size="sm" aria-label="Close search" @click="closeMobileSearch">
        <BaseIcon name="arrow-left" size="md" />
      </BaseButton>
      <div class="app-header__mobile-search-content">
        <MenuSearch @close="closeMobileSearch" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, useRuntimeConfig, useNuxtApp } from '#app'
import { useUserStore } from '~/stores/user'
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'
import { useTenantStore } from '~/stores/tenant'
import { useAnimations } from '~/composables/useAnimations'
import { useResponsive } from '~/composables/useResponsive'
import SkipLinks from '~/components/base/SkipLinks.vue'
import { useHead } from '#app'
import { useI18n } from 'vue-i18n'
import { useTenant } from '~/composables/useTenant'
import { useTelegram } from '~/composables/useTelegram'
import { onClickOutside } from '@vueuse/core'
import { useNotificationStore } from '~/stores/notification'
import LanguageSwitcher from '../base/LanguageSwitcher.vue'

// Emits
defineEmits<{
  'toggle-sidebar': []
  'toggle-cart': []
}>()

// Composables
const { currentTenant, isMultiTenant, tenantBranding, tPath } = useTenant()
const telegram = useTelegram()

// Stores
const userStore = useUserStore()
const cartStore = useCartStore()
const tenantStore = useTenantStore()
const notificationStore = useNotificationStore()
const { $router } = useNuxtApp()

// Reactive state
const showUserMenu = ref(false)
const showMobileSearch = ref(false)

// Computed properties
const isTelegramApp = computed(() => telegram.isTelegram.value)
const isHomePage = computed(() => useRoute().path === '/')
const userName = computed(() => userStore.user?.name || 'Гость')
const cartItemCount = computed(() => cartStore.itemCount)
const unreadNotifications = computed(() => notificationStore.unreadCount)
const appName = computed(() => useRuntimeConfig().public.appName)
const { locale } = useI18n()

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
  $router.push(tPath('/notifications'))
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
