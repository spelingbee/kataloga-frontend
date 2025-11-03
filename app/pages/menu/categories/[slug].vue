<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-4 mb-4">
        <NuxtLink 
          to="/menu/categories"
          class="text-neutral-20 hover:text-white transition-colors"
        >
          <BaseIcon name="arrow-left" size="md" />
        </NuxtLink>
        
        <div class="flex items-center gap-3">
          <CategoryIcon 
            v-if="category"
            :category="category.id" 
            size="lg"
          />
          <div>
            <AppHeading level="h1" size="display-md" class="text-white">
              {{ category?.name || 'Category' }}
            </AppHeading>
            <AppText size="body-md" class="text-neutral-20">
              {{ category?.description || 'Explore our delicious selection' }}
            </AppText>
          </div>
        </div>
      </div>

      <!-- Category Stats -->
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <BaseIcon name="utensils" size="sm" class="text-primary-orange" />
          <AppText class="text-neutral-20">
            {{ filteredItems.length }} items
          </AppText>
        </div>
        <div v-if="averagePrice" class="flex items-center gap-2">
          <BaseIcon name="dollar-sign" size="sm" class="text-primary-green" />
          <AppText class="text-neutral-20">
            Avg. {{ formatPrice(averagePrice) }}
          </AppText>
        </div>
        <div v-if="isPopularCategory" class="flex items-center gap-2">
          <FireIcon size="sm" />
          <AppText class="text-primary-orange">
            Popular Category
          </AppText>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="px-6 mb-8">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1 max-w-md">
          <BaseInput
            v-model="searchQuery"
            placeholder="Search in this category..."
            class="w-full"
          >
            <template #prefix>
              <BaseIcon name="search" size="sm" class="text-neutral-80" />
            </template>
          </BaseInput>
        </div>

        <!-- Sort and Filter Controls -->
        <div class="flex gap-2">
          <select 
            v-model="sortBy"
            class="bg-background-card border border-neutral-80/30 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
            <option value="calories">Calories</option>
          </select>
          
          <BaseButton 
            variant="secondary" 
            @click="showFilters = !showFilters"
          >
            <BaseIcon name="filter" size="sm" class="mr-2" />
            Filters
          </BaseButton>
        </div>
      </div>

      <!-- Advanced Filters -->
      <div v-if="showFilters" class="mt-4">
        <MenuFilters 
          :category="categorySlug"
          @close="showFilters = false"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="px-6">
      <!-- Loading State -->
      <div v-if="menuStore.loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"/>
        <AppText class="text-neutral-20">Loading {{ category?.name || 'category' }}...</AppText>
      </div>

      <!-- Error State -->
      <div v-else-if="menuStore.error" class="text-center py-12">
        <BaseIcon name="alert-circle" size="xl" class="text-primary-red mx-auto mb-4" />
        <AppText class="text-white mb-4">{{ menuStore.error }}</AppText>
        <BaseButton @click="loadCategoryData">
          Try Again
        </BaseButton>
      </div>

      <!-- Menu Items -->
      <div v-else>
        <!-- Items Grid -->
        <MenuItemGrid 
          v-if="filteredItems.length > 0"
          :items="sortedItems"
          :columns="7"
          @item-selected="onItemSelected"
        />

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <BaseIcon name="search" size="4xl" class="text-neutral-80 mx-auto mb-6" />
          <AppHeading level="h3" size="heading-lg" class="text-white mb-4">
            No items found
          </AppHeading>
          <AppText class="text-neutral-20 mb-8 max-w-md mx-auto">
            {{ searchQuery ? 
              `No items match "${searchQuery}" in this category.` : 
              'This category is currently empty.' 
            }}
          </AppText>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <BaseButton 
              v-if="searchQuery"
              variant="secondary"
              @click="clearSearch"
            >
              Clear Search
            </BaseButton>
            <NuxtLink to="/menu/categories">
              <BaseButton variant="ghost">
                Browse Other Categories
              </BaseButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Categories -->
    <div v-if="relatedCategories.length > 0" class="px-6 py-12 mt-12 border-t border-neutral-80/20">
      <AppHeading level="h2" size="heading-xl" class="text-white mb-6">
        You Might Also Like
      </AppHeading>
      
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <NuxtLink
          v-for="relatedCategory in relatedCategories"
          :key="relatedCategory.id"
          :to="`/menu/categories/${relatedCategory.id}`"
          class="group"
        >
          <BaseCard class="p-4 text-center bg-background-card hover:bg-background-card/80 transition-all duration-300 group-hover:scale-105">
            <CategoryIcon 
              :category="relatedCategory.id" 
              size="md"
              class="mx-auto mb-2 group-hover:scale-110 transition-transform duration-300"
            />
            <AppText size="body-sm" class="text-white group-hover:text-primary-green transition-colors">
              {{ relatedCategory.name }}
            </AppText>
            <AppText size="caption" class="text-neutral-20 mt-1">
              {{ relatedCategory.count }} items
            </AppText>
          </BaseCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem, Category } from '~/types'
