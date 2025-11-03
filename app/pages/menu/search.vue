<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-4 mb-4">
        <NuxtLink 
          to="/menu"
          class="text-neutral-20 hover:text-white transition-colors"
        >
          <BaseIcon name="arrow-left" size="md" />
        </NuxtLink>
        
        <div>
          <AppHeading level="h1" size="display-md" class="text-white">
            Search Menu
          </AppHeading>
          <AppText size="body-md" class="text-neutral-20">
            Find exactly what you're looking for
          </AppText>
        </div>
      </div>
    </div>

    <!-- Search Section -->
    <div class="px-6 mb-8">
      <!-- Main Search Bar -->
      <div class="mb-6">
        <BaseInput
          v-model="searchQuery"
          placeholder="Search for dishes, ingredients, or categories..."
          class="w-full text-lg"
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
      <div v-if="!searchQuery && searchSuggestions.length > 0" class="mb-6">
        <AppText size="body-sm" class="text-neutral-20 mb-3">
          Popular searches:
        </AppText>
        <div class="flex flex-wrap gap-2">
          <BaseButton
            v-for="suggestion in searchSuggestions"
            :key="suggestion"
            variant="ghost"
            size="sm"
            @click="searchQuery = suggestion"
            class="text-neutral-20 hover:text-white border border-neutral-80/30 hover:border-primary-green/50"
          >
            {{ suggestion }}
          </BaseButton>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="flex flex-wrap gap-2 mb-4">
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
      <div class="flex items-center justify-between">
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
      <div v-if="showAdvancedFilters" class="mt-4">
        <MenuFilters 
          :show-category-filter="true"
          @close="showAdvancedFilters = false"
        />
      </div>
    </div>

    <!-- Search Results -->
    <div class="px-6">
      <!-- Loading State -->
      <div v-if="isSearching" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
        <AppText class="text-neutral-20">Searching...</AppText>
      </div>

      <!-- No Search Query -->
      <div v-else-if="!searchQuery && !hasActiveFilters" class="text-center py-16">
        <BaseIcon name="search" size="4xl" class="text-neutral-80 mx-auto mb-6" />
        <AppHeading level="h3" size="heading-lg" class="text-white mb-4">
          Start Your Search
        </AppHeading>
        <AppText class="text-neutral-20 mb-8 max-w-md mx-auto">
          Enter a dish name, ingredient, or use our filters to find exactly what you're craving
        </AppText>
        
        <!-- Browse Categories -->
        <div class="mb-8">
          <AppText size="body-sm" class="text-neutral-20 mb-4">
            Or browse by category:
          </AppText>
          <div class="flex flex-wrap gap-2 justify-center">
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
        <div class="flex items-center justify-between mb-6">
          <div>
            <AppHeading level="h2" size="heading-lg" class="text-white mb-1">
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
            class="bg-background-card border border-neutral-80/30 rounded-lg px-3 py-2 text-white text-sm"
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
        <div v-if="hasMoreResults" class="text-center mt-8">
          <BaseButton 
            variant="secondary"
            @click="loadMoreResults"
            :disabled="loadingMore"
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
      <div v-else class="text-center py-16">
        <BaseIcon name="search-x" size="4xl" class="text-neutral-80 mx-auto mb-6" />
        <AppHeading level="h3" size="heading-lg" class="text-white mb-4">
          No Results Found
        </AppHeading>
        <AppText class="text-neutral-20 mb-8 max-w-md mx-auto">
          We couldn't find any items matching your search. Try different keywords or adjust your filters.
        </AppText>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
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
        <div v-if="searchSuggestions.length > 0" class="mt-8">
          <AppText size="body-sm" class="text-neutral-20 mb-4">
            Try searching for:
          </AppText>
          <div class="flex flex-wrap gap-2 justify-center">
            <BaseButton
              v-for="suggestion in searchSuggestions.slice(0, 5)"
              :key="suggestion"
              variant="ghost"
              size="sm"
              @click="searchQuery = suggestion"
              class="text-neutral-20 hover:text-primary-green"
            >
              {{ suggestion }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Searches -->
    <div v-if="recentSearches.length > 0" class="px-6 py-8 mt-12 border-t border-neutral-80/20">
      <div class="flex items-center justify-between mb-4">
        <AppHeading level="h3" size="heading-md" class="text-white">
          Recent Searches
        </AppHeading>
        <BaseButton 
          variant="ghost" 
          size="sm"
          @click="clearRecentSearches"
        >
          Clear All
        </BaseButton>
      </div>
      
      <div class="flex flex-wrap gap-2">
        <BaseButton
          v-for="recent in recentSearches"
          :key="recent"
          variant="ghost"
          size="sm"
          @click="searchQuery = recent"
          class="text-neutral-20 hover:text-white border border-neutral-80/30 hover:border-primary-green/50"
        >
          <BaseIcon name="clock" size="xs" class="mr-2" />
          {{ recent }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'

// Page setup
definePageMeta({
  title: 'Search Menu - Menu Ordering App'
})

// Stores
import { useMenuStore } from '~/stores/menu'

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

// Computed
const searchResults = computed(() => {
  return menuStore.searchItems(searchQuery.value)
})

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

const onItemSelected = (item: MenuItem) => {
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