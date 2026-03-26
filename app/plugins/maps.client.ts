export default defineNuxtPlugin(() => {
  // Only run on client side
  if (import.meta.server) return

  // Initialize maps functionality
  const initializeMaps = () => {
    // Load Leaflet CSS if not already loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    // Preload Leaflet JavaScript
    const script = document.createElement('link')
    script.rel = 'preload'
    script.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.as = 'script'
    document.head.appendChild(script)

    console.log('Maps plugin initialized')
  }

  // Custom map utilities
  const mapUtils = {
    // Create custom marker HTML
    createMarkerHTML: (type: string, content?: string) => {
      const baseClasses = 'flex items-center justify-center text-white text-sm font-bold rounded-full shadow-lg'
      
      switch (type) {
        case 'restaurant':
          return `<div class="${baseClasses} w-10 h-10 bg-primary-red">🍽️</div>`
        case 'user':
          return `<div class="${baseClasses} w-6 h-6 bg-blue-500 border-2 border-white"></div>`
        case 'delivery':
          return `<div class="${baseClasses} w-10 h-10 bg-primary-green">🚚</div>`
        case 'pickup':
          return `<div class="${baseClasses} w-10 h-10 bg-primary-orange">📍</div>`
        default:
          return `<div class="${baseClasses} w-8 h-8 bg-gray-500">${content || '📍'}</div>`
      }
    },

    // Format popup content
    formatPopupContent: (title?: string, description?: string, data?: any) => {
      let content = '<div class="p-3 min-w-48">'
      
      if (title) {
        content += `<h3 class="font-semibold text-base mb-2 text-gray-900">${title}</h3>`
      }
      
      if (description) {
        content += `<p class="text-sm text-gray-600 mb-2">${description}</p>`
      }
      
      if (data) {
        if (data.distance) {
          content += `<p class="text-xs text-gray-500">Distance: ${data.distance.toFixed(1)} km</p>`
        }
        
        if (data.deliveryTime) {
          content += `<p class="text-xs text-gray-500">Delivery: ${data.deliveryTime} min</p>`
        }
        
        if (data.phone) {
          content += `<p class="text-xs text-gray-500">Phone: ${data.phone}</p>`
        }
      }
      
      content += '</div>'
      return content
    },

    // Calculate optimal zoom level based on distance
    calculateZoom: (distance: number) => {
      if (distance < 1) return 16
      if (distance < 5) return 14
      if (distance < 10) return 13
      if (distance < 25) return 12
      if (distance < 50) return 11
      return 10
    },

    // Get map style based on theme
    getMapStyle: (theme: 'light' | 'dark' = 'light') => {
      return theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    },

    // Debounce map events
    debounce: (func: Function, wait: number) => {
      let timeout: NodeJS.Timeout
      return function executedFunction(...args: any[]) {
        const later = () => {
          clearTimeout(timeout)
          func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }
    }
  }

  // Error handling for map operations
  const handleMapError = (error: any, operation: string) => {
    console.error(`Map ${operation} error:`, error)
    
    // Show user-friendly error message
    const errorMessage = document.createElement('div')
    errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50'
    
    // Create elements securely without innerHTML
    const flexContainer = document.createElement('div')
    flexContainer.className = 'flex items-center gap-2'
    
    const iconSpan = document.createElement('span')
    iconSpan.textContent = '⚠️'
    flexContainer.appendChild(iconSpan)
    
    const textContainer = document.createElement('div')
    const titleP = document.createElement('p')
    titleP.className = 'font-medium'
    titleP.textContent = 'Map Error'
    textContainer.appendChild(titleP)
    
    const msgP = document.createElement('p')
    msgP.className = 'text-sm opacity-90'
    msgP.textContent = `Unable to ${operation}. Please try again.`
    textContainer.appendChild(msgP)
    flexContainer.appendChild(textContainer)
    
    const closeBtn = document.createElement('button')
    closeBtn.className = 'ml-2 text-white opacity-75 hover:opacity-100'
    closeBtn.textContent = '✕'
    closeBtn.onclick = () => errorMessage.remove()
    flexContainer.appendChild(closeBtn)
    
    errorMessage.appendChild(flexContainer)
    
    document.body.appendChild(errorMessage)
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorMessage.parentElement) {
        errorMessage.remove()
      }
    }, 5000)
  }

  // Initialize maps
  initializeMaps()

  // Provide utilities globally
  return {
    provide: {
      maps: {
        utils: mapUtils,
        handleError: handleMapError
      }
    }
  }
})