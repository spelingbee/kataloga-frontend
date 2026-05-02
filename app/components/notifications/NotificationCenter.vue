<template>
  <div class="notification-center">
    <!-- Notification Bell Icon -->
    <div class="notification-center__trigger">
      <button
        :class="[
          'notification-center__button',
          { 'notification-center__button--active': hasUnread }
        ]"
        @click="toggleNotifications"
      >
        <BaseIcon name="bell" size="md" />
        
        <!-- Unread Badge -->
        <span
          v-if="unreadCount > 0"
          class="notification-center__badge"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Notifications Dropdown -->
      <div
        v-if="showNotifications"
        class="notification-center__dropdown"
        @click.stop
      >
        <!-- Header -->
        <div class="notification-center__header">
          <h3 class="notification-center__title">Notifications</h3>
          <div class="notification-center__header-actions">
            <button
              v-if="unreadCount > 0"
              class="notification-center__action notification-center__action--primary"
              @click="markAllAsRead"
            >
              Mark all read
            </button>
            <button
              class="notification-center__action notification-center__action--secondary"
              @click="clearAll"
            >
              Clear all
            </button>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="notification-center__list">
          <div v-if="notifications.length === 0" class="notification-center__empty">
            No notifications
          </div>
          
          <div
            v-for="notification in notifications"
            :key="notification.id"
            :class="[
              'notification-center__item',
              { 'notification-center__item--unread': !notification.isRead }
            ]"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-center__item-content">
              <!-- Icon -->
              <div class="notification-center__item-icon-wrapper">
                <div
                  :class="[
                    'notification-center__item-icon',
                    `notification-center__item-icon--${notification.type}`
                  ]"
                >
                  <BaseIcon :name="getNotificationIcon(notification.type)" size="sm" />
                </div>
              </div>

              <!-- Content -->
              <div class="notification-center__item-text">
                <p class="notification-center__item-title">
                  {{ notification.title }}
                </p>
                <p class="notification-center__item-message">
                  {{ notification.message }}
                </p>
                <p class="notification-center__item-time">
                  {{ formatTime(notification.timestamp) }}
                </p>
              </div>

              <!-- Unread Indicator -->
              <div v-if="!notification.isRead" class="notification-center__item-indicator">
                <div class="notification-center__item-dot"/>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="notification-center__footer">
          <NuxtLink
            to="/notifications"
            class="notification-center__view-all"
            @click="showNotifications = false"
          >
            View all notifications
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Click outside to close -->
    <div
      v-if="showNotifications"
      class="notification-center__overlay"
      @click="showNotifications = false"
    />
  </div>
</template>

<script setup lang="ts">
interface InAppNotification {
  id: string
  type: 'order' | 'promotion' | 'system'
  title: string
  message: string
  data?: any
  timestamp: string
  isRead: boolean
}

const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications()
const router = useRouter()

const showNotifications = ref(false)

const hasUnread = computed(() => unreadCount.value > 0)

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const handleNotificationClick = (notification: InAppNotification) => {
  markAsRead(notification.id)
  
  let route = '/notifications'
  
  switch (notification.type) {
    case 'order':
      if (notification.data?.orderId) {
        route = `/orders/${notification.data.orderId}`
      } else {
        route = '/orders'
      }
      break
    case 'promotion':
      route = '/promotions'
      break
    default:
      route = '/notifications'
  }
  
  router.push(route)
  showNotifications.value = false
}

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'order':
      return 'shopping-bag'
    case 'promotion':
      return 'gift'
    case 'system':
      return 'information-circle'
    default:
      return 'bell'
  }
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `${days}d ago`
  }
}

onMounted(() => {
  const handleClickOutside = (event: Event) => {
    const target = event.target as Element
    if (!target.closest('.notification-center')) {
      showNotifications.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style lang="scss" scoped>


.notification-center {
  position: relative;
}

.notification-center__trigger {
  position: relative;
}

.notification-center__button {
  position: relative;
  padding: $space-2;
  color: #4b5563;
  background: none;
  border: none;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    color: #111827;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3b82f6;
  }

  &--active {
    color: #2563eb;
  }
}

.notification-center__badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: #ef4444;
  color: white;
  font-size: $text-xs;
  border-radius: $radius-full;
  height: 1.25rem;
  width: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-center__dropdown {
  position: absolute;
  right: 0;
  margin-top: $space-2;
  width: 20rem;
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  border: 1px solid #e5e7eb;
  z-index: 50;
}

.notification-center__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-6;
  border-bottom: 1px solid #e5e7eb;
}

.notification-center__title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: #111827;
}

.notification-center__header-actions {
  display: flex;
  gap: $space-2;
}

.notification-center__action {
  font-size: $text-sm;
  background: none;
  border: none;
  cursor: pointer;
  transition: color $transition-base;

  &--primary {
    color: #2563eb;

    &:hover {
      color: #1d4ed8;
    }
  }

  &--secondary {
    color: #4b5563;

    &:hover {
      color: #1f2937;
    }
  }
}

.notification-center__list {
  max-height: 24rem;
  overflow-y: auto;
}

.notification-center__empty {
  padding: $space-6;
  text-align: center;
  color: #6b7280;
}

.notification-center__item {
  padding: $space-6;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background $transition-base;

  &:hover {
    background: #f9fafb;
  }

  &--unread {
    background: #eff6ff;
  }
}

.notification-center__item-content {
  display: flex;
  align-items: flex-start;
  gap: $space-4;
}

.notification-center__item-icon-wrapper {
  flex-shrink: 0;
}

.notification-center__item-icon {
  width: 2rem;
  height: 2rem;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;

  &--order {
    background: #d1fae5;
    color: #059669;
  }

  &--promotion {
    background: #fef3c7;
    color: #d97706;
  }

  &--system {
    background: #dbeafe;
    color: #2563eb;
  }
}

.notification-center__item-text {
  flex: 1;
  min-width: 0;
}

.notification-center__item-title {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: #111827;
}

.notification-center__item-message {
  font-size: $text-sm;
  color: #4b5563;
  margin-top: $space-1;
}

.notification-center__item-time {
  font-size: $text-xs;
  color: #9ca3af;
  margin-top: $space-2;
}

.notification-center__item-indicator {
  flex-shrink: 0;
}

.notification-center__item-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #3b82f6;
  border-radius: $radius-full;
}

.notification-center__footer {
  padding: $space-6;
  border-top: 1px solid #e5e7eb;
}

.notification-center__view-all {
  display: block;
  text-align: center;
  font-size: $text-sm;
  color: #2563eb;
  text-decoration: none;
  transition: color $transition-base;

  &:hover {
    color: #1d4ed8;
  }
}

.notification-center__overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
}
</style>
