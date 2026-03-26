<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-neutral-80/20">
      <div class="flex items-center gap-4">
        <BaseButton 
          variant="ghost" 
          @click="router.go(-1)"
        >
          <BaseIcon name="arrow-left" size="md" />
        </BaseButton>
        <div>
          <AppHeading level="h1" size="heading-lg" class="text-white">
            Preparation Time
          </AppHeading>
          <AppText class="text-neutral-20">
            {{ dish?.name }}
          </AppText>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"/>
        <AppText class="text-neutral-20">Loading preparation details...</AppText>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="px-6 py-8">
      <!-- Current Preparation Time -->
      <div class="mb-8 text-center">
        <div class="w-32 h-32 bg-primary-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <div class="text-center">
            <AppText size="display-lg" class="text-primary-green font-bold">
              {{ currentPrepTime }}
            </AppText>
            <AppText size="body-sm" class="text-primary-green">
              minutes
            </AppText>
          </div>
        </div>
        
        <AppHeading level="h2" size="heading-xl" class="text-white mb-2">
          Estimated Preparation Time
        </AppHeading>
        <AppText class="text-neutral-20">
          Based on current kitchen load and dish complexity
        </AppText>
      </div>

      <!-- Time Breakdown -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Preparation Breakdown
        </AppHeading>
        
        <div class="space-y-4">
          <div
            v-for="step in preparationSteps"
            :key="step.id"
            class="flex items-center gap-4"
          >
            <!-- Step Icon -->
            <div class="w-10 h-10 bg-primary-green/20 rounded-full flex items-center justify-center flex-shrink-0">
              <BaseIcon :name="step.icon" size="md" class="text-primary-green" />
            </div>
            
            <!-- Step Info -->
            <div class="flex-1">
              <AppText size="body-md" class="text-white font-medium">
                {{ step.name }}
              </AppText>
              <AppText size="body-sm" class="text-neutral-20">
                {{ step.description }}
              </AppText>
            </div>
            
            <!-- Step Time -->
            <div class="text-right">
              <AppText size="body-md" class="text-primary-green font-semibold">
                {{ step.time }} min
              </AppText>
            </div>
          </div>
        </div>
        
        <!-- Total Time -->
        <div class="mt-6 pt-4 border-t border-neutral-80/20">
          <div class="flex items-center justify-between">
            <AppText size="body-lg" class="text-white font-semibold">
              Total Preparation Time
            </AppText>
            <AppText size="body-lg" class="text-primary-green font-bold">
              {{ totalStepTime }} minutes
            </AppText>
          </div>
        </div>
      </div>

      <!-- Kitchen Status -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Current Kitchen Status
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Queue Status -->
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-orange/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BaseIcon name="users" size="lg" class="text-primary-orange" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ queueLength }}</AppText>
            <AppText size="caption" class="text-neutral-20">Orders in queue</AppText>
          </div>
          
          <!-- Kitchen Load -->
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-red/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BaseIcon name="activity" size="lg" class="text-primary-red" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ kitchenLoad }}%</AppText>
            <AppText size="caption" class="text-neutral-20">Kitchen capacity</AppText>
          </div>
          
          <!-- Staff Available -->
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-green/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BaseIcon name="chef-hat" size="lg" class="text-primary-green" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ availableChefs }}</AppText>
            <AppText size="caption" class="text-neutral-20">Chefs available</AppText>
          </div>
        </div>
        
        <!-- Status Message -->
        <div class="mt-6 p-4 rounded-lg" :class="statusMessageClass">
          <div class="flex items-center gap-3">
            <BaseIcon :name="statusIcon" size="md" :class="statusIconClass" />
            <div>
              <AppText size="body-sm" class="font-medium" :class="statusTextClass">
                {{ statusMessage }}
              </AppText>
              <AppText size="caption" class="text-neutral-20">
                {{ statusDescription }}
              </AppText>
            </div>
          </div>
        </div>
      </div>

      <!-- Time Options -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Delivery Options
        </AppHeading>
        
        <div class="space-y-4">
          <label
            v-for="option in timeOptions"
            :key="option.id"
            class="flex items-center gap-4 p-4 rounded-lg border border-neutral-80/30 hover:border-primary-green/50 transition-colors cursor-pointer"
            :class="{ 'border-primary-green bg-primary-green/10': selectedTimeOption === option.id }"
          >
            <input
              v-model="selectedTimeOption"
              :value="option.id"
              type="radio"
              class="sr-only"
            />
            
            <!-- Option Icon -->
            <div
