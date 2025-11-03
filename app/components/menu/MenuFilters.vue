<template>
  <div class="space-y-6">
    <!-- Filter Header -->
    <div class="flex items-center justify-between">
      <AppHeading level="h3" size="heading-md" class="text-white">
        Filters
      </AppHeading>
      
      <BaseButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        @click="clearAllFilters"
        class="text-primary-red hover:text-primary-red/80"
      >
        Clear All
      </BaseButton>
    </div>

    <!-- Price Range Filter -->
    <div class="space-y-3">
      <AppText size="body-md" class="text-white font-medium">
        Price Range
      </AppText>
      
      <div class="space-y-3">
        <!-- Price Range Slider -->
        <div class="px-2">
          <input
            v-model="localFilters.priceRange[0]"
            type="range"
            :min="priceRange.min"
            :max="priceRange.max"
            :step="priceStep"
            class="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer range-slider"
            @input="updatePriceRange"
          />
          <input
            v-model="localFilters.priceRange[1]"
            type="range"
            :min="priceRange.min"
            :max="priceRange.max"
            :step="priceStep"
            class="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer range-slider mt-1"
            @input="updatePriceRange"
          />
        </div>
        
        <!-- Price Display -->
        <div class="flex items-center justify-between text-body-sm">
          <AppPrice :amount="localFilters.priceRange[0]" size="sm" class="text-neutral-20" />
          <span class="text-neutral-80">-</span>
          <AppPrice :amount="localFilters.priceRange[1]" size="sm" class="text-neutral-20" />
        </div>
      </div>
    </div>

    <!-- Calories Filter -->
    <div class="space-y-3">
      <div class="flex items-center space-x-2">
        <BaseIcon name="fire" size="sm" class="text-primary-orange" />
        <AppText size="body-md" class="text-white font-medium">
          Calories
        </AppText>
      </div>
      
      <div class="space-y-3">
        <!-- Calories Range Slider -->
        <div class="px-2">
          <input
            v-model="localFilters.calories[0]"
            type="range"
            :min="caloriesRange.min"
            :max="caloriesRange.max"
            :step="caloriesStep"
            class="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer range-slider"
            @input="updateCaloriesRange"
          />
          <input
            v-model="localFilters.calories[1]"
            type="range"
            :min="caloriesRange.min"
            :max="caloriesRange.max"
            :step="caloriesStep"
            class="w-full h-2 bg-background-dark rounded-lg appearance-none cursor-pointer range-slider mt-1"
            @input="updateCaloriesRange"
          />
        </div>
        
        <!-- Calories Display -->
        <div class="flex items-center justify-between text-body-sm">
          <span class="text-neutral-20">{{ localFilters.calories[0] }} cal</span>
          <span class="text-neutral-80">-</span>
          <span class="text-neutral-20">{{ localFilters.calories[1] }} cal</span>
        </div>
      </div>
    </div>

    <!-- Dietary Restrictions -->
    <div class="space-y-3">
      <AppText size="body-md" class="text-white font-medium">
        Dietary Preferences
      </AppText>
      
      <div class="grid grid-cols-2 gap-2">
        <BaseButton
          v-for="diet in dietaryOptions"
          :key="diet.value"
          :variant="isDietarySelected(diet.value) ? 'primary' : 'secondary'"
          size="sm"
          @click="toggleDietary(diet.value)"
          class="justify-start text-left"
        >
          <BaseIcon :name="diet.icon" size="sm" class="mr-2" />
          {{ diet.label }}
        </BaseButton>
      </div>
    </div>

    <!-- Availability Filter -->
    <div class="space-y-3">
      <AppText size="body-md" class="text-white font-medium">
        Availability
      </AppText>
      
      <div class="flex items-center space-x-3">
        <BaseToggle
          v-model="localFilters.availability"
          @update:model-value="updateAvailability"
        />
        <AppText size="body-sm" class="text-neutral-20">
          Show only available items
        </AppText>
      </div>
    </div>

    <!-- Cooking Time Filter -->
    <div class="space-y-3">
      <div class="flex items-center space-x-2">
        <BaseIcon name="clock" size="sm" class="text-primary-orange" />
        <AppText size="body-md" class="text-white font-medium">
          Cooking Time
        </AppText>
      </div>
      
      <div class="space-y-2">
        <BaseButton
          v-for="time in cookingTimeOptions"
          :key="time.value"
          :variant="localFilters.cookingTime === time.value ? 'primary' : 'secondary'"
          size="sm"
          @click="setCookingTime(time.value)"
          class="w-full justify-start"
        >
          {{ time.label }}
        </BaseButton>
      </div>
    </div>

    <!-- Apply Filters Button -->
    <div class="pt-4 border-t border-border-subtle">
      <BaseButton
        variant="primary"
        size="md"
        @click="applyFilters"
        class="w-full"
        :disabled="!hasChanges"
      >
        Apply Filters
        <span v-if="filteredCount !== undefined" class="ml-2">
          ({{ filteredCount }} items)
        </span>
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { MenuFilters } from '~/types'
import { useMenuStore } from '~/stores/menu'

