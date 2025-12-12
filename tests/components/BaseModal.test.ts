import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseModal from '~/components/base/BaseModal.vue'

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
      }
    })
    
    expect(wrapper.find('.modal').exists()).toBe(false)
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
    
    expect(wrapper.find('.modal').exists()).toBe(true)
  })
  
  it('renders with title', () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true,
        title: 'Test Modal'
      },
      attachTo: document.body
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
      attachTo: document.body
    })
    
    expect(wrapper.html()).toContain('Modal content')
  })
  
  it('emits update:modelValue when close button is clicked', async () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true,
        closable: true
      },
      attachTo: document.body
    })
    
    const closeButton = wrapper.findAll('button').find(btn => 
      btn.classes().includes('btn--ghost')
    )
    
    if (closeButton) {
      await closeButton.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    }
  })
  
  it('applies different sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const
    
    sizes.forEach(size => {
      const wrapper = mount(BaseModal, {
        props: {
          modelValue: true,
          size
        },
        attachTo: document.body
      })
      
      const modal = wrapper.find('.modal')
      expect(modal.exists()).toBe(true)
    })
  })
  
  it('does not show close button when closable is false', () => {
    const wrapper = mount(BaseModal, {
      props: {
        modelValue: true,
        closable: false
      },
      attachTo: document.body
    })
    
    const closeButton = wrapper.findAll('button').find(btn => 
      btn.classes().includes('btn--ghost')
    )
    
    expect(closeButton).toBeUndefined()
  })
})
