<template>
  <div class="category-page">
    <!-- Header Section -->
    <div class="category-page__header">
      <div class="category-page__nav">
        <NuxtLink to="/menu/categories" class="category-page__back-link">
          <BaseIcon name="arrow-left" size="md" />
        </NuxtLink>

        <div class="category-page__title-wrapper">
          <CategoryIcon v-if="category" :category="category.id" size="lg" />
          <div>
            <AppHeading level="h1" size="display-md" class="category-page__title">
              {{ category?.name || 'Category' }}
            </AppHeading>
            <AppText size="body-md" class="category-page__subtitle">
              {{ category?.description || 'Explore our delicious selection' }}
            </AppText>
          </div>
        </div>
      </div>

      <!-- Category Stats -->
      <div class="category-page__stats">
        <div class="category-page__stat">
          <BaseIcon
            name="utensils"
            size="sm"
            class="category-page__stat-icon category-page__stat-icon--orange"
          />
          <AppText class="category-page__stat-text">{{ localFilteredItems.length }} items</AppText>
        </div>
        <div v-if="averagePrice" class="category-page__stat">
          <BaseIcon
            name="dollar-sign"
            size="sm"
            class="category-page__stat-icon category-page__stat-icon--green"
          />
          <AppText class="category-page__stat-text">Avg. {{ formatPrice(averagePrice) }}</AppText>
        </div>
        <div v-if="isPopularCategory" class="category-page__stat">
          <FireIcon size="sm" />
          <AppText class="category-page__stat-highlight">Popular Category</AppText>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="category-page__filters">
      <div class="category-page__controls">
        <!-- Search -->
        <div class="category-page__search">
          <BaseInput v-model="searchQuery" placeholder="Search in this category..." class="w-full">
            <template #prefix>
              <BaseIcon name="search" size="sm" class="category-page__search-icon" />
            </template>
          </BaseInput>
        </div>

        <!-- Sort and Filter Controls -->
        <div class="category-page__actions">
          <div class="category-page__select-wrapper">
            <select v-model="sortBy" class="category-page__select">
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="calories">Calories</option>
            </select>
          </div>

          <BaseButton
            variant="secondary"
            class="category-page__filter-btn"
            @click="showFilters = !showFilters"
          >
            <BaseIcon name="filter" size="sm" class="mr-2" />
            Filters
          </BaseButton>
        </div>
      </div>

      <!-- Advanced Filters -->
      <div v-if="showFilters" class="category-page__advanced-filters">
        <MenuFilters :category="categorySlug" @close="showFilters = false" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="category-page__content">
      <!-- Loading State -->
      <div v-if="menuStore.loading" class="category-page__loading">
        <div class="category-page__spinner" />
        <AppText class="category-page__loading-text">
          Loading {{ category?.name || 'category' }}...
        </AppText>
      </div>

      <!-- Error State -->
      <div v-else-if="menuStore.error" class="category-page__error">
        <BaseIcon name="alert-circle" size="xl" class="category-page__error-icon" />
        <AppText class="category-page__error-text">{{ menuStore.error }}</AppText>
        <BaseButton @click="loadCategoryData">Try Again</BaseButton>
      </div>

      <!-- Menu Items -->
      <div v-else>
        <!-- Items Grid -->
        <MenuItemGrid
          v-if="localFilteredItems.length > 0"
          :items="sortedItems"
          :columns="7"
          @item-selected="onItemSelected"
        />

        <!-- Empty State -->
        <div v-else class="category-page__empty">
          <BaseIcon name="search" size="xl" class="category-page__empty-icon" />
          <AppHeading level="h3" size="heading-lg" class="category-page__empty-title">
            No items found
          </AppHeading>
          <AppText class="category-page__empty-text">
            {{
              searchQuery
                ? `No items match "${searchQuery}" in this category.`
                : 'This category is currently empty.'
            }}
          </AppText>
          <div class="category-page__empty-actions">
            <BaseButton v-if="searchQuery" variant="secondary" @click="clearSearch">
              Clear Search
            </BaseButton>
            <NuxtLink to="/menu/categories">
              <BaseButton variant="secondary">Browse Other Categories</BaseButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Categories -->
    <div v-if="relatedCategories.length > 0" class="category-page__related">
      <AppHeading level="h2" size="heading-xl" class="category-page__related-title">
        You Might Also Like
      </AppHeading>

      <div class="category-page__related-grid">
        <NuxtLink
          v-for="relatedCategory in relatedCategories"
          :key="relatedCategory.id"
          :to="`/menu/categories/${relatedCategory.id}`"
          class="category-page__related-item group"
        >
          <BaseCard class="category-page__related-card" hoverable>
            <CategoryIcon
              :category="relatedCategory.id"
              size="md"
              class="category-page__related-icon"
            />
            <AppText size="body-sm" class="category-page__related-name">
              {{ relatedCategory.name }}
            </AppText>
            <AppText size="caption" class="category-page__related-count">
              {{ relatedCategory.count }} items
            </AppText>
          </BaseCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItemUI, CategoryUI } from '~/types'
