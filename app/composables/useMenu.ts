import type { MenuItemUI, CategoryUI, MenuFilters } from '~/types'

import { useMenuStore } from '~/stores/menu'
import { useFavoritesStore } from '~/stores/favorites'

export function useMenu() {
  const menuStore = useMenuStore()
  const favoritesStore = useFavoritesStore()
  
  const {
    categories,
    menuItems,
    currentCategory,
    searchQuery,
    filters,
    loading,
    error,
    selectedDish,
    filteredMenuItems,
    popularItems,
  } = storeToRefs(menuStore)

  // Custom implementation for favourites to avoid circular dependency in store
  const favourites = computed(() => {
    return menuStore.menuItems.filter(item => favoritesStore.isFavorite(item.id))
  })

  // Actions
  const fetchMenu = () => menuStore.fetchMenu()
  const fetchCategory = (categoryId: string) => menuStore.fetchCategory(categoryId)
  const searchItems = (query: string) => menuStore.searchItems(query)
  const toggleFavourite = (itemId: string) => favoritesStore.toggleFavorite(itemId)
  const applyFilters = (newFilters: MenuFilters) => menuStore.applyFilters(newFilters)
  const clearFilters = () => menuStore.clearFilters()
  const setCurrentCategory = (categoryId: string | null) => menuStore.setCurrentCategory(categoryId)
  const setSelectedDish = (dish: MenuItemUI) => menuStore.setSelectedDish(dish)
  const clearSelectedDish = () => menuStore.clearSelectedDish()
  const fetchPopularItems = () => menuStore.fetchPopularItems()
  const fetchFavourites = () => favoritesStore.fetchFavoritesFromServer()
  const fetchMenuItem = (itemId: string) => menuStore.fetchMenuItem(itemId)

  // Computed
  const hasCategories = computed(() => categories.value.length > 0)
  const hasMenuItems = computed(() => menuItems.value.length > 0)
  const hasFavourites = computed(() => favoritesStore.hasFavorites)
  const isSearching = computed(() => searchQuery.value.length > 0)
  const hasFilters = computed(() => Object.keys(filters.value).length > 0)

  // Helper functions
  const getCategoryById = (categoryId: string) => {
    return categories.value.find(cat => cat.id === categoryId)
  }

  const getMenuItemById = (itemId: string) => {
    return menuItems.value.find(item => item.id === itemId)
  }

  const isFavourite = (itemId: string) => {
    return favoritesStore.isFavorite(itemId)
  }

  const getItemsByCategory = (categoryId: string) => {
    return menuItems.value.filter(item => item.categoryId === categoryId)
  }

  const refreshMenu = async () => {
    await fetchMenu()
  }

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  const getCategoryItems = (categoryId: string) => {
    return computed(() => getItemsByCategory(categoryId))
  }

  const searchInCategory = async (query: string, categoryId?: string) => {
    if (categoryId) {
      setCurrentCategory(categoryId)
    }
    await searchItems(query)
  }

  const getFilteredItemsCount = computed(() => filteredMenuItems.value.length)

  return {
    // State
    categories: readonly(categories),
    menuItems: readonly(menuItems),
    favourites: readonly(favourites),
    currentCategory: readonly(currentCategory),
    searchQuery: readonly(searchQuery),
    filters: readonly(filters),
    loading: readonly(loading),
    error: readonly(error),
    selectedDish: readonly(selectedDish),
    filteredMenuItems: readonly(filteredMenuItems),
    popularItems: readonly(popularItems),

    // Computed
    hasCategories,
    hasMenuItems,
    hasFavourites,
    isSearching,
    hasFilters,

    // Actions
    fetchMenu,
    fetchCategory,
    searchItems,
    toggleFavourite,
    applyFilters,
    clearFilters,
    setCurrentCategory,
    setSelectedDish,
    clearSelectedDish,
    fetchPopularItems,
    fetchFavourites,
    fetchMenuItem,

    // Helpers
    getCategoryById,
    getMenuItemById,
    isFavourite,
    getItemsByCategory,
    refreshMenu,
    isLoading,
    hasError,
    getCategoryItems,
    searchInCategory,
    getFilteredItemsCount,
  }
}