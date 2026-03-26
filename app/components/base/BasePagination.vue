<template>
  <nav class="pagination" :aria-label="t('pagination.navigation')">
    <div class="pagination__info">
      <span class="pagination__text">
        {{ t('pagination.showing', { 
          start: startItem, 
          end: endItem, 
          total: pagination.totalItems 
        }) }}
      </span>
    </div>

    <div class="pagination__controls">
      <!-- Previous Button -->
      <button
        :disabled="!canGoPrevious"
        :class="[
          'pagination__button',
          'pagination__button--prev',
          { 'pagination__button--disabled': !canGoPrevious }
        ]"
        :aria-label="t('pagination.previous')"
        @click="goToPrevious"
      >
        <BaseIcon name="chevron-left" size="sm" />
        <span class="pagination__button-text">{{ t('pagination.previous') }}</span>
      </button>

      <!-- Page Numbers -->
      <div class="pagination__pages">
        <!-- First page -->
        <button
          v-if="showFirstPage"
          :class="[
            'pagination__page',
            { 'pagination__page--active': pagination.page === 1 }
          ]"
          :aria-label="t('pagination.goToPage', { page: 1 })"
          @click="goToPage(1)"
        >
          1
        </button>

        <!-- First ellipsis -->
        <span v-if="showFirstEllipsis" class="pagination__ellipsis">
          <BaseIcon name="more-horizontal" size="xs" />
        </span>

        <!-- Visible page numbers -->
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="[
            'pagination__page',
            { 'pagination__page--active': pagination.page === page }
          ]"
          :aria-label="t('pagination.goToPage', { page })"
          :aria-current="pagination.page === page ? 'page' : undefined"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>

        <!-- Last ellipsis -->
        <span v-if="showLastEllipsis" class="pagination__ellipsis">
          <BaseIcon name="more-horizontal" size="xs" />
        </span>

        <!-- Last page -->
        <button
          v-if="showLastPage"
          :class="[
            'pagination__page',
            { 'pagination__page--active': pagination.page === pagination.totalPages }
          ]"
          :aria-label="t('pagination.goToPage', { page: pagination.totalPages })"
          @click="goToPage(pagination.totalPages)"
        >
          {{ pagination.totalPages }}
        </button>
      </div>

      <!-- Next Button -->
      <button
        :disabled="!canGoNext"
        :class="[
          'pagination__button',
          'pagination__button--next',
          { 'pagination__button--disabled': !canGoNext }
        ]"
        :aria-label="t('pagination.next')"
        @click="goToNext"
      >
        <span class="pagination__button-text">{{ t('pagination.next') }}</span>
        <BaseIcon name="chevron-right" size="sm" />
      </button>
    </div>

    <!-- Page Size Selector (optional) -->
    <div v-if="showPageSize" class="pagination__page-size">
      <label class="pagination__page-size-label">
        {{ t('pagination.itemsPerPage') }}
        <BaseSelect
          :model-value="pagination.limit"
          :options="pageSizeOptions"
          size="sm"
          @update:model-value="val => changePageSize(Number(val))"
        />
      </label>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PaginationMeta } from '~/types'

const { t } = useI18n()

interface Props {
  pagination: PaginationMeta
  showPageSize?: boolean
  maxVisiblePages?: number
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  showPageSize: false,
  maxVisiblePages: 5,
  pageSizeOptions: () => [10, 20, 50, 100]
})

const emit = defineEmits<{
  pageChange: [page: number]
  pageSizeChange: [pageSize: number]
}>()

// Computed properties
const startItem = computed(() => {
  return (props.pagination.page - 1) * props.pagination.limit + 1
})

const endItem = computed(() => {
  const end = props.pagination.page * props.pagination.limit
  return Math.min(end, props.pagination.totalItems)
})

const canGoPrevious = computed(() => {
  return props.pagination.page > 1
})

const canGoNext = computed(() => {
  return props.pagination.page < props.pagination.totalPages
})

const visiblePages = computed(() => {
  const current = props.pagination.page
  const total = props.pagination.totalPages
  const maxVisible = props.maxVisiblePages
  
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - half)
  let end = Math.min(total, start + maxVisible - 1)
  
  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  // Don't show first/last page in visible pages if they're already shown separately
  if (start === 1) start = 2
  if (end === total) end = total - 1
  
  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const showFirstPage = computed(() => {
  return props.pagination.totalPages > 1 && !visiblePages.value.includes(1)
})

const showLastPage = computed(() => {
  return props.pagination.totalPages > 1 && !visiblePages.value.includes(props.pagination.totalPages)
})

const showFirstEllipsis = computed(() => {
  return showFirstPage.value && visiblePages.value.length > 0 && (visiblePages.value[0] ?? 0) > 2
})

const showLastEllipsis = computed(() => {
  return showLastPage.value && visiblePages.value.length > 0 && 
         (visiblePages.value[visiblePages.value.length - 1] ?? 0) < props.pagination.totalPages - 1
})

// Methods
const goToPage = (page: number) => {
  if (page >= 1 && page <= props.pagination.totalPages && page !== props.pagination.page) {
    emit('pageChange', page)
  }
}

const goToPrevious = () => {
  if (canGoPrevious.value) {
    goToPage(props.pagination.page - 1)
  }
}

const goToNext = () => {
  if (canGoNext.value) {
    goToPage(props.pagination.page + 1)
  }
}

const changePageSize = (newSize: number) => {
  emit('pageSizeChange', newSize)
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      goToPrevious()
      break
    case 'ArrowRight':
      event.preventDefault()
      goToNext()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/transitions' as *;

.pagination {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  align-items: center;
  padding: $space-6 0;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }
}

.pagination__info {
  order: 2;

  @media (min-width: 768px) {
    order: 1;
  }
}

.pagination__text {
  font-size: $text-sm;
  color: var(--text-secondary);
}

.pagination__controls {
  display: flex;
  align-items: center;
  gap: $space-2;
  order: 1;

  @media (min-width: 768px) {
    order: 2;
  }
}

.pagination__button {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  color: var(--text-primary);
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-base;

  &:hover:not(.pagination__button--disabled) {
    background: var(--bg-secondary);
    border-color: var(--border-secondary);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination__button-text {
  @media (max-width: 640px) {
    display: none;
  }
}

.pagination__pages {
  display: flex;
  align-items: center;
  gap: $space-1;
}

.pagination__page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  color: var(--text-primary);
  font-size: $text-sm;
  font-weight: $font-medium;
  cursor: pointer;
  transition: all $transition-base;

  &:hover:not(.pagination__page--active) {
    background: var(--bg-secondary);
    border-color: var(--border-secondary);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  &--active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }
}

.pagination__ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--text-tertiary);
}

.pagination__page-size {
  order: 3;
  display: flex;
  align-items: center;
  gap: $space-2;

  @media (min-width: 768px) {
    order: 3;
  }
}

.pagination__page-size-label {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-sm;
  color: var(--text-secondary);
}

// Responsive adjustments
@media (max-width: 640px) {
  .pagination__pages {
    gap: 2px;
  }

  .pagination__page,
  .pagination__ellipsis {
    width: 32px;
    height: 32px;
    font-size: $text-xs;
  }

  .pagination__button {
    padding: $space-2;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .pagination__button,
  .pagination__page {
    transition: none;
  }
}
</style>