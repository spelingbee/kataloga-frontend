<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header Section -->
    <div class="px-6 py-8">
      <div class="flex items-center gap-4 mb-4">
        <NuxtLink 
          to="/menu"
          class="text-neutral-20 hover:text-white transition-colors"
        >
          <BaseIcon name="arrow-left" size="md" />
        </NuxtLink>
        
        <div>
          <AppHeading level="h1" size="display-md" class="text-white">
            Menu Filters
          </AppHeading>
          <AppText size="body-md" class="text-neutral-20">
            Customize your menu browsing experience
          </AppText>
        </div>
      </div>

      <!-- Active Filters Summary -->
      <div v-if="hasActiveFilters" class="bg-background-card rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <AppText size="body-sm" class="text-neutral-20">
            Active Filters ({{ activeFilterCount }})
          </AppText>
          <BaseButton 
            variant="ghost" 
            size="sm"
            @click="clearAllFilters"
          >
            Clear All
          </BaseButton>
        </div>
        <div class="flex flex-wrap gap-2">
          <BaseBadge
            v-for="filter in activeFiltersList"
            :key="filter.key"
            variant="primary"
            class="cursor-pointer"
            @click="removeFilter(filter.key)"
          >
            {{ filter.label }}
            <BaseIcon name="x" size="xs" class="ml-1" />
          </BaseBadge>
        </div>
      </div>
    </div>

    <!-- Filter Sections -->
    <div class="px-6 space-y-8">
      <!-- Category Filter -->
      <div class="bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-4">
          Categories
        </AppHeading>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <label
            v-for="category in categories"
            :key="category.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-neutral-80/30 hover:border-primary-green/50 transition-colors cursor-pointer"
            :class="{ 'border-primary-green bg-primary-green/10': selectedCategories.includes(category.id) }"
          >
            <input
              v-model="selectedCategories"
              :value="category.id"
              type="checkbox"
              class="sr-only"
            />
            <CategoryIcon :category="category.id" size="sm" />
            <div class="flex-1 min-w-0">
              <AppText size="body-sm" class="text-white">
                {{ category.name }}
              </AppText>
              <AppText size="caption" class="text-neutral-20">
                {{ category.count }} items
              </AppText>
            </div>
          </label>
        </div>
      </div>

      <!-- Price Range Filter -->
      <div class="bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-4">
          Price Range
        </AppHeading>
        <div class="space-y-4">
          <!-- Price Range Slider -->
          <div class="px-2">
            <div class="flex items-center justify-between mb-2">
              <AppText size="body-sm" class="text-neutral-20">
                ${{ safePriceRangeMin }}
              </AppText>
              <AppText size="body-sm" class="text-neutral-20">
                ${{ safePriceRangeMax }}
              </AppText>
            </div>
            <!-- Custom range slider would go here -->
            <div class="relative h-2 bg-neutral-80/30 rounded-full">
              <div 
                class="absolute h-2 bg-primary-green rounded-full"
                :style="{ 
                  left: `${(safePriceRangeMin / maxPrice) * 100}%`,
                  width: `${((safePriceRangeMax - safePriceRangeMin) / maxPrice) * 100}%`
                }"
              />
            </div>
          </div>

          <!-- Price Presets -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <BaseButton
              v-for="preset in pricePresets"
              :key="preset.label"
              :variant="isPricePresetActive(preset) ? 'primary' : 'secondary'"
              size="sm"
              @click="setPricePreset(preset)"
            >
              {{ preset.label }}
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Dietary Preferences -->
      <div class="bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-4">
          Dietary Preferences
        </AppHeading>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            v-for="diet in dietaryOptions"
            :key="diet.key"
            class="flex items-center gap-3 p-3 rounded-lg border border-neutral-80/30 hover:border-primary-green/50 transition-colors cursor-pointer"
            :class="{ 'border-primary-green bg-primary-green/10': selectedDietary.includes(diet.key) }"
          >
            <input
              v-model="selectedDietary"
              :value="diet.key"
              type="checkbox"
              class="sr-only"
            />
            <BaseIcon :name="diet.icon" size="sm" :class="diet.color" />
            <div class="flex-1">
              <AppText size="body-sm" class="text-white">
                {{ diet.label }}
              </AppText>
              <AppText size="caption" class="text-neutral-20">
                {{ diet.description }}
              </AppText>
            </div>
          </label>
        </div>
      </div>

      <!-- Nutrition Filters -->
      <div class="bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-4">
          Nutrition
        </AppHeading>
        
        <!-- Calories Range -->
        <div class="mb-6">
          <AppText size="body-sm" class="text-white mb-2">
            Calories per serving
          </AppText>
          <div class="flex items-center gap-4">
            <BaseInput
              v-model.number="caloriesMin"
              type="number"
              placeholder="Min"
              class="w-24"
            />
            <AppText class="text-neutral-20">to</AppText>
            <BaseInput
              v-model.number="caloriesMax"
              type="number"
              placeholder="Max"
              class="w-24"
            />
            <AppText class="text-neutral-20">calories</AppText>
          </div>
        </div>

        <!-- Nutrition Presets -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <BaseButton
            v-for="preset in nutritionPresets"
            :key="preset.key"
            :variant="selectedNutritionPresets.includes(preset.key) ? 'primary' : 'secondary'"
            size="sm"
            @click="toggleNutritionPreset(preset.key)"
          >
            <BaseIcon :name="preset.icon" size="sm" class="mr-2" />
            {{ preset.label }}
          </BaseButton>
        </div>
      </div>

      <!-- Cooking Time -->
      <div class="bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-4">
          Preparation Time
        </AppHeading>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <BaseButton
            v-for="time in cookingTimes"
            :key="time.value"
            :variant="selectedCookingTime === time.value ? 'primary' : 'secondary'"
            size="sm"
            @click="selectedCookingTime = selectedCookingTime === time.value ? undefined : time.value"
          >
            <BaseIcon name="clock" size="sm" class="mr-2" />
            {{ time.label }}
          </BaseButton>
        </div>
      </div>

      <!-- Availability -->
      <div class="bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-4">
          Availability
        </AppHeading>
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="showOnlyAvailable"
              type="checkbox"
              class="w-4 h-4 text-primary-green bg-background-dark border-neutral-80 rounded focus:ring-primary-green"
            />
            <div>
              <AppText size="body-sm" class="text-white">
                Show only available items
              </AppText>
              <AppText size="caption" class="text-neutral-20">
                Hide out-of-stock dishes
              </AppText>
            </div>
          </label>
          
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="showNewItems"
              type="checkbox"
              class="w-4 h-4 text-primary-green bg-background-dark border-neutral-80 rounded focus:ring-primary-green"
            />
            <div>
              <AppText size="body-sm" class="text-white">
                Show new items first
              </AppText>
              <AppText size="caption" class="text-neutral-20">
                Highlight recently added dishes
              </AppText>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Apply Filters Button -->
    <div class="px-6 py-8 border-t border-neutral-80/20 mt-12">
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <BaseButton 
          variant="primary"
          size="lg"
          class="min-w-48"
          @click="applyFilters"
        >
          Apply Filters ({{ filteredItemsCount }} items)
        </BaseButton>
        <BaseButton 
          variant="secondary"
          size="lg"
          @click="resetFilters"
        >
          Reset All
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page setup
// Stores
import { useMenuStore } from '~/stores/menu'
import { safeArrayAccess } from '~/types/utils/type-guards'

