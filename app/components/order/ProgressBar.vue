<template>
  <div class="w-full">
    <!-- Progress Steps -->
    <div class="flex items-center justify-between mb-2">
      <div
        v-for="(step, index) in progressSteps"
        :key="step.status"
        class="flex flex-col items-center flex-1"
        :class="{ 'last:flex-1-0': index === progressSteps.length - 1 }"
      >
        <!-- Step Circle -->
        <div class="relative flex items-center justify-center">
          <!-- Connection Line (before) -->
          <div
            v-if="index > 0"
            class="absolute right-full w-full h-0.5 -translate-x-2"
            :class="getLineClass(index - 1)"
          />
          
          <!-- Step Circle -->
          <div
            class="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300"
            :class="getStepClass(step.status)"
          >
            <BaseIcon
              :name="step.icon"
              size="sm"
              :class="getIconClass(step.status)"
            />
          </div>
          
          <!-- Connection Line (after) -->
          <div
            v-if="index < progressSteps.length - 1"
            class="absolute left-full w-full h-0.5 translate-x-2"
            :class="getLineClass(index)"
          />
        </div>
        
        <!-- Step Label -->
        <div class="mt-2 text-center">
          <AppText
            size="caption"
            :class="getTextClass(step.status)"
            class="font-medium"
          >
            {{ step.label }}
          </AppText>
          <AppText
            v-if="step.time"
            size="caption"
            class="text-neutral-20 mt-0.5"
          >
            {{ step.time }}
          </AppText>
        </div>
      </div>
    </div>
    
    <!-- Overall Progress Bar -->
    <div class="w-full bg-background-dark/50 rounded-full h-2 mt-4">
      <div
        class="bg-gradient-to-r from-primary-green to-green-400 h-2 rounded-full transition-all duration-500 ease-out"
        :style="{ width: `${progressPercentage}%` }"
      />
    </div>
    
    <!-- Progress Text -->
    <div class="flex justify-between items-center mt-2">
      <AppText size="caption" class="text-neutral-20">
        {{ currentStepText }}
      </AppText>
      <AppText size="caption" class="text-primary-green font-medium">
        {{ progressPercentage }}% Complete
      </AppText>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrderStatus } from '~/types'

// Props
interface Props {
  currentStatus: OrderStatus
  estimatedTimes?: Record<OrderStatus, string>
}

const props = withDefaults(defineProps<Props>(), {
  estimatedTimes: () => ({})
})

// Progress step configuration
const progressSteps = computed(() => [
  {
    status: OrderStatus.PENDING,
    label: 'Order Placed',
    icon: 'check',
    time: props.estimatedTimes[OrderStatus.PENDING]
  },
  {
    status: OrderStatus.CONFIRMED,
    label: 'Confirmed',
    icon: 'check-circle',
    time: props.estimatedTimes[OrderStatus.CONFIRMED]
  },
  {
    status: OrderStatus.PREPARING,
    label: 'Preparing',
    icon: 'chef-hat',
    time: props.estimatedTimes[OrderStatus.PREPARING]
  },
  {
    status: OrderStatus.READY,
    label: 'Ready',
    icon: 'bell',
    time: props.estimatedTimes[OrderStatus.READY]
  },
  {
    status: OrderStatus.OUT_FOR_DELIVERY,
    label: 'Delivering',
    icon: 'truck',
    time: props.estimatedTimes[OrderStatus.OUT_FOR_DELIVERY]
  },
  {
    status: OrderStatus.DELIVERED,
    label: 'Delivered',
    icon: 'check-circle-2',
    time: props.estimatedTimes[OrderStatus.DELIVERED]
  }
])

// Get current step index
const currentStepIndex = computed(() => {
  if (props.currentStatus === OrderStatus.CANCELLED) {
    return -1 // Special case for cancelled orders
  }
  
  return progressSteps.value.findIndex(step => step.status === props.currentStatus)
})

