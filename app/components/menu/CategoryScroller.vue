<template>
  <div class="category-scroller">
    <div class="category-scroller__container">
      <!-- Scroll Left Button -->
      <button
        v-if="showScrollButtons && canScrollLeft"
        class="category-scroller__scroll-btn category-scroller__scroll-btn--left"
        aria-label="Scroll left"
        @click="scrollLeft"
      >
        <BaseIcon name="chevron-left" size="sm" />
      </button>

      <!-- Categories Container -->
      <div
        ref="scrollContainer"
        class="category-scroller__scroll-container"
        @scroll="handleScroll"
      >
        <div class="category-scroller__items">
          <!-- All Categories Button -->
          <button
            :class="[
              'category-scroller__item',
              {
                'category-scroller__item--active': !activeCategory
              }
            ]"
            @click="selectCategory(null)"
          >
            <div class="category-scroller__item-icon">
              <BaseIcon name="grid" size="md" />
            </div>
            <span class="category-scroller__item-text">All</span>
          </button>

          <!-- Category Items -->
          <button
            v-for="category in categories"
            :key="category.id"
            :class="[
              'category-scroller__item',
              {
                'category-scroller__item--active': activeCategory === category.id
              }
            ]"
            @click="selectCategory(category.id)"
          >
            <div class="category-scroller__item-icon">
              <BaseIcon :name="category.icon || 'category'" size="md" />
            </div>
            <span class="category-scroller__item-text">{{ category.name }}</span>
            <span
              v-if="category.count !== undefined"
              class="category-scroller__item-count"
            >
              {{ category.count }}
            </span>
          </button>
        </div>
      </div>

      <!-- Scroll Right Button -->
      <button
        v-if="showScrollButtons && canScrollRight"
        class="category-scroller__scroll-btn category-scroller__scroll-btn--right"
        aria-label="Scroll right"
        @click="scrollRight"
      >
        <BaseIcon name="chevron-right" size="sm" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Category } from '~/types'

interface Props {
  categories: Category[]
  activeCategory?: string | null
  showScrollButtons?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  activeCategory: null,
  showScrollButtons: true
})

const emit = defineEmits<{
  categorySelect: [categoryId: string | null]
}>()

// Refs
const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Methods
const selectCategory = (categoryId: string | null) => {
  emit('categorySelect', categoryId)

  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
}

const scrollLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({
      left: -200,
      behavior: 'smooth'
    })
  }
}

const scrollRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({
      left: 200,
      behavior: 'smooth'
    })
  }
}

const handleScroll = () => {
  if (!scrollContainer.value) return

  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1
}

const checkScrollButtons = () => {
  handleScroll()
}

// Lifecycle
onMounted(() => {
  if (scrollContainer.value) {
    checkScrollButtons()
    window.addEventListener('resize', checkScrollButtons)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScrollButtons)
})
</script>

<style lang="scss" scoped>
@use '../../assets/scss/abstracts/variables' as *;

.category-scroller {
  width: 100%;
  position: relative;
}

.category-scroller__container {
  position: relative;
  display: flex;
  align-items: center;
}

.category-scroller__scroll-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  scroll-behavior: smooth;
}

.category-scroller__items {
  display: flex;
  gap: $space-4;
  padding: $space-2 0;
  min-width: min-content;
}

.category-scroller__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-4;
  background: var(--bg-primary);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $transition-base;
  white-space: nowrap;
  min-width: 80px;

  &:hover {
    background: var(--bg-tertiary);
    transform: translateY(-2px);
  }

  &--active {
    background: var(--color-success);
    border-color: var(--color-success);
    color: white;

    .category-scroller__item-icon {
      color: white;
    }

    .category-scroller__item-count {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }
}

.category-scroller__item-icon {
  color: var(--text-secondary);
  transition: color $transition-base;
}

.category-scroller__item-text {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: inherit;
}

.category-scroller__item-count {
  font-size: $text-xs;
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: $radius-full;
  color: var(--text-secondary);
  transition: all $transition-base;
}

.category-scroller__scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-full;
  cursor: pointer;
  transition: all $transition-base;
  box-shadow: $shadow-md;

  &:hover {
    background: var(--bg-tertiary);
    transform: translateY(-50%) scale(1.1);
  }

  &--left {
    left: 0;
  }

  &--right {
    right: 0;
  }

  @media (max-width: 768px) {
    display: none;
  }
}

// Touch device optimizations
@media (hover: none) and (pointer: coarse) {
  .category-scroller__item {
    &:hover {
      transform: none;
    }
  }

  .category-scroller__scroll-btn {
    &:hover {
      transform: translateY(-50%);
    }
  }
}
</style>
