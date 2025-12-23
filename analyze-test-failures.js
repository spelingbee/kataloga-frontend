#!/usr/bin/env node

/**
 * Анализатор упавших тестов
 * Запускает тесты и группирует ошибки по типам
 */

import { execSync } from 'child_process'

console.log('🔍 Анализ упавших тестов...\n')

try {
  // Запускаем тесты и захватываем вывод
  const output = execSync('pnpm test', { 
    encoding: 'utf8',
    stdio: 'pipe'
  })
  console.log('✅ Все тесты прошли успешно!')
} catch (error) {
  const output = error.stdout || error.stderr || ''
  
  // Анализируем типы ошибок
  const errorTypes = new Map()
  const lines = output.split('\n')
  
  let currentError = null
  let errorCount = 0
  
  for (const line of lines) {
    // Ищем строки с ошибками
    if (line.includes('FAIL') && line.includes('test.ts')) {
      errorCount++
      continue
    }
    
    // Ищем типы ошибок
    if (line.includes('ReferenceError:') || 
        line.includes('TypeError:') || 
        line.includes('Error:') ||
        line.includes('AssertionError:')) {
      
      const errorMatch = line.match(/(ReferenceError|TypeError|Error|AssertionError): (.+)/)
      if (errorMatch) {
        const errorType = errorMatch[1]
        const errorMessage = errorMatch[2].split(' ❯')[0].trim()
        
        const key = `${errorType}: ${errorMessage}`
        errorTypes.set(key, (errorTypes.get(key) || 0) + 1)
      }
    }
  }
  
  console.log(`❌ Найдено ${errorCount} упавших тестов\n`)
  
  console.log('📊 Топ ошибок по частоте:\n')
  
  // Сортируем ошибки по частоте
  const sortedErrors = Array.from(errorTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  sortedErrors.forEach(([error, count], index) => {
    console.log(`${index + 1}. [${count}x] ${error}`)
  })
  
  console.log('\n🔧 Рекомендации по исправлению:\n')
  
  // Анализируем основные проблемы
  const recommendations = []
  
  if (output.includes('readonly is not defined')) {
    recommendations.push('• Добавить мок для readonly в setup.ts')
  }
  
  if (output.includes('getCurrentInstance is not defined')) {
    recommendations.push('• Добавить мок для getCurrentInstance в setup.ts')
  }
  
  if (output.includes('Cannot read properties of undefined (reading \'status\')')) {
    recommendations.push('• Исправить мок fetch - добавить правильные свойства Response')
  }
  
  if (output.includes('getRaw is not a function')) {
    recommendations.push('• Добавить мок для метода getRaw в API клиенте')
  }
  
  if (output.includes('Client-side storage not available')) {
    recommendations.push('• Исправить мок localStorage в тестах')
  }
  
  if (output.includes('localStorage.getItem') && output.includes('spy')) {
    recommendations.push('• Проверить настройку моков localStorage в тестах')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('• Проанализировать логи выше для определения конкретных проблем')
  }
  
  recommendations.forEach(rec => console.log(rec))
  
  console.log('\n💡 Для детального анализа запустите: pnpm test --reporter=verbose')
}