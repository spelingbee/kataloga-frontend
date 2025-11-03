<template>
  <div 
    :class="[
      'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
      selected 
        ? 'bg-primary-red/20 border border-primary-red' 
        : 'bg-background-dark/30 hover:bg-background-dark/50 border border-transparent'
    ]"
    @click="$emit('select')"
  >
    <!-- Option Info -->
    <div class="flex-1">
      <div class="flex items-center space-x-2">
        <AppText size="body-md" class="text-white font-medium">
          {{ option.name }}
        </AppText>
        <BaseBadge
          v-if="option.price > 0"
          variant="secondary"
          size="xs"
        >
          +{{ formatPrice(option.price) }}
        </BaseBadge>
        <BaseBadge
          v-else-if="option.price < 0"
          variant="success"
          size="xs"
        >
          {{ formatPrice(option.price) }}
        </BaseBadge>
      </div>
      
      <AppText 
        v-if="option.description"
        size="body-sm" 
        class="text-neutral-20 mt-1"
      >
        {{ option.description }}
      </AppText>
    </div>

    <!-- Selection Indicator -->
    <div class="ml-3">
      <!-- Radio button for single selection -->
      <div 
        v-if="selectionType === 'single'"
        :class="[
          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
          selected 
            ? 'border-primary-red bg-primary-red' 
            : 'border-neutral-20/40'
        ]"
      >
        <div 
          v-if="selected"
          class="w-2 h-2 bg-white rounded-full"
        />
      </div>

      <!-- Checkbox for multiple selection -->
      <div 
        v-else
        :class="[
          'w-5 h-5 rounded border-2 flex items-center justify-center',
          selected 
            ? 'border-primary-red bg-primary-red' 
            : 'border-neutral-20/40'
        ]"
      >
        <BaseIcon 
          v-if="selected"
          name="check" 
          size="xs" 
          class="text-white"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CustomizationOption {
  id: string
  name: string
  price: number
  description?: string
}

interface Props {
  option: CustomizationOption
  selected: boolean
  selectionType: 'single' | 'multiple'
}

interface Emits {
  (e: 'select'): void
}

defineProps<Props>()
defineEmits<Emits>()

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}
</script>