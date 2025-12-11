#!/usr/bin/env node

/**
 * Advanced build optimization script
 * Implements CSS tree-shaking, critical CSS inlining, and bundle optimization
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🚀 Starting advanced build optimization...')

/**
 * CSS Tree-shaking implementation
 */
class CSSTreeShaker {
  constructor() {
    this.usedClasses = new Set()
    this.cssRules = new Map()
  }

  /**
   * Analyze Vue components for used CSS classes
   */
  analyzeComponents(componentsDir) {
    console.log('📊 Analyzing component CSS usage...')
    
    const componentFiles = this.getVueFiles(componentsDir)
    
    componentFiles.forEach(file => {
      const content = readFileSync(file, 'utf8')
      this.extractUsedClasses(content)
    })
    
    console.log(`✅ Found ${this.usedClasses.size} used CSS classes`)
  }

  /**
   * Get all Vue files recursively
   */
  getVueFiles(dir) {
    const files = []
    
    if (!existsSync(dir)) return files
    
    const items = readdirSync(dir)
    
    items.forEach(item => {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        files.push(...this.getVueFiles(fullPath))
      } else if (item.endsWith('.vue') || item.endsWith('.ts') || item.endsWith('.js')) {
        files.push(fullPath)
      }
    })
    
    return files
  }

  /**
   * Extract used CSS classes from component content
   */
  extractUsedClasses(content) {
    // Extract class attributes
    const classMatches = content.match(/class\s*=\s*["']([^"']+)["']/g) || []
    
    classMatches.forEach(match => {
      const classes = match.replace(/class\s*=\s*["']([^"']+)["']/, '$1')
      classes.split(/\s+/).forEach(className => {
        if (className.trim()) {
          this.usedClasses.add(className.trim())
        }
      })
    })
    
    // Extract dynamic class bindings
    const dynamicMatches = content.match(/:class\s*=\s*["']([^"']+)["']/g) || []
    
    dynamicMatches.forEach(match => {
      const expression = match.replace(/:class\s*=\s*["']([^"']+)["']/, '$1')
      const classNames = expression.match(/['"`]([^'"`]+)['"`]/g) || []
      
      classNames.forEach(className => {
        const clean = className.replace(/['"`]/g, '')
        if (clean.trim()) {
          this.usedClasses.add(clean.trim())
        }
      })
    })
  }

  /**
   * Optimize CSS by removing unused rules
   */
  optimizeCSS(cssContent) {
    console.log('✂️ Removing unused CSS rules...')
    
    const rules = this.extractCSSRules(cssContent)
    const usedRules = []
    let removedRules = 0
    
    rules.forEach(rule => {
      if (this.isRuleUsed(rule)) {
        usedRules.push(rule)
      } else {
        removedRules++
      }
    })
    
    console.log(`✅ Removed ${removedRules} unused CSS rules`)
    
    return usedRules.join('\n')
  }

  /**
   * Extract CSS rules from content
   */
  extractCSSRules(cssContent) {
    // Remove comments
    const cleanCSS = cssContent.replace(/\/\*[\s\S]*?\*\//g, '')
    
    // Split by closing braces
    const rules = cleanCSS.split('}').filter(rule => rule.trim())
    
    return rules.map(rule => rule.trim() + '}')
  }

  /**
   * Check if CSS rule is used
   */
  isRuleUsed(rule) {
    // Always keep CSS variables, keyframes, and media queries
    if (rule.includes(':root') || rule.includes('@keyframes') || rule.includes('@media')) {
      return true
    }
    
    // Extract class names from rule
    const classMatches = rule.match(/\.([a-zA-Z0-9_-]+)/g) || []
    
    // If any class in the rule is used, keep the rule
    return classMatches.some(match => {
      const className = match.substring(1)
      return this.usedClasses.has(className)
    })
  }
}

/**
 * Critical CSS extractor
 */
class CriticalCSSExtractor {
  constructor() {
    this.criticalSelectors = [
      // Layout
      '.app-layout', '.app-header', '.app-navigation', '.container', '.grid',
      // Typography
      'h1', 'h2', 'h3', '.text-', '.font-',
      // Buttons
      '.base-button', '.btn',
      // Cards
      '.base-card', '.menu-item-card',
      // Loading states
      '.loading', '.skeleton', '.spinner',
      // Theme
      ':root', '[data-theme',
      // Accessibility
      '.sr-only', '.focus-visible'
    ]
  }

