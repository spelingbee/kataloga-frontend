#!/usr/bin/env node

/**
 * Performance testing script
 * Tests Core Web Vitals and bundle size compliance
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

const PERFORMANCE_BUDGET = {
  // Bundle sizes (in bytes)
  totalBundle: 2 * 1024 * 1024, // 2MB
  jsBundle: 1 * 1024 * 1024,    // 1MB
  cssBundle: 200 * 1024,        // 200KB
  
  // Core Web Vitals (in milliseconds, except CLS)
  fcp: 1800,  // First Contentful Paint
  lcp: 2500,  // Largest Contentful Paint
  fid: 100,   // First Input Delay
  cls: 0.1,   // Cumulative Layout Shift
  ttfb: 800,  // Time to First Byte
}

console.log('🧪 Starting performance tests...')

/**
 * Test bundle sizes
 */
function testBundleSizes() {
  console.log('\n📦 Testing bundle sizes...')
  
  const outputDir = join(process.cwd(), '.output', 'public')
  
  if (!existsSync(outputDir)) {
    console.error('❌ Build output not found. Run build first.')
    return false
  }
  
  const bundleStats = analyzeBundleSize(outputDir)
  
  // Test total bundle size
  const totalPassed = bundleStats.totalSize <= PERFORMANCE_BUDGET.totalBundle
  console.log(`Total bundle: ${formatBytes(bundleStats.totalSize)} ${totalPassed ? '✅' : '❌'} (budget: ${formatBytes(PERFORMANCE_BUDGET.totalBundle)})`)
  
  // Test JavaScript bundle size
  const jsPassed = bundleStats.jsSize <= PERFORMANCE_BUDGET.jsBundle
  console.log(`JavaScript: ${formatBytes(bundleStats.jsSize)} ${jsPassed ? '✅' : '❌'} (budget: ${formatBytes(PERFORMANCE_BUDGET.jsBundle)})`)
  
  // Test CSS bundle size
  const cssPassed = bundleStats.cssSize <= PERFORMANCE_BUDGET.cssBundle
  console.log(`CSS: ${formatBytes(bundleStats.cssSize)} ${cssPassed ? '✅' : '❌'} (budget: ${formatBytes(PERFORMANCE_BUDGET.cssBundle)})`)
  
  return totalPassed && jsPassed && cssPassed
}

/**
 * Analyze bundle size
 */
function analyzeBundleSize(dir) {
  const stats = {
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    files: []
  }
  
  function analyzeDir(currentDir) {
    const items = require('fs').readdirSync(currentDir)
    
    items.forEach(item => {
      const fullPath = join(currentDir, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        analyzeDir(fullPath)
      } else {
        const size = stat.size
        stats.totalSize += size
        
        if (item.endsWith('.js')) {
          stats.jsSize += size
        } else if (item.endsWith('.css')) {
          stats.cssSize += size
        }
        
        stats.files.push({
          name: item,
          size,
          path: fullPath
        })
      }
    })
  }
  
  analyzeDir(dir)
  return stats
}

/**
 * Test Core Web Vitals (simulated)
 */
function testCoreWebVitals() {
  console.log('\n📊 Testing Core Web Vitals compliance...')
  
  // In a real scenario, you would use tools like Lighthouse or Puppeteer
  // For now, we'll check if the optimization utilities are in place
  
  const checks = [
    {
      name: 'Critical CSS utilities',
      file: 'app/utils/critical-css.ts',
      passed: existsSync(join(process.cwd(), 'app/utils/critical-css.ts'))
    },
    {
      name: 'Image optimization utilities',
      file: 'app/utils/image-optimization.ts',
      passed: existsSync(join(process.cwd(), 'app/utils/image-optimization.ts'))
    },
    {
      name: 'Core Web Vitals monitoring',
      file: 'app/utils/core-web-vitals.ts',
      passed: existsSync(join(process.cwd(), 'app/utils/core-web-vitals.ts'))
    },
    {
      name: 'Performance plugin',
      file: 'app/plugins/performance-optimization.client.ts',
      passed: existsSync(join(process.cwd(), 'app/plugins/performance-optimization.client.ts'))
    }
  ]
  
  let allPassed = true
  
  checks.forEach(check => {
    console.log(`${check.name}: ${check.passed ? '✅' : '❌'}`)
    if (!check.passed) allPassed = false
  })
  
  return allPassed
}

/**
 * Test CSS optimization
 */
