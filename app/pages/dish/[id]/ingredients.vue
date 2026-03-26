<template>
  <div class="min-h-screen bg-background-dark">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-neutral-80/20">
      <div class="flex items-center gap-4">
        <BaseButton 
          variant="ghost" 
          @click="router.go(-1)"
        >
          <BaseIcon name="arrow-left" size="md" />
        </BaseButton>
        <div>
          <AppHeading level="h1" size="heading-lg" class="text-white">
            Ingredients
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
        <AppText class="text-neutral-20">Loading ingredients...</AppText>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="px-6 py-8">
      <!-- Dish Summary -->
      <div class="mb-8 p-4 bg-background-card rounded-xl">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-neutral-80/20 rounded-full flex items-center justify-center">
            <BaseIcon name="utensils" size="lg" class="text-neutral-80" />
          </div>
          <div class="flex-1">
            <AppHeading level="h3" size="heading-md" class="text-white mb-1">
              {{ dish?.name }}
            </AppHeading>
            <AppText size="body-sm" class="text-neutral-20">
              {{ ingredients.length }} ingredients • {{ totalCalories }} calories
            </AppText>
          </div>
          <div class="text-right">
            <AppPrice :price="dish?.price || 0" size="lg" />
          </div>
        </div>
      </div>

      <!-- Filter Options -->
      <div class="mb-6">
        <div class="flex flex-wrap gap-2">
          <BaseButton
            :variant="activeFilter === 'all' ? 'primary' : 'secondary'"
            size="sm"
            @click="setFilter('all')"
          >
            All Ingredients
          </BaseButton>
          <BaseButton
            :variant="activeFilter === 'main' ? 'primary' : 'secondary'"
            size="sm"
            @click="setFilter('main')"
          >
            Main Ingredients
          </BaseButton>
          <BaseButton
            :variant="activeFilter === 'allergens' ? 'primary' : 'secondary'"
            size="sm"
            @click="setFilter('allergens')"
          >
            Allergens
          </BaseButton>
          <BaseButton
            :variant="activeFilter === 'optional' ? 'primary' : 'secondary'"
            size="sm"
            @click="setFilter('optional')"
          >
            Optional
          </BaseButton>
        </div>
      </div>

      <!-- Ingredients List -->
      <div class="space-y-4 mb-8">
        <div
          v-for="ingredient in filteredIngredients"
          :key="ingredient.id"
          class="bg-background-card rounded-xl p-4"
        >
          <div class="flex items-start gap-4">
            <!-- Ingredient Image/Icon -->
            <div class="w-12 h-12 bg-neutral-80/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <BaseIcon :name="ingredient.icon" size="md" :class="ingredient.iconColor" />
            </div>

            <!-- Ingredient Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <AppHeading level="h4" size="heading-sm" class="text-white mb-1">
                    {{ ingredient.name }}
                  </AppHeading>
                  <AppText size="body-sm" class="text-neutral-20">
                    {{ ingredient.description }}
                  </AppText>
                </div>
                
                <!-- Badges -->
                <div class="flex flex-wrap gap-1 ml-4">
                  <BaseBadge
                    v-if="ingredient.isAllergen"
                    variant="warning"
                    size="sm"
                  >
                    <BaseIcon name="alert-triangle" size="xs" class="mr-1" />
                    Allergen
                  </BaseBadge>
                  <BaseBadge
                    v-if="ingredient.isOptional"
                    variant="secondary"
                    size="sm"
                  >
                    Optional
                  </BaseBadge>
                  <BaseBadge
                    v-if="ingredient.isOrganic"
                    variant="success"
                    size="sm"
                  >
                    <BaseIcon name="leaf" size="xs" class="mr-1" />
                    Organic
                  </BaseBadge>
                </div>
              </div>

              <!-- Nutrition Info -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <AppText size="caption" class="text-neutral-20">Calories</AppText>
                  <AppText size="body-sm" class="text-white">{{ ingredient.calories }}</AppText>
                </div>
                <div v-if="ingredient.protein">
                  <AppText size="caption" class="text-neutral-20">Protein</AppText>
                  <AppText size="body-sm" class="text-white">{{ ingredient.protein }}g</AppText>
                </div>
                <div v-if="ingredient.carbs">
                  <AppText size="caption" class="text-neutral-20">Carbs</AppText>
                  <AppText size="body-sm" class="text-white">{{ ingredient.carbs }}g</AppText>
                </div>
                <div v-if="ingredient.fat">
                  <AppText size="caption" class="text-neutral-20">Fat</AppText>
                  <AppText size="body-sm" class="text-white">{{ ingredient.fat }}g</AppText>
                </div>
              </div>

              <!-- Source Info -->
              <div v-if="ingredient.source" class="flex items-center gap-2">
                <BaseIcon name="map-pin" size="sm" class="text-neutral-80" />
                <AppText size="caption" class="text-neutral-20">
                  Source: {{ ingredient.source }}
                </AppText>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Allergen Warning -->
      <div v-if="allergenIngredients.length > 0" class="mb-8 p-4 bg-primary-red/10 border border-primary-red/30 rounded-xl">
        <div class="flex items-start gap-3">
          <BaseIcon name="alert-triangle" size="md" class="text-primary-red mt-1" />
          <div>
            <AppHeading level="h4" size="heading-sm" class="text-white mb-2">
              Allergen Information
            </AppHeading>
            <AppText size="body-sm" class="text-neutral-20 mb-3">
              This dish contains the following allergens:
            </AppText>
            <div class="flex flex-wrap gap-2">
              <BaseBadge
                v-for="allergen in allergenIngredients"
                :key="allergen.id"
                variant="warning"
                size="sm"
              >
                {{ allergen.name }}
              </BaseBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Nutritional Summary -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-4">
          Nutritional Summary
        </AppHeading>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-orange/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <FireIcon size="lg" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ totalCalories }}</AppText>
            <AppText size="caption" class="text-neutral-20">Calories</AppText>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-green/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <BaseIcon name="activity" size="lg" class="text-primary-green" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ totalProtein }}g</AppText>
            <AppText size="caption" class="text-neutral-20">Protein</AppText>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-red/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <BaseIcon name="zap" size="lg" class="text-primary-red" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ totalCarbs }}g</AppText>
            <AppText size="caption" class="text-neutral-20">Carbs</AppText>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-neutral-80/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <BaseIcon name="droplet" size="lg" class="text-neutral-80" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ totalFat }}g</AppText>
            <AppText size="caption" class="text-neutral-20">Fat</AppText>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4">
        <NuxtLink :to="`/dish/${dishId}/change-ingredients`" class="flex-1">
          <BaseButton variant="primary" size="lg" class="w-full">
            <BaseIcon name="edit" size="sm" class="mr-2" />
            Customize Ingredients
          </BaseButton>
        </NuxtLink>
        
        <BaseButton 
          variant="secondary"
          size="lg"
          @click="router.push(`/dish/${dishId}`)"
        >
          Back to Dish
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItemUI } from '~/types/ui'

