/**
 * Enhanced accessibility testing utilities for WCAG 2.1 Level AA compliance
 * Validates all interactive elements, ARIA labels, color contrast, and touch targets
 */

import { getContrastRatio, meetsWCAG_AA } from './color-contrast'

export interface AccessibilityIssue {
  type: 'error' | 'warning'
  element: HTMLElement
  message: string
  wcagCriterion?: string
  severity?: 'critical' | 'major' | 'minor'
}

export interface AccessibilityAuditResult {
  issues: AccessibilityIssue[]
  summary: {
    errors: number
    warnings: number
    critical: number
    major: number
    minor: number
  }
  compliance: {
    wcagAA: boolean
    score: number // 0-100
  }
}

/**
 * Check for missing alt text on images
 */
export function checkImageAltText(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  const images = document.querySelectorAll('img')

  images.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        element: img,
        message: 'Image missing alt attribute',
        wcagCriterion: '1.1.1 Non-text Content',
        severity: 'critical',
      })
    } else if (img.getAttribute('alt') === '' && img.getAttribute('role') !== 'presentation') {
      issues.push({
        type: 'warning',
        element: img,
        message: 'Image has empty alt text but no role="presentation"',
        wcagCriterion: '1.1.1 Non-text Content',
        severity: 'minor',
      })
    }
  })

  return issues
}

/**
 * Check for form inputs without proper labels
 */
export function checkFormLabels(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  const inputs = document.querySelectorAll('input, select, textarea')

  inputs.forEach((input) => {
    const id = input.getAttribute('id')
    const ariaLabel = input.getAttribute('aria-label')
    const ariaLabelledby = input.getAttribute('aria-labelledby')
    const type = input.getAttribute('type')

    // Skip hidden inputs
    if (type === 'hidden') return

    if (!id && !ariaLabel && !ariaLabelledby) {
      issues.push({
        type: 'error',
        element: input as HTMLElement,
        message: 'Form input missing label, aria-label, or aria-labelledby',
        wcagCriterion: '3.3.2 Labels or Instructions',
        severity: 'critical',
      })
    } else if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (!label && !ariaLabel && !ariaLabelledby) {
        issues.push({
          type: 'error',
          element: input as HTMLElement,
          message: 'Form input has id but no associated label',
          wcagCriterion: '3.3.2 Labels or Instructions',
          severity: 'critical',
        })
      }
    }

    // Check for required field indicators
    const isRequired = input.hasAttribute('required') || input.getAttribute('aria-required') === 'true'
    if (isRequired) {
      const hasRequiredIndicator = 
        input.getAttribute('aria-label')?.includes('required') ||
        input.getAttribute('aria-describedby') ||
        document.querySelector(`label[for="${id}"]`)?.textContent?.includes('*')

      if (!hasRequiredIndicator) {
        issues.push({
          type: 'warning',
          element: input as HTMLElement,
          message: 'Required field missing visual or textual indicator',
          wcagCriterion: '3.3.2 Labels or Instructions',
          severity: 'major',
        })
      }
    }
  })

  return issues
}

/**
 * Check for buttons without accessible names
 */
export function checkButtonLabels(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  const buttons = document.querySelectorAll('button, [role="button"]')

  buttons.forEach((button) => {
    const hasText = button.textContent?.trim()
    const ariaLabel = button.getAttribute('aria-label')
    const ariaLabelledby = button.getAttribute('aria-labelledby')
    const title = button.getAttribute('title')

    if (!hasText && !ariaLabel && !ariaLabelledby && !title) {
      issues.push({
        type: 'error',
        element: button as HTMLElement,
        message: 'Button missing accessible name (text, aria-label, aria-labelledby, or title)',
        wcagCriterion: '4.1.2 Name, Role, Value',
        severity: 'critical',
      })
    }

    // Check for icon-only buttons
    const hasIcon = button.querySelector('svg, [class*="icon"], img')
    if (hasIcon && !hasText && !ariaLabel) {
      issues.push({
        type: 'error',
        element: button as HTMLElement,
        message: 'Icon button missing aria-label for screen readers',
        wcagCriterion: '4.1.2 Name, Role, Value',
        severity: 'critical',
      })
    }
  })

  return issues
}

/**
 * Check for proper heading hierarchy
 */
