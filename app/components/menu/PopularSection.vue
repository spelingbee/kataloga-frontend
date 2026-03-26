<template>
  <section class="w-full">
    <!-- Section Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <FireIcon size="lg" :animated="true" />
        <div>
          <AppHeading level="h2" size="heading-xl" class="text-white">
            For You
          </AppHeading>
          <AppText size="body-md" class="text-neutral-80">
            Popular dishes you might like
          </AppText>
        </div>
      </div>
      
      <!-- View All Button -->
      <BaseButton
        v-if="showViewAll"
        variant="ghost"
        class="text-primary-green hover:text-primary-green/80"
        @click="$emit('viewAll')"
      >
        View All
        <BaseIcon name="chevron-right" size="sm" class="ml-1" />
      </BaseButton>
    </div>
    
    <!-- Popular Items Grid -->
    <MenuItemGrid
      :items="popularItems"
      :columns="gridColumns"
      :loading="loading"
      :show-header="false"
      :show-popular-indicator="true"
      :max-items="maxItems"
      :show-view-all="false"
      :empty-title="'No popular items'"
      :empty-message="'Check back later for trending dishes'"
      @item-click="handleItemClick"
      @add-to-cart="handleAddToCart"
      @toggle-favorite="handleToggleFavorite"
    />
    
    <!-- Refresh Button -->
    <div v-if="showRefresh && !loading" class="text-center mt-6">
      <BaseButton
        variant="ghost"
        class="text-neutral-80 hover:text-white"
        @click="refreshRecommendations"
      >
        <BaseIcon name="refresh" size="sm" class="mr-2" />
        Refresh Recommendations
      </BaseButton>
    </div>
    
    <!-- Personalization Notice -->
    <div v-if="showPersonalizationNotice" class="mt-6 p-4 bg-background-card/50 rounded-lg border border-border-subtle">
      <div class="flex items-start space-x-3">
        <BaseIcon name="info" size="sm" class="text-primary-orange mt-0.5 flex-shrink-0" />
        <div>
          <AppText size="body-sm" class="text-neutral-20 mb-1">
            Personalized Recommendations
          </AppText>
          <AppText size="caption" class="text-neutral-80">
            These suggestions are based on popular items and your preferences. 
            <button 
              class="text-primary-green hover:underline"
              @click="$emit('learnMore')"
            >
              Learn more
            </button>
          </AppText>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { MenuItemUI } from '~/types'
import { useMenuStore } from '~/stores/menu'
import { useUserStore } from '~/stores/user'
import AppText from '../base/AppText.vue'

interface Props {
  items?: MenuItemUI[]
  loading?: boolean
  maxItems?: number
  gridColumns?: 1 | 2 | 3 | 4 | 5 | 6 | 7
  showViewAll?: boolean
  showRefresh?: boolean
  showPersonalizationNotice?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 8,
  gridColumns: 4,
  showViewAll: true,
  showRefresh: false,
  showPersonalizationNotice: false,
  refreshInterval: 300000 // 5 minutes
})

const emit = defineEmits<{
  itemClick: [item: MenuItemUI]
  addToCart: [item: MenuItemUI]
  toggleFavorite: [item: MenuItemUI]
  viewAll: []
  refresh: []
  learnMore: []
}>()

// Stores
const menuStore = useMenuStore()
const userStore = useUserStore()

// Local state
const lastRefresh = ref(Date.now())

// Computed properties
const popularItems = computed(() => {
  if (props.items) {
    return props.items
  }
  
  // Get popular items from store
  let items = menuStore.popularItems
  
  // Apply user preferences if available
  if (userStore.user?.preferences?.favoriteItems) {
    const favoriteCategories = new Set(
      userStore.user.preferences.favoriteItems
        .map(id => menuStore.menuItems.find(item => item.id === id)?.categoryId)
        .filter(Boolean)
    )
    
    // Boost items from favorite categories
    items = items.sort((a, b) => {
      const aIsFavoriteCategory = favoriteCategories.has(a.categoryId)
      const bIsFavoriteCategory = favoriteCategories.has(b.categoryId)
      
      if (aIsFavoriteCategory && !bIsFavoriteCategory) return -1
      if (!aIsFavoriteCategory && bIsFavoriteCategory) return 1
      return 0
    })
  }
  
  return items
})

const shouldShowRefresh = computed(() => {
  if (!props.showRefresh) return false
  
  const timeSinceRefresh = Date.now() - lastRefresh.value
  return timeSinceRefresh > props.refreshInterval
})

// Methods
const handleItemClick = (item: MenuItemUI) => {
  emit('itemClick', item)
  
  // Track interaction for better recommendations
  trackInteraction('view', item)
}

const handleAddToCart = (item: MenuItemUI) => {
  emit('addToCart', item)
  
  // Track interaction for better recommendations
  trackInteraction('add_to_cart', item)
}

const handleToggleFavorite = (item: MenuItemUI) => {
  emit('toggleFavorite', item)
  
  // Track interaction for better recommendations
  trackInteraction('favorite', item)
}

const refreshRecommendations = () => {
  lastRefresh.value = Date.now()
  emit('refresh')
  
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
}

const trackInteraction = (action: string, item: MenuItemUI) => {
  // This would typically send analytics data to improve recommendations
  console.log(`Tracked ${action} for item:`, item.id)
  
  // Could integrate with analytics service here
  // analytics.track('popular_item_interaction', {
  //   action,
  //   itemId: item.id,
  //   categoryId: item.categoryId,
  //   timestamp: Date.now()
  // })
}

// Auto-refresh functionality
let refreshTimer: NodeJS.Timeout | null = null

onMounted(() => {
  if (props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      if (shouldShowRefresh.value) {
        refreshRecommendations()
      }
    }, props.refreshInterval)
  }
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;
@use '../../assets/scss/tokens/radius' as *;

/* Section animations */
section {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header fire icon animation */
.flex.items-center.space-x-3 > :first-child {
  animation: fireGlow 3s ease-in-out infinite;
  color: var(--color-primary); // Ensure icon uses primary color
}

@keyframes fireGlow {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(255, 107, 0, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 15px rgba(255, 107, 0, 0.6));
  }
}

/* Personalization notice */
.personalization-notice {
  margin-top: $space-6;
  padding: $space-4;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border-radius: $radius-lg;
  border: 1px solid var(--border-primary);
  display: flex;
  align-items: flex-start;
  gap: $space-3;
}

/* Smooth transitions */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* BaseButton overrides if needed to match context */
.text-primary-green {
  color: var(--color-primary) !important;
  
  &:hover {
    color: var(--color-primary-dark) !important;
  }
}

/* Focus styles */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>