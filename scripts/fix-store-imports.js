#!/usr/bin/env node

/**
 * Script to automatically fix missing store imports in Vue and TypeScript files
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const STORE_PATTERNS = {
  'useAuthStore': '~/stores/auth',
  'useCartStore': '~/stores/cart', 
  'useMenuStore': '~/stores/menu',
  'useUserStore': '~/stores/user',
  'useOrderStore': '~/stores/order',
  'useLocationStore': '~/stores/location',
  'useErrorStore': '~/stores/error',
  'useLoadingStore': '~/stores/loading'
}

const COMPOSABLE_PATTERNS = {
  'useAuth': '~/composables/useAuth',
  'useCart': '~/composables/useCart',
  'useMenu': '~/composables/useMenu',
  'useOrders': '~/composables/useOrders',
  'useOrderTracking': '~/composables/useOrderTracking',
  'useUserProfile': '~/composables/useUserProfile',
  'useApi': '~/composables/useApi',
  'useApiError': '~/composables/useApiError',
  'useErrorHandler': '~/composables/useErrorHandler',
  'useLoadingState': '~/composables/useLoadingState',
  'useNetworkStatus': '~/composables/useNetworkStatus',
  'useOfflineCart': '~/composables/useOfflineCart',
  'usePWA': '~/composables/usePWA',
  'usePushNotifications': '~/composables/usePushNotifications',
  'usePerformance': '~/composables/usePerformance',
  'useLazyLoading': '~/composables/useLazyLoading',
  'useGracefulDegradation': '~/composables/useGracefulDegradation',
  'useTelegram': '~/composables/useTelegram',
  'useMap': '~/composables/useMap',
  'useGeolocation': '~/composables/useGeolocation'
}

function getAllFiles(dir, extensions = ['.vue', '.ts']) {
  const files = []
  
  function traverse(currentDir) {
    const items = readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = join(currentDir, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.nuxt', '.output', 'dist', '.git'].includes(item)) {
          traverse(fullPath)
        }
      } else if (extensions.includes(extname(item))) {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

function findUsedFunctions(content) {
  const used = new Set()
  
  // Find store usage patterns
  for (const [storeName] of Object.entries(STORE_PATTERNS)) {
    const pattern = new RegExp(`\\b${storeName}\\s*\\(\\)`, 'g')
    if (pattern.test(content)) {
      used.add(storeName)
    }
  }
  
  // Find composable usage patterns
  for (const [composableName] of Object.entries(COMPOSABLE_PATTERNS)) {
    const pattern = new RegExp(`\\b${composableName}\\s*\\(\\)`, 'g')
    if (pattern.test(content)) {
      used.add(composableName)
    }
  }
  
  return used
}

function findExistingImports(content) {
  const imports = new Set()
  
  // Find existing imports
  const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g
  let match
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]
    
    // Check if it's a store or composable import
    for (const [funcName, expectedPath] of Object.entries({...STORE_PATTERNS, ...COMPOSABLE_PATTERNS})) {
      if (importPath === expectedPath) {
        imports.add(funcName)
      }
    }
  }
  
  return imports
}

function addMissingImports(content, missingImports) {
  if (missingImports.size === 0) return content
  
  const lines = content.split('\n')
  let scriptStartIndex = -1
  let importEndIndex = -1
  
  // Find script setup section
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<script setup')) {
      scriptStartIndex = i
      break
    }
  }
  
  if (scriptStartIndex === -1) {
    console.log('No <script setup> found, skipping...')
    return content
  }
  
  // Find where to insert imports (after existing imports)
  for (let i = scriptStartIndex + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      importEndIndex = i
    } else if (lines[i].trim() === '' && importEndIndex > -1) {
      // Empty line after imports
      break
    } else if (!lines[i].trim().startsWith('import ') && !lines[i].trim().startsWith('//') && lines[i].trim() !== '') {
      // First non-import, non-comment, non-empty line
      break
    }
  }
  
  // If no imports found, insert after script tag
  if (importEndIndex === -1) {
    importEndIndex = scriptStartIndex
  }
  
  // Group imports by type
  const storeImports = []
  const composableImports = []
  
  for (const funcName of missingImports) {
    if (STORE_PATTERNS[funcName]) {
      storeImports.push(`import { ${funcName} } from '${STORE_PATTERNS[funcName]}'`)
    } else if (COMPOSABLE_PATTERNS[funcName]) {
      composableImports.push(`import { ${funcName} } from '${COMPOSABLE_PATTERNS[funcName]}'`)
    }
  }
  
  // Insert imports
  const newImports = [...storeImports, ...composableImports]
  if (newImports.length > 0) {
    lines.splice(importEndIndex + 1, 0, ...newImports)
  }
  
  return lines.join('\n')
}

function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    const usedFunctions = findUsedFunctions(content)
    const existingImports = findExistingImports(content)
    
    // Find missing imports
    const missingImports = new Set()
    for (const func of usedFunctions) {
      if (!existingImports.has(func)) {
        missingImports.add(func)
      }
    }
    
    if (missingImports.size > 0) {
      console.log(`\n📁 ${filePath}`)
      console.log(`   Missing imports: ${Array.from(missingImports).join(', ')}`)
      
      const updatedContent = addMissingImports(content, missingImports)
      
      if (updatedContent !== content) {
        writeFileSync(filePath, updatedContent, 'utf8')
        console.log(`   ✅ Fixed imports`)
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

function main() {
  console.log('🔍 Scanning for missing store and composable imports...\n')
  
  const appDir = join(process.cwd(), 'app')
  const files = getAllFiles(appDir)
  
  console.log(`Found ${files.length} files to check`)
  
  let fixedCount = 0
  
  for (const file of files) {
    if (processFile(file)) {
      fixedCount++
    }
  }
  
  console.log(`\n🎉 Completed! Fixed imports in ${fixedCount} files.`)
  
  if (fixedCount > 0) {
    console.log('\n💡 Recommendations:')
    console.log('   • Run your linter to ensure code style consistency')
    console.log('   • Test your application to ensure everything works correctly')
    console.log('   • Consider using auto-imports in your Nuxt configuration')
  }
}

main()