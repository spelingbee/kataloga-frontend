/**
 * CSS Tree-shaking utilities
 * Removes unused CSS classes and optimizes bundle size
 */

interface CSSAnalysis {
  totalRules: number
  usedRules: number
  unusedRules: string[]
  sizeBefore: number
  sizeAfter: number
  savings: number
}

/**
 * Analyze CSS usage in the application
 */
export function analyzeCSSUsage(cssContent: string, htmlContent: string[]): CSSAnalysis {
  const cssRules = extractCSSRules(cssContent)
  const usedClasses = extractUsedClasses(htmlContent)
  
  const usedRules: string[] = []
  const unusedRules: string[] = []
  
  cssRules.forEach(rule => {
    const classNames = extractClassNamesFromRule(rule)
    const isUsed = classNames.some(className => usedClasses.has(className))
    
    if (isUsed) {
      usedRules.push(rule)
    } else {
      unusedRules.push(rule)
    }
  })
  
  const sizeBefore = new Blob([cssContent]).size
  const optimizedCSS = usedRules.join('\n')
  const sizeAfter = new Blob([optimizedCSS]).size
  
  return {
    totalRules: cssRules.length,
    usedRules: usedRules.length,
    unusedRules,
    sizeBefore,
    sizeAfter,
    savings: sizeBefore - sizeAfter
  }
}

/**
 * Extract CSS rules from content
 */
function extractCSSRules(cssContent: string): string[] {
  // Remove comments
  const cleanCSS = cssContent.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // Split by closing braces to get individual rules
  const rules = cleanCSS.split('}').filter(rule => rule.trim())
  
  return rules.map(rule => rule.trim() + '}')
}

/**
 * Extract used class names from HTML content
 */
function extractUsedClasses(htmlContent: string[]): Set<string> {
  const usedClasses = new Set<string>()
  
  htmlContent.forEach(html => {
    // Validate HTML content
    if (!html || typeof html !== 'string') {
      return
    }
    
    // Extract class attributes
    const classMatches = html.match(/class\s*=\s*["']([^"']+)["']/g)
    
    if (classMatches) {
      classMatches.forEach(match => {
        const classes = match.replace(/class\s*=\s*["']([^"']+)["']/, '$1')
        classes.split(/\s+/).forEach(className => {
          const cleanClassName = className.trim()
          // Only add valid CSS class names (not empty, not just whitespace, valid characters)
          if (cleanClassName && /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(cleanClassName)) {
            usedClasses.add(cleanClassName)
          }
        })
      })
    }
    
    // Extract dynamic class bindings (Vue.js)
    const dynamicClassMatches = html.match(/:class\s*=\s*["']([^"']+)["']/g)
    
    if (dynamicClassMatches) {
      dynamicClassMatches.forEach(match => {
        // Extract potential class names from dynamic bindings
        const expression = match.replace(/:class\s*=\s*["']([^"']+)["']/, '$1')
        const classNames = expression.match(/['"`]([^'"`]+)['"`]/g)
        
        if (classNames) {
          classNames.forEach(className => {
            const clean = className.replace(/['"`]/g, '').trim()
            // Only add valid CSS class names
            if (clean && /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(clean)) {
              usedClasses.add(clean)
            }
          })
        }
      })
    }
  })
  
  return usedClasses
}

/**
 * Extract class names from CSS rule
 */
function extractClassNamesFromRule(rule: string): string[] {
  const classNames: string[] = []
  
  // Validate rule
  if (!rule || typeof rule !== 'string') {
    return classNames
  }
  
  // Match class selectors (.class-name)
  const classMatches = rule.match(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g)
  
  if (classMatches) {
    classMatches.forEach(match => {
      const className = match.substring(1) // Remove the dot
      // Additional validation for class name
      if (className && /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(className)) {
        classNames.push(className)
      }
    })
  }
  
  return classNames
}

/**
 * Generate optimized CSS with only used rules
 */
export function generateOptimizedCSS(cssContent: string, htmlContent: string[]): string {
  const analysis = analyzeCSSUsage(cssContent, htmlContent)
  const cssRules = extractCSSRules(cssContent)
  const usedClasses = extractUsedClasses(htmlContent)
  
  const usedRules = cssRules.filter(rule => {
    const classNames = extractClassNamesFromRule(rule)
    return classNames.some(className => usedClasses.has(className))
  })
  
  return usedRules.join('\n')
}

/**
 * Critical CSS extraction for above-the-fold content (tree-shaking version)
 * Note: extractCriticalCSS is also available in critical-css.ts
 * This version is optimized for tree-shaking scenarios
 */
export function extractCriticalCSSForTreeShaking(cssContent: string, criticalSelectors: string[]): string {
  const cssRules = extractCSSRules(cssContent)
  
  const criticalRules = cssRules.filter(rule => {
    return criticalSelectors.some(selector => {
      // Check if rule contains critical selector
      return rule.includes(selector)
    })
  })
  
  return criticalRules.join('\n')
}

/**
 * Get critical selectors for above-the-fold content
 */
export function getCriticalSelectors(): string[] {
  return [
    // Layout
    '.app-layout',
    '.app-header',
    '.app-navigation',
    '.container',
    '.grid',
    
    // Typography
    'h1', 'h2', 'h3',
    '.text-',
    '.font-',
    
    // Buttons (critical for interaction)
    '.base-button',
    '.btn',
    
    // Cards (likely above fold)
    '.base-card',
    '.menu-item-card',
    
    // Loading states
    '.loading',
    '.skeleton',
    '.spinner',
    
    // Theme variables
    ':root',
    '[data-theme',
    
    // Responsive utilities
    '@media',
    
    // Accessibility
    '.sr-only',
    '.focus-visible',
    
    // Critical animations
    '.fade-in',
    '.slide-in'
  ]
}

/**
 * Minify CSS content
 */
export function minifyCSS(cssContent: string): string {
  // Validate input
  if (!cssContent || typeof cssContent !== 'string') {
    return ''
  }
  
  try {
    return cssContent
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove whitespace around special characters
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      // Remove trailing semicolons
      .replace(/;}/g, '}')
      // Remove empty rules (but preserve valid selectors)
      .replace(/[^{}]*{\s*}/g, '')
      // Remove malformed rules (rules with invalid characters in values)
      .replace(/[^{}]*{[^}]*[!@#$%^&*()+=\[\]\\|;':"<>?/][^}]*}/g, '')
      .trim()
  } catch (error) {
    // If minification fails, return original content
    console.warn('CSS minification failed:', error)
    return cssContent
  }
}

/**
 * CSS optimization report
 */
export function generateCSSOptimizationReport(analysis: CSSAnalysis): string {
  const savingsPercent = ((analysis.savings / analysis.sizeBefore) * 100).toFixed(2)
  
  return `
CSS Optimization Report
======================

Total Rules: ${analysis.totalRules}
Used Rules: ${analysis.usedRules}
Unused Rules: ${analysis.unusedRules.length}

Size Before: ${formatBytesLocal(analysis.sizeBefore)}
Size After: ${formatBytesLocal(analysis.sizeAfter)}
Savings: ${formatBytesLocal(analysis.savings)} (${savingsPercent}%)

Unused Rules:
${analysis.unusedRules.slice(0, 10).map(rule => `- ${rule.substring(0, 100)}...`).join('\n')}
${analysis.unusedRules.length > 10 ? `... and ${analysis.unusedRules.length - 10} more` : ''}
  `.trim()
}

/**
 * Format bytes to human readable format (local helper)
 */
function formatBytesLocal(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
