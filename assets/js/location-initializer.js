// Location Initializer - Set real user location as default
class LocationInitializer {
  static async initializeUserLocation() {
    try {
      // Try to get user's real location via IP
      const userLocation = await Utils.getUserLocation();
      
      if (userLocation && userLocation.lat && userLocation.lng && !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
        // Update config with real location
        CONFIG.DEFAULT_CENTER = [userLocation.lat, userLocation.lng];
        
        // Update map if it exists
        if (window.mapManager && window.mapManager.map) {
          window.mapManager.map.setView([userLocation.lat, userLocation.lng], CONFIG.DEFAULT_ZOOM);
        }
        

        return userLocation;
      }
    } catch (error) {

    }
    
    // Fallback to Chennai, India if location detection fails
    CONFIG.DEFAULT_CENTER = [13.0827, 80.2707];

    return null;
  }
  
  static async initializeWithBrowserLocation() {
    // Check if geolocation is available and not blocked
    if (!navigator.geolocation) {

      return await LocationInitializer.initializeUserLocation();
    }

    // Always try geolocation, don't pre-check permissions

    
    try {
      return new Promise((resolve) => {
        const timeoutId = setTimeout(async () => {

          const ipLocation = await LocationInitializer.initializeUserLocation();
          resolve(ipLocation);
        }, 3000);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            
            CONFIG.DEFAULT_CENTER = [location.lat, location.lng];
            
            if (window.mapManager && window.mapManager.map) {
              window.mapManager.map.setView([location.lat, location.lng], CONFIG.DEFAULT_ZOOM);
            }
            

            resolve(location);
          },
          async (error) => {
            clearTimeout(timeoutId);

            // Fallback to IP-based location
            const ipLocation = await LocationInitializer.initializeUserLocation();
            resolve(ipLocation);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });
    } catch (error) {

      return await LocationInitializer.initializeUserLocation();
    }
  }
}

// Auto-initialize when DOM is ready - use default location
window.addEventListener('DOMContentLoaded', async () => {
  // Set default location (Chennai, India)
  CONFIG.DEFAULT_CENTER = [13.0827, 80.2707];

});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocationInitializer;
} else {
  window.LocationInitializer = LocationInitializer;
}