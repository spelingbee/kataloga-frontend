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
            Choose Size & Type
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
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
        <AppText class="text-neutral-20">Loading options...</AppText>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="px-6 py-8">
      <!-- Current Selection Summary -->
      <div v-if="selectedOption" class="mb-8 p-4 bg-background-card rounded-xl border border-primary-green/30">
        <div class="flex items-center justify-between">
          <div>
            <AppText size="body-sm" class="text-neutral-20 mb-1">Current Selection</AppText>
            <AppHeading level="h3" size="heading-sm" class="text-white">
              {{ selectedOption.name }}
            </AppHeading>
            <AppText size="body-sm" class="text-neutral-20">
              {{ selectedOption.description }}
            </AppText>
          </div>
          <div class="text-right">
            <AppPrice :price="basePrice + selectedOption.price" size="lg" />
            <AppText size="caption" class="text-neutral-20">
              <span v-if="selectedOption.price > 0">+{{ formatPrice(selectedOption.price) }}</span>
              <span v-else>Base price</span>
            </AppText>
          </div>
        </div>
      </div>

      <!-- Size Options -->
      <div class="mb-8">
        <AppHeading level="h2" size="heading-md" class="text-white mb-6">
          Size Options
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="size in sizeOptions"
            :key="size.id"
            class="relative cursor-pointer group"
            @click="selectOption(size)"
          >
            <BaseCard 
              class="p-6 transition-all duration-300"
              :class="{
                'border-primary-green bg-primary-green/10': selectedOption?.id === size.id,
                'border-neutral-80/30 hover:border-primary-green/50': selectedOption?.id !== size.id
              }"
            >
              <!-- Size Image/Icon -->
              <div class="mb-4 text-center">
                <div 
                  class="w-16 h-16 mx-auto rounded-full bg-neutral-80/20 flex items-center justify-center mb-3"
                  :class="{ 'bg-primary-green/20': selectedOption?.id === size.id }"
                >
                  <BaseIcon 
                    :name="size.icon" 
                    :size="size.iconSize" 
                    :class="selectedOption?.id === size.id ? 'text-primary-green' : 'text-neutral-80'"
                  />
                </div>
                <AppHeading level="h3" size="heading-sm" class="text-white mb-1">
                  {{ size.name }}
                </AppHeading>
                <AppText size="body-sm" class="text-neutral-20">
                  {{ size.description }}
                </AppText>
              </div>

              <!-- Size Details -->
              <div class="space-y-2 mb-4">
                <div class="flex items-center justify-between">
                  <AppText size="caption" class="text-neutral-20">Serving Size</AppText>
                  <AppText size="caption" class="text-white">{{ size.servingSize }}</AppText>
                </div>
                <div class="flex items-center justify-between">
                  <AppText size="caption" class="text-neutral-20">Calories</AppText>
                  <AppText size="caption" class="text-white">{{ size.calories }} cal</AppText>
                </div>
                <div v-if="size.popular" class="flex items-center gap-1">
                  <FireIcon size="xs" />
                  <AppText size="caption" class="text-primary-orange">Most Popular</AppText>
                </div>
              </div>

              <!-- Price -->
              <div class="text-center">
                <AppPrice :price="basePrice + size.price" size="lg" />
                <AppText size="caption" class="text-neutral-20 mt-1">
                  <span v-if="size.price > 0">+{{ formatPrice(size.price) }} extra</span>
                  <span v-else>Base price</span>
                </AppText>
              </div>

              <!-- Selection Indicator -->
              <div 
                v-if="selectedOption?.id === size.id"
                class="absolute top-4 right-4 w-6 h-6 bg-primary-green rounded-full flex items-center justify-center"
              >
                <BaseIcon name="check" size="sm" class="text-white" />
              </div>
            </BaseCard>
          </div>
        </div>
      </div>

      <!-- Type Variations -->
      <div v-if="typeOptions.length > 0" class="mb-8">
        <AppHeading level="h2" size="heading-md" class="text-white mb-6">
          Type Variations
        </AppHeading>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="type in typeOptions"
            :key="type.id"
            class="cursor-pointer"
            @click="selectTypeOption(type)"
          >
            <BaseCard 
              class="p-4 flex items-center gap-4 transition-all duration-300"
              :class="{
                'border-primary-green bg-primary-green/10': selectedTypeOption?.id === type.id,
                'border-neutral-80/30 hover:border-primary-green/50': selectedTypeOption?.id !== type.id
              }"
            >
              <!-- Type Image -->
              <div class="w-16 h-16 bg-neutral-80/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <BaseIcon :name="type.icon" size="lg" class="text-neutral-80" />
              </div>

              <!-- Type Info -->
              <div class="flex-1">
                <AppHeading level="h4" size="heading-sm" class="text-white mb-1">
                  {{ type.name }}
                </AppHeading>
                <AppText size="body-sm" class="text-neutral-20 mb-2">
                  {{ type.description }}
                </AppText>
                <div class="flex items-center gap-4">
                  <AppPrice :price="type.price" size="sm" />
                  <AppText size="caption" class="text-neutral-20">
                    {{ type.calories }} cal
                  </AppText>
                </div>
              </div>

              <!-- Selection Indicator -->
              <div 
                v-if="selectedTypeOption?.id === type.id"
                class="w-6 h-6 bg-primary-green rounded-full flex items-center justify-center flex-shrink-0"
              >
                <BaseIcon name="check" size="sm" class="text-white" />
              </div>
            </BaseCard>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="mb-8 p-4 bg-background-card rounded-xl">
        <div class="flex items-start gap-3">
          <BaseIcon name="lightbulb" size="md" class="text-primary-orange mt-1" />
          <div>
            <AppHeading level="h4" size="heading-sm" class="text-white mb-2">
              Our Recommendation
            </AppHeading>
            <AppText size="body-sm" class="text-neutral-20">
              Most customers choose the <strong class="text-white">Medium size</strong> for the perfect balance of portion and value. 
              The <strong class="text-white">Classic preparation</strong> brings out the best flavors.
            </AppText>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4">
        <BaseButton 
          variant="primary"
          size="lg"
          class="flex-1"
          @click="confirmSelection"
          :disabled="!selectedOption"
        >
          <BaseIcon name="check" size="sm" class="mr-2" />
          Confirm Selection
        </BaseButton>
        
        <BaseButton 
          variant="secondary"
          size="lg"
          @click="resetSelection"
        >
          Reset
        </BaseButton>
        
        <BaseButton 
          variant="ghost"
          size="lg"
          @click="skipSelection"
        >
          Skip & Use Default
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from '~/types'

