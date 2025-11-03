<template>
  <span
    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
    :class="badgeClasses"
  >
    <BaseIcon
      :name="statusIcon"
      size="xs"
      class="mr-1.5"
    />
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OrderStatus } from '~/types'

// Props
interface Props {
  status: OrderStatus
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

// Computed properties
const statusText = computed(() => {
  const texts = {
    [OrderStatus.PENDING]: 'Pending',
    [OrderStatus.CONFIRMED]: 'Confirmed',
    [OrderStatus.PREPARING]: 'Preparing',
    [OrderStatus.READY]: 'Ready',
    [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
    [OrderStatus.DELIVERED]: 'Delivered',
    [OrderStatus.CANCELLED]: 'Cancelled'
  }
  return texts[props.status] || 'Unknown'
})

const statusIcon = computed(() => {
  const icons = {
    [OrderStatus.PENDING]: 'clock',
    [OrderStatus.CONFIRMED]: 'check',
    [OrderStatus.PREPARING]: 'chef-hat',
    [OrderStatus.READY]: 'bell',
    [OrderStatus.OUT_FOR_DELIVERY]: 'truck',
    [OrderStatus.DELIVERED]: 'check-circle',
    [OrderStatus.CANCELLED]: 'x'
  }
  return icons[props.status] || 'info'
})

const badgeClasses = computed(() => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium'
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  }
  
  // Status color classes
  const statusClasses = {
    [OrderStatus.PENDING]: 'bg-primary-orange/20 text-primary-orange border border-primary-orange/30',
    [OrderStatus.CONFIRMED]: 'bg-primary-green/20 text-primary-green border border-primary-green/30',
    [OrderStatus.PREPARING]: 'bg-primary-orange/20 text-primary-orange border border-primary-orange/30',
    [OrderStatus.READY]: 'bg-primary-green/20 text-primary-green border border-primary-green/30',
    [OrderStatus.OUT_FOR_DELIVERY]: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    [OrderStatus.DELIVERED]: 'bg-primary-green/20 text-primary-green border border-primary-green/30',
    [OrderStatus.CANCELLED]: 'bg-primary-red/20 text-primary-red border border-primary-red/30'
  }
  
  return [
    baseClasses,
    sizeClasses[props.size],
    statusClasses[props.status] || 'bg-neutral-20/20 text-neutral-20 border border-neutral-20/30'
  ].join(' ')
})
</script>

<style scoped>
/* Ensure consistent spacing */
.inline-flex {
  display: inline-flex;
  align-items: center;
}

/* Icon spacing */
.mr-1\.5 {
  margin-right: 0.375rem;
}

/* Smooth transitions */
.transition-colors {
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}
</style>