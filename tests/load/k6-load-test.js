import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')

// Test configuration
export const options = {
    stages: [
        { duration: '2m', target: 10 }, // Ramp up to 10 users
        { duration: '5m', target: 10 }, // Stay at 10 users
        { duration: '2m', target: 20 }, // Ramp up to 20 users
        { duration: '5m', target: 20 }, // Stay at 20 users
        { duration: '2m', target: 0 },  // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
        http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
        errors: ['rate<0.1'],              // Custom error rate should be below 10%
    },
}

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const API_URL = __ENV.API_URL || 'http://localhost:3001'

// Test scenarios
export default function () {
    // Test homepage
    testHomepage()

    // Test menu browsing
    testMenuBrowsing()

    // Test API endpoints
    testApiEndpoints()

    // Test search functionality
    testSearch()

    sleep(1)
}

function testHomepage() {
    const response = http.get(`${BASE_URL}/`)

    const success = check(response, {
        'homepage status is 200': (r) => r.status === 200,
        'homepage loads in reasonable time': (r) => r.timings.duration < 3000,
        'homepage contains expected content': (r) => r.body.includes('Menu Ordering'),
    })

    errorRate.add(!success)
}

function testMenuBrowsing() {
    // Test menu page
    const menuResponse = http.get(`${BASE_URL}/menu`)

    const menuSuccess = check(menuResponse, {
        'menu page status is 200': (r) => r.status === 200,
        'menu page loads in reasonable time': (r) => r.timings.duration < 3000,
    })

    errorRate.add(!menuSuccess)

    // Test category pages
    const categories = ['pizza', 'salads', 'drinks']
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]

    const categoryResponse = http.get(`${BASE_URL}/menu/categories/${randomCategory}`)

    const categorySuccess = check(categoryResponse, {
        'category page status is 200': (r) => r.status === 200,
        'category page loads in reasonable time': (r) => r.timings.duration < 3000,
    })

    errorRate.add(!categorySuccess)
}

function testApiEndpoints() {
    // Test health endpoint
    const healthResponse = http.get(`${API_URL}/health`)

    const healthSuccess = check(healthResponse, {
        'health endpoint status is 200': (r) => r.status === 200,
        'health endpoint responds quickly': (r) => r.timings.duration < 1000,
        'health endpoint returns healthy status': (r) => {
            try {
                const body = JSON.parse(r.body)
                return body.status === 'healthy'
            } catch {
                return false
            }
        },
    })

    errorRate.add(!healthSuccess)

    // Test menu API
    const menuApiResponse = http.get(`${API_URL}/api/menu`)

    const menuApiSuccess = check(menuApiResponse, {
        'menu API status is 200': (r) => r.status === 200,
        'menu API responds in reasonable time': (r) => r.timings.duration < 2000,
        'menu API returns valid JSON': (r) => {
            try {
                const body = JSON.parse(r.body)
                return body.success === true && Array.isArray(body.data)
            } catch {
                return false
            }
        },
    })

    errorRate.add(!menuApiSuccess)

    // Test categories API
    const categoriesResponse = http.get(`${API_URL}/api/menu/categories`)

    const categoriesSuccess = check(categoriesResponse, {
        'categories API status is 200': (r) => r.status === 200,
        'categories API responds quickly': (r) => r.timings.duration < 1500,
    })

    errorRate.add(!categoriesSuccess)
}

function testSearch() {
    const searchQueries = ['pizza', 'salad', 'burger', 'drink', 'pasta']
    const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)]

    // Test frontend search page
    const searchPageResponse = http.get(`${BASE_URL}/menu/search?q=${randomQuery}`)

    const searchPageSuccess = check(searchPageResponse, {
        'search page status is 200': (r) => r.status === 200,
        'search page loads in reasonable time': (r) => r.timings.duration < 3000,
    })

    errorRate.add(!searchPageSuccess)

    // Test search API
    const searchApiResponse = http.get(`${API_URL}/api/menu/search?q=${randomQuery}`)

    const searchApiSuccess = check(searchApiResponse, {
        'search API status is 200': (r) => r.status === 200,
        'search API responds quickly': (r) => r.timings.duration < 2000,
        'search API returns results': (r) => {
            try {
                const body = JSON.parse(r.body)
                return body.success === true && Array.isArray(body.data)
            } catch {
                return false
            }
        },
    })

    errorRate.add(!searchApiSuccess)
}

// Setup function (runs once at the beginning)
export function setup() {
    console.log('Starting load test...')
    console.log(`Base URL: ${BASE_URL}`)
    console.log(`API URL: ${API_URL}`)

    // Verify that the application is running
    const healthCheck = http.get(`${API_URL}/health`)

    if (healthCheck.status !== 200) {
        throw new Error(`Application health check failed: ${healthCheck.status}`)
    }

    console.log('Application is healthy, starting load test...')
}

// Teardown function (runs once at the end)
export function teardown() {
    console.log('Load test completed')
}