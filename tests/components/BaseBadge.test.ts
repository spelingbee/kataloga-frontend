import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseBadge from '~/components/base/BaseBadge.vue'

describe('BaseBadge', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseBadge, {
      slots: {
        default: 'New'
      }
    })
    
    expect(wrapper.text()).toBe('New')
  })
  
  it('renders all variants correctly', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const
    
    variants.forEach(variant => {
      const wrapper = mount(BaseBadge, {
        props: { variant },
        slots: { default: 'Badge' }
      })
      
      expect(wrapper.exists()).toBe(true)
    })
  })
  
  it('renders all sizes correctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    
    sizes.forEach(size => {
      const wrapper = mount(BaseBadge, {
        props: { size },
        slots: { default: 'Badge' }
      })
      
      expect(wrapper.exists()).toBe(true)
    })
  })
  
  it('renders all shapes correctly', () => {
    const shapes = ['rounded', 'circular', 'square'] as const
    
    shapes.forEach(shape => {
      const wrapper = mount(BaseBadge, {
        props: { shape },
        slots: { default: 'Badge' }
      })
      
      expect(wrapper.exists()).toBe(true)
    })
  })
  
  it('applies pulse animation when pulse is true', () => {
    const wrapper = mount(BaseBadge, {
      props: { pulse: true },
      slots: { default: 'Badge' }
    })
    
    expect(wrapper.classes()).toContain('animate-pulse')
  })
  
  it('does not apply pulse animation when pulse is false', () => {
    const wrapper = mount(BaseBadge, {
      props: { pulse: false },
      slots: { default: 'Badge' }
    })
    
    expect(wrapper.classes()).not.toContain('animate-pulse')
  })
})
