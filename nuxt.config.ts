// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Modules
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate', '@nuxtjs/google-fonts', '@nuxt/eslint', '@nuxt/image', '@nuxtjs/i18n'],

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false,
    tsConfig: {
      compilerOptions: {
        types: ['node'],
      },
    },
  },

  // CSS configuration
  css: ['@/assets/scss/main.scss'],

  // Google Fonts configuration
  googleFonts: {
    families: {
      Inter: [300, 400, 500, 600, 700],
      Poppins: [300, 400, 500, 600, 700],
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
    defaultLocale: 'ru',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en',
    },
    vueI18n: './i18n/i18n.config.ts',
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
      script: [
        { src: 'https://telegram.org/js/telegram-web-app.js', defer: true }
      ],
    },
  },

  // Runtime config
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || '/api',
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
      tenantSlug: process.env.NUXT_PUBLIC_TENANT_SLUG || '',
      telegramBotToken: process.env.NUXT_PUBLIC_TELEGRAM_BOT_TOKEN || '',
      telegramBotUsername: process.env.NUXT_PUBLIC_TELEGRAM_BOT_USERNAME || '',
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
      },
    },
    experimental: {
      wasm: true,
    },
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
    payloadExtraction: true,
    viewTransition: false,
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
    // Homepage - SSR for SEO (Landing Page)
    '/': { ssr: true },

    // Tenant selection page - SSR for SEO
    '/select-restaurant': { ssr: true },

    // Tenant-specific routes
    '/t/**': { ssr: true },
    '/t/*/orders/**': { ssr: false },
    '/t/*/profile/**': { ssr: false },
    '/t/*/favourites': { ssr: false },
    '/t/*/notifications': { ssr: false },

    // Auth pages - SPA for better UX (Global)
    '/auth/**': { ssr: false },

    // API routes
    // API routes - Proxy is mainly for development, in production we use direct API_URL
    '/api/**': {
      cors: true,
      headers: { 'Cache-Control': 's-maxage=60' },
    },

    // Static assets
    '/images/**': { headers: { 'Cache-Control': 'max-age=31536000' } },
    '/icons/**': { headers: { 'Cache-Control': 'max-age=31536000' } },
  },

  // PWA configuration removed for MVP

  // Vite configuration for optimization
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Removed additionalData to avoid conflicts with @use in main.scss
          // Each SCSS file should import what it needs
        },
      },
      devSourcemap: false, // Disable CSS sourcemaps in production
    },
    server: {
      allowedHosts: true, // true - разрешает все хосты (удобно, так как localtunnel URL меняется)
      proxy: {
        '/api': {
          target: 'http://localhost:3001', // Возвращаем на localhost для скорости
          changeOrigin: true,
        },
      },
    },
    build: {
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
      include: ['vue', 'pinia', '@telegram-apps/sdk'],
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
