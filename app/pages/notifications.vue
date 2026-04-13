<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-3 mb-4">
        <BaseIcon name="bell" size="lg" class="text-primary-orange" />
        <AppHeading level="h1" size="display-md" class="text-white">
          Notifications
        </AppHeading>
      </div>
      <AppText size="body-lg" class="text-neutral-20">
        Stay updated with your orders and special offers
      </AppText>
    </div>

    <!-- Push Notification Settings -->
    <div class="px-6 mb-8">
      <PushNotificationSettings />
    </div>

    <!-- Filter Options -->
    <div class="px-6 mb-8">
      <div class="flex flex-wrap gap-2">
        <BaseButton
          :variant="activeFilter === 'all' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('all')"
        >
          All ({{ notifications.length }})
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'unread' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('unread')"
        >
          Unread ({{ unreadCount }})
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'order' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('order')"
        >
          Orders
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'promotion' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('promotion')"
        >
          Promotions
        </BaseButton>
        <BaseButton
          :variant="activeFilter === 'system' ? 'primary' : 'secondary'"
          size="sm"
          @click="setFilter('system')"
        >
          System
        </BaseButton>
      </div>
      
      <div class="flex items-center gap-4 mt-4">
        <BaseButton 
          variant="ghost" 
          size="sm"
          :disabled="unreadCount === 0"
          @click="markAllAsRead"
        >
          <BaseIcon name="check-circle" size="sm" class="mr-2" />
          Mark All Read
        </BaseButton>
        <BaseButton 
          variant="ghost" 
          size="sm"
          :disabled="notifications.length === 0"
          @click="clearAllNotifications"
        >
          <BaseIcon name="trash" size="sm" class="mr-2" />
          Clear All
        </BaseButton>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="px-6">
      <NotificationList
        :notifications="filteredNotifications"
        :loading="notificationStore.loading"
        @click="handleNotificationClick"
      />

      <!-- Empty State with Filter -->
      <div v-if="!notificationStore.loading && filteredNotifications.length === 0 && activeFilter !== 'all'" class="text-center py-16">
        <BaseIcon name="filter" size="4xl" class="text-neutral-80 mx-auto mb-6" />
        <h3 class="text-white text-xl font-semibold mb-4">
          No {{ activeFilter }} notifications
        </h3>
        <p class="text-neutral-20 mb-8 max-w-md mx-auto">
          You don't have any {{ activeFilter }} notifications at the moment.
        </p>
        <BaseButton 
          variant="secondary"
          @click="setFilter('all')"
        >
          View All Notifications
        </BaseButton>
      </div>

      <!-- Load More -->
      <div v-if="hasMoreNotifications && filteredNotifications.length > 0" class="text-center mt-8">
        <BaseButton 
          variant="secondary"
          :disabled="loadingMore"
          @click="loadMoreNotifications"
        >
          <BaseIcon 
            v-if="loadingMore"
            name="loader" 
            size="sm" 
            class="mr-2 animate-spin" 
          />
          Load More Notifications
        </BaseButton>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="px-6 py-8 mt-12 border-t border-neutral-80/20">
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink to="/orders">
          <BaseButton variant="secondary">
            <BaseIcon name="receipt" size="sm" class="mr-2" />
            View Orders
          </BaseButton>
        </NuxtLink>
        <NuxtLink to="/promotions">
          <BaseButton variant="secondary">
            <BaseIcon name="tag" size="sm" class="mr-2" />
            View Promotions
          </BaseButton>
        </NuxtLink>
        <BaseButton 
          variant="ghost"
          @click="requestNotificationPermission"
        >
          <BaseIcon name="bell" size="sm" class="mr-2" />
          Enable Push Notifications
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/types'
import { usePushNotifications } from '~/composables/usePushNotifications'

// Stores
import { useNotificationStore } from '~/stores/notification'
import PushNotificationSettings from '../components/notifications/PushNotificationSettings.vue'
import AppHeading from '../components/base/AppHeading.vue'
import AppText from '../components/base/AppText.vue'

// Page setup
definePageMeta({
  title: 'Notifications - Menu Ordering App'
})

const notificationStore = useNotificationStore()
const router = useRouter()

// Reactive state
const activeFilter = ref('all')
const showSettings = ref(false)
const loadingMore = ref(false)
const hasMoreNotifications = ref(true)

const settings = ref({
  orderConfirmations: true,
  orderUpdates: true,
  deliveryNotifications: true,
  specialOffers: true,
  newMenuItems: false,
  newsletter: false
})

// Use real-time notifications from WebSocket service
const { notifications: realTimeNotifications, markAsRead: markNotificationAsRead, clearAll } = useNotifications()

// Convert real-time notifications to the format expected by the page
const notifications = computed(() => {
  return realTimeNotifications.value.map(notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.timestamp
  }))
})

// Computed
const filteredNotifications = computed(() => {
  let filtered = notifications.value

  switch (activeFilter.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.isRead)
      break
    case 'order':
      filtered = filtered.filter(n => n.type === 'order')
      break
    case 'promotion':
      filtered = filtered.filter(n => n.type === 'promotion')
      break
    case 'system':
      filtered = filtered.filter(n => n.type === 'system')
      break
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.isRead).length
})

// Methods
const setFilter = (filter: string) => {
  activeFilter.value = filter
}

const markAllAsRead = () => {
  const { markAllAsRead: markAllNotificationsAsRead } = useNotifications()
  markAllNotificationsAsRead()
  notificationStore.markAllAsRead()
}

const clearAllNotifications = () => {
  if (confirm('Are you sure you want to clear all notifications?')) {
    clearAll()
    notificationStore.clearAll()
  }
}

const handleNotificationClick = (notification: Notification) => {
  // Mark as read
  markNotificationAsRead(notification.id)
  notificationStore.markAsRead(notification.id)
  
  // Navigate based on notification type
  let route = '/notifications'
  
  switch (notification.type) {
    case 'order':
      // Try to extract order ID from notification message
      const orderMatch = notification.message.match(/#(\w+)/)
      if (orderMatch) {
        route = `/orders/track/${orderMatch[1]}`
      } else {
        route = '/orders'
      }
      break
    case 'promotion':
      route = '/promotions'
      break
    default:
      // Stay on notifications page
      return
  }
  
  router.push(route)
}

const saveSettings = () => {
  // Save notification settings
  console.log('Saving notification settings:', settings.value)
  showSettings.value = false
  
  // In a real app, this would save to backend
  localStorage.setItem('notificationSettings', JSON.stringify(settings.value))
}

const loadMoreNotifications = async () => {
  loadingMore.value = true
  try {
    // Mock loading more notifications
    await new Promise(resolve => setTimeout(resolve, 1000))
    hasMoreNotifications.value = false // No more notifications for demo
  } catch (error) {
    console.error('Failed to load more notifications:', error)
  } finally {
    loadingMore.value = false
  }
}

const requestNotificationPermission = async () => {
  const { requestPermission } = usePushNotifications()
  const granted = await requestPermission()
  
  if (granted) {
    new Notification('Notifications Enabled!', {
      body: 'You will now receive push notifications for order updates.',
      icon: '/icon-192x192.png'
    })
  } else {
    alert('Please enable notifications in your browser settings to receive push notifications.')
  }
}

// Initialize
onMounted(() => {
  // Load saved settings
  const savedSettings = localStorage.getItem('notificationSettings')
  if (savedSettings) {
    settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
  }
  
  // Fetch notifications
  notificationStore.fetchNotifications()
})
</script>
