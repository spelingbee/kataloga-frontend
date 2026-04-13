/**
 * Critical CSS inlining utilities
 * Extracts and inlines critical CSS for above-the-fold content
 */

interface CriticalCSSOptions {
  width?: number
  height?: number
  timeout?: number
  ignore?: string[]
  include?: string[]
  minify?: boolean
}

interface CriticalCSSResult {
  critical: string
  remaining: string
  inlined: string
  size: {
    original: number
    critical: number
    remaining: number
  }
}

/**
 * Extract critical CSS for above-the-fold content
 */
export async function extractCriticalCSS(
  cssContent: string,
  htmlContent: string,
  options: CriticalCSSOptions = {}
): Promise<CriticalCSSResult> {
  const {
    width = 1200,
    height = 900,
    timeout = 30000,
    ignore = [],
    include = [],
    minify = true
  } = options

  // Get critical selectors based on above-the-fold content
  const criticalSelectors = await getCriticalSelectorsFromHTML(htmlContent, { width, height })
  
  // Add explicitly included selectors
  criticalSelectors.push(...include)
  
  // Remove ignored selectors
  const filteredSelectors = criticalSelectors.filter(selector => 
    !ignore.some(ignored => selector.includes(ignored))
  )
  
  // Extract critical and remaining CSS
  const { critical, remaining } = splitCSSByCriticalSelectors(cssContent, filteredSelectors)
  
  // Minify if requested
  const finalCritical = minify ? minifyCSS(critical) : critical
  const finalRemaining = minify ? minifyCSS(remaining) : remaining
  
  // Generate inline CSS
  const inlined = generateInlineCSS(finalCritical)
  
  return {
    critical: finalCritical,
    remaining: finalRemaining,
    inlined,
    size: {
      original: new Blob([cssContent]).size,
      critical: new Blob([finalCritical]).size,
      remaining: new Blob([finalRemaining]).size
    }
  }
}

/**
 * Get critical selectors from HTML content
 */
async function getCriticalSelectorsFromHTML(
  htmlContent: string,
  viewport: { width: number; height: number }
): Promise<string[]> {
  const criticalSelectors: string[] = []
  
  // Validate input
  if (!htmlContent || typeof htmlContent !== 'string') {
    return criticalSelectors
  }
  
  try {
    // Parse HTML to find elements that would be above the fold
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    
    // Get all elements with classes
    const elementsWithClasses = doc.querySelectorAll('[class]')
    
    elementsWithClasses.forEach(element => {
      const classes = element.className.split(/\s+/)
      classes.forEach(className => {
        const cleanClassName = className.trim()
        // Only add valid CSS class names
        if (cleanClassName && /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(cleanClassName)) {
          criticalSelectors.push(`.${cleanClassName}`)
        }
      })
    })
  } catch (error) {
    // If DOM parsing fails, fall back to regex extraction
    console.warn('DOM parsing failed, using regex fallback:', error)
    
    const classMatches = htmlContent.match(/class\s*=\s*["']([^"']+)["']/g) || []
    classMatches.forEach(match => {
      const classes = match.replace(/class\s*=\s*["']([^"']+)["']/, '$1')
      classes.split(/\s+/).forEach(className => {
        const cleanClassName = className.trim()
        if (cleanClassName && /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(cleanClassName)) {
          criticalSelectors.push(`.${cleanClassName}`)
        }
      })
    })
  }
  
  // Add critical element selectors
  const criticalElements = ['html', 'body', 'header', 'nav', 'main', 'h1', 'h2', 'h3']
  criticalSelectors.push(...criticalElements)
  
  // Add critical utility classes
  const criticalUtilities = [
    // Layout
    '.container', '.grid', '.flex', '.block', '.inline', '.hidden',
    // Typography
    '.text-', '.font-', '.leading-',
    // Spacing
    '.p-', '.m-', '.space-',
    // Colors
    '.bg-', '.text-', '.border-',
    // Responsive
    '.sm:', '.md:', '.lg:', '.xl:',
    // Theme
    ':root', '[data-theme'
  ]
  
  criticalUtilities.forEach(utility => {
    if (htmlContent.includes(utility) || utility.startsWith(':') || utility.startsWith('[')) {
      criticalSelectors.push(utility)
    }
  })
  
  return [...new Set(criticalSelectors)] // Remove duplicates
}