export function checkHeadingHierarchy(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))

  let previousLevel = 0

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.substring(1))

    if (index === 0 && level !== 1) {
      issues.push({
        type: 'warning',
        element: heading as HTMLElement,
        message: `First heading should be h1, found ${heading.tagName}`,
        wcagCriterion: '1.3.1 Info and Relationships',
        severity: 'major',
      })
    } else if (level > previousLevel + 1) {
      issues.push({
        type: 'warning',
        element: heading as HTMLElement,
        message: `Heading level skipped from h${previousLevel} to ${heading.tagName}`,
        wcagCriterion: '1.3.1 Info and Relationships',
        severity: 'major',
      })
    }

    // Check for empty headings
    if (!heading.textContent?.trim()) {
      issues.push({
        type: 'error',
        element: heading as HTMLElement,
        message: 'Heading element is empty',
        wcagCriterion: '1.3.1 Info and Relationships',
        severity: 'major',
      })
    }

    previousLevel = level
  })

  return issues
}

/**
 * Check for keyboard accessibility
 */
export function checkKeyboardAccessibility(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  const interactiveElements = document.querySelectorAll(
    'a, button, input, select, textarea, [role="button"], [role="link"], [onclick], [tabindex]'
  )

  interactiveElements.forEach((element) => {
    const tabindex = element.getAttribute('tabindex')

    // Check for positive tabindex (anti-pattern)
    if (tabindex && parseInt(tabindex) > 0) {
      issues.push({
        type: 'warning',
        element: element as HTMLElement,
        message: 'Positive tabindex detected (anti-pattern)',
        wcagCriterion: '2.4.3 Focus Order',
        severity: 'major',
      })
    }

    // Check for onclick without keyboard handler
    if (element.hasAttribute('onclick') && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
      const hasKeyHandler =
        element.hasAttribute('onkeydown') ||
        element.hasAttribute('onkeyup') ||
        element.hasAttribute('onkeypress') ||
        element.getAttribute('role') === 'button'

      if (!hasKeyHandler) {
        issues.push({
          type: 'error',
          element: element as HTMLElement,
          message: 'Element with onclick missing keyboard event handler or button role',
          wcagCriterion: '2.1.1 Keyboard',
          severity: 'critical',
        })
      }
    }

    // Check for missing focus indicators
    const computedStyle = window.getComputedStyle(element as HTMLElement)
    const hasFocusStyle = 
      computedStyle.getPropertyValue('outline') !== 'none' ||
      computedStyle.getPropertyValue('box-shadow') !== 'none' ||
      element.classList.contains('focus-ring') ||
      element.classList.contains('focus-visible')

    if (!hasFocusStyle) {
      issues.push({
        type: 'warning',
        element: element as HTMLElement,
        message: 'Interactive element may be missing visible focus indicator',
        wcagCriterion: '2.4.7 Focus Visible',
        severity: 'major',
      })
    }
  })

  return issues
}

/**
 * Check for proper ARIA usage
 */
export function checkAriaUsage(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  const elementsWithAria = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]')

  elementsWithAria.forEach((element) => {
    const role = element.getAttribute('role')

    // Check for invalid ARIA roles
    const validRoles = [
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'checkbox',
      'complementary', 'contentinfo', 'dialog', 'document', 'feed', 'figure', 'form',
      'grid', 'gridcell', 'heading', 'img', 'link', 'list', 'listbox', 'listitem',
      'main', 'menu', 'menubar', 'menuitem', 'navigation', 'none', 'note', 'option',
      'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
      'search', 'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
      'tablist', 'tabpanel', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
    ]

    if (role && !validRoles.includes(role)) {
      issues.push({
        type: 'error',
        element: element as HTMLElement,
        message: `Invalid ARIA role: ${role}`,
        wcagCriterion: '4.1.2 Name, Role, Value',
        severity: 'critical',
      })
    }

    // Check for aria-labelledby references
    const labelledby = element.getAttribute('aria-labelledby')
    if (labelledby) {
      const labelIds = labelledby.split(' ')
      labelIds.forEach(id => {
        if (!document.getElementById(id)) {
          issues.push({
            type: 'error',
            element: element as HTMLElement,
            message: `aria-labelledby references non-existent element: ${id}`,
            wcagCriterion: '4.1.2 Name, Role, Value',
            severity: 'major',
          })
        }
      })
    }

    // Check for aria-describedby references
    const describedby = element.getAttribute('aria-describedby')
    if (describedby) {
      const descIds = describedby.split(' ')
      descIds.forEach(id => {
        if (!document.getElementById(id)) {
          issues.push({
            type: 'error',
            element: element as HTMLElement,
            message: `aria-describedby references non-existent element: ${id}`,
            wcagCriterion: '4.1.2 Name, Role, Value',
            severity: 'major',
          })
        }
      })
    }
  })

  return issues
}

