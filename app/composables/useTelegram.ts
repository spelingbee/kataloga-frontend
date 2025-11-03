export interface TelegramUser {
  id: number
  firstName: string
  lastName?: string
  username?: string
  languageCode?: string
  isPremium?: boolean
  photoUrl?: string
}

export interface TelegramTheme {
  bgColor: string
  textColor: string
  hintColor: string
  linkColor: string
  buttonColor: string
  buttonTextColor: string
  secondaryBgColor: string
}

export const useTelegram = () => {
  // Check if running in Telegram environment
  const isTelegram = computed(() => {
    if (import.meta.server) return false
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp
  })

  // Get user data from Telegram
  const user = computed((): TelegramUser | null => {
    if (!isTelegram.value) return null
    
    try {
      const tg = window.Telegram?.WebApp
      if (!tg?.initDataUnsafe?.user) return null

      const tgUser = tg.initDataUnsafe.user
      return {
        id: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        languageCode: tgUser.language_code,
        isPremium: tgUser.is_premium,
        photoUrl: tgUser.photo_url
      }
    } catch {
      return null
    }
  })

  // Get theme parameters
  const theme = computed((): TelegramTheme | null => {
    if (!isTelegram.value) return null
    
    try {
      const tg = window.Telegram?.WebApp
      if (!tg?.themeParams) return null

      const params = tg.themeParams
      return {
        bgColor: params.bg_color || '#ffffff',
        textColor: params.text_color || '#000000',
        hintColor: params.hint_color || '#999999',
        linkColor: params.link_color || '#2481cc',
        buttonColor: params.button_color || '#2481cc',
        buttonTextColor: params.button_text_color || '#ffffff',
        secondaryBgColor: params.secondary_bg_color || '#f1f1f1'
      }
    } catch {
      return null
    }
  })

  // Get viewport information
  const viewportInfo = computed(() => {
    if (!isTelegram.value) return null
    
    try {
      const tg = window.Telegram?.WebApp
      return {
        height: tg?.viewportHeight || window.innerHeight,
        width: window.innerWidth,
        isExpanded: tg?.isExpanded || false,
        stableHeight: tg?.viewportStableHeight || window.innerHeight
      }
    } catch {
      return null
    }
  })

  // Main button controls
  const showMainButton = (text: string, onClick: () => void) => {
    if (!isTelegram.value) return () => {}
    
    try {
      const tg = window.Telegram?.WebApp
      if (!tg?.MainButton) return () => {}

      tg.MainButton.setText(text)
      tg.MainButton.show()
      tg.MainButton.enable()
      tg.MainButton.onClick(onClick)
      
      return () => {
        tg.MainButton.hide()
        tg.MainButton.offClick(onClick)
      }
    } catch {
      return () => {}
    }
  }

  const hideMainButton = () => {
    if (!isTelegram.value) return
    
    try {
      const tg = window.Telegram?.WebApp
      tg?.MainButton?.hide()
    } catch {
      // Ignore errors
    }
  }

  const setMainButtonLoading = (loading: boolean) => {
    if (!isTelegram.value) return
    
    try {
      const tg = window.Telegram?.WebApp
      if (!tg?.MainButton) return

      if (loading) {
        tg.MainButton.showProgress()
        tg.MainButton.disable()
      } else {
        tg.MainButton.hideProgress()
        tg.MainButton.enable()
      }
    } catch {
      // Ignore errors
    }
  }

  // Back button controls
  const showBackButton = (onClick: () => void) => {
    if (!isTelegram.value) return () => {}

    try {
      const tg = window.Telegram?.WebApp
      if (!tg?.BackButton) return () => {}

      tg.BackButton.show()
      tg.BackButton.onClick(onClick)
      
      return () => {
        tg.BackButton.hide()
        tg.BackButton.offClick(onClick)
      }
    } catch {
      return () => {}
    }
  }

  const hideBackButton = () => {
    if (!isTelegram.value) return
    
    try {
      const tg = window.Telegram?.WebApp
      tg?.BackButton?.hide()
    } catch {
      // Ignore errors
    }
  }

  // Haptic feedback
  const impactFeedback = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    if (!isTelegram.value) return
    
    try {
      const tg = window.Telegram?.WebApp
      tg?.HapticFeedback?.impactOccurred(style)
    } catch {
      // Ignore errors
    }
  }

  const notificationFeedback = (type: 'error' | 'success' | 'warning' = 'success') => {
    if (!isTelegram.value) return
    
    try {
      const tg = window.Telegram?.WebApp
      tg?.HapticFeedback?.notificationOccurred(type)
    } catch {
      // Ignore errors
    }
  }

  const selectionFeedback = () => {
    if (!isTelegram.value) return
    
    try {
      const tg = window.Telegram?.WebApp
      tg?.HapticFeedback?.selectionChanged()
    } catch {
      // Ignore errors
    }
  }

  // Cloud storage operations (fallback to localStorage)
  const setCloudStorageItem = async (key: string, value: string): Promise<void> => {
    if (!isTelegram.value) {
      localStorage.setItem(`tg_${key}`, value)
      return
    }
    
    try {
      const tg = window.Telegram?.WebApp
      if (tg?.CloudStorage) {
        await new Promise<void>((resolve, reject) => {
          tg.CloudStorage.setItem(key, value, (error: any) => {
            if (error) reject(error)
            else resolve()
          })
        })
      } else {
        localStorage.setItem(`tg_${key}`, value)
      }
    } catch (error) {
      console.error('Failed to set cloud storage item:', error)
      localStorage.setItem(`tg_${key}`, value)
    }
  }

  const getCloudStorageItem = async (key: string): Promise<string | null> => {
    if (!isTelegram.value) {
      return localStorage.getItem(`tg_${key}`)
    }
    
    try {
      const tg = window.Telegram?.WebApp
      if (tg?.CloudStorage) {
        return await new Promise<string | null>((resolve) => {
          tg.CloudStorage.getItem(key, (error: any, value: string) => {
            if (error) resolve(null)
            else resolve(value || null)
          })
        })
      } else {
        return localStorage.getItem(`tg_${key}`)
      }
    } catch (error) {
      console.error('Failed to get cloud storage item:', error)
      return localStorage.getItem(`tg_${key}`)
    }
  }

  const removeCloudStorageItem = async (key: string): Promise<void> => {
    if (!isTelegram.value) {
      localStorage.removeItem(`tg_${key}`)
      return
    }
    
    try {
      const tg = window.Telegram?.WebApp
      if (tg?.CloudStorage) {
        await new Promise<void>((resolve, reject) => {
          tg.CloudStorage.removeItem(key, (error: any) => {
            if (error) reject(error)
            else resolve()
          })
        })
      } else {
        localStorage.removeItem(`tg_${key}`)
      }
    } catch (error) {
      console.error('Failed to remove cloud storage item:', error)
      localStorage.removeItem(`tg_${key}`)
    }
  }

  const getCloudStorageKeys = async (): Promise<string[]> => {
    if (!isTelegram.value) {
      return Object.keys(localStorage).filter(key => key.startsWith('tg_')).map(key => key.substring(3))
    }
    
    try {
      const tg = window.Telegram?.WebApp
      if (tg?.CloudStorage) {
        return await new Promise<string[]>((resolve) => {
          tg.CloudStorage.getKeys((error: any, keys: string[]) => {
            if (error) resolve([])
            else resolve(keys || [])
          })
        })
      } else {
        return Object.keys(localStorage).filter(key => key.startsWith('tg_')).map(key => key.substring(3))
      }
    } catch (error) {
      console.error('Failed to get cloud storage keys:', error)
      return Object.keys(localStorage).filter(key => key.startsWith('tg_')).map(key => key.substring(3))
    }
  }

  // Popup operations
  const showPopup = async (params: {
    title?: string
    message: string
    buttons?: Array<{ id: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }>
  }): Promise<string | null> => {
    if (!isTelegram.value) {
      // Fallback to browser alert
      alert(params.message)
      return 'ok'
    }
    
    try {
      const tg = window.Telegram?.WebApp
      if (tg?.showPopup) {
        return await new Promise<string | null>((resolve) => {
          tg.showPopup({
            title: params.title,
            message: params.message,
            buttons: params.buttons?.map(btn => ({ type: btn.type || 'default', text: btn.text })) || [{ type: 'ok', text: 'OK' }]
          }, (buttonId: string) => {
            resolve(buttonId)
          })
        })
      } else {
        alert(params.message)
        return 'ok'
      }
    } catch (error) {
      console.error('Failed to show popup:', error)
      alert(params.message)
      return 'ok'
    }
  }

  // QR Scanner
  const scanQRCode = async (text?: string): Promise<string | null> => {
    if (!isTelegram.value) {
      throw new Error('QR Scanner only available in Telegram')
    }
    
    try {
      const tg = window.Telegram?.WebApp
      if (tg?.showScanQrPopup) {
        return await new Promise<string | null>((resolve) => {
          tg.showScanQrPopup({ text: text || 'Scan QR Code' }, (qr: string) => {
            resolve(qr)
          })
        })
      } else {
        throw new Error('QR Scanner not supported')
      }
    } catch (error) {
      console.error('Failed to scan QR code:', error)
      return null
    }
  }

  // Biometric authentication (not available in basic WebApp API)
  const requestBiometricAuth = async (reason?: string): Promise<boolean> => {
    console.warn('Biometric authentication not available in basic Telegram WebApp API')
    return false
  }

  const isBiometricAvailable = computed(() => false)

  // Platform detection
  const platform = computed(() => {
    if (!isTelegram.value) return 'web'
    
    try {
      const tg = window.Telegram?.WebApp
      const platform = tg?.platform
      if (platform?.includes('android')) return 'android'
      if (platform?.includes('ios')) return 'ios'
      return 'telegram'
    } catch {
      return 'telegram'
    }
  })

  // Expand viewport
  const expandViewport = () => {
    if (!isTelegram.value) return
    
    try {
      const tg = window.Telegram?.WebApp
      tg?.expand()
    } catch {
      // Ignore errors
    }
  }

  // Close app
  const closeApp = () => {
    if (isTelegram.value && typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.close()
    }
  }

  // Send data to bot
  const sendDataToBot = (data: string) => {
    if (isTelegram.value && typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.sendData(data)
    }
  }

  return {
    // State
    isTelegram: readonly(isTelegram),
    user: readonly(user),
    theme: readonly(theme),
    viewportInfo: readonly(viewportInfo),
    platform: readonly(platform),
    isBiometricAvailable: readonly(isBiometricAvailable),
    
    // Main button
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    
    // Back button
    showBackButton,
    hideBackButton,
    
    // Haptic feedback
    impactFeedback,
    notificationFeedback,
    selectionFeedback,
    
    // Cloud storage
    setCloudStorageItem,
    getCloudStorageItem,
    removeCloudStorageItem,
    getCloudStorageKeys,
    
    // UI interactions
    showPopup,
    scanQRCode,
    requestBiometricAuth,
    
    // App controls
    expandViewport,
    closeApp,
    sendDataToBot
  }
}

// Type declarations for global Telegram object (fallback)
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void
        close(): void
        sendData(data: string): void
        expand(): void
        platform?: string
        viewportHeight?: number
        viewportStableHeight?: number
        isExpanded?: boolean
        initDataUnsafe?: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            is_premium?: boolean
            photo_url?: string
          }
        }
        themeParams?: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
          secondary_bg_color?: string
        }
        MainButton?: {
          setText(text: string): void
          show(): void
          hide(): void
          enable(): void
          disable(): void
          showProgress(): void
          hideProgress(): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
        }
        BackButton?: {
          show(): void
          hide(): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
        }
        HapticFeedback?: {
          impactOccurred(style: string): void
          notificationOccurred(type: string): void
          selectionChanged(): void
        }
        CloudStorage?: {
          setItem(key: string, value: string, callback: (error: any) => void): void
          getItem(key: string, callback: (error: any, value: string) => void): void
          removeItem(key: string, callback: (error: any) => void): void
          getKeys(callback: (error: any, keys: string[]) => void): void
        }
        showPopup?(params: any, callback: (buttonId: string) => void): void
        showScanQrPopup?(params: any, callback: (qr: string) => void): void
      }
    }
  }
}