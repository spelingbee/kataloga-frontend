<template>
  <EmptyState
    icon="shopping-cart"
    :title="$t('cart.empty')"
    :description="$t('cart.emptyDesc')"
    :action-text="$t('common.browseMenu')"
    action-icon="utensils"
    @action="$emit('browse')"
  />
</template>

<script setup lang="ts">
defineEmits<{
  browse: []
}>()
</script>
