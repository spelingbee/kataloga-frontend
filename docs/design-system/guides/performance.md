# Performance Best Practices

This guide outlines performance optimization strategies for the design system, focusing on CSS delivery, bundle size optimization, and runtime performance.

## 🎯 Performance Goals

### Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Additional Metrics
- **First Contentful Paint (FCP)**: < 1.8s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms

## 🎨 CSS Performance

### Critical CSS Strategy
Load essential styles first, defer non-critical styles.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: [
    // Critical CSS first
    '@/assets/scss/critical.scss'
  ],
  
  // Non-critical CSS loaded asynchronously
  hooks: {
    'render:route': (url, result) => {
      result.html = result.html.replace(
        '<head>',
        '<head><link rel="preload" href="/css/non-critical.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">'
      )
    }
  }
})
```

### CSS Tree Shaking
Remove unused styles automatically.

```typescript
// utils/css-tree-shaking.ts
export class CSSTreeShaker {
  private usedClasses = new Set<string>()
  
  scanComponent(component: string): void {
    // Extract class names from component templates
    const classMatches = component.match(/class="([^"]+)"/g)
    
    classMatches?.forEach(match => {
      const classes = match.replace(/class="([^"]+)"/, '$1').split(' ')
      classes.forEach(cls => this.usedClasses.add(cls))
    })
  }
  
  generateOptimizedCSS(originalCSS: string): string {
    // Remove unused CSS rules
    return originalCSS
      .split('\n')
      .filter(line => this.isRuleUsed(line))
      .join('\n')
  }
  
  private isRuleUsed(rule: string): boolean {
    // Check if CSS rule is used in components
    const selector = rule.match(/^\.([a-zA-Z0-9_-]+)/)?.[1]
    return selector ? this.usedClasses.has(selector) : true
  }
}
```

### CSS Optimization
```scss
// Optimize CSS output
@use 'sass:math';

// Use efficient selectors
.base-button {
  // Direct class selector (fast)
}

// Avoid deep nesting (slower)
.page .section .card .button {
  // Too specific, harder to optimize
}

// Use CSS containment for performance
.component-container {
  contain: layout style paint;
}

// Optimize animations for GPU
.animated-element {
  will-change: transform;
  transform: translateZ(0); // Force GPU layer
  
  &:hover {
    transform: translateY(-2px) translateZ(0);
  }
}
```

## 📦 Bundle Optimization

### Component Code Splitting
Split components into separate chunks for better caching.

```typescript
// composables/useCodeSplitting.ts
export const useCodeSplitting = () => {
  const loadComponent = async (componentName: string) => {
    try {
      const component = await import(`@/components/${componentName}.vue`)
      return component.default
    } catch (error) {
      console.error(`Failed to load component: ${componentName}`, error)
      return null
    }
  }
  
  const preloadComponent = (componentName: string) => {
    // Preload component for faster subsequent loads
    import(`@/components/${componentName}.vue`)
  }
  
  return {
    loadComponent,
    preloadComponent
  }
}
```

### Dynamic Imports
Load components only when needed.

```vue
<template>
  <div>
    <!-- Load heavy components dynamically -->
    <Suspense>
      <LazyMenuGrid v-if="showMenu" />
      <template #fallback>
        <BaseSkeleton />
      </template>
    </Suspense>
  </div>
</template>

<script setup>
// Dynamic import with prefetch
const LazyMenuGrid = defineAsyncComponent({
  loader: () => import('@/components/menu/MenuGrid.vue'),
  loadingComponent: BaseSkeleton,
  errorComponent: ErrorFallback,
  delay: 200,
  timeout: 3000
})

const showMenu = ref(false)

// Preload when user hovers over menu button
const preloadMenu = () => {
  import('@/components/menu/MenuGrid.vue')
}
</script>
```

### Bundle Analysis
Monitor and optimize bundle size.

```typescript
// utils/bundle-analyzer.ts
export class BundleAnalyzer {
  analyzeChunks(): BundleReport {
    const chunks = this.getChunkSizes()
    const recommendations = this.generateRecommendations(chunks)
    
    return {
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      chunks,
      recommendations
    }
  }
  
  private getChunkSizes(): ChunkInfo[] {
    // Analyze webpack/vite bundle output
    return [
      { name: 'vendor', size: 150000, type: 'vendor' },
      { name: 'app', size: 80000, type: 'app' },
      { name: 'components', size: 45000, type: 'async' }
    ]
  }
  
  private generateRecommendations(chunks: ChunkInfo[]): string[] {
    const recommendations: string[] = []
    
    chunks.forEach(chunk => {
      if (chunk.size > 100000) {
        recommendations.push(`Consider splitting ${chunk.name} chunk (${chunk.size} bytes)`)
      }
    })
    
    return recommendations
  }
}

interface ChunkInfo {
  name: string
  size: number
  type: 'vendor' | 'app' | 'async'
}

