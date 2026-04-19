<template>
  <div class="menu-page">
    <!-- Header Section -->
    <section class="menu-header">
      <AppHeading level="h1" size="display-md" class="menu-header__title">
        {{ $t('menu.fullMenu') }}
      </AppHeading>
      <AppText size="body-lg" class="menu-header__subtitle">
        {{ $t('menu.browseSubtitle') }}
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
          @click="$router.push(tPath('/menu/search'))"
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
          {{ $t('menu.filters') }}
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
          v-for="category in categories"
          :key="category.id"
          class="menu-categories__chip"
          :class="{ 'menu-categories__chip--active': activeCategory === category.id }"
          @click="onCategorySelected(category.id)"
        >
          {{ category.name }}
          <span class="menu-categories__count">{{ category.count || 0 }}</span>
        </button>
        <button
          class="menu-categories__chip"
          :class="{ 'menu-categories__chip--active': activeCategory === 'all' || !activeCategory }"
          @click="onCategorySelected(null)"
        >
          {{ $t('menu.allItems') }}
          <span class="menu-categories__count">{{ filteredItems.length }}</span>
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
          {{
            filteredItems.length > 0
              ? $t('menu.itemsAvailable', { count: filteredItems.length })
              : $t('menu.noItemsAvailable')
          }}
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

    <!-- Debug Actions (Development Only) -->
    <section
      v-if="$config.public.NODE_ENV === 'development'"
      class="menu-debug"
      style="background: #333; padding: 1rem; margin: 1rem 0; border-radius: 8px"
    >
      <h3 style="color: white; margin-bottom: 1rem">🔧 Debug Tools</h3>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap">
        <BaseButton variant="primary" @click="testApiConnection">🌐 Test API Connection</BaseButton>
        <BaseButton variant="secondary" @click="testTenantConfig">🏢 Test Tenant Config</BaseButton>
        <BaseButton variant="secondary" @click="manualFetchMenu">🍽️ Manual Fetch Menu</BaseButton>
        <BaseButton variant="secondary" @click="clearCache">🗑️ Clear Cache</BaseButton>
      </div>
      <div style="margin-top: 1rem; color: white; font-size: 0.875rem">
        <div>Loading: {{ menuStore.loading }}</div>
        <div>Error: {{ menuStore.error }}</div>
        <div>Categories: {{ categories.length }}</div>
        <div>Items: {{ filteredItems.length }}</div>
      </div>
    </section>

    <section class="menu-actions">
      <div class="menu-actions__content">
        <NuxtLink :to="tPath('/favourites')">
          <BaseButton variant="secondary">
            <BaseIcon name="heart" size="sm" class="u-mr-2" />
            {{ $t('favorites.viewAll') }}
          </BaseButton>
        </NuxtLink>
        <NuxtLink :to="tPath('/orders')">
          <BaseButton variant="secondary">
            <BaseIcon name="receipt" size="sm" class="u-mr-2" />
            {{ $t('orders.history') }}
          </BaseButton>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'

// Stores
import { useMenuStore } from '~/stores/menu'
import AppText from '../../components/base/AppText.vue'
import AppHeading from '../../components/base/AppHeading.vue'
import LoadingWrapper from '../../components/base/LoadingWrapper.vue'
import BasePagination from '../../components/base/BasePagination.vue'
import { useI18n } from 'vue-i18n'
import { useTenant } from '~/composables/useTenant'

const { t } = useI18n()

// Page setup
definePageMeta({
  title: 'Menu - Menu Ordering App',
})

const menuStore = useMenuStore()
const route = useRoute()
const router = useRouter()
const { tPath } = useTenant()

// Reactive state
const showFilters = ref(false)
const activeCategory = ref<string | null>(null)

// Computed
const categories = computed(() => menuStore.categories)
const filteredItems = computed(() => {
  const items = menuStore.filteredMenuItems
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

const onItemSelected = (item: MenuItem) => {
  menuStore.setSelectedDish(item)
  router.push(tPath(`/dish/${item.id}`))
}

const onAddToCart = (item: MenuItem) => {
  // The MenuItemCard component already handles adding to cart
  // This is just for additional handling if needed
  console.log('Item added to cart:', item.name)
}

const getCategoryName = (categoryId: string | null) => {
  if (!categoryId || categoryId === 'all') return t('menu.allItems')
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

// Debug methods
const testApiConnection = async () => {
  console.log('🧪 Testing API Connection...')
  try {
    const response = await fetch('http://localhost:3001/health')
    const text = await response.text()
    console.log('✅ Health Check:', response.status, text)
    alert(`Health Check: ${response.status} - ${text}`)
  } catch (error) {
    console.error('❌ Health Check Failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    alert(`Health Check Failed: ${errorMessage}`)
  }
}

const testTenantConfig = () => {
  console.log('🧪 Testing Tenant Config...')
  const config = useRuntimeConfig()
  console.log('🔧 Runtime Config:', config.public)
  alert(`Tenant Slug: ${config.public.tenantSlug}\nAPI Base URL: ${config.public.apiBaseUrl}`)
}

const manualFetchMenu = async () => {
  console.log('🧪 Manual Fetch Menu...')
  try {
    await menuStore.fetchMenu()
    alert('Manual fetch completed! Check console for details.')
  } catch (error) {
    console.error('❌ Manual fetch failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    alert(`Manual fetch failed: ${errorMessage}`)
  }
}

const clearCache = () => {
  console.log('🧪 Clearing Cache...')
  localStorage.clear()
  if ('indexedDB' in window) {
    indexedDB.deleteDatabase('MenuAppDB')
  }
  alert('Cache cleared! Refresh the page.')
}

// Initialize
onMounted(async () => {
  console.log('🎯 Menu Page - onMounted called')

  // Set initial category from query params
  const categoryFromQuery = route.query.category as string
  console.log('📋 Menu Page - Category from query:', categoryFromQuery)

  if (categoryFromQuery) {
    activeCategory.value = categoryFromQuery
    menuStore.setCurrentCategory(categoryFromQuery)
  } else {
    activeCategory.value = 'all'
    menuStore.setCurrentCategory(null)
  }

  console.log('🏪 Menu Page - Active category set to:', activeCategory.value)

  // Fetch menu data
  console.log('🚀 Menu Page - Starting fetchMenu...')
  try {
    await menuStore.fetchMenu()
    console.log('✅ Menu Page - fetchMenu completed successfully')
  } catch (error) {
    console.error('❌ Menu Page - fetchMenu failed:', error)
    // Error is handled by the store
  }
})

// Watch for route changes
watch(
  () => route.query.category,
  newCategory => {
    if (newCategory && typeof newCategory === 'string') {
      activeCategory.value = newCategory
      menuStore.setCurrentCategory(newCategory === 'all' ? null : newCategory)
    }
  }
)
</script>
