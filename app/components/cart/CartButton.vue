<template>
  <BaseButton
    variant="ghost"
    :size="size"
    class="relative text-white hover:text-primary-green transition-colors"
    :aria-label="`Cart with ${itemCount} items`"
    @click="$emit('click')"
  >
    <!-- Cart Icon -->
    <BaseIcon 
      name="cart" 
      :size="iconSize" 
      class="transition-colors"
    />
    
    <!-- Item Counter Badge -->
    <BaseBadge
      v-if="itemCount > 0"
      :count="itemCount"
      variant="primary"
      class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 text-xs font-semibold bg-primary-red text-white rounded-full flex items-center justify-center"
    >
      {{ displayCount }}
    </BaseBadge>
  </BaseButton>
</template>

<script setup lang="ts">
interface Props {
  itemCount?: number
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  itemCount: 0,
  size: 'md'
})

defineEmits<{
  click: []
}>()

// Computed properties
const iconSize = computed(() => {
  const sizes = { sm: 'sm', md: 'md', lg: 'lg' }
  return sizes[props.size]
})

const displayCount = computed(() => {
  return props.itemCount > 99 ? '99+' : props.itemCount.toString()
})
</script>
</template>

<style scoped>
/* Ensure badge positioning */
.relative {
  position: relative;
}

/* Badge animation */
.transition-colors {
  transition: color 0.2s ease-in-out;
}

/* Badge pulse animation when items are added */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.animate-pulse-once {
  animation: pulse 0.3s ease-in-out;
}
</style>