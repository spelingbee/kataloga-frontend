/**
 * Bundle size analyzer utilities
 * Helps identify large dependencies and optimize bundle size
 */

interface BundleStats {
  totalSize: number
  chunks: Array<{
    name: string
    size: number
    percentage: number
  }>
  largestChunks: Array<{
    name: string
    size: number
    percentage: number
  }>
}

/**
 * Analyze bundle size from build stats
 */
export function analyzeBundleSize(stats: any): BundleStats {
  const chunks = stats.chunks || []
  const totalSize = chunks.reduce((sum: number, chunk: any) => sum + chunk.size, 0)

  const chunkStats = chunks.map((chunk: any) => ({
    name: chunk.name || chunk.id,
    size: chunk.size,
    percentage: (chunk.size / totalSize) * 100,
  }))

  const largestChunks = [...chunkStats]
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)

  return {
    totalSize,
    chunks: chunkStats,
    largestChunks,
  }
}

/**
 * Format bytes to human-readable size (bundle analyzer version)
 * Note: formatBytes is also available in performance.ts
 * This version includes decimals parameter for bundle analysis
 */
export function formatBytesForBundle(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Check if bundle size exceeds threshold
 */
export function checkBundleSize(size: number, threshold: number = 500000): boolean {
  return size > threshold
}

/**
 * Get bundle size recommendations
 */
export function getBundleSizeRecommendations(stats: BundleStats): string[] {
  const recommendations: string[] = []

  // Check total size
  if (stats.totalSize > 1000000) {
    recommendations.push('Total bundle size exceeds 1MB. Consider code splitting.')
  }

  // Check individual chunks
  stats.largestChunks.forEach((chunk) => {
    if (chunk.size > 500000) {
      recommendations.push(
        `Chunk "${chunk.name}" is ${formatBytesForBundle(chunk.size)}. Consider splitting or lazy loading.`
      )
    }
  })

  // Check vendor chunks
  const vendorChunks = stats.chunks.filter((chunk) => chunk.name.includes('vendor'))
  const vendorSize = vendorChunks.reduce((sum, chunk) => sum + chunk.size, 0)
  
  if (vendorSize > 500000) {
    recommendations.push(
      `Vendor chunks total ${formatBytesForBundle(vendorSize)}. Consider splitting vendors or using CDN.`
    )
  }

  return recommendations
}

/**
 * Log bundle analysis to console
 */
export function logBundleAnalysis(stats: BundleStats): void {
  console.group('📦 Bundle Size Analysis')
  console.log('Total Size:', formatBytesForBundle(stats.totalSize))
  console.log('\nLargest Chunks:')
  
  stats.largestChunks.forEach((chunk, index) => {
    console.log(
      `${index + 1}. ${chunk.name}: ${formatBytesForBundle(chunk.size)} (${chunk.percentage.toFixed(2)}%)`
    )
  })

  const recommendations = getBundleSizeRecommendations(stats)
  if (recommendations.length > 0) {
    console.log('\n⚠️ Recommendations:')
    recommendations.forEach((rec) => console.log(`- ${rec}`))
  }

  console.groupEnd()
}