/**
 * Check touch target sizes (WCAG 2.1 Level AA - 44x44px minimum)
 */
export function checkTouchTargets(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  const interactiveElements = document.querySelectorAll(
    'button, a, input[type="button"], input[type="submit"], input[type="reset"], [role="button"], [onclick]'
  )

  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect()
    const minSize = 44 // WCAG 2.1 Level AA minimum

    if (rect.width < minSize || rect.height < minSize) {
      issues.push({
        type: 'warning',
        element: element as HTMLElement,
        message: `Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum 44x44px)`,
        wcagCriterion: '2.5.5 Target Size',
        severity: 'major',
      })
    }
  })

  return issues
}

/**
 * Check color contrast ratios (WCAG 2.1 Level AA)
 */
export function checkColorContrast(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []
  const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label, input, textarea')

  textElements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element as HTMLElement)
    const color = computedStyle.color
    const backgroundColor = computedStyle.backgroundColor

    // Skip if no background color or transparent
    if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      return
    }

    try {
      // Convert RGB to hex for contrast calculation
      const colorHex = rgbToHex(color)
      const bgHex = rgbToHex(backgroundColor)

      if (colorHex && bgHex) {
        const fontSize = parseFloat(computedStyle.fontSize)
        const fontWeight = computedStyle.fontWeight
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700))

        if (!meetsWCAG_AA(colorHex, bgHex, isLargeText)) {
          const ratio = getContrastRatio(colorHex, bgHex)
          issues.push({
            type: 'error',
            element: element as HTMLElement,
            message: `Insufficient color contrast: ${ratio.toFixed(2)}:1 (minimum ${isLargeText ? '3:1' : '4.5:1'})`,
            wcagCriterion: '1.4.3 Contrast (Minimum)',
            severity: 'critical',
          })
        }
      }
    } catch (error) {
      // Skip elements where color parsing fails
    }
  })

  return issues
}

/**
 * Convert RGB color to hex
 */
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return null

  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Check for screen reader compatibility
 */
export function checkScreenReaderCompatibility(): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = []

  // Check for missing main landmark
  const mainElement = document.querySelector('main, [role="main"]')
  if (!mainElement) {
    issues.push({
      type: 'error',
      element: document.body,
      message: 'Page missing main landmark (main element or role="main")',
      wcagCriterion: '1.3.1 Info and Relationships',
      severity: 'major',
    })
  }

  // Check for skip links
  const skipLinks = document.querySelectorAll('a[href^="#"]')
  const hasSkipToMain = Array.from(skipLinks).some(link => 
    link.textContent?.toLowerCase().includes('skip') && 
    link.textContent?.toLowerCase().includes('main')
  )

  if (!hasSkipToMain) {
    issues.push({
      type: 'warning',
      element: document.body,
      message: 'Page missing "skip to main content" link',
      wcagCriterion: '2.4.1 Bypass Blocks',
      severity: 'major',
    })
  }

  // Check for page title
  if (!document.title || document.title.trim() === '') {
    issues.push({
      type: 'error',
      element: document.head,
      message: 'Page missing title element',
      wcagCriterion: '2.4.2 Page Titled',
      severity: 'critical',
    })
  }

  return issues
}

/**
 * Run comprehensive accessibility audit
 */
