<template>
  <EmptyState
    icon="utensils"
    title="No menu items found"
    :description="description"
    :action-text="actionText"
    action-icon="refresh-cw"
    @action="$emit('retry')"
  />
</template>

<script setup lang="ts">
interface Props {
  isSearch?: boolean
  isFilter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSearch: false,
  isFilter: false,
})

defineEmits<{
  retry: []
}>()

const description = computed(() => {
  if (props.isSearch) {
    return "We couldn't find any dishes matching your search. Try different keywords or browse our categories."
  }
  
  if (props.isFilter) {
    return "No dishes match your current filters. Try adjusting your criteria or clear filters to see all items."
  }
  
  return "Our menu is currently being updated. Please try again in a moment."
})

const actionText = computed(() => {
  if (props.isSearch || props.isFilter) {
    return "Clear filters"
  }
  
  return "Refresh menu"
})
</script>