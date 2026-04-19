<template>
  <span
    :class="[
      'menu-item-badge',
      `menu-item-badge--${type}`,
      `menu-item-badge--${size}`
    ]"
  >
    <BaseIcon
      v-if="icon"
      :name="icon"
      :size="size === 'sm' ? 'xs' : 'sm'"
      class="menu-item-badge__icon"
    />
    <span class="menu-item-badge__text">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type BadgeType = 'new' | 'popular' | 'spicy' | 'vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free'
type BadgeSize = 'sm' | 'md'

interface Props {
  type: BadgeType
  size?: BadgeSize
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm'
})

const icon = computed(() => {
  const iconMap: Record<BadgeType, string> = {
    new: 'sparkles',
    popular: 'fire',
    spicy: 'flame',
    vegetarian: 'leaf',
    vegan: 'leaf',
    'gluten-free': 'wheat-off',
    'dairy-free': 'milk-off'
  }
  return iconMap[props.type]
})

const label = computed(() => {
  if (props.label) return props.label

  const labelMap: Record<BadgeType, string> = {
    new: 'New',
    popular: 'Popular',
    spicy: 'Spicy',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    'gluten-free': 'Gluten Free',
    'dairy-free': 'Dairy Free'
  }
  return labelMap[props.type]
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;

.menu-item-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: $radius-full;
  font-weight: $font-medium;
  white-space: nowrap;
  transition: all $transition-base;

  &--sm {
    font-size: $text-xs;
    padding: 2px 6px;
  }

  &--md {
    font-size: $text-sm;
    padding: 4px 10px;
  }

  &--new {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  &--popular {
    background: linear-gradient(135deg, var(--color-warning) 0%, var(--color-error) 100%);
    color: white;
    animation: pulse 2s ease-in-out infinite;
  }

  &--spicy {
    background: linear-gradient(135deg, var(--color-error) 0%, #ff6b6b 100%);
    color: white;
  }

  &--vegetarian {
    background: linear-gradient(135deg, var(--color-success) 0%, #51cf66 100%);
    color: white;
  }

  &--vegan {
    background: linear-gradient(135deg, #20c997 0%, #12b886 100%);
    color: white;
  }

  &--gluten-free {
    background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%);
    color: var(--text-primary);
  }

  &--dairy-free {
    background: linear-gradient(135deg, #74c0fc 0%, #4dabf7 100%);
    color: white;
  }
}

.menu-item-badge__icon {
  flex-shrink: 0;
}

.menu-item-badge__text {
  line-height: 1;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}
</style>
