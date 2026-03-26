<template>
  <div class="websocket-notification-example p-6 bg-white rounded-lg shadow-sm border">
    <h3 class="text-lg font-semibold mb-4">WebSocket & Notifications Demo</h3>
    
    <!-- Connection Status -->
    <div class="mb-4">
      <div class="flex items-center space-x-2">
        <div 
          class="w-3 h-3 rounded-full"
          :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
        />
        <span class="text-sm font-medium">
          WebSocket: {{ connectionState }}
        </span>
      </div>
    </div>

    <!-- Push Notification Status -->
    <div class="mb-4">
      <div class="flex items-center space-x-2">
        <div 
          class="w-3 h-3 rounded-full"
          :class="isSubscribed ? 'bg-green-500' : 'bg-gray-500'"
        />
        <span class="text-sm font-medium">
          Push Notifications: {{ isSubscribed ? 'Enabled' : 'Disabled' }}
        </span>
      </div>
    </div>

    <!-- Notification Count -->
    <div class="mb-4">
      <span class="text-sm">
        Unread Notifications: <strong>{{ unreadCount }}</strong>
      </span>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap gap-2">
      <button
        :disabled="isConnected"
        class="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        @click="connectWebSocket"
      >
        Connect WebSocket
      </button>
      
      <button
        :disabled="!isConnected"
        class="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50"
        @click="disconnectWebSocket"
      >
        Disconnect WebSocket
      </button>
      
      <button
        :disabled="isSubscribed"
        class="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
        @click="enablePushNotifications"
      >
        Enable Push
      </button>
      
      <button
        :disabled="!isSubscribed"
        class="px-3 py-1 bg-purple-600 text-white rounded text-sm disabled:opacity-50"
        @click="sendTestNotification"
      >
        Test Notification
      </button>
    </div>

    <!-- Recent Notifications -->
    <div class="mt-6">
      <h4 class="text-md font-medium mb-2">Recent Notifications</h4>
      <div class="space-y-2 max-h-40 overflow-y-auto">
        <div
          v-for="notification in recentNotifications"
          :key="notification.id"
          class="p-2 bg-gray-50 rounded text-sm"
          :class="{ 'bg-blue-50 border-l-2 border-blue-500': !notification.isRead }"
        >
          <div class="font-medium">{{ notification.title }}</div>
          <div class="text-gray-600">{{ notification.message }}</div>
          <div class="text-xs text-gray-400 mt-1">
            {{ formatTime(notification.timestamp) }}
          </div>
        </div>
        
        <div v-if="recentNotifications.length === 0" class="text-gray-500 text-sm">
          No notifications yet
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePushNotifications } from '~/composables/usePushNotifications'
import { useWebSocket } from '~/services/websocket.service'
import { useNotifications } from '~/composables/useNotifications'
interface InAppNotification {
  id: string
  type: 'order' | 'promotion' | 'system'
  title: string
  message: string
  data?: any
  timestamp: string
  isRead: boolean
}

// WebSocket composable
const { 
  isConnected, 
  connectionState, 
  connect, 
  disconnect 
} = useWebSocket()

// Push notifications composable
const { 
  isSubscribed, 
  subscribe, 
  sendTestNotification: testPush 
} = usePushNotifications()

// Notifications composable
const { 
  notifications, 
  unreadCount 
} = useNotifications()

// Recent notifications (last 5)
const recentNotifications = computed(() => {
  return notifications.value.slice(0, 5)
})

// Methods
const connectWebSocket = async () => {
  try {
    await connect()
  } catch (error) {
    console.error('Failed to connect WebSocket:', error)
  }
}

const disconnectWebSocket = () => {
  disconnect()
}

const enablePushNotifications = async () => {
  try {
    await subscribe()
  } catch (error) {
    console.error('Failed to enable push notifications:', error)
  }
}

const sendTestNotification = async () => {
  try {
    await testPush()
  } catch (error) {
    console.error('Failed to send test notification:', error)
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
</script>