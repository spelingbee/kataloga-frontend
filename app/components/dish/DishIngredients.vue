<template>
  <div class="space-y-4">
    <AppHeading level="h4" size="heading-md" class="text-white">
      Ingredients
    </AppHeading>
    
    <div class="space-y-3">
      <IngredientSelector
        v-for="ingredient in ingredients"
        :key="ingredient.id"
        :ingredient="ingredient"
        :selected="selectedIngredients.includes(ingredient.id)"
        @toggle="toggleIngredient"
      />
    </div>

    <!-- Ingredient Summary -->
    <div v-if="selectedIngredients.length > 0" class="mt-4 p-3 bg-background-dark/50 rounded-lg">
      <AppText size="body-sm" class="text-neutral-20">
        Selected: {{ selectedIngredientsText }}
      </AppText>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Ingredient {
  id: string
  name: string
  description?: string
  isDefault: boolean
  isOptional: boolean
  price?: number
  allergens?: string[]
}

interface Props {
  ingredients: Ingredient[]
  selectedIngredients: string[]
}

interface Emits {
  (e: 'toggle', ingredientId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedIngredientsText = computed(() => {
  const selectedNames = props.ingredients
    .filter(ingredient => props.selectedIngredients.includes(ingredient.id))
    .map(ingredient => ingredient.name)
  
  return selectedNames.join(', ')
})

const toggleIngredient = (ingredientId: string) => {
  emit('toggle', ingredientId)
}
</script>