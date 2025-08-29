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
    
    // Show location being used
    const locationSource = this.getLocationSource();
    nearbyContainer.innerHTML = `<p class="loading-text">🔍 Finding places near ${locationSource}...</p>`;
    if (statusElement) statusElement.textContent = `Searching near ${locationSource}...`;
    
    try {
      const places = await this.fetchNearbyPlaces(center.lat, center.lng);
      this.displayNearbyPlaces(places);
      if (statusElement) statusElement.textContent = `Found ${places.length} places near ${locationSource}`;
    } catch (error) {
      const fallbackPlaces = this.generateFallbackPlaces(center.lat, center.lng);
      this.displayNearbyPlaces(fallbackPlaces);
      if (statusElement) statusElement.textContent = `Showing place types near ${locationSource}`;
    }
  }

  getLocationSource() {
    if (window.locationManager && window.locationManager.userLocation) {
      return 'your location';
    }
    if (window.tourManager && window.tourManager.stops.length > 0) {
      return 'selected marker';
    }
    return 'map center';
  }

  generateFallbackPlaces(lat, lng) {
    // Use real place types but indicate they're suggestions
    return [
      { lat: lat + 0.001, lon: lng + 0.001, tags: { name: 'Find Restaurants', amenity: 'restaurant' } },
      { lat: lat - 0.001, lon: lng + 0.002, tags: { name: 'Find Cafes', amenity: 'cafe' } },
      { lat: lat + 0.002, lon: lng - 0.001, tags: { name: 'Find Hospitals', amenity: 'hospital' } },
      { lat: lat - 0.002, lon: lng - 0.002, tags: { name: 'Find Banks', amenity: 'bank' } }
    ];
  }

  getCurrentMapCenter() {
    // Priority: User location > Last marker > Map center
    if (window.locationManager && window.locationManager.userLocation) {
      return {
        lat: window.locationManager.userLocation.lat,
        lng: window.locationManager.userLocation.lng
      };
    }
    
    // Use last added marker if available
    if (window.tourManager && window.tourManager.stops.length > 0) {
      const lastStop = window.tourManager.stops[window.tourManager.stops.length - 1];
      return { lat: lastStop.lat, lng: lastStop.lng };
    }
    
    // Fallback to map center
    if (window.mapManager && window.mapManager.map) {
      const center = window.mapManager.map.getCenter();
      return { lat: center.lat, lng: center.lng };
    }
    
    return null;
  }

  async fetchNearbyPlaces(lat, lng) {
    this.lastApiCall = Date.now();
    
    try {
      // Use Nominatim directly (more reliable than Overpass)
      return await this.fetchNominatimNearby(lat, lng);
    } catch (error) {
      console.warn('Nominatim failed, using fallback places:', error);
      return this.generateFallbackPlaces(lat, lng);
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
    const amenities = ['restaurant', 'cafe', 'hospital', 'bank', 'fuel', 'pharmacy', 'hotel', 'supermarket'];
    const allPlaces = [];
    
    for (const amenity of amenities.slice(0, 4)) { // Limit to 4 types to avoid rate limits
      try {
        const radius = 0.005; // ~500m radius
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&amenity=${amenity}&lat=${lat}&lon=${lng}&radius=1000&limit=3&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          const places = data.map(place => ({
            lat: parseFloat(place.lat),
            lon: parseFloat(place.lon),
            tags: {
              name: place.name || place.display_name.split(',')[0],
              amenity: amenity,
              'addr:street': place.address?.road || place.display_name.split(',')[1]?.trim()
            }
          }));
          allPlaces.push(...places);
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Failed to fetch ${amenity}:`, error);
      }
    }
    
    return allPlaces.slice(0, 8);
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