<template>
  <div class="menu-grid-skeleton">
    <MenuItemSkeleton 
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
  count: 6,
})
</script>

<style scoped>
.menu-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 640px) {
  .menu-grid-skeleton {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .menu-grid-skeleton {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .menu-grid-skeleton {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
