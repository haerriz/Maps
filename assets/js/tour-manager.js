/**
 * Tour Manager Module
 * Handles tour stops, route planning, and optimization
 */

class TourManager {
  constructor(map) {
    this.map = map;
    this.tourStops = [];
    this.markers = [];
    this.routeLine = null;
    this.trafficRouteLines = [];
    this.isJourneyStarted = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Map click handler
    this.map.on('click', (e) => {
      const name = prompt('Enter a name for this stop:');
      if (name) {
        this.addTourStop(e.latlng, name);
      }
    });
  }

  addTourStop(latlng, name) {
    // Create and add marker to map
    const marker = L.marker(latlng).addTo(this.map);
    marker.bindPopup(`<strong>${name}</strong><br>Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`);
    
    // Create stop object and add to arrays
    const stop = { latlng, name, marker };
    this.tourStops.push(stop);
    this.markers.push(marker);
    
    // Update UI elements
    this.updateStopsList();
    
    // Always draw optimized route when 2+ stops
    if (this.tourStops.length >= 2) {
      this.drawRealRoute();
    }
    
    // Update transport info if in transit mode
    const currentMode = document.getElementById('travelMode')?.value;
    if (currentMode === 'transit' && this.tourStops.length >= 2) {
      window.transportManager?.showTransportOptions();
    }
  }

  updateStopsList() {
    const stopsList = document.getElementById('stopsList');
    
    // Update total stops counter
    const totalStopsEl = document.getElementById('totalStops');
    if (totalStopsEl) totalStopsEl.textContent = this.tourStops.length;
    
    // Handle empty tour case
    if (this.tourStops.length === 0) {
      stopsList.innerHTML = `
        <div style="
          text-align: center;
          padding: 24px;
          color: #5f6368;
          font-family: 'Google Sans', sans-serif;
        ">
          <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;">📍</div>
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">No stops added yet</div>
          <div style="font-size: 12px;">Click on the map or search to add locations</div>
        </div>
      `;
      const totalDistanceEl = document.getElementById('totalDistance');
      if (totalDistanceEl) totalDistanceEl.textContent = '0 km';
      return;
    }
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < this.tourStops.length; i++) {
      totalDistance += this.map.distance(this.tourStops[i-1].latlng, this.tourStops[i].latlng);
    }
    const totalDistanceEl = document.getElementById('totalDistance');
    if (totalDistanceEl) totalDistanceEl.textContent = `${(totalDistance / 1000).toFixed(1)} km`;
    
    // Generate HTML for each stop
    stopsList.innerHTML = this.tourStops.map((stop, index) => {
      let distanceInfo = '';
      if (index > 0) {
        const dist = this.map.distance(this.tourStops[index-1].latlng, stop.latlng);
        distanceInfo = `<div style="font-size: 11px; color: #5f6368; margin-top: 2px;">${(dist/1000).toFixed(1)}km from previous</div>`;
      }
      
      return `
        <div class="stop-item" draggable="true" data-index="${index}" style="
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
          cursor: move;
        ">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(45deg, #4285f4, #1a73e8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            font-size: 14px;
            margin-right: 12px;
            box-shadow: 0 2px 4px rgba(66,133,244,0.3);
          ">${index + 1}</div>
          <div style="flex: 1;">
            <div style="
              font-weight: 500;
              font-size: 14px;
              color: #202124;
              font-family: 'Google Sans', sans-serif;
              line-height: 1.3;
            ">${stop.name}</div>
            ${distanceInfo}
          </div>
          <button onclick="window.tourManager.removeStop(${index})" style="
            background: #ea4335;
            color: white;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(234,67,53,0.3);
          ">
            <span class="material-icons" style="font-size: 16px;">close</span>
          </button>
        </div>
      `;
    }).join('');
    
