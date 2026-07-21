import type { MenuItem, Category, MenuFilters } from '~/types'

import { useMenuStore } from '~/stores/menu'

export function useMenu() {
  const menuStore = useMenuStore()
  
  const {
    categories,
    menuItems,
    favourites,
    currentCategory,
    searchQuery,
    filters,
    loading,
    error,
    selectedDish,
    filteredMenuItems,
    popularItems,
  } = storeToRefs(menuStore)

  // Actions
  const fetchMenu = () => menuStore.fetchMenu()
  const fetchCategory = (categoryId: string) => menuStore.fetchCategory(categoryId)
  const searchItems = (query: string) => menuStore.searchItems(query)
  const toggleFavourite = (itemId: string) => menuStore.toggleFavourite(itemId)
  const applyFilters = (newFilters: MenuFilters) => menuStore.applyFilters(newFilters)
  const clearFilters = () => menuStore.clearFilters()
  const setCurrentCategory = (categoryId: string | null) => menuStore.setCurrentCategory(categoryId)
  const setSelectedDish = (dish: MenuItem) => menuStore.setSelectedDish(dish)
  const clearSelectedDish = () => menuStore.clearSelectedDish()
  const fetchPopularItems = () => menuStore.fetchPopularItems()
  const fetchFavourites = () => menuStore.fetchFavourites()
  const fetchMenuItem = (itemId: string) => menuStore.fetchMenuItem(itemId)

  // Computed
  const hasCategories = computed(() => categories.value.length > 0)
  const hasMenuItems = computed(() => menuItems.value.length > 0)
  const hasFavourites = computed(() => favourites.value.length > 0)
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
    return favourites.value.some(fav => fav.id === itemId)
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
    items: readonly(menuItems),
    searchResults: readonly(filteredMenuItems),
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
    loadMenuItems: async (options?: { category?: string }) => {
      if (options?.category) {
        const cat = categories.value.find(c => c.name === options.category)
        if (cat) {
          setCurrentCategory(cat.id)
        }
      }
      await fetchMenu()
    },
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
