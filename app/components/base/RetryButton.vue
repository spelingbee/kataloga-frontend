<template>
  <BaseButton
    :variant="variant"
    :size="size"
    :loading="loading"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <template v-if="!loading">
      <BaseIcon name="refresh-cw" :size="iconSize" />
      <span>{{ label }}</span>
    </template>
    <template v-else>
      <span>{{ loadingLabel }}</span>
    </template>
  </BaseButton>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  label?: string
  loadingLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  label: 'Retry',
  loadingLabel: 'Retrying...',
})

const emit = defineEmits<{
  click: []
}>()

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'xs'
    case 'lg':
      return 'md'
    default:
      return 'sm'
  }
})

const handleClick = () => {
  if (!props.disabled && !props.loading) {
    emit('click')
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/scss/abstracts/variables' as *;

button {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  transition: all $transition-base;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
}
</style>
