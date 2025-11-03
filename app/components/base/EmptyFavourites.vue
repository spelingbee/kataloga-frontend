<template>
  <EmptyState
    icon="heart"
    title="No favourites yet"
    description="Mark dishes as favourites by tapping the heart icon. Your favourite items will appear here for quick access."
    action-text="Explore Menu"
    action-icon="search"
    @action="$emit('explore')"
  />
</template>

<script setup lang="ts">
defineEmits<{
  explore: []
}>()
</script>