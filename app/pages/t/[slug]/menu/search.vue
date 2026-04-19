<template>
  <div class="search-page">
    <!-- Header -->
    <div class="search-page__header">
      <NuxtLink to="/menu" class="search-page__back">
        <BaseIcon name="arrow-left" size="md" />
      </NuxtLink>
      <h1 class="search-page__title">Поиск</h1>
    </div>

    <!-- Search Bar -->
    <div class="search-page__search-bar">
      <div class="search-page__input-wrapper">
        <BaseIcon name="search" size="md" class="search-page__input-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск блюд..."
          class="search-page__input"
          @keyup.enter="performSearch"
        />
        <button
          v-if="searchQuery"
          class="search-page__clear-btn"
          @click="clearSearch"
        >
          <BaseIcon name="x" size="sm" />
        </button>
      </div>
    </div>

    <!-- Quick Filters -->
    <div class="search-page__filters">
      <button
        v-for="filter in quickFilters"
        :key="filter.key"
        :class="['search-page__filter-chip', { 'search-page__filter-chip--active': activeQuickFilters.includes(filter.key) }]"
        @click="toggleQuickFilter(filter.key)"
      >
        <BaseIcon :name="filter.icon" size="xs" />
        <span>{{ filter.label }}</span>
      </button>
    </div>

    <!-- Content Area -->
    <div class="search-page__content">
      <!-- Loading State -->
      <div v-if="isSearching" class="search-page__loading">
        <BaseIcon name="loader" size="lg" class="search-page__spinner" />
        <span>Ищем...</span>
      </div>

      <!-- Empty / Prompt State -->
      <div v-else-if="!searchQuery && !hasActiveFilters" class="search-page__empty">
        <BaseIcon name="search" size="4xl" class="search-page__empty-icon" />
        <h2 class="search-page__empty-title">Найдите своё блюдо</h2>
        <p class="search-page__empty-text">
          Введите название блюда или ингредиент
        </p>

        <!-- Popular Searches -->
        <div v-if="searchSuggestions.length > 0" class="search-page__suggestions">
          <span class="search-page__suggestions-label">Популярное:</span>
          <div class="search-page__suggestion-tags">
            <button
              v-for="suggestion in searchSuggestions"
              :key="suggestion"
              class="search-page__suggestion-tag"
              @click="searchQuery = suggestion"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <!-- Categories -->
        <div v-if="popularCategories.length > 0" class="search-page__categories">
          <span class="search-page__categories-label">Категории:</span>
          <div class="search-page__category-grid">
            <NuxtLink
              v-for="category in popularCategories"
              :key="category.id"
              :to="`/menu/categories/${category.id}`"
              class="search-page__category-card"
            >
              {{ category.name }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-else-if="searchResults.length > 0" class="search-page__results">
        <div class="search-page__results-header">
          <span class="search-page__results-count">
            {{ searchResults.length }} {{ searchResults.length === 1 ? 'результат' : 'результатов' }}
            <span v-if="searchQuery"> для "{{ searchQuery }}"</span>
          </span>
          <select v-model="sortBy" class="search-page__sort">
            <option value="relevance">По релевантности</option>
            <option value="name">По названию</option>
            <option value="price-low">Цена ↑</option>
            <option value="price-high">Цена ↓</option>
          </select>
        </div>

        <MenuItemGrid
          :items="sortedResults"
          @item-selected="onItemSelected"
        />
      </div>

      <!-- No Results -->
      <div v-else class="search-page__no-results">
        <BaseIcon name="search-x" size="4xl" class="search-page__empty-icon" />
        <h2 class="search-page__empty-title">Ничего не найдено</h2>
        <p class="search-page__empty-text">
          Попробуйте изменить запрос или фильтры
        </p>
        <div class="search-page__no-results-actions">
          <button class="search-page__action-btn" @click="clearAllFilters">
            Сбросить фильтры
          </button>
          <NuxtLink to="/menu" class="search-page__action-btn search-page__action-btn--ghost">
            Всё меню
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Recent Searches -->
    <div v-if="recentSearches.length > 0 && !searchQuery" class="search-page__recent">
      <div class="search-page__recent-header">
        <span class="search-page__recent-label">Недавние поиски</span>
        <button class="search-page__recent-clear" @click="clearRecentSearches">
          Очистить
        </button>
      </div>
      <div class="search-page__recent-tags">
        <button
          v-for="recent in recentSearches"
          :key="recent"
          class="search-page__recent-tag"
          @click="searchQuery = recent"
        >
          <BaseIcon name="clock" size="xs" />
          <span>{{ recent }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'
import { useMenuStore } from '~/stores/menu'

definePageMeta({
  title: 'Поиск — Каталога'
})

const menuStore = useMenuStore()
const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const isSearching = ref(false)
const sortBy = ref('relevance')
const activeQuickFilters = ref<string[]>([])

const searchSuggestions = ref([
  'Пицца', 'Бургер', 'Салат', 'Паста', 'Десерт'
])

const recentSearches = ref<string[]>([])

const quickFilters = [
  { key: 'vegetarian', label: 'Вегетарианское', icon: 'leaf' },
  { key: 'spicy', label: 'Острое', icon: 'flame' },
  { key: 'popular', label: 'Популярное', icon: 'star' },
  { key: 'new', label: 'Новинки', icon: 'sparkles' }
]

const popularCategories = [
  { id: 'fastfood', name: 'Фастфуд' },
  { id: 'main-dishes', name: 'Основные блюда' },
  { id: 'pizza', name: 'Пицца' },
  { id: 'salads', name: 'Салаты' },
  { id: 'desserts', name: 'Десерты' }
]

let searchTimeout: any = null
const searchResults = ref<MenuItem[]>([])

const executeSearch = async (query: string) => {
  if (!query.trim()) return

  isSearching.value = true

  if (!recentSearches.value.includes(query)) {
    recentSearches.value.unshift(query)
    if (recentSearches.value.length > 10) {
      recentSearches.value = recentSearches.value.slice(0, 10)
    }
    saveRecentSearches()
  }

  searchResults.value = await menuStore.searchItems(query)
  isSearching.value = false
}

watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (newQuery) {
    router.replace({ query: { q: newQuery } })
  } else {
    router.replace({ query: {} })
  }

  if (newQuery.trim()) {
    isSearching.value = true
    searchTimeout = setTimeout(() => {
      executeSearch(newQuery)
    }, 400)
  } else {
    searchResults.value = []
    isSearching.value = false
  }
}, { immediate: true })

