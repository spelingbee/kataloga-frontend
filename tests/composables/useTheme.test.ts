import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTheme } from '~/composables/useTheme'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock window.matchMedia
const mockMatchMedia = vi.fn()

// Mock document
const mockDocument = {
  documentElement: {
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  }
}

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup global mocks
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    
    Object.defineProperty(global, 'window', {
      value: {
        matchMedia: mockMatchMedia
      },
      writable: true
    })
    
    Object.defineProperty(global, 'document', {
      value: mockDocument,
      writable: true
    })
    
    // Mock process.client
    Object.defineProperty(global, 'process', {
      value: { client: true },
      writable: true
    })
    
    // Default matchMedia mock
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })
  })

  describe('Theme Detection', () => {
    it('should detect light theme as default', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })

      const { resolvedTheme } = useTheme()
      
      expect(resolvedTheme.value).toBe('light')
    })

    it('should detect dark theme from system preference', () => {
      mockLocalStorage.getItem.mockReturnValue('auto')
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })

      const { resolvedTheme } = useTheme()
      
      expect(resolvedTheme.value).toBe('dark')
    })
  })

  describe('Theme Persistence', () => {
    it('should save theme to localStorage when set', () => {
      const { setTheme } = useTheme()
      
      setTheme('dark')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'dark')
    })

    it('should load saved theme from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { currentTheme } = useTheme()
      
      expect(currentTheme.value).toBe('dark')
    })
  })

  describe('Theme Switching', () => {
    it('should toggle from light to dark', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      const { toggleTheme, currentTheme } = useTheme()
      
      toggleTheme()
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'dark')
    })

    it('should toggle from dark to light', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { toggleTheme } = useTheme()
      
      toggleTheme()
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'light')
    })

    it('should handle auto theme toggle correctly', () => {
      mockLocalStorage.getItem.mockReturnValue('auto')
      mockMatchMedia.mockReturnValue({
        matches: false, // System is light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
      
      const { toggleTheme } = useTheme()
      
      toggleTheme()
      
      // Should switch to dark since system is light
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app-theme', 'dark')
    })
  })

  describe('DOM Manipulation', () => {
    it('should set data-theme attribute for dark theme', () => {
      const { setTheme } = useTheme()
      
      setTheme('dark')
      
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('should remove data-theme attribute for light theme', () => {
      const { setTheme } = useTheme()
      
      setTheme('light')
      
      expect(mockDocument.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme')
    })
  })

  describe('Computed Properties', () => {
    it('should correctly compute isDark', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { isDark } = useTheme()
      
      expect(isDark.value).toBe(true)
    })

    it('should correctly compute isLight', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      const { isLight } = useTheme()
      
      expect(isLight.value).toBe(true)
    })

    it('should correctly compute isAuto', () => {
      mockLocalStorage.getItem.mockReturnValue('auto')
      
      const { isAuto } = useTheme()
      
      expect(isAuto.value).toBe(true)
    })
  })
})