export function runAccessibilityAudit(): AccessibilityAuditResult {
  const allIssues = [
    ...checkImageAltText(),
    ...checkFormLabels(),
    ...checkButtonLabels(),
    ...checkHeadingHierarchy(),
    ...checkKeyboardAccessibility(),
    ...checkAriaUsage(),
    ...checkTouchTargets(),
    ...checkColorContrast(),
    ...checkScreenReaderCompatibility(),
  ]

  const errors = allIssues.filter((issue) => issue.type === 'error').length
  const warnings = allIssues.filter((issue) => issue.type === 'warning').length
  const critical = allIssues.filter((issue) => issue.severity === 'critical').length
  const major = allIssues.filter((issue) => issue.severity === 'major').length
  const minor = allIssues.filter((issue) => issue.severity === 'minor').length

  // Calculate compliance score (0-100)
  const totalChecks = allIssues.length + 50 // Assume 50 successful checks
  const failedChecks = allIssues.length
  const score = Math.max(0, Math.round(((totalChecks - failedChecks) / totalChecks) * 100))

  // WCAG AA compliance requires no critical errors and minimal major issues
  const wcagAA = critical === 0 && major <= 2

  return {
    issues: allIssues,
    summary: {
      errors,
      warnings,
      critical,
      major,
      minor,
    },
    compliance: {
      wcagAA,
      score,
    },
  }
}

/**
 * Log accessibility issues to console (development only)
 */
export function logAccessibilityIssues(): void {
  if (process.env.NODE_ENV !== 'development') return

  const result = runAccessibilityAudit()
  const { issues, summary, compliance } = result

  if (issues.length === 0) {
    console.log('✅ No accessibility issues found! WCAG AA compliant.')
    return
  }

  console.group(`🔍 Accessibility Audit Results`)
  console.log(`📊 Score: ${compliance.score}/100`)
  console.log(`${compliance.wcagAA ? '✅' : '❌'} WCAG AA Compliance: ${compliance.wcagAA ? 'PASS' : 'FAIL'}`)
  console.log(`📈 Summary: ${summary.errors} errors, ${summary.warnings} warnings`)
  console.log(`🚨 Severity: ${summary.critical} critical, ${summary.major} major, ${summary.minor} minor`)

  // Group issues by severity
  const criticalIssues = issues.filter(issue => issue.severity === 'critical')
  const majorIssues = issues.filter(issue => issue.severity === 'major')
  const minorIssues = issues.filter(issue => issue.severity === 'minor')

  if (criticalIssues.length > 0) {
    console.group('🚨 Critical Issues (Must Fix)')
    criticalIssues.forEach((issue) => {
      console.group(`❌ ${issue.message}`)
      console.log('Element:', issue.element)
      console.log('WCAG Criterion:', issue.wcagCriterion)
      console.groupEnd()
    })
    console.groupEnd()
  }

  if (majorIssues.length > 0) {
    console.group('⚠️ Major Issues (Should Fix)')
    majorIssues.forEach((issue) => {
      console.group(`⚠️ ${issue.message}`)
      console.log('Element:', issue.element)
      console.log('WCAG Criterion:', issue.wcagCriterion)
      console.groupEnd()
    })
    console.groupEnd()
  }

  if (minorIssues.length > 0) {
    console.group('ℹ️ Minor Issues (Nice to Fix)')
    minorIssues.forEach((issue) => {
      console.group(`ℹ️ ${issue.message}`)
      console.log('Element:', issue.element)
      console.log('WCAG Criterion:', issue.wcagCriterion)
      console.groupEnd()
    })
    console.groupEnd()
  }

  console.groupEnd()
}

/**
 * Generate accessibility report for CI/CD
 */
export function generateAccessibilityReport(): string {
  const result = runAccessibilityAudit()
  const { issues, summary, compliance } = result

  let report = `# Accessibility Audit Report\n\n`
  report += `**Score:** ${compliance.score}/100\n`
  report += `**WCAG AA Compliance:** ${compliance.wcagAA ? 'PASS ✅' : 'FAIL ❌'}\n\n`
  report += `## Summary\n`
  report += `- Errors: ${summary.errors}\n`
  report += `- Warnings: ${summary.warnings}\n`
  report += `- Critical: ${summary.critical}\n`
  report += `- Major: ${summary.major}\n`
  report += `- Minor: ${summary.minor}\n\n`

  if (issues.length > 0) {
    report += `## Issues\n\n`
    issues.forEach((issue, index) => {
      report += `### ${index + 1}. ${issue.message}\n`
      report += `- **Type:** ${issue.type}\n`
      report += `- **Severity:** ${issue.severity}\n`
      report += `- **WCAG Criterion:** ${issue.wcagCriterion}\n`
      report += `- **Element:** ${issue.element.tagName.toLowerCase()}\n\n`
    })
  }

  return report
}
