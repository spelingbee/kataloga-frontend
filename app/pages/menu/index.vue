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
      <div class="menu-controls__search-row">
        <div class="menu-controls__search">
          <MenuSearch />
        </div>
        <BaseButton 
          variant="secondary" 
          class="menu-controls__search-button"
          @click="router.push('/menu/search')"
        >
          <BaseIcon name="search" size="sm" />
        </BaseButton>
      </div>
      
      <div class="menu-controls__filter-row">
        <BaseButton 
          variant="secondary" 
          class="menu-controls__filters-button"
          @click="showFilters = !showFilters"
        >
          <BaseIcon name="filter" size="sm" class="u-mr-2" />
          Filters
        </BaseButton>
      </div>

      <!-- Filters Panel -->
      <div v-if="showFilters" class="menu-controls__filters">
        <MenuFilters @close="showFilters = false" />
      </div>
    </section>

    <!-- Categories Section -->
    <section v-if="categories.length > 0" class="menu-categories">
      <div class="menu-categories__list">
        <button
          class="menu-categories__chip"
          :class="{ 'menu-categories__chip--active': activeCategory === 'all' || !activeCategory }"
          @click="onCategorySelected(null)"
        >
          All Items
          <span class="menu-categories__count">{{ filteredItems.length }}</span>
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          class="menu-categories__chip"
          :class="{ 'menu-categories__chip--active': activeCategory === category.id }"
          @click="onCategorySelected(category.id)"
        >
          {{ category.name }}
          <span class="menu-categories__count">{{ category.count || 0 }}</span>
        </button>
      </div>
    </section>

    <!-- Main Content -->
    <section class="menu-content">
      <!-- Category Title -->
      <div v-if="activeCategory" class="menu-category-header">
        <AppHeading level="h2" size="heading-xl" class="menu-category-header__title">
          {{ getCategoryName(activeCategory) }}
        </AppHeading>
        <AppText class="menu-category-header__count">
          {{ filteredItems.length > 0 ? `${filteredItems.length} items available` : 'No items available' }}
        </AppText>
      </div>

      <!-- Loading State -->
      <LoadingWrapper
        :is-loading="menuStore.loading"
        :error="menuStore.error"
        :is-empty="filteredItems.length === 0 && !menuStore.loading"
        :show-retry="true"
        skeleton
        skeleton-component="MenuGridSkeleton"
        empty-component="EmptyMenu"
        @retry="menuStore.fetchMenu()"
      >
        <!-- Menu Items -->
        <div class="menu-items">
          <MenuItemGrid 
            :items="filteredItems"
            @item-selected="onItemSelected"
            @add-to-cart="onAddToCart"
          />

          <!-- Pagination -->
          <BasePagination
            v-if="menuStore.pagination && menuStore.pagination.totalPages > 1"
            :pagination="menuStore.pagination"
            @page-change="onPageChange"
          />
        </div>
      </LoadingWrapper>
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
import type { MenuItemUI } from '~/types/ui'

// Stores
import { useMenuStore } from '~/stores/menu'
import { useCartStore } from '~/stores/cart'
import AppText from '../../components/base/AppText.vue'
import AppHeading from '../../components/base/AppHeading.vue'
import LoadingWrapper from '../../components/base/LoadingWrapper.vue'
import BasePagination from '../../components/base/BasePagination.vue'

// Page setup
definePageMeta({
  title: 'Menu - Menu Ordering App'
})

const menuStore = useMenuStore()
const cartStore = useCartStore()
const route = useRoute()
const router = useRouter()

// Reactive state
const showFilters = ref(false)
const activeCategory = ref<string | null>(null)

// Computed
const categories = computed(() => menuStore.categories)
const filteredItems = computed(() => {
  const items = menuStore.filteredItems
  return Array.isArray(items) ? items : []
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

const onItemSelected = (item: MenuItemUI) => {
  menuStore.setSelectedDish(item)
  router.push(`/dish/${item.id}`)
}

const onAddToCart = (item: MenuItemUI) => {
  // The MenuItemCard component already handles adding to cart
  // This is just for additional handling if needed
  console.log('Item added to cart:', item.name)
}

const getCategoryName = (categoryId: string | null) => {
  if (!categoryId || categoryId === 'all') return 'All Items'
  const category = categories.value.find(cat => cat.id === categoryId)
  return category?.name || 'Category'
}

const onPageChange = (page: number) => {
  // Update pagination and fetch new data
  menuStore.fetchMenuItems({ page })
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