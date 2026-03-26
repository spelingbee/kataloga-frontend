/**
 * Complete type definitions for Telegram Mini Apps API
 * Based on official Telegram WebApp documentation
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

/**
 * Main Telegram WebApp interface
 * Provides access to all Telegram Mini Apps features
 */
export interface TelegramWebApp {
  // Initialization and lifecycle
  /** Raw initialization data string */
  initData: string
  /** Parsed initialization data object */
  initDataUnsafe: TelegramWebAppInitData
  /** Version of the Bot API available in the user's Telegram app */
  version: string
  /** Platform identifier (android, ios, macos, tdesktop, etc.) */
  platform: string
  /** Current color scheme (light or dark) */
  colorScheme: 'light' | 'dark'
  /** True if the Mini App is expanded to the maximum available height */
  isExpanded: boolean
  /** Current height of the visible area of the Mini App */
  viewportHeight: number
  /** Height of the visible area that remains stable when the virtual keyboard is shown */
  viewportStableHeight: number
  /** Current header color */
  headerColor: string
  /** Current background color */
  backgroundColor: string
  /** True if the confirmation dialog is enabled */
  isClosingConfirmationEnabled: boolean
  
  // Theme parameters
  /** Object containing theme parameters */
  themeParams: TelegramThemeParams
  
  // Buttons
  /** Back button object */
  BackButton: TelegramBackButton
  /** Main button object */
  MainButton: TelegramMainButton
  /** Settings button object */
  SettingsButton: TelegramSettingsButton
  
  // Haptic feedback
  /** Haptic feedback object */
  HapticFeedback: TelegramHapticFeedback
  
  // Cloud storage
  /** Cloud storage object */
  CloudStorage: TelegramCloudStorage
  
  // Methods
  /** Informs the Telegram app that the Mini App is ready to be displayed */
  ready(): void
  /** Expands the Mini App to the maximum available height */
  expand(): void
  /** Closes the Mini App */
  close(): void
  /** Enables the confirmation dialog when closing the Mini App */
  enableClosingConfirmation(): void
  /** Disables the confirmation dialog when closing the Mini App */
  disableClosingConfirmation(): void
  /** Sets the header color */
  setHeaderColor(color: string): void
  /** Sets the background color */
  setBackgroundColor(color: string): void
  /** Subscribes to an event */
  onEvent(eventType: TelegramEventType, callback: () => void): void
  /** Unsubscribes from an event */
  offEvent(eventType: TelegramEventType, callback: () => void): void
  /** Sends data to the bot */
  sendData(data: string): void
  /** Opens a link in an external browser */
  openLink(url: string, options?: { try_instant_view?: boolean }): void
  /** Opens a Telegram link inside the Telegram app */
  openTelegramLink(url: string): void
  /** Opens an invoice */
  openInvoice(url: string, callback?: (status: InvoiceStatus) => void): void
  /** Shows a popup */
  showPopup(params: TelegramPopupParams, callback?: (buttonId: string) => void): void
  /** Shows an alert */
  showAlert(message: string, callback?: () => void): void
  /** Shows a confirmation dialog */
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  /** Shows a QR code scanner popup */
  showScanQrPopup(params: { text?: string }, callback?: (text: string) => boolean): void
  /** Closes the QR code scanner popup */
  closeScanQrPopup(): void
  /** Reads text from the clipboard */
  readTextFromClipboard(callback?: (text: string) => void): void
  /** Requests write access permission */
  requestWriteAccess(callback?: (granted: boolean) => void): void
  /** Requests contact information */
  requestContact(callback?: (granted: boolean) => void): void
  /** Switches to inline mode with the specified query */
  switchInlineQuery(query: string, choose_chat_types?: string[]): void
  /** Requests fullscreen mode */
  requestFullscreen(): void
  /** Exits fullscreen mode */
  exitFullscreen(): void
}

/**
 * Initialization data passed to the Mini App
 */
export interface TelegramWebAppInitData {
  /** Unique query identifier */
  query_id?: string
  /** User who opened the Mini App */
  user?: TelegramUser
  /** User who was mentioned in the inline query */
  receiver?: TelegramUser
  /** Chat where the Mini App was opened */
  chat?: TelegramChat
  /** Type of chat (sender, private, group, supergroup, channel) */
  chat_type?: string
  /** Global identifier for the chat instance */
  chat_instance?: string
  /** Start parameter passed to the Mini App */
  start_param?: string
  /** Time after which a message can be sent via answerWebAppQuery */
  can_send_after?: number
  /** Unix timestamp when the form was opened */
  auth_date: number
  /** Hash for data validation */
  hash: string
}

/**
 * Telegram user object
 */
export interface TelegramUser {
  /** Unique identifier for the user */
  id: number
  /** True if the user is a bot */
  is_bot?: boolean
  /** User's first name */
  first_name: string
  /** User's last name */
  last_name?: string
  /** User's username */
  username?: string
  /** IETF language tag of the user's language */
  language_code?: string
  /** True if the user is a Telegram Premium user */
  is_premium?: boolean
  /** URL of the user's profile photo */
  photo_url?: string
}

/**
 * Telegram chat object
 */
