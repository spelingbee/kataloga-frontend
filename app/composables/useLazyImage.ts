/**
 * Lazy image loading composable with Intersection Observer
 * Improves performance by loading images only when they're visible
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface LazyImageOptions {
  rootMargin?: string
  threshold?: number
  placeholder?: string
  errorImage?: string
}

export function useLazyImage(options: LazyImageOptions = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.01,
    placeholder = '/images/placeholder.png',
    errorImage = '/images/error.png',
  } = options

  const imageRef = ref<HTMLImageElement | null>(null)
  const isLoaded = ref(false)
  const isError = ref(false)
  const currentSrc = ref(placeholder)

  let observer: IntersectionObserver | null = null

  const loadImage = (src: string) => {
    if (!imageRef.value) return

    const img = new Image()
    
    img.onload = () => {
      currentSrc.value = src
      isLoaded.value = true
      isError.value = false
    }

    img.onerror = () => {
      currentSrc.value = errorImage
      isError.value = true
      isLoaded.value = false
    }

    img.src = src
  }

  const observe = (src: string) => {
    if (!imageRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage(src)
            if (observer && imageRef.value) {
              observer.unobserve(imageRef.value)
            }
          }
        })
      },
      { rootMargin, threshold }
    )

    observer.observe(imageRef.value)
  }

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    imageRef,
    currentSrc,
    isLoaded,
    isError,
    observe,
  }
}

/**
 * Preload critical images
 */
export function useImagePreload(urls: string[]) {
  const loadedImages = ref<Set<string>>(new Set())
  const failedImages = ref<Set<string>>(new Set())

  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        loadedImages.value.add(url)
        resolve()
      }

      img.onerror = () => {
        failedImages.value.add(url)
        reject(new Error(`Failed to load image: ${url}`))
      }

      img.src = url
    })
  }

  const preloadAll = async () => {
    const promises = urls.map((url) => preloadImage(url).catch(() => {}))
    await Promise.all(promises)
  }

  const isLoaded = (url: string) => loadedImages.value.has(url)
  const isFailed = (url: string) => failedImages.value.has(url)

  onMounted(() => {
    preloadAll()
  })

  return {
    loadedImages,
    failedImages,
    isLoaded,
    isFailed,
    preloadImage,
    preloadAll,
  }
}

/**
 * Progressive image loading (blur-up effect)
 */
export function useProgressiveImage(
  lowQualitySrc: string,
  highQualitySrc: string
) {
  const currentSrc = ref(lowQualitySrc)
  const isHighQualityLoaded = ref(false)

  const loadHighQuality = () => {
    const img = new Image()
    
    img.onload = () => {
      currentSrc.value = highQualitySrc
      isHighQualityLoaded.value = true
    }

    img.src = highQualitySrc
  }

  onMounted(() => {
    loadHighQuality()
  })

  return {
    currentSrc,
    isHighQualityLoaded,
  }
}
