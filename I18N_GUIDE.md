# Internationalization (i18n) Guide

This guide explains how to use internationalization features in the customer frontend application.

## Overview

The application supports three languages:
- **English (en)** - Default language
- **Russian (ru)** - Русский
- **Kyrgyz (ky)** - Кыргызча

## Setup

The i18n system is configured using `@nuxtjs/i18n` module with the following features:
- Automatic locale detection from browser and Telegram
- Persistent locale preference in localStorage and cookies
- Date/time localization
- Currency formatting
- Number formatting
- Phone number formatting

## Using Translations in Components

### Basic Usage

```vue
<template>
  <div>
    <h1>{{ $t('menu.title') }}</h1>
    <p>{{ $t('menu.searchPlaceholder') }}</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

// Use in script
const title = t('menu.title')
</script>
```

### With Parameters

```vue
<template>
  <p>{{ $t('cart.minimumOrder', { amount: formatCurrency(500) }) }}</p>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { formatCurrency } = useI18nUtils()
</script>
```

## Language Switcher Component

The `LanguageSwitcher` component is available globally and can be used anywhere:

```vue
<template>
  <LanguageSwitcher />
</template>
```

It's already included in the `AppHeader` component.

## Formatting Utilities

### Currency Formatting

```typescript
import { useI18nUtils } from '~/composables/useI18nUtils'

const { formatCurrency } = useI18nUtils()

// Format: 1,234.56 som
const price = formatCurrency(1234.56)
```

### Date Formatting

```typescript
const { formatDateShort, formatDateLong, formatTime, formatRelativeTime } = useI18nUtils()

// Short format: 12/25/2023
const shortDate = formatDateShort(new Date())

// Long format: Monday, December 25, 2023, 10:30 AM
const longDate = formatDateLong(new Date())

// Time only: 10:30 AM
const time = formatTime(new Date())

// Relative time: "2 hours ago", "Yesterday", etc.
const relative = formatRelativeTime(new Date())
```

### Number Formatting

```typescript
const { formatNumber, formatPercent } = useI18nUtils()

// Format: 1,234.57
const number = formatNumber(1234.5678)

// Format: 50%
const percent = formatPercent(50)
```

### Phone Number Formatting

```typescript
const { formatPhoneNumber, getPhoneFormat } = useI18nUtils()

// Format: +996 555 123 456
const phone = formatPhoneNumber('996555123456')

// Get format template: +996 XXX XXX XXX
const format = getPhoneFormat()
```

## Adding New Translations

### 1. Add to Locale Files

Add your translation keys to all locale files:

**`app/locales/en.json`:**
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}
```

**`app/locales/ru.json`:**
```json
{
  "myFeature": {
    "title": "Моя функция",
    "description": "Это моя функция"
  }
}
```

**`app/locales/ky.json`:**
```json
{
  "myFeature": {
    "title": "Менин функциям",
    "description": "Бул менин функциям"
  }
}
```

### 2. Use in Components

```vue
<template>
  <div>
    <h2>{{ $t('myFeature.title') }}</h2>
    <p>{{ $t('myFeature.description') }}</p>
  </div>
</template>
```

## Telegram Integration

The i18n system automatically detects the user's language from Telegram:

```typescript
// In plugins/i18n.client.ts
if (window.Telegram?.WebApp) {
  const tgLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code
  // Automatically sets locale based on Telegram language
}
```

## Locale Persistence

The selected locale is automatically saved to:
1. **localStorage** - `user-locale` key
2. **Cookie** - `i18n_redirected` cookie

This ensures the user's language preference persists across sessions.

## Programmatic Locale Change

```typescript
const { locale } = useI18n()

// Change locale
locale.value = 'ru'

// Get current locale
const currentLocale = locale.value // 'en', 'ru', or 'ky'
```

## Date/Time Formats

The application uses locale-specific date/time formats:

```typescript
// English: 12/25/2023
// Russian: 25.12.2023
// Kyrgyz: 25.12.2023

const { d } = useI18n()

// Short format
d(new Date(), 'short')

// Long format
d(new Date(), 'long')

// Time only
d(new Date(), 'time')
```

## Number Formats

```typescript
const { n } = useI18n()

// Currency: 1,234.56 som
n(1234.56, 'currency')

// Decimal: 1,234.57
n(1234.5678, 'decimal')

// Percent: 50%
n(0.5, 'percent')
```

## Best Practices

### 1. Always Use Translation Keys

❌ **Don't:**
```vue
<button>Add to Cart</button>
```

✅ **Do:**
```vue
<button>{{ $t('menu.addToCart') }}</button>
```

### 2. Use Semantic Keys

❌ **Don't:**
```json
{
  "button1": "Submit",
  "text2": "Cancel"
}
```

✅ **Do:**
```json
{
  "common": {
    "submit": "Submit",
    "cancel": "Cancel"
  }
}
```

### 3. Group Related Translations

```json
{
  "cart": {
    "title": "Cart",
    "empty": "Your cart is empty",
    "checkout": "Checkout"
  },
  "menu": {
    "title": "Menu",
    "search": "Search",
    "filters": "Filters"
  }
}
```

### 4. Use Parameters for Dynamic Content

```vue
<template>
  <p>{{ $t('orders.orderNumber', { number: order.id }) }}</p>
</template>
```

### 5. Handle Pluralization

For features requiring pluralization, use the i18n pluralization syntax:

```json
{
  "cart": {
    "items": "no items | {count} item | {count} items"
  }
}
```

```vue
<template>
  <p>{{ $tc('cart.items', cartCount, { count: cartCount }) }}</p>
</template>
```

## Testing Translations

### Manual Testing

1. Open the application
2. Click the language switcher in the header
3. Select a different language
4. Verify all text changes to the selected language

### Automated Testing

```typescript
import { useI18n } from 'vue-i18n'

describe('i18n', () => {
  it('should translate correctly', () => {
    const { t } = useI18n()
    expect(t('common.loading')).toBe('Loading...')
  })
})
```

## Troubleshooting

### Translation Not Showing

1. Check if the key exists in all locale files
2. Verify the key path is correct
3. Check browser console for i18n warnings

### Locale Not Persisting

1. Check if cookies are enabled
2. Verify localStorage is accessible
3. Check browser privacy settings

### Date/Time Format Issues

1. Verify the locale code is correct ('en', 'ru', 'ky')
2. Check if the date format is defined in `i18n.config.ts`
3. Ensure the date is a valid Date object

## Configuration Files

- **`app/i18n.config.ts`** - i18n configuration (formats, locales)
- **`app/locales/*.json`** - Translation files
- **`nuxt.config.ts`** - Module configuration
- **`app/plugins/i18n.client.ts`** - Client-side initialization
- **`app/composables/useI18nUtils.ts`** - Utility functions

## Resources

- [Vue I18n Documentation](https://vue-i18n.intlify.dev/)
- [Nuxt I18n Module](https://i18n.nuxtjs.org/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
