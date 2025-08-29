// Location Manager - Handles user location and search functionality
class LocationManager {
  constructor() {
    this.userLocation = null;
    this.permissionStatus = null;
  }

  async useMyLocation() {
    try {
      const position = await this.requestLocationPermission();
      
      const latlng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        name: 'My Location'
      };
      
      this.userLocation = latlng;
      this.saveLocationPermission(true);
      
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
    // Check if geolocation is blocked by permissions policy
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    // Check if we're in an iframe without proper permissions
    if (window.self !== window.top) {
      throw new Error('Geolocation blocked in iframe - please open in main window');
    }

    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000
      };
      
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        options
      );
    });
  }

  async handleGeolocationError(error) {
    let message = 'Unable to get your precise location. ';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message += 'Location access was denied. Using approximate location instead.';
        this.saveLocationPermission(false);
        break;
      case error.POSITION_UNAVAILABLE:
        message += 'Location information is unavailable. Using approximate location.';
        break;
      case error.TIMEOUT:
        message += 'Location request timed out. Using approximate location.';
        break;
      default:
        message += 'Using approximate location based on your IP address.';
        break;
    }
    
    console.log(message);
    await this.fallbackToIPLocation();
  }

  showLocationError(message) {
    // Show user-friendly error message
    if (window.chatManager) {
      window.chatManager.addMessage(message, 'ai');
    } else {
      console.log(message);
    }
  }

  async autoDetectLocation() {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using IP location');
      await this.fallbackToIPLocation();
      return;
    }

    // Always try geolocation first, regardless of previous denials
    try {
      const position = await this.requestLocationPermission();
      const { latitude, longitude } = position.coords;
      
      this.userLocation = {
        lat: latitude,
        lng: longitude,
        name: 'My Location'
      };
      
      this.saveLocationPermission(true);
      
      if (window.mapManager) {
        window.mapManager.centerOnLocation(latitude, longitude, 12);
        window.mapManager.showUserLocation(latitude, longitude, position.coords.accuracy);
      }
      
      console.log('Using precise GPS location');
      
      setTimeout(() => {
        if (window.nearbyPlacesManager) {
          window.nearbyPlacesManager.loadNearbyPlaces();
        }
      }, 1000);
    } catch (error) {
      console.log('Location access denied, using IP location');
      this.saveLocationPermission(false);
      await this.fallbackToIPLocation();
    }
  }

  async fallbackToIPLocation() {
    // Skip IP location and go directly to default
    this.useDefaultLocation();
    
    // Load nearby places
    setTimeout(() => {
      if (window.nearbyPlacesManager) {
        window.nearbyPlacesManager.loadNearbyPlaces();
      }
    }, 1000);
  }

  useDefaultLocation() {
    // Fallback to Chennai, India (from config)
    this.userLocation = {
      lat: 13.0827,
      lng: 80.2707,
      name: 'Chennai, India'
    };
    
    if (window.mapManager) {
      window.mapManager.centerOnLocation(13.0827, 80.2707, 10);
    }
    
    console.log('Using default location: Chennai, India');
  }

  saveLocationPermission(granted) {
    try {
      localStorage.setItem('locationPermission', granted ? 'granted' : 'denied');
      localStorage.setItem('locationPermissionTime', Date.now().toString());
    } catch (error) {
      console.log('Could not save location permission status');
    }
  }

  hasLocationPermissionDenied() {
    try {
      const permission = localStorage.getItem('locationPermission');
      const time = localStorage.getItem('locationPermissionTime');
      
      if (permission === 'denied' && time) {
        const hoursSince = (Date.now() - parseInt(time)) / (1000 * 60 * 60);
        return hoursSince < 1; // Only skip for 1 hour, then try again
      }
    } catch (error) {
      console.log('Could not check location permission status');
    }
    return false;
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
  
  // Clear old permission denials on fresh page load
  try {
    const lastDenial = localStorage.getItem('locationPermissionTime');
    if (lastDenial) {
      const hoursSince = (Date.now() - parseInt(lastDenial)) / (1000 * 60 * 60);
      if (hoursSince > 1) {
        localStorage.removeItem('locationPermission');
        localStorage.removeItem('locationPermissionTime');
        console.log('Cleared old location permission denial');
      }
    }
  } catch (error) {
    console.log('Could not clear old permissions');
  }
  
  // Don't auto-detect location to avoid user gesture violation
  // Location will be requested when user clicks "My Location" button
});