  /**
   * Extract critical CSS for above-the-fold content
   */
  extractCritical(cssContent) {
    console.log('🎯 Extracting critical CSS...')
    
    const rules = this.extractCSSRules(cssContent)
    const criticalRules = []
    const remainingRules = []
    
    rules.forEach(rule => {
      if (this.isCriticalRule(rule)) {
        criticalRules.push(rule)
      } else {
        remainingRules.push(rule)
      }
    })
    
    console.log(`✅ Extracted ${criticalRules.length} critical CSS rules`)
    
    return {
      critical: criticalRules.join('\n'),
      remaining: remainingRules.join('\n')
    }
  }

  /**
   * Check if rule is critical
   */
  isCriticalRule(rule) {
    return this.criticalSelectors.some(selector => {
      if (selector.startsWith('.')) {
        return rule.includes(selector)
      }
      if (selector.startsWith(':') || selector.startsWith('[')) {
        return rule.includes(selector)
      }
      return rule.match(new RegExp(`\\b${selector}\\b`))
    })
  }

  /**
   * Extract CSS rules
   */
  extractCSSRules(cssContent) {
    const cleanCSS = cssContent.replace(/\/\*[\s\S]*?\*\//g, '')
    const rules = cleanCSS.split('}').filter(rule => rule.trim())
    return rules.map(rule => rule.trim() + '}')
  }

  /**
   * Minify CSS
   */
  minifyCSS(cssContent) {
    return cssContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Remove whitespace around special chars
      .replace(/;}/g, '}') // Remove trailing semicolons
      .replace(/[^{}]+{\s*}/g, '') // Remove empty rules
      .trim()
  }
}

/**
 * Bundle analyzer
 */
class BundleAnalyzer {
  /**
   * Analyze build output
   */
  analyzeBuild(outputDir) {
    console.log('📦 Analyzing bundle sizes...')
    
    const analysis = {
      totalSize: 0,
      chunks: [],
      assets: []
    }
    
    if (!existsSync(outputDir)) {
      console.warn('⚠️ Output directory not found')
      return analysis
    }
    
    this.analyzeDirectory(outputDir, analysis)
    
    // Sort by size
    analysis.chunks.sort((a, b) => b.size - a.size)
    analysis.assets.sort((a, b) => b.size - a.size)
    
    this.logAnalysis(analysis)
    
    return analysis
  }

