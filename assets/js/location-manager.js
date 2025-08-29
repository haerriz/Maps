// Location Manager - Handles user location and search functionality
class LocationManager {
  constructor() {
    this.userLocation = null;
    this.permissionStatus = null;
    this.initPermissionStatus();
  }

  async initPermissionStatus() {
    if ('permissions' in navigator) {
      try {
        this.permissionStatus = await navigator.permissions.query({name: 'geolocation'});
        this.permissionStatus.addEventListener('change', () => {
          console.log('Geolocation permission changed:', this.permissionStatus.state);
        });
      } catch (error) {
        console.log('Permissions API not supported');
      }
    }
  }

  async useMyLocation() {
    if (!navigator.geolocation) {
      this.showLocationError('Geolocation is not supported by this browser.');
      await this.fallbackToIPLocation();
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
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000
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
    // Check if user previously denied permission
    if (this.hasLocationPermissionDenied()) {
      console.log('Location permission previously denied, using IP location');
      await this.fallbackToIPLocation();
      return;
    }

    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using IP location');
      await this.fallbackToIPLocation();
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
      
      this.saveLocationPermission(true);
      
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
      console.log('Location access denied, using IP location');
      await this.fallbackToIPLocation();
    }
  }

  async fallbackToIPLocation() {
    try {
      const ipLocation = await Utils.getUserLocation();
      if (ipLocation) {
        this.userLocation = {
          lat: ipLocation.lat,
          lng: ipLocation.lng,
          name: `${ipLocation.city}, ${ipLocation.country}`
        };
        
        if (window.mapManager) {
          window.mapManager.centerOnLocation(ipLocation.lat, ipLocation.lng, 10);
        }
        
        console.log(`Using IP-based location: ${ipLocation.city}, ${ipLocation.country}`);
      } else {
        this.useDefaultLocation();
      }
    } catch (error) {
      console.log('IP location failed, using default location');
      this.useDefaultLocation();
    }
    
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
        const daysSince = (Date.now() - parseInt(time)) / (1000 * 60 * 60 * 24);
        return daysSince < 7; // Don't ask again for 7 days
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
  
  // Auto-detect location on load (only if not already initialized)
  setTimeout(() => {
    if (!window.locationManager.userLocation) {
      window.locationManager.autoDetectLocation();
    }
  }, 2000);
});