const sortedResults = computed(() => {
  const results = [...searchResults.value]
  switch (sortBy.value) {
    case 'name': return results.sort((a, b) => a.name.localeCompare(b.name))
    case 'price-low': return results.sort((a, b) => a.price - b.price)
    case 'price-high': return results.sort((a, b) => b.price - a.price)
    default: return results
  }
})

const hasActiveFilters = computed(() => activeQuickFilters.value.length > 0)

const performSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  executeSearch(searchQuery.value)
}

const clearSearch = () => {
  searchQuery.value = ''
  menuStore.clearSearch()
}

const toggleQuickFilter = (key: string) => {
  const idx = activeQuickFilters.value.indexOf(key)
  if (idx >= 0) {
    activeQuickFilters.value.splice(idx, 1)
  } else {
    activeQuickFilters.value.push(key)
  }
  if (searchQuery.value) performSearch()
}

const clearAllFilters = () => {
  activeQuickFilters.value = []
  searchQuery.value = ''
}

const onItemSelected = (item: MenuItem) => {
  menuStore.setSelectedDish(item)
  router.push(`/dish/${item.id}`)
}

const clearRecentSearches = () => {
  recentSearches.value = []
  if (import.meta.client) localStorage.removeItem('recentSearches')
}

const saveRecentSearches = () => {
  if (import.meta.client) localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
}

const loadRecentSearches = () => {
  if (import.meta.client) {
    const saved = localStorage.getItem('recentSearches')
    if (saved) recentSearches.value = JSON.parse(saved)
  }
}

onMounted(async () => {
  loadRecentSearches()
  const q = route.query.q as string
  if (q) {
    searchQuery.value = q
    performSearch()
  }
  try {
    await menuStore.fetchMenu()
  } catch (e) {
    console.error('Failed to fetch menu:', e)
  }
})
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background: var(--bg-primary);
  padding-bottom: 100px; // room for bottom nav
}

// Header
.search-page__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-page__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}

.search-page__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

// Search Bar
.search-page__search-bar {
  padding: 12px 16px;
}

.search-page__input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 48px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
  }
}

.search-page__input-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-page__input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--text-primary);
  min-width: 0;

  &::placeholder {
    color: var(--text-tertiary);
  }
}

.search-page__clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg-tertiary, rgba(255,255,255,0.1));
  color: var(--text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 107, 53, 0.2);
    color: var(--color-primary);
  }
}

// Quick Filters
.search-page__filters {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
}

.search-page__filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
}

// Content
.search-page__content {
  padding: 0 16px;
}

// Loading
.search-page__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  color: var(--text-tertiary);
  font-size: 14px;
}

.search-page__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Empty / Prompt State
.search-page__empty,
.search-page__no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 16px;
}

.search-page__empty-icon {
  color: var(--text-tertiary);
  opacity: 0.4;
  margin-bottom: 16px;
}

.search-page__empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.search-page__empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 280px;
  line-height: 1.5;
  margin-bottom: 24px;
}

// Suggestions
.search-page__suggestions {
  width: 100%;
  margin-bottom: 24px;
}

.search-page__suggestions-label,
.search-page__categories-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.search-page__suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.search-page__suggestion-tag {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: rgba(255, 107, 53, 0.08);
  }
}

// Categories
.search-page__categories {
  width: 100%;
}

.search-page__category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.search-page__category-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: translateY(-1px);
  }
}

// Results
.search-page__results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.search-page__results-count {
  font-size: 14px;
  color: var(--text-secondary);
}

.search-page__sort {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  cursor: pointer;
}

// No Results Actions
.search-page__no-results-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.search-page__action-btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  text-decoration: none;
  border: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }

  &--ghost {
    background: transparent;
    border: 1px solid var(--border-primary);
    color: var(--text-secondary);

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
}

// Recent Searches
.search-page__recent {
  padding: 16px;
  margin-top: 8px;
  border-top: 1px solid var(--border-primary);
}

.search-page__recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.search-page__recent-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.search-page__recent-clear {
  font-size: 13px;
  color: var(--color-primary);
  cursor: pointer;
  background: none;
  border: none;
}

.search-page__recent-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-page__recent-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--text-primary);
  }
}
</style>
