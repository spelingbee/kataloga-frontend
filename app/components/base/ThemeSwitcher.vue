<template>
  <BaseButton
    variant="ghost"
    size="sm"
    class="theme-switcher"
    :aria-label="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    @click="toggleTheme"
  >
    <BaseIcon
      :name="isDark ? 'sun' : 'moon'"
      size="md"
    />
  </BaseButton>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode } from '~/composables/useColorMode'

const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggleTheme = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<style scoped>
.theme-switcher {
  /* Ensure hit area is good */
  min-width: 32px;
  min-height: 32px;
}
</style>