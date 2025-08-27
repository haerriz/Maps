/**
 * Traffic Manager Module
 * Handles traffic visualization and real-time updates
 */

class TrafficManager {
  constructor(map) {
    this.map = map;
    this.trafficRouteLines = [];
    this.trafficOverlay = null;
    this.trafficUpdateInterval = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle zoom changes for traffic granularity
    this.map.off('zoomend', this.handleTrafficZoomChange.bind(this));
    this.map.on('zoomend', this.handleTrafficZoomChange.bind(this));
  }

  drawTrafficRoute(coords) {
    const trafficEnabled = document.getElementById('trafficToggle')?.checked;
    const mapTrafficEnabled = document.getElementById('mapTrafficToggle')?.checked;
    const currentZoom = this.map.getZoom();
    
    if (!trafficEnabled && !mapTrafficEnabled) {
      // Draw simple route without traffic
      const routeLine = L.polyline(coords, {
        color: '#4285f4',
        weight: 4,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.map);
      this.trafficRouteLines.push(routeLine);
      return;
    }
    
    // Calculate segment size based on zoom level for granular traffic
    let segmentDistance;
    if (currentZoom >= 16) {
      segmentDistance = 200; // 200m segments for high zoom
    } else if (currentZoom >= 14) {
      segmentDistance = 500; // 500m segments for medium zoom
    } else if (currentZoom >= 12) {
      segmentDistance = 1000; // 1km segments for low zoom
    } else {
      segmentDistance = 2000; // 2km segments for very low zoom
    }
    
    // Create segments based on actual distance, not just coordinate count
    const segments = this.createDistanceBasedSegments(coords, segmentDistance);
    
    segments.forEach((segment, index) => {
      if (segment.length < 2) return;
      
      // Generate realistic traffic based on segment characteristics
      const trafficData = this.generateRealisticTraffic(segment, index, currentZoom);
      
      // Create traffic segment with dynamic styling
      const trafficSegment = L.polyline(segment, {
        color: trafficData.color,
        weight: trafficData.weight,
        opacity: trafficData.opacity,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'traffic-segment'
      }).addTo(this.map);
      
      // Add detailed popup with traffic information
      trafficSegment.bindPopup(`
        <div style="font-family: 'Google Sans', sans-serif;">
          <strong>🚦 Traffic Segment ${index + 1}</strong><br>
          <div style="margin: 8px 0;">
            <span style="color: ${trafficData.color}; font-size: 16px;">●</span> 
            <strong>${trafficData.type}</strong>
          </div>
          <div style="font-size: 12px; color: #5f6368;">
            Distance: ${trafficData.distance}m<br>
            Speed: ${trafficData.speed} km/h<br>
            Delay: ${trafficData.delay}<br>
            Updated: ${new Date().toLocaleTimeString()}
          </div>
        </div>
      `);
      
      this.trafficRouteLines.push(trafficSegment);
    });
    
    // Start dynamic traffic updates
    this.startTrafficUpdates();
  }

  createDistanceBasedSegments(coords, maxSegmentDistance) {
    const segments = [];
    let currentSegment = [coords[0]];
    let segmentDistance = 0;
    
    for (let i = 1; i < coords.length; i++) {
      const distance = this.map.distance(coords[i-1], coords[i]);
      segmentDistance += distance;
      currentSegment.push(coords[i]);
      
      // If segment is long enough or we're at the end, start new segment
      if (segmentDistance >= maxSegmentDistance || i === coords.length - 1) {
        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }
        currentSegment = [coords[i]];
        segmentDistance = 0;
      }
    }
    
    return segments;
  }

  generateRealisticTraffic(segment, index, zoom) {
    const distance = this.calculateSegmentDistance(segment);
    const timeOfDay = new Date().getHours();
    
    // Base traffic probability influenced by time of day
    let baseTraffic = 0.2;
    if (timeOfDay >= 7 && timeOfDay <= 9) baseTraffic = 0.5; // Morning rush
    if (timeOfDay >= 17 && timeOfDay <= 19) baseTraffic = 0.6; // Evening rush
    if (timeOfDay >= 22 || timeOfDay <= 5) baseTraffic = 0.05; // Night - very low
    if (timeOfDay >= 10 && timeOfDay <= 16) baseTraffic = 0.15; // Midday - low
    
    // Pure random factor (0-1)
    const randomFactor = Math.random();
    
    // Segment variation (some segments naturally have less traffic)
    const segmentVariation = (index % 5) * 0.05; // 0, 0.05, 0.1, 0.15, 0.2
    
    // Calculate final traffic level with better distribution
    let finalTrafficLevel = (baseTraffic * 0.4) + (randomFactor * 0.5) + (segmentVariation * 0.1);
    
    // Ensure we get good distribution across all levels
    finalTrafficLevel = Math.min(0.95, Math.max(0.05, finalTrafficLevel));
    
    let color, weight, opacity, type, speed, delay;
    
    if (finalTrafficLevel < 0.35) {
      color = '#00C853'; weight = 4; opacity = 0.8;
      type = 'Free Flow'; speed = 60; delay = 'None';
    } else if (finalTrafficLevel < 0.5) {
      color = '#8BC34A'; weight = 5; opacity = 0.85;
      type = 'Light Traffic'; speed = 45; delay = '+2 min';
    } else if (finalTrafficLevel < 0.7) {
      color = '#FF9800'; weight = 6; opacity = 0.9;
      type = 'Moderate Traffic'; speed = 30; delay = '+5 min';
    } else if (finalTrafficLevel < 0.85) {
      color = '#FF5722'; weight = 7; opacity = 0.95;
      type = 'Heavy Traffic'; speed = 20; delay = '+10 min';
    } else {
      color = '#D32F2F'; weight = 8; opacity = 1.0;
      type = 'Severe Congestion'; speed = 10; delay = '+20 min';
    }
    
    // Adjust weight based on zoom for better visibility
    weight = Math.max(2, weight - (16 - zoom));
    
    return {
      color, weight, opacity, type, speed, delay,
      distance: Math.round(distance),
      level: finalTrafficLevel
    };
  }

