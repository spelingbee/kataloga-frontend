import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseSkeleton from '~/components/base/BaseSkeleton.vue'

describe('BaseSkeleton', () => {
  it('renders with default props', () => {
    const wrapper = mount(BaseSkeleton)
    
    expect(wrapper.classes()).toContain('skeleton')
    expect(wrapper.classes()).toContain('skeleton--text')
    expect(wrapper.classes()).toContain('skeleton--animated')
  })
  
  it('renders all variants correctly', () => {
    const variants = ['text', 'card', 'image', 'circle', 'button'] as const
    
    variants.forEach(variant => {
      const wrapper = mount(BaseSkeleton, {
        props: { variant }
      })
      
      expect(wrapper.classes()).toContain(`skeleton--${variant}`)
    })
  })
  
  it('applies custom width', () => {
    const wrapper = mount(BaseSkeleton, {
      props: {
        width: '200px'
      }
    })
    
    expect(wrapper.attributes('style')).toContain('width: 200px')
  })
  
  it('applies custom height', () => {
    const wrapper = mount(BaseSkeleton, {
      props: {
        height: '100px'
      }
    })
    
    expect(wrapper.attributes('style')).toContain('height: 100px')
  })
  
  it('applies both custom width and height', () => {
    const wrapper = mount(BaseSkeleton, {
      props: {
        width: '200px',
        height: '100px'
      }
    })
    
    const style = wrapper.attributes('style')
    expect(style).toContain('width: 200px')
    expect(style).toContain('height: 100px')
  })
  
  it('disables animation when animated is false', () => {
    const wrapper = mount(BaseSkeleton, {
      props: {
        animated: false
      }
    })
    
    expect(wrapper.classes()).not.toContain('skeleton--animated')
  })
  
  it('enables animation when animated is true', () => {
    const wrapper = mount(BaseSkeleton, {
      props: {
        animated: true
      }
    })
    
    expect(wrapper.classes()).toContain('skeleton--animated')
  })
})
