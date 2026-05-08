<template>
  <div class="category-page">
    <!-- Header Section -->
    <header class="category-page__header">
      <div class="category-page__nav">
        <NuxtLink to="/" class="category-page__back-btn">
          <BaseIcon name="arrow-left" size="md" />
        </NuxtLink>
        <div class="category-page__header-content">
          <h1 class="category-page__title">
            {{ category?.name || $t('common.category', 'Категория') }}
          </h1>
          <div class="category-page__stats">
            <span class="category-page__stat-item">
              {{ filteredItems.length }} {{ $t('common.items', 'товаров') }}
            </span>
            <template v-if="averagePrice">
              <span class="category-page__stat-divider">•</span>
              <span class="category-page__stat-item">
                {{ $t('common.avg_price', 'Средний чек') }}: {{ formatPriceDisplay(averagePrice) }}
              </span>
            </template>
          </div>
        </div>
      </div>

      <div v-if="category?.description" class="category-page__description-wrapper">
        <p class="category-page__description">
          {{ category.description }}
        </p>
      </div>
    </header>

    <!-- Filters and Search -->
    <section class="category-page__filters-section">
      <div class="category-page__filters-row">
        <!-- Search -->
        <div class="category-page__search-box">
          <BaseInput
            v-model="searchQuery"
            :placeholder="$t('menu.searchInCategory')"
            class="category-page__search-input"
          >
            <template #prefix>
              <BaseIcon name="search" size="sm" class="category-page__search-icon" />
            </template>
          </BaseInput>
        </div>

        <!-- Sort and Filter Controls -->
        <div class="category-page__controls">
          <select 
            v-model="sortBy"
            class="category-page__sort-select"
          >
            <option value="name">{{ $t('menu.sortByName') }}</option>
            <option value="price-low">{{ $t('menu.sortByPriceLow') }}</option>
            <option value="price-high">{{ $t('menu.sortByPriceHigh') }}</option>
            <option value="popular">{{ $t('menu.sortByPopular') }}</option>
            <option value="calories">{{ $t('menu.sortByCalories') }}</option>
          </select>
          
          <BaseButton 
            variant="secondary" 
            class="category-page__filter-btn"
            @click="showFilters = !showFilters"
          >
            <BaseIcon name="filter" size="sm" class="category-page__filter-icon" />
            {{ $t('menu.filters.title') }}
          </BaseButton>
        </div>
      </div>

      <!-- Advanced Filters -->
      <div v-if="showFilters" class="category-page__advanced-filters">
        <MenuFilters 
          :category="categorySlug"
          @close="showFilters = false"
        />
      </div>
    </section>

    <!-- Main Content -->
    <main class="category-page__main">
      <!-- Loading State -->
      <div v-if="menuStore.loading" class="category-page__state category-page__state--loading">
        <div class="category-page__spinner"/>
        <AppText class="category-page__state-text">{{ $t('orders.loading') }}</AppText>
      </div>

      <!-- Error State -->
      <div v-else-if="menuStore.error" class="category-page__state category-page__state--error">
        <BaseIcon name="alert-circle" size="xl" class="category-page__state-icon category-page__state-icon--error" />
        <AppText class="category-page__state-text">{{ menuStore.error }}</AppText>
        <BaseButton @click="loadCategoryData">
          {{ $t('orders.tracking.tryAgain') }}
        </BaseButton>
      </div>

      <!-- Menu Items -->
      <div v-else class="category-page__content">
        <!-- Items Grid -->
        <MenuItemGrid 
          v-if="filteredItems.length > 0"
          :items="sortedItems"
          :columns="7"
          @item-selected="onItemSelected"
        />

        <!-- Empty State -->
        <div v-else class="category-page__state category-page__state--empty">
          <BaseIcon name="search" size="xl" class="category-page__state-icon" />
          <AppHeading level="h3" size="heading-lg" class="category-page__state-title">
            {{ $t('menu.noItemsFound') }}
          </AppHeading>
          <AppText class="category-page__state-text">
            {{ searchQuery ? 
              $t('menu.noItemsMatch', { query: searchQuery }) : 
              $t('menu.categoryEmpty') 
            }}
          </AppText>
          <div class="category-page__state-actions">
            <BaseButton 
              v-if="searchQuery"
              variant="secondary"
              @click="clearSearch"
            >
              {{ $t('menu.clearSearch') }}
            </BaseButton>
            <NuxtLink to="/menu/categories" class="category-page__state-link">
              <BaseButton variant="secondary">
                {{ $t('menu.browseOtherCategories') }}
              </BaseButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>

    <section v-if="relatedCategories.length > 0" class="category-page__related">
      <h2 class="category-page__related-title">
        {{ $t('common.other_categories', 'Другие категории') }}
      </h2>
      
      <div class="category-page__related-grid">
        <NuxtLink
          v-for="relatedCategory in relatedCategories"
          :key="relatedCategory.id"
          :to="`/menu/categories/${relatedCategory.id}`"
          class="category-page__related-card"
        >
          <div class="category-page__related-card-inner">
            <CategoryIcon 
              :category="relatedCategory.id" 
              size="3xl"
              class="category-page__related-icon"
            />
            <span class="category-page__related-name">
              {{ relatedCategory.name }}
            </span>
            <span class="category-page__related-count">
              {{ relatedCategory.count }} {{ $t('common.items', 'товаров') }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem, Category } from '~/types'
