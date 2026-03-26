/**
 * Modal component types and constants
 */

// Modal size constants
export const MODAL_SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  FULL: 'full'
} as const

export type ModalSize = typeof MODAL_SIZES[keyof typeof MODAL_SIZES]

// BaseModal component props interface
export interface BaseModalProps {
  modelValue: boolean
  title?: string
  size?: ModalSize
  closable?: boolean
  closeOnBackdrop?: boolean
  closeButtonLabel?: string
  persistent?: boolean
}

// BaseModal component emits interface
export interface BaseModalEmits {
  'update:modelValue': [value: boolean]
  'close': []
  'opened': []
  'closed': []
}

// Modal configuration type for programmatic usage
export interface ModalConfig {
  title?: string
  size?: ModalSize
  persistent?: boolean
  closable?: boolean
  closeOnBackdrop?: boolean
}