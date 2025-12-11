#!/usr/bin/env node

/**
 * Design System Integration Validation Script
 * 
 * This script validates that the new design system has been properly integrated
 * by checking for:
 * 1. Design token usage
 * 2. Component consistency
 * 3. Accessibility compliance
 * 4. Performance optimizations
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import path from 'path'

// Simple glob replacement
function findFiles(dir, pattern, results = []) {
  const files = readdirSync(dir)
  
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      findFiles(fullPath, pattern, results)
    } else if (file.match(pattern)) {
      results.push(fullPath.replace(/\\/g, '/'))
    }
  }
  
  return results
}

const VALIDATION_RESULTS = {
  designTokens: { passed: 0, failed: 0, issues: [] },
  components: { passed: 0, failed: 0, issues: [] },
  accessibility: { passed: 0, failed: 0, issues: [] },
  performance: { passed: 0, failed: 0, issues: [] }
}

// Check if design tokens are being used consistently
function validateDesignTokens() {
  console.log('🎨 Validating Design Token Usage...')
  
  const scssFiles = findFiles('app', /\.scss$/)
  const vueFiles = findFiles('app', /\.vue$/)
  
  const allFiles = [...scssFiles, ...vueFiles]
  
  allFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8')
    
    // Check for hardcoded values that should use tokens
    const hardcodedColors = content.match(/#[0-9a-fA-F]{3,6}/g)
    const hardcodedSizes = content.match(/\d+px(?!\s*\))/g)
    
    if (hardcodedColors && hardcodedColors.length > 0) {
      VALIDATION_RESULTS.designTokens.failed++
      VALIDATION_RESULTS.designTokens.issues.push(`${file}: Found hardcoded colors: ${hardcodedColors.join(', ')}`)
    } else {
      VALIDATION_RESULTS.designTokens.passed++
    }
    
    if (hardcodedSizes && hardcodedSizes.length > 0) {
      VALIDATION_RESULTS.designTokens.failed++
      VALIDATION_RESULTS.designTokens.issues.push(`${file}: Found hardcoded sizes: ${hardcodedSizes.join(', ')}`)
    }
  })
}

// Check component consistency
function validateComponents() {
  console.log('🧩 Validating Component Consistency...')
  
  const baseComponents = [
    'app/components/base/BaseButton.vue',
    'app/components/base/BaseCard.vue',
    'app/components/base/BaseInput.vue',
    'app/components/base/BaseSelect.vue',
    'app/components/base/BaseTextarea.vue',
    'app/components/base/BaseModal.vue',
    'app/components/base/BaseBadge.vue'
  ]
  
  baseComponents.forEach(component => {
    if (existsSync(component)) {
      VALIDATION_RESULTS.components.passed++
      
      const content = readFileSync(component, 'utf-8')
      
      // Check if component uses design tokens
      if (!content.includes('@use') || !content.includes('tokens/')) {
        VALIDATION_RESULTS.components.failed++
        VALIDATION_RESULTS.components.issues.push(`${component}: Not using design tokens properly`)
      }
      
      // Check for BEM methodology
      if (content.includes('&__') || content.includes('&--')) {
        VALIDATION_RESULTS.components.failed++
        VALIDATION_RESULTS.components.issues.push(`${component}: Using nested BEM selectors (should be flat)`)
      }
    } else {
      VALIDATION_RESULTS.components.failed++
      VALIDATION_RESULTS.components.issues.push(`${component}: Missing base component`)
    }
  })
}

// Check accessibility features
function validateAccessibility() {
  console.log('♿ Validating Accessibility Features...')
  
  const vueFiles = findFiles('app', /\.vue$/)
  
  vueFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8')
    
    // Check for interactive elements without proper ARIA
    const buttons = content.match(/<button[^>]*>/g)
    const inputs = content.match(/<input[^>]*>/g)
    
    if (buttons) {
      buttons.forEach(button => {
        if (!button.includes('aria-label') && !button.includes('aria-describedby')) {
          VALIDATION_RESULTS.accessibility.failed++
          VALIDATION_RESULTS.accessibility.issues.push(`${file}: Button without ARIA label`)
        } else {
          VALIDATION_RESULTS.accessibility.passed++
        }
      })
    }
    
    if (inputs) {
      inputs.forEach(input => {
        if (!input.includes('aria-label') && !input.includes('id=')) {
          VALIDATION_RESULTS.accessibility.failed++
          VALIDATION_RESULTS.accessibility.issues.push(`${file}: Input without proper labeling`)
        } else {
          VALIDATION_RESULTS.accessibility.passed++
        }
      })
    }
  })
}

// Check performance optimizations
function validatePerformance() {
  console.log('⚡ Validating Performance Optimizations...')
  
  // Check if CSS is optimized
  const mainScss = 'app/assets/scss/main.scss'
  if (existsSync(mainScss)) {
    const content = readFileSync(mainScss, 'utf-8')
    
    if (content.includes('@use')) {
      VALIDATION_RESULTS.performance.passed++
    } else {
      VALIDATION_RESULTS.performance.failed++
      VALIDATION_RESULTS.performance.issues.push('main.scss: Not using DART SASS @use syntax')
    }
    
    if (content.includes('@import')) {
      VALIDATION_RESULTS.performance.failed++
      VALIDATION_RESULTS.performance.issues.push('main.scss: Still using old @import syntax')
    }
  }
  
  // Check for image optimization
  const imageComponents = findFiles('app/components', /Image.*\.vue$/)
  imageComponents.forEach(component => {
    const content = readFileSync(component, 'utf-8')
    
    if (content.includes('loading="lazy"') || content.includes('NuxtImg')) {
      VALIDATION_RESULTS.performance.passed++
    } else {
      VALIDATION_RESULTS.performance.failed++
      VALIDATION_RESULTS.performance.issues.push(`${component}: Images not optimized for lazy loading`)
    }
  })
}

// Generate report
function generateReport() {
  console.log('\n📊 Design System Integration Report')
  console.log('=====================================')
  
  const categories = ['designTokens', 'components', 'accessibility', 'performance']
  const categoryNames = ['Design Tokens', 'Components', 'Accessibility', 'Performance']
  
  let totalPassed = 0
  let totalFailed = 0
  
  categories.forEach((category, index) => {
    const result = VALIDATION_RESULTS[category]
    totalPassed += result.passed
    totalFailed += result.failed
    
    const total = result.passed + result.failed
    const percentage = total > 0 ? Math.round((result.passed / total) * 100) : 100
    
    console.log(`\n${categoryNames[index]}:`)
    console.log(`  ✅ Passed: ${result.passed}`)
    console.log(`  ❌ Failed: ${result.failed}`)
    console.log(`  📈 Score: ${percentage}%`)
    
    if (result.issues.length > 0) {
      console.log(`  🚨 Issues:`)
      result.issues.forEach(issue => {
        console.log(`    - ${issue}`)
      })
    }
  })
  
  const overallTotal = totalPassed + totalFailed
  const overallPercentage = overallTotal > 0 ? Math.round((totalPassed / overallTotal) * 100) : 100
  
  console.log(`\n🎯 Overall Integration Score: ${overallPercentage}%`)
  console.log(`   Total Checks: ${overallTotal}`)
  console.log(`   Passed: ${totalPassed}`)
  console.log(`   Failed: ${totalFailed}`)
  
  if (overallPercentage >= 80) {
    console.log('\n🎉 Great job! Design system integration is looking good!')
  } else if (overallPercentage >= 60) {
    console.log('\n⚠️  Good progress, but there are some issues to address.')
  } else {
    console.log('\n🔧 Significant work needed to complete the integration.')
  }
  
  return overallPercentage >= 80
}

// Main execution
async function main() {
  console.log('🚀 Starting Design System Integration Validation...\n')
  
  try {
    validateDesignTokens()
    validateComponents()
    validateAccessibility()
    validatePerformance()
    
    const success = generateReport()
    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    process.exit(1)
  }
}

main()