import { computed } from 'vue'
import { useTenantStore } from '~/stores/tenant'

/**
 * Price Formatter Composable
 * 
 * Handles currency formatting based on tenant configuration and locale.
 * Ensures the correct symbol position (prefix vs suffix) relative to the locale,
 * not enforced by hardcoded logic.
 */
export function usePriceFormatter() {
    const tenantStore = useTenantStore()

    // Mapping of currency codes to preferred locales for "native-like" formatting
    // If a tenant uses 'USD', we prefer 'en-US' formatting ($100).
    // If 'KGS', we prefer 'ru-KG' formatting (100 c).
    // If 'EUR', we prefer 'de-DE' (100 €) or 'en-IE' (€100) depending on preference, sticking to 'de-DE' for suffix commonality in this region.
    const currencyLocales: Record<string, string> = {
        'USD': 'en-US',
        'EUR': 'de-DE',
        'KGS': 'ru-KG',
        'RUB': 'ru-RU',
        'KZT': 'ru-KZ'
    }

    const currency = computed(() => {
        return tenantStore.tenantSettings.currency || 'KGS'
    })

    const locale = computed(() => {
        const currencyCode = currency.value
        // Use mapped locale if available, otherwise fallback to tenant language or default 'ru-KG'
        return currencyLocales[currencyCode] || tenantStore.tenantSettings.language || 'ru-KG'
    })

    /**
     * Format a price value
     * @param value Number to format
     * @param options Intl.NumberFormatOptions
     */
    const formatPrice = (value: number, options?: Intl.NumberFormatOptions): string => {
        if (value === null || value === undefined || isNaN(value)) {
            return ''
        }

        const defaultOptions: Intl.NumberFormatOptions = {
            style: 'currency',
            currency: currency.value,
            minimumFractionDigits: 0,
            // Show decimals only if non-integer
            maximumFractionDigits: value % 1 === 0 ? 0 : 2,
            ...options
        }

        try {
            // Force specific formatting for KGS to ensure 'сом' is used if strict locale isn't enough,
            // or just rely on proper locale. But user asked for 'сом'.
            // 'ru-KG' usually gives 'с' or 'сом'.
            if (currency.value === 'KGS') {
                return new Intl.NumberFormat('ru-KG', {
                    style: 'currency',
                    currency: 'KGS',
                    currencyDisplay: 'symbol',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: value % 1 === 0 ? 0 : 2
                }).format(value).replace('c', 'сом').replace('KGS', 'сом');
                // Note: 'c' (cyrillic s) is standard for KGS, but user requested 'сом'.
            }

            return new Intl.NumberFormat(locale.value, defaultOptions).format(value)
        } catch (e) {
            console.warn('Price formatting failed, fallback to basics', e)
            return `${value} ${currency.value === 'KGS' ? 'сом' : currency.value}`
        }
    }

    return {
        formatPrice,
        currency,
        locale
    }
}
