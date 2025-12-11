<template>
  <div class="push-notification-settings">
    <div class="push-notification-settings__container">
      <h3 class="push-notification-settings__title">
        {{ platformName }} Notifications
      </h3>
      
      <!-- Support Check -->
      <div v-if="!isSupported" class="push-notification-settings__alert push-notification-settings__alert--warning">
        <div class="push-notification-settings__alert-content">
          <BaseIcon name="exclamation-triangle" class="push-notification-settings__alert-icon" />
          <div class="push-notification-settings__alert-text">
            <h4 class="push-notification-settings__alert-title">Not Supported</h4>
            <p class="push-notification-settings__alert-message">
              Push notifications are not supported in your browser.
            </p>
          </div>
        </div>
      </div>

      <!-- Permission Status -->
      <div v-else class="push-notification-settings__status">
        <div class="push-notification-settings__status-header">
          <div class="push-notification-settings__status-info">
            <h4 class="push-notification-settings__status-title">Notification Status</h4>
            <p class="push-notification-settings__status-description">
              {{ getPermissionDescription() }}
            </p>
          </div>
          <div class="push-notification-settings__status-indicator">
            <div
              :class="[
                'push-notification-settings__status-dot',
                `push-notification-settings__status-dot--${getStatusColor()}`
              ]"
            />
            <span
              :class="[
                'push-notification-settings__status-text',
                `push-notification-settings__status-text--${getStatusColor()}`
              ]"
            >
              {{ getStatusText() }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="push-notification-settings__actions">
          <button
            v-if="permission === 'default' || !isSubscribed"
            :disabled="loading"
            :class="[
              'push-notification-settings__button',
              'push-notification-settings__button--primary',
              { 'push-notification-settings__button--disabled': loading }
            ]"
            @click="enableNotifications"
          >
            <span v-if="loading" class="push-notification-settings__button-content">
              <div class="push-notification-settings__spinner"/>
              Enabling...
            </span>
            <span v-else>Enable Notifications</span>
          </button>

          <button
            v-if="isSubscribed"
            :disabled="loading"
            :class="[
              'push-notification-settings__button',
              'push-notification-settings__button--danger',
              { 'push-notification-settings__button--disabled': loading }
            ]"
            @click="disableNotifications"
          >
            <span v-if="loading" class="push-notification-settings__button-content">
              <div class="push-notification-settings__spinner"/>
              Disabling...
            </span>
            <span v-else>Disable Notifications</span>
          </button>

          <button
            v-if="isSubscribed"
            :disabled="loading"
            :class="[
              'push-notification-settings__button',
              'push-notification-settings__button--secondary',
              { 'push-notification-settings__button--disabled': loading }
            ]"
            @click="testNotification"
          >
            Test Notification
          </button>
        </div>
      </div>

      <!-- Notification Preferences -->
      <div v-if="isSubscribed" class="push-notification-settings__preferences">
        <h4 class="push-notification-settings__preferences-title">Notification Preferences</h4>
        
        <div class="push-notification-settings__preferences-list">
          <div class="push-notification-settings__preference">
            <div class="push-notification-settings__preference-info">
              <label class="push-notification-settings__preference-label">Order Updates</label>
              <p class="push-notification-settings__preference-description">Get notified about your order status changes</p>
            </div>
            <BaseToggle
              v-model="preferences.orderUpdates"
              @update:model-value="updatePreferences"
            />
          </div>

          <div class="push-notification-settings__preference">
            <div class="push-notification-settings__preference-info">
              <label class="push-notification-settings__preference-label">Promotions</label>
              <p class="push-notification-settings__preference-description">Receive notifications about special offers</p>
            </div>
            <BaseToggle
              v-model="preferences.promotions"
              @update:model-value="updatePreferences"
            />
          </div>

          <div class="push-notification-settings__preference">
            <div class="push-notification-settings__preference-info">
              <label class="push-notification-settings__preference-label">Reminders</label>
              <p class="push-notification-settings__preference-description">Get reminded about incomplete orders</p>
            </div>
            <BaseToggle
              v-model="preferences.reminders"
              @update:model-value="updatePreferences"
            />
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="push-notification-settings__alert push-notification-settings__alert--error">
        <div class="push-notification-settings__alert-content">
          <BaseIcon name="exclamation-circle" class="push-notification-settings__alert-icon" />
          <div class="push-notification-settings__alert-text">
            <h4 class="push-notification-settings__alert-title">Error</h4>
            <p class="push-notification-settings__alert-message">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="push-notification-settings__alert push-notification-settings__alert--success">
        <div class="push-notification-settings__alert-content">
          <BaseIcon name="check-circle" class="push-notification-settings__alert-icon" />
          <div class="push-notification-settings__alert-text">
            <h4 class="push-notification-settings__alert-title">Success</h4>
            <p class="push-notification-settings__alert-message">{{ success }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlatformNotifications } from '~/composables/usePlatformNotifications'
import { usePushNotifications } from '~/composables/usePushNotifications'

const platformNotifications = usePlatformNotifications()
const pushNotifications = usePushNotifications()

const isSupported = platformNotifications.isAvailable
const isSubscribed = platformNotifications.isSubscribed
const permission = pushNotifications.permission
const platformName = platformNotifications.platformName

const subscribe = platformNotifications.subscribe
const unsubscribe = platformNotifications.unsubscribe
const sendTestNotification = pushNotifications.sendTestNotification
const updateNotificationPreferences = pushNotifications.updatePreferences
const getPreferences = pushNotifications.getPreferences

const loading = ref(false)
const error = ref('')
const success = ref('')

