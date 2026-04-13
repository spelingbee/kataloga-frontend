<template>
  <div class="loading-wrapper" :class="wrapperClasses">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <component 
        :is="skeletonComponent" 
        v-if="skeleton && !isInitialLoading"
        v-bind="skeletonProps"
      />
      <BaseLoader 
        v-else
        :variant="loaderVariant"
        :size="loaderSize"
        :text="loadingText || $t('common.loading')"
        :color="loaderColor"
      />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <ErrorMessage
        :error="error"
        :show-retry="showRetry"
        :show-dismiss="showDismiss"
        :retrying="retrying"
        @retry="$emit('retry')"
        @dismiss="$emit('dismiss')"
      />
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="empty-state">
      <component 
        :is="emptyComponent"
        v-bind="emptyProps"
        @retry="$emit('retry')"
        @browse="$emit('browse')"
        @explore="$emit('explore')"
        @start-ordering="$emit('start-ordering')"
      />
    </div>

    <!-- Content -->
    <div v-else class="content-state">
      <slot />
    </div>

    <!-- Overlay Loading (for refresh states) -->
    <div v-if="isRefreshing" class="refresh-overlay">
      <BaseLoader
        variant="spinner"
        size="sm"
        color="primary"
        :text="$t('common.refreshing')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { ApiError } from '~/types'
import ErrorMessage from './ErrorMessage.vue'

interface Props {
  isLoading?: boolean
  isInitialLoading?: boolean
  isRefreshing?: boolean
  error?: ApiError | Error | null
  isEmpty?: boolean
  retrying?: boolean
  
  // Loader props
  loaderVariant?: 'spinner' | 'dots' | 'pulse' | 'bar'
  loaderSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loaderColor?: 'primary' | 'secondary' | 'accent' | 'neutral'
  loadingText?: string
  
  // Skeleton props
  skeleton?: boolean
  skeletonComponent?: Component | string
  skeletonProps?: Record<string, any>
  
  // Empty state props
  emptyComponent?: Component | string
  emptyProps?: Record<string, any>
  
  // Error handling
  showRetry?: boolean
  showDismiss?: boolean
  
  // Styling
  minHeight?: string
  fullHeight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isInitialLoading: false,
  isRefreshing: false,
  isEmpty: false,
  retrying: false,
  loaderVariant: 'spinner',
  loaderSize: 'md',
  loaderColor: 'primary',
  skeleton: false,
  skeletonComponent: 'BaseLoader',
  showRetry: true,
  showDismiss: false,
  emptyComponent: 'EmptyState',
  fullHeight: false,
})

defineEmits<{
  retry: []
  dismiss: []
  browse: []
  explore: []
  'start-ordering': []
}>()

const { $i18n } = useNuxtApp()

const wrapperClasses = computed(() => [
  {
    'loading-wrapper--full-height': props.fullHeight,
    'loading-wrapper--relative': props.isRefreshing,
  }
])

const wrapperStyle = computed(() => ({
  minHeight: props.minHeight || (props.fullHeight ? '100vh' : '200px'),
}))
</script>

<style scoped>
.loading-wrapper {
  position: relative;
}

.loading-wrapper--full-height {
  min-height: 100vh;
}

.loading-wrapper--relative {
  position: relative;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  min-height: inherit;
}

.content-state {
  position: relative;
}

.refresh-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
}

/* Dark theme support */
.dark .refresh-overlay {
  background-color: rgba(128, 128, 128, 0.6);
}
</style>