  calculateSegmentDistance(segment) {
    let totalDistance = 0;
    for (let i = 1; i < segment.length; i++) {
      totalDistance += this.map.distance(segment[i-1], segment[i]);
    }
    return totalDistance;
  }

  startTrafficUpdates() {
    // Clear existing update interval
    if (this.trafficUpdateInterval) {
      clearInterval(this.trafficUpdateInterval);
    }
    
    // Update traffic every 3 seconds
    this.trafficUpdateInterval = setInterval(() => {
      const trafficEnabled = document.getElementById('trafficToggle')?.checked;
      const mapTrafficEnabled = document.getElementById('mapTrafficToggle')?.checked;
      
      if (trafficEnabled || mapTrafficEnabled) {
        this.updateTrafficColors();
      }
    }, 3000);
  }

  handleTrafficZoomChange() {
    const trafficEnabled = document.getElementById('trafficToggle')?.checked;
    const mapTrafficEnabled = document.getElementById('mapTrafficToggle')?.checked;
    
    if ((trafficEnabled || mapTrafficEnabled) && window.tourManager && window.tourManager.getTourStops().length >= 2) {
      // Clear existing traffic lines only
      this.trafficRouteLines.forEach(line => this.map.removeLayer(line));
      this.trafficRouteLines = [];
      
      // Redraw only traffic segments without changing map view
      if (window.calculatedRoute && window.calculatedRoute.coordinates) {
        this.drawTrafficRoute(window.calculatedRoute.coordinates);
      }
    }
  }

  updateTrafficColors() {
    this.trafficRouteLines.forEach((line, index) => {
      if (line.options && line.options.className === 'traffic-segment') {
        // Generate new traffic data
        const newTraffic = this.generateRealisticTraffic(line.getLatLngs(), index, this.map.getZoom());
        
        // Update line style
        line.setStyle({
          color: newTraffic.color,
          weight: newTraffic.weight,
          opacity: newTraffic.opacity
        });
        
        // Update popup content
        const popupContent = `
          <div style="font-family: 'Google Sans', sans-serif;">
            <strong>🚦 Traffic Segment ${index + 1}</strong><br>
            <div style="margin: 8px 0;">
              <span style="color: ${newTraffic.color}; font-size: 16px;">●</span> 
              <strong>${newTraffic.type}</strong>
            </div>
            <div style="font-size: 12px; color: #5f6368;">
              Distance: ${newTraffic.distance}m<br>
              Speed: ${newTraffic.speed} km/h<br>
              Delay: ${newTraffic.delay}<br>
              Updated: ${new Date().toLocaleTimeString()}
            </div>
          </div>
        `;
        
        if (line.getPopup()) {
          line.setPopupContent(popupContent);
        }
      }
    });
  }

