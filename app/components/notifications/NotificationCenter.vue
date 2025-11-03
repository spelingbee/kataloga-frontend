<template>
  <div class="notification-center">
    <!-- Notification Bell Icon -->
    <div class="relative">
      <button
        class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        :class="{ 'text-blue-600': hasUnread }"
        @click="toggleNotifications"
      >
        <BaseIcon name="bell" class="w-6 h-6" />
        
        <!-- Unread Badge -->
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Notifications Dropdown -->
      <div
        v-if="showNotifications"
        class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
          <div class="flex space-x-2">
            <button
              v-if="unreadCount > 0"
              class="text-sm text-blue-600 hover:text-blue-800"
              @click="markAllAsRead"
            >
              Mark all read
            </button>
            <button
              class="text-sm text-gray-600 hover:text-gray-800"
              @click="clearAll"
            >
              Clear all
            </button>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="notifications.length === 0" class="p-4 text-center text-gray-500">
            No notifications
          </div>
          
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
            :class="{ 'bg-blue-50': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="flex items-start space-x-3">
              <!-- Icon -->
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="getNotificationIconClass(notification.type)"
                >
                  <BaseIcon :name="getNotificationIcon(notification.type)" class="w-4 h-4" />
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ notification.title }}
                </p>
                <p class="text-sm text-gray-600 mt-1">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-400 mt-2">
                  {{ formatTime(notification.timestamp) }}
                </p>
              </div>

              <!-- Unread Indicator -->
              <div v-if="!notification.isRead" class="flex-shrink-0">
                <div class="w-2 h-2 bg-blue-500 rounded-full"/>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-200">
          <NuxtLink
            to="/notifications"
            class="block text-center text-sm text-blue-600 hover:text-blue-800"
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
      class="fixed inset-0 z-40"
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
  // Mark as read
  markAsRead(notification.id)
  
  // Navigate based on notification type
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

const getNotificationIconClass = (type: string): string => {
  switch (type) {
    case 'order':
      return 'bg-green-100 text-green-600'
    case 'promotion':
      return 'bg-yellow-100 text-yellow-600'
    case 'system':
      return 'bg-blue-100 text-blue-600'
    default:
      return 'bg-gray-100 text-gray-600'
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

// Close notifications when clicking outside
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