// Page setup
definePageMeta({
  title: 'Ingredients - Menu Ordering App'
})

// Route and stores
const route = useRoute()
const router = useRouter()

// Reactive state
const loading = ref(true)
const activeFilter = ref('all')

// Get dish ID from route
const dishId = computed(() => route.params.id as string)

// Mock dish data
const dish = ref<MenuItemUI | null>(null)

// Mock ingredients data
const ingredients = ref([
  {
    id: '1',
    name: 'Beef Patty',
    description: 'Premium ground beef, 100% grass-fed',
    calories: 250,
    protein: 20,
    carbs: 0,
    fat: 18,
    isMain: true,
    isAllergen: false,
    isOptional: false,
    isOrganic: true,
    source: 'Local Farm, Texas',
    icon: 'beef',
    iconColor: 'text-primary-red'
  },
  {
    id: '2',
    name: 'Sesame Bun',
    description: 'Freshly baked brioche bun with sesame seeds',
    calories: 150,
    protein: 5,
    carbs: 28,
    fat: 3,
    isMain: true,
    isAllergen: true,
    isOptional: false,
    isOrganic: false,
    source: 'Local Bakery',
    icon: 'bread',
    iconColor: 'text-primary-orange'
  },
  {
    id: '3',
    name: 'Cheddar Cheese',
    description: 'Aged cheddar cheese slice',
    calories: 80,
    protein: 5,
    carbs: 1,
    fat: 6,
    isMain: true,
    isAllergen: true,
    isOptional: false,
    isOrganic: false,
    source: 'Wisconsin Dairy',
    icon: 'cheese',
    iconColor: 'text-primary-orange'
  },
  {
    id: '4',
    name: 'Lettuce',
    description: 'Fresh iceberg lettuce leaves',
    calories: 5,
    protein: 0,
    carbs: 1,
    fat: 0,
    isMain: false,
    isAllergen: false,
    isOptional: true,
    isOrganic: true,
    source: 'Organic Farm, California',
    icon: 'leaf',
    iconColor: 'text-primary-green'
  },
  {
    id: '5',
    name: 'Tomato',
    description: 'Ripe tomato slices',
    calories: 10,
    protein: 0,
    carbs: 2,
    fat: 0,
    isMain: false,
    isAllergen: false,
    isOptional: true,
    isOrganic: true,
    source: 'Local Greenhouse',
    icon: 'tomato',
    iconColor: 'text-primary-red'
  },
  {
    id: '6',
    name: 'Red Onion',
    description: 'Thinly sliced red onion',
    calories: 8,
    protein: 0,
    carbs: 2,
    fat: 0,
    isMain: false,
    isAllergen: false,
    isOptional: true,
    isOrganic: false,
    source: 'Regional Supplier',
    icon: 'onion',
    iconColor: 'text-neutral-80'
  },
  {
    id: '7',
    name: 'Special Sauce',
    description: 'Our signature burger sauce with herbs and spices',
    calories: 45,
    protein: 0,
    carbs: 3,
    fat: 4,
    isMain: false,
    isAllergen: true,
    isOptional: false,
    isOrganic: false,
    source: 'House Made',
    icon: 'sauce',
    iconColor: 'text-primary-orange'
  },
  {
    id: '8',
    name: 'Pickles',
    description: 'Crispy dill pickle slices',
    calories: 2,
    protein: 0,
    carbs: 0,
    fat: 0,
    isMain: false,
    isAllergen: false,
    isOptional: true,
    isOrganic: false,
    source: 'Local Producer',
    icon: 'pickle',
    iconColor: 'text-primary-green'
  }
])

