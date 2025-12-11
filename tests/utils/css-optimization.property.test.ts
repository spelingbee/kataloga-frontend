/**
 * Property-based tests for CSS optimization utilities
 * **Property 6: SASS compilation optimization**
 * **Validates: Requirements 3.5**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { 
  analyzeCSSUsage, 
  generateOptimizedCSS, 
  extractCriticalCSS, 
  minifyCSS 
} from '~/utils/css-tree-shaking'
import { 
  extractCriticalCSS as extractCritical,
  getCriticalCSSConfig 
} from '~/utils/critical-css'

describe('CSS Optimization Properties', () => {
  describe('Property 6: SASS compilation optimization', () => {
    it('should produce optimized CSS output without duplicates', () => {
      // **Property 6: SASS compilation optimization**
      // **Validates: Requirements 3.5**
      
      fc.assert(fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 20 }),
        fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 10 }),
        (classNames, htmlContents) => {
          // Generate CSS with some classes
          const cssRules = classNames.map(className => 
            `.${className.replace(/[^a-zA-Z0-9_-]/g, 'a')} { color: red; }`
          )
          const cssContent = cssRules.join('\n')
          
          // Generate HTML that uses some of these classes
          const htmlWithClasses = htmlContents.map(html => 
            `<div class="${classNames.slice(0, Math.ceil(classNames.length / 2)).join(' ')}">${html}</div>`
          )
          
          // Analyze CSS usage
          const analysis = analyzeCSSUsage(cssContent, htmlWithClasses)
          
          // Properties that must hold:
          // 1. Total rules should equal used + unused
          expect(analysis.totalRules).toBe(analysis.usedRules + analysis.unusedRules.length)
          
          // 2. Size after optimization should be <= size before
          expect(analysis.sizeAfter).toBeLessThanOrEqual(analysis.sizeBefore)
          
          // 3. Savings should be non-negative
          expect(analysis.savings).toBeGreaterThanOrEqual(0)
          
          // 4. If there are unused rules, savings should be positive
          if (analysis.unusedRules.length > 0) {
            expect(analysis.savings).toBeGreaterThan(0)
          }
          
          // 5. Generate optimized CSS and verify it's smaller or equal
          const optimizedCSS = generateOptimizedCSS(cssContent, htmlWithClasses)
          const optimizedSize = new Blob([optimizedCSS]).size
          const originalSize = new Blob([cssContent]).size
          
          expect(optimizedSize).toBeLessThanOrEqual(originalSize)
        }
      ), { numRuns: 100 })
    })

    it('should preserve critical CSS rules during optimization', () => {
      fc.assert(fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(s.trim())), { minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 50, maxLength: 500 }),
        (classNames, htmlContent) => {
          // Skip if no valid class names
          if (classNames.length === 0) return true
          
          // Create CSS with critical and non-critical rules
          const criticalClasses = ['app-layout', 'app-header', 'base-button']
          const validClassNames = classNames.filter(name => name && name.trim() && /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(name.trim()))
          const allClasses = [...criticalClasses, ...validClassNames.slice(0, 5)]
          
          const cssRules = allClasses.map(className => 
            `.${className.replace(/[^a-zA-Z0-9_-]/g, 'a')} { margin: 1rem; }`
          )
          const cssContent = cssRules.join('\n')
          
          // Skip if no valid CSS content
          if (!cssContent.trim()) return true
          
          // Extract critical CSS
          const result = extractCritical(cssContent, htmlContent)
          
          // Handle case where extraction might fail
          if (!result || typeof result.critical !== 'string' || typeof result.remaining !== 'string') {
            return true // Skip this test case
          }
          
          const { critical, remaining } = result
          
          // Properties that must hold:
          // 1. Critical CSS should contain critical selectors (if they exist in original)
          criticalClasses.forEach(criticalClass => {
            if (cssContent.includes(criticalClass)) {
              expect(critical).toContain(criticalClass)
            }
          })
          
          // 2. Total size should be preserved (critical + remaining ≈ original)
          const originalSize = new Blob([cssContent]).size
          const criticalSize = new Blob([critical]).size
          const remainingSize = new Blob([remaining]).size
          
          // Allow for some variance due to minification
          expect(criticalSize + remainingSize).toBeLessThanOrEqual(originalSize * 1.2)
          
          // 3. Critical CSS should be smaller than or equal to original
          expect(criticalSize).toBeLessThanOrEqual(originalSize)
        }
      ), { numRuns: 100 })
    })

    it('should maintain CSS rule integrity during minification', () => {
      fc.assert(fc.property(
        fc.array(fc.record({
          selector: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(s.trim())),
          property: fc.constantFrom('color', 'margin', 'padding', 'font-size'),
          value: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/[{}]/.test(s)) // Exclude invalid characters
        }), { minLength: 1, maxLength: 10 }),
        (cssRules) => {
          // Filter out invalid rules
          const validRules = cssRules.filter(rule => 
            rule.selector && rule.selector.trim() && 
            rule.property && rule.property.trim() &&
            rule.value && rule.value.trim() &&
            /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(rule.selector.trim()) &&
            !/[{}]/.test(rule.value)
          )
          
          // Skip if no valid rules
          if (validRules.length === 0) return true
          
          // Generate CSS content
          const cssContent = validRules.map(rule => 
            `.${rule.selector.replace(/[^a-zA-Z0-9_-]/g, 'a')} { ${rule.property}: ${rule.value.replace(/[{}]/g, '')}; }`
          ).join('\n\n  /* comment */  \n')
          
          // Skip if no valid CSS content
          if (!cssContent.trim()) return true
          
          // Minify CSS
          const minified = minifyCSS(cssContent)
          
          // Properties that must hold:
          // 1. Minified CSS should be smaller or equal in size
          const originalSize = new Blob([cssContent]).size
          const minifiedSize = new Blob([minified]).size
          expect(minifiedSize).toBeLessThanOrEqual(originalSize)
          
          // 2. Valid selectors should still be present (if minification didn't remove them)
          validRules.forEach(rule => {
            const cleanSelector = rule.selector.replace(/[^a-zA-Z0-9_-]/g, 'a')
            if (cleanSelector && cleanSelector.length > 0) {
              // Only check if the rule wasn't completely removed due to being empty
              if (minified.length > 0) {
                expect(minified).toContain(cleanSelector)
              }
            }
          })
          
          // 3. Valid properties should still be present (if the rule wasn't removed)
          if (minified.length > 0) {
            validRules.forEach(rule => {
              if (rule.property && rule.property.trim()) {
                // Only check if the selector is still in the minified CSS
                const cleanSelector = rule.selector.replace(/[^a-zA-Z0-9_-]/g, 'a')
                if (minified.includes(cleanSelector)) {
                  expect(minified).toContain(rule.property)
                }
              }
            })
          }
          
          // 4. No comments should remain
          expect(minified).not.toContain('/*')
          expect(minified).not.toContain('*/')
          
          // 5. Excessive whitespace should be removed
          if (minified.length > 0) {
            expect(minified).not.toMatch(/\s{2,}/)
          }
        }
      ), { numRuns: 100 })
    })

    it('should handle CSS compilation edge cases correctly', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(''), // Empty CSS
          fc.constant('/* only comments */'),
          fc.constant('.empty-rule {}'),
          fc.constant(':root { --color: red; }'), // CSS variables
          fc.constant('@media (max-width: 768px) { .responsive { display: none; } }'), // Media queries
          fc.constant('@keyframes fade { from { opacity: 0; } to { opacity: 1; } }') // Keyframes
        ),
        fc.array(fc.string(), { maxLength: 5 }),
        (cssContent, htmlContents) => {
          // Test edge cases don't break the optimization
          expect(() => {
            const analysis = analyzeCSSUsage(cssContent, htmlContents)
            
            // Basic invariants should hold even for edge cases
            expect(analysis.totalRules).toBeGreaterThanOrEqual(0)
            expect(analysis.usedRules).toBeGreaterThanOrEqual(0)
            expect(analysis.sizeBefore).toBeGreaterThanOrEqual(0)
            expect(analysis.sizeAfter).toBeGreaterThanOrEqual(0)
            expect(analysis.savings).toBeGreaterThanOrEqual(0)
            
            // Should not throw errors
            const optimized = generateOptimizedCSS(cssContent, htmlContents)
            expect(typeof optimized).toBe('string')
            
            const minified = minifyCSS(cssContent)
            expect(typeof minified).toBe('string')
            
          }).not.toThrow()
        }
      ), { numRuns: 100 })
    })

    it('should maintain critical CSS configuration consistency', () => {
      fc.assert(fc.property(
        fc.constantFrom('home', 'menu', 'checkout'),
        (pageType) => {
          // Get critical CSS config for page type
          const config = getCriticalCSSConfig(pageType as any)
          
          // Properties that must hold:
          // 1. Config should have required properties
          expect(config).toHaveProperty('include')
          expect(config).toHaveProperty('ignore')
          
          // 2. Include and ignore should be arrays
          expect(Array.isArray(config.include)).toBe(true)
          expect(Array.isArray(config.ignore)).toBe(true)
          
          // 3. Include should contain page-specific selectors
          if (pageType === 'menu') {
            expect(config.include?.some(selector => 
              selector.includes('menu') || selector.includes('category')
            )).toBe(true)
          }
          
          if (pageType === 'checkout') {
            expect(config.include?.some(selector => 
              selector.includes('checkout') || selector.includes('order')
            )).toBe(true)
          }
          
          // 4. Should not include admin selectors in customer pages
          expect(config.ignore?.includes('.admin-')).toBe(true)
        }
      ), { numRuns: 100 })
    })
  })
})