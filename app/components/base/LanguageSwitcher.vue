<template>
  <div class="language-switcher">
    <button
      class="language-switcher__button"
      :aria-label="t('common.selectLanguage')"
      @click="toggleDropdown"
    >
      <span class="language-switcher__current">{{ currentLocale.name }}</span>
      <svg
        class="language-switcher__icon"
        :class="{ 'language-switcher__icon--open': isOpen }"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <transition name="dropdown">
      <div v-if="isOpen" class="language-switcher__dropdown">
        <button
          v-for="locale in availableLocales"
          :key="locale.code"
          class="language-switcher__option"
          :class="{ 'language-switcher__option--active': locale.code === currentLocale.code }"
          @click="changeLocale(locale.code)"
        >
          {{ locale.name }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
const { locale, locales, t } = useI18n()
const isOpen = ref(false)

const availableLocales = computed(() => locales.value)
const currentLocale = computed(() => {
  return locales.value.find((l) => l.code === locale.value) || locales.value[0]
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const changeLocale = (code: string) => {
  locale.value = code
  isOpen.value = false
}

// Close dropdown when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.language-switcher')) {
      isOpen.value = false
    }
  }

  document.addEventListener('click', handleClickOutside)

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style scoped lang="scss">
@use '~/assets/scss/abstracts/variables' as *;

.language-switcher {
  position: relative;
}

.language-switcher__button {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-4;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: $radius-md;
  color: white;
  cursor: pointer;
  transition: all $transition-base;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: 2px solid var(--color-success);
    outline-offset: 2px;
  }
}

.language-switcher__current {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: inherit;
}

.language-switcher__icon {
  transition: transform $transition-base;

  &--open {
    transform: rotate(180deg);
  }
}

.language-switcher__dropdown {
  position: absolute;
  top: calc(100% + $space-1);
  right: 0;
  min-width: 150px;
  background: var(--bg-primary);
  border: 1px solid $border-color;
  border-radius: $radius-md;
  box-shadow: $shadow-lg;
  overflow: hidden;
  z-index: 1000;
}

.language-switcher__option {
  display: block;
  width: 100%;
  padding: $space-2 $space-4;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background $transition-base;
  font-size: $text-sm;
  color: $text-primary;

  &:hover {
    background: var(--bg-secondary);
  }

  &--active {
    background: var(--bg-secondary);
    font-weight: $font-semibold;
    color: var(--color-success);
  }
}

// Dropdown animation
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all $transition-base;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