import { useMenuStore } from '~/stores/menu'

// Page setup
definePageMeta({
  title: 'Category - Menu Ordering App'
})

// Route and stores
const route = useRoute()
const router = useRouter()

const menuStore = useMenuStore()

// Reactive state
const showFilters = ref(false)
const searchQuery = ref('')
const sortBy = ref('name')

// Get category slug from route
const categorySlug = computed(() => route.params.slug as string)

// Sample categories data - will be replaced with real data from API
const categories = ref<Category[]>([
  { id: 'all', name: 'All Items', description: 'Browse our complete menu', icon: '🍔', count: 48, sortOrder: 0 },
  { id: 'salads', name: 'Fresh Salads', description: 'Healthy and nutritious salads', icon: '🥗', count: 12, sortOrder: 1 },
  { id: 'main-dishes', name: 'Main Dishes', description: 'Hearty and satisfying meals', icon: '🍽️', count: 18, sortOrder: 2 },
  { id: 'meat', name: 'Meat Dishes', description: 'Premium meat selections', icon: '🥩', count: 15, sortOrder: 3 },
  { id: 'fastfood', name: 'Fast Food', description: 'Quick and delicious options', icon: '🍟', count: 20, sortOrder: 4 },
  { id: 'desserts', name: 'Sweet Desserts', description: 'Indulgent treats and sweets', icon: '🧁', count: 8, sortOrder: 5 },
  { id: 'drinks', name: 'Beverages', description: 'Refreshing drinks and cocktails', icon: '🥤', count: 16, sortOrder: 6 },
  { id: 'appetizers', name: 'Appetizers', description: 'Perfect starters for your meal', icon: '🥨', count: 10, sortOrder: 7 },
  { id: 'soups', name: 'Soups', description: 'Warm and comforting soups', icon: '🍲', count: 6, sortOrder: 8 },
  { id: 'pizza', name: 'Pizza', description: 'Authentic wood-fired pizzas', icon: '🍕', count: 12, sortOrder: 9 }
])

const popularCategories = ['fastfood', 'main-dishes', 'pizza', 'drinks']

// Computed
const category = computed(() => {
  return categories.value.find(cat => cat.id === categorySlug.value)
})

const filteredItems = computed(() => {
  let items = menuStore.filteredItems
  
  // Filter by category
  if (categorySlug.value && categorySlug.value !== 'all') {
    items = items.filter(item => item.categoryId === categorySlug.value)
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
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
  if (filteredItems.value.length === 0) return null
  const total = filteredItems.value.reduce((sum, item) => sum + item.price, 0)
  return total / filteredItems.value.length
})

const isPopularCategory = computed(() => {
  return popularCategories.includes(categorySlug.value)
})

const relatedCategories = computed(() => {
  // Show related categories (exclude current category)
  return categories.value
    .filter(cat => cat.id !== categorySlug.value && cat.id !== 'all')
    .slice(0, 6)
})

// Methods
const onItemSelected = (item: MenuItem) => {
  menuStore.setSelectedDish(item)
  router.push(`/dish/${item.id}`)
}

const clearSearch = () => {
  searchQuery.value = ''
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
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