// Computed
const filteredIngredients = computed(() => {
  switch (activeFilter.value) {
    case 'main':
      return ingredients.value.filter(ing => ing.isMain)
    case 'allergens':
      return ingredients.value.filter(ing => ing.isAllergen)
    case 'optional':
      return ingredients.value.filter(ing => ing.isOptional)
    default:
      return ingredients.value
  }
})

const allergenIngredients = computed(() => {
  return ingredients.value.filter(ing => ing.isAllergen)
})

const totalCalories = computed(() => {
  return ingredients.value.reduce((total, ing) => total + ing.calories, 0)
})

const totalProtein = computed(() => {
  return ingredients.value.reduce((total, ing) => total + (ing.protein || 0), 0)
})

const totalCarbs = computed(() => {
  return ingredients.value.reduce((total, ing) => total + (ing.carbs || 0), 0)
})

const totalFat = computed(() => {
  return ingredients.value.reduce((total, ing) => total + (ing.fat || 0), 0)
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
      price: 15.99,
      imageUrl: undefined,
      categoryId: 'fastfood',
      menuId: 'default-menu',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAvailable: true,
      stockQuantity: 100,
      calories: totalCalories.value,
      preparationTime: null,
      cookingTime: null,
      ingredients: [],
      allergens: [],
      nutritionInfo: null,
      dietary: [],
      badges: [],
      modifierGroups: [],
      isNew: false,
      isPopular: false,
      category: null
    }
    
  } catch (error) {
    console.error('Error loading dish:', error)
  } finally {
    loading.value = false
  }
}

const setFilter = (filter: string) => {
  activeFilter.value = filter
}

// Initialize
onMounted(() => {
  loadDish()
})

// Update page title
watchEffect(() => {
  if (dish.value) {
    useHead({
      title: `Ingredients - ${dish.value.name} - Menu Ordering App`
    })
  }
})
</script>