import { useMenuStore } from '~/stores/menu'
import AppText from '~/components/base/AppText.vue'
import CategoryIcon from '~/components/menu/CategoryIcon.vue'
import AppHeading from '~/components/base/AppHeading.vue'

import { useTenantStore } from '~/stores/tenant'
import { useTenantSettings } from '~/composables/useTenant'

// Page setup
definePageMeta({
  title: 'Category'
})

// Route and stores
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const menuStore = useMenuStore()
const tenantStore = useTenantStore()
const { formatCurrency } = useTenantSettings()

// Reactive state
const showFilters = ref(false)
const searchQuery = ref('')
const sortBy = ref('name')

// Get category slug from route
const categorySlug = computed(() => route.params.slug as string)

// Computed
const categories = computed(() => menuStore.categories)

const category = computed(() => {
  return categories.value.find(cat => cat.id === categorySlug.value)
})

const filteredItems = computed(() => {
  let items = menuStore.menuItems
  
  // Filter by category
  if (categorySlug.value && categorySlug.value !== 'all') {
    items = items.filter(item => item.categoryId === categorySlug.value)
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }
  
  return items
})

const sortedItems = computed(() => {
  const items = [...filteredItems.value]
  
  switch (sortBy.value) {
    case 'price-low':
      return items.sort((a, b) => a.price - b.price)
    case 'price-high':
      return items.sort((a, b) => b.price - a.price)
    case 'popular':
      return items.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0))
    case 'calories':
      return items.sort((a, b) => (a.calories || 0) - (b.calories || 0))
    case 'name':
    default:
      return items.sort((a, b) => a.name.localeCompare(b.name))
  }
})

const averagePrice = computed(() => {
  if (filteredItems.value.length === 0) return null
  const total = filteredItems.value.reduce((sum, item) => sum + item.price, 0)
  return total / filteredItems.value.length
})

const relatedCategories = computed(() => {
  return categories.value
    .filter(cat => cat.id !== categorySlug.value && cat.id !== 'all')
    .slice(0, 6)
})

// Methods
const onItemSelected = (item: MenuItem) => {
  router.push(`/dish/${item.id}`)
}

const clearSearch = () => {
  searchQuery.value = ''
}

const formatPriceDisplay = (price: number) => {
  return formatCurrency(price)
}

