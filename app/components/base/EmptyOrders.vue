<template>
  <EmptyState
    icon="clipboard-list"
    :title="$t('order.noOrders')"
    :description="$t('order.emptyDesc')"
    :action-text="$t('order.startOrdering')"
    action-icon="plus"
    @action="$emit('start-ordering')"
  />
</template>

<script setup lang="ts">
defineEmits<{
  'start-ordering': []
}>()
</script>
