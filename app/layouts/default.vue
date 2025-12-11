<template>
  <AppLayout>
    <slot />
  </AppLayout>
</template>

<script setup lang="ts">
// The AppLayout component handles all the layout logic
// Explicit import to ensure component is available
import AppLayout from '~/components/layout/AppLayout.vue'
</script>

