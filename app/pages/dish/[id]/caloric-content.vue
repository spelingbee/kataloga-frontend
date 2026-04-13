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
            Nutrition Information
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
        <AppText class="text-neutral-20">Loading nutrition information...</AppText>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="px-6 py-8">
      <!-- Calorie Overview -->
      <div class="mb-8 text-center">
        <div class="w-32 h-32 bg-primary-orange/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <div class="text-center">
            <FireIcon size="4xl" />
            <AppText size="body-sm" class="text-primary-orange mt-2">
              Calories
            </AppText>
          </div>
        </div>
        
        <AppText size="display-lg" class="text-primary-orange font-bold mb-2">
          {{ totalCalories }}
        </AppText>
        <AppText class="text-neutral-20">
          Total calories per serving
        </AppText>
      </div>

      <!-- Macronutrient Breakdown -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Macronutrient Breakdown
        </AppHeading>
        
        <!-- Macros Chart -->
        <div class="mb-6">
          <div class="relative h-4 bg-neutral-80/20 rounded-full overflow-hidden">
            <div 
              class="absolute top-0 left-0 h-full bg-primary-red"
              :style="{ width: `${proteinPercentage}%` }"
            />
            <div 
              class="absolute top-0 h-full bg-primary-orange"
              :style="{ left: `${proteinPercentage}%`, width: `${carbsPercentage}%` }"
            />
            <div 
              class="absolute top-0 h-full bg-primary-green"
              :style="{ left: `${proteinPercentage + carbsPercentage}%`, width: `${fatPercentage}%` }"
            />
          </div>
        </div>
        
        <!-- Macro Details -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-red/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BaseIcon name="activity" size="lg" class="text-primary-red" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ nutritionInfo.protein }}g</AppText>
            <AppText size="caption" class="text-neutral-20">Protein ({{ proteinPercentage }}%)</AppText>
            <AppText size="caption" class="text-primary-red">{{ proteinCalories }} calories</AppText>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-orange/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BaseIcon name="zap" size="lg" class="text-primary-orange" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ nutritionInfo.carbs }}g</AppText>
            <AppText size="caption" class="text-neutral-20">Carbs ({{ carbsPercentage }}%)</AppText>
            <AppText size="caption" class="text-primary-orange">{{ carbsCalories }} calories</AppText>
          </div>
          
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-green/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BaseIcon name="droplet" size="lg" class="text-primary-green" />
            </div>
            <AppText size="body-lg" class="text-white font-semibold">{{ nutritionInfo.fat }}g</AppText>
            <AppText size="caption" class="text-neutral-20">Fat ({{ fatPercentage }}%)</AppText>
            <AppText size="caption" class="text-primary-green">{{ fatCalories }} calories</AppText>
          </div>
        </div>
      </div>

      <!-- Detailed Nutrition Facts -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Detailed Nutrition Facts
        </AppHeading>
        
        <!-- Nutrition Table -->
        <div class="space-y-4">
          <div class="flex items-center justify-between py-2 border-b border-neutral-80/20">
            <AppText size="body-md" class="text-white font-semibold">
              Serving Size
            </AppText>
            <AppText size="body-md" class="text-neutral-20">
              1 portion ({{ servingSize }}g)
            </AppText>
          </div>
          
          <div class="flex items-center justify-between py-2 border-b border-neutral-80/20">
            <AppText size="body-md" class="text-white font-semibold">
              Calories
            </AppText>
            <AppText size="body-md" class="text-primary-orange font-bold">
              {{ totalCalories }}
            </AppText>
          </div>
          
          <div class="pl-4 space-y-2">
            <div class="flex items-center justify-between py-1">
              <AppText size="body-sm" class="text-neutral-20">
                Calories from Fat
              </AppText>
              <AppText size="body-sm" class="text-neutral-20">
                {{ fatCalories }}
              </AppText>
            </div>
          </div>
          
          <div class="flex items-center justify-between py-2 border-b border-neutral-80/20">
            <AppText size="body-md" class="text-white">
              Total Fat
            </AppText>
            <AppText size="body-md" class="text-white">
              {{ nutritionInfo.fat }}g
            </AppText>
          </div>
          
          <div class="pl-4 space-y-2">
            <div class="flex items-center justify-between py-1">
              <AppText size="body-sm" class="text-neutral-20">
                Saturated Fat
              </AppText>
              <AppText size="body-sm" class="text-neutral-20">
                {{ Math.round(nutritionInfo.fat * 0.3) }}g
              </AppText>
            </div>
            <div class="flex items-center justify-between py-1">
              <AppText size="body-sm" class="text-neutral-20">
                Trans Fat
              </AppText>
              <AppText size="body-sm" class="text-neutral-20">
                0g
              </AppText>
            </div>
          </div>
          
          <div class="flex items-center justify-between py-2 border-b border-neutral-80/20">
            <AppText size="body-md" class="text-white">
              Cholesterol
            </AppText>
            <AppText size="body-md" class="text-white">
              {{ cholesterol }}mg
            </AppText>
          </div>
          
          <div class="flex items-center justify-between py-2 border-b border-neutral-80/20">
            <AppText size="body-md" class="text-white">
              Sodium
            </AppText>
            <AppText size="body-md" class="text-white">
              {{ sodium }}mg
            </AppText>
          </div>
          
          <div class="flex items-center justify-between py-2 border-b border-neutral-80/20">
            <AppText size="body-md" class="text-white">
              Total Carbohydrates
            </AppText>
            <AppText size="body-md" class="text-white">
              {{ nutritionInfo.carbs }}g
            </AppText>
          </div>
          
          <div class="pl-4 space-y-2">
            <div class="flex items-center justify-between py-1">
              <AppText size="body-sm" class="text-neutral-20">
                Dietary Fiber
              </AppText>
              <AppText size="body-sm" class="text-neutral-20">
                {{ nutritionInfo.fiber || 0 }}g
              </AppText>
            </div>
            <div class="flex items-center justify-between py-1">
              <AppText size="body-sm" class="text-neutral-20">
                Total Sugars
              </AppText>
              <AppText size="body-sm" class="text-neutral-20">
                {{ nutritionInfo.sugar || 0 }}g
              </AppText>
            </div>
          </div>
          
          <div class="flex items-center justify-between py-2 border-b border-neutral-80/20">
            <AppText size="body-md" class="text-white">
              Protein
            </AppText>
            <AppText size="body-md" class="text-white">
              {{ nutritionInfo.protein }}g
            </AppText>
          </div>
        </div>
      </div>

      <!-- Vitamins & Minerals -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Vitamins & Minerals
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="vitamin in vitaminsAndMinerals"
            :key="vitamin.name"
            class="flex items-center justify-between py-2"
          >
            <AppText size="body-sm" class="text-neutral-20">
              {{ vitamin.name }}
            </AppText>
            <div class="text-right">
              <AppText size="body-sm" class="text-white">
                {{ vitamin.amount }}{{ vitamin.unit }}
              </AppText>
              <AppText size="caption" class="text-neutral-20">
                {{ vitamin.dailyValue }}% DV
              </AppText>
            </div>
          </div>
        </div>
      </div>

      <!-- Health Information -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Health Information
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Dietary Labels -->
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-3">Dietary Information</AppText>
            <div class="flex flex-wrap gap-2">
              <BaseBadge
                v-for="label in dietaryLabels"
                :key="label.name"
                :variant="label.variant"
                size="sm"
              >
                <BaseIcon :name="label.icon" size="xs" class="mr-1" />
                {{ label.name }}
              </BaseBadge>
            </div>
          </div>
          
          <!-- Health Metrics -->
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-3">Health Metrics</AppText>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <AppText size="body-sm" class="text-neutral-20">Calorie Density</AppText>
                <AppText size="body-sm" class="text-white">{{ caloriesPerGram }} cal/g</AppText>
              </div>
              <div class="flex items-center justify-between">
                <AppText size="body-sm" class="text-neutral-20">Protein Quality</AppText>
                <AppText size="body-sm" class="text-primary-green">High</AppText>
              </div>
              <div class="flex items-center justify-between">
                <AppText size="body-sm" class="text-neutral-20">Glycemic Impact</AppText>
                <AppText size="body-sm" class="text-primary-orange">Medium</AppText>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Daily Value Reference -->
      <div class="mb-8 p-4 bg-neutral-80/10 rounded-xl">
        <AppText size="caption" class="text-neutral-20">
          * Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.
        </AppText>
      </div>

      <!-- Comparison Tools -->
      <div class="mb-8 bg-background-card rounded-xl p-6">
        <AppHeading level="h3" size="heading-md" class="text-white mb-6">
          Compare with Similar Items
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="comparison in comparisonItems"
            :key="comparison.name"
            class="p-4 border border-neutral-80/30 rounded-lg"
          >
            <AppText size="body-sm" class="text-white font-medium mb-2">
              {{ comparison.name }}
            </AppText>
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <AppText size="caption" class="text-neutral-20">Calories</AppText>
                <AppText size="caption" class="text-white">{{ comparison.calories }}</AppText>
              </div>
              <div class="flex items-center justify-between">
                <AppText size="caption" class="text-neutral-20">Protein</AppText>
                <AppText size="caption" class="text-white">{{ comparison.protein }}g</AppText>
              </div>
              <div class="flex items-center justify-between">
                <AppText size="caption" class="text-neutral-20">Fat</AppText>
                <AppText size="caption" class="text-white">{{ comparison.fat }}g</AppText>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4">
        <BaseButton 
          variant="primary"
          size="lg"
          class="flex-1"
          @click="$router.push(`/dish/${dishId}`)"
        >
          <BaseIcon name="arrow-left" size="sm" class="mr-2" />
          Back to Dish
        </BaseButton>
        
        <BaseButton 
          variant="secondary"
          size="lg"
          @click="shareNutritionInfo"
        >
          <BaseIcon name="share" size="sm" class="mr-2" />
          Share Info
        </BaseButton>
        
        <BaseButton 
          variant="ghost"
          size="lg"
          @click="downloadNutritionPDF"
        >
          <BaseIcon name="download" size="sm" class="mr-2" />
          Download PDF
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem, NutritionInfo } from '~/types'

