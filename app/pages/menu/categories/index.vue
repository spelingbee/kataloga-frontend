<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <AppHeading level="h1" size="display-md" class="text-white mb-4">
        All Categories
      </AppHeading>
      <AppText size="body-lg" class="text-neutral-20">
        Browse our menu by category to find exactly what you're craving
      </AppText>
    </div>

    <!-- Search Bar -->
    <div class="px-6 mb-8">
      <div class="max-w-md">
        <BaseInput
          v-model="searchQuery"
          placeholder="Search categories..."
          class="w-full"
        >
          <template #prefix>
            <BaseIcon name="search" size="sm" class="text-neutral-80" />
          </template>
        </BaseInput>
      </div>
    </div>

    <!-- Categories Grid -->
    <div class="px-6">
      <!-- Loading State -->
      <div v-if="menuStore.loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"/>
        <AppText class="text-neutral-20">Loading categories...</AppText>
      </div>

      <!-- Error State -->
      <div v-else-if="menuStore.error" class="text-center py-12">
        <BaseIcon name="alert-circle" size="xl" class="text-primary-red mx-auto mb-4" />
        <AppText class="text-white mb-4">{{ menuStore.error }}</AppText>
        <BaseButton @click="menuStore.fetchMenu()">
          Try Again
        </BaseButton>
      </div>

      <!-- Categories Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <NuxtLink
          v-for="category in filteredCategories"
          :key="category.id"
          :to="`/menu/categories/${category.id}`"
          class="group"
        >
          <BaseCard class="p-6 text-center bg-background-card hover:bg-background-card/80 transition-all duration-300 group-hover:scale-105">
            <!-- Category Icon -->
            <div class="mb-4">
              <CategoryIcon 
                :category="category.id" 
                size="xl"
                class="mx-auto group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            <!-- Category Info -->
            <AppHeading 
              level="h3" 
              size="heading-md" 
              class="text-white mb-2 group-hover:text-primary-green transition-colors"
            >
              {{ category.name }}
            </AppHeading>
            
            <AppText size="body-sm" class="text-neutral-20 mb-3">
              {{ category.description || `Delicious ${category.name.toLowerCase()} dishes` }}
            </AppText>

            <!-- Item Count -->
            <div class="flex items-center justify-center gap-2">
              <BaseIcon name="utensils" size="sm" class="text-primary-orange" />
              <AppText size="caption" class="text-neutral-20">
                {{ category.count || 0 }} items
              </AppText>
            </div>

            <!-- Popular Badge -->
            <div v-if="isPopularCategory(category.id)" class="mt-3">
              <BaseBadge variant="success" size="sm">
                <FireIcon size="xs" class="mr-1" />
                Popular
              </BaseBadge>
            </div>
          </BaseCard>
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <div v-if="filteredCategories.length === 0 && !menuStore.loading" class="text-center py-16">
        <BaseIcon name="search" size="4xl" class="text-neutral-80 mx-auto mb-6" />
        <AppHeading level="h3" size="heading-lg" class="text-white mb-4">
          No categories found
        </AppHeading>
        <AppText class="text-neutral-20 mb-8 max-w-md mx-auto">
          We couldn't find any categories matching your search. Try a different term or browse all categories.
        </AppText>
        <BaseButton 
          variant="secondary"
          @click="clearSearch"
        >
          Clear Search
        </BaseButton>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="px-6 py-12 mt-12 border-t border-neutral-80/20">
      <div class="text-center mb-8">
        <AppHeading level="h2" size="heading-xl" class="text-white mb-4">
          Quick Actions
        </AppHeading>
        <AppText class="text-neutral-20">
          Jump to popular sections or explore more options
        </AppText>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink to="/menu">
          <BaseButton variant="primary">
            <BaseIcon name="grid" size="sm" class="mr-2" />
            View Full Menu
          </BaseButton>
        </NuxtLink>
        <NuxtLink to="/favourites">
          <BaseButton variant="secondary">
            <BaseIcon name="heart" size="sm" class="mr-2" />
            My Favourites
          </BaseButton>
        </NuxtLink>
        <NuxtLink to="/menu/search">
          <BaseButton variant="ghost">
            <BaseIcon name="search" size="sm" class="mr-2" />
            Advanced Search
          </BaseButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '~/types'

// Stores
import { useMenuStore } from '~/stores/menu'

// Page setup
definePageMeta({
  title: 'Categories - Menu Ordering App'
})

const menuStore = useMenuStore()

// Reactive state
const searchQuery = ref('')

// Sample categories data - will be replaced with real data from API
const categories = ref<Category[]>([
  { 
    id: 'all', 
    name: 'All Items', 
    description: 'Browse our complete menu',
    icon: '🍔', 
    count: 48,
    sortOrder: 0
  },
  { 
    id: 'salads', 
    name: 'Fresh Salads', 
    description: 'Healthy and nutritious salads',
    icon: '🥗', 
    count: 12,
    sortOrder: 1
  },
  { 
    id: 'main-dishes', 
    name: 'Main Dishes', 
    description: 'Hearty and satisfying meals',
    icon: '🍽️', 
    count: 18,
    sortOrder: 2
  },
  { 
    id: 'meat', 
    name: 'Meat Dishes', 
    description: 'Premium meat selections',
    icon: '🥩', 
    count: 15,
    sortOrder: 3
  },
  { 
    id: 'fastfood', 
    name: 'Fast Food', 
    description: 'Quick and delicious options',
    icon: '🍟', 
    count: 20,
    sortOrder: 4
  },
  { 
    id: 'desserts', 
    name: 'Sweet Desserts', 
    description: 'Indulgent treats and sweets',
    icon: '🧁', 
    count: 8,
    sortOrder: 5
  },
  { 
    id: 'drinks', 
    name: 'Beverages', 
    description: 'Refreshing drinks and cocktails',
    icon: '🥤', 
    count: 16,
    sortOrder: 6
  },
  { 
    id: 'appetizers', 
    name: 'Appetizers', 
    description: 'Perfect starters for your meal',
    icon: '🥨', 
    count: 10,
    sortOrder: 7
  },
  { 
    id: 'soups', 
    name: 'Soups', 
    description: 'Warm and comforting soups',
    icon: '🍲', 
    count: 6,
    sortOrder: 8
  },
  { 
    id: 'pizza', 
    name: 'Pizza', 
    description: 'Authentic wood-fired pizzas',
    icon: '🍕', 
    count: 12,
    sortOrder: 9
  }
])

// Popular categories (based on order frequency)
const popularCategories = ['fastfood', 'main-dishes', 'pizza', 'drinks']

// Computed
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return categories.value.sort((a, b) => a.sortOrder - b.sortOrder)
  }
  
  const query = searchQuery.value.toLowerCase()
  return categories.value
    .filter(category => 
      category.name.toLowerCase().includes(query) ||
      (category.description && category.description.toLowerCase().includes(query))
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

// Methods
const isPopularCategory = (categoryId: string) => {
  return popularCategories.includes(categoryId)
}

const clearSearch = () => {
  searchQuery.value = ''
}

// Initialize
onMounted(() => {
  menuStore.fetchMenu()
})
</script>