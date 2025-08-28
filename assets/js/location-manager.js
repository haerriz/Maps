// Location Manager - Handles user location and search functionality
class LocationManager {
  constructor() {
    this.userLocation = null;
  }

  async useMyLocation() {
    if (!navigator.geolocation) {
      this.showLocationError('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await this.requestLocationPermission();
      
      const latlng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        name: 'My Location'
      };
      
      this.userLocation = latlng;
      
      if (window.mapManager) {
        window.mapManager.showUserLocation(latlng.lat, latlng.lng, position.coords.accuracy);
        window.mapManager.centerOnLocation(latlng.lat, latlng.lng, 15);
      }
      
      if (window.tourManager && window.tourManager.stops.length === 0) {
        window.tourManager.addStop(latlng);
      }
    } catch (error) {
      this.handleGeolocationError(error);
    }
  }

  requestLocationPermission() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000
        }
      );
    });
  }

  handleGeolocationError(error) {
    let message = 'Unable to get your location. ';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message += 'Location access was denied. Please enable location permissions in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        message += 'Location information is unavailable. Please try again.';
        break;
      case error.TIMEOUT:
        message += 'Location request timed out. Please try again.';
        break;
      default:
        message += 'An unknown error occurred while retrieving location.';
        break;
    }
    
    this.showLocationError(message);
  }

  showLocationError(message) {
    // Show user-friendly error message
    if (window.chatManager) {
      window.chatManager.addMessage(message, 'ai');
    } else {
      alert(message);
    }
    
    // Fallback to default location (London)
    if (window.mapManager) {
      window.mapManager.centerOnLocation(51.505, -0.09, 10);
    }
  }

  async autoDetectLocation() {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using default location');
      this.useDefaultLocation();
      return;
    }

    try {
      const position = await this.requestLocationPermission();
      const { latitude, longitude } = position.coords;
      
      this.userLocation = {
        lat: latitude,
        lng: longitude,
        name: 'My Location'
      };
      
      if (window.mapManager) {
        window.mapManager.centerOnLocation(latitude, longitude, 12);
        window.mapManager.showUserLocation(latitude, longitude, position.coords.accuracy);
      }
      
      setTimeout(() => {
        if (window.nearbyPlacesManager) {
          window.nearbyPlacesManager.loadNearbyPlaces();
        }
      }, 1000);
    } catch (error) {
      console.log('Location access denied, using default location');
      this.useDefaultLocation();
    }
  }

  useDefaultLocation() {
    // Fallback to default location (London)
    if (window.mapManager) {
      window.mapManager.centerOnLocation(51.505, -0.09, 10);
    }
    
    // Load nearby places for default location
    setTimeout(() => {
      if (window.nearbyPlacesManager) {
        window.nearbyPlacesManager.loadNearbyPlaces();
      }
    }, 1000);
  }

  quickAddLocation(locationName) {
    if (window.Utils) {
      Utils.geocodeLocation(locationName).then(results => {
        if (results.length > 0) {
          const result = results[0];
          if (window.mapManager) {
            window.mapManager.centerOnLocation(result.lat, result.lng, 12);
            window.mapManager.addMarker(result);
          }
          if (window.tourManager) {
            window.tourManager.addStop(result);
          }
        }
      });
    }
  }

  getUserLocation() {
    return this.userLocation;
  }
}

// Global functions for compatibility
function useMyLocation() {
  if (window.locationManager) {
    window.locationManager.useMyLocation();
  }
}

function quickAddLocation(locationName) {
  if (window.locationManager) {
    window.locationManager.quickAddLocation(locationName);
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  window.locationManager = new LocationManager();
  
  // Auto-detect location on load
  setTimeout(() => {
    window.locationManager.autoDetectLocation();
  }, 1000);
});