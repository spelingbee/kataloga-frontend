<template>
  <div class="skip-links">
    <a
      v-for="link in skipLinks"
      :key="link.href"
      :href="link.href"
      class="skip-links__link"
      @click="handleSkipClick"
    >
      {{ link.text }}
    </a>
  </div>
</template>

<script setup lang="ts">
interface SkipLink {
  href: string
  text: string
}

interface Props {
  links?: SkipLink[]
}

const props = withDefaults(defineProps<Props>(), {
  links: () => [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
    { href: '#footer', text: 'Skip to footer' }
  ]
})

const skipLinks = computed(() => props.links)

const handleSkipClick = (event: Event) => {
  const target = event.target as HTMLAnchorElement
  const targetId = target.getAttribute('href')?.substring(1)
  
  if (targetId) {
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      // Ensure the target element is focusable
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1')
      }
      
      // Focus the target element
      targetElement.focus()
      
      // Remove tabindex after focus to restore natural tab order
      setTimeout(() => {
        if (targetElement.getAttribute('tabindex') === '-1') {
          targetElement.removeAttribute('tabindex')
        }
      }, 100)
    }
  }
}
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens' as *;
@use '../../assets/scss/abstracts/mixins' as *;

.skip-links {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
}

.skip-links__link {
  position: absolute;
  top: -100px;
  left: var(--space-4);
  display: inline-block;
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  transition: top var(--transition-base);
  
  &:focus {
    top: var(--space-4);
    outline: 2px solid white;
    outline-offset: 2px;
  }
  
  &:hover {
    background: var(--color-primary-dark, var(--color-primary));
  }
}

// High contrast mode support
@media (prefers-contrast: high) {
  .skip-links__link {
    background: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonText;
    
    &:focus {
      background: Highlight;
      color: HighlightText;
      border-color: HighlightText;
    }
  }
}
</style>