/**
 * Split CSS into critical and remaining parts
 */
function splitCSSByCriticalSelectors(cssContent: string, criticalSelectors: string[]): {
  critical: string
  remaining: string
} {
  const rules = extractCSSRules(cssContent)
  const criticalRules: string[] = []
  const remainingRules: string[] = []
  
  rules.forEach(rule => {
    const isCritical = criticalSelectors.some(selector => {
      // Check if rule contains critical selector
      if (selector.startsWith('.')) {
        return rule.includes(selector)
      }
      if (selector.startsWith(':') || selector.startsWith('[')) {
        return rule.includes(selector)
      }
      // Element selector
      return rule.match(new RegExp(`\\b${selector}\\b`))
    })
    
    if (isCritical) {
      criticalRules.push(rule)
    } else {
      remainingRules.push(rule)
    }
  })
  
  return {
    critical: criticalRules.join('\n'),
    remaining: remainingRules.join('\n')
  }
}

/**
 * Extract CSS rules from content
 */
function extractCSSRules(cssContent: string): string[] {
  // Remove comments
  const cleanCSS = cssContent.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // Handle media queries and nested rules
  const rules: string[] = []
  let currentRule = ''
  let braceCount = 0
  let inMediaQuery = false
  
  for (let i = 0; i < cleanCSS.length; i++) {
    const char = cleanCSS[i]
    currentRule += char
    
    if (char === '{') {
      braceCount++
      if (currentRule.includes('@media')) {
        inMediaQuery = true
      }
    } else if (char === '}') {
      braceCount--
      
      if (braceCount === 0) {
        if (currentRule.trim()) {
          rules.push(currentRule.trim())
        }
        currentRule = ''
        inMediaQuery = false
      }
    }
  }
  
  return rules.filter(rule => rule.trim())
}

/**
 * Generate inline CSS for HTML
 */
function generateInlineCSS(criticalCSS: string): string {
  return `<style>${criticalCSS}</style>`
}

/**
 * Minify CSS content
 */
function minifyCSS(cssContent: string): string {
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
 * Load CSS file content
 */
export async function loadCSSFile(filePath: string): Promise<string> {
  try {
    const response = await fetch(filePath)
    return await response.text()
  } catch (error) {
    console.error(`Failed to load CSS file: ${filePath}`, error)
    return ''
  }
}

/**
 * Inject critical CSS into HTML head
 */
export function injectCriticalCSS(htmlContent: string, criticalCSS: string): string {
  const inlineCSS = generateInlineCSS(criticalCSS)
  
  // Try to inject before closing head tag
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `${inlineCSS}</head>`)
  }
  
  // Fallback: inject at the beginning of body
  if (htmlContent.includes('<body>')) {
    return htmlContent.replace('<body>', `<body>${inlineCSS}`)
  }
  
  // Last resort: prepend to content
  return inlineCSS + htmlContent
}

/**
 * Generate preload link for remaining CSS
 */
export function generateCSSPreloadLink(cssPath: string): string {
  return `<link rel="preload" href="${cssPath}" as="style" onload="this.onload=null;this.rel='stylesheet'">`
}

/**
 * Critical CSS configuration for different page types
 */
export const criticalCSSConfigs = {
  home: {
    include: [
      '.app-layout',
      '.app-header',
      '.hero-section',
      '.menu-preview',
      '.base-button',
      '.base-card'
    ],
    ignore: [
      '.admin-',
      '.modal-',
      '.tooltip-'
    ]
  },
  
  menu: {
    include: [
      '.app-layout',
      '.app-header',
      '.menu-grid',
      '.menu-item-card',
      '.category-scroller',
      '.base-button'
    ],
    ignore: [
      '.admin-',
      '.checkout-',
      '.order-history'
    ]
  },
  
  checkout: {
    include: [
      '.app-layout',
      '.checkout-flow',
      '.base-input',
      '.base-select',
      '.base-button',
      '.order-summary'
    ],
    ignore: [
      '.menu-',
      '.admin-',
      '.order-history'
    ]
  }
}

/**
 * Get critical CSS config for page type
 */
export function getCriticalCSSConfig(pageType: keyof typeof criticalCSSConfigs): CriticalCSSOptions {
  return criticalCSSConfigs[pageType] || criticalCSSConfigs.home
}
