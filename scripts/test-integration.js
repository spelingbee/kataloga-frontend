#!/usr/bin/env node

/**
 * Comprehensive integration testing script
 * Tests the application against a real or mock backend
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { $fetch } from 'ofetch'

const API_BASE_URL = process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

console.log('🧪 Starting comprehensive integration testing...')
console.log(`API URL: ${API_BASE_URL}`)
console.log(`Frontend URL: ${FRONTEND_URL}`)

// Test configuration
const testConfig = {
  timeout: 30000,
  retries: 3,
  parallel: true
}

// Health check function
async function healthCheck(url, name) {
  console.log(`🔍 Checking ${name} health...`)
  
  try {
    const response = await $fetch(`${url}/health`, {
      timeout: 5000,
      retry: 2
    })
    
    if (response.status === 'healthy') {
      console.log(`✅ ${name} is healthy`)
      return true
    } else {
      console.log(`⚠️  ${name} is degraded: ${response.status}`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${name} health check failed:`, error.message)
    return false
  }
}

// API connectivity tests
async function testApiConnectivity() {
  console.log('\n📡 Testing API connectivity...')
  
  const tests = [
    {
      name: 'Health endpoint',
      url: `${API_BASE_URL}/health`,
      method: 'GET'
    },
    {
      name: 'Menu endpoint',
      url: `${API_BASE_URL}/api/menu`,
      method: 'GET'
    },
    {
      name: 'Categories endpoint',
      url: `${API_BASE_URL}/api/menu/categories`,
      method: 'GET'
    }
  ]
  
  const results = []
  
  for (const test of tests) {
    try {
      console.log(`  Testing ${test.name}...`)
      
      const startTime = Date.now()
      const response = await $fetch(test.url, {
        method: test.method,
        timeout: 10000
      })
      const responseTime = Date.now() - startTime
      
      if (response) {
        console.log(`  ✅ ${test.name} - ${responseTime}ms`)
        results.push({ ...test, success: true, responseTime })
      } else {
        console.log(`  ❌ ${test.name} - No response`)
        results.push({ ...test, success: false, error: 'No response' })
      }
    } catch (error) {
      console.log(`  ❌ ${test.name} - ${error.message}`)
      results.push({ ...test, success: false, error: error.message })
    }
  }
  
  const successCount = results.filter(r => r.success).length
  console.log(`\n📊 API Connectivity: ${successCount}/${results.length} tests passed`)
  
  return results
}

// Authentication flow test
async function testAuthenticationFlow() {
  console.log('\n🔐 Testing authentication flow...')
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User'
  }
  
  try {
    // Test registration
    console.log('  Testing user registration...')
    const registerResponse = await $fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: testUser,
      timeout: 10000
    })
    
    if (registerResponse.success) {
      console.log('  ✅ User registration successful')
    } else {
      console.log('  ⚠️  Registration response:', registerResponse)
    }
    
    // Test login
    console.log('  Testing user login...')
    const loginResponse = await $fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password
      },
      timeout: 10000
    })
    
    if (loginResponse.success && loginResponse.accessToken) {
      console.log('  ✅ User login successful')
      
      // Test authenticated request
      console.log('  Testing authenticated request...')
      const profileResponse = await $fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${loginResponse.accessToken}`
        },
        timeout: 10000
      })
      
      if (profileResponse.success) {
        console.log('  ✅ Authenticated request successful')
      } else {
        console.log('  ❌ Authenticated request failed')
      }
      
      return { success: true, token: loginResponse.accessToken }
    } else {
      console.log('  ❌ Login failed:', loginResponse)
      return { success: false }
    }
  } catch (error) {
    console.log(`  ❌ Authentication flow failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Order flow test
async function testOrderFlow(authToken) {
  console.log('\n🛒 Testing order flow...')
  
  if (!authToken) {
    console.log('  ⚠️  Skipping order flow - no auth token')
    return { success: false, reason: 'No auth token' }
  }
  
  try {
    // Create test order
    const orderData = {
      items: [
        {
          productId: 'test-product-1',
          quantity: 2,
          price: 15.99
        }
      ],
      customerInfo: {
        name: 'Test Customer',
        phone: '+1234567890',
        email: 'test@example.com'
      },
      deliveryInfo: {
        address: '123 Test Street',
        city: 'Test City',
        postalCode: '12345'
      }
    }
    
    console.log('  Creating test order...')
    const orderResponse = await $fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: orderData,
      timeout: 15000
    })
    
    if (orderResponse.success && orderResponse.data.id) {
      console.log(`  ✅ Order created successfully: ${orderResponse.data.id}`)
      
      // Test order retrieval
      console.log('  Retrieving order...')
      const getOrderResponse = await $fetch(`${API_BASE_URL}/api/orders/${orderResponse.data.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        timeout: 10000
      })
      
      if (getOrderResponse.success) {
        console.log('  ✅ Order retrieval successful')
        return { success: true, orderId: orderResponse.data.id }
      } else {
        console.log('  ❌ Order retrieval failed')
        return { success: false, reason: 'Order retrieval failed' }
      }
    } else {
      console.log('  ❌ Order creation failed:', orderResponse)
      return { success: false, reason: 'Order creation failed' }
    }
  } catch (error) {
    console.log(`  ❌ Order flow failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Frontend health test
async function testFrontendHealth() {
  console.log('\n🌐 Testing frontend health...')
  
  try {
    const response = await $fetch(`${FRONTEND_URL}/api/health`, {
      timeout: 10000
    })
    
    if (response.status === 'healthy') {
      console.log('  ✅ Frontend health check passed')
      return { success: true }
    } else {
      console.log('  ⚠️  Frontend health degraded:', response.status)
      return { success: false, status: response.status }
    }
  } catch (error) {
    console.log(`  ❌ Frontend health check failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Performance tests
async function testPerformance() {
  console.log('\n⚡ Testing performance...')
  
  const endpoints = [
    { name: 'Homepage', url: `${FRONTEND_URL}/` },
    { name: 'Menu page', url: `${FRONTEND_URL}/menu` },
    { name: 'API health', url: `${API_BASE_URL}/health` },
    { name: 'Menu API', url: `${API_BASE_URL}/api/menu` }
  ]
  
  const results = []
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing ${endpoint.name}...`)
      
      const startTime = Date.now()
      await $fetch(endpoint.url, { timeout: 15000 })
      const responseTime = Date.now() - startTime
      
      const status = responseTime < 2000 ? '✅' : responseTime < 5000 ? '⚠️' : '❌'
      console.log(`  ${status} ${endpoint.name}: ${responseTime}ms`)
      
      results.push({
        name: endpoint.name,
        responseTime,
        success: responseTime < 10000
      })
    } catch (error) {
      console.log(`  ❌ ${endpoint.name}: ${error.message}`)
      results.push({
        name: endpoint.name,
        success: false,
        error: error.message
      })
    }
  }
  
  const avgResponseTime = results
    .filter(r => r.success && r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.length
  
  console.log(`\n📊 Average response time: ${avgResponseTime.toFixed(0)}ms`)
  
  return results
}

// Load testing
async function testLoad() {
  console.log('\n🔥 Testing load handling...')
  
  const concurrentRequests = 10
  const requests = Array(concurrentRequests).fill(null).map(async (_, index) => {
    try {
      const startTime = Date.now()
      await $fetch(`${API_BASE_URL}/health`, { timeout: 10000 })
      const responseTime = Date.now() - startTime
      
      return { success: true, responseTime, index }
    } catch (error) {
      return { success: false, error: error.message, index }
    }
  })
  
  console.log(`  Running ${concurrentRequests} concurrent requests...`)
  const results = await Promise.all(requests)
  
  const successCount = results.filter(r => r.success).length
  const avgResponseTime = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / successCount
  
  console.log(`  ✅ ${successCount}/${concurrentRequests} requests successful`)
  console.log(`  📊 Average response time under load: ${avgResponseTime.toFixed(0)}ms`)
  
  return {
    totalRequests: concurrentRequests,
    successfulRequests: successCount,
    averageResponseTime: avgResponseTime
  }
}

// Run unit and integration tests
async function runTestSuite() {
  console.log('\n🧪 Running test suite...')
  
  try {
    // Run unit tests
    console.log('  Running unit tests...')
    execSync('pnpm test', { stdio: 'inherit', cwd: process.cwd() })
    console.log('  ✅ Unit tests passed')
    
    // Run integration tests
    console.log('  Running integration tests...')
    execSync('pnpm test tests/integration/', { stdio: 'inherit', cwd: process.cwd() })
    console.log('  ✅ Integration tests passed')
    
    return { success: true }
  } catch (error) {
    console.log('  ❌ Test suite failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Generate test report
function generateReport(results) {
  console.log('\n📋 Test Report')
  console.log('=' .repeat(50))
  
  const allTests = [
    { name: 'API Connectivity', result: results.apiConnectivity },
    { name: 'Authentication Flow', result: results.authFlow },
    { name: 'Order Flow', result: results.orderFlow },
    { name: 'Frontend Health', result: results.frontendHealth },
    { name: 'Performance Tests', result: results.performance },
    { name: 'Load Tests', result: results.loadTest },
    { name: 'Test Suite', result: results.testSuite }
  ]
  
  let passedTests = 0
  const totalTests = allTests.length
  
  allTests.forEach(test => {
    const status = test.result?.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${test.name}`)
    
    if (test.result?.success) passedTests++
  })
  
  console.log('=' .repeat(50))
  console.log(`Overall: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Application is ready for production.')
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues before deployment.')
  }
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  }
}

// Main execution
async function main() {
  try {
    // Check if backend is available
    const backendHealthy = await healthCheck(API_BASE_URL, 'Backend API')
    
    if (!backendHealthy) {
      console.log('⚠️  Backend API is not available. Some tests will be skipped.')
    }
    
    // Run all tests
    const results = {}
    
    // API tests (only if backend is available)
    if (backendHealthy) {
      results.apiConnectivity = await testApiConnectivity()
      
      const authResult = await testAuthenticationFlow()
      results.authFlow = authResult
      
      results.orderFlow = await testOrderFlow(authResult.token)
    } else {
      results.apiConnectivity = { success: false, reason: 'Backend not available' }
      results.authFlow = { success: false, reason: 'Backend not available' }
      results.orderFlow = { success: false, reason: 'Backend not available' }
    }
    
    // Frontend tests
    results.frontendHealth = await testFrontendHealth()
    results.performance = await testPerformance()
    results.loadTest = await testLoad()
    
    // Test suite
    results.testSuite = await runTestSuite()
    
    // Generate report
    const report = generateReport(results)
    
    // Exit with appropriate code
    process.exit(report.success ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Integration testing failed:', error.message)
    process.exit(1)
  }
}

main()