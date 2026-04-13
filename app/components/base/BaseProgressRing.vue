<template>
  <div
    :class="[
      'relative inline-flex items-center justify-center',
      sizeClasses[size]
    ]"
  >
    <!-- Background circle -->
    <svg
      :class="sizeClasses[size]"
      viewBox="0 0 100 100"
      class="transform -rotate-90"
    >
      <circle
        cx="50"
        cy="50"
        :r="radius"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        fill="transparent"
        class="text-gray-600"
      />
      
      <!-- Progress circle -->
      <circle
        cx="50"
        cy="50"
        :r="radius"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        fill="transparent"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        :class="[
          'transition-all duration-500 ease-out',
          colorClasses[color]
        ]"
        stroke-linecap="round"
      />
    </svg>
    
    <!-- Content -->
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="text-center">
        <slot>
          <div class="flex flex-col items-center">
            <AppText
              :size="textSize"
              color="white"
              class="font-semibold leading-none"
            >
              {{ displayValue }}
            </AppText>
            <AppText
              v-if="showMax"
              size="caption"
              color="muted"
              class="leading-none mt-0.5"
            >
              / {{ max }}
            </AppText>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'green' | 'red' | 'orange' | 'blue'
  strokeWidth?: number
  showMax?: boolean
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  size: 'md',
  color: 'primary',
  strokeWidth: 8,
  showMax: true,
  animated: true
})

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24'
}

const colorClasses = {
  primary: 'text-primary-red',
  green: 'text-primary-green',
  red: 'text-red-500',
  orange: 'text-primary-orange',
  blue: 'text-blue-500'
}

const textSize = computed(() => {
  const sizes = { sm: 'caption', md: 'body-sm', lg: 'body-md', xl: 'body-lg' }
  return sizes[props.size]
})

const radius = computed(() => {
  return (100 - props.strokeWidth) / 2
})

const circumference = computed(() => {
  return radius.value * 2 * Math.PI
})

const progress = computed(() => {
  return Math.min(Math.max(props.value / props.max, 0), 1)
})

const strokeDashoffset = computed(() => {
  return circumference.value - (progress.value * circumference.value)
})

const displayValue = computed(() => {
  return Math.round(props.value)
})
</script>
