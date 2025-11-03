<template>
  <div class="w-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <BaseIcon name="heart-filled" size="lg" class="text-primary-red" />
        <div>
          <AppHeading level="h2" size="heading-xl" class="text-white">
            Your Favorites
          </AppHeading>
          <AppText size="body-md" class="text-neutral-80">
            {{ favouriteItems.length }} favorite dishes
          </AppText>
        </div>
      </div>
      
      <!-- Clear All Button -->
      <BaseButton
        v-if="favouriteItems.length > 0"
        variant="ghost"
        @click="clearAllFavorites"
        class="text-primary-red hover:text-primary-red/80"
      >
        Clear All
      </BaseButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="n in 8"
        :key="n"
        class="animate-pulse"
      >
        <BaseCard class="p-4 space-y-3">
          <div class="flex items-start space-x-3">
            <div class="w-20 h-20 bg-background-dark rounded-full"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-background-dark rounded w-3/4"></div>
              <div class="h-3 bg-background-dark rounded w-full"></div>
              <div class="h-3 bg-background-dark rounded w-2/3"></div>
            </div>
          </div>
          <div class="flex justify-between items-center pt-2">
            <div class="h-6 bg-background-dark rounded w-16"></div>
            <div class="h-8 bg-background-dark rounded w-20"></div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="favouriteItems.length === 0"
      class="text-center py-16"
    >
      <div class="mb-6">
        <BaseIcon name="heart" size="xl" class="text-neutral-80 mx-auto mb-4" />
        <AppHeading level="h3" size="heading-md" class="text-neutral-80 mb-2">
          No favorites yet
        </AppHeading>
        <AppText size="body-md" class="text-neutral-80 mb-6 max-w-md mx-auto">
          Start adding dishes to your favorites by clicking the heart icon on any menu item
        </AppText>
      </div>
      
      <!-- Browse Menu Button -->
      <BaseButton
        variant="primary"
        @click="$emit('browseMenu')"
      >
        Browse Menu
        <BaseIcon name="arrow-right" size="sm" class="ml-2" />
      </BaseButton>
    </div>

    <!-- Favorites Grid -->
    <MenuItemGrid
      v-else
      :items="displayItems"
      :columns="gridColumns"
      :loading="false"
      :show-header="false"
      :show-popular-indicator="false"
      :max-items="maxItems"
      :show-load-more="showLoadMore"
      :show-pagination="showPagination"
      :total-items="favouriteItems.length"
      :filtered-count="filteredFavorites.length"
      :has-filters="hasFilters"
      :empty-title="'No matching favorites'"
      :empty-message="'Try adjusting your search or filters'"
      :show-clear-filters="true"
      @item-click="handleItemClick"
      @add-to-cart="handleAddToCart"
      @toggle-favorite="handleToggleFavorite"
      @load-more="loadMore"
      @clear-filters="$emit('clearFilters')"
    />

    <!-- Quick Actions -->
    <div v-if="favouriteItems.length > 0" class="mt-8 flex flex-wrap gap-3 justify-center">
      <BaseButton
        variant="secondary"
        @click="addAllToCart"
        :disabled="!hasAvailableFavorites"
      >
        <BaseIcon name="cart" size="sm" class="mr-2" />
        Add All to Cart
      </BaseButton>
      
      <BaseButton
        variant="secondary"
        @click="shareList"
      >
        <BaseIcon name="share" size="sm" class="mr-2" />
        Share List
      </BaseButton>
      
      <BaseButton
        variant="secondary"
        @click="exportList"
      >
        <BaseIcon name="download" size="sm" class="mr-2" />
        Export List
      </BaseButton>
    </div>

    <!-- Recommendations -->
    <div v-if="recommendedItems.length > 0" class="mt-12">
      <div class="mb-6">
        <AppHeading level="h3" size="heading-lg" class="text-white mb-2">
          You might also like
        </AppHeading>
        <AppText size="body-md" class="text-neutral-80">
          Based on your favorite dishes
        </AppText>
      </div>
      
      <MenuItemGrid
        :items="recommendedItems"
        :columns="4"
        :max-items="8"
        :show-header="false"
        :show-popular-indicator="true"
        @item-click="handleItemClick"
        @add-to-cart="handleAddToCart"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MenuItem } from '~/types'
import { useCartStore } from '~/stores/cart'
import { useMenuStore } from '~/stores/menu'

