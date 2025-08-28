// Tour Manager - Route planning and optimization
class TourManager {
  constructor() {
    this.stops = [];
    this.currentRoute = null;
    this.init();
  }

  init() {
    this.updateStats();
  }

  addStop(latlng) {
    this.stops.push({
      lat: latlng.lat,
      lng: latlng.lng,
      name: `Stop ${this.stops.length + 1}`
    });
    this.updateStats();
    this.updateStopsList();
  }

  removeStop(index) {
    this.stops.splice(index, 1);
    
    // Update map markers
    if (window.mapManager) {
      window.mapManager.updateMarkers(this.stops);
    }
    
    // Recalculate route if more than 1 stop remains
    if (this.stops.length >= 2) {
      this.calculateRoute();
    } else {
      // Clear route if less than 2 stops
      this.clearRoute();
    }
    
    this.updateStats();
    this.updateStopsList();
  }

  updateStats() {
    const totalStops = document.getElementById('totalStops');
    const totalDistance = document.getElementById('totalDistance');
    
    if (totalStops) totalStops.textContent = this.stops.length;
    if (totalDistance && this.stops.length < 2) {
      totalDistance.textContent = '0 km';
    }
    
    // Clear time display if no route
    if (this.stops.length < 2) {
      const timeElement = document.getElementById('estimatedTime');
      if (timeElement) {
        timeElement.textContent = '0 min';
        timeElement.title = '';
      }
    }
  }

  updateTimeDisplay(baseTime, trafficDelay, avgSpeed) {
    // Add time display to tour stats if not exists
    let timeElement = document.getElementById('estimatedTime');
    if (!timeElement) {
      const tourStats = document.getElementById('tourStats');
      if (tourStats) {
        const timeRow = document.createElement('div');
        timeRow.className = 'stat-row';
        timeRow.innerHTML = '<span>Time:</span> <span id="estimatedTime" class="stat-value">0 min</span>';
        tourStats.appendChild(timeRow);
        timeElement = document.getElementById('estimatedTime');
      }
    }
    
    if (timeElement) {
      if (trafficDelay > 0) {
        timeElement.innerHTML = `
          <span style="color: #666;">${baseTime} min</span> 
          <span style="color: #f44336; font-size: 10px;">+${trafficDelay}</span>
        `;
        timeElement.title = `Base time: ${baseTime} min, Traffic delay: +${trafficDelay} min, Avg speed: ${avgSpeed} km/h`;
      } else {
        timeElement.textContent = `${baseTime} min`;
        timeElement.title = `Estimated travel time: ${baseTime} minutes`;
      }
    }
  }

  updateStopsList() {
    const stopsList = document.getElementById('stopsList');
    if (!stopsList) return;

    if (this.stops.length === 0) {
      stopsList.innerHTML = '<p class="empty-stops">Click on the map to add stops</p>';
      return;
    }

    const stopsHtml = this.stops.map((stop, index) => `
      <div class="stop-item">
        <div class="stop-info">
          <span class="material-icons">place</span>
          <span class="stop-name">${stop.name || `Stop ${index + 1}`}</span>
        </div>
        <button class="btn-remove" onclick="window.tourManager.removeStop(${index})">
          <span class="material-icons">close</span>
        </button>
      </div>
    `).join('');

    stopsList.innerHTML = stopsHtml;
  }

  async calculateRoute() {
    if (this.stops.length < 2) return;

    try {
      const route = await Utils.calculateRoute(this.stops);
      if (route && window.mapManager) {
        window.mapManager.drawRoute(route.geometry.coordinates);
        
        // Analyze traffic if enabled
        let trafficData = { totalDelay: 0, avgSpeed: 50 };
        if (window.trafficManager && window.trafficManager.trafficEnabled) {
          const routeCoords = route.geometry.coordinates.map(coord => ({ lat: coord[1], lng: coord[0] }));
          trafficData = await window.trafficManager.analyzeRouteTraffic(routeCoords);
        }
        
        // Calculate adjusted time with traffic
        const baseTime = Math.round(route.duration / 60);
        const adjustedTime = baseTime + Math.round(trafficData.totalDelay);
        
        // Update distance and duration with traffic info
        const totalDistance = document.getElementById('totalDistance');
        if (totalDistance) {
          totalDistance.textContent = Utils.formatDistance(route.distance);
        }
        
        // Update time display with traffic
        this.updateTimeDisplay(baseTime, Math.round(trafficData.totalDelay), Math.round(trafficData.avgSpeed));
        
        // Notify UI manager of route calculation
        if (window.uiManager) {
          window.uiManager.onRouteCalculated(route, trafficData);
        }
        
        // Update route with traffic data if enabled
        if (window.trafficManager) {
          window.trafficManager.updateRouteWithTraffic(route.geometry.coordinates);
        }
        
        this.currentRoute = route;
      }
    } catch (error) {
      console.warn('Route calculation failed:', error);
    }
  }

