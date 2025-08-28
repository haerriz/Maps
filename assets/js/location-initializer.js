// Location Initializer - Set real user location as default
class LocationInitializer {
  static async initializeUserLocation() {
    try {
      // Try to get user's real location
      const userLocation = await Utils.getUserLocation();
      
      if (userLocation) {
        // Update config with real location
        CONFIG.DEFAULT_CENTER = [userLocation.lat, userLocation.lng];
        
        // Update map if it exists
        if (window.mapManager && window.mapManager.map) {
          window.mapManager.map.setView([userLocation.lat, userLocation.lng], CONFIG.DEFAULT_ZOOM);
        }
        
        console.log(`Location initialized: ${userLocation.city}, ${userLocation.country}`);
        return userLocation;
      }
    } catch (error) {
      console.warn('Could not initialize user location:', error);
    }
    
    // Fallback to London if location detection fails
    CONFIG.DEFAULT_CENTER = [51.505, -0.09];
    return null;
  }
  
  static async initializeWithBrowserLocation() {
    try {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported, using IP location');
        return await LocationInitializer.initializeUserLocation();
      }
      
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            
            CONFIG.DEFAULT_CENTER = [location.lat, location.lng];
            
            if (window.mapManager && window.mapManager.map) {
              window.mapManager.map.setView([location.lat, location.lng], CONFIG.DEFAULT_ZOOM);
            }
            
            console.log('Browser location initialized:', location);
            resolve(location);
          },
          async (error) => {
            console.warn('Browser geolocation failed:', error.message);
            // Fallback to IP-based location
            const ipLocation = await LocationInitializer.initializeUserLocation();
            resolve(ipLocation);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 600000 // 10 minutes
          }
        );
      });
    } catch (error) {
      console.warn('Geolocation error, using IP location:', error);
      return await LocationInitializer.initializeUserLocation();
    }
  }
}

// Auto-initialize when DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
  // Try browser geolocation first, then IP-based
  await LocationInitializer.initializeWithBrowserLocation();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocationInitializer;
} else {
  window.LocationInitializer = LocationInitializer;
}