import { useMenuStore } from '~/stores/menu'
import AppText from '../../../components/base/AppText.vue'
import CategoryIcon from '../../../components/menu/CategoryIcon.vue'
import AppHeading from '../../../components/base/AppHeading.vue'
import FireIcon from '../../../components/menu/FireIcon.vue'

// Page setup
definePageMeta({
  title: 'Category - Menu Ordering App',
})

// Route and stores
const menuStore = useMenuStore()
const router = useRouter()
const route = useRoute()

// Reactive state
const showFilters = ref(false)
const searchQuery = ref('')
const sortBy = ref('name')

// Get category slug from route
const categorySlug = computed(() => route.params.slug as string)

// Categories from store
const categories = computed(() => menuStore.categories)

const popularCategories = ['fastfood', 'main-dishes', 'pizza', 'drinks']

// Computed
const category = computed(() => {
  if (categorySlug.value === 'all') {
    return {
      id: 'all',
      name: 'All Items',
      description: 'Browse our complete menu',
      icon: '🍔',
      count: menuStore.menuItems.length,
      sortOrder: 0,
      slug: 'all'
    } as CategoryUI
  }
  return categories.value.find(cat => cat.id === categorySlug.value)
})

const localFilteredItems = computed<MenuItemUI[]>(() => {
  let items = [...(menuStore.filteredMenuItems as MenuItemUI[])]

  // Filter by category
  if (categorySlug.value && categorySlug.value !== 'all') {
    items = items.filter(item => item.categoryId === categorySlug.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
    )
  }

  return items
})

const sortedItems = computed(() => {
  const items = [...localFilteredItems.value]

  switch (sortBy.value) {
    case 'price-low':
      return items.sort((a, b) => a.price - b.price)
    case 'price-high':
      return items.sort((a, b) => b.price - a.price)
    case 'popular':
      // Sort by popularity (mock implementation)
      return items.sort(() => Math.random() - 0.5)
    case 'calories':
      return items.sort((a, b) => (a.calories || 0) - (b.calories || 0))
    case 'name':
    default:
      return items.sort((a, b) => a.name.localeCompare(b.name))
  }
})

const averagePrice = computed(() => {
  if (localFilteredItems.value.length === 0) return null
  const total = localFilteredItems.value.reduce(
    (sum: number, item: MenuItemUI) => sum + item.price,
    0
  )
  return total / localFilteredItems.value.length
})

const isPopularCategory = computed(() => {
  return popularCategories.includes(categorySlug.value)
})

const relatedCategories = computed(() => {
  // Show related categories (exclude current category and empty ones)
  return categories.value
    .filter(cat => cat.id !== categorySlug.value && cat.id !== 'all' && cat.count > 0)
    .slice(0, 6)
})

// Methods
const onItemSelected = (item: MenuItemUI) => {
  menuStore.setSelectedDish(item)
  router.push(`/dish/${item.id}`)
}