interface Props {
  searchQuery?: string
  filters?: any
  gridColumns?: 1 | 2 | 3 | 4 | 5 | 6 | 7
  maxItems?: number
  showLoadMore?: boolean
  showPagination?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  gridColumns: 4,
  showLoadMore: false,
  showPagination: true,
  loading: false
})

const emit = defineEmits<{
  itemClick: [item: MenuItem]
  addToCart: [item: MenuItem]
  toggleFavorite: [item: MenuItem]
  browseMenu: []
  clearFilters: []
  share: [items: MenuItem[]]
  export: [items: MenuItem[]]
}>()

// Stores
const menuStore = useMenuStore()
const cartStore = useCartStore()

// Local state
const currentPage = ref(1)
const itemsPerPage = 12

// Computed properties
const favouriteItems = computed(() => menuStore.favourites)

const filteredFavorites = computed(() => {
  let items = favouriteItems.value

  // Apply search filter
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase()
    items = items.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    )
  }

  // Apply other filters if provided
  if (props.filters) {
    // Price range filter
    if (props.filters.priceRange) {
      const [min, max] = props.filters.priceRange
      items = items.filter(item => item.price >= min && item.price <= max)
    }

    // Calories filter
    if (props.filters.calories) {
      const [min, max] = props.filters.calories
      items = items.filter(item => item.calories && item.calories >= min && item.calories <= max)
    }

    // Availability filter
    if (props.filters.availability) {
      items = items.filter(item => item.isActive)
    }

    // Dietary restrictions
    if (props.filters.dietary?.length) {
      items = items.filter(item => {
        // This would need to be implemented based on item dietary information
        return true // Placeholder
      })
    }
  }

  return items
})

const displayItems = computed(() => {
  if (props.maxItems) {
    return filteredFavorites.value.slice(0, props.maxItems)
  }
  
  if (props.showPagination) {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredFavorites.value.slice(start, end)
  }
  
  return filteredFavorites.value
})

const hasFilters = computed(() => {
  return !!(props.searchQuery || (props.filters && Object.keys(props.filters).length > 0))
})

const hasAvailableFavorites = computed(() => {
  return favouriteItems.value.some(item => item.isActive)
})

const recommendedItems = computed(() => {
  if (favouriteItems.value.length === 0) return []
  
  // Get categories from favorite items
  const favoriteCategories = new Set(
    favouriteItems.value.map(item => item.categoryId)
  )
  
  // Find items from same categories that aren't already favorites
  const recommendations = menuStore.menuItems.filter(item => 
    favoriteCategories.has(item.categoryId) && 
    !favouriteItems.value.some(fav => fav.id === item.id) &&
    item.isActive
  )
  
  // Sort by some criteria (price, popularity, etc.)
  return recommendations.slice(0, 8)
})

// Methods
const handleItemClick = (item: MenuItem) => {
  emit('itemClick', item)
}

const handleAddToCart = (item: MenuItem) => {
  emit('addToCart', item)
}

const handleToggleFavorite = (item: MenuItem) => {
  emit('toggleFavorite', item)
}

const loadMore = () => {
  currentPage.value++
}

const clearAllFavorites = async () => {
  // Show confirmation dialog
  const confirmed = confirm('Are you sure you want to remove all favorites?')
  
  if (confirmed) {
    // Clear all favorites
    favouriteItems.value.forEach(item => {
      menuStore.toggleFavourite(item.id)
    })
    
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }
}

const addAllToCart = () => {
  const availableFavorites = favouriteItems.value.filter(item => item.isActive)
  
  availableFavorites.forEach(item => {
    cartStore.addItem(item, 1)
  })
  
  // Show success message or toast
  console.log(`Added ${availableFavorites.length} items to cart`)
  
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(100)
  }
}

const shareList = () => {
  const shareData = {
    title: 'My Favorite Dishes',
    text: `Check out my ${favouriteItems.value.length} favorite dishes!`,
    url: window.location.href
  }
  
  if (navigator.share) {
    navigator.share(shareData)
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareData.url)
    console.log('Link copied to clipboard')
  }
  
  emit('share', favouriteItems.value)
}

const exportList = () => {
  const data = favouriteItems.value.map(item => ({
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category.name
  }))
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = 'my-favorites.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  emit('export', favouriteItems.value)
}
</script>

<style scoped>
/* Grid animations */
.grid > * {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Empty state animation */
.text-center {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Heart icon pulse animation */
.text-primary-red {
  animation: heartbeat 2s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Button hover effects */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .flex-wrap {
    flex-direction: column;
  }
  
  .flex-wrap > * {
    width: 100%;
  }
}
</style>