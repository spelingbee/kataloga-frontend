<template>
  <div class="min-h-screen bg-background-dark flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <!-- Offline Icon -->
      <div class="mb-6">
        <div class="w-24 h-24 mx-auto bg-neutral-20 rounded-full flex items-center justify-center">
          <BaseIcon name="wifi-off" class="w-12 h-12 text-neutral-80/50" />
        </div>
      </div>

      <!-- Title -->
      <h1 class="text-heading-xl font-semibold text-white mb-4">
        You're Offline
      </h1>

      <!-- Description -->
      <p class="text-body-lg text-white/70 mb-8">
        It looks like you've lost your internet connection. Don't worry, you can still browse your cart and favorites.
      </p>

      <!-- Available Actions -->
      <div class="space-y-4 mb-8">
        <NuxtLink
          to="/favourites"
          class="block w-full bg-primary-green hover:bg-primary-green/90 text-white py-3 px-6 rounded-lg font-medium transition-colors"
        >
          View Favorites
        </NuxtLink>
        
        <button
          :disabled="checking"
          class="block w-full bg-neutral-20 hover:bg-neutral-20/90 text-neutral-80 py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
          @click="checkConnection"
        >
          {{ checking ? 'Checking...' : 'Try Again' }}
        </button>
      </div>

      <!-- Offline Features -->
      <div class="text-left bg-background-card rounded-lg p-6">
        <h3 class="text-heading-sm font-semibold text-white mb-4">
          What you can do offline:
        </h3>
        
        <ul class="space-y-3 text-body-sm text-white/70">
          <li class="flex items-start gap-3">
            <BaseIcon name="check" class="w-5 h-5 text-primary-green flex-shrink-0 mt-0.5" />
            <span>Browse your favorite dishes</span>
          </li>
          <li class="flex items-start gap-3">
            <BaseIcon name="check" class="w-5 h-5 text-primary-green flex-shrink-0 mt-0.5" />
            <span>View your cart items</span>
          </li>
          <li class="flex items-start gap-3">
            <BaseIcon name="check" class="w-5 h-5 text-primary-green flex-shrink-0 mt-0.5" />
            <span>Place orders (will sync when online)</span>
          </li>
          <li class="flex items-start gap-3">
            <BaseIcon name="check" class="w-5 h-5 text-primary-green flex-shrink-0 mt-0.5" />
            <span>Browse cached menu items</span>
          </li>
        </ul>
      </div>

      <!-- Connection Status -->
      <div class="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div class="flex items-center gap-2 text-red-400">
          <BaseIcon name="wifi-off" class="w-4 h-4" />
          <span class="text-body-sm">No internet connection</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page meta
definePageMeta({
  layout: false,
})

// Set head
useHead({
  title: 'Offline - Menu Ordering App',
  meta: [
    {
      name: 'description',
      content: 'You are currently offline. Some features may be limited.',
    },
  ],
})

const checking = ref(false)

const checkConnection = async () => {
  checking.value = true
  
  try {
    // Try to fetch a small resource to check connectivity
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
    })
    
    if (response.ok) {
      // Connection restored, redirect to home
      await navigateTo('/')
    } else {
      throw new Error('Still offline')
    }
  } catch (error) {
    // Still offline, show message
    setTimeout(() => {
      checking.value = false
    }, 1000)
  }
}

// Listen for online event
onMounted(() => {
  const handleOnline = () => {
    // Redirect to home when connection is restored
    navigateTo('/')
  }
  
  window.addEventListener('online', handleOnline)
  
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
  })
})
</script>