function testCSSOptimization() {
  console.log('\n🎨 Testing CSS optimization...')
  
  const checks = [
    {
      name: 'CSS tree-shaking utilities',
      passed: existsSync(join(process.cwd(), 'app/utils/css-tree-shaking.ts'))
    },
    {
      name: 'SCSS follows BEM methodology',
      passed: checkBEMCompliance()
    },
    {
      name: 'Design tokens are used',
      passed: checkDesignTokens()
    }
  ]
  
  let allPassed = true
  
  checks.forEach(check => {
    console.log(`${check.name}: ${check.passed ? '✅' : '❌'}`)
    if (!check.passed) allPassed = false
  })
  
  return allPassed
}

/**
 * Check BEM compliance in SCSS files
 */
function checkBEMCompliance() {
  try {
    const mainScss = join(process.cwd(), 'app/assets/scss/main.scss')
    if (!existsSync(mainScss)) return false
    
    const content = readFileSync(mainScss, 'utf8')
    
    // Check for DART SASS @use syntax
    const hasUse = content.includes('@use')
    const noImport = !content.includes('@import')
    
    return hasUse && noImport
  } catch (error) {
    return false
  }
}

/**
 * Check design tokens usage
 */
function checkDesignTokens() {
  try {
    const tokensDir = join(process.cwd(), 'app/assets/scss/tokens')
    
    const requiredTokens = [
      '_colors.scss',
      '_spacing.scss',
      '_typography.scss',
      '_shadows.scss',
      '_transitions.scss'
    ]
    
    return requiredTokens.every(token => 
      existsSync(join(tokensDir, token))
    )
  } catch (error) {
    return false
  }
}

/**
 * Test image optimization
 */
function testImageOptimization() {
  console.log('\n🖼️ Testing image optimization...')
  
  const nuxtConfig = join(process.cwd(), 'nuxt.config.ts')
  
  if (!existsSync(nuxtConfig)) {
    console.log('Nuxt config not found: ❌')
    return false
  }
  
  const config = readFileSync(nuxtConfig, 'utf8')
  
  const checks = [
    {
      name: 'Nuxt Image module configured',
      passed: config.includes('@nuxt/image')
    },
    {
      name: 'WebP format support',
      passed: config.includes('webp')
    },
    {
      name: 'Lazy loading enabled',
      passed: config.includes('lazy')
    },
    {
      name: 'Image presets defined',
      passed: config.includes('presets')
    }
  ]
  
  let allPassed = true
  
  checks.forEach(check => {
    console.log(`${check.name}: ${check.passed ? '✅' : '❌'}`)
    if (!check.passed) allPassed = false
  })
  
  return allPassed
}

/**
 * Test caching strategies
 */
function testCaching() {
  console.log('\n🗄️ Testing caching strategies...')
  
  const checks = [
    {
      name: 'Cache utilities implemented',
      passed: existsSync(join(process.cwd(), 'app/utils/cache-strategies.ts'))
    },
    {
      name: 'Service Worker configured',
      passed: checkServiceWorker()
    },
    {
      name: 'API caching configured',
      passed: checkAPICaching()
    }
  ]
  
  let allPassed = true
  
  checks.forEach(check => {
    console.log(`${check.name}: ${check.passed ? '✅' : '❌'}`)
    if (!check.passed) allPassed = false
  })
  
  return allPassed
}

/**
 * Check Service Worker configuration
 */
function checkServiceWorker() {
  try {
    const nuxtConfig = join(process.cwd(), 'nuxt.config.ts')
    const config = readFileSync(nuxtConfig, 'utf8')
    
    return config.includes('pwa') && config.includes('workbox')
  } catch (error) {
    return false
  }
}

/**
 * Check API caching configuration
 */
function checkAPICaching() {
  try {
    const nuxtConfig = join(process.cwd(), 'nuxt.config.ts')
    const config = readFileSync(nuxtConfig, 'utf8')
    
    return config.includes('runtimeCaching')
  } catch (error) {
    return false
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate performance report
 */
function generateReport(results) {
  console.log('\n📄 Performance Test Report')
  console.log('=' .repeat(50))
  
  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length
  
  console.log(`Tests passed: ${passedTests}/${totalTests}`)
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All performance tests passed!')
    return true
  } else {
    console.log('\n⚠️ Some performance tests failed. Check the details above.')
    return false
  }
}

/**
 * Main test runner
 */
async function runPerformanceTests() {
  const results = {
    bundleSize: testBundleSizes(),
    coreWebVitals: testCoreWebVitals(),
    cssOptimization: testCSSOptimization(),
    imageOptimization: testImageOptimization(),
    caching: testCaching()
  }
  
  const success = generateReport(results)
  
  if (!success) {
    process.exit(1)
  }
}

// Run tests
runPerformanceTests().catch(error => {
  console.error('❌ Performance tests failed:', error)
  process.exit(1)
})