export interface TelegramChat {
  /** Unique identifier for the chat */
  id: number
  /** Type of chat (group, supergroup, channel) */
  type: 'group' | 'supergroup' | 'channel'
  /** Title of the chat */
  title: string
  /** Username of the chat */
  username?: string
  /** URL of the chat's photo */
  photo_url?: string
}

/**
 * Theme parameters for styling the Mini App
 */
export interface TelegramThemeParams {
  /** Background color */
  bg_color?: string
  /** Text color */
  text_color?: string
  /** Hint text color */
  hint_color?: string
  /** Link color */
  link_color?: string
  /** Button color */
  button_color?: string
  /** Button text color */
  button_text_color?: string
  /** Secondary background color */
  secondary_bg_color?: string
  /** Header background color */
  header_bg_color?: string
  /** Accent text color */
  accent_text_color?: string
  /** Section background color */
  section_bg_color?: string
  /** Section header text color */
  section_header_text_color?: string
  /** Subtitle text color */
  subtitle_text_color?: string
  /** Destructive text color */
  destructive_text_color?: string
}

/**
 * Back button object
 */
export interface TelegramBackButton {
  /** True if the button is visible */
  isVisible: boolean
  /** Subscribes to button click events */
  onClick(callback: () => void): void
  /** Unsubscribes from button click events */
  offClick(callback: () => void): void
  /** Shows the button */
  show(): void
  /** Hides the button */
  hide(): void
}

/**
 * Main button object
 */
export interface TelegramMainButton {
  /** Current button text */
  text: string
  /** Current button color */
  color: string
  /** Current button text color */
  textColor: string
  /** True if the button is visible */
  isVisible: boolean
  /** True if the button is active */
  isActive: boolean
  /** True if the button is showing a loading indicator */
  isProgressVisible: boolean
  /** Sets the button text */
  setText(text: string): void
  /** Subscribes to button click events */
  onClick(callback: () => void): void
  /** Unsubscribes from button click events */
  offClick(callback: () => void): void
  /** Shows the button */
  show(): void
  /** Hides the button */
  hide(): void
  /** Enables the button */
  enable(): void
  /** Disables the button */
  disable(): void
  /** Shows a loading indicator on the button */
  showProgress(leaveActive?: boolean): void
  /** Hides the loading indicator */
  hideProgress(): void
  /** Sets multiple button parameters at once */
  setParams(params: TelegramMainButtonParams): void
}

/**
 * Parameters for the main button
 */
export interface TelegramMainButtonParams {
  /** Button text */
  text?: string
  /** Button color */
  color?: string
  /** Button text color */
  text_color?: string
  /** Whether the button is active */
  is_active?: boolean
  /** Whether the button is visible */
  is_visible?: boolean
}

/**
 * Settings button object
 */
export interface TelegramSettingsButton {
  /** True if the button is visible */
  isVisible: boolean
  /** Subscribes to button click events */
  onClick(callback: () => void): void
  /** Unsubscribes from button click events */
  offClick(callback: () => void): void
  /** Shows the button */
  show(): void
  /** Hides the button */
  hide(): void
}

/**
 * Haptic feedback object for providing tactile feedback
 */
export interface TelegramHapticFeedback {
  /** Triggers an impact haptic feedback */
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
  /** Triggers a notification haptic feedback */
  notificationOccurred(type: 'error' | 'success' | 'warning'): void
  /** Triggers a selection changed haptic feedback */
  selectionChanged(): void
}

/**
 * Cloud storage object for storing data in Telegram cloud
 */
export interface TelegramCloudStorage {
  /** Sets a value in cloud storage */
  setItem(key: string, value: string, callback?: (error: Error | null, success: boolean) => void): void
  /** Gets a value from cloud storage */
  getItem(key: string, callback: (error: Error | null, value: string | null) => void): void
  /** Gets multiple values from cloud storage */
  getItems(keys: string[], callback: (error: Error | null, values: Record<string, string>) => void): void
  /** Removes a value from cloud storage */
  removeItem(key: string, callback?: (error: Error | null, success: boolean) => void): void
  /** Removes multiple values from cloud storage */
  removeItems(keys: string[], callback?: (error: Error | null, success: boolean) => void): void
  /** Gets all keys from cloud storage */
  getKeys(callback: (error: Error | null, keys: string[]) => void): void
}

/**
 * Event types that can be subscribed to
 */
export type TelegramEventType = 
  | 'themeChanged'
  | 'viewportChanged'
  | 'mainButtonClicked'
  | 'backButtonClicked'
  | 'settingsButtonClicked'
  | 'invoiceClosed'
  | 'popupClosed'
  | 'qrTextReceived'
  | 'clipboardTextReceived'
  | 'writeAccessRequested'
  | 'contactRequested'

/**
 * Invoice status values
 */
export type InvoiceStatus = 'paid' | 'cancelled' | 'failed' | 'pending'

/**
 * Parameters for showing a popup
 */
export interface TelegramPopupParams {
  /** Popup title */
  title?: string
  /** Popup message */
  message: string
  /** Popup buttons */
  buttons?: TelegramPopupButton[]
}

/**
 * Popup button configuration
 */
export interface TelegramPopupButton {
  /** Button identifier */
  id?: string
  /** Button type */
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
  /** Button text */
  text?: string
}