interface BundleReport {
  totalSize: number
  chunks: ChunkInfo[]
  recommendations: string[]
}
```

## 🖼️ Image Optimization

### Responsive Images
Serve appropriate image sizes for different devices.

```vue
<template>
  <picture class="responsive-image">
    <!-- WebP format for modern browsers -->
    <source
      :srcset="generateWebPSrcset(image)"
      type="image/webp"
    />
    
    <!-- Fallback JPEG -->
    <img
      :src="image.src"
      :srcset="generateSrcset(image)"
      :sizes="imageSizes"
      :alt="image.alt"
      :loading="loading"
      :decoding="decoding"
      @load="handleImageLoad"
      @error="handleImageError"
    />
  </picture>
</template>

<script setup>
interface ImageProps {
  image: {
    src: string
    alt: string
    width: number
    height: number
  }
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
}

const props = withDefaults(defineProps<ImageProps>(), {
  loading: 'lazy',
  decoding: 'async'
})

const imageSizes = computed(() => {
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
})

const generateSrcset = (image: any) => {
  const sizes = [320, 640, 960, 1280]
  return sizes
    .map(size => `${image.src}?w=${size} ${size}w`)
    .join(', ')
}

const generateWebPSrcset = (image: any) => {
  const sizes = [320, 640, 960, 1280]
  return sizes
    .map(size => `${image.src}?w=${size}&f=webp ${size}w`)
    .join(', ')
}

const handleImageLoad = () => {
  // Track successful image loads
  console.log('Image loaded successfully')
}

const handleImageError = () => {
  // Handle image load errors gracefully
  console.error('Failed to load image')
}
</script>
```

### Lazy Loading with Intersection Observer
```typescript
// composables/useLazyImage.ts
export const useLazyImage = () => {
  const imageRef = ref<HTMLImageElement>()
  const isLoaded = ref(false)
  const isInView = ref(false)
  
  const observer = ref<IntersectionObserver>()
  
  onMounted(() => {
    if (!imageRef.value) return
    
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            isInView.value = true
            loadImage()
            observer.value?.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    )
    
    observer.value.observe(imageRef.value)
  })
  
  onUnmounted(() => {
    observer.value?.disconnect()
  })
  
  const loadImage = () => {
    if (!imageRef.value || isLoaded.value) return
    
    const img = new Image()
    img.onload = () => {
      isLoaded.value = true
      if (imageRef.value) {
        imageRef.value.src = img.src
      }
    }
    img.src = imageRef.value.dataset.src || ''
  }
  
  return {
    imageRef,
    isLoaded,
    isInView
  }
}
```

## ⚡ Runtime Performance

### Virtual Scrolling
Handle large lists efficiently.

```typescript
// composables/useVirtualScroll.ts
export const useVirtualScroll = <T>(
  items: Ref<T[]>,
  itemHeight: number,
  containerHeight: number
) => {
  const scrollTop = ref(0)
  const containerRef = ref<HTMLElement>()
  
  const visibleRange = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + 1,
      items.value.length
    )
    
    return { start, end }
  })
  
  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    return items.value.slice(start, end).map((item, index) => ({
      item,
      index: start + index
    }))
  })
  
  const totalHeight = computed(() => items.value.length * itemHeight)
  
  const offsetY = computed(() => visibleRange.value.start * itemHeight)
  
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }
  
  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  }
}
```

### Debounced Search
Optimize search performance.

```typescript
// composables/useDebouncedSearch.ts
export const useDebouncedSearch = <T>(
  searchFn: (query: string) => Promise<T[]>,
  delay = 300
) => {
  const query = ref('')
  const results = ref<T[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const debouncedSearch = useDebounceFn(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      results.value = []
      return
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      results.value = await searchFn(searchQuery)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Search failed'
      results.value = []
    } finally {
      isLoading.value = false
    }
  }, delay)
  
  watch(query, (newQuery) => {
    debouncedSearch(newQuery)
  })
  
  return {
    query,
    results,
    isLoading,
    error
  }
}
```

### Memoization
Cache expensive computations.

```typescript
// utils/memoization.ts
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = fn(...args)
    cache.set(key, result)
    
    return result
  }) as T
}

// Usage example
const expensiveCalculation = memoize((a: number, b: number) => {
  // Expensive operation
  return Math.pow(a, b)
})
```

## 📊 Performance Monitoring

### Core Web Vitals Tracking
```typescript
// utils/core-web-vitals.ts
export class CoreWebVitalsTracker {
  private metrics: Map<string, number> = new Map()
  
  init(): void {
    this.trackLCP()
    this.trackFID()
    this.trackCLS()
  }
  
