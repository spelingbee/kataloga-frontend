// =============================================================================
// Design Token Validation Utility
// =============================================================================
// Validates design tokens meet WCAG AA standards and design requirements

import { getContrastRatio, meetsWCAG_AA } from './color-contrast';

/**
 * Design token color definitions from our new system
 */
export const DESIGN_TOKENS = {
  colors: {
    primary: '#FF6B35',
    primaryLight: '#FF8A5C',
    primaryDark: '#E55A2B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    neutral50: '#F9FAFB',
    neutral100: '#F3F4F6',
    neutral200: '#E5E7EB',
    neutral300: '#D1D5DB',
    neutral400: '#9CA3AF',
    neutral500: '#6B7280',
    neutral600: '#4B5563',
    neutral700: '#374151',
    neutral800: '#1F2937',
    neutral900: '#111827',
    white: '#FFFFFF'
  },
  spacing: {
    space1: '0.25rem',
    space2: '0.5rem',
    space4: '1rem',
    space6: '1.5rem',
    space8: '2rem',
    space12: '3rem'
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  },
  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms'
  },
  typography: {
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  }
};

/**
 * Validate color contrast ratios for WCAG AA compliance
 */
export function validateColorContrast(): {
  valid: boolean;
  violations: Array<{
    combination: string;
    ratio: number;
    required: number;
    passes: boolean;
  }>;
} {
  const { colors } = DESIGN_TOKENS;
  
  // Critical color combinations to test
  const testCombinations = [
    { name: 'Primary text on white', fg: colors.neutral900, bg: colors.white, required: 4.5 },
    { name: 'Secondary text on white', fg: colors.neutral600, bg: colors.white, required: 4.5 },
    { name: 'Tertiary text on white', fg: colors.neutral400, bg: colors.white, required: 4.5 },
    { name: 'Primary button text', fg: colors.white, bg: colors.primary, required: 4.5 },
    { name: 'Success button text', fg: colors.white, bg: colors.success, required: 4.5 },
    { name: 'Warning button text', fg: colors.white, bg: colors.warning, required: 4.5 },
    { name: 'Error button text', fg: colors.white, bg: colors.error, required: 4.5 },
    { name: 'Info button text', fg: colors.white, bg: colors.info, required: 4.5 },
    { name: 'White text on dark bg', fg: colors.white, bg: colors.neutral900, required: 4.5 }
  ];
  
  const violations = testCombinations.map(test => {
    const ratio = getContrastRatio(test.fg, test.bg);
    const passes = ratio >= test.required;
    
    return {
      combination: test.name,
      ratio: Math.round(ratio * 100) / 100,
      required: test.required,
      passes
    };
  });
  
  const valid = violations.every(v => v.passes);
  
  return { valid, violations };
}

/**
 * Validate spacing token consistency
 */
