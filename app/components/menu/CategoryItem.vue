<template>
  <button
    class="flex items-center w-full p-3 rounded-category transition-all duration-200 hover:bg-background-dark/50 group"
    :class="[
      isActive 
        ? 'bg-primary-green/10 border border-primary-green/20 text-primary-green' 
        : 'bg-background-card/50 border border-border-subtle text-neutral-20 hover:border-neutral-80'
    ]"
    @click="$emit('click')"
  >
    <!-- Category Icon -->
    <div class="flex-shrink-0 mr-3">
      <BaseIcon 
        :name="category.icon || 'category'" 
        size="category-icon"
        :class="isActive ? 'text-primary-green' : 'text-neutral-80'"
      />
    </div>

    <!-- Category Info -->
    <div class="flex-1 text-left min-w-0">
      <div class="flex items-center justify-between">
        <AppText 
          size="category" 
          class="font-medium truncate"
          :class="isActive ? 'text-primary-green' : 'text-neutral-20'"
        >
          {{ category.name }}
        </AppText>
        
        <!-- Item Count Badge -->
        <BaseBadge
          v-if="category.itemCount > 0"
          :count="category.itemCount"
          size="sm"
          :class="isActive ? 'bg-primary-green text-white' : 'bg-neutral-80 text-neutral-20'"
        />
      </div>
      
      <!-- Category Description (optional) -->
      <AppText 
        v-if="category.description" 
        size="caption" 
        class="text-neutral-80 truncate mt-1"
      >
        {{ category.description }}
      </AppText>
    </div>

    <!-- Active Indicator -->
    <div 
      v-if="isActive"
      class="flex-shrink-0 ml-2 w-1 h-6 bg-primary-green rounded-full"
    />
  </button>
</template>

<script setup lang="ts">
// Props & Emits
interface Props {
  category: {
    id: string
    name: string
    description?: string
    icon?: string
    itemCount: number
  }
  isActive?: boolean
}

defineProps<Props>()

defineEmits<{
  click: []
}>()
</script>

<style scoped>
/* Touch-friendly sizing */
button {
  min-height: 56px;
  touch-action: manipulation;
}

/* Smooth transitions */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Active state animation */
button.bg-primary-green\/10 {
  transform: translateX(2px);
}

/* Hover effects */
button:hover {
  transform: translateX(1px);
}

button.bg-primary-green\/10:hover {
  transform: translateX(3px);
}
</style>
