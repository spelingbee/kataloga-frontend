<template>
  <div class="search-page">
    <!-- Header Section -->
    <div class="search-page__header">
      <div class="search-page__header-content">
        <NuxtLink 
          to="/menu"
          class="search-page__back-link"
        >
          <BaseIcon name="arrow-left" size="md" />
        </NuxtLink>
        
        <div>
          <AppHeading level="h1" size="display-md" class="search-page__title">
            Search Menu
          </AppHeading>
          <AppText size="body-md" class="search-page__subtitle">
            Find exactly what you're looking for
          </AppText>
        </div>
      </div>
    </div>

    <!-- Search Section -->
    <div class="search-page__controls">
      <!-- Main Search Bar -->
      <div class="search-page__input-wrapper">
        <BaseInput
          v-model="searchQuery"
          placeholder="Search for dishes, ingredients, or categories..."
          class="search-page__input"
          size="lg"
          @keyup.enter="performSearch"
        >
          <template #prefix>
            <BaseIcon name="search" size="md" class="text-neutral-80" />
          </template>
          <template #suffix>
            <BaseButton 
              v-if="searchQuery"
              variant="ghost" 
              size="sm"
              @click="clearSearch"
            >
              <BaseIcon name="x" size="sm" />
            </BaseButton>
          </template>
        </BaseInput>
      </div>

      <!-- Search Suggestions -->
      <div v-if="!searchQuery && searchSuggestions.length > 0" class="search-page__suggestions">
        <AppText size="body-sm" class="search-page__suggestions-label">
          Popular searches:
        </AppText>
        <div class="search-page__tags">
          <BaseButton
            v-for="suggestion in searchSuggestions"
            :key="suggestion"
            variant="ghost"
            size="sm"
            class="search-page__tag"
            @click="searchQuery = suggestion"
          >
            {{ suggestion }}
          </BaseButton>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="search-page__filters">
        <BaseButton
          v-for="filter in quickFilters"
          :key="filter.key"
          :variant="activeQuickFilters.includes(filter.key) ? 'primary' : 'secondary'"
          size="sm"
          @click="toggleQuickFilter(filter.key)"
        >
          <BaseIcon :name="filter.icon" size="sm" class="mr-2" />
          {{ filter.label }}
        </BaseButton>
      </div>

      <!-- Advanced Filters Toggle -->
      <div class="search-page__advanced-toggle">
        <AppText size="body-sm" class="text-neutral-20">
          {{ searchResults.length }} results found
        </AppText>
        <BaseButton 
          variant="ghost" 
          size="sm"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <BaseIcon name="sliders" size="sm" class="mr-2" />
          Advanced Filters
        </BaseButton>
      </div>

      <!-- Advanced Filters Panel -->
      <div v-if="showAdvancedFilters" class="search-page__advanced-panel">
        <MenuFilters 
          :show-category-filter="true"
          @close="showAdvancedFilters = false"
        />
      </div>
    </div>

    <!-- Search Results -->
    <div class="search-page__results">
      <!-- Loading State -->
      <div v-if="isSearching" class="search-page__loading">
        <div class="search-page__spinner" />
        <AppText class="text-neutral-20">Searching...</AppText>
      </div>

      <!-- No Search Query -->
      <div v-else-if="!searchQuery && !hasActiveFilters" class="search-page__empty-state">
        <BaseIcon name="search" size="xl" class="search-page__empty-icon" />
        <AppHeading level="h3" size="heading-lg" class="search-page__empty-title">
          Start Your Search
        </AppHeading>
        <AppText class="search-page__empty-text">
          Enter a dish name, ingredient, or use our filters to find exactly what you're craving
        </AppText>
        
        <!-- Browse Categories -->
        <div class="search-page__categories">
          <AppText size="body-sm" class="search-page__categories-label">
            Or browse by category:
          </AppText>
          <div class="search-page__category-list">
            <NuxtLink
              v-for="category in popularCategories"
              :key="category.id"
              :to="`/menu/categories/${category.id}`"
            >
              <BaseButton variant="secondary" size="sm">
                <CategoryIcon :category="category.id" size="sm" class="mr-2" />
                {{ category.name }}
              </BaseButton>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-else-if="searchResults.length > 0">
        <!-- Results Header -->
        <div class="search-page__results-header">
          <div>
            <AppHeading level="h2" size="heading-lg" class="search-page__results-title">
              Search Results
            </AppHeading>
            <AppText class="text-neutral-20">
              {{ searchResults.length }} items found
              <span v-if="searchQuery">for "{{ searchQuery }}"</span>
            </AppText>
          </div>
          
          <!-- Sort Options -->
          <select 
            v-model="sortBy"
            class="search-page__sort-select"
          >
            <option value="relevance">Most Relevant</option>
            <option value="name">Name A-Z</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        <!-- Results Grid -->
        <MenuItemGrid 
          :items="sortedResults"
          :columns="6"
          @item-selected="onItemSelected"
        />

        <!-- Load More -->
        <div v-if="hasMoreResults" class="search-page__load-more">
          <BaseButton 
            variant="secondary"
            :disabled="loadingMore"
            @click="loadMoreResults"
          >
            <BaseIcon 
              v-if="loadingMore"
              name="loader" 
              size="sm" 
              class="mr-2 animate-spin" 
            />
            Load More Results
          </BaseButton>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="search-page__empty-state">
        <BaseIcon name="search-x" size="xl" class="search-page__empty-icon" />
        <AppHeading level="h3" size="heading-lg" class="search-page__empty-title">
          No Results Found
        </AppHeading>
        <AppText class="search-page__empty-text">
          We couldn't find any items matching your search. Try different keywords or adjust your filters.
        </AppText>
        
        <div class="search-page__empty-actions">
          <BaseButton 
            variant="secondary"
            @click="clearAllFilters"
          >
            Clear All Filters
          </BaseButton>
          <NuxtLink to="/menu">
            <BaseButton variant="ghost">
              Browse Full Menu
            </BaseButton>
          </NuxtLink>
        </div>

        <!-- Search Suggestions -->
        <div v-if="searchSuggestions.length > 0" class="search-page__suggestions-large">
          <AppText size="body-sm" class="search-page__suggestions-label">
            Try searching for:
          </AppText>
          <div class="search-page__tags">
            <BaseButton
              v-for="suggestion in searchSuggestions.slice(0, 5)"
              :key="suggestion"
              variant="ghost"
              size="sm"
              class="search-page__tag"
              @click="searchQuery = suggestion"
            >
              {{ suggestion }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Searches -->
    <div v-if="recentSearches.length > 0" class="search-page__recent">
      <div class="search-page__recent-header">
        <AppHeading level="h3" size="heading-md" class="text-white">
          Recent Searches
        </AppHeading>
        <BaseButton 
          variant="ghost" 
          size="sm"
          @click="clearRecentSearches"
        >
          <BaseIcon name="clock" size="xs" class="mr-2" />
          Clear All
        </BaseButton>
      </div>
      
      <div class="search-page__tags">
        <BaseButton
          v-for="recent in recentSearches"
          :key="recent"
          variant="ghost"
          size="sm"
          class="search-page__tag"
          @click="searchQuery = recent"
        >
          <BaseIcon name="clock" size="xs" class="mr-2" />
          {{ recent }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItemUI } from '~/types'

// Stores
import { useMenuStore } from '~/stores/menu'

// Page setup
definePageMeta({
  title: 'Search Menu - Menu Ordering App'
})

const menuStore = useMenuStore()
const router = useRouter()
const route = useRoute()

// Reactive state
const searchQuery = ref('')
const isSearching = ref(false)
const showAdvancedFilters = ref(false)
const sortBy = ref('relevance')
const activeQuickFilters = ref<string[]>([])
const loadingMore = ref(false)
const hasMoreResults = ref(false)

// Search suggestions and recent searches
const searchSuggestions = ref([
  'Pizza', 'Burger', 'Salad', 'Pasta', 'Chicken', 'Vegetarian', 'Spicy', 'Dessert'
])

const recentSearches = ref<string[]>([])

// Quick filters
const quickFilters = [
  { key: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
  { key: 'spicy', label: 'Spicy', icon: 'flame' },
  { key: 'healthy', label: 'Healthy', icon: 'heart' },
  { key: 'popular', label: 'Popular', icon: 'star' },
  { key: 'new', label: 'New', icon: 'sparkles' }
]

// Popular categories for browsing
const popularCategories = [
  { id: 'fastfood', name: 'Fast Food' },
  { id: 'main-dishes', name: 'Main Dishes' },
  { id: 'pizza', name: 'Pizza' },
  { id: 'salads', name: 'Salads' },
  { id: 'desserts', name: 'Desserts' }
]

// Reactive search results
const searchResults = ref<MenuItemUI[]>([])

// Watch for search query changes
watch(searchQuery, async (newQuery) => {
  if (newQuery.trim()) {
    searchResults.value = await menuStore.searchItems(newQuery)
  } else {
    searchResults.value = []
  }
}, { immediate: true })

const sortedResults = computed(() => {
  const results = [...searchResults.value]
  
  switch (sortBy.value) {
    case 'name':
      return results.sort((a, b) => a.name.localeCompare(b.name))
    case 'price-low':
      return results.sort((a, b) => a.price - b.price)
    case 'price-high':
      return results.sort((a, b) => b.price - a.price)
    case 'rating':
      // Mock rating sort
      return results.sort(() => Math.random() - 0.5)
    case 'relevance':
    default:
      return results
  }
})

const hasActiveFilters = computed(() => {
  return activeQuickFilters.value.length > 0 || 
         Object.keys(menuStore.filters).length > 0
})

// Methods
const performSearch = () => {
  if (!searchQuery.value.trim()) return
  
  isSearching.value = true
  
  // Add to recent searches
  if (!recentSearches.value.includes(searchQuery.value)) {
    recentSearches.value.unshift(searchQuery.value)
    if (recentSearches.value.length > 10) {
      recentSearches.value = recentSearches.value.slice(0, 10)
    }
    saveRecentSearches()
  }
  
  // Simulate search delay
  setTimeout(() => {
    isSearching.value = false
  }, 500)
}

const clearSearch = () => {
  searchQuery.value = ''
  menuStore.clearSearch()
}

const toggleQuickFilter = (filterKey: string) => {
  const index = activeQuickFilters.value.indexOf(filterKey)
  if (index >= 0) {
    activeQuickFilters.value.splice(index, 1)
  } else {
    activeQuickFilters.value.push(filterKey)
  }
  
  // Apply filter logic here
  applyQuickFilters()
}

const applyQuickFilters = () => {
  // This would apply the quick filters to the menu store
  // For now, just trigger a search
  if (searchQuery.value) {
    performSearch()
  }
}

const clearAllFilters = () => {
  activeQuickFilters.value = []
  menuStore.clearFilters()
  showAdvancedFilters.value = false
}

const onItemSelected = (item: MenuItemUI) => {
  menuStore.setSelectedDish(item)
  router.push(`/dish/${item.id}`)
}

const loadMoreResults = () => {
  loadingMore.value = true
  // Simulate loading more results
  setTimeout(() => {
    loadingMore.value = false
    hasMoreResults.value = false // No more results for demo
  }, 1000)
}

const clearRecentSearches = () => {
  recentSearches.value = []
  if (import.meta.client) {
    localStorage.removeItem('recentSearches')
  }
}

const saveRecentSearches = () => {
  if (import.meta.client) {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
  }
}

const loadRecentSearches = () => {
  if (import.meta.client) {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      recentSearches.value = JSON.parse(saved)
    }
  }
}

// Initialize
onMounted(async () => {
  // Load recent searches
  loadRecentSearches()
  
  // Check for search query in URL
  const queryFromUrl = route.query.q as string
  if (queryFromUrl) {
    searchQuery.value = queryFromUrl
    performSearch()
  }
  
  // Fetch menu data
  try {
    await menuStore.fetchMenu()
  } catch (error) {
    console.error('Failed to fetch menu:', error)
    // Error is handled by the store
  }
})

// Watch search query and update URL
watch(searchQuery, (newQuery) => {
  if (newQuery) {
    router.replace({ query: { q: newQuery } })
    performSearch()
  } else {
    router.replace({ query: {} })
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/abstracts/variables' as *;

.search-page {
  min-height: 100vh;
  background-color: var(--bg-background-dark);
}

.search-page__header {
  padding: $space-8 $space-6;
}

.search-page__header-content {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-4;
}

.search-page__back-link {
  color: var(--text-secondary);
  transition: color $transition-base;
  
  &:hover {
    color: white;
  }
}

.search-page__title {
  color: white;
}

.search-page__subtitle {
  color: var(--text-secondary);
}

.search-page__controls {
  padding: 0 $space-6 $space-8;
}

.search-page__input-wrapper {
  margin-bottom: $space-6;
}

.search-page__input {
  width: 100%;
}

.search-page__suggestions {
  margin-bottom: $space-6;
}

.search-page__suggestions-label {
  color: var(--text-secondary);
  margin-bottom: $space-3;
}

.search-page__tags {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.search-page__tag {
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    color: white;
    border-color: var(--color-primary);
  }
}

.search-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-bottom: $space-4;
}

.search-page__advanced-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-page__advanced-panel {
  margin-top: $space-4;
}

.search-page__results {
  padding: 0 $space-6;
}

.search-page__loading {
  text-align: center;
  padding: $space-12 0;
}

.search-page__spinner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border-bottom: 2px solid var(--color-primary);
  animation: spin 1s linear infinite;
  margin: 0 auto $space-4;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.search-page__empty-state {
  text-align: center;
  padding: $space-16 0;
}

.search-page__empty-icon {
  color: var(--text-secondary);
  margin: 0 auto $space-6;
  opacity: 0.5;
}

.search-page__empty-title {
  color: white;
  margin-bottom: $space-4;
}

.search-page__empty-text {
  color: var(--text-secondary);
  margin-bottom: $space-8;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.search-page__categories {
  margin-bottom: $space-8;
}

.search-page__categories-label {
  color: var(--text-secondary);
  margin-bottom: $space-4;
}

.search-page__category-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $space-2;
}

.search-page__empty-actions {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  justify-content: center;
  
  @media (min-width: $breakpoint-sm) {
    flex-direction: row;
  }
}

.search-page__suggestions-large {
  margin-top: $space-8;
}

.search-page__results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-6;
}

.search-page__results-title {
  color: white;
  margin-bottom: $space-1;
}

.search-page__sort-select {
  background-color: var(--bg-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $radius-lg;
  padding: $space-2 $space-3;
  color: white;
  font-size: $text-sm;
  outline: none;
  
  &:focus {
    border-color: var(--color-primary);
  }
}

.search-page__load-more {
  text-align: center;
  margin-top: $space-8;
}

.search-page__recent {
  padding: $space-8 $space-6;
  margin-top: $space-12;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.search-page__recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
}
</style>