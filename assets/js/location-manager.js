// Location Manager - Handles user location and search functionality
class LocationManager {
  constructor() {
    this.userLocation = null;
  }

  useMyLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
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
        
        // Add as first stop if no stops exist
        if (window.tourManager && window.tourManager.stops.length === 0) {
          window.tourManager.addStop(latlng);
        }
      }, (error) => {
        alert('Unable to get your location. Please check location permissions.');
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  autoDetectLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          this.userLocation = {
            lat: latitude,
            lng: longitude,
            name: 'My Location'
          };
          
          // Center map on user location
          if (window.mapManager) {
            window.mapManager.centerOnLocation(latitude, longitude, 12);
            window.mapManager.showUserLocation(latitude, longitude, position.coords.accuracy);
          }
          
          // Load nearby places
          setTimeout(() => {
            if (window.nearbyPlacesManager) {
              window.nearbyPlacesManager.loadNearbyPlaces();
            }
          }, 1000);
        },
        (error) => {
          console.log('Location access denied or unavailable');
          // Fallback to default location (London)
          if (window.mapManager) {
            window.mapManager.centerOnLocation(51.505, -0.09, 10);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
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