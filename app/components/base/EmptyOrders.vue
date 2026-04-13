<template>
  <EmptyState
    icon="clipboard-list"
    title="No orders yet"
    description="You haven't placed any orders yet. Start by exploring our delicious menu and place your first order."
    action-text="Start Ordering"
    action-icon="plus"
    @action="$emit('start-ordering')"
  />
</template>

<script setup lang="ts">
defineEmits<{
  'start-ordering': []
}>()
</script>
