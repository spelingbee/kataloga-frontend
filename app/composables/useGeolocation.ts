/**
 * Composable for browser Geolocation API
 * Provides Promise-based access to user's current position
 */
export const useGeolocation = () => {
  /**
   * Get the current position of the device
   * @param options - Geolocation position options
   */
  const getCurrentPosition = (options?: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        options
      )
    })
  }

  return {
    getCurrentPosition
  }
}
