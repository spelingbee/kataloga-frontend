<template>
  <div class="category-skeleton">
    <!-- Icon Skeleton -->
    <div class="icon-skeleton">
      <div class="skeleton-circle"/>
    </div>
    
    <!-- Text Skeleton -->
    <div class="text-skeleton">
      <div class="skeleton-line name-line"/>
      <div class="skeleton-line count-line"/>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props needed for skeleton
</script>

<style scoped>
.category-skeleton {
  background-color: var(--color-background-sidebar);
  border-radius: var(--radius-category);
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--color-border-subtle);
}

.icon-skeleton {
  flex-shrink: 0;
}

.skeleton-circle {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  width: 2rem;
  height: 2rem;
}

.text-skeleton {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.name-line {
  height: 1rem;
  width: 5rem;
}

.count-line {
  height: 0.75rem;
  width: 2rem;
}

/* Dark theme support */
.dark .skeleton-circle,
.dark .skeleton-line {
  background-color: rgba(128, 128, 128, 0.3);
}
</style>