class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                 :class="option.iconBg">
              <BaseIcon :name="option.icon" size="md" :class="option.iconColor" />
            </div>
            
            <!-- Option Info -->
            <div class="flex-1">
              <AppText size="body-md" class="text-white font-medium">
                {{ option.name }}
              </AppText>
              <AppText size="body-sm" class="text-neutral-20">
                {{ option.description }}
              </AppText>
              <AppText size="caption" class="text-neutral-20">
                {{ option.time }} • {{ option.price ? formatPrice(option.price) : 'No extra cost' }}
              </AppText>
            </div>
            
            <!-- Selection Indicator -->
            <div 
              v-if="selectedTimeOption === option.id"
              class="w-6 h-6 bg-primary-green rounded-full flex items-center justify-center"
            >
              <BaseIcon name="check" size="sm" class="text-white" />
            </div>
          </label>
        </div>
      </div>

      <!-- Rush Order Info -->
      <div class="mb-8 p-4 bg-primary-orange/10 border border-primary-orange/30 rounded-xl">
        <div class="flex items-start gap-3">
          <BaseIcon name="zap" size="md" class="text-primary-orange mt-1" />
          <div>
            <AppHeading level="h4" size="heading-sm" class="text-white mb-2">
              Need it faster?
            </AppHeading>
            <AppText size="body-sm" class="text-neutral-20 mb-3">
              Rush orders are prepared with priority but may incur additional charges. 
              Available during non-peak hours only.
            </AppText>
            <BaseButton 
              variant="secondary" 
              size="sm"
              :disabled="!canRushOrder"
              @click="requestRushOrder"
            >
              <BaseIcon name="zap" size="sm" class="mr-2" />
              Request Rush Order
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Historical Data -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Historical Performance
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-2">Average Preparation Time</AppText>
            <AppText size="body-lg" class="text-white font-semibold">{{ averagePrepTime }} minutes</AppText>
            <AppText size="caption" class="text-neutral-20">Based on last 30 orders</AppText>
          </div>
          
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-2">On-Time Delivery Rate</AppText>
            <AppText size="body-lg" class="text-white font-semibold">{{ onTimeRate }}%</AppText>
            <AppText size="caption" class="text-neutral-20">Orders delivered on time</AppText>
          </div>
        </div>
        
        <!-- Time Chart Placeholder -->
        <div class="mt-6 h-32 bg-neutral-80/10 rounded-lg flex items-center justify-center">
          <AppText class="text-neutral-80">Preparation time chart</AppText>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4">
        <BaseButton 
          variant="primary"
          size="lg"
          class="flex-1"
          @click="confirmTimeSelection"
        >
          <BaseIcon name="check" size="sm" class="mr-2" />
          Confirm Time Selection
        </BaseButton>
        
        <BaseButton 
          variant="secondary"
          size="lg"
          @click="setReminder"
        >
          <BaseIcon name="bell" size="sm" class="mr-2" />
          Set Reminder
        </BaseButton>
        
        <BaseButton 
          variant="ghost"
          size="lg"
          @click="router.push(`/dish/${dishId}`)"
        >
          Back to Dish
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItemUI } from '~/types/ui'
import { createMenuItemUI } from '~/types/utils/converters'

// Page setup
definePageMeta({
  title: 'Preparation Time - Menu Ordering App'
})

// Route and stores
const route = useRoute()
const router = useRouter()

// Reactive state
const loading = ref(true)
const selectedTimeOption = ref('standard')

// Timer IDs for cleanup on unmount (prevent memory leaks)
const kitchenStatusIntervalId = ref<number | null>(null)
const reminderTimeoutId = ref<number | null>(null)

// Get dish ID from route
const dishId = computed(() => route.params.id as string)

// Mock dish data
const dish = ref<MenuItemUI | null>(null)

// Mock preparation data
const currentPrepTime = ref(18)
const queueLength = ref(3)
const kitchenLoad = ref(75)
const availableChefs = ref(4)
const averagePrepTime = ref(16)
const onTimeRate = ref(94)

const preparationSteps = ref([
  {
    id: '1',
    name: 'Order Processing',
    description: 'Receiving and confirming your order',
    time: 2,
    icon: 'clipboard'
  },
  {
    id: '2',
    name: 'Ingredient Preparation',
    description: 'Gathering and preparing fresh ingredients',
    time: 5,
    icon: 'knife'
  },
  {
    id: '3',
    name: 'Cooking',
    description: 'Cooking your dish to perfection',
    time: 8,
    icon: 'flame'
  },
  {
    id: '4',
    name: 'Plating & Quality Check',
    description: 'Final presentation and quality assurance',
    time: 3,
    icon: 'check-circle'
  }
])

const timeOptions = ref([
  {
    id: 'standard',
    name: 'Standard Preparation',
    description: 'Normal preparation time with quality focus',
    time: '15-20 minutes',
    price: 0,
    icon: 'clock',
    iconColor: 'text-primary-green',
    iconBg: 'bg-primary-green/20'
  },
  {
    id: 'express',
    name: 'Express Service',
    description: 'Faster preparation with priority handling',
    time: '10-15 minutes',
    price: 3.00,
    icon: 'zap',
    iconColor: 'text-primary-orange',
    iconBg: 'bg-primary-orange/20'
  },
  {
    id: 'scheduled',
    name: 'Scheduled Preparation',
    description: 'Choose your preferred pickup/delivery time',
    time: 'Your choice',
    price: 0,
    icon: 'calendar',
    iconColor: 'text-primary-red',
    iconBg: 'bg-primary-red/20'
  }
])

