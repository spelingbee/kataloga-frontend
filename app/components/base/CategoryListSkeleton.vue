<template>
  <div class="category-list-skeleton">
    <CategorySkeleton 
      v-for="i in count" 
      :key="i"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 7,
})
</script>

<style scoped>
.category-list-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>