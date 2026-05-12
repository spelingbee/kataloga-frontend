<template>
  <div class="home-page">
    <!-- Hero Section -->
    <header class="home-hero">
      <div v-if="tenantStore.isLoading" class="home-hero__skeleton">
        <div class="skeleton-pulse skeleton-pulse--title" />
        <div class="skeleton-pulse skeleton-pulse--subtitle" />
      </div>

      <template v-else>
        <!-- Logo removed to avoid duplication with header -->
        <h1 class="home-hero__title">
          {{ tenantStore.tenantName || catalogLabel }}
        </h1>
        <p v-if="tenantStore.tenantBranding?.description" class="home-hero__subtitle">
          {{ tenantStore.tenantBranding.description }}
        </p>
      </template>
    </header>

    <!-- Categories Navigation -->
    <nav class="home-categories-nav">
      <div class="home-categories-nav__scroll">
        <button
          class="category-pill"
          :class="{ 'category-pill--active': !selectedCategoryId }"
          @click="selectCategory(null)"
        >
          {{ $t('common.all') }}
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          class="category-pill"
          :class="{ 'category-pill--active': selectedCategoryId === category.id }"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
          <span v-if="category.count" class="category-pill__count">{{ category.count }}</span>
        </button>
      </div>
    </nav>

    <!-- Menu Grid -->
    <main class="home-menu">
      <div class="home-menu__header">
        <h2 class="home-menu__title">
          {{ selectedCategoryName }}
          <span class="home-menu__count">
            {{ displayItems.length }} {{ pluralizeItems(displayItems.length) }}
          </span>
        </h2>
      </div>

      <!-- Loading/Error States -->
      <div v-if="menuStore.loading && displayItems.length === 0" class="home-menu__state">
        <div class="spinner" />
        <p>{{ $t('common.loading') }}</p>
      </div>

      <div
        v-else-if="menuStore.error && displayItems.length === 0"
        class="home-menu__state home-menu__state--error"
      >
        <BaseIcon name="alert-circle" size="xl" />
        <p>{{ menuStore.error }}</p>
        <BaseButton @click="menuStore.fetchMenu()">
          {{ $t('common.retry') }}
        </BaseButton>
      </div>

      <!-- The Grid -->
      <MenuItemGrid v-else :items="displayItems" @item-selected="onItemSelected" />

      <!-- Empty State -->
      <div v-if="!menuStore.loading && displayItems.length === 0" class="home-menu__state">
        <BaseIcon name="search" size="xl" />
        <h3>{{ $t('common.not_found') }}</h3>
        <p>{{ $t('common.try_another_filter') }}</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMenuStore } from '~/stores/menu'
import { useTenantStore } from '~/stores/tenant'
import { useTenant } from '~/composables/useTenant'
import { useTerminology } from '~/composables/useTerminology'
import { resolveImageUrl } from '~/utils/image-optimization'

definePageMeta({
  title: 'Home',
})

const menuStore = useMenuStore()
const tenantStore = useTenantStore()
const router = useRouter()
const { tPath } = useTenant()
const { catalogLabel, itemsLabel, isFoodBusiness } = useTerminology()

/**
 * Правильное склонение для русского языка:
 * 1 блюдо / 2 блюда / 5 блюд
 * 1 товар / 2 товара / 5 товаров
 */
const pluralizeItems = (count: number): string => {
  const food = isFoodBusiness.value
  const mod10 = count % 10
  const mod100 = count % 100

  if (food) {
    if (mod10 === 1 && mod100 !== 11) return 'блюдо'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'блюда'
    return 'блюд'
  } else {
    if (mod10 === 1 && mod100 !== 11) return 'товар'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'товара'
    return 'товаров'
  }
}

// UI State
const selectedCategoryId = ref<string | null>(null)

// Computed
const categories = computed(() => menuStore.categories)
const items = computed(() => menuStore.menuItems)

const displayItems = computed(() => {
  if (!selectedCategoryId.value) return items.value
  return items.value.filter(item => item.categoryId === selectedCategoryId.value)
})