const clearSearch = () => {
  searchQuery.value = ''
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

const loadCategoryData = async () => {
  try {
    // Ensure we have categories and items loaded
    if (menuStore.categories.length === 0) {
      await menuStore.fetchMenu()
    }
  } catch (error) {
    console.error('Failed to fetch category data:', error)
    // Error is handled by the store
  }
}

// Initialize
onMounted(async () => {
  // Set current category in store
  menuStore.setCurrentCategory(categorySlug.value === 'all' ? null : categorySlug.value)

  // Load category data
  await loadCategoryData()
})

// Watch for route changes
watch(
  () => categorySlug.value,
  async newSlug => {
    menuStore.setCurrentCategory(newSlug === 'all' ? null : newSlug)
    // We don't necessarily need to reload everything, just update the store's current category
    searchQuery.value = '' // Clear search when changing categories
  }
)

// Update page title
watchEffect(() => {
  if (category.value) {
    useHead({
      title: `${category.value.name} - Menu Ordering App`,
    })
  }
})
</script>

<style scoped lang="scss">
@use '../../../assets/scss/tokens/colors' as *;
@use '../../../assets/scss/tokens/spacing' as *;
@use '../../../assets/scss/tokens/radius' as *;
@use '../../../assets/scss/tokens/typography' as *;
@use '../../../assets/scss/tokens/transitions' as *;
@use '../../../assets/scss/tokens/shadows' as *;
.category-page {
  min-height: 100vh;
  background-color: var(--bg-primary);
  padding-bottom: $space-12;
}

.category-page__header {
  padding: $space-6 $space-6 0;
  margin-bottom: $space-8;
}

.category-page__nav {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-6;
}

.category-page__back-link {
  color: var(--text-tertiary);
  transition: $transition-base;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-2;
  border-radius: $radius-full;

  &:hover {
    color: var(--text-white);
    background-color: var(--bg-secondary);
  }
}

.category-page__title-wrapper {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.category-page__title {
  color: var(--text-white);
  margin: 0;
}

.category-page__subtitle {
  color: var(--text-tertiary);
  margin-top: $space-1;
}

.category-page__stats {
  display: flex;
  align-items: center;
  gap: $space-6;
  padding-left: $space-14; // Align with title text (nav icon + gap)
}

.category-page__stat {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.category-page__stat-icon {
  &--orange {
    color: var(--color-primary);
  }

  &--green {
    color: var(--color-success);
  }
}

.category-page__stat-text {
  color: var(--text-tertiary);
}

.category-page__stat-highlight {
  color: var(--color-primary);
  font-weight: $font-medium;
}

.category-page__filters {
  padding: 0 $space-6;
  margin-bottom: $space-8;
}

.category-page__controls {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
}

.category-page__search {
  flex: 1;
  max-width: 480px;
}

.category-page__search-icon {
  color: var(--text-tertiary);
}

.category-page__actions {
  display: flex;
  gap: $space-3;
  width: 100%;

  @media (min-width: 768px) {
    width: auto;
  }
}

.category-page__select-wrapper {
  flex: 1;
  @media (min-width: 768px) {
    flex: initial;
  }
}

.category-page__select {
  width: 100%;
  background-color: var(--bg-card);
  border: 1px solid rgba(var(--text-tertiary-rgb), 0.3);
  border-radius: $radius-lg;
  padding: $space-2 $space-3;
  color: var(--text-white);
  font-size: $text-sm;
  height: 42px; // Match button height
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: var(--color-primary);
  }
}

.category-page__filter-btn {
  white-space: nowrap;
}

.category-page__advanced-filters {
  margin-top: $space-4;
}

.category-page__content {
  padding: 0 $space-6;
}

.category-page__loading,
.category-page__error {
  text-align: center;
  padding: $space-12 0;
}

.category-page__spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto $space-4;
  border-radius: $radius-full;
  border-bottom: 2px solid var(--color-success);
  animation: spin 1s linear infinite;
}

.category-page__loading-text {
  color: var(--text-tertiary);
}

.category-page__error-icon {
  color: var(--color-error);
  margin: 0 auto $space-4;
}

.category-page__error-text {
  color: var(--text-white);
  margin-bottom: $space-4;
}

.category-page__empty {
  text-align: center;
  padding: $space-16 0;
}

.category-page__empty-icon {
  color: var(--text-tertiary);
  margin: 0 auto $space-6;
}

.category-page__empty-title {
  color: var(--text-white);
  margin-bottom: $space-4;
}

.category-page__empty-text {
  color: var(--text-tertiary);
  margin-bottom: $space-8;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.category-page__empty-actions {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  justify-content: center;
  align-items: center;

  @media (min-width: 640px) {
    flex-direction: row;
  }
}

.category-page__related {
  padding: $space-12 $space-6 0;
  margin-top: $space-12;
  border-top: 1px solid rgba(var(--text-tertiary-rgb), 0.2);
}

.category-page__related-title {
  color: var(--text-white);
  margin-bottom: $space-6;
}

.category-page__related-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }
}

.category-page__related-item {
  text-decoration: none;
}

.category-page__related-card {
  text-align: center;
  background-color: var(--bg-card);
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(var(--bg-card-rgb), 0.8);

    .category-page__related-icon {
      transform: scale(1.1);
    }

    .category-page__related-name {
      color: var(--color-success);
    }
  }
}

.category-page__related-icon {
  margin-bottom: $space-2;
  transition: transform $transition-base;
}

.category-page__related-name {
  color: var(--text-white);
  transition: color $transition-base;
}

.category-page__related-count {
  color: var(--text-tertiary);
  margin-top: $space-1;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>