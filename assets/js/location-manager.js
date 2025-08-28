// Location Manager - Handles user location and search functionality
class LocationManager {
  constructor() {
    this.userLocation = null;
  }

  useMyLocation() {
    // Geolocation disabled - prompt user to search for location
    this.showLocationPrompt();
  }

  showLocationPrompt() {
    const searchInput = document.getElementById('startLocation');
    if (searchInput) {
      searchInput.focus();
      searchInput.placeholder = 'Enter your current location (e.g., New York, London, Tokyo)';
      searchInput.style.borderColor = '#4285f4';
      searchInput.style.boxShadow = '0 0 0 2px rgba(66, 133, 244, 0.2)';
    }
    
    if (window.chatManager) {
      window.chatManager.addMessage('Please search for your location in the search box above to get started!', 'ai');
    } else {
      alert('Please search for your location using the search box to get started.');
    }
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

  autoDetectLocation() {
    // Auto-detect disabled - use default location
    console.log('Auto-location disabled, using default location');
    this.useDefaultLocation();
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