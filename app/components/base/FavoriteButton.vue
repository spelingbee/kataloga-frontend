<template>
  <button
    :class="buttonClasses"
    :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
    @click.stop="handleClick"
  >
    <BaseIcon 
      :name="isFavorite ? 'heart-filled' : 'heart'" 
      :size="size"
      :class="iconClasses"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFavoritesStore } from '~/stores/favorites'

interface Props {
  itemId: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'minimal'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default'
})

const emit = defineEmits<{
  toggle: [itemId: string, isFavorite: boolean]
}>()

const favoritesStore = useFavoritesStore()

const isFavorite = computed(() => favoritesStore.isFavorite(props.itemId))

const buttonClasses = computed(() => {
  const base = 'favorite-button transition-all duration-200'
  const variants = {
    default: 'favorite-button--default',
    ghost: 'favorite-button--ghost',
    minimal: 'favorite-button--minimal'
  }
  const sizes = {
    sm: 'favorite-button--sm',
    md: 'favorite-button--md',
    lg: 'favorite-button--lg'
  }
  
  return [
    base,
    variants[props.variant],
    sizes[props.size],
    isFavorite.value ? 'favorite-button--active' : ''
  ].join(' ')
})

const iconClasses = computed(() => {
  return isFavorite.value ? 'text-primary-red' : 'text-neutral-60'
})

const handleClick = async () => {
  await favoritesStore.toggleFavorite(props.itemId)
  emit('toggle', props.itemId, favoritesStore.isFavorite(props.itemId))
  
  // Add haptic feedback on mobile
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}
</script>

<style lang="scss" scoped>


.favorite-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: $radius-full;
  transition: all $transition-base;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-success);
    outline-offset: 2px;
  }
}

.favorite-button--default {
  padding: $space-2;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.favorite-button--ghost {
  padding: $space-2;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.favorite-button--minimal {
  padding: $space-1;
}

.favorite-button--sm {
  width: 32px;
  height: 32px;
}

.favorite-button--md {
  width: 40px;
  height: 40px;
}

.favorite-button--lg {
  width: 48px;
  height: 48px;
}

.favorite-button--active {
  animation: heartbeat 0.3s ease-in-out;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(1.1);
  }
  75% {
    transform: scale(1.15);
  }
}
</style>
