<template>
  <div class="app-sidebar">
    <!-- Sidebar Header -->
    <div class="app-sidebar__header">
      <AppHeading level="h2" size="heading-md" class="u-text-neutral-20">
        Categories
      </AppHeading>
    </div>

    <!-- Categories List -->
    <nav class="app-sidebar__nav">
      <div class="app-sidebar__nav-list">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="[
            'category-item',
            { 'category-item--active': isActiveCategory(category.id) }
          ]"
          @click="selectCategory(category)"
        >
          <CategoryIcon :category="category.id" class="category-item__icon" />
          <span class="category-item__name">{{ category.name }}</span>
          <span class="category-item__count">{{ category.count }}</span>
        </button>
      </div>
    </nav>

    <!-- Sidebar Footer (optional) -->
    <div class="app-sidebar__footer">
      <div class="app-sidebar__footer-content">
        <span>{{ totalItems }} items</span>
        <BaseButton
          variant="ghost"
          size="sm"
          @click="clearFilters"
          class="u-text-caption"
        >
          Clear filters
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMenuStore } from '~/stores/menu'

// Stores
const menuStore = useMenuStore()

// Computed properties
const categories = computed(() => menuStore.categories)
const currentCategory = computed(() => menuStore.currentCategory)
const totalItems = computed(() => menuStore.filteredItems.length)

// Methods
const isActiveCategory = (categoryId: string) => {
  return currentCategory.value === categoryId
}

const selectCategory = (category: any) => {
  menuStore.setCurrentCategory(category.id)
  
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
}

const clearFilters = () => {
  menuStore.clearFilters()
  menuStore.setCurrentCategory(null)
}
</script>

