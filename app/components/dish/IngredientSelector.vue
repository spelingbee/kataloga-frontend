<template>
  <div class="flex items-center justify-between p-3 bg-background-dark/30 rounded-lg hover:bg-background-dark/50 transition-colors">
    <!-- Ingredient Info -->
    <div class="flex-1">
      <div class="flex items-center space-x-2">
        <AppText size="body-md" class="text-white font-medium">
          {{ ingredient.name }}
        </AppText>
        <BaseBadge
          v-if="ingredient.isDefault"
          variant="success"
          size="sm"
        >
          Default
        </BaseBadge>
        <BaseBadge
          v-if="ingredient.price && ingredient.price > 0"
          variant="secondary"
          size="sm"
        >
          +{{ formatPrice(ingredient.price) }}
        </BaseBadge>
      </div>
      
      <AppText 
        v-if="ingredient.description"
        size="body-sm" 
        class="text-neutral-20 mt-1"
      >
        {{ ingredient.description }}
      </AppText>

      <!-- Allergen Warning -->
      <div 
        v-if="ingredient.allergens && ingredient.allergens.length > 0"
        class="flex items-center space-x-1 mt-2"
      >
        <BaseIcon name="alert-triangle" size="xs" class="text-primary-orange" />
        <AppText size="caption" class="text-primary-orange">
          Contains: {{ ingredient.allergens.join(', ') }}
        </AppText>
      </div>
    </div>

    <!-- Toggle Switch -->
    <BaseToggle
      :checked="getToggleState()"
      :state="getToggleVisualState()"
      :disabled="!ingredient.isOptional && ingredient.isDefault"
      @toggle="handleToggle"
    />
  </div>
</template>

<script setup lang="ts">
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
  ingredient: Ingredient
  selected: boolean
}

interface Emits {
  (e: 'toggle', ingredientId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

const getToggleState = () => {
  // If it's a default ingredient, it's selected unless explicitly deselected
  if (props.ingredient.isDefault) {
    return props.selected !== false
  }
  // For optional ingredients, use the selected state
  return props.selected
}

const getToggleVisualState = () => {
  if (!props.ingredient.isOptional && props.ingredient.isDefault) {
    return 'disabled'
  }
  
  if (props.ingredient.isDefault) {
    return props.selected !== false ? 'default' : 'lower'
  }
  
  return props.selected ? 'pressed' : 'default'
}

const handleToggle = () => {
  // Don't allow toggling required default ingredients
  if (!props.ingredient.isOptional && props.ingredient.isDefault) {
    return
  }
  
  emit('toggle', props.ingredient.id)
}
</script>