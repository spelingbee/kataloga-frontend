<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-neutral-80/20">
      <div class="flex items-center gap-4">
        <BaseButton 
          variant="ghost" 
          @click="$router.go(-1)"
        >
          <BaseIcon name="arrow-left" size="md" />
        </BaseButton>
        <div>
          <AppHeading level="h1" size="heading-lg" class="text-white">
            {{ $t('menu.ingredients.title') }}
          </AppHeading>
          <AppText class="text-neutral-20">
            {{ dish?.name }}
          </AppText>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"/>
        <AppText class="text-neutral-20">{{ $t('menu.ingredients.loading') }}</AppText>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="px-6 py-8">
      <!-- Current Selection Summary -->
      <div class="mb-8 p-4 bg-background-card rounded-xl">
        <div class="flex items-center justify-between mb-4">
          <AppHeading level="h3" size="heading-md" class="text-white">
            {{ $t('menu.ingredients.yourCustomizations') }}
          </AppHeading>
          <BaseButton 
            variant="ghost" 
            size="sm"
            @click="resetCustomizations"
          >
            {{ $t('menu.filters.clearAll') }}
          </BaseButton>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <AppText size="body-lg" class="text-white font-semibold">{{ customizedCalories }}</AppText>
            <AppText size="caption" class="text-neutral-20">{{ $t('menu.calories') }}</AppText>
          </div>
          <div class="text-center">
            <AppPrice :price="customizationPrice" size="md" />
            <AppText size="caption" class="text-neutral-20">{{ $t('menu.ingredients.extraCost') }}</AppText>
          </div>
          <div class="text-center">
            <AppText size="body-lg" class="text-white font-semibold">{{ activeCustomizations }}</AppText>
            <AppText size="caption" class="text-neutral-20">{{ $t('menu.ingredients.changes') }}</AppText>
          </div>
          <div class="text-center">
            <AppText size="body-lg" class="text-white font-semibold">{{ totalPrice }}</AppText>
            <AppText size="caption" class="text-neutral-20">{{ $t('menu.price') }}</AppText>
          </div>
        </div>
      </div>

      <!-- Ingredient Categories -->
      <div class="space-y-8">
        <!-- Main Ingredients -->
        <div>
          <AppHeading level="h2" size="heading-md" class="text-white mb-6">
            {{ $t('menu.ingredients.main') }}
          </AppHeading>
          
          <div class="space-y-4">
            <div
              v-for="ingredient in mainIngredients"
              :key="ingredient.id"
              class="bg-background-card rounded-xl p-4"
            >
              <div class="flex items-center gap-4">
                <!-- Ingredient Info -->
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <BaseIcon :name="ingredient.icon" size="md" :class="ingredient.iconColor" />
                    <div>
                      <AppHeading level="h4" size="heading-sm" class="text-white">
                        {{ $t(`menu.ingredients.items.${ingredient.id}`) }}
                      </AppHeading>
                      <AppText size="body-sm" class="text-neutral-20">
                        {{ ingredient.description }}
                      </AppText>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <AppText size="caption" class="text-neutral-20">
                      {{ ingredient.calories }} {{ $t('menu.filters.calories') }}
                    </AppText>
                    <AppText v-if="ingredient.price > 0" size="caption" class="text-neutral-20">
                      +{{ formatPrice(ingredient.price) }}
                    </AppText>
                  </div>
                </div>

                <!-- Customization Controls -->
                <div class="flex items-center gap-2">
                  <IngredientToggle
                    :model-value="getIngredientLevel(ingredient.id)"
                    :options="ingredient.options"
                    @update:model-value="setIngredientLevel(ingredient.id, $event)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Add-ons -->
        <div>
          <AppHeading level="h2" size="heading-md" class="text-white mb-6">
            {{ $t('menu.ingredients.extra') }}
          </AppHeading>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="addon in addOnIngredients"
              :key="addon.id"
              class="bg-background-card rounded-xl p-4"
            >
              <div class="flex items-center gap-4">
                <!-- Addon Info -->
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <BaseIcon :name="addon.icon" size="md" :class="addon.iconColor" />
                    <div>
                      <AppHeading level="h4" size="heading-sm" class="text-white">
                        {{ $t(`menu.ingredients.items.${addon.id}`) }}
                      </AppHeading>
                      <AppText size="body-sm" class="text-neutral-20">
                        {{ addon.description }}
                      </AppText>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <AppText size="caption" class="text-neutral-20">
                      +{{ addon.calories }} {{ $t('menu.filters.calories') }}
                    </AppText>
                    <AppPrice :price="addon.price" size="sm" />
                  </div>
                </div>

                <!-- Add/Remove Toggle -->
                <div>
                  <BaseButton
                    :variant="isAddonSelected(addon.id) ? 'primary' : 'secondary'"
                    size="sm"
                    @click="toggleAddon(addon.id)"
                  >
                    <BaseIcon 
                      :name="isAddonSelected(addon.id) ? 'check' : 'plus'" 
                      size="sm" 
                      class="mr-2" 
                    />
                    {{ isAddonSelected(addon.id) ? $t('menu.ingredients.added') : $t('menu.ingredients.add') }}
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dietary Preferences -->
        <div>
          <AppHeading level="h2" size="heading-md" class="text-white mb-6">
            {{ $t('menu.filters.dietary') }}
          </AppHeading>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label
              v-for="preference in dietaryPreferences"
              :key="preference.id"
              class="flex items-center gap-3 p-4 bg-background-card rounded-xl cursor-pointer transition-colors"
              :class="{ 'border border-primary-green': selectedPreferences.includes(preference.id) }"
            >
              <input
                v-model="selectedPreferences"
                :value="preference.id"
                type="checkbox"
                class="sr-only"
              />
              <BaseIcon :name="preference.icon" size="md" :class="preference.iconColor" />
              <div class="flex-1">
                <AppText size="body-sm" class="text-white font-medium">
                  {{ preference.name }}
                </AppText>
                <AppText size="caption" class="text-neutral-20">
                  {{ preference.description }}
                </AppText>
              </div>
              <div 
                v-if="selectedPreferences.includes(preference.id)"
                class="w-6 h-6 bg-primary-green rounded-full flex items-center justify-center"
              >
                <BaseIcon name="check" size="sm" class="text-white" />
              </div>
            </label>
          </div>
        </div>

        <!-- Special Instructions -->
        <div>
          <AppHeading level="h2" size="heading-md" class="text-white mb-6">
            {{ $t('menu.ingredients.specialInstructions') }}
          </AppHeading>
          
          <div class="bg-background-card rounded-xl p-4">
            <BaseInput
              v-model="specialInstructions"
              :placeholder="$t('menu.ingredients.placeholder')"
              type="textarea"
              rows="4"
              class="w-full"
            />
            
            <!-- Quick Instructions -->
            <div class="mt-4">
              <AppText size="body-sm" class="text-neutral-20 mb-3">
                {{ $t('menu.ingredients.quickOptions') }}
              </AppText>
              <div class="flex flex-wrap gap-2">
                <BaseButton
                  v-for="quickInstruction in quickInstructions"
                  :key="quickInstruction"
                  variant="ghost"
                  size="sm"
                  class="border border-neutral-80/30"
                  @click="addQuickInstruction(quickInstruction)"
                >
                  {{ quickInstruction }}
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-12 pt-8 border-t border-neutral-80/20">
        <div class="flex flex-col sm:flex-row gap-4">
          <BaseButton 
            variant="primary"
            size="lg"
            class="flex-1"
            @click="saveCustomizations"
          >
            <BaseIcon name="check" size="sm" class="mr-2" />
            {{ $t('menu.ingredients.save', { price: formatPrice(totalPrice) }) }}
          </BaseButton>
          
          <BaseButton 
            variant="secondary"
            size="lg"
            @click="previewChanges"
          >
            <BaseIcon name="eye" size="sm" class="mr-2" />
            {{ $t('menu.ingredients.preview') }}
          </BaseButton>
          
          <BaseButton 
            variant="ghost"
            size="lg"
            @click="resetCustomizations"
          >
            {{ $t('menu.quantity_selector.reset') }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'

// Page setup
definePageMeta({
  title: 'Customize Ingredients'
})

// Route and stores
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// Reactive state
const loading = ref(true)
const ingredientLevels = ref<Record<string, string>>({})
const selectedAddons = ref<string[]>([])
const selectedPreferences = ref<string[]>([])
const specialInstructions = ref('')

// Get dish ID from route
const dishId = computed(() => route.params.id as string)

// Mock dish data
const dish = ref<MenuItem | null>(null)
const basePrice = ref(15.99)

// Mock ingredients data
const mainIngredients = ref([
  {
    id: 'beef-patty',
    name: 'Beef Patty',
    description: 'Premium ground beef patty',
    calories: 250,
    price: 0,
    icon: 'beef',
    iconColor: 'text-primary-red',
    options: [
      { value: 'none', label: 'No Patty', calories: 0, price: -3 },
      { value: 'single', label: 'Single', calories: 250, price: 0 },
      { value: 'double', label: 'Double', calories: 500, price: 4 }
    ]
  },
  {
    id: 'cheese',
    name: 'Cheese',
    description: 'Aged cheddar cheese',
    calories: 80,
    price: 0,
    icon: 'cheese',
    iconColor: 'text-primary-orange',
    options: [
      { value: 'none', label: 'No Cheese', calories: 0, price: -1 },
      { value: 'light', label: 'Light', calories: 40, price: 0 },
      { value: 'regular', label: 'Regular', calories: 80, price: 0 },
      { value: 'extra', label: 'Extra', calories: 160, price: 2 }
    ]
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    description: 'Fresh iceberg lettuce',
    calories: 5,
    price: 0,
    icon: 'leaf',
    iconColor: 'text-primary-green',
    options: [
      { value: 'none', label: 'No Lettuce', calories: 0, price: 0 },
      { value: 'light', label: 'Light', calories: 3, price: 0 },
      { value: 'regular', label: 'Regular', calories: 5, price: 0 },
      { value: 'extra', label: 'Extra', calories: 10, price: 0 }
    ]
  },
  {
    id: 'tomato',
    name: 'Tomato',
    description: 'Fresh tomato slices',
    calories: 10,
    price: 0,
    icon: 'tomato',
    iconColor: 'text-primary-red',
    options: [
      { value: 'none', label: 'No Tomato', calories: 0, price: 0 },
      { value: 'light', label: 'Light', calories: 5, price: 0 },
      { value: 'regular', label: 'Regular', calories: 10, price: 0 },
      { value: 'extra', label: 'Extra', calories: 20, price: 0 }
    ]
  }
])

const addOnIngredients = ref([
  {
    id: 'bacon',
    name: 'Bacon',
    description: 'Crispy bacon strips',
    calories: 120,
    price: 3.50,
    icon: 'bacon',
    iconColor: 'text-primary-red'
  },
  {
    id: 'avocado',
    name: 'Avocado',
    description: 'Fresh avocado slices',
    calories: 80,
    price: 2.00,
    icon: 'avocado',
    iconColor: 'text-primary-green'
  },
  {
    id: 'mushrooms',
    name: 'Mushrooms',
    description: 'Sautéed mushrooms',
    calories: 15,
    price: 1.50,
    icon: 'mushroom',
    iconColor: 'text-neutral-80'
  },
  {
    id: 'jalapenos',
    name: 'Jalapeños',
    description: 'Spicy jalapeño slices',
    calories: 5,
    price: 1.00,
    icon: 'pepper',
    iconColor: 'text-primary-red'
  },
  {
    id: 'onion-rings',
    name: 'Onion Rings',
    description: 'Crispy fried onion rings',
    calories: 150,
    price: 2.50,
    icon: 'onion',
    iconColor: 'text-primary-orange'
  },
  {
    id: 'extra-sauce',
    name: 'Extra Sauce',
    description: 'Additional special sauce',
    calories: 45,
    price: 0.50,
    icon: 'sauce',
    iconColor: 'text-primary-orange'
  }
])

const dietaryPreferences = ref([
  {
    id: 'no-gluten',
    name: 'Gluten Free',
    description: 'Use gluten-free bun',
    icon: 'shield',
    iconColor: 'text-primary-orange'
  },
  {
    id: 'no-dairy',
    name: 'Dairy Free',
    description: 'Remove all dairy products',
    icon: 'droplet-off',
    iconColor: 'text-primary-red'
  },
  {
    id: 'low-sodium',
    name: 'Low Sodium',
    description: 'Reduce salt content',
    icon: 'minus',
    iconColor: 'text-primary-green'
  },
  {
    id: 'extra-spicy',
    name: 'Extra Spicy',
    description: 'Add extra heat',
    icon: 'flame',
    iconColor: 'text-primary-red'
  }
])

const quickInstructions = ref([
  'Well done',
  'Medium rare',
  'No onions',
  'Extra crispy',
  'Light on sauce',
  'On the side'
])

// Computed
const customizedCalories = computed(() => {
  let calories = 0
  
  // Main ingredients
  mainIngredients.value.forEach(ingredient => {
    const level = ingredientLevels.value[ingredient.id] || 'regular'
    const option = ingredient.options.find(opt => opt.value === level)
    if (option) {
      calories += option.calories
    }
  })
  
  // Add-ons
  selectedAddons.value.forEach(addonId => {
    const addon = addOnIngredients.value.find(a => a.id === addonId)
    if (addon) {
      calories += addon.calories
    }
  })
  
  return calories
})

const customizationPrice = computed(() => {
  let price = 0
  
  // Main ingredients
  mainIngredients.value.forEach(ingredient => {
    const level = ingredientLevels.value[ingredient.id] || 'regular'
    const option = ingredient.options.find(opt => opt.value === level)
    if (option) {
      price += option.price
    }
  })
  
  // Add-ons
  selectedAddons.value.forEach(addonId => {
    const addon = addOnIngredients.value.find(a => a.id === addonId)
    if (addon) {
      price += addon.price
    }
  })
  
  return price
})

const totalPrice = computed(() => {
  return basePrice.value + customizationPrice.value
})

const activeCustomizations = computed(() => {
  let count = 0
  
  // Count ingredient level changes
  Object.keys(ingredientLevels.value).forEach(key => {
    if (ingredientLevels.value[key] !== 'regular') {
      count++
    }
  })
  
  // Count add-ons
  count += selectedAddons.value.length
  
  // Count dietary preferences
  count += selectedPreferences.value.length
  
  return count
})

// Methods
const loadDish = async () => {
  loading.value = true
  
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    dish.value = {
      id: dishId.value,
      name: 'Delicious Burger',
      description: 'A mouth-watering burger',
      price: basePrice.value,
      categoryId: 'fastfood',
      isActive: true
    }
    
    // Set default ingredient levels
    mainIngredients.value.forEach(ingredient => {
      ingredientLevels.value[ingredient.id] = 'regular'
    })
    
  } catch (error) {
    console.error('Error loading dish:', error)
  } finally {
    loading.value = false
  }
}

