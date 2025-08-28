// Tour Manager - Core tour management functionality
class TourManager {
  constructor() {
    this.stops = [];
    this.init();
  }

  init() {
    this.updateStats();
  }

  async addStop(latlng) {
    // Use provided name or generate based on location type
    const stopName = latlng.name || await this.generateStopName(latlng);
    
    this.stops.push({
      lat: latlng.lat,
      lng: latlng.lng,
      name: stopName
    });
    
    this.updateStats();
    this.updateStopsList();
    
    // Calculate route if we have 2+ stops
    if (this.stops.length >= 2) {
      this.calculateRoute();
    } else {
      this.showSingleStopMessage();
    }
  }

  async generateStopName(latlng) {
    // If it's user location, keep that name
    if (latlng.name === 'My Location') return 'My Location';
    
    // Try reverse geocoding for real location name
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        // Extract meaningful location name
        const address = data.address || {};
        const name = address.amenity || address.shop || address.building || 
                    address.house_number && address.road ? `${address.house_number} ${address.road}` :
                    address.road || address.suburb || address.city || 
                    data.display_name.split(',')[0];
        return name || (this.stops.length === 0 ? 'Starting Point' : `Stop ${this.stops.length + 1}`);
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }
    
    // Fallback to generic names
    return this.stops.length === 0 ? 'Starting Point' : `Stop ${this.stops.length + 1}`;
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
      if (window.routeCalculator) {
        window.routeCalculator.clearRoute();
      }
      if (this.stops.length === 1) {
        this.showSingleStopMessage();
      }
    }
    
    this.updateStats();
    this.updateStopsList();
  }

  showSingleStopMessage() {
    const transportDetails = document.getElementById('transportDetails');
    if (transportDetails) {
      transportDetails.innerHTML = `
        <div class="single-stop-message">
          <span class="material-icons">info</span>
          <div>
            <strong>Add a destination</strong>
            <small>Click on the map or search for a second location to get directions</small>
          </div>
        </div>
      `;
    }
  }

  async calculateRoute() {
    if (window.routeCalculator) {
      const routeInfo = await window.routeCalculator.calculateRoute(this.stops);
      
      if (routeInfo) {
        // Update distance
        const totalDistance = document.getElementById('totalDistance');
        if (totalDistance) {
          totalDistance.textContent = `${routeInfo.distance} km`;
        }
        
        // Update time display
        this.updateTimeDisplay(routeInfo.baseTime, routeInfo.trafficDelay, routeInfo.avgSpeed);
        
        // Update transport info
        this.updateTransportInfo(routeInfo);
      }
    }
  }

  updateTimeDisplay(baseTime, trafficDelay, avgSpeed) {
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

  updateTransportInfo(routeInfo) {
    const transportDetails = document.getElementById('transportDetails');
    if (!transportDetails) return;
    
    let timeDisplay = `${routeInfo.duration} min`;
    let trafficInfo = '';
    
    if (routeInfo.trafficDelay > 0) {
      timeDisplay = `${routeInfo.baseTime}+${routeInfo.trafficDelay} min`;
      trafficInfo = `<div style="font-size: 10px; color: #f44336; margin-top: 2px;">
          <span class="material-icons" style="font-size: 12px;">traffic</span>
          Avg speed: ${routeInfo.avgSpeed} km/h
      </div>`;
    }
    
    transportDetails.innerHTML = `
      <div class="transport-option active">
        <span class="material-icons">directions_car</span>
        <div class="transport-details">
          <strong>Driving</strong>
          <small>${timeDisplay} • ${routeInfo.distance} km</small>
          ${trafficInfo}
        </div>
      </div>
    `;
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
          <span class="stop-name">${stop.name}</span>
        </div>
        <button class="btn-remove" onclick="window.tourManager.removeStop(${index})">
          <span class="material-icons">close</span>
        </button>
      </div>
    `).join('');

    stopsList.innerHTML = stopsHtml;
  }

  clearTour() {
    this.stops = [];
    this.updateStats();
    this.updateStopsList();
    
    if (window.mapManager) {
      window.mapManager.clearMarkers();
      window.mapManager.clearRoute();
    }
    if (window.routeCalculator) {
      window.routeCalculator.clearRoute();
    }
  }

  exportTour() {
    const tourData = {
      stops: this.stops,
      route: window.routeCalculator ? window.routeCalculator.getCurrentRoute() : null,
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

  getStops() {
    return this.stops;
  }

  getTourStops() {
    return this.stops;
  }
}

// Global functions for compatibility
function startJourney() {
  if (window.tourManager && window.navigationManager) {
    if (window.tourManager.stops.length >= 2) {
      // Start turn-by-turn navigation
      window.navigationManager.startNavigation(window.tourManager.stops);
    } else if (window.tourManager.stops.length === 1) {
      alert('Please add a destination to start your journey.');
    } else {
      alert('Please add at least one location to start your journey.');
    }
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

function updateTravelMode() {
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

function getWeatherInfo() {
  if (window.tourManager && window.tourManager.stops.length > 0) {
    const stops = window.tourManager.getStops();
    const lastStop = stops[stops.length - 1];
    Utils.getWeather(`${lastStop.lat},${lastStop.lng}`).then(weather => {
      if (weather) {
        alert(`Weather: ${weather.condition}, ${weather.temperature}°C`);
      }
    });
  }
}

function cacheCurrentArea() {
  console.log('Caching current area for offline use');
}

function toggleMobileView() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('mobile-open');
  }
}

// Initialize tour manager
window.addEventListener('DOMContentLoaded', () => {
  window.tourManager = new TourManager();
});