const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return catalogLabel.value
  return categories.value.find(c => c.id === selectedCategoryId.value)?.name || $t('terminology.category')
})

// Methods
const selectCategory = (id: string | null) => {
  selectedCategoryId.value = id
}

const onItemSelected = (item: any) => {
  router.push(tPath(`/dish/${item.id}`))
}

onMounted(async () => {
  // Wait for tenant to be loaded before fetching menu to avoid redundant data
  if (tenantStore.isTenantLoaded) {
    if (menuStore.menuItems.length === 0) {
      await menuStore.fetchMenu()
    }
  } else {
    // Watch for tenant load
    const unwatch = watch(() => tenantStore.isTenantLoaded, async (loaded) => {
      if (loaded) {
        if (menuStore.menuItems.length === 0) {
          await menuStore.fetchMenu()
        }
        unwatch()
      }
    })
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/tokens/colors' as *;
@use '~/assets/scss/tokens/spacing' as *;
@use '~/assets/scss/tokens/typography' as *;
@use '~/assets/scss/tokens/radius' as *;
@use '~/assets/scss/tokens/shadows' as *;
@use '~/assets/scss/tokens/transitions' as *;

.home-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.home-hero {
  padding: $space-2 $space-4 $space-1;
  text-align: center;
}

.home-hero__logo {
  height: 64px;
  width: auto;
  margin-bottom: $space-4;
}

.home-hero__title {
  font-size: $text-2xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  margin-bottom: $space-1;
  line-height: $leading-tight;
}

.home-hero__subtitle {
  font-size: $text-sm;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
  max-width: 480px;
  margin: 0 auto $space-1;
}

.home-categories-nav {
  position: sticky;
  top: 56px;
  z-index: 100;
  background: rgba(var(--bg-primary-rgb), 0.8);
  backdrop-filter: blur(12px);
  padding: $space-4 0; // Increased vertical padding to prevent shadow clipping
  border-bottom: 1px solid var(--border-primary);
}

.home-categories-nav__scroll {
  display: flex;
  overflow-x: auto;
  gap: $space-3;
  padding: $space-2 $space-8; // Even more horizontal padding
  scrollbar-width: none;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  &::after {
    content: '';
    padding-right: $space-8;
  }
}

.category-pill {
  flex-shrink: 0;
  scroll-snap-align: start;
  white-space: nowrap;
  padding: $space-2 $space-4;
  border-radius: $radius-full;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  font-size: $text-sm;
  font-weight: $font-semibold;
  cursor: pointer;
  transition: all $transition-base;
  display: flex;
  align-items: center;
  gap: $space-2;

  &:hover {
    border-color: var(--color-primary);
    background: var(--bg-tertiary);
  }

  &--active {
    background: var(--color-primary) !important;
    border-color: var(--color-primary);
    color: white !important;
    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.2); // Softer shadow
    transform: translateY(-1px); // Subtle lift

    .category-pill__count {
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.category-pill__count {
  font-size: 10px;
  background: var(--bg-tertiary);
  padding: 1px 5px;
  border-radius: $radius-sm;
}

.home-menu {
  padding: $space-6 $space-4 $space-24;
}

.home-menu__header {
  margin-bottom: $space-6;
}

.home-menu__title {
  font-size: $text-xl;
  font-weight: $font-bold;
  color: var(--text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.home-menu__count {
  font-size: $text-sm;
  font-weight: $font-regular;
  color: var(--text-secondary);
}

.home-menu__state {
  padding: $space-20 0;
  text-align: center;
  color: var(--text-secondary);

  &--error {
    color: var(--color-error);
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bg-secondary);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto $space-4;
}

.skeleton-pulse {
  background: var(--bg-secondary);
  border-radius: $radius-md;
  animation: pulse 1.5s ease-in-out infinite;

  &--title {
    height: 32px;
    width: 60%;
    margin: 0 auto $space-4;
  }
  &--subtitle {
    height: 16px;
    width: 80%;
    margin: 0 auto;
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .home-hero {
    padding: $space-2 $space-4 $space-1;
  }
  .home-hero__title {
    font-size: $text-xl;
  }
}
</style>
