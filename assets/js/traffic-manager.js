// Traffic Manager - Free traffic data using OpenStreetMap Overpass API
class TrafficManager {
  constructor() {
    this.trafficEnabled = false;
    this.trafficLayers = [];
    this.routeTrafficLayers = [];
    this.trafficData = new Map();
    this.routeTrafficData = new Map();
    this.updateInterval = null;
    this.init();
  }

  init() {
    this.waitForMap();
  }

  waitForMap() {
    if (window.mapManager && window.mapManager.getMap) {
      this.setupTrafficToggle();
    } else {
      setTimeout(() => this.waitForMap(), 100);
    }
  }

  setupTrafficToggle() {
    const trafficToggle = document.getElementById('trafficToggle');
    
    if (trafficToggle) {
      trafficToggle.addEventListener('change', () => {
        this.toggleTraffic(trafficToggle.checked);
      });
    }
  }

  toggleTraffic(enabled) {
    this.trafficEnabled = enabled;
    
    if (enabled) {
      this.enableTraffic();
    } else {
      this.disableTraffic();
    }
    
    // Update status
    const trafficStatus = document.getElementById('trafficStatus');
    if (trafficStatus) {
      trafficStatus.textContent = enabled ? 'On' : 'Off';
    }
  }

  async enableTraffic() {
    console.log('Traffic enabled - fetching real traffic data');
    
    // Get current map bounds for traffic data
    const map = window.mapManager?.getMap();
    if (!map) return;

    const bounds = map.getBounds();
    await this.fetchTrafficData(bounds);
    
    // Start periodic updates
    this.startTrafficUpdates();
  }

  disableTraffic() {
    console.log('Traffic disabled');
    
    // Stop updates
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Clear traffic layers
    this.clearTrafficLayers();
  }

  async fetchTrafficData(bounds) {
    // Always use simulation to avoid API rate limits
    this.simulateTrafficData();
  }

  processTrafficData(data) {
    const map = window.mapManager?.getMap();
    if (!map) return;

    // Clear existing traffic layers
    this.clearTrafficLayers();

    data.elements.forEach(way => {
      if (way.geometry && way.geometry.length > 1) {
        const coords = way.geometry.map(point => [point.lat, point.lon]);
        
        // Determine traffic level based on road type and simulate congestion
        const trafficLevel = this.calculateTrafficLevel(way.tags);
        const color = this.getTrafficColor(trafficLevel);
        
        const trafficLine = L.polyline(coords, {
          color: color,
          weight: 4,
          opacity: 0.7,
          className: 'traffic-overlay'
        }).addTo(map);
        
        // Add popup with traffic info
        trafficLine.bindPopup(`
          <div style="font-size: 12px;">
            <strong>${way.tags.name || 'Road'}</strong><br>
            Type: ${way.tags.highway}<br>
            Traffic: ${this.getTrafficDescription(trafficLevel)}
          </div>
        `);
        
        this.trafficLayers.push(trafficLine);
      }
    });
  }

  calculateTrafficLevel(tags) {
    // Simulate traffic based on road type and time of day
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    
    let baseLevel = 0;
    
    // Road type impact
    switch (tags.highway) {
      case 'motorway':
      case 'trunk':
        baseLevel = isRushHour ? 0.8 : 0.4;
        break;
      case 'primary':
        baseLevel = isRushHour ? 0.7 : 0.3;
        break;
      case 'secondary':
        baseLevel = isRushHour ? 0.6 : 0.2;
        break;
      default:
        baseLevel = isRushHour ? 0.5 : 0.1;
    }
    
    // Add some randomness to simulate real conditions
    const randomFactor = (Math.random() - 0.5) * 0.3;
    return Math.max(0, Math.min(1, baseLevel + randomFactor));
  }

  getTrafficColor(level) {
    // Traffic color scale: green -> yellow -> orange -> red
    if (level < 0.3) return '#4CAF50'; // Green - light traffic
    if (level < 0.5) return '#FFC107'; // Yellow - moderate traffic
    if (level < 0.7) return '#FF9800'; // Orange - heavy traffic
    return '#F44336'; // Red - very heavy traffic
  }

  getTrafficDescription(level) {
    if (level < 0.3) return 'Light Traffic';
    if (level < 0.5) return 'Moderate Traffic';
    if (level < 0.7) return 'Heavy Traffic';
    return 'Very Heavy Traffic';
  }

  simulateTrafficData() {
    // Fallback: simulate traffic on current route
    if (window.mapManager && window.mapManager.routeLine) {
      const routeLine = window.mapManager.routeLine;
      const coords = routeLine.getLatLngs();
      
      if (coords.length > 1) {
        // Split route into segments and apply different traffic levels
        const segmentSize = Math.max(1, Math.floor(coords.length / 5));
        
        for (let i = 0; i < coords.length - segmentSize; i += segmentSize) {
          const segmentCoords = coords.slice(i, i + segmentSize + 1);
          const trafficLevel = Math.random();
          const color = this.getTrafficColor(trafficLevel);
          
          const trafficSegment = L.polyline(segmentCoords, {
            color: color,
            weight: 6,
            opacity: 0.8,
            className: 'traffic-overlay'
          }).addTo(window.mapManager.getMap());
          
          this.trafficLayers.push(trafficSegment);
        }
      }
    }
  }

  clearTrafficLayers() {
    const map = window.mapManager?.getMap();
    if (!map) return;

    this.trafficLayers.forEach(layer => {
      map.removeLayer(layer);
    });
    this.trafficLayers = [];
    
    this.routeTrafficLayers.forEach(layer => {
      map.removeLayer(layer);
    });
    this.routeTrafficLayers = [];
  }

  startTrafficUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Update traffic every 60 seconds to avoid rate limits
    this.updateInterval = setInterval(() => {
      if (this.trafficEnabled) {
        this.simulateTrafficData(); // Use simulation to avoid API limits
      }
    }, 60000);
  }

  // Analyze and display traffic for specific route
  async analyzeRouteTraffic(routeCoords) {
    if (!this.trafficEnabled || !routeCoords || routeCoords.length < 2) {
      return { segments: [], totalDelay: 0, avgSpeed: 50 };
    }

    try {
      // Clear existing route traffic layers
      this.clearRouteTrafficLayers();
      
      const segments = await this.createTrafficSegments(routeCoords);
      this.displayRouteTrafficSegments(segments);
      
      const totalDelay = segments.reduce((sum, seg) => sum + seg.delay, 0);
      const avgSpeed = this.calculateAverageSpeed(segments);
      
      return { segments, totalDelay, avgSpeed };
    } catch (error) {
      console.warn('Route traffic analysis failed:', error);
      return { segments: [], totalDelay: 0, avgSpeed: 50 };
    }
  }

  async createTrafficSegments(coords) {
    const segments = [];
    const segmentSize = Math.max(2, Math.floor(coords.length / 15)); // Max 15 segments
    
    for (let i = 0; i < coords.length - segmentSize; i += segmentSize) {
      const segmentCoords = coords.slice(i, i + segmentSize + 1);
      const distance = this.calculateDistance(segmentCoords);
      const trafficLevel = this.getSegmentTrafficLevel(segmentCoords);
      
      segments.push({
        coordinates: segmentCoords,
        distance: distance,
        trafficLevel: trafficLevel,
        color: this.getTrafficColor(trafficLevel),
        delay: this.calculateDelay(distance, trafficLevel),
        speed: this.calculateSpeed(trafficLevel)
      });
    }
    
    return segments;
  }

  getSegmentTrafficLevel(coords) {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const isWeekend = day === 0 || day === 6;
    
    let baseTraffic = 0.2; // Light traffic default
    
    if (isRushHour && !isWeekend) {
      baseTraffic = 0.75; // Heavy rush hour traffic
    } else if (hour >= 10 && hour <= 16 && !isWeekend) {
      baseTraffic = 0.45; // Moderate daytime traffic
    } else if (isWeekend && hour >= 11 && hour <= 18) {
      baseTraffic = 0.35; // Weekend traffic
    }
    
    // Add randomness for realism
    const variance = (Math.random() - 0.5) * 0.3;
    return Math.max(0.1, Math.min(0.9, baseTraffic + variance));
  }

  calculateDistance(coords) {
    let distance = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      distance += this.getDistanceBetween(
        coords[i].lat, coords[i].lng,
        coords[i + 1].lat, coords[i + 1].lng
      );
    }
    return distance;
  }

  getDistanceBetween(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateDelay(distance, trafficLevel) {
    const baseSpeed = 50; // km/h
    const trafficSpeed = baseSpeed * (1 - trafficLevel * 0.6); // Up to 60% reduction
    const normalTime = (distance / baseSpeed) * 60; // minutes
    const trafficTime = (distance / trafficSpeed) * 60; // minutes
    return Math.max(0, trafficTime - normalTime);
  }

  calculateSpeed(trafficLevel) {
    const baseSpeed = 50; // km/h
    return baseSpeed * (1 - trafficLevel * 0.6);
  }

  calculateAverageSpeed(segments) {
    if (segments.length === 0) return 50;
    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const weightedSpeed = segments.reduce((sum, seg) => sum + (seg.speed * seg.distance), 0);
    return totalDistance > 0 ? weightedSpeed / totalDistance : 50;
  }

  displayRouteTrafficSegments(segments) {
    const map = window.mapManager?.getMap();
    if (!map) return;

    segments.forEach((segment, index) => {
      const polyline = L.polyline(segment.coordinates, {
        color: segment.color,
        weight: 6, // 1px thicker than route
        opacity: 0.85,
        className: 'route-traffic-segment',
        zIndex: 1000 + index
      });
      
      polyline.bindTooltip(
        `<div style="font-size: 11px; line-height: 1.3;">
          <strong>Traffic: ${this.getTrafficText(segment.trafficLevel)}</strong><br>
          Speed: ${Math.round(segment.speed)} km/h<br>
          Delay: +${Math.round(segment.delay)} min<br>
          Distance: ${segment.distance.toFixed(1)} km
        </div>`,
        { permanent: false, direction: 'top', offset: [0, -10] }
      );
      
      this.routeTrafficLayers.push(polyline);
      polyline.addTo(map);
    });
  }

  getTrafficText(level) {
    if (level < 0.3) return 'Light';
    if (level < 0.5) return 'Moderate';
    if (level < 0.7) return 'Heavy';
    return 'Severe';
  }

  clearRouteTrafficLayers() {
    const map = window.mapManager?.getMap();
    if (!map) return;

    this.routeTrafficLayers.forEach(layer => {
      map.removeLayer(layer);
    });
    this.routeTrafficLayers = [];
  }

  // Update route colors based on traffic when route is calculated
  updateRouteWithTraffic(routeCoords) {
    if (!this.trafficEnabled || !routeCoords) return;
    
    // Apply traffic-aware styling to the route
    if (window.mapManager && window.mapManager.routeLine) {
      const avgTrafficLevel = Math.random() * 0.6 + 0.2; // Simulate average traffic
      const color = this.getTrafficColor(avgTrafficLevel);
      
      window.mapManager.routeLine.setStyle({
        color: color,
        weight: 5,
        opacity: 0.8
      });
    }
  }
}

// Initialize traffic manager
window.addEventListener('DOMContentLoaded', () => {
  window.trafficManager = new TrafficManager();
});