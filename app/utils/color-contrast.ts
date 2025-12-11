/**
 * Color contrast utilities for WCAG 2.1 compliance
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format')
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * Normal text: 4.5:1
 * Large text: 3:1
 */
export function meetsWCAG_AA(
  color1: string,
  color2: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 * Normal text: 7:1
 * Large text: 4.5:1
 */
export function meetsWCAG_AAA(
  color1: string,
  color2: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2)
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

/**
 * Get contrast level description
 */
export function getContrastLevel(color1: string, color2: string): string {
  const ratio = getContrastRatio(color1, color2)

  if (ratio >= 7) return 'AAA (Enhanced)'
  if (ratio >= 4.5) return 'AA (Minimum)'
  if (ratio >= 3) return 'AA Large Text'
  return 'Fail'
}

/**
 * Suggest accessible text color (black or white) for a background
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF')
  const blackContrast = getContrastRatio(backgroundColor, '#000000')

  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000'
}

/**
 * Validate color palette for accessibility
 */
export interface ColorPaletteValidation {
  isValid: boolean
  issues: string[]
  warnings: string[]
}

export function validateColorPalette(
  textColor: string,
  backgroundColor: string,
  primaryColor: string
): ColorPaletteValidation {
  const issues: string[] = []
  const warnings: string[] = []

  // Check text on background
  const textBgRatio = getContrastRatio(textColor, backgroundColor)
  if (textBgRatio < 4.5) {
    issues.push(
      `Text color (${textColor}) on background (${backgroundColor}) has insufficient contrast: ${textBgRatio.toFixed(2)}:1 (minimum 4.5:1)`
    )
  } else if (textBgRatio < 7) {
    warnings.push(
      `Text color (${textColor}) on background (${backgroundColor}) meets AA but not AAA: ${textBgRatio.toFixed(2)}:1`
    )
  }

  // Check primary color on background
  const primaryBgRatio = getContrastRatio(primaryColor, backgroundColor)
  if (primaryBgRatio < 3) {
    issues.push(
      `Primary color (${primaryColor}) on background (${backgroundColor}) has insufficient contrast: ${primaryBgRatio.toFixed(2)}:1 (minimum 3:1)`
    )
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  }
}
