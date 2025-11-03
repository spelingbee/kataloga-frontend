<template>
  <!-- Mobile category sidebar overlay -->
  <div class="fixed inset-0 z-50 lg:hidden">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="$emit('close')"
    />
    
    <!-- Sidebar -->
    <div 
      class="absolute left-0 top-0 h-full w-full max-w-xs bg-background-sidebar shadow-xl transform transition-transform duration-300 ease-in-out"
      :class="{ 'translate-x-0': isOpen, '-translate-x-full': !isOpen }"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-border-subtle">
        <AppHeading level="h2" size="heading-lg">
          Categories
        </AppHeading>
        <BaseButton
          variant="ghost"
          size="sm"
          @click="$emit('close')"
          aria-label="Close categories"
        >
          <BaseIcon name="x" size="md" />
        </BaseButton>
      </div>

      <!-- Categories List -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-2">
        <CategoryItem
          v-for="category in categories"
          :key="category.id"
          :category="category"
          :is-active="isActiveCategory(category.id)"
          @click="selectCategory(category)"
          class="w-full"
        />
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-border-subtle">
        <div class="flex items-center justify-between text-caption text-neutral-80">
          <span>{{ totalItems }} items</span>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="clearFilters"
            class="text-caption"
          >
            Clear filters
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMenuStore } from '~/stores/menu'

// Props & Emits
defineEmits<{
  close: []
}>()

// Stores
const menuStore = useMenuStore()

// Reactive state
const isOpen = ref(false)

// Computed properties
const categories = computed(() => menuStore.categories)
const currentCategory = computed(() => menuStore.currentCategory)
const totalItems = computed(() => menuStore.filteredItems.length)

// Methods
const isActiveCategory = (categoryId: string) => {
  return currentCategory.value === categoryId
}

const selectCategory = (category: any) => {
  menuStore.setCurrentCategory(category.id)
  
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
  
  // Close sidebar after selection
  $emit('close')
}

const clearFilters = () => {
  menuStore.clearFilters()
  menuStore.setCurrentCategory(null)
  $emit('close')
}

// Animation
onMounted(() => {
  // Trigger animation after mount
  nextTick(() => {
    isOpen.value = true
  })
})

// Handle escape key
onKeyStroke('Escape', () => {
  $emit('close')
})
</script>

<style scoped>
/* Smooth sidebar animation */
.transform {
  transform: translateX(-100%);
}

.-translate-x-full {
  transform: translateX(-100%);
}

.translate-x-0 {
  transform: translateX(0);
}

/* Custom scrollbar */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>