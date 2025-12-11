<template>
  <div class="menu-browse">
    <!-- Header with Search -->
    <div class="menu-browse__header">
      <h1 class="menu-browse__title">Menu</h1>
      <MenuSearch class="menu-browse__search" />
    </div>

    <!-- Category Scroller -->
    <div class="menu-browse__categories">
      <CategoryScroller
        :categories="categoriesWithCount"
        :active-category="currentCategory"
        @category-select="handleCategorySelect"
      />
    </div>

    <!-- Filters -->
    <div v-if="hasFilters" class="menu-browse__filters">
      <div class="menu-browse__filters-active">
        <span class="menu-browse__filters-label">Active Filters:</span>
        <button
          v-for="(value, key) in activeFilters"
          :key="key"
          class="menu-browse__filter-tag"
          @click="removeFilter(key)"
        >
          {{ formatFilterLabel(key, value) }}
          <BaseIcon name="x" size="xs" />
        </button>
        <button
          class="menu-browse__clear-filters"
          @click="clearAllFilters"
        >
          Clear All
        </button>
      </div>
    </div>

    <!-- Results Count -->
    <div v-if="!loading" class="menu-browse__results">
      <span class="menu-browse__results-text">
        {{ filteredItemsCount }} {{ filteredItemsCount === 1 ? 'item' : 'items' }} found
      </span>
      <button
        v-if="!showFiltersPanel"
        class="menu-browse__filter-btn"
        @click="showFiltersPanel = true"
      >
        <BaseIcon name="filter" size="sm" />
        Filters
      </button>
    </div>

    <!-- Menu Grid -->
    <div class="menu-browse__content">
      <MenuGrid
        :items="filteredMenuItems"
        :loading="loading"
        :columns="3"
        :show-popular-indicator="true"
        empty-title="No menu items found"
        empty-message="Try adjusting your search or filters"
        @item-click="handleItemClick"
        @add-to-cart="handleAddToCart"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>

    <!-- Menu Item Detail Modal -->
    <MenuItemDetail
      v-if="selectedMenuItem"
      v-model="showDetailModal"
      :menu-item="selectedMenuItem"
      @close="handleDetailClose"
      @add-to-cart="handleDetailAddToCart"
    />

    <!-- Filters Panel (Mobile Drawer) -->
    <Teleport to="body">
      <div
        v-if="showFiltersPanel"
        class="menu-browse__filters-overlay"
        @click="showFiltersPanel = false"
      >
        <div
          class="menu-browse__filters-panel"
          @click.stop
        >
          <div class="menu-browse__filters-header">
            <h3>Filters</h3>
            <button
              class="menu-browse__filters-close"
              @click="showFiltersPanel = false"
            >
              <BaseIcon name="x" size="md" />
            </button>
          </div>
          <MenuFilters
            :filters="filters"
            @update:filters="handleFiltersUpdate"
            @clear="clearAllFilters"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useMenu } from '~/composables/useMenu'
import { useCart } from '~/composables/useCart'
import type { MenuItem, MenuFilters } from '~/types'

// Composables
const {
  categories,
  filteredMenuItems,
  currentCategory,
  searchQuery,
  filters,
  loading,
  fetchMenu,
  setCurrentCategory,
  applyFilters,
  clearFilters,
  toggleFavourite,
  getFilteredItemsCount
} = useMenu()

const { addItem } = useCart()
const router = useRouter()

// Local state
const showFiltersPanel = ref(false)
const showDetailModal = ref(false)
const selectedMenuItem = ref<MenuItem | null>(null)

// Computed
const categoriesWithCount = computed(() => {
  return categories.value.map(category => ({
    ...category,
    count: filteredMenuItems.value.filter(item => item.categoryId === category.id).length
  }))
})

const hasFilters = computed(() => {
  return Object.keys(filters.value).length > 0 || searchQuery.value.length > 0
})

const activeFilters = computed(() => {
  const active: Record<string, any> = {}
  if (filters.value.priceRange) active.priceRange = filters.value.priceRange
  if (filters.value.calories) active.calories = filters.value.calories
  if (filters.value.dietary) active.dietary = filters.value.dietary
  if (filters.value.cookingTime) active.cookingTime = filters.value.cookingTime
  if (filters.value.availability) active.availability = filters.value.availability
  return active
})

const filteredItemsCount = computed(() => {
  return getFilteredItemsCount.value
})

// Methods
const handleCategorySelect = (categoryId: string | null) => {
  setCurrentCategory(categoryId)
}

const handleItemClick = (item: MenuItem) => {
  selectedMenuItem.value = item
  showDetailModal.value = true
}

