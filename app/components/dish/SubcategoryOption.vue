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
    <!-- Subcategory Info -->
    <div class="flex items-center space-x-3 flex-1">
      <!-- Image (if available) -->
      <BaseImage
        v-if="subcategory.imageUrl"
        :src="subcategory.imageUrl"
        :alt="subcategory.name"
        class="w-12 h-12 rounded-full border-2 border-white object-cover"
      />

      <!-- Text Info -->
      <div class="flex-1">
        <div class="flex items-center space-x-2">
          <AppText size="body-lg" class="text-white font-medium">
            {{ subcategory.name }}
          </AppText>
          <BaseBadge
            v-if="subcategory.isDefault"
            variant="success"
            size="xs"
          >
            Popular
          </BaseBadge>
        </div>
        
        <AppText 
          v-if="subcategory.description"
          size="body-sm" 
          class="text-neutral-20 mt-1"
        >
          {{ subcategory.description }}
        </AppText>
      </div>
    </div>

    <!-- Price and Selection -->
    <div class="flex items-center space-x-3">
      <!-- Price -->
      <PriceDisplay :price="subcategory.price" size="md" />

      <!-- Selection Indicator -->
      <div 
        :class="[
          'w-6 h-6 rounded-full border-2 flex items-center justify-center',
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
  </div>
</template>

<script setup lang="ts">
interface Subcategory {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isDefault?: boolean
}

interface Props {
  subcategory: Subcategory
  selected: boolean
}

interface Emits {
  (e: 'select'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>