definePageMeta({
  title: 'Menu Filters - Menu Ordering App'
})

const menuStore = useMenuStore()
const router = useRouter()

// Reactive state
const selectedCategories = ref<string[]>([])
const priceRange = ref([0, 50])
const selectedDietary = ref<string[]>([])
const caloriesRange = ref([0, 1000])
const selectedNutritionPresets = ref<string[]>([])
const selectedCookingTime = ref<number | undefined>(undefined)
const showOnlyAvailable = ref(false)
const showNewItems = ref(false)

// Constants
const maxPrice = 50

const categories = [
  { id: 'all', name: 'All Items', count: 48 },
  { id: 'salads', name: 'Salads', count: 12 },
  { id: 'main-dishes', name: 'Main Dishes', count: 18 },
  { id: 'meat', name: 'Meat', count: 15 },
  { id: 'fastfood', name: 'Fast Food', count: 20 },
  { id: 'desserts', name: 'Desserts', count: 8 },
  { id: 'drinks', name: 'Drinks', count: 16 }
]

const pricePresets = [
  { label: 'Under $10', min: 0, max: 10 },
  { label: '$10-$20', min: 10, max: 20 },
  { label: '$20-$30', min: 20, max: 30 },
  { label: 'Over $30', min: 30, max: 50 }
]

