<template>
  <div class="menu-item-skeleton">
    <!-- Image Skeleton -->
    <div class="image-skeleton">
      <div class="skeleton-circle"/>
    </div>
    
    <!-- Content Skeleton -->
    <div class="content-skeleton">
      <!-- Title -->
      <div class="skeleton-line title-line"/>
      
      <!-- Description -->
      <div class="skeleton-line description-line"/>
      <div class="skeleton-line description-line short"/>
      
      <!-- Price and Actions -->
      <div class="bottom-skeleton">
        <div class="skeleton-line price-line"/>
        <div class="skeleton-circle action-button"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props needed for skeleton
</script>

<style scoped>
.menu-item-skeleton {
  background-color: var(--color-background-card);
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.image-skeleton {
  display: flex;
  justify-content: center;
}

.skeleton-circle {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  width: 4rem;
  height: 4rem;
}

.content-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-line {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.title-line {
  height: 1.25rem;
  width: 75%;
}

.description-line {
  height: 0.75rem;
  width: 100%;
}

.description-line.short {
  width: 66.666667%;
}

.bottom-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-line {
  height: 1rem;
  width: 4rem;
}

.action-button {
  width: 2rem;
  height: 2rem;
}

/* Dark theme support */
.dark .skeleton-circle,
.dark .skeleton-line {
  background-color: rgba(128, 128, 128, 0.3);
}
</style>