#!/usr/bin/env node

/**
 * Production build optimization script
 * This script handles pre-build optimizations and post-build analysis
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const isProduction = process.env.NODE_ENV === 'production'
const isAnalyze = process.env.ANALYZE === 'true'

console.log('🚀 Starting production build process...')
console.log(`Environment: ${process.env.NODE_ENV}`)
console.log(`Analyze mode: ${isAnalyze}`)

// Pre-build optimizations
function preBuildOptimizations() {
  console.log('⚡ Running pre-build optimizations...')
  
  // Clean previous builds
  try {
    execSync('rm -rf .nuxt .output dist', { stdio: 'inherit' })
    console.log('✅ Cleaned previous builds')
  } catch (error) {
    console.log('⚠️  No previous builds to clean')
  }
  
  // Verify environment variables
  const requiredEnvVars = [
    'NUXT_PUBLIC_API_BASE_URL',
    'NUXT_PUBLIC_TENANT_SLUG',
    'NUXT_PUBLIC_WEBSOCKET_URL'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '))
    process.exit(1)
  }
  
  console.log('✅ Environment variables verified')
  
  // Check for production-specific files
  const productionFiles = [
    '.env.production',
    'ecosystem.config.js',
    'Dockerfile'
  ]
  
  productionFiles.forEach(file => {
    if (!existsSync(file)) {
      console.warn(`⚠️  Production file missing: ${file}`)
    } else {
      console.log(`✅ Found production file: ${file}`)
    }
  })
}

// Build the application
function buildApplication() {
  console.log('🔨 Building application...')
  
  try {
    const buildCommand = isAnalyze ? 'nuxt build --analyze' : 'nuxt build'
    execSync(buildCommand, { stdio: 'inherit' })
    console.log('✅ Build completed successfully')
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    process.exit(1)
  }
}

// Post-build analysis
function postBuildAnalysis() {
  console.log('📊 Running post-build analysis...')
  
  // Check output directory
  if (!existsSync('.output')) {
    console.error('❌ Output directory not found')
    process.exit(1)
  }
  
  // Analyze bundle sizes
  try {
    const statsPath = join('.output', 'stats.json')
    if (existsSync(statsPath)) {
      const stats = JSON.parse(readFileSync(statsPath, 'utf8'))
      console.log('📦 Bundle analysis:')
      
      if (stats.assets) {
        const totalSize = stats.assets.reduce((sum, asset) => sum + asset.size, 0)
        console.log(`   Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
        
        // Find largest assets
        const largeAssets = stats.assets
          .filter(asset => asset.size > 100 * 1024) // > 100KB
          .sort((a, b) => b.size - a.size)
          .slice(0, 5)
        
        if (largeAssets.length > 0) {
          console.log('   Largest assets:')
          largeAssets.forEach(asset => {
            console.log(`     ${asset.name}: ${(asset.size / 1024).toFixed(2)} KB`)
          })
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Could not analyze bundle sizes:', error.message)
  }
  
  // Check for critical files
  const criticalFiles = [
    '.output/server/index.mjs',
    '.output/public/_nuxt',
    '.output/public/sw.js'
  ]
  
  criticalFiles.forEach(file => {
    if (existsSync(file)) {
      console.log(`✅ Critical file found: ${file}`)
    } else {
      console.error(`❌ Critical file missing: ${file}`)
    }
  })
  
  // Generate build report
  const buildReport = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    buildTime: Date.now(),
    success: true
  }
  
  writeFileSync('.output/build-report.json', JSON.stringify(buildReport, null, 2))
  console.log('✅ Build report generated')
}

// Performance recommendations
function performanceRecommendations() {
  console.log('💡 Performance recommendations:')
  
  const recommendations = [
    '• Enable CDN for static assets',
    '• Configure Redis for caching',
    '• Set up monitoring with Sentry',
    '• Enable HTTP/2 and compression',
    '• Configure proper cache headers',
    '• Monitor Core Web Vitals',
    '• Set up error tracking',
    '• Configure log aggregation'
  ]
  
  recommendations.forEach(rec => console.log(rec))
}

// Security checklist
function securityChecklist() {
  console.log('🔒 Security checklist:')
  
  const securityItems = [
    '• HTTPS enabled with valid certificates',
    '• Security headers configured in Nginx',
    '• Rate limiting enabled for API endpoints',
    '• Environment variables properly secured',
    '• No sensitive data in client bundle',
    '• CSP headers configured',
    '• CORS properly configured',
    '• Input validation on all forms'
  ]
  
  securityItems.forEach(item => console.log(item))
}

// Main execution
async function main() {
  try {
    preBuildOptimizations()
    buildApplication()
    postBuildAnalysis()
    
    if (isProduction) {
      performanceRecommendations()
      securityChecklist()
    }
    
    console.log('🎉 Production build process completed successfully!')
    console.log('📝 Next steps:')
    console.log('   1. Test the build with: pnpm preview:production')
    console.log('   2. Deploy using: docker-compose up -d')
    console.log('   3. Monitor application health at: /api/health')
    
  } catch (error) {
    console.error('❌ Build process failed:', error.message)
    process.exit(1)
  }
}

main()