  /**
   * Analyze directory recursively
   */
  analyzeDirectory(dir, analysis, prefix = '') {
    const items = readdirSync(dir)
    
    items.forEach(item => {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        this.analyzeDirectory(fullPath, analysis, prefix + item + '/')
      } else {
        const size = stat.size
        analysis.totalSize += size
        
        const asset = {
          name: prefix + item,
          size,
          type: this.getAssetType(item)
        }
        
        analysis.assets.push(asset)
        
        // Group into chunks
        if (item.includes('chunk') || item.includes('vendor')) {
          analysis.chunks.push(asset)
        }
      }
    })
  }

  /**
   * Get asset type
   */
  getAssetType(filename) {
    const ext = extname(filename).toLowerCase()
    
    switch (ext) {
      case '.js': return 'javascript'
      case '.css': return 'stylesheet'
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.webp':
      case '.avif': return 'image'
      case '.woff':
      case '.woff2':
      case '.ttf': return 'font'
      default: return 'other'
    }
  }

  /**
   * Log analysis results
   */
  logAnalysis(analysis) {
    console.log(`📊 Total bundle size: ${this.formatBytes(analysis.totalSize)}`)
    
    if (analysis.chunks.length > 0) {
      console.log('\n🔍 Largest chunks:')
      analysis.chunks.slice(0, 5).forEach((chunk, index) => {
        console.log(`   ${index + 1}. ${chunk.name}: ${this.formatBytes(chunk.size)}`)
      })
    }
    
    // Check for large assets
    const largeAssets = analysis.assets.filter(asset => asset.size > 500 * 1024) // > 500KB
    
    if (largeAssets.length > 0) {
      console.log('\n⚠️ Large assets (>500KB):')
      largeAssets.forEach(asset => {
        console.log(`   ${asset.name}: ${this.formatBytes(asset.size)}`)
      })
    }
    
    // Performance recommendations
    this.generateRecommendations(analysis)
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = []
    
    if (analysis.totalSize > 2 * 1024 * 1024) { // > 2MB
      recommendations.push('Total bundle size exceeds 2MB - consider code splitting')
    }
    
    const jsSize = analysis.assets
      .filter(asset => asset.type === 'javascript')
      .reduce((sum, asset) => sum + asset.size, 0)
    
    if (jsSize > 1024 * 1024) { // > 1MB
      recommendations.push('JavaScript bundle exceeds 1MB - implement lazy loading')
    }
    
    const cssSize = analysis.assets
      .filter(asset => asset.type === 'stylesheet')
      .reduce((sum, asset) => sum + asset.size, 0)
    
    if (cssSize > 200 * 1024) { // > 200KB
      recommendations.push('CSS bundle exceeds 200KB - implement CSS tree-shaking')
    }
    
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      recommendations.forEach(rec => console.log(`   • ${rec}`))
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

/**
 * Main optimization process
 */
async function optimizeBuild() {
  try {
    // 1. Build the application first
    console.log('🔨 Building application...')
    execSync('nuxt build', { stdio: 'inherit', cwd: projectRoot })
    
    // 2. Initialize optimizers
    const treeShaker = new CSSTreeShaker()
    const criticalExtractor = new CriticalCSSExtractor()
    const bundleAnalyzer = new BundleAnalyzer()
    
    // 3. Analyze components for CSS usage
    treeShaker.analyzeComponents(join(projectRoot, 'app/components'))
    treeShaker.analyzeComponents(join(projectRoot, 'app/pages'))
    treeShaker.analyzeComponents(join(projectRoot, 'app/layouts'))
    
    // 4. Process CSS files in output
    const outputDir = join(projectRoot, '.output')
    const publicDir = join(outputDir, 'public')
    
    if (existsSync(publicDir)) {
      const cssFiles = findCSSFiles(publicDir)
      
      cssFiles.forEach(cssFile => {
        console.log(`🎨 Optimizing ${cssFile}...`)
        
        const cssContent = readFileSync(cssFile, 'utf8')
        
        // Apply tree-shaking
        const optimizedCSS = treeShaker.optimizeCSS(cssContent)
        
        // Extract critical CSS
        const { critical, remaining } = criticalExtractor.extractCritical(optimizedCSS)
        
        // Minify CSS
        const minifiedCritical = criticalExtractor.minifyCSS(critical)
        const minifiedRemaining = criticalExtractor.minifyCSS(remaining)
        
        // Write optimized files
        const criticalFile = cssFile.replace('.css', '.critical.css')
        const remainingFile = cssFile.replace('.css', '.remaining.css')
        
        writeFileSync(criticalFile, minifiedCritical)
        writeFileSync(remainingFile, minifiedRemaining)
        writeFileSync(cssFile, minifiedCritical + minifiedRemaining)
        
        console.log(`✅ Optimized ${cssFile}`)
      })
    }
    
    // 5. Analyze final bundle
    bundleAnalyzer.analyzeBuild(publicDir)
    
    // 6. Generate optimization report
    generateOptimizationReport()
    
    console.log('🎉 Build optimization completed!')
    
  } catch (error) {
    console.error('❌ Build optimization failed:', error.message)
    process.exit(1)
  }
}

/**
 * Find CSS files in directory
 */
function findCSSFiles(dir) {
  const cssFiles = []
  
  if (!existsSync(dir)) return cssFiles
  
  const items = readdirSync(dir)
  
  items.forEach(item => {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      cssFiles.push(...findCSSFiles(fullPath))
    } else if (item.endsWith('.css') && !item.includes('.critical.') && !item.includes('.remaining.')) {
      cssFiles.push(fullPath)
    }
  })
  
  return cssFiles
}

/**
 * Generate optimization report
 */
function generateOptimizationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    optimizations: [
      'CSS tree-shaking applied',
      'Critical CSS extracted',
      'CSS minification applied',
      'Bundle analysis completed'
    ],
    recommendations: [
      'Monitor Core Web Vitals',
      'Enable CDN for static assets',
      'Implement service worker caching',
      'Use image optimization'
    ]
  }
  
  const reportPath = join(projectRoot, '.output', 'optimization-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log('📄 Optimization report generated:', reportPath)
}

// Run optimization
optimizeBuild()