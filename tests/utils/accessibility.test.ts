/**
 * Comprehensive accessibility tests for WCAG 2.1 Level AA compliance
 * Tests all interactive elements, ARIA labels, color contrast, and touch targets
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  runAccessibilityAudit,
  checkImageAltText,
  checkFormLabels,
  checkButtonLabels,
  checkTouchTargets,
  checkKeyboardAccessibility,
  checkAriaUsage,
  checkScreenReaderCompatibility,
  generateAccessibilityReport
} from '../../app/utils/accessibility-testing'
import { getContrastRatio, meetsWCAG_AA } from '../../app/utils/color-contrast'

// Mock DOM environment
const createMockElement = (tagName: string, attributes: Record<string, string> = {}) => {
  const element = document.createElement(tagName)
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
  return element
}

describe('Accessibility Testing Utilities', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = ''
    document.head.innerHTML = '<title>Test Page</title>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  describe('Image Alt Text Validation', () => {
    it('should detect images without alt attributes', () => {
      const img = createMockElement('img', { src: 'test.jpg' })
      document.body.appendChild(img)

      const issues = checkImageAltText()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('error')
      expect(issues[0].message).toContain('missing alt attribute')
      expect(issues[0].wcagCriterion).toBe('1.1.1 Non-text Content')
    })

    it('should not flag images with proper alt text', () => {
      const img = createMockElement('img', { src: 'test.jpg', alt: 'Test image' })
      document.body.appendChild(img)

      const issues = checkImageAltText()
      expect(issues).toHaveLength(0)
    })

    it('should warn about empty alt text without presentation role', () => {
      const img = createMockElement('img', { src: 'test.jpg', alt: '' })
      document.body.appendChild(img)

      const issues = checkImageAltText()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('warning')
      expect(issues[0].message).toContain('empty alt text')
    })

    it('should not flag decorative images with presentation role', () => {
      const img = createMockElement('img', { src: 'test.jpg', alt: '', role: 'presentation' })
      document.body.appendChild(img)

      const issues = checkImageAltText()
      expect(issues).toHaveLength(0)
    })
  })

  describe('Form Label Validation', () => {
    it('should detect inputs without labels', () => {
      const input = createMockElement('input', { type: 'text' })
      document.body.appendChild(input)

      const issues = checkFormLabels()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('error')
      expect(issues[0].message).toContain('missing label')
      expect(issues[0].wcagCriterion).toBe('3.3.2 Labels or Instructions')
    })

    it('should not flag inputs with proper labels', () => {
      const input = createMockElement('input', { type: 'text', id: 'test-input' })
      const label = createMockElement('label', { for: 'test-input' })
      label.textContent = 'Test Input'
      
      document.body.appendChild(label)
      document.body.appendChild(input)

      const issues = checkFormLabels()
      expect(issues).toHaveLength(0)
    })

    it('should not flag inputs with aria-label', () => {
      const input = createMockElement('input', { type: 'text', 'aria-label': 'Test Input' })
      document.body.appendChild(input)

      const issues = checkFormLabels()
      expect(issues).toHaveLength(0)
    })

    it('should skip hidden inputs', () => {
      const input = createMockElement('input', { type: 'hidden' })
      document.body.appendChild(input)

      const issues = checkFormLabels()
      expect(issues).toHaveLength(0)
    })

    it('should warn about required fields without indicators', () => {
      const input = createMockElement('input', { 
        type: 'text', 
        id: 'test-input',
        required: 'true'
      })
      const label = createMockElement('label', { for: 'test-input' })
      label.textContent = 'Test Input'
      
      document.body.appendChild(label)
      document.body.appendChild(input)

      const issues = checkFormLabels()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('warning')
      expect(issues[0].message).toContain('Required field missing')
    })
  })

  describe('Button Label Validation', () => {
    it('should detect buttons without accessible names', () => {
      const button = createMockElement('button')
      document.body.appendChild(button)

      const issues = checkButtonLabels()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('error')
      expect(issues[0].message).toContain('missing accessible name')
      expect(issues[0].wcagCriterion).toBe('4.1.2 Name, Role, Value')
    })

    it('should not flag buttons with text content', () => {
      const button = createMockElement('button')
      button.textContent = 'Click me'
      document.body.appendChild(button)

      const issues = checkButtonLabels()
      expect(issues).toHaveLength(0)
    })

    it('should not flag buttons with aria-label', () => {
      const button = createMockElement('button', { 'aria-label': 'Close dialog' })
      document.body.appendChild(button)

      const issues = checkButtonLabels()
      expect(issues).toHaveLength(0)
    })

    it('should detect icon buttons without labels', () => {
      const button = createMockElement('button')
      const icon = createMockElement('svg')
      button.appendChild(icon)
      document.body.appendChild(button)

      const issues = checkButtonLabels()
      expect(issues).toHaveLength(2) // One for missing name, one for icon without label
      expect(issues.some(issue => issue.message.includes('Icon button'))).toBe(true)
    })
  })

  describe('Touch Target Validation', () => {
    it('should detect touch targets that are too small', () => {
      const button = createMockElement('button')
      button.style.width = '20px'
      button.style.height = '20px'
      document.body.appendChild(button)

      // Mock getBoundingClientRect
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        width: 20,
        height: 20,
        top: 0,
        left: 0,
        bottom: 20,
        right: 20,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })

      const issues = checkTouchTargets()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('warning')
      expect(issues[0].message).toContain('Touch target too small')
      expect(issues[0].wcagCriterion).toBe('2.5.5 Target Size')
    })

    it('should not flag touch targets that meet minimum size', () => {
      const button = createMockElement('button')
      document.body.appendChild(button)

      // Mock getBoundingClientRect for proper size
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        width: 44,
        height: 44,
        top: 0,
        left: 0,
        bottom: 44,
        right: 44,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })

      const issues = checkTouchTargets()
      expect(issues).toHaveLength(0)
    })
  })

  describe('Keyboard Accessibility Validation', () => {
    it('should detect positive tabindex values', () => {
      const div = createMockElement('div', { tabindex: '1', class: 'focus-ring' })
      document.body.appendChild(div)

      const issues = checkKeyboardAccessibility()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('warning')
      expect(issues[0].message).toContain('Positive tabindex')
      expect(issues[0].wcagCriterion).toBe('2.4.3 Focus Order')
    })

    it('should detect onclick without keyboard handler', () => {
      const div = createMockElement('div', { onclick: 'doSomething()', class: 'focus-ring' })
      document.body.appendChild(div)

      const issues = checkKeyboardAccessibility()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('error')
      expect(issues[0].message).toContain('missing keyboard event handler')
      expect(issues[0].wcagCriterion).toBe('2.1.1 Keyboard')
    })

    it('should not flag buttons and links with onclick', () => {
      const button = createMockElement('button', { onclick: 'doSomething()', class: 'focus-ring' })
      const link = createMockElement('a', { href: '#', onclick: 'doSomething()', class: 'focus-ring' })
      
      document.body.appendChild(button)
      document.body.appendChild(link)

      const issues = checkKeyboardAccessibility()
      expect(issues).toHaveLength(0)
    })
  })

  describe('ARIA Usage Validation', () => {
    it('should detect invalid ARIA roles', () => {
      const div = createMockElement('div', { role: 'invalid-role' })
      document.body.appendChild(div)

      const issues = checkAriaUsage()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('error')
      expect(issues[0].message).toContain('Invalid ARIA role')
      expect(issues[0].wcagCriterion).toBe('4.1.2 Name, Role, Value')
    })

    it('should detect invalid aria-labelledby references', () => {
      const div = createMockElement('div', { 'aria-labelledby': 'non-existent-id' })
      document.body.appendChild(div)

      const issues = checkAriaUsage()
      expect(issues).toHaveLength(1)
      expect(issues[0].type).toBe('error')
      expect(issues[0].message).toContain('aria-labelledby references non-existent')
    })

    it('should not flag valid ARIA usage', () => {
      const label = createMockElement('div', { id: 'label-1' })
      label.textContent = 'Label'
      const div = createMockElement('div', { 
        role: 'button',
        'aria-labelledby': 'label-1'
      })
      
      document.body.appendChild(label)
      document.body.appendChild(div)

      const issues = checkAriaUsage()
      expect(issues).toHaveLength(0)
    })
  })

  describe('Screen Reader Compatibility', () => {
    it('should detect missing main landmark', () => {
      const issues = checkScreenReaderCompatibility()
      expect(issues.some(issue => issue.message.includes('main landmark'))).toBe(true)
    })

    it('should detect missing skip links', () => {
      const issues = checkScreenReaderCompatibility()
      expect(issues.some(issue => issue.message.includes('skip to main'))).toBe(true)
    })

    it('should not flag pages with proper landmarks', () => {
      const main = createMockElement('main', { id: 'main-content' })
      const skipLink = createMockElement('a', { href: '#main-content' })
      skipLink.textContent = 'Skip to main content'
      
      document.body.appendChild(skipLink)
      document.body.appendChild(main)

      const issues = checkScreenReaderCompatibility()
      const mainIssues = issues.filter(issue => 
        issue.message.includes('main landmark') || 
        issue.message.includes('skip to main')
      )
      expect(mainIssues).toHaveLength(0)
    })
  })

  describe('Color Contrast Validation', () => {
    it('should calculate contrast ratios correctly', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF')
      expect(ratio).toBe(21) // Perfect contrast
    })

    it('should validate WCAG AA compliance', () => {
      expect(meetsWCAG_AA('#000000', '#FFFFFF')).toBe(true)
      expect(meetsWCAG_AA('#777777', '#FFFFFF')).toBe(false) // 4.478 < 4.5
      expect(meetsWCAG_AA('#AAAAAA', '#FFFFFF')).toBe(false)
    })

    it('should handle large text requirements', () => {
      expect(meetsWCAG_AA('#AAAAAA', '#FFFFFF', true)).toBe(false) // 2.32 < 3.0 for large text
      expect(meetsWCAG_AA('#CCCCCC', '#FFFFFF', true)).toBe(false) // Still too low
    })
  })

  describe('Comprehensive Accessibility Audit', () => {
    it('should run complete audit and return results', () => {
      // Create a page with various accessibility issues
      const img = createMockElement('img', { src: 'test.jpg' }) // Missing alt
      const input = createMockElement('input', { type: 'text' }) // Missing label
      const button = createMockElement('button') // Missing accessible name
      
      document.body.appendChild(img)
      document.body.appendChild(input)
      document.body.appendChild(button)

      const result = runAccessibilityAudit()
      
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.summary.errors).toBeGreaterThan(0)
      expect(result.compliance.wcagAA).toBe(false)
      expect(result.compliance.score).toBeLessThan(100)
    })

    it('should pass audit for accessible page', () => {
      // Create a fully accessible page
      const main = createMockElement('main')
      const skipLink = createMockElement('a', { href: '#main' })
      skipLink.textContent = 'Skip to main content'
      
      const img = createMockElement('img', { src: 'test.jpg', alt: 'Test image' })
      const input = createMockElement('input', { type: 'text', id: 'test-input' })
      const label = createMockElement('label', { for: 'test-input' })
      label.textContent = 'Test Input'
      const button = createMockElement('button')
      button.textContent = 'Submit'
      
      document.body.appendChild(skipLink)
      document.body.appendChild(main)
      main.appendChild(img)
      main.appendChild(label)
      main.appendChild(input)
      main.appendChild(button)

      const result = runAccessibilityAudit()
      
      expect(result.summary.critical).toBe(0)
      expect(result.compliance.score).toBeGreaterThan(80)
    })

    it('should generate accessibility report', () => {
      const report = generateAccessibilityReport()
      
      expect(report).toContain('# Accessibility Audit Report')
      expect(report).toContain('**Score:**')
      expect(report).toContain('**WCAG AA Compliance:**')
      expect(report).toContain('## Summary')
    })
  })

  describe('Property-Based Testing Integration', () => {
    it('should validate focus indicators are visible (Property 42)', () => {
      // **Feature: design-system-refactoring, Property 42: Focus indicator visibility**
      // **Validates: Requirements 13.1**
      
      const button = createMockElement('button')
      button.textContent = 'Test Button'
      button.className = 'focus-ring'
      document.body.appendChild(button)

      const issues = checkKeyboardAccessibility()
      const focusIssues = issues.filter(issue => issue.message.includes('focus indicator'))
      
      // Should not have focus indicator issues for elements with focus-ring class
      expect(focusIssues).toHaveLength(0)
    })

    it('should validate ARIA label presence (Property 44)', () => {
      // **Feature: design-system-refactoring, Property 44: ARIA label presence**
      // **Validates: Requirements 13.3**
      
      const button = createMockElement('button', { 'aria-label': 'Close dialog' })
      const icon = createMockElement('svg')
      button.appendChild(icon)
      document.body.appendChild(button)

      const issues = checkButtonLabels()
      
      // Should not have ARIA label issues for properly labeled elements
      expect(issues).toHaveLength(0)
    })

    it('should validate touch target size compliance (Property 45)', () => {
      // **Feature: design-system-refactoring, Property 45: Touch target size compliance**
      // **Validates: Requirements 13.4**
      
      const button = createMockElement('button')
      button.textContent = 'Test'
      document.body.appendChild(button)

      // Mock proper touch target size
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        width: 44,
        height: 44,
        top: 0,
        left: 0,
        bottom: 44,
        right: 44,
        x: 0,
        y: 0,
        toJSON: () => ({})
      })

      const issues = checkTouchTargets()
      
      // Should not have touch target issues for properly sized elements
      expect(issues).toHaveLength(0)
    })
  })
})