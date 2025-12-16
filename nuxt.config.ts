// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Modules
  modules: ['@pinia/nuxt', '@nuxtjs/google-fonts', '@nuxt/eslint', '@vite-pwa/nuxt', '@nuxt/image', '@nuxtjs/i18n'],

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        types: ["node"],
      },
    },
  },

  // CSS configuration
  css: ['@/assets/scss/main.scss'],

  // Google Fonts configuration
  googleFonts: {
    families: {
      'Inter': [300, 400, 500, 600, 700],
      'Poppins': [300, 400, 500, 600, 700],
    },
    display: 'swap',
    preload: true,
  },

  // i18n configuration
  i18n: {
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English',
        file: 'en.json',
      },
      {
        code: 'ru',
        iso: 'ru-RU',
        name: 'Русский',
        file: 'ru.json',
      },
      {
        code: 'ky',
        iso: 'ky-KG',
        name: 'Кыргызча',
        file: 'ky.json',
      },
    ],
    langDir: 'locales',
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en',
    },
    vueI18n: './i18n.config.ts',
  },



  // Pinia configuration
  pinia: {
    storesDirs: ['./stores/**'],
  },

  // App configuration
  app: {
    head: {
      title: 'Menu Ordering App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Universal menu ordering system for web and Telegram' },
      ],
    },
  },

  // Runtime config
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
      tenantSlug: process.env.NUXT_PUBLIC_TENANT_SLUG || '',
      websocketUrl: process.env.NUXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
      telegramBotToken: process.env.NUXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Menu Ordering App',
      vapidPublicKey: process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
      analyticsId: process.env.NUXT_PUBLIC_ANALYTICS_ID || '',
      cdnUrl: process.env.NUXT_PUBLIC_CDN_URL || '',
      
      // Multi-tenant configuration
      multiTenantMode: process.env.NUXT_PUBLIC_MULTI_TENANT_MODE === 'true',
      defaultTenant: process.env.NUXT_PUBLIC_DEFAULT_TENANT || '',
      tenantQueryParam: process.env.NUXT_PUBLIC_TENANT_QUERY_PARAM || 'tenant',
      preserveTenantInUrl: process.env.NUXT_PUBLIC_PRESERVE_TENANT_IN_URL !== 'false',
      requireTenantValidation: process.env.NUXT_PUBLIC_REQUIRE_TENANT_VALIDATION !== 'false',
      tenantCacheTimeout: parseInt(process.env.NUXT_PUBLIC_TENANT_CACHE_TIMEOUT || '300000'), // 5 minutes
      allowTenantSwitching: process.env.NUXT_PUBLIC_ALLOW_TENANT_SWITCHING !== 'false',
      
      // Payment gateway configuration
      payment: {
        elsom: {
          enabled: process.env.NUXT_PUBLIC_PAYMENT_ELSOM_ENABLED !== 'false',
          testMode: process.env.NUXT_PUBLIC_PAYMENT_ELSOM_TEST_MODE !== 'false',
          publicKey: process.env.NUXT_PUBLIC_PAYMENT_ELSOM_PUBLIC_KEY || '',
          merchantId: process.env.NUXT_PUBLIC_PAYMENT_ELSOM_MERCHANT_ID || '',
        },
        o: {
          enabled: process.env.NUXT_PUBLIC_PAYMENT_O_ENABLED !== 'false',
          testMode: process.env.NUXT_PUBLIC_PAYMENT_O_TEST_MODE !== 'false',
          publicKey: process.env.NUXT_PUBLIC_PAYMENT_O_PUBLIC_KEY || '',
          merchantId: process.env.NUXT_PUBLIC_PAYMENT_O_MERCHANT_ID || '',
        },
        mega: {
          enabled: process.env.NUXT_PUBLIC_PAYMENT_MEGA_ENABLED !== 'false',
          testMode: process.env.NUXT_PUBLIC_PAYMENT_MEGA_TEST_MODE !== 'false',
          publicKey: process.env.NUXT_PUBLIC_PAYMENT_MEGA_PUBLIC_KEY || '',
          merchantId: process.env.NUXT_PUBLIC_PAYMENT_MEGA_MERCHANT_ID || '',
        },
        stripe: {
          enabled: process.env.NUXT_PUBLIC_PAYMENT_STRIPE_ENABLED !== 'false',
          testMode: process.env.NUXT_PUBLIC_PAYMENT_STRIPE_TEST_MODE !== 'false',
          publicKey: process.env.NUXT_PUBLIC_PAYMENT_STRIPE_PUBLIC_KEY || '',
        },
        telegram: {
          enabled: process.env.NUXT_PUBLIC_PAYMENT_TELEGRAM_ENABLED !== 'false',
          testMode: process.env.NUXT_PUBLIC_PAYMENT_TELEGRAM_TEST_MODE !== 'false',
        },
      },
    },
  },

  // Build configuration
  nitro: {
    compressPublicAssets: true,
    minify: true,
    preset: process.env.NITRO_PRESET || 'node-server',
    storage: {
      redis: {
        driver: 'redis',
        // Redis configuration for production caching
      }
    },
    experimental: {
      wasm: true,
    },
    rollupConfig: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('nuxt')) {
              return 'vendor-core'
            }
            return 'vendor'
          }
        }
      }
    }
  },

  // Image optimization configuration
  image: {
    quality: 80,
    format: ['webp', 'avif', 'jpg', 'png'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    densities: [1, 2],
    providers: {
      static: {
        provider: 'static',
      },
    },
    presets: {
      // Thumbnail images
      thumb: {
        modifiers: {
          format: 'webp',
          quality: 75,
          width: 150,
          height: 150,
          fit: 'cover',
        },
      },
      // Dish images
      dish: {
        modifiers: {
          format: 'webp',
          quality: 85,
          width: 300,
          height: 300,
          fit: 'cover',
        },
      },
      // Large dish images
      dishLarge: {
        modifiers: {
          format: 'webp',
          quality: 90,
          width: 600,
          height: 600,
          fit: 'cover',
        },
      },
      // Category images
      category: {
        modifiers: {
          format: 'webp',
          quality: 80,
          width: 200,
          height: 200,
          fit: 'cover',
        },
      },
      // Hero images
      hero: {
        modifiers: {
          format: 'webp',
          quality: 85,
          width: 1200,
          height: 600,
          fit: 'cover',
        },
      },
      // Avatar images
      avatar: {
        modifiers: {
          format: 'webp',
          quality: 80,
          width: 100,
          height: 100,
          fit: 'cover',
        },
      },
    },
    // Lazy loading by default
    loading: 'lazy',
    // Preload critical images
    preload: {
      hero: true,
      category: false,
    },
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: false,
    viewTransition: true,
  },

  // Optimization features
  optimization: {
    keyedComposables: [
      {
        name: 'useState',
        argumentLength: 2,
      },
    ],
  },

  // Features for better performance
  features: {
    inlineStyles: false, // We handle critical CSS manually
  },

  // Route rules for performance
  routeRules: {
    // Homepage - SSR for SEO
    '/': { ssr: true },
    
    // Tenant selection page - SSR for SEO
    '/select-restaurant': { ssr: true },
    
    // Menu pages - SSR for SEO and performance
    '/menu': { ssr: true },
    '/menu/**': { ssr: true },
    '/dish/**': { ssr: true },
    
    // Auth pages - SPA for better UX
    '/auth/**': { ssr: false },
    
    // Admin pages - SPA with lazy loading
    '/admin/**': { ssr: false },
    
    // User pages - SPA
    '/orders/**': { ssr: false },
    '/profile/**': { ssr: false },
    
    // API routes
    '/api/**': { cors: true, headers: { 'Cache-Control': 's-maxage=60' } },
    
    // Static assets
    '/images/**': { headers: { 'Cache-Control': 'max-age=31536000' } },
    '/icons/**': { headers: { 'Cache-Control': 'max-age=31536000' } },
    
    // PWA files
    '/sw.js': { headers: { 'Cache-Control': 'no-cache' } },
    '/manifest.json': { headers: { 'Cache-Control': 'max-age=86400' } },
  },

  // PWA configuration
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webp,avif}'],

      runtimeCaching: [
        // API caching with network first strategy
        {
          urlPattern: /^https:\/\/api\./,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24, // 24 hours
            },
          },
        },
        // Menu data with stale while revalidate
        {
          urlPattern: /\/api\/menu\//,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'menu-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 2, // 2 hours
            },
          },
        },
        // Images with cache first strategy
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        // Fonts caching
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts-stylesheets',
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
      ],

    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 20,
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
    manifest: {
      name: 'Menu Ordering App',
      short_name: 'MenuApp',
      description: 'Universal menu ordering system for web and Telegram',
      theme_color: '#1a1a1a',
      background_color: '#1a1a1a',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      categories: ['food', 'shopping'],
      lang: 'en',
      icons: [
        {
          src: '/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
        },
        {
          src: '/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
        {
          src: '/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
        },
        {
          src: '/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
        },
        {
          src: '/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
        },
        {
          src: '/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
      shortcuts: [
        {
          name: 'View Menu',
          short_name: 'Menu',
          description: 'Browse restaurant menu',
          url: '/menu',
          icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
        },
        {
          name: 'My Orders',
          short_name: 'Orders',
          description: 'View order history',
          url: '/orders',
          icons: [{ src: '/icon-192x192.png', sizes: '192x192' }],
        },
      ],
    },
  },

  // Vite configuration for optimization
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Removed additionalData to avoid conflicts with @use in main.scss
          // Each SCSS file should import what it needs
        }
      },
      devSourcemap: false, // Disable CSS sourcemaps in production
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('vue') || id.includes('pinia')) {
                return 'vendor-core'
              }
              if (id.includes('@telegram-apps/sdk')) {
                return 'vendor-telegram'
              }
              if (id.includes('leaflet')) {
                return 'vendor-maps'
              }
              if (id.includes('@nuxt') || id.includes('nuxt')) {
                return 'vendor-nuxt'
              }
              return 'vendor-misc'
            }
            
            // Admin chunks (lazy loaded)
            if (id.includes('/pages/admin/') || id.includes('/components/admin/')) {
              return 'admin'
            }
            
            // Auth chunks
            if (id.includes('/pages/auth/') || id.includes('/stores/auth')) {
              return 'auth'
            }
            
            // Menu chunks
            if (id.includes('/pages/menu/') || id.includes('/components/menu/') || id.includes('/stores/menu')) {
              return 'menu'
            }
            
            // Order chunks
            if (id.includes('/pages/orders/') || id.includes('/components/order/') || id.includes('/stores/order')) {
              return 'orders'
            }
            
            // Checkout chunks
            if (id.includes('/pages/checkout') || id.includes('/components/checkout/') || id.includes('/stores/cart')) {
              return 'checkout'
            }
            
            // Payment chunks
            if (id.includes('/services/payment/') || id.includes('/components/payment/')) {
              return 'payment'
            }
          },
        },
      },
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
          pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info'] : [],
        },
        mangle: {
          safari10: true,
        },
      },
      cssMinify: 'lightningcss', // Faster CSS minification
      sourcemap: false, // Disable sourcemaps in production
      reportCompressedSize: false, // Faster builds
    },
    optimizeDeps: {
      include: ['vue', 'pinia', '@telegram-apps/sdk', 'leaflet'],
      exclude: ['@nuxt/devtools'],
    },
    define: {
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_OPTIONS_API__: false, // Disable Options API for smaller bundle
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
  },
})
