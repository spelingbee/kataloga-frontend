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

const { t } = useI18n()

// Computed properties
const statusText = computed(() => {
  const statusKey = props.status.toLowerCase().replace(/-/g, '_')
  const localized = t(`orders.statuses.${statusKey}`)
  
  // Fallback to previous translations if new ones not present, or directly return status
  if (localized && !localized.includes('orders.statuses')) {
    return localized
  }

  const legacyTexts: Record<string, string> = {
    'pending': t('orders.pending'),
    'confirmed': t('orders.confirmed'),
    'preparing': t('orders.preparing'),
    'ready': t('orders.ready'),
    'out_for_delivery': t('orders.inTransit'), // Adjusted to match ru.json
    'delivered': t('orders.delivered'),
    'cancelled': t('orders.cancelled'),
    'available': t('common.success'),
    'unavailable': t('common.error')
  }
  
  return legacyTexts[statusKey] || props.status
})

const badgeVariant = computed((): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  const statusKey = props.status.toLowerCase().replace(/-/g, '_')
  const variants: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
    'pending': 'warning',
    'confirmed': 'info',
    'preparing': 'warning',
    'ready': 'success',
    'out_for_delivery': 'info',
    'delivered': 'success',
    'cancelled': 'error',
    'available': 'success',
    'unavailable': 'error'
  }
  return variants[statusKey] || 'secondary'
})
</script>

<style scoped lang="scss">
.status-badge {
  // Additional styles if needed
  // BaseBadge component handles all styling
}
</style>
