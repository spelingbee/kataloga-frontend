<template>
  <footer class="branding-footer">
    <p v-if="showCopyright">
      © {{ new Date().getFullYear() }} {{ platformName }}. All rights reserved.
    </p>
    
    <NuxtLink 
      v-if="showBranding"
      :to="brandingUrl"
      target="_blank"
      class="made-with-link group transition-all duration-300"
    >
      <span class="made-with-text">Made with </span>
      <span class="made-with-brand">KATALOGA</span>
    </NuxtLink>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTenant } from '~/composables/useTenant'

interface Props {
  showCopyright?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCopyright: true
})

const { currentTenant } = useTenant()

const showBranding = computed(() => currentTenant.value?.showBranding ?? true)
const brandingUrl = computed(() => currentTenant.value?.brandingUrl ?? 'https://kataloga.org')
const platformName = computed(() => currentTenant.value?.platformName || 'Kataloga Admin')
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/typography' as *;

.branding-footer {
  text-align: center;
  font-size: $text-xs;
  color: var(--text-tertiary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  width: 100%;

  .made-with-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    text-decoration: none;
    opacity: 0.5;
    transition: all 0.3s ease;
    
    &:hover {
      opacity: 1;
      transform: translateY(-1px);
    }
  }

  .made-with-text {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    letter-spacing: 0.05em;
  }

  .made-with-brand {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    
    .made-with-link:hover & {
      color: var(--color-primary);
    }
  }
}
</style>
