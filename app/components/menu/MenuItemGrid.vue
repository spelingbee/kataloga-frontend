<template>
  <div class="menu-item-grid">
    <!-- Grid Header -->
    <div v-if="showHeader" class="menu-item-grid__header">
      <div class="menu-item-grid__title-section">
        <h2 
          v-if="title" 
          class="menu-item-grid__title"
        >
          {{ title }}
        </h2>
        <p 
          v-if="subtitle" 
          class="menu-item-grid__subtitle"
        >
          {{ subtitle }}
        </p>
      </div>
      
      <!-- View All Button -->
      <BaseButton
        v-if="showViewAll && hasMoreItems"
        variant="ghost"
        class="menu-item-grid__view-all-btn"
        @click="$emit('viewAll')"
      >
        View All
        <BaseIcon name="chevron-right" size="sm" class="u-ml-1" />
      </BaseButton>
    </div>
    
    <!-- Loading State -->
    <div 
      v-if="loading" 
      :class="[
        'menu-item-grid__loading',
        `menu-item-grid__loading--cols-${columns}`
      ]"
    >
      <div
        v-for="n in skeletonCount"
        :key="n"
        class="menu-item-grid__skeleton"
      >
        <BaseCard class="menu-item-grid__skeleton-card">
          <div class="menu-item-grid__skeleton-header">
            <div class="menu-item-grid__skeleton-image"/>
            <div class="menu-item-grid__skeleton-content">
              <div class="menu-item-grid__skeleton-title"/>
              <div class="menu-item-grid__skeleton-description"/>
              <div class="menu-item-grid__skeleton-description menu-item-grid__skeleton-description--short"/>
            </div>
          </div>
          <div class="menu-item-grid__skeleton-footer">
            <div class="menu-item-grid__skeleton-price"/>
            <div class="menu-item-grid__skeleton-button"/>
          </div>
        </BaseCard>
      </div>
    </div>
    
    <!-- Empty State -->
    <div 
      v-else-if="!loading && items.length === 0"
      class="menu-item-grid__empty"
    >
      <BaseIcon name="search" size="xl" class="menu-item-grid__empty-icon" />
      <h3 class="menu-item-grid__empty-title">
        {{ emptyTitle || 'No items found' }}
      </h3>
      <p class="menu-item-grid__empty-message">
        {{ emptyMessage || 'Try adjusting your search or filters' }}
      </p>
      <BaseButton
        v-if="showClearFilters"
        variant="secondary"
        @click="$emit('clearFilters')"
      >
        Clear Filters
      </BaseButton>
    </div>
    
    <!-- Menu Items Grid -->
    <div 
      v-else
      :class="[
        'menu-item-grid__items',
        `menu-item-grid__items--cols-${columns}`,
        {
          'menu-item-grid__items--loading': loading
        }
      ]"
    >
      <MenuItemCard
        v-for="item in displayItems"
        :key="item.id"
        :menu-item="item"
        :is-selected="selectedItemId === item.id"
        :show-popular-indicator="showPopularIndicator"
        class="menu-item-grid__item"
        @click="handleItemClick"
        @add-to-cart="handleAddToCart"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>
    
    <!-- Load More Button -->
    <div 
      v-if="showLoadMore && hasMoreItems && !loading"
      class="menu-item-grid__load-more"
    >
      <BaseButton
        variant="secondary"
        :loading="loadingMore"
        @click="$emit('loadMore')"
      >
        Load More Items
      </BaseButton>
    </div>
    
    <!-- Pagination Info -->
    <div 
      v-if="showPagination && totalItems > 0"
      class="menu-item-grid__pagination"
    >
      <span>
        Showing {{ displayItems.length }} of {{ totalItems }} items
      </span>
      <span v-if="hasFilters">
        {{ filteredCount }} filtered results
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from '~/types'

interface Props {
  items: MenuItem[]
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 7
  loading?: boolean
  loadingMore?: boolean
  title?: string
  subtitle?: string
  showHeader?: boolean
  showViewAll?: boolean
  showLoadMore?: boolean
  showPagination?: boolean
  showClearFilters?: boolean
  showPopularIndicator?: boolean
  selectedItemId?: string
  maxItems?: number
  emptyTitle?: string
  emptyMessage?: string
  skeletonCount?: number
  totalItems?: number
  filteredCount?: number
  hasFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  columns: 7,
  loading: false,
  loadingMore: false,
  showHeader: true,
  showViewAll: false,
  showLoadMore: false,
  showPagination: false,
  showClearFilters: true,
  showPopularIndicator: true,
  skeletonCount: 8,
  hasFilters: false
})

const emit = defineEmits<{
  itemClick: [item: MenuItem]
  addToCart: [item: MenuItem]
  toggleFavorite: [item: MenuItem]
  viewAll: []
  loadMore: []
  clearFilters: []
}>()

// Computed properties

const displayItems = computed(() => {
  if (props.maxItems) {
    return props.items.slice(0, props.maxItems)
  }
  return props.items
})

const hasMoreItems = computed(() => {
  if (props.maxItems) {
    return props.items.length > props.maxItems
  }
  return false
})

const totalItemsCount = computed(() => {
  return props.totalItems || props.items.length
})

// Event handlers
const handleItemClick = (item: MenuItem) => {
  emit('itemClick', item)
}

const handleAddToCart = (item: MenuItem) => {
  emit('addToCart', item)
}

const handleToggleFavorite = (item: MenuItem) => {
  emit('toggleFavorite', item)
}
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;

// Component-specific animations for grid items
.menu-item-grid__items {
  // Staggered fade-in animation for grid items
  .menu-item-grid__item {
    animation: fadeInUp 0.4s ease-out;
    
    &:nth-child(1) { animation-delay: 0.05s; }
    &:nth-child(2) { animation-delay: 0.1s; }
    &:nth-child(3) { animation-delay: 0.15s; }
    &:nth-child(4) { animation-delay: 0.2s; }
    &:nth-child(5) { animation-delay: 0.25s; }
    &:nth-child(6) { animation-delay: 0.3s; }
    &:nth-child(7) { animation-delay: 0.35s; }
    &:nth-child(8) { animation-delay: 0.4s; }
    &:nth-child(9) { animation-delay: 0.45s; }
    &:nth-child(10) { animation-delay: 0.5s; }
  }
}

// Enhanced fade-in animation
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// Loading state transition
.menu-item-grid__items--loading {
  .menu-item-grid__item {
    transition: all 0.3s ease;
    filter: blur(1px);
  }
}

// Header animation on mount
.menu-item-grid__header {
  animation: slideInFromTop 0.5s ease-out;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Empty state animation
.menu-item-grid__empty {
  animation: fadeIn 0.6s ease-out;
}

.menu-item-grid__empty-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

// Load more button hover effect
.menu-item-grid__load-more {
  .btn {
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>