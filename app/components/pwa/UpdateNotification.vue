<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-full"
    >
      <div
        v-if="showUpdate"
        class="fixed top-0 left-0 right-0 z-50 bg-primary-green text-white shadow-lg"
      >
        <div class="p-3 max-w-md mx-auto">
          <div class="flex items-center gap-3">
            <!-- Update Icon -->
            <div class="flex-shrink-0">
              <BaseIcon name="refresh" class="w-5 h-5" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-body-sm font-medium">
                New version available!
              </p>
              <p class="text-body-sm opacity-90">
                Tap to update and get the latest features.
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                :disabled="updating"
                class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-body-sm font-medium transition-colors disabled:opacity-50"
                @click="handleUpdate"
              >
                {{ updating ? 'Updating...' : 'Update' }}
              </button>
              <button
                class="p-1 hover:bg-white/20 rounded transition-colors"
                @click="handleDismiss"
              >
                <BaseIcon name="x" class="w-4 h-4" />
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