// Page setup
definePageMeta({
  title: 'Choose Size & Type - Menu Ordering App'
})

// Route and stores
const route = useRoute()
const router = useRouter()

// Reactive state
const loading = ref(true)
const selectedOption = ref<any>(null)
const selectedTypeOption = ref<any>(null)

// Get dish ID from route
const dishId = computed(() => route.params.id as string)

// Mock dish data
const dish = ref<MenuItem | null>(null)
const basePrice = ref(15.99)

// Size options
const sizeOptions = ref([
  {
    id: 'small',
    name: 'Small',
    description: 'Perfect for light appetite',
    price: 0,
    calories: 450,
    servingSize: '200g',
    icon: 'circle',
    iconSize: 'md',
    popular: false
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Most popular choice',
    price: 3.00,
    calories: 650,
    servingSize: '300g',
    icon: 'circle',
    iconSize: 'lg',
    popular: true
  },
  {
    id: 'large',
    name: 'Large',
    description: 'For hearty appetite',
    price: 6.00,
    calories: 850,
    servingSize: '400g',
    icon: 'circle',
    iconSize: 'xl',
    popular: false
  },
  {
    id: 'extra-large',
    name: 'Extra Large',
    description: 'Maximum satisfaction',
    price: 9.00,
    calories: 1050,
    servingSize: '500g',
    icon: 'circle',
    iconSize: '2xl',
    popular: false
  }
])

// Type options
const typeOptions = ref([
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional preparation',
    price: 0,
    calories: 650,
    icon: 'utensils'
  },
  {
    id: 'spicy',
    name: 'Spicy',
    description: 'With extra heat',
    price: 1.50,
    calories: 670,
    icon: 'flame'
  },
  {
    id: 'deluxe',
    name: 'Deluxe',
    description: 'Premium ingredients',
    price: 4.00,
    calories: 750,
    icon: 'star'
  }
])

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
    
    // Set default selection to most popular
    selectedOption.value = sizeOptions.value.find(opt => opt.popular) || sizeOptions.value[0]
    selectedTypeOption.value = typeOptions.value[0]
    
  } catch (error) {
    console.error('Error loading dish:', error)
  } finally {
    loading.value = false
  }
}

const selectOption = (option: any) => {
  selectedOption.value = option
}

const selectTypeOption = (option: any) => {
  selectedTypeOption.value = option
}

const resetSelection = () => {
  selectedOption.value = null
  selectedTypeOption.value = null
}

const skipSelection = () => {
  // Use default options and go back
  router.push(`/dish/${dishId.value}`)
}

const confirmSelection = () => {
  if (selectedOption.value) {
    // Pass selection back to main dish page
    const query = {
      size: selectedOption.value.id,
      type: selectedTypeOption.value?.id
    }
    router.push({
      path: `/dish/${dishId.value}`,
      query
    })
  }
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
      title: `Choose Size & Type - ${dish.value.name} - Menu Ordering App`
    })
  }
})
</script>