<template>
  <div class="language-switcher">
    <button
      class="language-switcher__button"
      :aria-label="t('common.selectLanguage')"
      @click="toggleDropdown"
    >
      <span class="language-switcher__current language-switcher__current--desktop">{{ currentLocale.name }}</span>
      <span class="language-switcher__current language-switcher__current--mobile">{{ currentLocale.code.toUpperCase() }}</span>
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


.language-switcher {
  position: relative;
}

.language-switcher__button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    border-color: var(--color-primary);
    background-color: rgba(var(--color-primary-rgb), 0.04);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.language-switcher__current {
  font-size: 14px;
  font-weight: 500;
  
  &--desktop {
    display: inline;
  }
  &--mobile {
    display: none;
  }
}

@media (max-width: 600px) {
  .language-switcher__current {
    &--desktop {
      display: none;
    }
    &--mobile {
      display: inline;
    }
  }
}

.language-switcher__icon {
  transition: transform 0.2s ease;
  color: var(--text-tertiary);

  &--open {
    transform: rotate(180deg);
    color: var(--color-primary);
  }
}

.language-switcher__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  z-index: 1000;
  padding: 4px;
}

.language-switcher__option {
  display: block;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--text-secondary);
  font-family: inherit;

  &:hover {
    background: var(--bg-secondary);
    color: var(--color-primary);
  }

  &--active {
    background: rgba(var(--color-primary-rgb), 0.08);
    font-weight: 600;
    color: var(--color-primary);
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
