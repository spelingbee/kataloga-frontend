// =============================================================================
// Theme Plugin - FOUC Prevention
// =============================================================================
// Initializes theme system and prevents Flash of Unstyled Content

export default defineNuxtPlugin(() => {
  // FOUC Prevention - Apply theme immediately before hydration
  const THEME_STORAGE_KEY = 'app-theme';
  
  const getSystemTheme = (): 'light' | 'dark' => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };
  
  const applyThemeImmediate = () => {
    try {
      // Get saved theme or default to auto
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'auto';
      
      // Resolve theme
      let resolvedTheme: 'light' | 'dark';
      if (savedTheme === 'auto') {
        resolvedTheme = getSystemTheme();
      } else {
        resolvedTheme = savedTheme as 'light' | 'dark';
      }
      
      // Apply theme immediately
      const root = document.documentElement;
      if (resolvedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
      
      // Add class to indicate theme is loaded
      root.classList.add('theme-loaded');
      
    } catch (error) {
      console.warn('Failed to apply theme:', error);
      // Fallback to light theme
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.add('theme-loaded');
    }
  };
  
  // Apply theme immediately
  applyThemeImmediate();
  
  // Add CSS to prevent FOUC
  const style = document.createElement('style');
  style.textContent = `
    /* FOUC Prevention */
    html:not(.theme-loaded) {
      visibility: hidden;
    }
    
    html.theme-loaded {
      visibility: visible;
    }
    
    /* Smooth theme transitions */
    html {
      transition: background-color 200ms ease-in-out, color 200ms ease-in-out;
    }
    
    /* Respect reduced motion preference */
    @media (prefers-reduced-motion: reduce) {
      html {
        transition: none;
      }
    }
  `;
  
  document.head.appendChild(style);
});