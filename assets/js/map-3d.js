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
    
    // Check if tiles are still loading after 3D transform
    setTimeout(() => {
      this.checkTileVisibility();
    }, 2000);
    
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

    // Apply very subtle 3D transforms to avoid hiding tiles
    mapContainer.style.transform = `perspective(2000px) rotateX(2deg)`;
    mapContainer.style.transformOrigin = 'center bottom';
    mapContainer.style.transition = 'transform 0.5s ease';
    mapContainer.style.height = '100vh';
    mapContainer.style.width = '100%';
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
    // Enhanced 3D visual effects with building-like shadows
    const style3D = document.createElement('style');
    style3D.id = 'map3DStyles';
    style3D.textContent = `
      .map-3d-enhanced .leaflet-interactive {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      }
      
      .map-3d-enhanced .leaflet-marker-icon {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        transform: translateZ(10px);
      }
      
      .map-3d-enhanced .user-location-marker {
        filter: drop-shadow(0 3px 6px rgba(66, 133, 244, 0.5));
        transform: translateZ(15px);
      }
      
      /* Pseudo-building effects using map features */
      .map-3d-enhanced .leaflet-tile {
        transform-style: preserve-3d;
      }
      
      /* Enhanced road elevation */
      .map-3d-enhanced .leaflet-overlay-pane path[stroke] {
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
        transform: translateZ(2px);
      }
      
      /* Building-like blocks for urban areas */
      .map-3d-enhanced .leaflet-tile-container::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, 
          transparent 0%, 
          rgba(0,0,0,0.02) 25%, 
          transparent 50%, 
          rgba(0,0,0,0.02) 75%, 
          transparent 100%);
        pointer-events: none;
        z-index: 1;
      }
    `;
    
    document.head.appendChild(style3D);
    
    // Add terrain elevation effects
    this.addTerrainEffects();
  }

  addPseudoBuildings() {
    // Add CSS-based building-like effects for urban visualization
    if (!window.mapManager || !window.mapManager.map) return;
    
    const buildingStyle = document.createElement('style');
    buildingStyle.id = 'pseudoBuildings';
    buildingStyle.textContent = `
      /* Urban area highlighting */
      .leaflet-tile[src*="openstreetmap"] {
        filter: contrast(1.1) brightness(0.98);
      }
      
      /* Simulate building shadows on tiles */
      .map-3d-enhanced .leaflet-tile-pane {
        filter: 
          drop-shadow(2px 2px 4px rgba(0,0,0,0.1))
          drop-shadow(-1px -1px 2px rgba(255,255,255,0.1));
      }
      
      /* Enhanced markers to look more 3D */
      .map-3d-enhanced .leaflet-marker-pane .leaflet-marker-icon {
        transform: perspective(100px) rotateX(5deg) translateZ(5px);
        transition: transform 0.3s ease;
      }
      
      .map-3d-enhanced .leaflet-marker-pane .leaflet-marker-icon:hover {
        transform: perspective(100px) rotateX(5deg) translateZ(10px) scale(1.1);
      }
    `;
    
    document.head.appendChild(buildingStyle);
    console.log('Enhanced 3D building effects applied');
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
    
    // Smooth bearing rotation with limits to prevent disorientation
    const normalizedHeading = ((heading % 360) + 360) % 360;
    const currentBearing = this.bearing;
    
    // Calculate shortest rotation path
    let bearingDiff = normalizedHeading - currentBearing;
    if (bearingDiff > 180) bearingDiff -= 360;
    if (bearingDiff < -180) bearingDiff += 360;
    
    // Apply gradual bearing change (max 5 degrees per update)
    const maxChange = 5;
    const actualChange = Math.max(-maxChange, Math.min(maxChange, bearingDiff));
    this.bearing = ((currentBearing + actualChange) % 360 + 360) % 360;
    
    // Apply rotation to map container with proper containment
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.style.transform = `perspective(2000px) rotateX(${Math.min(this.tiltAngle, 3)}deg) rotateZ(${-this.bearing}deg)`;
      mapContainer.style.transition = 'transform 0.5s ease-out';
    }
    
    console.log(`Bearing updated: ${currentBearing}° → ${this.bearing}° (heading: ${normalizedHeading}°)`);
  }

  adjustTilt(angle) {
    if (!this.is3DMode) return;
    
    this.tiltAngle = Math.max(0, Math.min(60, angle)); // Limit tilt between 0-60 degrees
    
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.style.transform = `perspective(2000px) rotateX(${Math.min(this.tiltAngle, 3)}deg) rotateZ(${this.bearing}deg)`;
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

  checkTileVisibility() {
    const tiles = document.querySelectorAll('.leaflet-tile');
    const visibleTiles = Array.from(tiles).filter(tile => {
      const rect = tile.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    
    if (visibleTiles.length === 0) {
      console.warn('No tiles visible in 3D mode, disabling 3D effects');
      this.disable3DMode();
    }
  }
}

// Initialize 3D manager
window.addEventListener('DOMContentLoaded', () => {
  window.map3DManager = new Map3DManager();
});