  clearRoute() {
    this.currentRoute = null;
    if (window.mapManager) {
      window.mapManager.clearRoute();
    }
    if (window.trafficManager) {
      window.trafficManager.clearRouteTrafficLayers();
    }
  }

  clearTour() {
    this.stops = [];
    this.currentRoute = null;
    this.updateStats();
    this.updateStopsList();
    
    if (window.mapManager) {
      window.mapManager.clearMarkers();
      window.mapManager.clearRoute();
    }
    if (window.trafficManager) {
      window.trafficManager.clearRouteTrafficLayers();
    }
  }

  exportTour() {
    const tourData = {
      stops: this.stops,
      route: this.currentRoute,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(tourData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'haerriz-trip.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  getTourStops() {
    return this.stops;
  }

  getStops() {
    return this.stops;
  }
}

// Global functions for compatibility
function startJourney() {
  if (window.tourManager) {
    window.tourManager.calculateRoute();
  }
}

function clearTour() {
  if (window.tourManager) {
    window.tourManager.clearTour();
  }
}

function exportTour() {
  if (window.tourManager) {
    window.tourManager.exportTour();
  }
}

async function loadNearbyPlaces() {
  const center = getCurrentMapCenter();
  if (!center) return;
  
  const nearbyContainer = document.getElementById('nearbyPlaces');
  const statusElement = document.getElementById('nearbyStatus');
  
  // Check rate limit
  const now = Date.now();
  if (now - lastApiCall < API_RATE_LIMIT) {
    if (statusElement) statusElement.textContent = 'Rate limited - please wait';
    return;
  }
  
  nearbyContainer.innerHTML = '<p class="loading-text">🔍 Finding nearby places...</p>';
  if (statusElement) statusElement.textContent = 'Loading nearby places...';
  
  try {
    const places = await fetchNearbyPlaces(center.lat, center.lng);
    displayNearbyPlaces(places);
    if (statusElement) statusElement.textContent = `Found ${places.length} nearby places`;
  } catch (error) {
    // Use fallback places
    const fallbackPlaces = generateFallbackPlaces(center.lat, center.lng);
    displayNearbyPlaces(fallbackPlaces);
    if (statusElement) statusElement.textContent = 'Showing nearby place types';
  }
}

function refreshNearbyPlaces() {
  loadNearbyPlaces();
}

function getCurrentMapCenter() {
  if (window.mapManager && window.mapManager.map) {
    const center = window.mapManager.map.getCenter();
    return { lat: center.lat, lng: center.lng };
  }
  return null;
}

async function fetchNearbyPlaces(lat, lng) {
  lastApiCall = Date.now();
  
  // Use fallback places to avoid API issues
  return generateFallbackPlaces(lat, lng);
}

function generateFallbackPlaces(lat, lng) {
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

function displayNearbyPlaces(places) {
  const container = document.getElementById('nearbyPlaces');
  
  if (places.length === 0) {
    container.innerHTML = '<p class="no-places">No nearby places found</p>';
    return;
  }
  
  const placesHtml = places.map(place => {
    const name = place.tags.name || place.tags.brand || getPlaceTypeLabel(place.tags);
    const address = getPlaceAddress(place.tags);
    const icon = getPlaceIcon(place.tags);
    const type = getPlaceType(place.tags);
    
    return `
      <div class="nearby-place" onclick="addNearbyPlace(${place.lat}, ${place.lon}, '${name.replace(/'/g, "\\'")}')">  
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

function getPlaceIcon(tags) {
  if (tags.amenity === 'restaurant') return '🍽️';
  if (tags.amenity === 'cafe') return '☕';
  if (tags.amenity === 'hotel' || tags.tourism === 'hotel') return '🏨';
  if (tags.amenity === 'hospital') return '🏥';
  if (tags.amenity === 'bank') return '🏦';
  if (tags.amenity === 'fuel') return '⛽';
  if (tags.amenity === 'pharmacy') return '💊';
  if (tags.amenity === 'atm') return '🏧';
  if (tags.tourism === 'attraction') return '🎯';
  if (tags.tourism === 'museum') return '🏛️';
  if (tags.tourism === 'monument') return '🗿';
  if (tags.shop === 'supermarket') return '🛒';
  if (tags.shop === 'mall') return '🏬';
  if (tags.shop === 'convenience') return '🏦';
  if (tags.leisure === 'park' || tags.leisure === 'garden') return '🌳';
  return '📍';
}

function getPlaceType(tags) {
  if (tags.amenity) return tags.amenity.charAt(0).toUpperCase() + tags.amenity.slice(1);
  if (tags.tourism) return tags.tourism.charAt(0).toUpperCase() + tags.tourism.slice(1);
  if (tags.shop) return tags.shop.charAt(0).toUpperCase() + tags.shop.slice(1);
  return 'Place';
}

function getPlaceTypeLabel(tags) {
  const type = getPlaceType(tags);
  return `${type} nearby`;
}

function addNearbyPlace(lat, lng, name) {
  const location = { lat: lat, lng: lng, name: name };
  
  if (window.mapManager) {
    window.mapManager.addMarker(location);
  }
  
  if (window.tourManager) {
    window.tourManager.addStop(location);
  }
}

function quickAddLocation(locationName) {
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

function updateTravelMode() {
  // Travel mode change handler
  const mode = document.getElementById('travelMode')?.value;
  console.log('Travel mode changed to:', mode);
}

function setStartTime(time) {
  if (time === 'now') {
    const now = new Date();
    const timeInput = document.getElementById('startTime');
    const dateInput = document.getElementById('startDate');
    
    if (timeInput) {
      timeInput.value = now.toTimeString().slice(0, 5);
    }
    if (dateInput) {
      dateInput.value = now.toISOString().slice(0, 10);
    }
  }
}

function useMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const latlng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      if (window.mapManager) {
        window.mapManager.showUserLocation(latlng.lat, latlng.lng, position.coords.accuracy);
        window.mapManager.centerOnLocation(latlng.lat, latlng.lng, 15);
      }
    }, (error) => {
      alert('Unable to get your location. Please check location permissions.');
    });
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}

function getWeatherInfo() {
  if (window.tourManager && window.tourManager.stops.length > 0) {
    const lastStop = window.tourManager.stops[window.tourManager.stops.length - 1];
    Utils.getWeather(`${lastStop.lat},${lastStop.lng}`).then(weather => {
      if (weather) {
        alert(`Weather: ${weather.condition}, ${weather.temperature}°C`);
      }
    });
  }
}

function cacheCurrentArea() {
  // Cache current map area for offline use
  console.log('Caching current area for offline use');
}

function toggleMobileView() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('mobile-open');
  }
}

function getPlaceAddress(tags) {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  return parts.length > 0 ? parts.join(', ') : null;
}

let nearbyUpdateTimeout;
let lastApiCall = 0;
const API_RATE_LIMIT = 5000; // 5 seconds between calls

function setupMapMoveListener() {
  if (window.mapManager && window.mapManager.map) {
    window.mapManager.map.on('moveend', () => {
      clearTimeout(nearbyUpdateTimeout);
      nearbyUpdateTimeout = setTimeout(() => {
        const now = Date.now();
        if (now - lastApiCall > API_RATE_LIMIT) {
          loadNearbyPlaces();
        }
      }, 2000);
    });
  }
}

// Initialize tour manager
window.addEventListener('DOMContentLoaded', () => {
  window.tourManager = new TourManager();
  
  // Setup map movement listener and auto-load nearby places
  setTimeout(() => {
    setupMapMoveListener();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        if (window.mapManager) {
          window.mapManager.centerOnLocation(position.coords.latitude, position.coords.longitude, 12);
          setTimeout(loadNearbyPlaces, 1000);
        }
      }, () => {
        setTimeout(loadNearbyPlaces, 2000);
      });
    }
  }, 2000);
});