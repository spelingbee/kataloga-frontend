<template>
  <EmptyState
    icon="heart"
    :title="$t('favorites.noFavorites')"
    :description="$t('favorites.emptyDesc')"
    :action-text="$t('favorites.browseMenu')"
    action-icon="search"
    @action="$emit('explore')"
  />
</template>

<script setup lang="ts">
defineEmits<{
  explore: []
}>()
</script>
