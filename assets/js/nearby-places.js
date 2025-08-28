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
    
    try {
      // Use Overpass API for real nearby places data
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"^(restaurant|cafe|hospital|bank|fuel|pharmacy|supermarket|hotel)$"](around:1000,${lat},${lng});
          way["amenity"~"^(restaurant|cafe|hospital|bank|fuel|pharmacy|supermarket|hotel)$"](around:1000,${lat},${lng});
        );
        out center meta;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
      
      if (!response.ok) {
        throw new Error('Overpass API failed');
      }
      
      const data = await response.json();
      return this.processOverpassData(data.elements);
      
    } catch (error) {
      console.warn('Overpass API failed, trying Nominatim fallback:', error);
      return this.fetchNominatimNearby(lat, lng);
    }
  }

  processOverpassData(elements) {
    return elements.map(element => {
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;
      
      if (!lat || !lon) return null;
      
      return {
        lat: lat,
        lon: lon,
        tags: element.tags || {}
      };
    }).filter(Boolean).slice(0, 20); // Limit to 20 results
  }

  async fetchNominatimNearby(lat, lng) {
    try {
      // Fallback to Nominatim search for nearby amenities
      const amenities = ['restaurant', 'cafe', 'hospital', 'bank', 'fuel', 'pharmacy', 'supermarket', 'hotel'];
      const promises = amenities.map(amenity => 
        fetch(`https://nominatim.openstreetmap.org/search?format=json&amenity=${amenity}&lat=${lat}&lon=${lng}&radius=1000&limit=3`)
          .then(res => res.json())
          .catch(() => [])
      );
      
      const results = await Promise.all(promises);
      const places = results.flat().map(place => ({
        lat: parseFloat(place.lat),
        lon: parseFloat(place.lon),
        tags: {
          name: place.display_name.split(',')[0],
          amenity: place.type,
          'addr:street': place.display_name
        }
      }));
      
      return places.slice(0, 15);
    } catch (error) {
      console.error('All nearby places APIs failed:', error);
      return [];
    }
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