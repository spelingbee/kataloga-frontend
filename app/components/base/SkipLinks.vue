<template>
  <div class="skip-links">
    <a href="#main-content" class="skip-links__link" @click.prevent="skipToContent">
      Skip to main content
    </a>
    <a href="#navigation" class="skip-links__link" @click.prevent="skipToNavigation">
      Skip to navigation
    </a>
  </div>
</template>

<script setup lang="ts">
const skipToContent = () => {
  const main = document.getElementById('main-content')
  if (main) {
    main.focus()
    main.scrollIntoView({ behavior: 'smooth' })
  }
}

const skipToNavigation = () => {
  const nav = document.getElementById('navigation')
  if (nav) {
    nav.focus()
    nav.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped lang="scss">


.skip-links {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
}

.skip-links__link {
  position: absolute;
  left: -9999px;
  top: 0;
  padding: $space-2 $space-4;
  background: var(--color-success);
  color: white;
  text-decoration: none;
  font-weight: $font-semibold;
  border-radius: $radius-md;
  
  &:focus {
    left: $space-4;
    top: $space-4;
    outline: 2px solid var(--text-primary);
    outline-offset: 2px;
  }
}
</style>
