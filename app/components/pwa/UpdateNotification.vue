<template>
  <Teleport to="body">
    <Transition
      enter-active-class="update-notification--enter-active"
      enter-from-class="update-notification--enter-from"
      enter-to-class="update-notification--enter-to"
      leave-active-class="update-notification--leave-active"
      leave-from-class="update-notification--leave-from"
      leave-to-class="update-notification--leave-to"
    >
      <div
        v-if="showUpdate"
        class="update-notification"
      >
        <div class="update-notification__container">
          <div class="update-notification__content">
            <!-- Update Icon -->
            <div class="update-notification__icon">
              <BaseIcon name="refresh" size="sm" />
            </div>

            <!-- Content -->
            <div class="update-notification__text">
              <p class="update-notification__title">
                New version available!
              </p>
              <p class="update-notification__description">
                Tap to update and get the latest features.
              </p>
            </div>

            <!-- Actions -->
            <div class="update-notification__actions">
              <button
                :disabled="updating"
                :class="[
                  'update-notification__button',
                  'update-notification__button--update',
                  { 'update-notification__button--disabled': updating }
                ]"
                @click="handleUpdate"
              >
                {{ updating ? 'Updating...' : 'Update' }}
              </button>
              <button
                class="update-notification__button update-notification__button--dismiss"
                @click="handleDismiss"
              >
                <BaseIcon name="x" size="xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  autoShow?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoShow: true,
  persistent: false,
})

const { updateAvailable, reloadApp } = usePWAFeatures()

const showUpdate = ref(false)
const updating = ref(false)
const dismissed = ref(false)

// Handle update button click
const handleUpdate = async () => {
  updating.value = true
  
  try {
    // Show loading state briefly
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Reload app to apply updates
    reloadApp()
  } catch (error) {
    console.error('Update failed:', error)
    updating.value = false
  }
}

// Handle dismiss button click
const handleDismiss = () => {
  if (!props.persistent) {
    showUpdate.value = false
    dismissed.value = true
  }
}

// Watch for update availability
watch(updateAvailable, (available) => {
  if (available && props.autoShow && !dismissed.value) {
    showUpdate.value = true
  }
})

// Show notification if update is already available
onMounted(() => {
  if (updateAvailable.value && props.autoShow) {
    showUpdate.value = true
  }
})

// Expose methods for manual control
defineExpose({
  show: () => {
    showUpdate.value = true
    dismissed.value = false
  },
  hide: () => {
    showUpdate.value = false
  },
})
</script>

<st
yle lang="scss" scoped>
@use '../../assets/scss/abstracts/variables' as *;

.update-notification {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--color-success);
  color: white;
  box-shadow: $shadow-lg;
}

.update-notification__container {
  padding: $space-4;
  max-width: 28rem;
  margin: 0 auto;
}

.update-notification__content {
  display: flex;
  align-items: center;
  gap: $space-4;
}

.update-notification__icon {
  flex-shrink: 0;
  color: white;
}

.update-notification__text {
  flex: 1;
  min-width: 0;
}

.update-notification__title {
  font-size: $text-sm;
  font-weight: $font-medium;
  margin-bottom: $space-1;
}

.update-notification__description {
  font-size: $text-sm;
  opacity: 0.9;
}

.update-notification__actions {
  display: flex;
  gap: $space-2;
}

.update-notification__button {
  padding: $space-1 $space-4;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: $radius-sm;
  color: white;
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: background $transition-base;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &--update {
    // Specific styles for update button
  }

  &--dismiss {
    padding: $space-1;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Transition classes
.update-notification--enter-active {
  transition: all 300ms ease-out;
}

.update-notification--enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.update-notification--enter-to {
  opacity: 1;
  transform: translateY(0);
}

.update-notification--leave-active {
  transition: all 200ms ease-in;
}

.update-notification--leave-from {
  opacity: 1;
  transform: translateY(0);
}

.update-notification--leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