interface Props {
  filters?: MenuFilters
  priceRange?: { min: number; max: number }
  caloriesRange?: { min: number; max: number }
  filteredCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  filters: () => ({}),
  priceRange: () => ({ min: 0, max: 1000 }),
  caloriesRange: () => ({ min: 0, max: 1000 }),
})

const emit = defineEmits<{
  update: [filters: MenuFilters]
  clear: []
}>()

// Stores
const menuStore = useMenuStore()

// Local state
const localFilters = ref<MenuFilters>({
  priceRange: [props.priceRange.min, props.priceRange.max],
  calories: [props.caloriesRange.min, props.caloriesRange.max],
  dietary: [],
  availability: false,
  cookingTime: undefined
})

// Configuration
const priceStep = 10
const caloriesStep = 25

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
  { value: 'vegan', label: 'Vegan', icon: 'leaf' },
  { value: 'gluten-free', label: 'Gluten Free', icon: 'shield' },
  { value: 'dairy-free', label: 'Dairy Free', icon: 'shield' },
  { value: 'low-carb', label: 'Low Carb', icon: 'trending-down' },
  { value: 'keto', label: 'Keto', icon: 'zap' }
]

const cookingTimeOptions = [
  { value: undefined, label: 'Any time' },
  { value: 15, label: 'Under 15 min' },
  { value: 30, label: 'Under 30 min' },
  { value: 45, label: 'Under 45 min' }
]

// Computed properties
const hasActiveFilters = computed(() => {
  return !!(
    localFilters.value.priceRange &&
    (localFilters.value.priceRange[0] !== props.priceRange.min ||
     localFilters.value.priceRange[1] !== props.priceRange.max) ||
    localFilters.value.calories &&
    (localFilters.value.calories[0] !== props.caloriesRange.min ||
     localFilters.value.calories[1] !== props.caloriesRange.max) ||
    localFilters.value.dietary?.length ||
    localFilters.value.availability ||
    localFilters.value.cookingTime
  )
})

const hasChanges = computed(() => {
  return JSON.stringify(localFilters.value) !== JSON.stringify(props.filters)
})

// Methods
const isDietarySelected = (dietary: string) => {
  return localFilters.value.dietary?.includes(dietary) || false
}

const toggleDietary = (dietary: string) => {
  if (!localFilters.value.dietary) {
    localFilters.value.dietary = []
  }
  
  const index = localFilters.value.dietary.indexOf(dietary)
  if (index >= 0) {
    localFilters.value.dietary.splice(index, 1)
  } else {
    localFilters.value.dietary.push(dietary)
  }
}

const setCookingTime = (time: number | undefined) => {
  localFilters.value.cookingTime = time
}

const updatePriceRange = () => {
  // Ensure min <= max
  if (localFilters.value.priceRange) {
    const [min, max] = localFilters.value.priceRange
    if (min > max) {
      localFilters.value.priceRange = [max, min]
    }
  }
}

const updateCaloriesRange = () => {
  // Ensure min <= max
  if (localFilters.value.calories) {
    const [min, max] = localFilters.value.calories
    if (min > max) {
      localFilters.value.calories = [max, min]
    }
  }
}

const updateAvailability = (value: boolean) => {
  localFilters.value.availability = value
}

const applyFilters = () => {
  emit('update', { ...localFilters.value })
  
  // Apply to store
  menuStore.applyFilters(localFilters.value)
  
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(30)
  }
}

const clearAllFilters = () => {
  localFilters.value = {
    priceRange: [props.priceRange.min, props.priceRange.max],
    calories: [props.caloriesRange.min, props.caloriesRange.max],
    dietary: [],
    availability: false,
    cookingTime: undefined
  }
  
  emit('clear')
  menuStore.clearFilters()
}

// Initialize filters from props
onMounted(() => {
  if (props.filters) {
    localFilters.value = {
      priceRange: props.filters.priceRange || [props.priceRange.min, props.priceRange.max],
      calories: props.filters.calories || [props.caloriesRange.min, props.caloriesRange.max],
      dietary: props.filters.dietary || [],
      availability: props.filters.availability || false,
      cookingTime: props.filters.cookingTime
    }
  }
})

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  if (newFilters) {
    localFilters.value = {
      priceRange: newFilters.priceRange || [props.priceRange.min, props.priceRange.max],
      calories: newFilters.calories || [props.caloriesRange.min, props.caloriesRange.max],
      dietary: newFilters.dietary || [],
      availability: newFilters.availability || false,
      cookingTime: newFilters.cookingTime
    }
  }
}, { deep: true })
</script>

<style scoped>
/* Custom range slider styles */
.range-slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: var(--color-primary-green);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: var(--color-primary-green);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-slider::-webkit-slider-track {
  height: 8px;
  cursor: pointer;
  background: var(--color-background-dark);
  border-radius: 4px;
}

.range-slider::-moz-range-track {
  height: 8px;
  cursor: pointer;
  background: var(--color-background-dark);
  border-radius: 4px;
}

/* Focus styles */
.range-slider:focus {
  outline: none;
}

.range-slider:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(32, 171, 71, 0.3);
}

/* Button transitions */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Grid responsive */
@media (max-width: 640px) {
  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>