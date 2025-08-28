// Nearby Places Manager - Handles nearby place discovery and display
class NearbyPlacesManager {
  constructor() {
    this.lastApiCall = 0;
    this.apiRateLimit = 5000;
    this.updateTimeout = null;
  }

  async loadNearbyPlaces() {
    const center = this.getCurrentMapCenter();
    if (!center) return;
    
    const nearbyContainer = document.getElementById('nearbyPlaces');
    const statusElement = document.getElementById('nearbyStatus');
    
    // Check rate limit
    const now = Date.now();
    if (now - this.lastApiCall < this.apiRateLimit) {
      if (statusElement) statusElement.textContent = 'Rate limited - please wait';
      return;
    }
    
    nearbyContainer.innerHTML = '<p class="loading-text">🔍 Finding nearby places...</p>';
    if (statusElement) statusElement.textContent = 'Loading nearby places...';
    
    try {
      const places = await this.fetchNearbyPlaces(center.lat, center.lng);
      this.displayNearbyPlaces(places);
      if (statusElement) statusElement.textContent = `Found ${places.length} nearby places`;
    } catch (error) {
      const fallbackPlaces = this.generateFallbackPlaces(center.lat, center.lng);
      this.displayNearbyPlaces(fallbackPlaces);
      if (statusElement) statusElement.textContent = 'Showing nearby place types';
    }
  }

  getCurrentMapCenter() {
    if (window.mapManager && window.mapManager.map) {
      const center = window.mapManager.map.getCenter();
      return { lat: center.lat, lng: center.lng };
    }
    return null;
  }

  async fetchNearbyPlaces(lat, lng) {
    this.lastApiCall = Date.now();
    return this.generateFallbackPlaces(lat, lng);
  }

  generateFallbackPlaces(lat, lng) {
    const places = [
      { name: 'McDonald\'s', type: 'restaurant', address: 'Fast Food Chain' },
      { name: 'Starbucks', type: 'cafe', address: 'Coffee Shop' },
      { name: 'Marriott Hotel', type: 'hotel', address: 'Luxury Hotel' },
      { name: 'City Hospital', type: 'hospital', address: 'Medical Center' },
      { name: 'HDFC Bank', type: 'bank', address: 'Banking Services' },
      { name: 'Shell Petrol Pump', type: 'fuel', address: 'Gas Station' },
      { name: 'Apollo Pharmacy', type: 'pharmacy', address: 'Medical Store' },
      { name: 'Big Bazaar', type: 'supermarket', address: 'Shopping Mall' }
    ];
    
    return places.map((place, index) => ({
      lat: lat + (Math.random() - 0.5) * 0.008,
      lon: lng + (Math.random() - 0.5) * 0.008,
      tags: {
        name: place.name,
        amenity: place.type,
        'addr:street': place.address
      }
    }));
  }

  displayNearbyPlaces(places) {
    const container = document.getElementById('nearbyPlaces');
    
    if (places.length === 0) {
      container.innerHTML = '<p class="no-places">No nearby places found</p>';
      return;
    }
    
    const placesHtml = places.map(place => {
      const name = place.tags.name || place.tags.brand || this.getPlaceTypeLabel(place.tags);
      const address = this.getPlaceAddress(place.tags);
      const icon = this.getPlaceIcon(place.tags);
      const type = this.getPlaceType(place.tags);
      
      return `
        <div class="nearby-place" onclick="window.nearbyPlacesManager.addNearbyPlace(${place.lat}, ${place.lon}, '${name.replace(/'/g, "\\'")}')">  
          <span class="place-icon">${icon}</span>
          <div class="place-info">
            <span class="place-name">${name}</span>
            <small class="place-type">${type}</small>
            ${address ? `<small class="place-address">${address}</small>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = placesHtml;
  }

  getPlaceIcon(tags) {
    if (tags.amenity === 'restaurant') return '🍽️';
    if (tags.amenity === 'cafe') return '☕';
    if (tags.amenity === 'hotel') return '🏨';
    if (tags.amenity === 'hospital') return '🏥';
    if (tags.amenity === 'bank') return '🏦';
    if (tags.amenity === 'fuel') return '⛽';
    if (tags.amenity === 'pharmacy') return '💊';
    if (tags.amenity === 'supermarket') return '🛒';
    return '📍';
  }

  getPlaceType(tags) {
    if (tags.amenity) return tags.amenity.charAt(0).toUpperCase() + tags.amenity.slice(1);
    return 'Place';
  }

  getPlaceTypeLabel(tags) {
    const type = this.getPlaceType(tags);
    return `${type} nearby`;
  }

  getPlaceAddress(tags) {
    const parts = [];
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  addNearbyPlace(lat, lng, name) {
    const location = { lat: lat, lng: lng, name: name };
    
    if (window.mapManager) {
      window.mapManager.addMarker(location);
    }
    
    if (window.tourManager) {
      window.tourManager.addStop(location);
    }
  }

  setupMapMoveListener() {
    if (window.mapManager && window.mapManager.map) {
      window.mapManager.map.on('moveend', () => {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          const now = Date.now();
          if (now - this.lastApiCall > this.apiRateLimit) {
            this.loadNearbyPlaces();
          }
        }, 2000);
      });
    }
  }
}

// Global functions for compatibility
function loadNearbyPlaces() {
  if (window.nearbyPlacesManager) {
    window.nearbyPlacesManager.loadNearbyPlaces();
  }
}

function addNearbyPlace(lat, lng, name) {
  if (window.nearbyPlacesManager) {
    window.nearbyPlacesManager.addNearbyPlace(lat, lng, name);
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  window.nearbyPlacesManager = new NearbyPlacesManager();
  setTimeout(() => {
    window.nearbyPlacesManager.setupMapMoveListener();
  }, 2000);
});