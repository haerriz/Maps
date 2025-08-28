// 3D Map Manager - Pseudo-3D effects for navigation
class Map3DManager {
  constructor() {
    this.is3DMode = false;
    this.tiltAngle = 45; // degrees
    this.bearing = 0; // compass bearing
    this.buildingsLayer = null;
    this.shadowsEnabled = true;
  }

  enable3DMode() {
    if (this.is3DMode) return;
    
    this.is3DMode = true;
    
    // Add 3D CSS transforms to map container
    this.apply3DTransforms();
    
    // Add building shadows and elevation effects
    this.addBuildingEffects();
    
    // Add terrain-like styling
    this.enhanceMapStyling();
    
    // Add 3D route visualization
    this.enhance3DRoute();
    
    console.log('3D navigation mode enabled');
  }

  disable3DMode() {
    if (!this.is3DMode) return;
    
    this.is3DMode = false;
    
    // Remove 3D transforms
    this.remove3DTransforms();
    
    // Remove building effects
    this.removeBuildingEffects();
    
    // Reset map styling
    this.resetMapStyling();
    
    console.log('3D navigation mode disabled');
  }

  apply3DTransforms() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Apply subtle 3D transforms directly to map
    mapContainer.style.transform = `perspective(2000px) rotateX(15deg)`;
    mapContainer.style.transformOrigin = 'center bottom';
    mapContainer.style.transition = 'transform 0.5s ease';
    mapContainer.classList.add('map-3d-enhanced');
  }

  remove3DTransforms() {
    const mapContainer = document.getElementById('map');
    
    if (mapContainer) {
      mapContainer.style.transform = '';
      mapContainer.style.transformOrigin = '';
      mapContainer.style.transition = '';
      mapContainer.classList.remove('map-3d-enhanced');
    }
  }

  addBuildingEffects() {
    // Add minimal CSS for enhanced visuals
    const style3D = document.createElement('style');
    style3D.id = 'map3DStyles';
    style3D.textContent = `
      .map-3d-enhanced .leaflet-interactive {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      }
      
      .map-3d-enhanced .leaflet-marker-icon {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      }
      
      .map-3d-enhanced .user-location-marker {
        filter: drop-shadow(0 3px 6px rgba(66, 133, 244, 0.5));
      }
    `;
    
    document.head.appendChild(style3D);
  }

  addPseudoBuildings() {
    // Skip building generation to prevent performance issues
    console.log('3D buildings disabled for performance');
  }

  removeBuildingEffects() {
    const style3D = document.getElementById('map3DStyles');
    if (style3D) {
      style3D.remove();
    }
    
    if (this.buildingsLayer && window.mapManager && window.mapManager.map) {
      window.mapManager.map.removeLayer(this.buildingsLayer);
      this.buildingsLayer = null;
    }
  }

  enhanceMapStyling() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.classList.add('map-3d-enhanced');
    }
  }

  resetMapStyling() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.classList.remove('map-3d-enhanced');
    }
  }

  enhance3DRoute() {
    // Add elevated route styling
    const routeStyle = document.createElement('style');
    routeStyle.id = 'route3DStyles';
    routeStyle.textContent = `
      .navigation-route-3d {
        stroke: #1a73e8 !important;
        stroke-width: 8px !important;
        stroke-opacity: 0.9 !important;
        filter: drop-shadow(0 4px 12px rgba(26, 115, 232, 0.6)) !important;
        z-index: 1000 !important;
      }
      
      .navigation-route-3d::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, rgba(26, 115, 232, 0.3), rgba(26, 115, 232, 0.1));
        z-index: -1;
      }
    `;
    
    document.head.appendChild(routeStyle);
  }

  updateBearing(heading) {
    if (!this.is3DMode) return;
    
    // Skip bearing rotation to prevent disorientation
    console.log('Bearing update:', heading);
  }

  adjustTilt(angle) {
    if (!this.is3DMode) return;
    
    this.tiltAngle = Math.max(0, Math.min(60, angle)); // Limit tilt between 0-60 degrees
    
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.style.transform = `perspective(1000px) rotateX(${this.tiltAngle}deg) rotateZ(${this.bearing}deg)`;
    }
  }

  // Smooth camera following for navigation
  followUserLocation(lat, lng, heading = 0) {
    if (!this.is3DMode || !window.mapManager) return;
    
    // Update map center smoothly
    window.mapManager.map.panTo([lat, lng], {
      animate: true,
      duration: 1.0
    });
    
    // Update bearing based on movement direction
    this.updateBearing(heading);
  }

  // Add terrain-like elevation effects
  addTerrainEffects() {
    const terrainStyle = document.createElement('style');
    terrainStyle.id = 'terrainEffects';
    terrainStyle.textContent = `
      .leaflet-tile-container {
        filter: 
          contrast(1.1) 
          brightness(0.95) 
          saturate(1.3)
          drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      }
      
      /* Water bodies */
      .leaflet-overlay-pane path[fill*="blue"],
      .leaflet-overlay-pane path[fill*="#4285f4"] {
        filter: 
          brightness(1.1) 
          saturate(1.4)
          drop-shadow(0 1px 3px rgba(66, 133, 244, 0.3));
      }
      
      /* Green areas (parks, forests) */
      .leaflet-overlay-pane path[fill*="green"],
      .leaflet-overlay-pane path[fill*="#34a853"] {
        filter: 
          brightness(1.05) 
          saturate(1.2)
          drop-shadow(0 1px 2px rgba(52, 168, 83, 0.2));
      }
    `;
    
    document.head.appendChild(terrainStyle);
  }
}

// Initialize 3D manager
window.addEventListener('DOMContentLoaded', () => {
  window.map3DManager = new Map3DManager();
});