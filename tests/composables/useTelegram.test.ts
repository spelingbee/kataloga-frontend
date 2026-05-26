import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTelegram } from '~/composables/useTelegram'

describe('useTelegram', () => {
  beforeEach(() => {
    // Reset window.Telegram before each test
    delete (window as any).Telegram
  })

  describe('Platform Detection', () => {
    it('should detect when not in Telegram environment', () => {
      const { isTelegram } = useTelegram()
      expect(isTelegram.value).toBe(false)
    })

    it('should detect when in Telegram environment', () => {
      // Mock Telegram WebApp
      ;(window as any).Telegram = {
        WebApp: {
          ready: vi.fn(),
          initData: 'test-init-data',
          initDataUnsafe: {},
          themeParams: {}
        }
      }

      const { isTelegram } = useTelegram()
      expect(isTelegram.value).toBe(true)
    })
  })

  describe('User Data', () => {
    it('should return null when not in Telegram', () => {
      const { user } = useTelegram()
      expect(user.value).toBeNull()
    })

    it('should return user data when in Telegram', () => {
      const mockUser = {
        id: 123456,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        language_code: 'en'
      }

      ;(window as any).Telegram = {
        WebApp: {
          ready: vi.fn(),
          initData: 'test-init-data',
          initDataUnsafe: { user: mockUser },
          themeParams: {}
        }
      }

      const { user } = useTelegram()
      expect(user.value).toEqual({
        id: 123456,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        languageCode: 'en',
        isPremium: undefined,
        photoUrl: undefined
      })
    })
  })

  describe('Theme Parameters', () => {
    it('should return null when not in Telegram', () => {
      const { theme } = useTelegram()
      expect(theme.value).toBeNull()
    })

    it('should return theme parameters when in Telegram', () => {
      const mockTheme = {
        bg_color: '#ffffff',
        text_color: '#000000',
        hint_color: '#999999',
        link_color: '#2481cc',
        button_color: '#2481cc',
        button_text_color: '#ffffff',
        secondary_bg_color: '#f1f1f1'
      }

      ;(window as any).Telegram = {
        WebApp: {
          ready: vi.fn(),
          initData: 'test-init-data',
          initDataUnsafe: {},
          themeParams: mockTheme
        }
      }

      const { theme } = useTelegram()
      expect(theme.value).toEqual({
        bgColor: '#ffffff',
        textColor: '#000000',
        hintColor: '#999999',
        linkColor: '#2481cc',
        buttonColor: '#2481cc',
        buttonTextColor: '#ffffff',
        secondaryBgColor: '#f1f1f1'
      })
    })
  })

  describe('Main Button', () => {
    it('should not show main button when not in Telegram', () => {
      const { showMainButton } = useTelegram()
      const cleanup = showMainButton('Test', () => {})
      
      expect(typeof cleanup).toBe('function')
      cleanup()
    })

    it('should show main button when in Telegram', () => {
      const mockMainButton = {
        setText: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        showProgress: vi.fn(),
        hideProgress: vi.fn(),
        onClick: vi.fn(),
        offClick: vi.fn()
      }

      ;(window as any).Telegram = {
        WebApp: {
          ready: vi.fn(),
          initData: 'test-init-data',
          initDataUnsafe: {},
          themeParams: {},
          MainButton: mockMainButton
        }
      }

      const { showMainButton } = useTelegram()
      const onClick = vi.fn()
      const cleanup = showMainButton('Test Button', onClick)

      expect(mockMainButton.setText).toHaveBeenCalledWith('Test Button')
      expect(mockMainButton.show).toHaveBeenCalled()
      expect(mockMainButton.enable).toHaveBeenCalled()
      expect(mockMainButton.onClick).toHaveBeenCalledWith(onClick)

      cleanup()
      expect(mockMainButton.hide).toHaveBeenCalled()
      expect(mockMainButton.offClick).toHaveBeenCalledWith(onClick)
    })
  })

  describe('Haptic Feedback', () => {
    it('should not crash when not in Telegram', () => {
      const { impactFeedback, notificationFeedback, selectionFeedback } = useTelegram()
      
      expect(() => {
        impactFeedback('medium')
        notificationFeedback('success')
        selectionFeedback()
      }).not.toThrow()
    })

    it('should call haptic feedback when in Telegram', () => {
      const mockHaptic = {
        impactOccurred: vi.fn(),
        notificationOccurred: vi.fn(),
        selectionChanged: vi.fn()
      }

      ;(window as any).Telegram = {
        WebApp: {
          ready: vi.fn(),
          initData: 'test-init-data',
          initDataUnsafe: {},
          themeParams: {},
          HapticFeedback: mockHaptic
        }
      }

      const { impactFeedback, notificationFeedback, selectionFeedback } = useTelegram()
      
      impactFeedback('medium')
      expect(mockHaptic.impactOccurred).toHaveBeenCalledWith('medium')

      notificationFeedback('success')
      expect(mockHaptic.notificationOccurred).toHaveBeenCalledWith('success')

      selectionFeedback()
      expect(mockHaptic.selectionChanged).toHaveBeenCalled()
    })
  })

  describe('Contact Request', () => {
    it('should throw error when not in Telegram', async () => {
      const { requestContact } = useTelegram()
      
      await expect(requestContact()).rejects.toThrow('Contact request only available in Telegram')
    })

    it('should request contact when in Telegram', async () => {
      const mockContact = {
        phone_number: '+1234567890',
        first_name: 'John',
        last_name: 'Doe'
      }

      const mockRequestContact = vi.fn((callback) => {
        callback(true, mockContact)
      })

      ;(window as any).Telegram = {
        WebApp: {
          ready: vi.fn(),
          initData: 'test-init-data',
          initDataUnsafe: {},
          themeParams: {},
          requestContact: mockRequestContact
        }
      }

      const { requestContact } = useTelegram()
      const result = await requestContact()

      expect(result).toEqual({
        phone: '+1234567890',
        firstName: 'John',
        lastName: 'Doe'
      })
    })
  })

  describe('Init Data', () => {
    it('should return null when not in Telegram', () => {
      const { getInitData } = useTelegram()
      expect(getInitData()).toBeNull()
    })

    it('should return init data when in Telegram', () => {
      const mockInitData = 'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A123456%7D'

      ;(window as any).Telegram = {
        WebApp: {
          ready: vi.fn(),
          initData: mockInitData,
          initDataUnsafe: {},
          themeParams: {}
        }
      }

      const { getInitData } = useTelegram()
      expect(getInitData()).toBe(mockInitData)
    })
  })
})
