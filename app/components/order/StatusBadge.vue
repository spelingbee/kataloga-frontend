<template>
  <BaseBadge
    :variant="badgeVariant"
    :size="size"
    class="status-badge"
  >
    {{ statusText }}
  </BaseBadge>
</template>

<script setup lang="ts">
// Props
interface Props {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

// Computed properties
const statusText = computed(() => {
  const texts: Record<string, string> = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'preparing': 'Preparing',
    'ready': 'Ready',
    'out-for-delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'available': 'Available',
    'unavailable': 'Unavailable'
  }
  return texts[props.status.toLowerCase()] || props.status
})

const badgeVariant = computed((): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    'pending': 'warning',
    'confirmed': 'info',
    'preparing': 'warning',
    'ready': 'success',
    'out-for-delivery': 'info',
    'delivered': 'success',
    'cancelled': 'error',
    'available': 'success',
    'unavailable': 'error'
  }
  return variants[props.status.toLowerCase()] || 'secondary'
})
</script>

<style scoped lang="scss">
.status-badge {
  // Additional styles if needed
  // BaseBadge component handles all styling
}
</style>