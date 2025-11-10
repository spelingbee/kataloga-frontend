<template>
  <div class="menu-page">
    <!-- Header Section -->
    <section class="menu-header">
      <AppHeading level="h1" size="display-md" class="menu-header__title">
        Full Menu
      </AppHeading>
      <AppText size="body-lg" class="menu-header__subtitle">
        Browse all our delicious dishes by category
      </AppText>
    </section>

    <!-- Search and Filters -->
    <section class="menu-controls">
      <div class="menu-controls__row">
        <div class="menu-controls__search">
          <MenuSearch />
        </div>
        <div class="menu-controls__actions">
          <BaseButton 
            variant="secondary" 
            @click="showFilters = !showFilters"
            class="u-whitespace-nowrap"
          >
            <BaseIcon name="filter" size="sm" class="u-mr-2" />
            Filters
          </BaseButton>
          <NuxtLink to="/menu/search">
            <BaseButton variant="ghost">
              <BaseIcon name="search" size="sm" />
            </BaseButton>
          </NuxtLink>
        </div>
      </div>

      <!-- Filters Panel -->
      <div v-if="showFilters" class="menu-controls__filters">
        <MenuFilters @close="showFilters = false" />
      </div>
    </section>

    <!-- Main Content -->
    <section class="menu-content">
      <!-- Categories Sidebar -->
      <aside class="menu-sidebar">
        <CategorySidebar 
          :categories="categories"
          :active-category="activeCategory"
          @category-selected="onCategorySelected"
        />
      </aside>

      <!-- Menu Items Grid -->
      <main class="menu-main">
        <!-- Category Title -->
        <div v-if="activeCategory" class="menu-category-header">
          <AppHeading level="h2" size="heading-xl" class="menu-category-header__title">
            {{ getCategoryName(activeCategory) }}
          </AppHeading>
          <AppText class="menu-category-header__count">
            {{ filteredItems.length }} items available
          </AppText>
        </div>

        <!-- Loading State -->
        <div v-if="menuStore.loading" class="menu-state menu-state--loading">
          <div class="menu-loading-spinner"></div>
          <AppText class="menu-state__text">Loading menu...</AppText>
        </div>

        <!-- Error State -->
        <div v-else-if="menuStore.error" class="menu-state menu-state--error">
          <BaseIcon name="alert-circle" size="xl" class="menu-state__icon u-text-primary-red" />
          <AppText class="menu-state__title">{{ menuStore.error }}</AppText>
          <BaseButton @click="menuStore.fetchMenu()">
            Try Again
          </BaseButton>
        </div>

        <!-- Menu Items -->
        <div v-else class="menu-items">
          <MenuItemGrid 
            :items="filteredItems"
            @item-selected="onItemSelected"
          />

          <!-- Empty State -->
          <div v-if="filteredItems.length === 0" class="menu-state menu-state--empty">
            <BaseIcon name="search" size="xl" class="menu-state__icon u-text-neutral-80" />
            <AppText class="menu-state__title">No items found</AppText>
            <AppText class="menu-state__text">
              Try adjusting your search or filters
            </AppText>
            <BaseButton 
              variant="secondary" 
              class="u-mt-4"
              @click="clearFilters"
            >
              Clear Filters
            </BaseButton>
          </div>
        </div>
      </main>
    </section>

    <!-- Quick Actions -->
    <section class="menu-actions">
      <div class="menu-actions__content">
        <NuxtLink to="/favourites">
          <BaseButton variant="secondary">
            <BaseIcon name="heart" size="sm" class="u-mr-2" />
            View Favourites
          </BaseButton>
        </NuxtLink>
        <NuxtLink to="/orders">
          <BaseButton variant="secondary">
            <BaseIcon name="receipt" size="sm" class="u-mr-2" />
            Order History
          </BaseButton>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'

// Page setup
definePageMeta({
  title: 'Menu - Menu Ordering App'
})

// Stores
import { useMenuStore } from '~/stores/menu'

const menuStore = useMenuStore()
const route = useRoute()
const router = useRouter()

// Reactive state
const showFilters = ref(false)
const activeCategory = ref<string | null>(null)

// Computed
const categories = computed(() => menuStore.categories)
const filteredItems = computed(() => {
  return menuStore.filteredItems
})

// Methods
const onCategorySelected = (categoryId: string | null) => {
  activeCategory.value = categoryId
  menuStore.setCurrentCategory(categoryId)
  
  // Update URL without navigation
  if (categoryId && categoryId !== 'all') {
    router.replace({ query: { category: categoryId } })
  } else {
    router.replace({ query: {} })
  }
}

const onItemSelected = (item: MenuItem) => {
  menuStore.setSelectedDish(item)
  router.push(`/dish/${item.id}`)
}

const getCategoryName = (categoryId: string | null) => {
  if (!categoryId || categoryId === 'all') return 'All Items'
  const category = categories.find(cat => cat.id === categoryId)
  return category?.name || 'Category'
}

const clearFilters = () => {
  menuStore.clearFilters()
  showFilters.value = false
}

// Initialize
onMounted(async () => {
  // Set initial category from query params
  const categoryFromQuery = route.query.category as string
  if (categoryFromQuery) {
    activeCategory.value = categoryFromQuery
    menuStore.setCurrentCategory(categoryFromQuery)
  } else {
    activeCategory.value = 'all'
    menuStore.setCurrentCategory(null)
  }
  
  // Fetch menu data
  try {
    await menuStore.fetchMenu()
  } catch (error) {
    console.error('Failed to fetch menu:', error)
    // Error is handled by the store
  }
})

// Watch for route changes
watch(() => route.query.category, (newCategory) => {
  if (newCategory && typeof newCategory === 'string') {
    activeCategory.value = newCategory
    menuStore.setCurrentCategory(newCategory === 'all' ? null : newCategory)
  }
})
</script>