<template>
  <button
    class="category-item"
    :class="{ 'category-item--active': isActive }"
    @click="$emit('click')"
  >
    <!-- Category Icon -->
    <div class="category-item__icon-wrapper">
      <BaseIcon 
        :name="category.icon || 'category'" 
        size="md"
        class="category-item__icon"
      />
    </div>

    <!-- Category Info -->
    <div class="category-item__info">
      <div class="category-item__header">
        <span class="category-item__name">{{ category.name }}</span>
        
        <!-- Item Count Badge -->
        <span
          v-if="category.itemCount > 0"
          class="category-item__badge"
        >
          {{ category.itemCount }}
        </span>
      </div>
      
      <!-- Category Description (optional) -->
      <span 
        v-if="category.description" 
        class="category-item__description"
      >
        {{ category.description }}
      </span>
    </div>

    <!-- Active Indicator -->
    <div 
      v-if="isActive"
      class="category-item__indicator"
    />
  </button>
</template>

<script setup lang="ts">
// Props & Emits
interface Props {
  category: {
    id: string
    name: string
    description?: string
    icon?: string
    itemCount: number
  }
  isActive?: boolean
}

defineProps<Props>()

defineEmits<{
  click: []
}>()
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;

.category-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-primary);
  border: 1px solid transparent;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
  
  &:hover {
    background: var(--bg-secondary);
    transform: translateX(4px);
  }
  
  &--active {
    background: rgba(var(--color-primary-rgb), 0.08); // Subtle tint
    border-color: rgba(var(--color-primary-rgb), 0.2);
    
    &:hover {
      background: rgba(var(--color-primary-rgb), 0.12);
    }
  }
}

.category-item__icon-wrapper {
  flex-shrink: 0;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: $radius-full;
  background: var(--bg-secondary);
  transition: all 0.2s ease;
  
  .category-item:hover & {
    background: var(--bg-primary);
    box-shadow: var(--shadow-sm);
  }
  
  .category-item--active & {
    background: var(--gradient-primary); // Icon gets the gradient when active
    color: white;
    box-shadow: var(--shadow-glow-primary);
  }
}

.category-item__icon {
  font-size: 20px;
  color: var(--text-primary);
  
  .category-item--active & {
    color: white; // White icon on gradient background
  }
}

.category-item__info {
  flex: 1;
  min-width: 0; // For truncation
}

.category-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.category-item__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  .category-item--active & {
    color: var(--color-primary);
  }
}

.category-item__badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: $radius-full;
  margin-left: 8px;
  
  .category-item--active & {
    color: white;
    background: var(--color-primary);
  }
}

.category-item__description {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-item__indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  background: var(--color-primary);
}

// Dark theme adjustments
@media (prefers-color-scheme: dark) {
  .category-item {
    background: rgba(255,255,255,0.03);
    
    &:hover {
      background: rgba(255,255,255,0.06);
    }
    
    &--active {
      background: rgba(var(--color-primary-rgb), 0.15);
    }
  }
  
  .category-item__icon-wrapper {
    background: rgba(255,255,255,0.05);
    
    .category-item:hover & {
      background: rgba(255,255,255,0.1);
    }
  }
}

// Mobile optimizations for touch targets
@media (max-width: 640px) {
  .category-item {
    padding: 14px 16px; // Larger touch target
  }
}
</style>