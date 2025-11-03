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
          @click="markAllAsRead"
          :disabled="unreadCount === 0"
        >
          <BaseIcon name="check-circle" size="sm" class="mr-2" />
          Mark All Read
        </BaseButton>
        <BaseButton 
          variant="ghost" 
          size="sm"
          @click="clearAllNotifications"
          :disabled="notifications.length === 0"
        >
          <BaseIcon name="trash" size="sm" class="mr-2" />
          Clear All
        </BaseButton>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="px-6">
      <!-- Loading State -->
      <div v-if="notificationStore.loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
        <AppText class="text-neutral-20">Loading notifications...</AppText>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredNotifications.length === 0" class="text-center py-16">
        <BaseIcon name="bell-off" size="4xl" class="text-neutral-80 mx-auto mb-6" />
        <AppHeading level="h3" size="heading-lg" class="text-white mb-4">
          {{ activeFilter === 'all' ? 'No notifications yet' : `No ${activeFilter} notifications` }}
        </AppHeading>
        <AppText class="text-neutral-20 mb-8 max-w-md mx-auto">
          {{ activeFilter === 'all' ? 
            'We\'ll notify you about order updates and special offers.' : 
            `You don't have any ${activeFilter} notifications at the moment.` 
          }}
        </AppText>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink to="/menu">
            <BaseButton variant="primary">
              <BaseIcon name="utensils" size="sm" class="mr-2" />
              Browse Menu
            </BaseButton>
          </NuxtLink>
          <BaseButton 
            v-if="activeFilter !== 'all'"
            variant="secondary"
            @click="setFilter('all')"
          >
            View All Notifications
          </BaseButton>
        </div>
      </div>

      <!-- Notifications -->
      <div v-else class="space-y-4">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          class="bg-background-card rounded-xl p-6 transition-all duration-300 hover:bg-background-card/80"
          :class="{ 'border-l-4 border-primary-green': !notification.isRead }"
          @click="markAsRead(notification.id)"
        >
          <div class="flex items-start gap-4">
            <!-- Notification Icon -->
            <div class="flex-shrink-0">
              <div 
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="getNotificationIconBg(notification.type)"
              >
                <BaseIcon 
                  :name="getNotificationIcon(notification.type)" 
                  size="md" 
                  :class="getNotificationIconColor(notification.type)"
                />
              </div>
            </div>

            <!-- Notification Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-2">
                <AppHeading 
                  level="h4" 
                  size="heading-sm" 
                  class="text-white"
                  :class="{ 'font-bold': !notification.isRead }"
                >
                  {{ notification.title }}
                </AppHeading>
                <div class="flex items-center gap-2 ml-4">
                  <AppText size="caption" class="text-neutral-20 whitespace-nowrap">
                    {{ formatNotificationTime(notification.createdAt) }}
                  </AppText>
                  <div 
                    v-if="!notification.isRead"
                    class="w-2 h-2 bg-primary-green rounded-full"
                  ></div>
                </div>
              </div>
              
              <AppText 
                size="body-sm" 
                class="text-neutral-20 mb-3"
                :class="{ 'text-white': !notification.isRead }"
              >
                {{ notification.message }}
              </AppText>

              <!-- Notification Actions -->
              <div class="flex items-center gap-2">
                <BaseBadge 
                  :variant="getNotificationBadgeVariant(notification.type)"
                  size="sm"
                >
                  {{ getNotificationTypeLabel(notification.type) }}
                </BaseBadge>
                
                <!-- Action Buttons -->
                <div v-if="getNotificationActions(notification).length > 0" class="flex gap-2 ml-auto">
                  <BaseButton
                    v-for="action in getNotificationActions(notification)"
                    :key="action.label"
                    :variant="action.variant"
                    size="sm"
                    @click.stop="handleNotificationAction(notification, action)"
                  >
                    <BaseIcon :name="action.icon" size="sm" class="mr-2" />
                    {{ action.label }}
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMoreNotifications" class="text-center mt-8">
        <BaseButton 
          variant="secondary"
          @click="loadMoreNotifications"
          :disabled="loadingMore"
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

// Page setup
definePageMeta({
  title: 'Notifications - Menu Ordering App'
})

// Stores
import { useNotificationStore } from '~/stores/notification'

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

const markAsRead = (notificationId: string) => {
  markNotificationAsRead(notificationId)
  notificationStore.markAsRead(notificationId)
}

const markAllAsRead = () => {
  const { markAllAsRead: markAllNotificationsAsRead } = useNotifications()
  markAllNotificationsAsRead()
  notifications.value.forEach(notification => {
    notificationStore.markAsRead(notification.id)
  })
}

const clearAllNotifications = () => {
  if (confirm('Are you sure you want to clear all notifications?')) {
    clearAll()
  }
}

const formatNotificationTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffMinutes = Math.ceil(diffTime / (1000 * 60))
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'order': return 'receipt'
    case 'promotion': return 'tag'
    case 'system': return 'info'
    default: return 'bell'
  }
}

const getNotificationIconBg = (type: string) => {
  switch (type) {
    case 'order': return 'bg-primary-green/20'
    case 'promotion': return 'bg-primary-orange/20'
    case 'system': return 'bg-primary-red/20'
    default: return 'bg-neutral-80/20'
  }
}

const getNotificationIconColor = (type: string) => {
  switch (type) {
    case 'order': return 'text-primary-green'
    case 'promotion': return 'text-primary-orange'
    case 'system': return 'text-primary-red'
    default: return 'text-neutral-80'
  }
}

const getNotificationBadgeVariant = (type: string) => {
  switch (type) {
    case 'order': return 'success'
    case 'promotion': return 'warning'
    case 'system': return 'secondary'
    default: return 'secondary'
  }
}

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case 'order': return 'Order'
    case 'promotion': return 'Promotion'
    case 'system': return 'System'
    default: return 'Notification'
  }
}

const getNotificationActions = (notification: Notification) => {
  const actions = []

  switch (notification.type) {
    case 'order':
      actions.push(
        { label: 'View Order', icon: 'eye', variant: 'secondary', action: 'view-order' }
      )
      break
    case 'promotion':
      actions.push(
        { label: 'View Offer', icon: 'tag', variant: 'secondary', action: 'view-promotion' }
      )
      break
    case 'system':
      actions.push(
        { label: 'Learn More', icon: 'arrow-right', variant: 'ghost', action: 'learn-more' }
      )
      break
  }

  return actions
}

const handleNotificationAction = (notification: Notification, action: any) => {
  switch (action.action) {
    case 'view-order':
      // Extract order ID from notification message or use a different approach
      const orderMatch = notification.message.match(/#(\w+)/)
      if (orderMatch) {
        router.push(`/orders/${orderMatch[1]}`)
      } else {
        router.push('/orders')
      }
      break
    case 'view-promotion':
      router.push('/promotions')
      break
    case 'learn-more':
      router.push('/menu')
      break
  }
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