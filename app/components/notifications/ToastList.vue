<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in activeToasts"
        :key="toast.id"
        class="toast"
        :class="[`toast--${toast.type}`]"
        @click="removeToast(toast.id)"
      >
        <div class="toast__content">
          <BaseIcon :name="getIcon(toast.type)" size="sm" class="toast__icon" />
          <div class="toast__text">
            <p v-if="toast.title" class="toast__title">{{ toast.title }}</p>
            <p class="toast__message">{{ toast.message }}</p>
          </div>
        </div>
        <BaseButton variant="ghost" size="sm" class="toast__close">
          <BaseIcon name="x" size="xs" />
        </BaseButton>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification'

const store = useNotificationStore()

// We use the last 3 notifications as "toasts" if they are recent
// In a real app, we'd have a separate toast store, but let's reuse the notification store for now
// and filter for very recent ones.
const activeToasts = computed(() => {
  const now = new Date().getTime()
  return store.notifications
    .filter(n => {
      const createdAt = new Date(n.createdAt).getTime()
      return (now - createdAt) < 5000 && !n.isRead // Show for 5 seconds
    })
    .slice(0, 3)
})

const removeToast = (id: string) => {
  store.markAsRead(id)
}

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
    case 'order': return 'check-circle'
    case 'error': return 'alert-circle'
    case 'warning': return 'alert'
    default: return 'info'
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens' as *;

.toast-container {
  position: fixed;
  top: $space-4;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  width: 100%;
  max-width: 400px;
  pointer-events: none;
  padding: 0 $space-4;
}

.toast {
  pointer-events: auto;
  background: var(--bg-primary);
  border-radius: $radius-lg;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-primary);
  padding: $space-3 $space-4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  width: 100%;
  
  &--order, &--success {
    border-left: 4px solid var(--color-success);
  }
  
  &--error {
    border-left: 4px solid var(--color-error);
  }
}

.toast__content {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex: 1;
}

.toast__icon {
  flex-shrink: 0;
  &--order, &--success { color: var(--color-success); }
  &--error { color: var(--color-error); }
}

.toast__text {
  flex: 1;
}

.toast__title {
  font-weight: 700;
  font-size: $text-sm;
  margin: 0;
}

.toast__message {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
