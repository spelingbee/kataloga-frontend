import type { UseFetchOptions } from 'nuxt/app'

interface CacheOptions {
  ttl?: number // Time to live in seconds
  key?: string
  tags?: string[]
}

export const useApiCache = () => {
  const getCacheKey = (url: string, params?: Record<string, any>): string => {
    const baseKey = url.replace(/[^a-zA-Z0-9]/g, '_')
    if (params) {
      const paramString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&')
      return `${baseKey}_${btoa(paramString)}`
    }
    return baseKey
  }

  const createCachedFetch = <T>(
    url: string,
    options: UseFetchOptions<T> & CacheOptions = {}
  ) => {
    const { ttl = 300, key, tags = [], ...fetchOptions } = options

    const cacheKey = key || getCacheKey(url, fetchOptions.params as Record<string, any>)

    return $fetch<T>(url, {
      ...fetchOptions,
      headers: {
        'Cache-Control': `max-age=${ttl}`,
        ...(fetchOptions.headers as any),
      },
      method: fetchOptions.method as any,
    } as any)
  }

  const cachedMenuFetch = <T>(url: string, options: CacheOptions = {}) => {
    return createCachedFetch<T>(url, {
      ...options,
      ttl: 600, // 10 minutes for menu data
      tags: ['menu'],
    })
  }

  const cachedOrderFetch = <T>(url: string, options: CacheOptions = {}) => {
    return createCachedFetch<T>(url, {
      ...options,
      ttl: 60, // 1 minute for order data
      tags: ['orders'],
    })
  }

  const cachedUserFetch = <T>(url: string, options: CacheOptions = {}) => {
    return createCachedFetch<T>(url, {
      ...options,
      ttl: 300, // 5 minutes for user data
      tags: ['user'],
    })
  }

  return {
    getCacheKey,
    createCachedFetch,
    cachedMenuFetch,
    cachedOrderFetch,
    cachedUserFetch,
  }
}