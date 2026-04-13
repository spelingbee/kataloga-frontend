<template>
  <Teleport to="body">
    <Transition
      name="modal-backdrop"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="modelValue"
        class="base-modal-overlay"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="base-modal-backdrop" />
        
        <!-- Modal -->
        <Transition name="modal-content">
          <div
            v-if="modelValue"
            ref="modalRef"
            :class="modalClasses"
            role="dialog"
            :aria-modal="true"
            :aria-labelledby="title ? titleId : undefined"
            :aria-describedby="$slots.default ? contentId : undefined"
            tabindex="-1"
            @click.stop
            @keydown="handleKeydown"
          >
            <!-- Header -->
            <div v-if="$slots.header || title || closable" class="base-modal__header">
              <div class="base-modal__title-section">
                <slot name="header">
                  <h2 v-if="title" :id="titleId" class="base-modal__title">
                    {{ title }}
                  </h2>
                </slot>
              </div>
              
              <BaseButton
                v-if="closable"
                ref="closeButtonRef"
                variant="ghost"
                size="sm"
                icon="x"
                :aria-label="closeButtonLabel"
                @click="close"
              />
            </div>
            
            <!-- Body -->
            <div :id="contentId" class="base-modal__body">
              <slot />
            </div>
            
            <!-- Footer -->
            <div v-if="$slots.footer" class="base-modal__footer">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  closeOnBackdrop?: boolean
  closeButtonLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnBackdrop: true,
  closeButtonLabel: 'Close modal'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  opened: []
  closed: []
}>()

const modalRef = ref<HTMLElement>()
const closeButtonRef = ref<InstanceType<typeof BaseButton>>()
const previousActiveElement = ref<HTMLElement | null>(null)

const titleId = useId()
const contentId = useId()

const modalClasses = computed(() => {
  const classes = ['base-modal']
  
  // Add size modifier
  classes.push(`base-modal--${props.size}`)
  
  return classes
})

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closable) {
    close()
  } else if (event.key === 'Tab') {
    trapFocus(event)
  }
}

const trapFocus = (event: KeyboardEvent) => {
  if (!modalRef.value) return
  
  const focusableElements = modalRef.value.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0] as HTMLElement
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
  
  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
  }
}

const onEnter = () => {
  // Store the previously focused element
  previousActiveElement.value = document.activeElement as HTMLElement
  
  // Prevent body scroll
  if (import.meta.client) {
    document.body.style.overflow = 'hidden'
  }
  
  // Focus the modal or first focusable element
  nextTick(() => {
    if (modalRef.value) {
      const firstFocusable = modalRef.value.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      
      if (firstFocusable) {
        firstFocusable.focus()
      } else {
        modalRef.value.focus()
      }
    }
  })
  
  emit('opened')
}

const onLeave = () => {
  // Restore body scroll
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
  
  // Restore focus to previously focused element
  if (previousActiveElement.value) {
    previousActiveElement.value.focus()
  }
  
  emit('closed')
}

// Handle escape key globally
onMounted(() => {
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.modelValue && props.closable) {
      close()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
    // Ensure body scroll is restored on unmount
    if (import.meta.client) {
      document.body.style.overflow = ''
    }
  })
})
</script>

<style scoped lang="scss">
@use '../../assets/scss/tokens/colors' as *;
@use '../../assets/scss/tokens/spacing' as *;
@use '../../assets/scss/tokens/radius' as *;
@use '../../assets/scss/tokens/shadows' as *;
@use '../../assets/scss/tokens/transitions' as *;
@use '../../assets/scss/tokens/typography' as *;

.base-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.base-modal-backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.base-modal {
  position: relative;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: $radius-modal;
  box-shadow: $shadow-modal;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  &:focus {
    outline: none;
  }
  
  // Size variants
  &--sm {
    width: 100%;
    max-width: 28rem; // 448px
  }
  
  &--md {
    width: 100%;
    max-width: 32rem; // 512px
  }
  
  &--lg {
    width: 100%;
    max-width: 48rem; // 768px
  }
  
  &--xl {
    width: 100%;
    max-width: 64rem; // 1024px
  }
  
  &--full {
    width: 100%;
    max-width: 80rem; // 1280px
  }
}

.base-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $modal-padding;
  border-bottom: 1px solid var(--border-primary);
  flex-shrink: 0;
}

.base-modal__title-section {
  flex: 1;
  min-width: 0; // Allow text truncation
}

.base-modal__title {
  font-family: $font-secondary;
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: var(--text-primary);
  margin: 0;
}

.base-modal__body {
  padding: $modal-padding;
  overflow-y: auto;
  flex: 1;
  min-height: 0; // Allow scrolling
}

.base-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $space-3;
  padding: $modal-padding;
  border-top: 1px solid var(--border-primary);
  flex-shrink: 0;
}

// Transitions
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity $transition-base $ease-in-out;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-content-enter-active,
.modal-content-leave-active {
  transition: all $transition-base $ease-out;
}

.modal-content-enter-from,
.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(1rem);
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .modal-backdrop-enter-active,
  .modal-backdrop-leave-active,
  .modal-content-enter-active,
  .modal-content-leave-active {
    transition: none;
  }
  
  .modal-content-enter-from,
  .modal-content-leave-to {
    transform: none;
  }
}

// Mobile responsiveness
@media (max-width: 640px) {
  .base-modal-overlay {
    padding: $space-2;
  }
  
  .base-modal {
    &--sm,
    &--md,
    &--lg,
    &--xl,
    &--full {
      width: 100%;
      max-width: none;
      max-height: 95vh;
    }
  }
  
  .base-modal__header,
  .base-modal__body,
  .base-modal__footer {
    padding: $space-4;
  }
}
</style>
