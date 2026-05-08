<template>
  <EmptyState
    icon="utensils"
    :title="$t('menu.noItems')"
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

const { t } = useI18n()
const description = computed(() => {
  if (props.isSearch) {
    return t('menu.searchNoItemsDesc')
  }
  
  if (props.isFilter) {
    return t('menu.filterNoItemsDesc')
  }
  
  return t('menu.noItemsDesc')
})

const actionText = computed(() => {
  if (props.isSearch || props.isFilter) {
    return t('common.clearFilters')
  }
  
  return t('menu.refresh')
})
</script>