const loadCategoryData = async () => {
  try {
    await menuStore.fetchCategory(categorySlug.value)
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
watch(() => categorySlug.value, async (newSlug) => {
  menuStore.setCurrentCategory(newSlug === 'all' ? null : newSlug)
  await loadCategoryData()
  searchQuery.value = '' // Clear search when changing categories
})

// Update page title
watchEffect(() => {
  if (category.value) {
    useHead({
      title: `${category.value.name} - Menu Ordering App`
    })
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/typography' as *;
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/transitions' as *;
@use '~/assets/scss/tokens/radius' as *;
@use '~/assets/scss/tokens/shadows' as *;

.category-page {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.category-page__header {
  padding: $space-8 $space-4 $space-6;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
}

.category-page__nav {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-6;
}

.category-page__header-content {
  flex: 1;
}

.category-page__back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  transition: all $transition-base;

  &:hover {
    background: var(--bg-tertiary);
    transform: scale(1.05);
    border-color: var(--color-primary);
  }
}

.category-page__title {
  margin: 0 0 $space-1 0;
  color: var(--text-primary);
  font-size: $text-2xl;
  font-weight: $font-bold;
}

.category-page__stats {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-sm;
  color: var(--text-secondary);
}

.category-page__stat-divider {
  opacity: 0.3;
}

.category-page__description-wrapper {
  padding-left: calc(44px + $space-4); // Align with title
}

.category-page__description {
  color: var(--text-tertiary);
  margin: 0;
  max-width: 600px;
  line-height: $leading-relaxed;
  font-size: $text-sm;
}

.category-page__filters-section {
  padding: $space-4;
}

.category-page__filters-row {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-bottom: $space-4;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
}

.category-page__search-box {
  flex: 1;
  max-width: 100%;
  
  @media (min-width: 768px) {
    max-width: 400px;
  }
}

.category-page__search-input {
  width: 100%;
}

.category-page__search-icon {
  color: var(--text-tertiary);
}

.category-page__controls {
  display: flex;
  gap: $space-2;
  
  @media (max-width: 640px) {
    width: 100%;
    
    .category-page__sort-select {
      flex: 1;
    }
  }
}

.category-page__sort-select {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  padding: $space-2 $space-3;
  color: var(--text-primary);
  font-size: $text-sm;
  font-family: inherit;
  cursor: pointer;
  
  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: -1px;
  }
}

.category-page__filter-icon {
  margin-right: $space-2;
}

.category-page__main {
  padding: 0 $space-4 $space-12;
  flex: 1;
  
  @media (min-width: 768px) {
    padding: 0 $space-6 $space-12;
  }
}

.category-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-12 $space-4;
  text-align: center;
  
  &--loading {
    padding: $space-16 $space-4;
  }
}

.category-page__spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-primary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: $space-4;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.category-page__state-icon {
  color: var(--text-tertiary);
  margin-bottom: $space-6;
  
  &--error {
    color: var(--color-error);
  }
}

.category-page__state-title {
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.category-page__state-text {
  color: var(--text-secondary);
  margin-bottom: $space-6;
  max-width: 400px;
}

.category-page__state-actions {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  width: 100%;
  max-width: 300px;
  
  @media (min-width: 640px) {
    flex-direction: row;
    max-width: none;
    justify-content: center;
  }
}

.category-page__state-link {
  text-decoration: none;
}

.category-page__related {
  padding: $space-12 $space-4;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
}

.category-page__related-title {
  color: var(--text-primary);
  margin-bottom: $space-8;
  font-size: $text-xl;
  font-weight: $font-bold;
  text-align: center;
}

.category-page__related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: $space-6;
  max-width: 800px;
  margin: 0 auto;
}

.category-page__related-card {
  text-decoration: none;
  display: block;
}

.category-page__related-card-inner {
  padding: $space-8 $space-4;
  text-align: center;
  height: 100%;
  border-radius: $radius-xl;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  transition: all $transition-base;
  
  &:hover {
    transform: translateY(-4px);
    border-color: var(--color-primary);
    box-shadow: $shadow-lg;

    .category-page__related-icon {
      transform: scale(1.15) rotate(5deg);
    }
    .category-page__related-name {
      color: var(--color-primary);
    }
  }
}

.category-page__related-icon {
  margin-bottom: $space-4;
  transition: transform $transition-slow;
}

.category-page__related-name {
  color: var(--text-primary);
  margin-bottom: $space-1;
  font-weight: $font-bold;
  font-size: $text-base;
  transition: color $transition-base;
}

.category-page__related-count {
  color: var(--text-tertiary);
  font-size: $text-xs;
}
</style>
