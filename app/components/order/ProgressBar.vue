<template>
  <div class="progress-bar">
    <!-- Progress Steps -->
    <div class="progress-bar__steps">
      <div
        v-for="(step, index) in progressSteps"
        :key="step.status"
        class="progress-bar__step"
      >
        <!-- Step Circle -->
        <div class="progress-bar__step-wrapper">
          <!-- Connection Line (before) -->
          <div
            v-if="index > 0"
            :class="[
              'progress-bar__line',
              'progress-bar__line--before',
              { 'progress-bar__line--completed': isStepCompleted(index - 1) }
            ]"
          />
          
          <!-- Step Circle -->
          <div
            :class="[
              'progress-bar__circle',
              {
                'progress-bar__circle--completed': isStepCompleted(index),
                'progress-bar__circle--current': isCurrentStep(index),
                'progress-bar__circle--cancelled': isCancelled
              }
            ]"
          >
            <BaseIcon
              :name="step.icon"
              size="sm"
              class="progress-bar__icon"
            />
          </div>
          
          <!-- Connection Line (after) -->
          <div
            v-if="index < progressSteps.length - 1"
            :class="[
              'progress-bar__line',
              'progress-bar__line--after',
              { 'progress-bar__line--completed': isStepCompleted(index) }
            ]"
          />
        </div>
        
        <!-- Step Label -->
        <div class="progress-bar__label">
          <span
            :class="[
              'progress-bar__label-text',
              {
                'progress-bar__label-text--completed': isStepCompleted(index),
                'progress-bar__label-text--current': isCurrentStep(index),
                'progress-bar__label-text--cancelled': isCancelled
              }
            ]"
          >
            {{ step.label }}
          </span>
          <span
            v-if="step.time"
            class="progress-bar__label-time"
          >
            {{ step.time }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Overall Progress Bar -->
    <div class="progress-bar__track">
      <div
        class="progress-bar__fill"
        :style="{ width: `${progressPercentage}%` }"
      />
    </div>
    
    <!-- Progress Text -->
    <div class="progress-bar__info">
      <span class="progress-bar__info-text">
        {{ currentStepText }}
      </span>
      <span class="progress-bar__info-percentage">
        {{ progressPercentage }}% Complete
      </span>
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
    return -1
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
  
  const totalSteps = progressSteps.value.length - 1
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

// Helper methods
const isCancelled = computed(() => props.currentStatus === OrderStatus.CANCELLED)

const isStepCompleted = (stepIndex: number): boolean => {
  if (isCancelled.value) return false
  return stepIndex < currentStepIndex.value
}

const isCurrentStep = (stepIndex: number): boolean => {
  if (isCancelled.value) return false
  return stepIndex === currentStepIndex.value
}
</script>

<style lang="scss" scoped>


.progress-bar {
  width: 100%;
}

.progress-bar__steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-2;
}

.progress-bar__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.progress-bar__step-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar__line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: rgba($color-neutral-20, 0.3);
  transition: background $transition-base;

  &--before {
    right: 100%;
    transform: translateX(-0.5rem);
  }

  &--after {
    left: 100%;
    transform: translateX(0.5rem);
  }

  &--completed {
    background: var(--color-success);
  }
}

.progress-bar__circle {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: $radius-full;
  border: 2px solid $color-neutral-20;
  background: var(--bg-tertiary);
  transition: all $transition-base;

  &--completed {
    border-color: var(--color-success);
    background: var(--color-success);
    
    .progress-bar__icon {
      color: white;
    }
  }

  &--current {
    border-color: var(--color-success);
    background: var(--color-success);
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    
    .progress-bar__icon {
      color: white;
    }
  }

  &--cancelled {
    border-color: $color-neutral-20;
    background: var(--bg-tertiary);
    
    .progress-bar__icon {
      color: $color-neutral-20;
    }
  }
}

.progress-bar__icon {
  color: $color-neutral-20;
  transition: color $transition-base;
}

.progress-bar__label {
  margin-top: $space-2;
  text-align: center;
}

.progress-bar__label-text {
  display: block;
  font-size: $text-xs;
  font-weight: $font-medium;
  color: $color-neutral-20;
  transition: color $transition-base;

  &--completed {
    color: white;
  }

  &--current {
    color: var(--color-success);
  }

  &--cancelled {
    color: $color-neutral-20;
  }
}

.progress-bar__label-time {
  display: block;
  font-size: $text-xs;
  color: $color-neutral-20;
  margin-top: 0.125rem;
}

.progress-bar__track {
  width: 100%;
  height: 0.5rem;
  background: rgba(var(--bg-tertiary), 0.5);
  border-radius: $radius-full;
  margin-top: $space-6;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: linear-gradient(to right, var(--color-success), #4ade80);
  border-radius: $radius-full;
  transition: width 500ms ease-out;
}

.progress-bar__info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $space-2;
}

.progress-bar__info-text {
  font-size: $text-xs;
  color: $color-neutral-20;
}

.progress-bar__info-percentage {
  font-size: $text-xs;
  color: var(--color-success);
  font-weight: $font-medium;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
