<template>
  <div class="relative w-full">
    <div class="relative">
      <!-- Search Input -->
      <BaseInput
        v-model="searchQuery"
        type="text"
        placeholder="Search dishes..."
        class="w-full pl-10 pr-10"
        @input="handleSearch"
        @focus="showSuggestions = true"
        @keydown.escape="clearSearch"
        @keydown.enter="performSearch"
      />
      
      <!-- Search Icon -->
      <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
        <BaseIcon name="search" size="sm" class="text-neutral-80" />
      </div>
      
      <!-- Clear Button -->
      <BaseButton
        v-if="searchQuery"
        variant="ghost"
        size="sm"
        class="absolute right-2 top-1/2 transform -translate-y-1/2"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <BaseIcon name="x" size="sm" />
      </BaseButton>
    </div>

    <!-- Search Suggestions -->
    <div
      v-if="showSuggestions && (suggestions.length > 0 || recentSearches.length > 0)"
      class="absolute top-full left-0 right-0 mt-2 bg-background-card border border-border-subtle rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
    >
      <!-- Recent Searches -->
      <div v-if="recentSearches.length > 0 && !searchQuery" class="p-3 border-b border-border-subtle">
        <AppText size="caption" class="text-neutral-80 mb-2">
          Recent Searches
        </AppText>
        <div class="space-y-1">
          <button
            v-for="recent in recentSearches"
            :key="recent"
            class="flex items-center w-full p-2 text-left hover:bg-background-dark rounded text-body-sm"
            @click="selectSearch(recent)"
          >
            <BaseIcon name="clock" size="sm" class="text-neutral-80 mr-2" />
            {{ recent }}
          </button>
        </div>
      </div>

      <!-- Search Suggestions -->
      <div v-if="suggestions.length > 0" class="p-3">
        <AppText v-if="searchQuery" size="caption" class="text-neutral-80 mb-2">
          Suggestions
        </AppText>
        <div class="space-y-1">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="flex items-center w-full p-2 text-left hover:bg-background-dark rounded"
            @click="selectDish(suggestion)"
          >
            <BaseImage
              :src="suggestion.imageUrl"
              :alt="suggestion.name"
              class="w-8 h-8 rounded-full mr-3 flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <AppText size="body-sm" class="truncate">
                {{ suggestion.name }}
              </AppText>
              <AppText size="caption" class="text-neutral-80 truncate">
                {{ suggestion.category?.name }}
              </AppText>
            </div>
            <AppPrice :amount="suggestion.price" size="sm" class="ml-2" />
          </button>
        </div>
      </div>

      <!-- No Results -->
      <div v-if="searchQuery && suggestions.length === 0" class="p-6 text-center">
        <BaseIcon name="search" size="lg" class="text-neutral-80 mx-auto mb-2" />
        <AppText class="text-neutral-80">
          No dishes found for "{{ searchQuery }}"
        </AppText>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMenuStore } from '~/stores/menu'

// Emits
const emit = defineEmits<{
  close?: []
}>()

// Stores
const menuStore = useMenuStore()
const router = useRouter()

// Debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Reactive state
const searchQuery = ref('')
const showSuggestions = ref(false)
const recentSearches = ref<string[]>([])

// Computed properties
const suggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    return []
  }
  return menuStore.searchItems(searchQuery.value).slice(0, 5)
})

// Methods
const handleSearch = debounce(async (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  
  if (searchQuery.value.length >= 2) {
    try {
      await menuStore.searchItems(searchQuery.value)
    } catch (error) {
      console.error('Search failed:', error)
      // Could show a toast notification here
    }
  }
}, 300)

const performSearch = () => {
  if (searchQuery.value.trim()) {
    addToRecentSearches(searchQuery.value.trim())
    router.push(`/menu/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
    showSuggestions.value = false
    emit('close')
  }
}

const selectSearch = (query: string) => {
  searchQuery.value = query
  performSearch()
}

const selectDish = (dish: any) => {
  menuStore.setSelectedDish(dish)
  showSuggestions.value = false
  emit('close')
}

const clearSearch = () => {
  searchQuery.value = ''
  showSuggestions.value = false
  menuStore.clearSearch()
}

const addToRecentSearches = (query: string) => {
  const searches = recentSearches.value.filter(s => s !== query)
  searches.unshift(query)
  recentSearches.value = searches.slice(0, 5)
  
  // Save to localStorage
  if (import.meta.client) {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
  }
}

const loadRecentSearches = () => {
  if (import.meta.client) {
    try {
      const saved = localStorage.getItem('recentSearches')
      if (saved) {
        recentSearches.value = JSON.parse(saved)
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error)
    }
  }
}

// Load recent searches on mount
onMounted(() => {
  loadRecentSearches()
})

// Watch for route changes to clear search
watch(() => router.currentRoute.value.path, () => {
  showSuggestions.value = false
})
</script>

<style scoped>
/* Custom scrollbar for suggestions */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
</style>