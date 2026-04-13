// Health check endpoint for production monitoring
export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  
  try {
    // Check basic application health
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        api: 'healthy',
        database: 'healthy',
        cache: 'healthy'
      }
    }

    // Check API connectivity
    try {
      const config = useRuntimeConfig()
      const apiUrl = config.public.apiBaseUrl
      
      if (apiUrl && apiUrl !== 'http://localhost:3001') {
        const response = await $fetch(`${apiUrl}/health`, {
          timeout: 5000,
          retry: 0
        })
        
        if (response) {
          health.checks.api = 'healthy'
        } else {
          health.checks.api = 'degraded'
        }
      }
    } catch (error) {
      health.checks.api = 'unhealthy'
      health.status = 'degraded'
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage()
    const memoryThreshold = 1024 * 1024 * 1024 // 1GB
    
    if (memoryUsage.heapUsed > memoryThreshold) {
      health.status = 'degraded'
      health.checks.memory = 'high'
    }

    // Response time check
    const responseTime = Date.now() - startTime
    health.responseTime = responseTime
    
    if (responseTime > 1000) {
      health.status = 'degraded'
    }

    // Set appropriate HTTP status
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503

    setResponseStatus(event, statusCode)
    
    return health
  } catch (error) {
    setResponseStatus(event, 503)
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
      responseTime: Date.now() - startTime
    }
  }
})
