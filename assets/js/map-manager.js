// Map Manager - Leaflet map integration
class MapManager {
  constructor() {
    this.map = null;
    this.markers = [];
    this.routeLine = null;
    this.userLocationMarker = null;
    this.userAccuracyCircle = null;
    this.init();
  }

  init() {
    this.initializeMap();
    this.setupEventListeners();
  }

  initializeMap() {
    // Initialize Leaflet map with proper zoom limits
    this.map = L.map('map', {
      minZoom: 2,
      maxZoom: 19,
      zoomControl: true
    }).setView([51.505, -0.09], 13);
    
    // Add OpenStreetMap tiles with proper zoom range
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      minZoom: 2,
      maxZoom: 19
    }).addTo(this.map);

    // Map click handler
    this.map.on('click', (e) => {
      this.addMarker(e.latlng);
    });
  }

  setupEventListeners() {
    // Additional map event listeners can be added here
  }

  addMarker(latlng, title = 'Location') {
    const marker = L.marker([latlng.lat, latlng.lng])
      .addTo(this.map)
      .bindPopup(latlng.name || title);
    
    this.markers.push(marker);
    
    // Auto-zoom to fit all markers
    this.fitMarkersToView();
    
    // Update tour stops if tour manager exists
    if (window.tourManager) {
      window.tourManager.addStop(latlng);
    }
    
    return marker;
  }

  showUserLocation(lat, lng, accuracy = 100) {
    // Remove existing user location marker
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }
    if (this.userAccuracyCircle) {
      this.map.removeLayer(this.userAccuracyCircle);
    }

    // Create accuracy circle (light blue)
    this.userAccuracyCircle = L.circle([lat, lng], {
      radius: accuracy,
      color: '#4285f4',
      fillColor: '#4285f4',
      fillOpacity: 0.1,
      weight: 1,
      opacity: 0.3
    }).addTo(this.map);

    // Create user location marker (blue dot)
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<div class="user-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    this.userLocationMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('Your Location');
  }

  updateUserLocationWithHeading(lat, lng, heading = 0) {
    // Remove existing user location marker
    if (this.userLocationMarker) {
      this.map.removeLayer(this.userLocationMarker);
    }

    // Create user location marker with compass direction
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="user-dot-with-compass">
          <div class="user-dot"></div>
          <div class="compass-triangle" style="transform: rotate(${heading}deg)"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.userLocationMarker = L.marker([lat, lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('Your Location');
  }

  fitMarkersToView() {
    if (this.markers.length === 0) return;
    
    if (this.markers.length === 1) {
      // Single marker - zoom to it
      const marker = this.markers[0];
      this.map.setView(marker.getLatLng(), 15);
    } else {
      // Multiple markers - fit bounds
      const group = new L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds(), {
        padding: [20, 20]
      });
    }
  }

  centerOnLocation(lat, lng, zoom = 15) {
    this.map.setView([lat, lng], zoom);
  }

  clearMarkers() {
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers = [];
  }

  updateMarkers(stops) {
    // Clear existing markers
    this.clearMarkers();
    
    // Add markers for current stops
    stops.forEach((stop, index) => {
      const marker = L.marker([stop.lat, stop.lng])
        .addTo(this.map)
        .bindPopup(stop.name || `Stop ${index + 1}`);
      this.markers.push(marker);
    });
    
    // Auto-fit bounds if markers exist
    if (stops.length > 0) {
      this.fitMarkersToView();
    }
  }

  clearRoute() {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }
  }

  drawRoute(coordinates) {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }
    
    this.routeLine = L.polyline(coordinates, {color: 'blue'}).addTo(this.map);
    this.map.fitBounds(this.routeLine.getBounds());
  }

  getMap() {
    return this.map;
  }
}

// Global functions for compatibility
function addCurrentLocationAsStop() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const latlng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      if (window.mapManager) {
        window.mapManager.addMarker(latlng);
      }
    });
  }
}

function updateTrafficMode() {
  // Traffic mode toggle functionality
  const toggle = document.getElementById('trafficToggle');
  const status = document.getElementById('trafficStatus');
  if (status) {
    status.textContent = toggle.checked ? 'On' : 'Off';
  }
}

// Initialize map manager
window.addEventListener('DOMContentLoaded', () => {
  window.mapManager = new MapManager();
});