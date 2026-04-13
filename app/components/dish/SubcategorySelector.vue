<template>
  <div class="space-y-3">
    <AppHeading level="h4" size="heading-md" class="text-white">
      Choose Variant
    </AppHeading>

    <div class="grid grid-cols-1 gap-2">
      <SubcategoryOption
        v-for="subcategory in subcategories"
        :key="subcategory.id"
        :subcategory="subcategory"
        :selected="selected === subcategory.id"
        @select="$emit('select', subcategory.id)"
      />
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
  subcategories: Subcategory[]
  selected?: string
}

interface Emits {
  (e: 'select', subcategoryId: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