  private trackLCP(): void {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      this.metrics.set('LCP', lastEntry.startTime)
      this.reportMetric('LCP', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
  }
  
  private trackFID(): void {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach(entry => {
        this.metrics.set('FID', entry.processingStart - entry.startTime)
        this.reportMetric('FID', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })
  }
  
  private trackCLS(): void {
    let clsValue = 0
    
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      
      this.metrics.set('CLS', clsValue)
      this.reportMetric('CLS', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }
  
  private reportMetric(name: string, value: number): void {
    // Send to analytics service
    console.log(`${name}: ${value}`)
    
    // You can integrate with services like:
    // - Google Analytics
    // - Sentry Performance
    // - Custom analytics endpoint
  }
  
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }
}
```

### Performance Budget
Set and monitor performance budgets.

```typescript
// utils/performance-budget.ts
export interface PerformanceBudget {
  maxBundleSize: number      // bytes
  maxLCP: number            // milliseconds
  maxFID: number            // milliseconds
  maxCLS: number            // score
  maxImageSize: number      // bytes
}

export class PerformanceBudgetMonitor {
  private budget: PerformanceBudget
  
  constructor(budget: PerformanceBudget) {
    this.budget = budget
  }
  
  checkBudget(metrics: Record<string, number>): BudgetReport {
    const violations: string[] = []
    
    if (metrics.bundleSize > this.budget.maxBundleSize) {
      violations.push(`Bundle size exceeded: ${metrics.bundleSize} > ${this.budget.maxBundleSize}`)
    }
    
    if (metrics.LCP > this.budget.maxLCP) {
      violations.push(`LCP exceeded: ${metrics.LCP}ms > ${this.budget.maxLCP}ms`)
    }
    
    if (metrics.FID > this.budget.maxFID) {
      violations.push(`FID exceeded: ${metrics.FID}ms > ${this.budget.maxFID}ms`)
    }
    
    if (metrics.CLS > this.budget.maxCLS) {
      violations.push(`CLS exceeded: ${metrics.CLS} > ${this.budget.maxCLS}`)
    }
    
    return {
      passed: violations.length === 0,
      violations,
      metrics
    }
  }
}

interface BudgetReport {
  passed: boolean
  violations: string[]
  metrics: Record<string, number>
}
```

## 🧪 Performance Testing

### Automated Performance Tests
```typescript
// tests/performance/core-web-vitals.test.ts
import { test, expect } from '@playwright/test'

test.describe('Core Web Vitals', () => {
  test('should meet LCP target', async ({ page }) => {
    await page.goto('/')
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry.startTime)
        }).observe({ entryTypes: ['largest-contentful-paint'] })
      })
    })
    
    expect(lcp).toBeLessThan(2500) // 2.5s target
  })
  
  test('should have minimal CLS', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to stabilize
    await page.waitForTimeout(3000)
    
    const cls = await page.evaluate(() => {
      let clsValue = 0
      
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
      }).observe({ entryTypes: ['layout-shift'] })
      
      return clsValue
    })
    
    expect(cls).toBeLessThan(0.1) // CLS target
  })
})
```

### Bundle Size Testing
```typescript
// tests/performance/bundle-size.test.ts
import { readFileSync, statSync } from 'fs'
import { glob } from 'glob'

describe('Bundle Size', () => {
  it('should not exceed size budget', () => {
    const distFiles = glob.sync('dist/**/*.{js,css}')
    const totalSize = distFiles.reduce((sum, file) => {
      return sum + statSync(file).size
    }, 0)
    
    const budgetMB = 1 // 1MB budget
    const budgetBytes = budgetMB * 1024 * 1024
    
    expect(totalSize).toBeLessThan(budgetBytes)
  })
  
  it('should have efficient code splitting', () => {
    const jsFiles = glob.sync('dist/**/*.js')
    const vendorChunk = jsFiles.find(file => file.includes('vendor'))
    const appChunk = jsFiles.find(file => file.includes('app'))
    
    if (vendorChunk && appChunk) {
      const vendorSize = statSync(vendorChunk).size
      const appSize = statSync(appChunk).size
      
      // Vendor chunk should be larger than app chunk
      expect(vendorSize).toBeGreaterThan(appSize)
      
      // But not too large
      expect(vendorSize).toBeLessThan(500 * 1024) // 500KB
    }
  })
})
```

## 📋 Performance Checklist

### Development
- [ ] Use CSS containment for isolated components
- [ ] Implement lazy loading for images and components
- [ ] Optimize animations for GPU acceleration
- [ ] Use efficient CSS selectors
- [ ] Implement virtual scrolling for large lists
- [ ] Debounce expensive operations

### Build Optimization
- [ ] Enable CSS tree shaking
- [ ] Implement code splitting
- [ ] Optimize image formats (WebP, AVIF)
- [ ] Minify and compress assets
- [ ] Set up proper caching headers
- [ ] Monitor bundle size

### Runtime Monitoring
- [ ] Track Core Web Vitals
- [ ] Monitor bundle size
- [ ] Set performance budgets
- [ ] Implement error tracking
- [ ] Use performance profiling tools

## 🔗 Resources

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Chrome DevTools Performance](https://developers.google.com/web/tools/chrome-devtools/performance)
- [Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

### Monitoring Services
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Sentry Performance](https://sentry.io/for/performance/)
- [New Relic Browser](https://newrelic.com/products/browser-monitoring)
- [DataDog RUM](https://www.datadoghq.com/product/real-user-monitoring/)

Remember: Performance is not a one-time optimization—it requires continuous monitoring and improvement throughout the development lifecycle.