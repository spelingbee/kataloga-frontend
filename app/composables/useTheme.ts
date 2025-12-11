// =============================================================================
// Theme Management Composable
// =============================================================================
// Handles theme switching, persistence, and FOUC prevention

export type Theme = 'light' | 'dark' | 'auto';

export const useTheme = () => {
  // Reactive theme state
  const currentTheme = ref<Theme>('auto');
  const resolvedTheme = ref<'light' | 'dark'>('light');
  
  // Storage key for theme persistence
  const THEME_STORAGE_KEY = 'app-theme';
  
  /**
   * Get system theme preference
   */
  const getSystemTheme = (): 'light' | 'dark' => {
    if (process.client && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };
  
  /**
   * Apply theme to document
   */
  const applyTheme = (theme: 'light' | 'dark') => {
    if (process.client) {
      const root = document.documentElement;
      
      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
      
      resolvedTheme.value = theme;
    }
  };
  
  /**
   * Resolve theme based on current setting
   */
  const resolveTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'auto') {
      return getSystemTheme();
    }
    return theme;
  };
  
  /**
   * Set theme and persist to localStorage
   */
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    
    if (process.client) {
      // Persist to localStorage
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      
      // Apply resolved theme
      const resolved = resolveTheme(theme);
      applyTheme(resolved);
    }
  };
  
  /**
   * Initialize theme from localStorage or system preference
   */
  const initializeTheme = () => {
    if (process.client) {
      // Get saved theme or default to auto
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme || 'auto';
      currentTheme.value = savedTheme;
      
      // Apply resolved theme immediately to prevent FOUC
      const resolved = resolveTheme(savedTheme);
      applyTheme(resolved);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        if (currentTheme.value === 'auto') {
          const newResolved = getSystemTheme();
          applyTheme(newResolved);
        }
      };
      
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // Cleanup listener on unmount
      onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      });
    }
  };
  
  /**
   * Toggle between light and dark themes
   * If current theme is auto, switch to opposite of resolved theme
   */
  const toggleTheme = () => {
    if (currentTheme.value === 'auto') {
      // If auto, switch to opposite of current resolved theme
      const newTheme = resolvedTheme.value === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
    } else {
      // If explicit theme, toggle between light and dark
      const newTheme = currentTheme.value === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
    }
  };
  
  /**
   * Check if current theme is dark
   */
  const isDark = computed(() => resolvedTheme.value === 'dark');
  
  /**
   * Check if current theme is light
   */
  const isLight = computed(() => resolvedTheme.value === 'light');
  
  /**
   * Check if theme is set to auto
   */
  const isAuto = computed(() => currentTheme.value === 'auto');
  
  // Initialize theme on composable creation
  if (process.client) {
    nextTick(() => {
      initializeTheme();
    });
  }
  
  return {
    currentTheme: readonly(currentTheme),
    resolvedTheme: readonly(resolvedTheme),
    isDark,
    isLight,
    isAuto,
    setTheme,
    toggleTheme,
    initializeTheme
  };
};