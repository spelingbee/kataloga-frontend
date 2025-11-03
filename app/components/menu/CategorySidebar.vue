<template>
  <aside 
    class="category-sidebar"
    role="navigation"
    aria-label="Menu categories"
  >
    <!-- Header -->
    <div class="category-sidebar__header">
      <h2 class="category-sidebar__title">
        Categories
      </h2>
      
      <!-- Clear filters button -->
      <BaseButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        @click="clearAllFilters"
        class="category-sidebar__clear-btn"
        aria-label="Clear all filters"
      >
        <BaseIcon name="x" size="sm" />
      </BaseButton>
    </div>

    <!-- Categories List -->
    <nav class="category-sidebar__nav" role="list">
      <button
        v-for="category in categoriesWithCounts"
        :key="category.id"
        :class="[
          'category-item',
          { 'category-item--active': isActiveCategory(category.id) }
        ]"
        @click="selectCategory(category)"
        role="listitem"
      >
        <CategoryIcon 
          :category="category.slug" 
          size="sm" 
          class="category-item__icon"
        />
        <div class="category-item__content">
          <div class="category-item__name">{{ category.name }}</div>
          <div class="category-item__count">{{ category.itemCount }} items</div>
        </div>
      </button>
    </nav>

    <!-- Footer Stats -->
    <div class="category-sidebar__footer">
      <div class="category-sidebar__stats">
        <span>{{ totalItems }} items</span>
        <span v-if="currentCategory">{{ filteredItems }} filtered</span>
      </div>
      
      <!-- Active filters indicator -->
      <div v-if="hasActiveFilters" class="category-sidebar__filters">
        <BaseBadge
          v-if="searchQuery"
          variant="secondary"
          size="sm"
          class="category-sidebar__filter-badge"
        >
          Search: {{ searchQuery }}
        </BaseBadge>
        
        <BaseBadge
          v-if="filters.priceRange"
          variant="secondary"
          size="sm"
          class="category-sidebar__filter-badge"
        >
          Price: ${{ filters.priceRange[0] }}-${{ filters.priceRange[1] }}
        </BaseBadge>
        
        <BaseBadge
          v-if="filters.calories"
          variant="secondary"
          size="sm"
          class="category-sidebar__filter-badge"
        >
          {{ filters.calories[0] }}-{{ filters.calories[1] }} cal
        </BaseBadge>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '~/types'
import { useMenuStore } from '~/stores/menu'

// Stores
const menuStore = useMenuStore()

// Computed properties
const categories = computed(() => menuStore.categories)
const currentCategory = computed(() => menuStore.currentCategory)
const searchQuery = computed(() => menuStore.searchQuery)
const filters = computed(() => menuStore.filters)
const itemsByCategory = computed(() => menuStore.itemsByCategory)
const filteredItems = computed(() => menuStore.filteredItems.length)
const totalItems = computed(() => menuStore.menuItems.length)

// Categories with item counts
const categoriesWithCounts = computed(() => {
  return categories.value.map(category => ({
    ...category,
    itemCount: itemsByCategory.value[category.id]?.length || 0
  }))
})

// Check if there are active filters
const hasActiveFilters = computed(() => {
  return !!(
    searchQuery.value ||
    currentCategory.value ||
    Object.keys(filters.value).length > 0
  )
})

// Methods
const isActiveCategory = (categoryId: string) => {
  return currentCategory.value === categoryId
}

const selectCategory = (category: Category) => {
  // Toggle category selection
  if (currentCategory.value === category.id) {
    menuStore.setCurrentCategory(null)
  } else {
    menuStore.setCurrentCategory(category.id)
  }
  
  // Add haptic feedback for mobile devices
  if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
}

const clearAllFilters = () => {
  menuStore.clearFilters()
  menuStore.setCurrentCategory(null)
}
</script>

<style lang="scss" scoped>
// Component-specific animations and transitions
.category-sidebar {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  // Slide-in animation on mount
  animation: slideInFromLeft 0.4s ease-out;
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// Category item hover animations
.category-item {
  position: relative;
  overflow: hidden;
  
  // Ripple effect on click
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
  }
  
  &:active::before {
    width: 200px;
    height: 200px;
  }
  
  // Enhanced hover effect
  &:hover {
    transform: translateX(4px);
  }
  
  // Active state animation
  &--active {
    animation: categorySelect 0.3s ease-out;
  }
}

@keyframes categorySelect {
  0% {
    transform: scale(1);
    box-shadow: none;
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(32, 171, 71, 0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(32, 171, 71, 0.2);
  }
}

// Filter badges animation
.category-sidebar__filters {
  .category-sidebar__filter-badge {
    animation: fadeInScale 0.3s ease-out;
    
    &:nth-child(1) { animation-delay: 0.1s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.3s; }
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// Stats counter animation
.category-sidebar__stats {
  span {
    transition: all 0.3s ease;
    
    &:hover {
      color: white;
    }
  }
}

// Header title glow effect
.category-sidebar__title {
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, $color-primary-green, $color-primary-orange);
    transition: width 0.3s ease;
  }
  
  .category-sidebar:hover &::after {
    width: 100%;
  }
}
</style>