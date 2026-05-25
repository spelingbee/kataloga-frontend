/**
 * Форматирование валюты для Кыргызстана.
 * Основная валюта — Кыргызский сом (KGS). Обязательна по требованиям FreedomPay KR.
 */
export type CurrencyCode = 'KGS' | 'USD' | 'EUR' | 'KZT' | 'RUB'

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  KGS: 'сом',
  USD: '$',
  EUR: '€',
  KZT: '₸',
  RUB: '₽',
}

/**
 * Форматирует сумму в указанной валюте.
 * Пример: formatPrice(1200, 'KGS') → '1 200 сом'
 */
export function formatPrice(amount: number, currency: CurrencyCode = 'KGS'): string {
  const formatted = new Intl.NumberFormat('ru-KG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  const symbol = CURRENCY_SYMBOLS[currency]
  // KGS: число потом символ (1 200 сом). Остальные: символ перед ($ 14)
  if (currency === 'KGS') return `${formatted} ${symbol}`
  return `${symbol}${formatted}`
}

/**
 * Форматирует в двух валютах: основная KGS + дополнительная.
 * Пример: formatPriceDual(1200, 'USD', 86) → '1 200 сом (~$14)'
 */
export function formatPriceDual(
  amountKGS: number,
  secondCurrency?: CurrencyCode,
  exchangeRate?: number
): string {
  const main = formatPrice(amountKGS, 'KGS')
  if (!secondCurrency || !exchangeRate || exchangeRate <= 0) return main
  const secondAmount = amountKGS / exchangeRate
  const secondary = formatPrice(secondAmount, secondCurrency)
  return `${main} (~${secondary})`
}