const getIngredientLevel = (ingredientId: string) => {
  return ingredientLevels.value[ingredientId] || 'regular'
}

const setIngredientLevel = (ingredientId: string, level: string) => {
  ingredientLevels.value[ingredientId] = level
}

const isAddonSelected = (addonId: string) => {
  return selectedAddons.value.includes(addonId)
}

const toggleAddon = (addonId: string) => {
  const index = selectedAddons.value.indexOf(addonId)
  if (index >= 0) {
    selectedAddons.value.splice(index, 1)
  } else {
    selectedAddons.value.push(addonId)
  }
}

const addQuickInstruction = (instruction: string) => {
  if (specialInstructions.value) {
    specialInstructions.value += ', ' + instruction
  } else {
    specialInstructions.value = instruction
  }
}

const resetCustomizations = () => {
  // Reset to defaults
  mainIngredients.value.forEach(ingredient => {
    ingredientLevels.value[ingredient.id] = 'regular'
  })
  selectedAddons.value = []
  selectedPreferences.value = []
  specialInstructions.value = ''
}

const previewChanges = () => {
  // Show preview modal or navigate to preview page
  console.log('Preview customizations:', {
    ingredientLevels: ingredientLevels.value,
    addons: selectedAddons.value,
    preferences: selectedPreferences.value,
    instructions: specialInstructions.value
  })
}

const saveCustomizations = () => {
  // Save customizations and return to dish page
  const customizations = {
    ingredientLevels: ingredientLevels.value,
    addons: selectedAddons.value,
    preferences: selectedPreferences.value,
    instructions: specialInstructions.value,
    totalPrice: totalPrice.value,
    calories: customizedCalories.value
  }
  
  // Pass customizations back to dish page
  router.push({
    path: `/dish/${dishId.value}`,
    query: { customized: 'true' }
  })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

// Initialize
onMounted(() => {
  loadDish()
})

// Update page title
watchEffect(() => {
  if (dish.value) {
    useHead({
      title: `Customize - ${dish.value.name} - Menu Ordering App`
    })
  }
})
</script>
