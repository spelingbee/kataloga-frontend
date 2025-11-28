<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-full"
    >
      <div
        v-if="showPrompt"
        class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-20 shadow-lg"
      >
        <div class="p-4 max-w-md mx-auto">
          <div class="flex items-start gap-3">
            <!-- App Icon -->
            <div class="flex-shrink-0">
              <img
                src="/icon-72x72.png"
                alt="App Icon"
                class="w-12 h-12 rounded-lg"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h3 class="text-heading-sm font-semibold text-neutral-80 mb-1">
                Install Menu App
              </h3>
              <p class="text-body-sm text-neutral-80/70 mb-3">
                Get quick access to your favorite restaurant menu. Install our app for a better experience!
              </p>

              <!-- Actions -->
              <div class="flex gap-2">
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
              class="flex-shrink-0 p-1 text-neutral-80/50 hover:text-neutral-80 transition-colors"
              @click="handleDismiss"
            >
              <BaseIcon name="x" class="w-5 h-5" />
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
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_install', {
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
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_install_dismissed', {
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