    this.initDragAndDrop();
  }

  removeStop(index) {
    // Remove marker from map
    this.map.removeLayer(this.markers[index]);
    
    // Remove from arrays
    this.tourStops.splice(index, 1);
    this.markers.splice(index, 1);
    
    // Update UI
    this.updateStopsList();
    
    // Redraw route if multiple stops remain
    if (this.tourStops.length >= 2) {
      this.drawRealRoute();
    } else if (this.tourStops.length === 1) {
      // Clear route if only one stop remains
      if (this.routeLine) this.map.removeLayer(this.routeLine);
      this.trafficRouteLines.forEach(line => this.map.removeLayer(line));
      this.trafficRouteLines = [];
    }
  }

  initDragAndDrop() {
    const stopItems = document.querySelectorAll('.stop-item');
    let draggedElement = null;
    
    stopItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedElement = item;
        item.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });
      
      item.addEventListener('dragend', () => {
        item.style.opacity = '1';
        draggedElement = null;
      });
      
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedElement && draggedElement !== item) {
          const fromIndex = parseInt(draggedElement.dataset.index);
          const toIndex = parseInt(item.dataset.index);
          this.reorderStops(fromIndex, toIndex);
        }
      });
    });
  }

  reorderStops(fromIndex, toIndex) {
    // Reorder tour stops array
    const movedStop = this.tourStops.splice(fromIndex, 1)[0];
    this.tourStops.splice(toIndex, 0, movedStop);
    
    // Reorder markers array
    const movedMarker = this.markers.splice(fromIndex, 1)[0];
    this.markers.splice(toIndex, 0, movedMarker);
    
    // Update UI
    this.updateStopsList();
    
    // Redraw route if multiple stops
    if (this.tourStops.length >= 2) {
      this.drawRealRoute();
    }
    
    if (window.chatManager) {
      window.chatManager.addMessage(`🔄 Reordered stops! ${this.tourStops[toIndex].name} is now stop #${toIndex + 1}`, 'ai');
    }
  }

  async drawRealRoute() {
    if (this.tourStops.length < 2) {
      if (window.chatManager) {
        window.chatManager.addMessage('Add at least 2 stops to calculate a real route!', 'ai');
      }
      return;
    }
    
    if (window.chatManager) {
      window.chatManager.addMessage('🗺️ Calculating real route with turn-by-turn directions...', 'ai');
    }
    
    // Clear existing routes
    if (this.routeLine) this.map.removeLayer(this.routeLine);
    this.trafficRouteLines.forEach(line => this.map.removeLayer(line));
    this.trafficRouteLines = [];
    
    try {
      const mode = document.getElementById('travelMode')?.value || 'driving';
      const profile = mode === 'walking' ? 'foot' : mode === 'cycling' ? 'bike' : 'car';
      const trafficEnabled = document.getElementById('trafficToggle')?.checked;
      
      let allCoordinates = [];
      let totalDistance = 0;
      let totalDuration = 0;
      
      // Calculate route through all stops in sequence
      for (let i = 0; i < this.tourStops.length - 1; i++) {
        const start = this.tourStops[i];
        const end = this.tourStops[i + 1];
        
        const coordString = `${start.latlng.lng},${start.latlng.lat};${end.latlng.lng},${end.latlng.lat}`;
        const url = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&steps=true&annotations=true`;
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            
            allCoordinates.push(...coords);
            totalDistance += route.distance;
            totalDuration += route.duration;
          }
        } else {
          // Fallback to straight line for this segment
          allCoordinates.push([start.latlng.lat, start.latlng.lng], [end.latlng.lat, end.latlng.lng]);
        }
      }
      
      if (allCoordinates.length > 0) {
        // Draw enhanced route
        if (trafficEnabled && profile === 'car' && window.trafficManager) {
          window.trafficManager.drawTrafficRoute(allCoordinates);
        } else {
          const routeStyle = {
            color: '#4285f4',
            weight: 6,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
          };
          
          const mainRoute = L.polyline(allCoordinates, routeStyle).addTo(this.map);
          this.trafficRouteLines.push(mainRoute);
        }
        
        // Store route data for navigation
        window.calculatedRoute = {
          coordinates: allCoordinates,
          distance: totalDistance,
          duration: totalDuration
        };
        
        // Update UI
        const totalDistanceEl = document.getElementById('totalDistance');
        if (totalDistanceEl) totalDistanceEl.textContent = `${(totalDistance / 1000).toFixed(1)} km`;
        
        const routeTypeEl = document.getElementById('routeType');
        if (routeTypeEl) routeTypeEl.textContent = 'Real route';
        
        const hours = Math.floor(totalDuration / 3600);
        const minutes = Math.floor((totalDuration % 3600) / 60);
        const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        
        if (window.chatManager) {
          window.chatManager.addMessage(`✅ Real route calculated! Distance: ${(totalDistance / 1000).toFixed(1)}km, Time: ${timeStr}. Ready for navigation!`, 'ai');
        }
      }
    } catch (error) {
      if (window.chatManager) {
        window.chatManager.addMessage('❌ Could not calculate real route. Using direct connections.', 'ai');
      }
    }
  }

  clearTour() {
    if (confirm('Are you sure you want to clear all tour stops?')) {
      this.markers.forEach(marker => this.map.removeLayer(marker));
      if (this.routeLine) this.map.removeLayer(this.routeLine);
      this.trafficRouteLines.forEach(line => this.map.removeLayer(line));
      
      this.tourStops = [];
      this.markers = [];
      this.routeLine = null;
      this.trafficRouteLines = [];
      window.routeDrawn = false;
      
      this.updateStopsList();
      if (window.chatManager) {
        window.chatManager.addMessage('🆕 Journey cleared! Ready to plan your next amazing adventure.', 'ai');
      }
    }
  }

  exportTour() {
    if (this.tourStops.length === 0) {
      alert('Add some tour stops first!');
      return;
    }
    
    const tourData = {
      title: 'My Tour Plan',
      created: new Date().toISOString(),
      stops: this.tourStops.map((stop, index) => ({
        order: index + 1,
        name: stop.name,
        latitude: stop.latlng.lat,
        longitude: stop.latlng.lng
      })),
      travelMode: document.getElementById('travelMode')?.value || 'driving'
    };
    
    const dataStr = JSON.stringify(tourData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tour-plan.json';
    link.click();
    
    if (window.chatManager) {
      window.chatManager.addMessage('📤 Tour itinerary exported successfully! You can import this file later to restore your journey plan.', 'ai');
    }
  }

  getTourStops() {
    return this.tourStops;
  }

  getMarkers() {
    return this.markers;
  }
}

// Initialize tour manager when map is ready
window.addEventListener('load', () => {
  if (window.mapManager && window.mapManager.getMap()) {
    window.tourManager = new TourManager(window.mapManager.getMap());
  }
});