const dietaryOptions = [
  { key: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish', icon: 'leaf', color: 'text-primary-green' },
  { key: 'vegan', label: 'Vegan', description: 'No animal products', icon: 'leaf', color: 'text-primary-green' },
  { key: 'gluten-free', label: 'Gluten Free', description: 'No gluten ingredients', icon: 'shield', color: 'text-primary-orange' },
  { key: 'dairy-free', label: 'Dairy Free', description: 'No dairy products', icon: 'droplet-off', color: 'text-primary-red' },
  { key: 'keto', label: 'Keto Friendly', description: 'Low carb, high fat', icon: 'zap', color: 'text-primary-orange' },
  { key: 'halal', label: 'Halal', description: 'Prepared according to Islamic law', icon: 'check-circle', color: 'text-primary-green' }
]

const nutritionPresets = [
  { key: 'low-calorie', label: 'Low Calorie', icon: 'trending-down' },
  { key: 'high-protein', label: 'High Protein', icon: 'activity' },
  { key: 'low-carb', label: 'Low Carb', icon: 'minus-circle' },
  { key: 'low-fat', label: 'Low Fat', icon: 'droplet' },
  { key: 'high-fiber', label: 'High Fiber', icon: 'layers' },
  { key: 'low-sodium', label: 'Low Sodium', icon: 'minus' }
]

const cookingTimes = [
  { value: 15, label: 'Under 15 min' },
  { value: 30, label: '15-30 min' },
  { value: 45, label: '30-45 min' },
  { value: 60, label: 'Over 45 min' }
]

// Computed
const hasActiveFilters = computed(() => {
  return selectedCategories.value.length > 0 ||
         (safeArrayAccess(priceRange.value, 0) || 0) > 0 || (safeArrayAccess(priceRange.value, 1) || maxPrice) < maxPrice ||
         selectedDietary.value.length > 0 ||
         (safeArrayAccess(caloriesRange.value, 0) || 0) > 0 || (safeArrayAccess(caloriesRange.value, 1) || 1000) < 1000 ||
         selectedNutritionPresets.value.length > 0 ||
         selectedCookingTime.value !== undefined ||
         showOnlyAvailable.value ||
         showNewItems.value
})

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedCategories.value.length > 0) count++
  if ((safeArrayAccess(priceRange.value, 0) || 0) > 0 || (safeArrayAccess(priceRange.value, 1) || maxPrice) < maxPrice) count++
  if (selectedDietary.value.length > 0) count++
  if ((safeArrayAccess(caloriesRange.value, 0) || 0) > 0 || (safeArrayAccess(caloriesRange.value, 1) || 1000) < 1000) count++
  if (selectedNutritionPresets.value.length > 0) count++
  if (selectedCookingTime.value !== undefined) count++
  if (showOnlyAvailable.value) count++
  if (showNewItems.value) count++
  return count
})

const activeFiltersList = computed(() => {
  const filters = []
  
  if (selectedCategories.value.length > 0) {
    filters.push({ key: 'categories', label: `${selectedCategories.value.length} Categories` })
  }
  if ((safeArrayAccess(priceRange.value, 0) || 0) > 0 || (safeArrayAccess(priceRange.value, 1) || maxPrice) < maxPrice) {
    filters.push({ key: 'price', label: `$${safeArrayAccess(priceRange.value, 0) || 0}-$${safeArrayAccess(priceRange.value, 1) || maxPrice}` })
  }
  if (selectedDietary.value.length > 0) {
    filters.push({ key: 'dietary', label: `${selectedDietary.value.length} Dietary` })
  }
  if ((safeArrayAccess(caloriesRange.value, 0) || 0) > 0 || (safeArrayAccess(caloriesRange.value, 1) || 1000) < 1000) {
    filters.push({ key: 'calories', label: `${safeArrayAccess(caloriesRange.value, 0) || 0}-${safeArrayAccess(caloriesRange.value, 1) || 1000} cal` })
  }
  if (selectedNutritionPresets.value.length > 0) {
    filters.push({ key: 'nutrition', label: `${selectedNutritionPresets.value.length} Nutrition` })
  }
  if (selectedCookingTime.value !== undefined) {
    const timeLabel = cookingTimes.find(t => t.value === selectedCookingTime.value)?.label
    filters.push({ key: 'time', label: timeLabel || 'Cooking Time' })
  }
  if (showOnlyAvailable.value) {
    filters.push({ key: 'available', label: 'Available Only' })
  }
  if (showNewItems.value) {
    filters.push({ key: 'new', label: 'New Items' })
  }
  
  return filters
})