const preferences = ref({
  orderUpdates: true,
  promotions: true,
  reminders: true
})

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
      const prefs = await getPreferences()
      if (prefs) {
        preferences.value = prefs
      }
    } else {
      error.value = 'Failed to enable push notifications. Please check your browser settings.'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred while enabling notifications.'
  } finally {
    loading.value = false
  }
}

const disableNotifications = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await unsubscribe()
    success.value = 'Push notifications disabled successfully!'
  } catch (err: any) {
    error.value = err.message || 'An error occurred while disabling notifications.'
  } finally {
    loading.value = false
  }
}

const testNotification = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await sendTestNotification()
    success.value = 'Test notification sent!'
  } catch (err: any) {
    error.value = err.message || 'Failed to send test notification.'
  } finally {
    loading.value = false
  }
}

const updatePreferences = async () => {
  try {
    await updateNotificationPreferences(preferences.value)
  } catch (err: any) {
    error.value = err.message || 'Failed to update preferences.'
  }
}

const getPermissionDescription = (): string => {
  if (permission.value === 'granted') {
    return 'Notifications are enabled'
  } else if (permission.value === 'denied') {
    return 'Notifications are blocked. Please enable them in your browser settings.'
  } else {
    return 'Click the button below to enable notifications'
  }
}

const getStatusColor = (): string => {
  if (permission.value === 'granted' && isSubscribed.value) {
    return 'success'
  } else if (permission.value === 'denied') {
    return 'error'
  } else {
    return 'warning'
  }
}

const getStatusText = (): string => {
  if (permission.value === 'granted' && isSubscribed.value) {
    return 'Enabled'
  } else if (permission.value === 'denied') {
    return 'Blocked'
  } else {
    return 'Disabled'
  }
}
</script>

<style lang="scss" scoped>
@use '../../assets/scss/abstracts/variables' as *;

.push-notification-settings {
  width: 100%;
}

.push-notification-settings__container {
  background: white;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  border: 1px solid var(--border-primary);
  padding: $space-8;
}

.push-notification-settings__title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-6;
}

.push-notification-settings__alert {
  padding: $space-6;
  border-radius: $radius-lg;
  margin-bottom: $space-6;

  &--warning {
    background: #fef3c7;
    border: 1px solid #fde68a;
  }

  &--error {
    background: #fee2e2;
    border: 1px solid #fecaca;
  }

  &--success {
    background: #d1fae5;
    border: 1px solid #a7f3d0;
  }
}

.push-notification-settings__alert-content {
  display: flex;
  gap: $space-4;
}

.push-notification-settings__alert-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;

  .push-notification-settings__alert--warning & {
    color: #f59e0b;
  }

  .push-notification-settings__alert--error & {
    color: #ef4444;
  }

  .push-notification-settings__alert--success & {
    color: #10b981;
  }
}

.push-notification-settings__alert-text {
  flex: 1;
}

.push-notification-settings__alert-title {
  font-size: $text-sm;
  font-weight: $font-medium;

  .push-notification-settings__alert--warning & {
    color: #92400e;
  }

  .push-notification-settings__alert--error & {
    color: #991b1b;
  }

  .push-notification-settings__alert--success & {
    color: #065f46;
  }
}

.push-notification-settings__alert-message {
  font-size: $text-sm;
  margin-top: $space-1;

  .push-notification-settings__alert--warning & {
    color: #78350f;
  }

  .push-notification-settings__alert--error & {
    color: #7f1d1d;
  }

  .push-notification-settings__alert--success & {
    color: #064e3b;
  }
}

.push-notification-settings__status {
  margin-bottom: $space-8;
}

.push-notification-settings__status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-6;
}

.push-notification-settings__status-info {
  flex: 1;
}

.push-notification-settings__status-title {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
}

.push-notification-settings__status-description {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin-top: $space-1;
}

.push-notification-settings__status-indicator {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.push-notification-settings__status-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: $radius-full;

  &--success {
    background: #10b981;
  }

  &--error {
    background: #ef4444;
  }

  &--warning {
    background: #f59e0b;
  }
}

.push-notification-settings__status-text {
  font-size: $text-sm;
  font-weight: $font-medium;

  &--success {
    color: #10b981;
  }

  &--error {
    color: #ef4444;
  }

  &--warning {
    color: #f59e0b;
  }
}

.push-notification-settings__actions {
  display: flex;
  gap: $space-4;
}

.push-notification-settings__button {
  padding: $space-2 $space-6;
  border-radius: $radius-lg;
  font-size: $text-sm;
  font-weight: $font-medium;
  border: none;
  cursor: pointer;
  transition: all $transition-base;

  &:focus {
    outline: none;
    ring: 2px;
  }

  &--primary {
    background: #2563eb;
    color: white;

    &:hover {
      background: #1d4ed8;
    }

    &:focus {
      ring-color: #3b82f6;
    }
  }

  &--danger {
    background: #dc2626;
    color: white;

    &:hover {
      background: #b91c1c;
    }

    &:focus {
      ring-color: #ef4444;
    }
  }

  &--secondary {
    background: #4b5563;
    color: white;

    &:hover {
      background: #374151;
    }

    &:focus {
      ring-color: #6b7280;
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.push-notification-settings__button-content {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.push-notification-settings__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid white;
  border-bottom-color: transparent;
  border-radius: $radius-full;
  animation: spin 1s linear infinite;
}

.push-notification-settings__preferences {
  border-top: 1px solid var(--border-primary);
  padding-top: $space-8;
}

.push-notification-settings__preferences-title {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
  margin-bottom: $space-6;
}

.push-notification-settings__preferences-list {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.push-notification-settings__preference {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.push-notification-settings__preference-info {
  flex: 1;
}

.push-notification-settings__preference-label {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: #374151;
}

.push-notification-settings__preference-description {
  font-size: $text-sm;
  color: #6b7280;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