// Page setup
definePageMeta({
  title: 'Nutrition Information - Menu Ordering App'
})

// Route and stores
const route = useRoute()
const router = useRouter()

// Reactive state
const loading = ref(true)

// Get dish ID from route
const dishId = computed(() => route.params.id as string)

// Mock dish data
const dish = ref<MenuItem | null>(null)

// Mock nutrition data
const nutritionInfo = ref<NutritionInfo>({
  calories: 650,
  protein: 35,
  carbs: 45,
  fat: 28,
  fiber: 4,
  sugar: 8
})

const servingSize = ref(350) // grams
const cholesterol = ref(85) // mg
const sodium = ref(1200) // mg

const vitaminsAndMinerals = ref([
  { name: 'Vitamin A', amount: 150, unit: 'mcg', dailyValue: 17 },
  { name: 'Vitamin C', amount: 12, unit: 'mg', dailyValue: 13 },
  { name: 'Calcium', amount: 250, unit: 'mg', dailyValue: 19 },
  { name: 'Iron', amount: 4.2, unit: 'mg', dailyValue: 23 },
  { name: 'Potassium', amount: 580, unit: 'mg', dailyValue: 12 },
  { name: 'Magnesium', amount: 45, unit: 'mg', dailyValue: 11 }
])

const dietaryLabels = ref([
  { name: 'High Protein', icon: 'activity', variant: 'success' },
  { name: 'Contains Gluten', icon: 'alert-triangle', variant: 'warning' },
  { name: 'Contains Dairy', icon: 'droplet', variant: 'warning' },
  { name: 'No Trans Fat', icon: 'check-circle', variant: 'success' }
])