// Computed
const totalStepTime = computed(() => {
  return preparationSteps.value.reduce((total, step) => total + step.time, 0)
})

const canRushOrder = computed(() => {
  return kitchenLoad.value < 80 && queueLength.value < 5
})

const statusMessage = computed(() => {
  if (kitchenLoad.value < 50) return 'Kitchen running smoothly'
  if (kitchenLoad.value < 80) return 'Moderate kitchen activity'
  return 'High kitchen activity'
})

const statusDescription = computed(() => {
  if (kitchenLoad.value < 50) return 'Your order will be prepared quickly'
  if (kitchenLoad.value < 80) return 'Slight delays possible during peak times'
  return 'Extended preparation times expected'
})

const statusIcon = computed(() => {
  if (kitchenLoad.value < 50) return 'check-circle'
  if (kitchenLoad.value < 80) return 'clock'
  return 'alert-circle'
})

const statusIconClass = computed(() => {
  if (kitchenLoad.value < 50) return 'text-primary-green'
  if (kitchenLoad.value < 80) return 'text-primary-orange'
  return 'text-primary-red'
})

const statusTextClass = computed(() => {
  if (kitchenLoad.value < 50) return 'text-primary-green'
  if (kitchenLoad.value < 80) return 'text-primary-orange'
  return 'text-primary-red'
})

const statusMessageClass = computed(() => {
  if (kitchenLoad.value < 50) return 'bg-primary-green/10 border border-primary-green/30'
  if (kitchenLoad.value < 80) return 'bg-primary-orange/10 border border-primary-orange/30'
  return 'bg-primary-red/10 border border-primary-red/30'
})

// Methods
const loadDish = async () => {
  loading.value = true
  
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    dish.value = createMenuItemUI({
      id: dishId.value,
      name: 'Delicious Burger',
      description: 'A mouth-watering burger',
      price: 15.99,
      categoryId: 'fastfood',
      isActive: true,
      preparationTime: currentPrepTime.value
    })
    
    // Simulate real-time updates
    updateKitchenStatus()
    
  } catch (error) {
    console.error('Error loading dish:', error)
  } finally {
    loading.value = false
  }
}

const updateKitchenStatus = () => {
  // Store interval ID for cleanup
  kitchenStatusIntervalId.value = window.setInterval(() => {
    // Randomly update kitchen metrics
    queueLength.value = Math.max(0, queueLength.value + Math.floor(Math.random() * 3) - 1)
    kitchenLoad.value = Math.max(20, Math.min(100, kitchenLoad.value + Math.floor(Math.random() * 10) - 5))
    currentPrepTime.value = Math.max(10, Math.min(30, currentPrepTime.value + Math.floor(Math.random() * 4) - 2))
  }, 30000) // Update every 30 seconds
}

const requestRushOrder = () => {
  if (canRushOrder.value) {
    selectedTimeOption.value = 'express'
    // Show confirmation or additional options
  }
}

const confirmTimeSelection = () => {
  const selectedOption = timeOptions.value.find(opt => opt.id === selectedTimeOption.value)
  
  // Pass time selection back to dish page
  router.push({
    path: `/dish/${dishId.value}`,
    query: { 
      timeOption: selectedTimeOption.value,
      estimatedTime: currentPrepTime.value.toString()
    }
  })
}

const setReminder = () => {
  // Set up notification reminder
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        // Store timeout ID for cleanup
        reminderTimeoutId.value = window.setTimeout(() => {
          new Notification('Order Ready Soon!', {
            body: `Your ${dish.value?.name} will be ready in 5 minutes`,
            icon: '/icon-192x192.png'
          })
        }, (currentPrepTime.value - 5) * 60 * 1000) // 5 minutes before ready
      }
    })
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

// Initialize
onMounted(() => {
  loadDish()
})

// Cleanup interval and timeout on unmount to prevent memory leaks
onUnmounted(() => {
  if (kitchenStatusIntervalId.value !== null) {
    window.clearInterval(kitchenStatusIntervalId.value)
    kitchenStatusIntervalId.value = null
  }
  if (reminderTimeoutId.value !== null) {
    window.clearTimeout(reminderTimeoutId.value)
    reminderTimeoutId.value = null
  }
})

// Update page title
watchEffect(() => {
  if (dish.value) {
    useHead({
      title: `Preparation Time - ${dish.value.name} - Menu Ordering App`
    })
  }
})
</script>