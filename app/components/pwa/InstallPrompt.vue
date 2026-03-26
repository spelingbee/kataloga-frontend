<template>
  <Teleport to="body">
    <Transition
      enter-active-class="install-prompt--enter-active"
      enter-from-class="install-prompt--enter-from"
      enter-to-class="install-prompt--enter-to"
      leave-active-class="install-prompt--leave-active"
      leave-from-class="install-prompt--leave-from"
      leave-to-class="install-prompt--leave-to"
    >
      <div
        v-if="showPrompt"
        class="install-prompt"
      >
        <div class="install-prompt__container">
          <div class="install-prompt__content">
            <!-- App Icon -->
            <div class="install-prompt__icon">
              <img
                src="/icon-72x72.png"
                alt="App Icon"
                class="install-prompt__icon-image"
              />
            </div>

            <!-- Content -->
            <div class="install-prompt__text">
              <h3 class="install-prompt__title">
                Install Menu App
              </h3>
              <p class="install-prompt__description">
                Get quick access to your favorite restaurant menu. Install our app for a better experience!
              </p>

              <!-- Actions -->
              <div class="install-prompt__actions">
                <BaseButton
                  variant="primary"
                  size="sm"
                  :loading="installing"
                  @click="handleInstall"
                >
                  Install
                </BaseButton>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  @click="handleDismiss"
                >
                  Not now
                </BaseButton>
              </div>
            </div>

            <!-- Close button -->
            <button
              class="install-prompt__close"
              @click="handleDismiss"
            >
              <BaseIcon name="x" size="sm" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  autoShow?: boolean
  showDelay?: number
  dismissDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoShow: true,
  showDelay: 3000, // 3 seconds
  dismissDelay: 10000, // 10 seconds
})

const { isInstallable, showInstallPrompt } = usePWAFeatures()

const showPrompt = ref(false)
const installing = ref(false)
const dismissed = ref(false)

// Check if user has already dismissed the prompt
const DISMISS_KEY = 'install_prompt_dismissed'
const isDismissedPermanently = () => {
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      return daysSinceDismissed < 7 // Don't show again for 7 days
    }
  } catch (error) {
    console.error('Failed to check dismiss status:', error)
  }
  return false
}

// Handle install button click
const handleInstall = async () => {
  installing.value = true
  
  try {
    const installed = await showInstallPrompt()
    if (installed) {
      showPrompt.value = false
      // Track successful installation
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'pwa_install', {
          event_category: 'engagement',
          event_label: 'install_prompt',
        })
      }
    }
  } catch (error) {
    console.error('Installation failed:', error)
  } finally {
    installing.value = false
  }
}

// Handle dismiss button click
const handleDismiss = () => {
  showPrompt.value = false
  dismissed.value = true
  
  // Remember dismissal
  try {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  } catch (error) {
    console.error('Failed to save dismiss status:', error)
  }

  // Track dismissal
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('event', 'pwa_install_dismissed', {
      event_category: 'engagement',
      event_label: 'install_prompt',
    })
  }
}

// Auto-show logic
const setupAutoShow = () => {
  if (!props.autoShow || isDismissedPermanently()) return

  // Show prompt after delay if installable
  const showTimer = setTimeout(() => {
    if (isInstallable.value && !dismissed.value) {
      showPrompt.value = true

      // Auto-dismiss after delay
      setTimeout(() => {
        if (showPrompt.value) {
          handleDismiss()
        }
      }, props.dismissDelay)
    }
  }, props.showDelay)

  onUnmounted(() => {
    clearTimeout(showTimer)
  })
}

// Watch for installable state changes
watch(isInstallable, (installable) => {
  if (!installable) {
    showPrompt.value = false
  }
})

onMounted(() => {
  setupAutoShow()
})

// Expose methods for manual control
defineExpose({
  show: () => {
    if (isInstallable.value && !isDismissedPermanently()) {
      showPrompt.value = true
    }
  },
  hide: () => {
    showPrompt.value = false
  },
})
</script>


<style lang="scss" scoped>
@use '../../assets/scss/abstracts/variables' as *;

.install-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: white;
  border-top: 1px solid $color-neutral-20;
  box-shadow: $shadow-lg;
}

.install-prompt__container {
  padding: $space-6;
  max-width: 28rem;
  margin: 0 auto;
}

.install-prompt__content {
  display: flex;
  align-items: flex-start;
  gap: $space-4;
}

.install-prompt__icon {
  flex-shrink: 0;
}

.install-prompt__icon-image {
  width: 3rem;
  height: 3rem;
  border-radius: $radius-lg;
}

.install-prompt__text {
  flex: 1;
  min-width: 0;
}

.install-prompt__title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.install-prompt__description {
  font-size: $text-sm;
  color: rgba(var(--text-primary), 0.7);
  margin-bottom: $space-4;
}

.install-prompt__actions {
  display: flex;
  gap: $space-2;
}

.install-prompt__close {
  flex-shrink: 0;
  padding: $space-1;
  background: none;
  border: none;
  color: rgba(var(--text-primary), 0.5);
  cursor: pointer;
  transition: color $transition-base;

  &:hover {
    color: var(--text-primary);
  }
}

// Transition classes
.install-prompt--enter-active {
  transition: all 300ms ease-out;
}

.install-prompt--enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.install-prompt--enter-to {
  opacity: 1;
  transform: translateY(0);
}

.install-prompt--leave-active {
  transition: all 200ms ease-in;
}

.install-prompt--leave-from {
  opacity: 1;
  transform: translateY(0);
}

.install-prompt--leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
