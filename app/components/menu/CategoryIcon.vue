<template>
  <div
    :class="[
      'inline-flex items-center justify-center transition-all duration-200',
      sizeClasses[size],
      {
        'bg-category-all': categoryType === 'all',
        'bg-category-salad': categoryType === 'salad',
        'bg-category-main': categoryType === 'main',
        'bg-category-meat': categoryType === 'meat',
        'bg-category-fastfood': categoryType === 'fastfood',
        'bg-category-dessert': categoryType === 'dessert',
        'bg-category-drinks': categoryType === 'drinks',
        'bg-neutral-80': !categoryType || categoryType === 'default'
      },
      'rounded-lg shadow-category'
    ]"
  >
    <!-- Emoji Icons -->
    <span 
      v-if="iconType === 'emoji'"
      :class="textSizeClasses[size]"
      class="select-none"
      role="img"
      :aria-label="ariaLabel"
    >
      {{ emojiIcon }}
    </span>
    
    <!-- SVG Icons -->
    <BaseIcon
      v-else-if="iconType === 'svg'"
      :name="svgIconName"
      :size="iconSize"
      class="text-white"
    />
    
    <!-- Fallback -->
    <BaseIcon
      v-else
      name="category"
      :size="iconSize"
      class="text-white opacity-60"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  category: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  iconType?: 'emoji' | 'svg' | 'auto'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  iconType: 'auto'
})

// Size classes for the container
const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

// Text size classes for emoji
const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl'
}

// Icon size mapping for BaseIcon
const iconSizeMap = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl'
}

// Category type mapping
const categoryTypeMap: Record<string, string> = {
  all: 'all',
  burger: 'all',
  burgers: 'all',
  salad: 'salad',
  salads: 'salad',
  main: 'main',
  'main-dishes': 'main',
  'main-course': 'main',
  meat: 'meat',
  steaks: 'meat',
  fastfood: 'fastfood',
  'fast-food': 'fastfood',
  dessert: 'dessert',
  desserts: 'dessert',
  drinks: 'drinks',
  beverages: 'drinks'
}

// Emoji icons mapping
const emojiIcons: Record<string, string> = {
  all: '🍔',
  salad: '🥗',
  main: '🍽️',
  meat: '🥩',
  fastfood: '🍟',
  dessert: '🧁',
  drinks: '🥤'
}

// SVG icon names mapping
const svgIcons: Record<string, string> = {
  all: 'category',
  salad: 'category',
  main: 'category',
  meat: 'category',
  fastfood: 'category',
  dessert: 'category',
  drinks: 'category'
}

// Computed properties
const categoryType = computed(() => {
  const normalizedCategory = props.category.toLowerCase().replace(/\s+/g, '-')
  return categoryTypeMap[normalizedCategory] || 'default'
})

const iconType = computed(() => {
  if (props.iconType !== 'auto') return props.iconType
  // Default to emoji for better visual appeal
  return 'emoji'
})

const emojiIcon = computed(() => {
  return emojiIcons[categoryType.value] || '📂'
})

const svgIconName = computed(() => {
  return svgIcons[categoryType.value] || 'category'
})

const iconSize = computed(() => {
  return iconSizeMap[props.size]
})

const ariaLabel = computed(() => {
  const categoryName = categoryType.value.charAt(0).toUpperCase() + categoryType.value.slice(1)
  return `${categoryName} category`
})
</script>

<style scoped>
/* Hover effects */
div:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.25);
}

/* Active/pressed state */
div:active {
  transform: scale(0.95);
}

/* Smooth transitions */
div {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Accessibility focus styles */
div:focus-visible {
  outline: 2px solid var(--color-primary-green);
  outline-offset: 2px;
}
</style>