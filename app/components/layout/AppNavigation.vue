<template>
  <nav class="app-navigation" :class="navigationClasses">
    <div class="app-navigation__container">
      <NuxtLink
        v-for="item in navigationItems"
        :key="item.path"
        :to="tPath(item.path)"
        class="app-navigation__item"
        :class="{ 'app-navigation__item--active': isActive(item.path) }"
        @click="handleNavClick(item)"
      >
        <BaseIcon :name="item.icon" :size="props.variant === 'bottom' ? 'sm' : 'md'" class="app-navigation__icon" :aria-hidden="true" />
        <span class="app-navigation__label">
          {{ item.label }}
        </span>
        <BaseBadge
          v-if="item.badge && item.badgeCount > 0"
          :count="item.badgeCount"
          size="sm"
          variant="error"
          class="app-navigation__badge"
          :aria-label="`${item.badgeCount} ${item.label.toLowerCase()}`"
        />
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useNotificationStore } from '~/stores/notification'
import { useTelegram } from '~/composables/useTelegram'
import { useTenant } from '~/composables/useTenant'
import { useTerminology } from '~/composables/useTerminology'
import { useI18n } from 'vue-i18n'

interface NavigationItem {
  path: string
  icon: string
  label: string
  badge?: boolean
  badgeCount?: number
  disabled?: boolean
  hidden?: boolean
}

interface Props {
  variant?: 'bottom' | 'sidebar' | 'horizontal'
  items?: NavigationItem[]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'bottom',
  items: () => [],
})

// Stores
const cartStore = useCartStore()
const notificationStore = useNotificationStore()

// Router
const route = useRoute()
const router = useRouter()

const { t } = useI18n()
const telegram = useTelegram()
const { tPath } = useTenant()
const { catalogLabel, primaryIcon } = useTerminology()
const isTelegramApp = computed(() => telegram.isTelegram.value)

// Navigation items with dynamic badge counts
  const navigationItems = computed(() => {
    const defaultItems: NavigationItem[] = [
      {
        path: '/menu',
        icon: primaryIcon.value,
        label: catalogLabel.value,
        badge: false,
        badgeCount: 0,
      },
      {
        path: '/orders',
        icon: 'receipt',
        label: t('orders.title', 'Заказы'),
        badge: false,
        badgeCount: 0,
      },

      {
        path: '/checkout',
        icon: 'shopping-cart',
        label: t('cart.title', 'Корзина'),
        badge: true,
        badgeCount: 0,
      },
      {
        path: '/profile',
        icon: 'person',
        label: t('profile.title', 'Профиль'),
        badge: false,
        badgeCount: 0,
      },
    ]

  const items = props.items.length > 0 ? props.items : defaultItems.filter(i => !i.hidden)

  return items.map(item => ({
    ...item,
    badgeCount:
      item.path === '/checkout'
        ? cartStore.itemCount
        : item.path === '/orders'
          ? notificationStore.notifications.filter(n => n.type === 'order' && !n.isRead).length
          : item.badgeCount || 0,
  }))
})

// Navigation classes
const navigationClasses = computed(() => [`app-navigation--${props.variant}`])

// Methods
const isActive = (path: string) => {
  const dynamicPath = tPath(path)
  const currentPath = route.path.replace(/\/$/, '') // Remove trailing slash
  
  if (path === '/menu') {
    // Menu is active on its own path OR on the tenant home page
    const homePath = tPath('/').replace(/\/$/, '')
    return currentPath === dynamicPath || currentPath === homePath
  }
  
  if (path === '/') {
    return currentPath === dynamicPath
  }
  
  return currentPath.startsWith(dynamicPath)
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
  if (item.path === '/checkout' && cartStore.itemCount === 0) {
    // Show empty cart message or redirect to menu
    router.push(tPath('/menu'))
    return
  }

  // Normal navigation is handled by NuxtLink
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;
@use '../../assets/scss/abstracts/mixins' as *;
@use '../../assets/scss/tokens/radius' as *;

.app-navigation {
  background: var(--bg-primary);
  border-top: 1px solid var(--border-primary);

  &--bottom {
    position: fixed;
    bottom: $space-2; // Reduced from $space-4
    left: $space-4;
    right: $space-4;
    z-index: 1000;
    margin: 0 auto;
    max-width: 500px;
    padding-bottom: 0;
    border-radius: $radius-2xl;
    backdrop-filter: blur(20px);
    background: rgba(var(--bg-primary-rgb), 0.85);
    border: 1px solid var(--border-primary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);

    .app-navigation__container {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 2px 4px; // Extremely tight padding
    }

    .app-navigation__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      padding: 4px;
      flex: 1;
      min-width: 50px; // Smaller width
      text-decoration: none;
      color: var(--text-tertiary);
      transition: all $transition-base-ease;
      position: relative;

      &--active {
        color: var(--color-primary);

        .app-navigation__icon {
          color: var(--color-primary);
          transform: translateY(-2px);
        }

        .app-navigation__label {
          font-weight: $font-bold;
          color: var(--color-primary);
        }

        &::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--color-primary);
          box-shadow: 0 0 6px var(--color-primary);
        }
      }
    }

    .app-navigation__icon {
      font-size: 1.25rem;
      transition: all $transition-base-ease;
    }

    .app-navigation__label {
      font-size: 9px; // Even smaller text
      font-weight: $font-medium;
      text-align: center;
      line-height: 1.1;
      margin-top: -2px;
    }

    .app-navigation__badge {
      position: absolute;
      top: 0px;
      right: 0;
      transform: translate(40%);
      z-index: 10;
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
