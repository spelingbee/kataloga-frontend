/**
 * Development-only accessibility plugin
 * Automatically runs accessibility audits and provides keyboard shortcuts for testing
 */

import { logAccessibilityIssues, runAccessibilityAudit } from '~/utils/accessibility-testing'
import { safeArrayAccess } from '~/types/utils/type-guards'

export default defineNuxtPlugin(() => {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') return

  let auditTimeout: NodeJS.Timeout | null = null
  let isAuditRunning = false

  /**
   * Run accessibility audit with debouncing
   */
  const runAudit = () => {
    if (isAuditRunning) return

    if (auditTimeout) {
      clearTimeout(auditTimeout)
    }

    auditTimeout = setTimeout(() => {
      isAuditRunning = true

      try {
        logAccessibilityIssues()
      } catch (error) {
        console.error('Accessibility audit failed:', error)
      } finally {
        isAuditRunning = false
      }
    }, 1000) // Debounce for 1 second
  }

  /**
   * Show accessibility score in console
   */
  const showAccessibilityScore = () => {
    const result = runAccessibilityAudit()
    const { compliance, summary } = result

    console.group('🔍 Accessibility Score')
    console.log(`📊 Score: ${compliance.score}/100`)
    console.log(`${compliance.wcagAA ? '✅' : '❌'} WCAG AA: ${compliance.wcagAA ? 'PASS' : 'FAIL'}`)
    console.log(`🚨 Issues: ${summary.critical} critical, ${summary.major} major, ${summary.minor} minor`)
    console.groupEnd()
  }

  /**
   * Highlight all interactive elements for visual inspection
   */
  const highlightInteractiveElements = () => {
    const elements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    )

    elements.forEach((element) => {
      const el = element as HTMLElement
      el.style.outline = '2px solid #FF6B35'
      el.style.outlineOffset = '2px'

      // Add touch target size indicator
      const rect = el.getBoundingClientRect()
      if (rect.width < 44 || rect.height < 44) {
        el.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
        el.title = `Touch target: ${Math.round(rect.width)}x${Math.round(rect.height)}px (min: 44x44px)`
      }
    })

    console.log(`🎯 Highlighted ${elements.length} interactive elements`)

    // Remove highlights after 5 seconds
    setTimeout(() => {
      elements.forEach((element) => {
        const el = element as HTMLElement
        el.style.outline = ''
        el.style.outlineOffset = ''
        el.style.backgroundColor = ''
        if (el.title?.includes('Touch target:')) {
          el.title = ''
        }
      })
    }, 5000)
  }

  /**
   * Show heading hierarchy
   */
  const showHeadingHierarchy = () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')

    console.group('📋 Heading Hierarchy')
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1))
      const indent = '  '.repeat(level - 1)
      const text = heading.textContent?.trim() || '[Empty heading]'
      console.log(`${indent}${heading.tagName}: ${text}`)

      // Highlight in DOM
      const el = heading as HTMLElement
      el.style.outline = `${level}px solid #3B82F6`
      el.style.outlineOffset = '2px'
    })
    console.groupEnd()

    // Remove highlights after 3 seconds
    setTimeout(() => {
      headings.forEach((heading) => {
        const el = heading as HTMLElement
        el.style.outline = ''
        el.style.outlineOffset = ''
      })
    }, 3000)
  }

  /**
   * Test keyboard navigation
   */
  const testKeyboardNavigation = () => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]

    console.group('⌨️ Keyboard Navigation Test')
    console.log(`Found ${focusableElements.length} focusable elements`)

    let currentIndex = 0

    const focusNext = () => {
      if (currentIndex < focusableElements.length) {
        const element = focusableElements[currentIndex]
        if (element) {
          element.focus()
          element.style.outline = '3px solid #10B981'
          element.style.outlineOffset = '2px'

          console.log(`${currentIndex + 1}/${focusableElements.length}: ${element.tagName} - ${element.textContent?.trim() || element.getAttribute('aria-label') || '[No accessible name]'}`)
        }

        // Remove previous highlight
        if (currentIndex > 0) {
          const prevElement = focusableElements[currentIndex - 1]
          if (prevElement) {
            prevElement.style.outline = ''
            prevElement.style.outlineOffset = ''
          }
        }

        currentIndex++

        if (currentIndex < focusableElements.length) {
          setTimeout(focusNext, 1000)
        } else {
          console.log('✅ Keyboard navigation test complete')
          console.groupEnd()
          // Remove last highlight
          if (element) {
            element.style.outline = ''
            element.style.outlineOffset = ''
          }
        }
      }
    }

    if (focusableElements.length > 0) {
      focusNext()
    } else {
      console.log('❌ No focusable elements found')
      console.groupEnd()
    }
  }

  /**
   * Check color contrast of all text elements
   */
  const checkColorContrast = () => {
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label')
    let passCount = 0
    let failCount = 0

    console.group('🎨 Color Contrast Check')

    textElements.forEach((element) => {
      const el = element as HTMLElement
      const computedStyle = window.getComputedStyle(el)
      const color = computedStyle.color
      const backgroundColor = computedStyle.backgroundColor

      // Skip if no background or transparent
      if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        return
      }

      try {
        // Simple contrast check (would need full implementation for production)
        const colorLuminance = getLuminanceFromRGB(color)
        const bgLuminance = getLuminanceFromRGB(backgroundColor)

        if (colorLuminance !== null && bgLuminance !== null) {
          const ratio = (Math.max(colorLuminance, bgLuminance) + 0.05) / (Math.min(colorLuminance, bgLuminance) + 0.05)
          const fontSize = parseFloat(computedStyle.fontSize)
          const isLargeText = fontSize >= 18
          const requiredRatio = isLargeText ? 3 : 4.5

          if (ratio >= requiredRatio) {
            passCount++
          } else {
            failCount++
            el.style.outline = '2px solid #EF4444'
            el.style.outlineOffset = '1px'
            console.warn(`❌ Low contrast: ${ratio.toFixed(2)}:1 (required: ${requiredRatio}:1)`, el)
          }
        }
      } catch (error) {
        // Skip elements where parsing fails
      }
    })

    console.log(`✅ Passed: ${passCount} elements`)
    console.log(`❌ Failed: ${failCount} elements`)
    console.groupEnd()

    // Remove highlights after 5 seconds
    setTimeout(() => {
      textElements.forEach((element) => {
        const el = element as HTMLElement
        el.style.outline = ''
        el.style.outlineOffset = ''
      })
    }, 5000)
  }

  /**
   * Simple luminance calculation helper
   */
  const getLuminanceFromRGB = (rgbString: string): number | null => {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (!match) return null

    const r = parseInt(safeArrayAccess(match, 1) || '0')
    const g = parseInt(safeArrayAccess(match, 2) || '0')
    const b = parseInt(safeArrayAccess(match, 3) || '0')
    
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const sRGB = c / 255
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * (rs || 0) + 0.7152 * (gs || 0) + 0.0722 * (bs || 0)
  }

  // Set up keyboard shortcuts
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl/Cmd + Shift + A: Run accessibility audit
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
      event.preventDefault()
      runAudit()
    }

    // Ctrl/Cmd + Shift + S: Show accessibility score
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
      event.preventDefault()
      showAccessibilityScore()
    }

    // Ctrl/Cmd + Shift + H: Highlight interactive elements
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
      event.preventDefault()
      highlightInteractiveElements()
    }

    // Ctrl/Cmd + Shift + G: Show heading hierarchy
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'G') {
      event.preventDefault()
      showHeadingHierarchy()
    }

    // Ctrl/Cmd + Shift + K: Test keyboard navigation
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'K') {
      event.preventDefault()
      testKeyboardNavigation()
    }

    // Ctrl/Cmd + Shift + C: Check color contrast
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
      event.preventDefault()
      checkColorContrast()
    }
  }

  // Add event listeners
  // document.addEventListener('keydown', handleKeyDown)

  // Run initial audit after page load
  // if (document.readyState === 'complete') {
  //   setTimeout(runAudit, 2000)
  // } else {
  //   window.addEventListener('load', () => {
  //     setTimeout(runAudit, 2000)
  //   })
  // }

  // Run audit on DOM changes (debounced)
  const observer = new MutationObserver(() => {
    // runAudit()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id', 'aria-label', 'aria-labelledby', 'aria-describedby', 'role']
  })

  // Log available shortcuts
  console.group('🔧 Accessibility Development Tools')
  console.log('Keyboard shortcuts:')
  console.log('  Ctrl/Cmd + Shift + A: Run accessibility audit')
  console.log('  Ctrl/Cmd + Shift + S: Show accessibility score')
  console.log('  Ctrl/Cmd + Shift + H: Highlight interactive elements')
  console.log('  Ctrl/Cmd + Shift + G: Show heading hierarchy')
  console.log('  Ctrl/Cmd + Shift + K: Test keyboard navigation')
  console.log('  Ctrl/Cmd + Shift + C: Check color contrast')
  console.groupEnd()

  // Cleanup on unmount
  return {
    provide: {
      accessibility: {
        runAudit,
        showAccessibilityScore,
        highlightInteractiveElements,
        showHeadingHierarchy,
        testKeyboardNavigation,
        checkColorContrast
      }
    }
  }
})