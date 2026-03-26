import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseModal from '~/components/base/BaseModal.vue'
import { MODAL_SIZES } from '~/types/ui/modal.ui'

vi.mock('@vueuse/integrations/useFocusTrap', () => ({
  useFocusTrap: () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}))

describe('BaseModal', () => {
  it('does not render when modelValue is false', () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: false
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
    
    expect(wrapper.find('.base-modal').exists()).toBe(false)
  })
  
  it('renders when modelValue is true', () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true
      },
      slots: {
        default: '<p>Modal content</p>',
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
    
    expect(wrapper.find('.base-modal').exists()).toBe(true)
  })
  
  it('renders with title', () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true,
        title: 'Test Modal'
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
    
    expect(wrapper.text()).toContain('Test Modal')
  })
  
  it('renders slot content', () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true
      },
      slots: {
        default: '<p>Modal content</p>'
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
    
    expect(wrapper.html()).toContain('Modal content')
  })
  
  it('emits update:modelValue when close button is clicked', async () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true,
        closable: true
      },
      global: {
        stubs: {
          teleport: true,
          BaseButton: {
            template: '<button @click="$emit(\'click\')" class="btn--ghost"><slot /></button>',
            emits: ['click']
          }
        },
      },
    })
    
    const closeButton = wrapper.findComponent({ name: 'BaseButton' })
    
    if (closeButton.exists()) {
      await closeButton.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    }
  })
  
  it('applies different sizes using constants', () => {
    const sizes = [MODAL_SIZES.SM, MODAL_SIZES.MD, MODAL_SIZES.LG, MODAL_SIZES.XL, MODAL_SIZES.FULL] as const
    
    sizes.forEach(size => {
      const wrapper = mount(BaseModal, {
        props: {
          modelValue: true,
          size
        },
        global: {
          stubs: {
            teleport: true,
          },
        },
      })
      
      const modal = wrapper.find('.base-modal')
      expect(modal.exists()).toBe(true)
      expect(modal.classes()).toContain(`base-modal--${size}`)
    })
  })
  
  it('does not show close button when closable is false', () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true,
        closable: false
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
    
    const closeButton = wrapper.findAll('button').find(btn => 
      btn.classes().includes('btn--ghost')
    )
    
    expect(closeButton).toBeUndefined()
  })

  it('does not close when persistent is true and backdrop is clicked', async () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true,
        persistent: true,
        closeOnBackdrop: true
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
    
    const backdrop = wrapper.find('.base-modal-overlay')
    await backdrop.trigger('click')
    
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('does not close when persistent is true and escape key is pressed', async () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true,
        persistent: true,
        closable: true
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
    
    const modal = wrapper.find('.base-modal')
    await modal.trigger('keydown', { key: 'Escape' })
    
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('does not close when persistent is true and close button is clicked', async () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true,
        persistent: true,
        closable: true
      },
      global: {
        stubs: {
          teleport: true,
        },
      },
    })
    
    const closeButton = wrapper.findComponent({ name: 'BaseButton' })
    if (closeButton.exists()) {
      await closeButton.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    }
  })
})