const handleAddToCart = (item: MenuItem) => {
  // If item has modifiers, open detail modal
  if (item.modifierGroups && item.modifierGroups.length > 0) {
    handleItemClick(item)
    return
  }
  
  addItem(item, 1, [])
  // Show toast notification
  // useToast().success(`${item.name} added to cart`)
}

const handleToggleFavorite = (item: MenuItem) => {
  toggleFavourite(item.id)
}

const handleDetailClose = () => {
  showDetailModal.value = false
  selectedMenuItem.value = null
}

const handleDetailAddToCart = (item: MenuItem, quantity: number, modifiers: any[]) => {
  addItem(item, quantity, modifiers)
  // Show toast notification
  // useToast().success(`${item.name} added to cart`)
}

const handleFiltersUpdate = (newFilters: MenuFilters) => {
  applyFilters(newFilters)
  showFiltersPanel.value = false
}

const removeFilter = (filterKey: string) => {
  const updatedFilters = { ...filters.value }
  delete updatedFilters[filterKey as keyof MenuFilters]
  applyFilters(updatedFilters)
}

const clearAllFilters = () => {
  clearFilters()
  showFiltersPanel.value = false
}

const formatFilterLabel = (key: string, value: any): string => {
  switch (key) {
    case 'priceRange':
      return `Price: $${value[0]} - $${value[1]}`
    case 'calories':
      return `Calories: ${value[0]} - ${value[1]}`
    case 'dietary':
      return `Dietary: ${value.join(', ')}`
    case 'cookingTime':
      return `Max cooking time: ${value} min`
    case 'availability':
      return 'Available only'
    default:
      return String(value)
  }
}

// Lifecycle
onMounted(async () => {
  await fetchMenu()
})

// SEO
useHead({
  title: 'Menu - Browse Our Dishes',
  meta: [
    {
      name: 'description',
      content: 'Browse our delicious menu and order your favorite dishes'
    }
  ]
})
</script>

<style lang="scss" scoped>
@use '../../assets/scss/abstracts/variables' as *;

.menu-browse {
  max-width: 1400px;
  margin: 0 auto;
  padding: $space-6;

  @media (max-width: 768px) {
    padding: $space-4;
  }
}

.menu-browse__header {
  margin-bottom: $space-8;
}

.menu-browse__title {
  font-size: $text-3xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-6;

  @media (max-width: 768px) {
    font-size: $text-2xl;
  }
}

.menu-browse__search {
  max-width: 600px;
}

.menu-browse__categories {
  margin-bottom: $space-8;
}

.menu-browse__filters {
  margin-bottom: $space-6;
}

.menu-browse__filters-active {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.menu-browse__filters-label {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-secondary);
}

.menu-browse__filter-tag {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-2;
  background: var(--bg-primary);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-full;
  font-size: $text-sm;
  color: var(--text-primary);
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--color-error);
  }
}

.menu-browse__clear-filters {
  padding: $space-1 $space-2;
  background: transparent;
  border: 1px solid var(--color-error);
  border-radius: $radius-full;
  font-size: $text-sm;
  color: var(--color-error);
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    background: var(--color-error);
    color: white;
  }
}

.menu-browse__results {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-6;
}

.menu-browse__results-text {
  font-size: $text-sm;
  color: var(--text-secondary);
}

.menu-browse__filter-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-4;
  background: var(--bg-primary);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-md;
  font-size: $text-sm;
  color: var(--text-primary);
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    background: var(--bg-tertiary);
  }

  @media (min-width: 1024px) {
    display: none;
  }
}

.menu-browse__content {
  margin-bottom: $space-12;
}

.menu-browse__filters-overlay {
  position: fixed;
  inset: 0;
  background: $color-background-overlay;
  z-index: $z-index-modal-backdrop;
  display: flex;
  align-items: flex-end;

  @media (min-width: 768px) {
    align-items: center;
    justify-content: center;
  }
}

.menu-browse__filters-panel {
  background: var(--bg-primary);
  border-radius: $radius-xl $radius-xl 0 0;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideInUp 0.3s ease-out;

  @media (min-width: 768px) {
    border-radius: $radius-xl;
    max-width: 600px;
    max-height: 90vh;
  }
}

.menu-browse__filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-6;
  border-bottom: 1px solid $color-border-subtle;

  h3 {
    font-size: $text-xl;
    font-weight: $font-semibold;
    color: var(--text-primary);
  }
}

.menu-browse__filters-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: $radius-full;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    background: var(--bg-tertiary);
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
