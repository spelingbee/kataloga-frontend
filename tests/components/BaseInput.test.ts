import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseInput from '~/components/base/BaseInput.vue'

describe('BaseInput', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseInput, {
      slots: {
        prefix: '<div class="prefix"></div>',
        suffix: '<div class="suffix"></div>',
      },
    })
    
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('text')
  })
  
  it('renders with label', () => {
    const wrapper = mount(BaseInput, {
      props: {
        label: 'Email Address'
      }
    })
    
    expect(wrapper.text()).toContain('Email Address')
  })
  
  it('shows required indicator when required', () => {
    const wrapper = mount(BaseInput, {
      props: {
        label: 'Email',
        required: true
      }
    })
    
    expect(wrapper.html()).toContain('*')
  })
  
  it('displays error message', () => {
    const wrapper = mount(BaseInput, {
      props: {
        error: 'This field is required'
      }
    })
    
    expect(wrapper.text()).toContain('This field is required')
  })
  
  it('displays success message', () => {
    const wrapper = mount(BaseInput, {
      props: {
        success: 'Looks good!'
      }
    })
    
    expect(wrapper.text()).toContain('Looks good!')
  })
  
  it('displays hint message', () => {
    const wrapper = mount(BaseInput, {
      props: {
        hint: 'Enter your email address'
      }
    })
    
    expect(wrapper.text()).toContain('Enter your email address')
  })
  
  it('emits update:modelValue on input', async () => {
    const wrapper = mount(BaseInput)
    
    const input = wrapper.find('input')
    await input.setValue('test@example.com')
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test@example.com'])
  })
  
  it('handles different input types', () => {
    const types = ['text', 'email', 'password', 'number', 'tel'] as const
    
    types.forEach(type => {
      const wrapper = mount(BaseInput, {
        props: { type }
      })
      
      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe(type)
    })
  })
  
  it('applies disabled state', () => {
    const wrapper = mount(BaseInput, {
      props: { disabled: true }
    })
    
    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
  })
  
  it('applies readonly state', () => {
    const wrapper = mount(BaseInput, {
      props: { readonly: true }
    })
    
    const input = wrapper.find('input')
    expect(input.attributes('readonly')).toBeDefined()
  })
})