const filteredItemsCount = computed(() => {
  // This would calculate the actual filtered items count
  // For now, return a mock number
  return Math.max(1, 48 - (activeFilterCount.value * 5))
})

// Safe array access computed properties for template
const safePriceRangeMin = computed(() => safeArrayAccess(priceRange.value, 0) || 0)
const safePriceRangeMax = computed(() => safeArrayAccess(priceRange.value, 1) || maxPrice)
const safeCaloriesRangeMin = computed(() => safeArrayAccess(caloriesRange.value, 0) || 0)
const safeCaloriesRangeMax = computed(() => safeArrayAccess(caloriesRange.value, 1) || 1000)

// Computed properties for v-model bindings with safe array access
const caloriesMin = computed({
  get: () => safeArrayAccess(caloriesRange.value, 0) || 0,
  set: (value: number) => {
    const current = [...caloriesRange.value]
    current[0] = value
    caloriesRange.value = current
  }
})

const caloriesMax = computed({
  get: () => safeArrayAccess(caloriesRange.value, 1) || 1000,
  set: (value: number) => {
    const current = [...caloriesRange.value]
    current[1] = value
    caloriesRange.value = current
  }
})

// Methods
const isPricePresetActive = (preset: typeof pricePresets[0]) => {
  return (safeArrayAccess(priceRange.value, 0) || 0) === preset.min && (safeArrayAccess(priceRange.value, 1) || maxPrice) === preset.max
}

const setPricePreset = (preset: typeof pricePresets[0]) => {
  priceRange.value = [preset.min, preset.max]
}

const toggleNutritionPreset = (key: string) => {
  const index = selectedNutritionPresets.value.indexOf(key)
  if (index >= 0) {
    selectedNutritionPresets.value.splice(index, 1)
  } else {
    selectedNutritionPresets.value.push(key)
  }
}

const removeFilter = (filterKey: string) => {
  switch (filterKey) {
    case 'categories':
      selectedCategories.value = []
      break
    case 'price':
      priceRange.value = [0, maxPrice]
      break
    case 'dietary':
      selectedDietary.value = []
      break
    case 'calories':
      caloriesRange.value = [0, 1000]
      break
    case 'nutrition':
      selectedNutritionPresets.value = []
      break
    case 'time':
      selectedCookingTime.value = undefined
      break
    case 'available':
      showOnlyAvailable.value = false
      break
    case 'new':
      showNewItems.value = false
      break
  }
}

const clearAllFilters = () => {
  selectedCategories.value = []
  priceRange.value = [0, maxPrice]
  selectedDietary.value = []
  caloriesRange.value = [0, 1000]
  selectedNutritionPresets.value = []
  selectedCookingTime.value = undefined
  showOnlyAvailable.value = false
  showNewItems.value = false
}

const resetFilters = () => {
  clearAllFilters()
  menuStore.clearFilters()
}

const applyFilters = () => {
  // Apply filters to the menu store
  const filters = {
    categories: selectedCategories.value,
    priceRange: priceRange.value as [number, number],
    dietary: selectedDietary.value,
    calories: caloriesRange.value as [number, number],
    nutritionPresets: selectedNutritionPresets.value,
    cookingTime: selectedCookingTime.value,
    availability: showOnlyAvailable.value,
    showNew: showNewItems.value
  }
  
  menuStore.applyFilters(filters)
  
  // Navigate back to menu with filters applied
  router.push('/menu')
}

// Initialize filters from store
onMounted(() => {
  const currentFilters = menuStore.filters
  
  if (currentFilters.priceRange) {
    priceRange.value = currentFilters.priceRange
  }
  if (currentFilters.calories) {
    caloriesRange.value = currentFilters.calories
  }
  if (currentFilters.dietary) {
    selectedDietary.value = currentFilters.dietary
  }
  if (currentFilters.availability) {
    showOnlyAvailable.value = currentFilters.availability
  }
  if (currentFilters.cookingTime) {
    selectedCookingTime.value = currentFilters.cookingTime
  }
})
</script>