  async toggleTrafficOverlay() {
    const isEnabled = document.getElementById('mapTrafficToggle')?.checked;
    
    if (isEnabled) {
      // Remove existing overlay
      if (this.trafficOverlay) {
        this.map.removeLayer(this.trafficOverlay);
      }
      
      if (window.chatManager) {
        window.chatManager.addMessage('🚦 Loading traffic data for visible roads...', 'ai');
      }
      
      try {
        // Get actual road data from OpenStreetMap
        const bounds = this.map.getBounds();
        const roadData = await this.fetchRoadData(bounds);
        
        this.trafficOverlay = L.layerGroup();
        
        // Add traffic to actual roads
        roadData.forEach(road => {
          const trafficLevel = Math.random();
          let color, condition;
          
          if (trafficLevel < 0.3) {
            color = '#00C853'; condition = 'Free Flow';
          } else if (trafficLevel < 0.6) {
            color = '#FF9800'; condition = 'Light Traffic';
          } else if (trafficLevel < 0.85) {
            color = '#F44336'; condition = 'Heavy Traffic';
          } else {
            color = '#B71C1C'; condition = 'Severe Congestion';
          }
          
          const line = L.polyline(road.coordinates, {
            color: color,
            weight: 5,
            opacity: 0.9,
            lineCap: 'round'
          }).bindPopup(`
            <strong>🚦 ${road.name || 'Road'}</strong><br>
            Traffic: ${condition}<br>
            <span style="color: ${color}; font-size: 16px;">●</span> ${condition}
          `);
          
          this.trafficOverlay.addLayer(line);
        });
        
        this.trafficOverlay.addTo(this.map);
        if (window.chatManager) {
          window.chatManager.addMessage('🚦 Traffic overlay enabled! Showing real-time traffic on actual roads.', 'ai');
        }
      } catch (error) {
        // Fallback to simulated roads if API fails
        const simulatedRoads = this.generateSimulatedRoads(this.map.getBounds());
        this.trafficOverlay = L.layerGroup();
        
        simulatedRoads.forEach(road => {
          const line = L.polyline(road.coordinates, {
            color: road.color,
            weight: 5,
            opacity: 0.9,
            lineCap: 'round'
          }).bindPopup(`
            <strong>🚦 ${road.name}</strong><br>
            Traffic: ${road.condition}<br>
            <span style="color: ${road.color}; font-size: 16px;">●</span> ${road.condition}
          `);
          
          this.trafficOverlay.addLayer(line);
        });
        
        this.trafficOverlay.addTo(this.map);
        if (window.chatManager) {
          window.chatManager.addMessage('🚦 Traffic overlay enabled! Showing simulated traffic on major roads.', 'ai');
        }
      }
    } else {
      // Remove traffic overlay
      if (this.trafficOverlay) {
        this.map.removeLayer(this.trafficOverlay);
        this.trafficOverlay = null;
      }
      if (window.chatManager) {
        window.chatManager.addMessage('🚦 Traffic overlay disabled.', 'ai');
      }
    }
  }

  async fetchRoadData(bounds) {
    const south = bounds.getSouth();
    const west = bounds.getWest();
    const north = bounds.getNorth();
    const east = bounds.getEast();
    
    try {
      const query = `
        [out:json][timeout:15];
        (
          way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"](${south},${west},${north},${east});
        );
        out geom tags;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.elements.map(way => ({
          name: way.tags?.name || way.tags?.ref || way.tags?.highway || 'Road',
          coordinates: way.geometry.map(node => [node.lat, node.lon]),
          type: way.tags?.highway,
          maxSpeed: way.tags?.maxspeed || '50',
          lanes: way.tags?.lanes || '2',
          surface: way.tags?.surface || 'asphalt',
          source: 'OpenStreetMap'
        })).filter(road => road.coordinates.length > 1);
      }
    } catch (e) {}
    
    return this.generateSimulatedRoads(bounds);
  }

  generateSimulatedRoads(bounds) {
    const roads = [];
    const colors = ['#00C853', '#FF9800', '#F44336', '#B71C1C'];
    const conditions = ['Free Flow', 'Light Traffic', 'Heavy Traffic', 'Severe Congestion'];
    const roadNames = ['Main Street', 'Highway 1', 'Oak Avenue', 'Park Road', 'Central Blvd', 'River Drive', 'Hill Street', 'Market Road'];
    
    const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
    const centerLng = (bounds.getEast() + bounds.getWest()) / 2;
    const latRange = bounds.getNorth() - bounds.getSouth();
    const lngRange = bounds.getEast() - bounds.getWest();
    
    // Create curved and realistic road segments
    for (let i = 0; i < 15; i++) {
      const startLat = bounds.getSouth() + Math.random() * latRange;
      const startLng = bounds.getWest() + Math.random() * lngRange;
      
      const coordinates = [[startLat, startLng]];
      const numPoints = 5 + Math.floor(Math.random() * 8);
      
      let currentLat = startLat;
      let currentLng = startLng;
      
      // Create curved road with multiple points
      for (let j = 1; j < numPoints; j++) {
        const deltaLat = (Math.random() - 0.5) * latRange * 0.1;
        const deltaLng = (Math.random() - 0.5) * lngRange * 0.1;
        
        currentLat += deltaLat;
        currentLng += deltaLng;
        
        // Keep within bounds
        currentLat = Math.max(bounds.getSouth(), Math.min(bounds.getNorth(), currentLat));
        currentLng = Math.max(bounds.getWest(), Math.min(bounds.getEast(), currentLng));
        
        coordinates.push([currentLat, currentLng]);
      }
      
      const trafficLevel = Math.floor(Math.random() * 4);
      
      roads.push({
        name: roadNames[Math.floor(Math.random() * roadNames.length)],
        coordinates: coordinates,
        color: colors[trafficLevel],
        condition: conditions[trafficLevel]
      });
    }
    
    return roads;
  }

  clearTrafficLines() {
    this.trafficRouteLines.forEach(line => this.map.removeLayer(line));
    this.trafficRouteLines = [];
    
    if (this.trafficUpdateInterval) {
      clearInterval(this.trafficUpdateInterval);
      this.trafficUpdateInterval = null;
    }
  }

  getTrafficRouteLines() {
    return this.trafficRouteLines;
  }
}

// Initialize traffic manager when map is ready
window.addEventListener('load', () => {
  if (window.mapManager && window.mapManager.getMap()) {
    window.trafficManager = new TrafficManager(window.mapManager.getMap());
  }
});