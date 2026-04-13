<template>
  <div 
    :class="[
      'flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors',
      selected 
        ? 'bg-primary-red/20 border border-primary-red' 
        : 'bg-background-dark/30 hover:bg-background-dark/50 border border-transparent'
    ]"
    @click="$emit('select')"
  >
    <!-- Size Info -->
    <div class="flex-1">
      <div class="flex items-center space-x-2">
        <AppText size="body-lg" class="text-white font-medium">
          {{ size.name }}
        </AppText>
        <BaseBadge
          v-if="size.price > 0"
          variant="secondary"
          size="sm"
        >
          +{{ formatPrice(size.price) }}
        </BaseBadge>
      </div>
      
      <AppText 
        v-if="size.description"
        size="body-sm" 
        class="text-neutral-20 mt-1"
      >
        {{ size.description }}
      </AppText>
    </div>

    <!-- Selection Indicator -->
    <div 
      :class="[
        'w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3',
        selected 
          ? 'border-primary-red bg-primary-red' 
          : 'border-neutral-20/40'
      ]"
    >
      <div 
        v-if="selected"
        class="w-3 h-3 bg-white rounded-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Size {
  id: string
  name: string
  price: number
  description?: string
}

interface Props {
  size: Size
  selected: boolean
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