const comparisonItems = ref([
  { name: 'Chicken Burger', calories: 580, protein: 32, fat: 24 },
  { name: 'Veggie Burger', calories: 420, protein: 18, fat: 16 },
  { name: 'Fish Burger', calories: 520, protein: 28, fat: 22 }
])

// Computed
const totalCalories = computed(() => nutritionInfo.value.calories)

const proteinCalories = computed(() => nutritionInfo.value.protein * 4)
const carbsCalories = computed(() => nutritionInfo.value.carbs * 4)
const fatCalories = computed(() => nutritionInfo.value.fat * 9)

const proteinPercentage = computed(() => 
  Math.round((proteinCalories.value / totalCalories.value) * 100)
)
const carbsPercentage = computed(() => 
  Math.round((carbsCalories.value / totalCalories.value) * 100)
)
const fatPercentage = computed(() => 
  Math.round((fatCalories.value / totalCalories.value) * 100)
)

const caloriesPerGram = computed(() => 
  (totalCalories.value / servingSize.value).toFixed(1)
)

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
      categoryId: 'fastfood',
      isActive: true,
      calories: totalCalories.value,
      nutritionInfo: nutritionInfo.value
    }
    
  } catch (error) {
    console.error('Error loading dish:', error)
  } finally {
    loading.value = false
  }
}

const shareNutritionInfo = () => {
  if (navigator.share && dish.value) {
    navigator.share({
      title: `Nutrition Info - ${dish.value.name}`,
      text: `${dish.value.name}: ${totalCalories.value} calories, ${nutritionInfo.value.protein}g protein`,
      url: window.location.href
    })
  } else {
    // Fallback: copy to clipboard
    const nutritionText = `${dish.value?.name}: ${totalCalories.value} calories, ${nutritionInfo.value.protein}g protein, ${nutritionInfo.value.carbs}g carbs, ${nutritionInfo.value.fat}g fat`
    navigator.clipboard.writeText(nutritionText)
  }
}

const downloadNutritionPDF = () => {
  // Mock PDF download functionality
  console.log('Downloading nutrition PDF...')
  // In a real app, this would generate and download a PDF
}

// Initialize
onMounted(() => {
  loadDish()
})

// Update page title
watchEffect(() => {
  if (dish.value) {
    useHead({
      title: `Nutrition Info - ${dish.value.name} - Menu Ordering App`
    })
  }
})
</script>