// Calculate progress percentage
const progressPercentage = computed(() => {
  if (props.currentStatus === OrderStatus.CANCELLED) {
    return 0
  }
  
  if (props.currentStatus === OrderStatus.DELIVERED) {
    return 100
  }
  
  const totalSteps = progressSteps.value.length - 1 // Exclude delivered step from calculation
  const currentIndex = currentStepIndex.value
  
  if (currentIndex < 0) return 0
  
  return Math.round((currentIndex / totalSteps) * 100)
})

// Current step text
const currentStepText = computed(() => {
  if (props.currentStatus === OrderStatus.CANCELLED) {
    return 'Order was cancelled'
  }
  
  const currentStep = progressSteps.value[currentStepIndex.value]
  return currentStep ? `Currently: ${currentStep.label}` : 'Processing...'
})

// Helper methods for styling
const getStepClass = (stepStatus: OrderStatus): string => {
  const currentIndex = currentStepIndex.value
  const stepIndex = progressSteps.value.findIndex(step => step.status === stepStatus)
  
  if (props.currentStatus === OrderStatus.CANCELLED) {
    return 'border-neutral-20 bg-background-dark text-neutral-20'
  }
  
  if (stepIndex <= currentIndex) {
    // Completed or current step
    if (stepIndex === currentIndex) {
      return 'border-primary-green bg-primary-green text-white animate-pulse'
    } else {
      return 'border-primary-green bg-primary-green text-white'
    }
  } else {
    // Future step
    return 'border-neutral-20 bg-background-dark text-neutral-20'
  }
}

const getIconClass = (stepStatus: OrderStatus): string => {
  const currentIndex = currentStepIndex.value
  const stepIndex = progressSteps.value.findIndex(step => step.status === stepStatus)
  
  if (props.currentStatus === OrderStatus.CANCELLED) {
    return 'text-neutral-20'
  }
  
  if (stepIndex <= currentIndex) {
    return 'text-white'
  } else {
    return 'text-neutral-20'
  }
}

const getTextClass = (stepStatus: OrderStatus): string => {
  const currentIndex = currentStepIndex.value
  const stepIndex = progressSteps.value.findIndex(step => step.status === stepStatus)
  
  if (props.currentStatus === OrderStatus.CANCELLED) {
    return 'text-neutral-20'
  }
  
  if (stepIndex <= currentIndex) {
    if (stepIndex === currentIndex) {
      return 'text-primary-green'
    } else {
      return 'text-white'
    }
  } else {
    return 'text-neutral-20'
  }
}

const getLineClass = (stepIndex: number): string => {
  const currentIndex = currentStepIndex.value
  
  if (props.currentStatus === OrderStatus.CANCELLED) {
    return 'bg-neutral-20/30'
  }
  
  if (stepIndex < currentIndex) {
    return 'bg-primary-green'
  } else {
    return 'bg-neutral-20/30'
  }
}
</script>

<style scoped>
/* Flex utilities */
.flex-1 {
  flex: 1 1 0%;
}

.flex-1-0 {
  flex: 1 1 0%;
}

/* Position utilities */
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.z-10 {
  z-index: 10;
}

/* Transform utilities */
.-translate-x-2 {
  transform: translateX(-0.5rem);
}

.translate-x-2 {
  transform: translateX(0.5rem);
}

/* Width and height utilities */
.w-8 {
  width: 2rem;
}

.h-8 {
  height: 2rem;
}

.h-0\.5 {
  height: 0.125rem;
}

.h-2 {
  height: 0.5rem;
}

/* Spacing utilities */
.mt-0\.5 {
  margin-top: 0.125rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

/* Border utilities */
.border-2 {
  border-width: 2px;
}

.rounded-full {
  border-radius: 9999px;
}

/* Animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Transitions */
.transition-all {
  transition: all 0.3s ease-in-out;
}

.duration-300 {
  transition-duration: 300ms;
}

.duration-500 {
  transition-duration: 500ms;
}

.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

/* Gradient */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-primary-green {
  --tw-gradient-from: theme('colors.primary.green');
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(32, 171, 71, 0));
}

.to-green-400 {
  --tw-gradient-to: #4ade80;
}
</style>