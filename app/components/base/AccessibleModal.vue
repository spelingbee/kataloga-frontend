<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        ref="modalRef"
        class="accessible-modal"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        @click.self="handleBackdropClick"
      >
        <div class="accessible-modal__overlay" aria-hidden="true" />

        <div class="accessible-modal__container">
          <div class="accessible-modal__content">
            <!-- Header -->
            <div v-if="$slots.header || title" class="accessible-modal__header">
              <h2 :id="titleId" class="accessible-modal__title">
                <slot name="header">{{ title }}</slot>
              </h2>

              <button
                type="button"
                class="accessible-modal__close"
                aria-label="Close dialog"
                @click="handleClose"
              >
                <BaseIcon name="x" size="md" />
              </button>
            </div>

            <!-- Body -->
            <div :id="descriptionId" class="accessible-modal__body">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="accessible-modal__footer">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useFocusTrap, useKeyboardNavigation } from '~/composables/useAccessibility'

interface Props {
  isOpen: boolean
  title?: string
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closeOnBackdrop: true,
  closeOnEscape: true,
})

const emit = defineEmits<{
  close: []
}>()

const modalRef: Ref<HTMLElement | null> = ref(null)
const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)
const descriptionId = computed(() => `modal-description-${Math.random().toString(36).substr(2, 9)}`)

// Focus trap
const { activate, deactivate } = useFocusTrap(modalRef, {
  returnFocus: true,
})

// Keyboard navigation
useKeyboardNavigation({
  onEscape: () => {
    if (props.closeOnEscape && props.isOpen) {
      handleClose()
    }
  },
})

const handleClose = () => {
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    handleClose()
  }
}

// Manage focus trap and body scroll
watch(
  () => props.isOpen,
  isOpen => {
    if (isOpen) {
      activate()
      document.body.style.overflow = 'hidden'
    } else {
      deactivate()
      document.body.style.overflow = ''
    }
  }
)
</script>

<style scoped lang="scss">
@use '../../assets/scss/abstracts' as *;

.accessible-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.accessible-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.accessible-modal__container {
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-primary);
  border-radius: $radius-lg;
  box-shadow: $shadow-xl;
}

.accessible-modal__content {
  display: flex;
  flex-direction: column;
}

.accessible-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-6;
  border-bottom: 1px solid $border-color;
}

.accessible-modal__title {
  margin: 0;
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $text-primary;
}

.accessible-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-1;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: var(--bg-secondary);
    color: $text-primary;
  }

  &:focus {
    outline: 2px solid var(--color-success);
    outline-offset: 2px;
  }
}

.accessible-modal__body {
  padding: $space-6;
}

.accessible-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $space-4;
  padding: $space-6;
  border-top: 1px solid $border-color;
}

// Transitions
.modal-enter-active,
.modal-leave-active {
  transition: opacity $transition-base;

  .accessible-modal__container {
    transition: transform $transition-base;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .accessible-modal__container {
    transform: scale(0.95);
  }
}
</style>
