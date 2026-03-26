<template>
  <div class="language-switcher">
    <button
      class="language-switcher__button"
      :aria-label="t('common.selectLanguage')"
      @click="toggleDropdown"
    >
      <span class="language-switcher__current">{{ currentLocale.name }}</span>
      <BaseIcon
        name="chevron-down"
        size="sm"
        class="language-switcher__icon"
        :class="{ 'language-switcher__icon--open': isOpen }"
      />
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
interface LocaleObject {
  code: string
  name: string
}

const { locale, locales, t } = useI18n()
const isOpen = ref(false)

const availableLocales = computed(() => locales.value as unknown as LocaleObject[])
const currentLocale = computed<LocaleObject>(() => {
  const allLocales = locales.value as unknown as LocaleObject[]
  return allLocales.find((l) => l.code === locale.value) || allLocales[0] || { code: 'en', name: 'English' }
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const changeLocale = (code: string) => {
  locale.value = code as any
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
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $transition-base;
  color: var(--text-primary);

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.language-switcher__current {
  font-size: $text-sm;
  font-weight: $font-medium;
  color: var(--text-primary);
}

.language-switcher__icon {
  transition: transform $transition-base;
  color: var(--text-secondary);

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
  border: 1px solid var(--border-primary);
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
  color: var(--text-primary);

  &:hover {
    background: var(--bg-secondary);
  }

  &--active {
    background: var(--bg-secondary);
    font-weight: $font-semibold;
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
