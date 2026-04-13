<template>
  <div 
    class="ingredient-selector"
    :class="{ 'ingredient-selector--selected': isSelected }"
    @click="handleToggle"
  >
    <!-- Ingredient Info -->
    <div class="ingredient-selector__info">
      <div class="ingredient-selector__title-row">
        <AppText font-weight="medium" class="ingredient-selector__name">
          {{ ingredient.name }}
        </AppText>
        <div class="ingredient-selector__badges">
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
      </div>
      
      <AppText 
        v-if="ingredient.description"
        size="body-sm" 
        class="ingredient-selector__description"
      >
        {{ ingredient.description }}
      </AppText>

      <!-- Allergen Warning -->
      <div 
        v-if="ingredient.allergens && ingredient.allergens.length > 0"
        class="ingredient-selector__allergens"
      >
        <BaseIcon name="alert-triangle" size="xs" />
        <AppText size="caption">
          Contains: {{ ingredient.allergens.join(', ') }}
        </AppText>
      </div>
    </div>

    <!-- Toggle Switch -->
    <div class="ingredient-selector__action">
      <BaseToggle
        :model-value="isSelected"
        :disabled="!ingredient.isOptional && ingredient.isDefault"
        @update:model-value="handleToggle"
      />
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
  ingredient: Ingredient
  selected: boolean
}

interface Emits {
  (e: 'toggle', ingredientId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isSelected = computed(() => {
  if (props.ingredient.isDefault) {
    return props.selected !== false
  }
  return props.selected
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

const handleToggle = () => {
  if (!props.ingredient.isOptional && props.ingredient.isDefault) {
    return
  }
  emit('toggle', props.ingredient.id)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/transitions' as *;

.ingredient-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  background: var(--bg-secondary);
  border-radius: $radius-lg;
  border: 1px solid var(--border-primary);
  transition: all $transition-base;
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
    background: var(--bg-tertiary);
  }

  &--selected {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.05);
  }
}

.ingredient-selector__info {
  flex: 1;
}

.ingredient-selector__title-row {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.ingredient-selector__name {
  color: var(--text-primary);
}

.ingredient-selector__badges {
  display: flex;
  gap: $space-1;
}

.ingredient-selector__description {
  color: var(--text-tertiary);
  margin-top: 2px;
}

.ingredient-selector__allergens {
  display: flex;
  align-items: center;
  gap: $space-1;
  margin-top: $space-1;
  color: var(--color-warning);

  i {
    color: inherit;
  }
}

.ingredient-selector__action {
  margin-left: $space-4;
}
</style>
