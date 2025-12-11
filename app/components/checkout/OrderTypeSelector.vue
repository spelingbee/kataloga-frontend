<template>
  <div class="order-type-selector">
    <h3 class="order-type-selector__title">How would you like to receive your order?</h3>
    
    <div class="order-type-selector__options">
      <button
        v-for="type in orderTypes"
        :key="type.value"
        class="order-type-selector__option"
        :class="{ 'order-type-selector__option--active': modelValue === type.value }"
        @click="selectType(type.value)"
      >
        <div class="order-type-selector__option-icon">
          <BaseIcon :name="type.icon" size="xl" />
        </div>
        <div class="order-type-selector__option-content">
          <h4 class="order-type-selector__option-title">{{ type.title }}</h4>
          <p class="order-type-selector__option-description">{{ type.description }}</p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type OrderType = 'delivery' | 'pickup' | 'dine-in'

interface Props {
  modelValue: OrderType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: OrderType]
}>()

const orderTypes = computed(() => [
  {
    value: 'delivery' as OrderType,
    icon: 'truck',
    title: 'Delivery',
    description: 'Get it delivered to your address'
  },
  {
    value: 'pickup' as OrderType,
    icon: 'store',
    title: 'Pickup',
    description: 'Pick up from restaurant'
  },
  {
    value: 'dine-in' as OrderType,
    icon: 'utensils',
    title: 'Dine-in',
    description: 'Order for your table'
  }
])

const selectType = (type: OrderType) => {
  emit('update:modelValue', type)
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.order-type-selector {
  width: 100%;
}

.order-type-selector__title {
  font-size: $text-lg;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-6;
  text-align: center;
}

.order-type-selector__options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $space-4;
}

.order-type-selector__option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-6;
  background: var(--bg-primary);
  border: 2px solid var(--border-primary);
  border-radius: $radius-card;
  cursor: pointer;
  transition: $transition-card;
  text-align: center;
  min-height: $touch-target-min;
  box-shadow: $shadow-sm;

  &:hover {
    border-color: var(--color-primary);
    background: rgba(255, 107, 53, 0.05);
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.order-type-selector__option--active {
  border-color: var(--color-primary);
  background: rgba(255, 107, 53, 0.1);
  box-shadow: $shadow-md;

  .order-type-selector__option-icon {
    color: var(--color-primary);
  }

  .order-type-selector__option-title {
    color: var(--color-primary);
  }
}

.order-type-selector__option-icon {
  margin-bottom: $space-4;
  color: var(--text-secondary);
  transition: $transition-color;
}

.order-type-selector__option-content {
  width: 100%;
}

.order-type-selector__option-title {
  font-size: $text-base;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin-bottom: $space-1;
  transition: $transition-color;
}

.order-type-selector__option-description {
  font-size: $text-sm;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .order-type-selector__options {
    grid-template-columns: 1fr;
  }

  .order-type-selector__option {
    flex-direction: row;
    text-align: left;
    gap: $space-4;
  }

  .order-type-selector__option-icon {
    margin-bottom: 0;
  }
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .order-type-selector__option {
    transition: none;
    
    &:hover {
      transform: none;
    }
  }
}
</style>
