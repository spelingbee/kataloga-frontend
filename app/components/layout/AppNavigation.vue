<template>
  <nav class="app-navigation" :class="navigationClasses">
    <div class="app-navigation__container">
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
          :aria-hidden="true"
        />
        <span class="app-navigation__label">
          {{ item.label }}
        </span>
        <BaseBadge
          v-if="item.badge && item.badgeCount > 0"
          :count="item.badgeCount"
          size="sm"
          class="app-navigation__badge"
          :aria-label="`${item.badgeCount} ${item.label.toLowerCase()}`"
        />
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface NavigationItem {
  path: string
  icon: string
  label: string
  badge?: boolean
  badgeCount?: number
  disabled?: boolean
}

interface Props {
  variant?: 'bottom' | 'sidebar' | 'horizontal'
  items?: NavigationItem[]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'bottom',
  items: () => []
})

// Stores
const cartStore = useCartStore()
const notificationStore = useNotificationStore()

// Router
const route = useRoute()
const router = useRouter()

// Default navigation items
const defaultNavigationItems: NavigationItem[] = [
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
    icon: 'shopping-cart',
    label: 'Cart',
    badge: true,
    badgeCount: 0
  },
  {
    path: '/orders',
    icon: 'receipt',
    label: 'Orders',
    badge: true,
    badgeCount: 0
  }
]

// Navigation items with dynamic badge counts
const navigationItems = computed(() => {
  const items = props.items.length > 0 ? props.items : defaultNavigationItems
  
  return items.map(item => ({
    ...item,
    badgeCount: item.path === '/cart' 
      ? cartStore.itemCount 
      : item.path === '/orders' 
        ? notificationStore.unreadCount 
        : item.badgeCount || 0
  }))
})

// Navigation classes
const navigationClasses = computed(() => [
  `app-navigation--${props.variant}`
])

// Methods
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const handleNavClick = (item: NavigationItem) => {
  if (item.disabled) {
    return
  }
  
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

<style scoped lang="scss">
@use '../../assets/scss/tokens' as *;
@use '../../assets/scss/abstracts/mixins' as *;

.app-navigation {
  background: var(--bg-primary);
  border-top: 1px solid var(--border-primary);
  
  // Bottom navigation (mobile)
  &--bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    padding-bottom: env(safe-area-inset-bottom);
    
    .app-navigation__container {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      max-width: 100%;
    }
    
    .app-navigation__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-2);
      min-width: 44px; // Touch target minimum
      min-height: 44px;
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--text-secondary);
      transition: all var(--transition-base);
      position: relative;
      
      // Touch-friendly interaction
      @media (hover: hover) {
        &:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      &--active {
        color: var(--color-primary);
        
        .app-navigation__icon {
          color: var(--color-primary);
        }
      }
    }
    
    .app-navigation__icon {
      font-size: 1.25rem;
      transition: color var(--transition-base);
    }
    
    .app-navigation__label {
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      text-align: center;
      line-height: 1;
    }
    
    .app-navigation__badge {
      position: absolute;
      top: 0;
      right: 0;
      transform: translate(25%, -25%);
    }
  }
  
  // Sidebar navigation (tablet/desktop)
  &--sidebar {
    width: 240px;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    border-right: 1px solid var(--border-primary);
    border-top: none;
    
    .app-navigation__container {
      display: flex;
      flex-direction: column;
      padding: var(--space-6) var(--space-4);
      gap: var(--space-2);
    }
    
    .app-navigation__item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      min-height: 44px;
      border-radius: var(--radius-lg);
      text-decoration: none;
      color: var(--text-secondary);
      transition: all var(--transition-base);
      position: relative;
      
      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
      
      &--active {
        background: var(--color-primary);
        color: white;
        
        .app-navigation__icon {
          color: white;
        }
      }
    }
    
    .app-navigation__icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    
    .app-navigation__label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      flex: 1;
    }
    
    .app-navigation__badge {
      margin-left: auto;
    }
  }
  
  // Horizontal navigation (desktop header)
  &--horizontal {
    border-bottom: 1px solid var(--border-primary);
    border-top: none;
    
    .app-navigation__container {
      display: flex;
      align-items: center;
      gap: var(--space-6);
      padding: var(--space-4) var(--space-6);
      max-width: 1280px;
      margin: 0 auto;
    }
    
    .app-navigation__item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      min-height: 44px;
      border-radius: var(--radius-lg);
      text-decoration: none;
      color: var(--text-secondary);
      transition: all var(--transition-base);
      position: relative;
      
      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
      
      &--active {
        color: var(--color-primary);
        background: var(--bg-secondary);
        
        .app-navigation__icon {
          color: var(--color-primary);
        }
      }
    }
    
    .app-navigation__icon {
      font-size: 1.125rem;
    }
    
    .app-navigation__label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
    }
    
    .app-navigation__badge {
      margin-left: var(--space-1);
    }
  }
}

// Responsive behavior
@include mobile-only {
  .app-navigation--sidebar,
  .app-navigation--horizontal {
    display: none;
  }
}

@include tablet-up {
  .app-navigation--bottom {
    display: none;
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .app-navigation {
    border-color: ButtonText;
    
    .app-navigation__item {
      border: 1px solid transparent;
      
      &:focus {
        border-color: Highlight;
        outline: 2px solid Highlight;
        outline-offset: 2px;
      }
      
      &--active {
        border-color: Highlight;
      }
    }
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .app-navigation__item {
    transition: none;
    
    &:active {
      transform: none;
    }
  }
}
</style>