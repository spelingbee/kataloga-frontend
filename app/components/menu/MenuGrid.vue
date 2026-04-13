<template>
  <div class="menu-grid">
    <!-- Menu Items Grid with Lazy Loading -->
    <div 
      ref="gridContainer"
      :class="[
        'menu-grid__container',
        `menu-grid__container--cols-${columns}`
      ]"
    >
      <!-- Skeleton Loaders -->
      <template v-if="loading">
        <div
          v-for="n in skeletonCount"
          :key="`skeleton-${n}`"
          class="menu-grid__skeleton"
        >
          <div class="menu-grid__skeleton-image" />
          <div class="menu-grid__skeleton-content">
            <div class="menu-grid__skeleton-title" />
            <div class="menu-grid__skeleton-description" />
            <div class="menu-grid__skeleton-price" />
          </div>
        </div>
      </template>

      <!-- Menu Items -->
      <template v-else>
        <MenuItemCard
          v-for="(item, index) in visibleItems"
          :key="item.id"
          :menu-item="item"
          :show-popular-indicator="showPopularIndicator"
          :class="['menu-grid__item', `menu-grid__item--${index}`]"
          @click="handleItemClick(item)"
          @add-to-cart="handleAddToCart(item)"
          @toggle-favorite="handleToggleFavorite(item)"
        />
      </template>

      <!-- Empty State -->
      <div v-if="!loading && items.length === 0" class="menu-grid__empty">
        <div class="menu-grid__empty-icon">
          <BaseIcon name="search" size="xl" />
        </div>
        <h3 class="menu-grid__empty-title">
          {{ emptyTitle || $t('menu.noItemsFound') }}
        </h3>
        <p class="menu-grid__empty-message">
          {{ emptyMessage || $t('menu.tryAdjustingFilters') }}
        </p>
      </div>

      <!-- Load More Trigger (Intersection Observer) -->
      <div
        v-if="hasMore && !loading"
        ref="loadMoreTrigger"
        class="menu-grid__load-trigger"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { MenuItem } from '~/types'

interface Props {
  items: MenuItem[]
  columns?: 2 | 3 | 4
  loading?: boolean
  showPopularIndicator?: boolean
  emptyTitle?: string
  emptyMessage?: string
  skeletonCount?: number
  lazyLoadThreshold?: number
  initialLoadCount?: number
  loadMoreCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  columns: 3,
  loading: false,
  showPopularIndicator: true,
  skeletonCount: 9,
  lazyLoadThreshold: 0.5,
  initialLoadCount: 12,
  loadMoreCount: 12
})

const emit = defineEmits<{
  itemClick: [item: MenuItem]
  addToCart: [item: MenuItem]
  toggleFavorite: [item: MenuItem]
  loadMore: []
}>()

const { $i18n } = useNuxtApp()

// Refs
const gridContainer = ref<HTMLElement | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)
const loadedCount = ref(props.initialLoadCount)
const observer = ref<IntersectionObserver | null>(null)

// Computed
const visibleItems = computed(() => {
  return props.items.slice(0, loadedCount.value)
})

const hasMore = computed(() => {
  return loadedCount.value < props.items.length
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
  if (hasMore.value && !props.loading) {
    loadedCount.value += props.loadMoreCount
    emit('loadMore')
  }
}

const setupIntersectionObserver = () => {
  if (!import.meta.client || !loadMoreTrigger.value) return

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      })
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: props.lazyLoadThreshold
    }
  )

  observer.value.observe(loadMoreTrigger.value)
}

const cleanupObserver = () => {
  if (observer.value) {
    observer.value.disconnect()
    observer.value = null
  }
}

// Lifecycle
onMounted(() => {
  setupIntersectionObserver()
})

onUnmounted(() => {
  cleanupObserver()
})

// Watch for items change to reset loaded count
watch(() => props.items.length, () => {
  loadedCount.value = props.initialLoadCount
})
</script>

<style lang="scss" scoped>
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;

.menu-grid {
  width: 100%;
}

.menu-grid__container {
  display: grid;
  gap: $space-6;
  width: 100%;

  @media (max-width: 640px) {
    gap: $space-3;
  }

  &--cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &--cols-3 {
    grid-template-columns: repeat(3, 1fr);

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &--cols-4 {
    grid-template-columns: repeat(4, 1fr);

    @media (max-width: 1280px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

.menu-grid__item {
  animation: fadeInUp 0.4s ease-out backwards;

  @for $i from 1 through 12 {
    &--#{$i - 1} {
      animation-delay: #{$i * 0.05}s;
    }
  }
}

.menu-grid__skeleton {
  background: var(--bg-secondary);
  border-radius: $radius-lg;
  padding: $space-4;
  animation: pulse 1.5s ease-in-out infinite;
  border: 1px solid var(--border-primary);
}

.menu-grid__skeleton-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--bg-tertiary);
  border-radius: $radius-md;
  margin-bottom: $space-4;
}

.menu-grid__skeleton-content {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.menu-grid__skeleton-title {
  height: 1.25rem;
  background: var(--bg-tertiary);
  border-radius: $radius-sm;
  width: 70%;
}

.menu-grid__skeleton-description {
  height: 1rem;
  background: var(--bg-tertiary);
  border-radius: $radius-sm;
  width: 100%;
}

.menu-grid__skeleton-price {
  height: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: $radius-sm;
  width: 40%;
  margin-top: $space-2;
}

.menu-grid__empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-12;
  text-align: center;
}

.menu-grid__empty-icon {
  color: var(--text-tertiary);
  margin-bottom: $space-6;
  animation: float 3s ease-in-out infinite;
}

.menu-grid__empty-title {
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.menu-grid__empty-message {
  font-size: $text-base;
  color: var(--text-secondary);
  line-height: $leading-relaxed;
}

.menu-grid__load-trigger {
  grid-column: 1 / -1;
  height: 1px;
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

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .menu-grid__item {
    animation: none;
  }
  
  .menu-grid__empty-icon {
    animation: none;
  }
}
</style>
