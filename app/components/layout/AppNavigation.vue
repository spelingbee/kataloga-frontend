<template>
  <!-- Mobile bottom navigation -->
  <div class="app-navigation">
    <nav class="app-navigation__nav">
      <NuxtLink
        v-for="item in navigationItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'app-navigation__item',
          { 'app-navigation__item--active': isActive(item.path) }
        ]"
        @click="handleNavClick(item)"
      >
        <BaseIcon 
          :name="item.icon" 
          size="md" 
          class="app-navigation__icon"
        />
        <span class="app-navigation__label">
          {{ item.label }}
        </span>
        <BaseBadge
          v-if="item.badge && item.badgeCount > 0"
          :count="item.badgeCount"
          size="sm"
          class="app-navigation__badge"
        />
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '~/stores/cart'

// Stores
const cartStore = useCartStore()
const notificationStore = useNotificationStore()

// Router
const route = useRoute()
const router = useRouter()

// Navigation items
const navigationItems = computed(() => [
  {
    path: '/',
    icon: 'home',
    label: 'Home',
    badge: false,
    badgeCount: 0
  },
  {
    path: '/menu',
    icon: 'menu-book',
    label: 'Menu',
    badge: false,
    badgeCount: 0
  },
  {
    path: '/favourites',
    icon: 'heart',
    label: 'Favourites',
    badge: false,
    badgeCount: 0
  },
  {
    path: '/cart',
    icon: 'cart',
    label: 'Cart',
    badge: true,
    badgeCount: cartStore.itemCount
  },
  {
    path: '/orders',
    icon: 'receipt',
    label: 'Orders',
    badge: true,
    badgeCount: notificationStore.unreadCount
  }
])

// Methods
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const handleNavClick = (item: any) => {
  // Add haptic feedback for mobile
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
  
  // Handle special navigation cases
  if (item.path === '/cart' && cartStore.itemCount === 0) {
    // Show empty cart message or redirect to menu
    router.push('/menu')
    return
  }
  
  // Normal navigation is handled by NuxtLink
}
</script>