export function validateSpacingTokens(): {
  valid: boolean;
  issues: string[];
} {
  const { spacing } = DESIGN_TOKENS;
  const issues: string[] = [];
  
  // Convert rem values to pixels for validation
  const spacingInPx = {
    space1: parseFloat(spacing.space1) * 16, // 4px
    space2: parseFloat(spacing.space2) * 16, // 8px
    space4: parseFloat(spacing.space4) * 16, // 16px
    space6: parseFloat(spacing.space6) * 16, // 24px
    space8: parseFloat(spacing.space8) * 16, // 32px
    space12: parseFloat(spacing.space12) * 16 // 48px
  };
  
  // Validate expected values
  const expectedValues = {
    space1: 4,
    space2: 8,
    space4: 16,
    space6: 24,
    space8: 32,
    space12: 48
  };
  
  Object.entries(expectedValues).forEach(([key, expected]) => {
    const actual = spacingInPx[key as keyof typeof spacingInPx];
    if (actual !== expected) {
      issues.push(`Spacing token ${key} should be ${expected}px but is ${actual}px`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Validate shadow token definitions
 */
export function validateShadowTokens(): {
  valid: boolean;
  issues: string[];
} {
  const { shadows } = DESIGN_TOKENS;
  const issues: string[] = [];
  
  // Expected shadow definitions
  const expectedShadows = {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
  };
  
  Object.entries(expectedShadows).forEach(([key, expected]) => {
    const actual = shadows[key as keyof typeof shadows];
    if (actual !== expected) {
      issues.push(`Shadow token ${key} should be "${expected}" but is "${actual}"`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Validate radius token definitions
 */
export function validateRadiusTokens(): {
  valid: boolean;
  issues: string[];
} {
  const { radius } = DESIGN_TOKENS;
  const issues: string[] = [];
  
  // Expected radius definitions
  const expectedRadius = {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  };
  
  Object.entries(expectedRadius).forEach(([key, expected]) => {
    const actual = radius[key as keyof typeof radius];
    if (actual !== expected) {
      issues.push(`Radius token ${key} should be "${expected}" but is "${actual}"`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Validate transition token definitions
 */
export function validateTransitionTokens(): {
  valid: boolean;
  issues: string[];
} {
  const { transitions } = DESIGN_TOKENS;
  const issues: string[] = [];
  
  // Expected transition definitions
  const expectedTransitions = {
    fast: '150ms',
    base: '200ms',
    slow: '300ms'
  };
  
  Object.entries(expectedTransitions).forEach(([key, expected]) => {
    const actual = transitions[key as keyof typeof transitions];
    if (actual !== expected) {
      issues.push(`Transition token ${key} should be "${expected}" but is "${actual}"`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Validate font size token definitions
 */
export function validateFontSizeTokens(): {
  valid: boolean;
  issues: string[];
} {
  const { typography } = DESIGN_TOKENS;
  const issues: string[] = [];
  
  // Convert rem values to pixels for validation
  const fontSizesInPx = Object.entries(typography.fontSizes).reduce((acc, [key, value]) => {
    acc[key] = parseFloat(value) * 16;
    return acc;
  }, {} as Record<string, number>);
  
  // Expected font sizes in pixels
  const expectedSizes = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36
  };
  
  Object.entries(expectedSizes).forEach(([key, expected]) => {
    const actual = fontSizesInPx[key];
    if (actual !== expected) {
      issues.push(`Font size token ${key} should be ${expected}px but is ${actual}px`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Run all design token validations
 */
export function validateAllDesignTokens(): {
  valid: boolean;
  results: {
    colorContrast: ReturnType<typeof validateColorContrast>;
    spacing: ReturnType<typeof validateSpacingTokens>;
    shadows: ReturnType<typeof validateShadowTokens>;
    radius: ReturnType<typeof validateRadiusTokens>;
    transitions: ReturnType<typeof validateTransitionTokens>;
    fontSizes: ReturnType<typeof validateFontSizeTokens>;
  };
} {
  const results = {
    colorContrast: validateColorContrast(),
    spacing: validateSpacingTokens(),
    shadows: validateShadowTokens(),
    radius: validateRadiusTokens(),
    transitions: validateTransitionTokens(),
    fontSizes: validateFontSizeTokens()
  };
  
  const valid = Object.values(results).every(result => result.valid);
  
  return { valid, results };
}

/**
 * Log validation results to console
 */
export function logDesignTokenValidation(): void {
  const validation = validateAllDesignTokens();
  
  console.group('🎨 Design Token Validation Results');
  
  if (validation.valid) {
    console.log('✅ All design tokens are valid and meet requirements!');
  } else {
    console.warn('⚠️ Some design tokens have issues:');
  }
  
  // Color contrast results
  console.group('Color Contrast (WCAG AA)');
  validation.results.colorContrast.violations.forEach(violation => {
    const icon = violation.passes ? '✅' : '❌';
    console.log(`${icon} ${violation.combination}: ${violation.ratio}:1 (required: ${violation.required}:1)`);
  });
  console.groupEnd();
  
  // Other validation results
  const otherResults = [
    { name: 'Spacing Tokens', result: validation.results.spacing },
    { name: 'Shadow Tokens', result: validation.results.shadows },
    { name: 'Radius Tokens', result: validation.results.radius },
    { name: 'Transition Tokens', result: validation.results.transitions },
    { name: 'Font Size Tokens', result: validation.results.fontSizes }
  ];
  
  otherResults.forEach(({ name, result }) => {
    if (result.valid) {
      console.log(`✅ ${name}: Valid`);
    } else {
      console.group(`❌ ${name}: Issues found`);
      result.issues.forEach(issue => console.log(`  • ${issue}`));
      console.groupEnd();
    }
  });
  
  console.groupEnd();
}
