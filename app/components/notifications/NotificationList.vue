<template>
  <div class="notification-list">
    <!-- Loading State -->
    <div v-if="loading" class="notification-list__loading">
      <div class="notification-list__spinner"/>
      <p class="notification-list__loading-text">Loading notifications...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="notifications.length === 0" class="notification-list__empty">
      <BaseIcon name="bell-off" size="4xl" class="notification-list__empty-icon" />
      <h3 class="notification-list__empty-title">
        No notifications yet
      </h3>
      <p class="notification-list__empty-message">
        We'll notify you about order updates and special offers.
      </p>
    </div>

    <!-- Notifications -->
    <div v-else class="notification-list__items">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 'notification-item--unread': !notification.isRead }"
        @click="handleClick(notification)"
      >
        <div class="notification-item__icon">
          <div 
            class="notification-item__icon-wrapper"
            :class="`notification-item__icon-wrapper--${notification.type}`"
          >
            <BaseIcon 
              :name="getNotificationIcon(notification.type)" 
              size="md" 
            />
          </div>
        </div>

        <div class="notification-item__content">
          <div class="notification-item__header">
            <h4 
              class="notification-item__title"
              :class="{ 'notification-item__title--unread': !notification.isRead }"
            >
              {{ notification.title }}
            </h4>
            <div class="notification-item__meta">
              <span class="notification-item__time">
                {{ formatTime(notification.createdAt) }}
              </span>
              <div 
                v-if="!notification.isRead"
                class="notification-item__unread-indicator"
              />
            </div>
          </div>
          
          <p 
            class="notification-item__message"
            :class="{ 'notification-item__message--unread': !notification.isRead }"
          >
            {{ notification.message }}
          </p>

          <div class="notification-item__footer">
            <span 
              class="notification-item__badge"
              :class="`notification-item__badge--${notification.type}`"
            >
              {{ getNotificationTypeLabel(notification.type) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/types'

interface Props {
  notifications: Notification[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  click: [notification: Notification]
}>()

const handleClick = (notification: Notification) => {
  emit('click', notification)
}

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'order':
      return 'receipt'
    case 'promotion':
      return 'tag'
    case 'system':
      return 'info'
    default:
      return 'bell'
  }
}

const getNotificationTypeLabel = (type: string): string => {
  switch (type) {
    case 'order':
      return 'Order'
    case 'promotion':
      return 'Promotion'
    case 'system':
      return 'System'
    default:
      return 'Notification'
  }
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffMinutes = Math.ceil(diffTime / (1000 * 60))
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Just now'
  } else if (diffMinutes < 60) {
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
</script>

<style scoped lang="scss">


.notification-list {
  width: 100%;
}

.notification-list__loading {
  text-align: center;
  padding: 3rem 0;
}

.notification-list__spinner {
  width: 3rem;
  height: 3rem;
  border: 2px solid var(--color-success);
  border-bottom-color: transparent;
  border-radius: $radius-full;
  margin: 0 auto $space-6;
  animation: spin 1s linear infinite;
}

.notification-list__loading-text {
  color: $color-neutral-20;
}

.notification-list__empty {
  text-align: center;
  padding: 4rem 0;
}

.notification-list__empty-icon {
  color: var(--text-primary);
  margin: 0 auto $space-8;
}

.notification-list__empty-title {
  color: white;
  font-size: $text-xl;
  font-weight: $font-semibold;
  margin-bottom: $space-6;
}

.notification-list__empty-message {
  color: $color-neutral-20;
  margin-bottom: $space-12;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
}

.notification-list__items {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.notification-item {
  display: flex;
  gap: $space-4;
  padding: $space-6;
  background: var(--bg-secondary);
  border-radius: $radius-lg;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: var(--bg-tertiary);
  }

  &--unread {
    border-left: 4px solid var(--color-success);
  }
}

.notification-item__icon {
  flex-shrink: 0;
}

.notification-item__icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: $radius-full;
  display: flex;
  align-items: center;
  justify-content: center;

  &--order {
    background: rgba(var(--color-success), 0.2);
    color: var(--color-success);
  }

  &--promotion {
    background: rgba(var(--color-warning), 0.2);
    color: var(--color-warning);
  }

  &--system {
    background: rgba(var(--color-error), 0.2);
    color: var(--color-error);
  }
}

.notification-item__content {
  flex: 1;
  min-width: 0;
}

.notification-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: $space-2;
}

.notification-item__title {
  font-size: $text-base;
  font-weight: $font-medium;
  color: $text-primary;

  &--unread {
    font-weight: $font-bold;
  }
}

.notification-item__meta {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-left: $space-4;
}

.notification-item__time {
  font-size: $text-xs;
  color: $text-secondary;
  white-space: nowrap;
}

.notification-item__unread-indicator {
  width: 8px;
  height: 8px;
  background: var(--color-success);
  border-radius: $radius-full;
}

.notification-item__message {
  font-size: $text-sm;
  color: $text-secondary;
  margin-bottom: $space-4;
  line-height: $leading-normal;

  &--unread {
    color: $text-primary;
  }
}

.notification-item__footer {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.notification-item__badge {
  display: inline-block;
  padding: $space-1 $space-2;
  font-size: $text-xs;
  font-weight: $font-medium;
  border-radius: $radius-sm;

  &--order {
    background: rgba(var(--color-success), 0.1);
    color: var(--color-success);
  }

  &--promotion {
    background: rgba(var(--color-warning), 0.1);
    color: var(--color-warning);
  }

  &--system {
    background: rgba($text-secondary, 0.1);
    color: $text-secondary;
  }
}
</style>
