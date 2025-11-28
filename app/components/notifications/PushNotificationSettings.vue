<template>
  <div class="push-notification-settings">
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Push Notifications</h3>
      
      <!-- Support Check -->
      <div v-if="!isSupported" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div class="flex">
          <BaseIcon name="exclamation-triangle" class="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
          <div>
            <h4 class="text-sm font-medium text-yellow-800">Not Supported</h4>
            <p class="text-sm text-yellow-700 mt-1">
              Push notifications are not supported in your browser.
            </p>
          </div>
        </div>
      </div>

      <!-- Permission Status -->
      <div v-else class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-sm font-medium text-gray-900">Notification Status</h4>
            <p class="text-sm text-gray-600 mt-1">
              {{ getPermissionDescription() }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <div
              class="w-3 h-3 rounded-full"
              :class="getStatusColor()"
            />
            <span class="text-sm font-medium" :class="getStatusTextColor()">
              {{ getStatusText() }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            v-if="permission === 'default' || !isSubscribed"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="enableNotifications"
          >
            <span v-if="loading" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"/>
              Enabling...
            </span>
            <span v-else>Enable Notifications</span>
          </button>

          <button
            v-if="isSubscribed"
            :disabled="loading"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="disableNotifications"
          >
            <span v-if="loading" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"/>
              Disabling...
            </span>
            <span v-else>Disable Notifications</span>
          </button>

          <button
            v-if="isSubscribed"
            :disabled="loading"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="testNotification"
          >
            Test Notification
          </button>
        </div>
      </div>

      <!-- Notification Preferences -->
      <div v-if="isSubscribed" class="border-t border-gray-200 pt-6">
        <h4 class="text-sm font-medium text-gray-900 mb-4">Notification Preferences</h4>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700">Order Updates</label>
              <p class="text-sm text-gray-500">Get notified about your order status changes</p>
            </div>
            <BaseToggle
              v-model="preferences.orderUpdates"
              @update:model-value="updatePreferences"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700">Promotions</label>
              <p class="text-sm text-gray-500">Receive notifications about special offers</p>
            </div>
            <BaseToggle
              v-model="preferences.promotions"
              @update:model-value="updatePreferences"
            />
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700">Reminders</label>
              <p class="text-sm text-gray-500">Get reminded about incomplete orders</p>
            </div>
            <BaseToggle
              v-model="preferences.reminders"
              @update:model-value="updatePreferences"
            />
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex">
          <BaseIcon name="exclamation-circle" class="w-5 h-5 text-red-400 mr-3 mt-0.5" />
          <div>
            <h4 class="text-sm font-medium text-red-800">Error</h4>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex">
          <BaseIcon name="check-circle" class="w-5 h-5 text-green-400 mr-3 mt-0.5" />
          <div>
            <h4 class="text-sm font-medium text-green-800">Success</h4>
            <p class="text-sm text-green-700 mt-1">{{ success }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePushNotifications } from '~/composables/usePushNotifications'
const {
  isSupported,
  isSubscribed,
  permission,
  subscribe,
  unsubscribe,
  sendTestNotification,
  updatePreferences: updateNotificationPreferences,
  getPreferences
} = usePushNotifications()

const loading = ref(false)
const error = ref('')
const success = ref('')

const preferences = ref({
  orderUpdates: true,
  promotions: true,
  reminders: true
})

// Load preferences on mount
onMounted(async () => {
  if (isSubscribed.value) {
    const prefs = await getPreferences()
    if (prefs) {
      preferences.value = prefs
    }
  }
})

const enableNotifications = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await subscribe()
    if (result) {
      success.value = 'Push notifications enabled successfully!'
      // Load preferences after successful subscription
      const prefs = await getPreferences()
      if (prefs) {
        preferences.value = prefs
      }
    } else {
      error.value = 'Failed to enable push notifications. Please check your browser settings.'
    }
  } catch (err) {
    error.value = 'An error occurred while enabling notifications.'
    console.error('Enable notifications error:', err)
  } finally {
    loading.value = false
  }
}

const disableNotifications = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await unsubscribe()
    if (result) {
      success.value = 'Push notifications disabled successfully!'
    } else {
      error.value = 'Failed to disable push notifications.'
    }
  } catch (err) {
    error.value = 'An error occurred while disabling notifications.'
    console.error('Disable notifications error:', err)
  } finally {
    loading.value = false
  }
}

const testNotification = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await sendTestNotification()
    if (result) {
      success.value = 'Test notification sent! Check your notifications.'
    } else {
      error.value = 'Failed to send test notification.'
    }
  } catch (err) {
    error.value = 'An error occurred while sending test notification.'
    console.error('Test notification error:', err)
  } finally {
    loading.value = false
  }
}

const updatePreferences = async () => {
  try {
    const result = await updateNotificationPreferences(preferences.value)
    if (result) {
      success.value = 'Notification preferences updated!'
      setTimeout(() => {
        success.value = ''
      }, 3000)
    } else {
      error.value = 'Failed to update notification preferences.'
    }
  } catch (err) {
    error.value = 'An error occurred while updating preferences.'
    console.error('Update preferences error:', err)
  }
}

const getPermissionDescription = (): string => {
  switch (permission.value) {
    case 'granted':
      return isSubscribed.value 
        ? 'You are subscribed to push notifications.'
        : 'Permission granted but not subscribed.'
    case 'denied':
      return 'Push notifications are blocked. Please enable them in your browser settings.'
    default:
      return 'Click "Enable Notifications" to receive push notifications.'
  }
}

const getStatusText = (): string => {
  if (permission.value === 'denied') return 'Blocked'
  if (isSubscribed.value) return 'Enabled'
  if (permission.value === 'granted') return 'Not Subscribed'
  return 'Disabled'
}

const getStatusColor = (): string => {
  if (permission.value === 'denied') return 'bg-red-500'
  if (isSubscribed.value) return 'bg-green-500'
  if (permission.value === 'granted') return 'bg-yellow-500'
  return 'bg-gray-500'
}

const getStatusTextColor = (): string => {
  if (permission.value === 'denied') return 'text-red-700'
  if (isSubscribed.value) return 'text-green-700'
  if (permission.value === 'granted') return 'text-yellow-700'
  return 'text-gray-700'
}

// Clear messages after some time
watch([error, success], () => {
  if (error.value || success.value) {
    setTimeout(() => {
      error.value = ''
      success.value = ''
    }, 5000)
  }
})
</script>