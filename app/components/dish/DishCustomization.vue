<template>
  <div class="space-y-6">
    <!-- Ingredients Section -->
    <DishIngredients
      v-if="dish.ingredients && dish.ingredients.length > 0"
      :ingredients="dish.ingredients"
      :selected-ingredients="selectedIngredients"
      @toggle="toggleIngredient"
    />

    <!-- Custom Options -->
    <div v-if="dish.customizations && dish.customizations.length > 0" class="space-y-4">
      <AppHeading level="h4" size="heading-md" class="text-white">
        Customize Your Dish
      </AppHeading>

      <div class="space-y-4">
        <CustomizationGroup
          v-for="group in dish.customizations"
          :key="group.id"
          :group="group"
          :selected="customizations[group.id]"
          @select="updateCustomization"
        />
      </div>
    </div>

    <!-- Size Options -->
    <div v-if="dish.sizes && dish.sizes.length > 1" class="space-y-4">
      <AppHeading level="h4" size="heading-md" class="text-white">
        Size
      </AppHeading>

      <div class="grid grid-cols-1 gap-2">
        <SizeOption
          v-for="size in dish.sizes"
          :key="size.id"
          :size="size"
          :selected="selectedSize === size.id"
          @select="selectedSize = size.id"
        />
      </div>
    </div>

    <!-- Special Instructions -->
    <div class="space-y-3">
      <AppHeading level="h4" size="heading-md" class="text-white">
        Special Instructions
      </AppHeading>
      <BaseInput
        v-model="specialInstructions"
        type="textarea"
        placeholder="Any special requests or modifications..."
        :rows="3"
        class="w-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MenuItem } from '~/types'

interface CustomizationGroup {
  id: string
  name: string
  type: 'single' | 'multiple'
  required: boolean
  options: CustomizationOption[]
}

interface CustomizationOption {
  id: string
  name: string
  price: number
  description?: string
}

interface Size {
  id: string
  name: string
  price: number
  description?: string
}

interface Props {
  dish: MenuItem
  selectedIngredients: string[]
  customizations: Record<string, any>
}

interface Emits {
  (e: 'ingredients-changed', ingredients: string[]): void
  (e: 'customizations-changed', customizations: Record<string, any>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedSize = ref<string>('')
const specialInstructions = ref('')

const toggleIngredient = (ingredientId: string) => {
  const newIngredients = [...props.selectedIngredients]
  const index = newIngredients.indexOf(ingredientId)
  
  if (index > -1) {
    newIngredients.splice(index, 1)
  } else {
    newIngredients.push(ingredientId)
  }
  
  emit('ingredients-changed', newIngredients)
}

const updateCustomization = (groupId: string, optionId: string, option: CustomizationOption) => {
  const newCustomizations = { ...props.customizations }
  
  // Find the group to determine if it's single or multiple selection
  const group = props.dish.customizations?.find(g => g.id === groupId)
  
  if (group?.type === 'single') {
    // Single selection - replace existing
    newCustomizations[groupId] = {
      optionId,
      option,
      price: option.price
    }
  } else {
    // Multiple selection - toggle
    if (!newCustomizations[groupId]) {
      newCustomizations[groupId] = []
    }
    
    const existingIndex = newCustomizations[groupId].findIndex((item: any) => item.optionId === optionId)
    
    if (existingIndex > -1) {
      newCustomizations[groupId].splice(existingIndex, 1)
    } else {
      newCustomizations[groupId].push({
        optionId,
        option,
        price: option.price
      })
    }
  }
  
  emit('customizations-changed', newCustomizations)
}

// Watch for size changes
watch(selectedSize, (newSize) => {
  if (newSize && props.dish.sizes) {
    const size = props.dish.sizes.find(s => s.id === newSize)
    if (size) {
      updateCustomization('size', newSize, {
        id: newSize,
        name: size.name,
        price: size.price - props.dish.price, // Price difference
        description: size.description
      })
    }
  }
})

// Watch for special instructions changes
watch(specialInstructions, (newInstructions) => {
  updateCustomization('special_instructions', 'instructions', {
    id: 'instructions',
    name: 'Special Instructions',
    price: 0,
    description: newInstructions
  })
})

// Initialize with default size if available
onMounted(() => {
  if (props.dish.sizes && props.dish.sizes.length > 0) {
    const defaultSize = props.dish.sizes.find(s => s.name.toLowerCase().includes('regular')) || props.dish.sizes[0]
    selectedSize.value = defaultSize.id
  }
})
</script>