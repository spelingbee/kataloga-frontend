<template>
  <div class="dish-ingredients">
    <div class="dish-ingredients__list">
      <IngredientSelector
        v-for="(ingredient, index) in mappedIngredients"
        :key="index"
        :ingredient="ingredient"
        :selected="selectedIngredients.includes(ingredient.id)"
        @toggle="toggleIngredient"
      />
    </div>

    <!-- Ingredient Summary -->
    <div v-if="selectedIngredients.length > 0" class="dish-ingredients__summary">
      <AppText size="body-sm">
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
  ingredients: (Ingredient | string)[]
  selectedIngredients: string[]
}

interface Emits {
  (e: 'toggle', ingredientId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const mappedIngredients = computed<Ingredient[]>(() => {
  return props.ingredients.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `ing-${index}`,
        name: item,
        isDefault: true,
        isOptional: true
      }
    }
    return item
  })
})

const selectedIngredientsText = computed(() => {
  const selectedNames = mappedIngredients.value
    .filter(ingredient => props.selectedIngredients.includes(ingredient.id))
    .map(ingredient => ingredient.name)
  
  return selectedNames.join(', ')
})

const toggleIngredient = (ingredientId: string) => {
  emit('toggle', ingredientId)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;

.dish-ingredients {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.dish-ingredients__list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.dish-ingredients__summary {
  padding: $space-3;
  background: var(--bg-secondary);
  border-radius: $radius-md;
  color: var(--text-secondary);
}
</style>
