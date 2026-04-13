<template>
  <EmptyState
    icon="shopping-cart"
    title="Your cart is empty"
    description="Add some delicious items from our menu to get started with your order."
    action-text="Browse Menu"
    action-icon="utensils"
    @action="$emit('browse')"
  />
</template>

<script setup lang="ts">
defineEmits<{
  browse: []
}>()
</script>
