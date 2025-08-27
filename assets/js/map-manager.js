/**
 * Map Manager Module
 * Handles map initialization, layers, and 3D features
 */

class MapManager {
  constructor() {
    this.map = null;
    this.layers = {};
    this.is3DMode = false;
    this.currentZoom = 5;
    this.currentCenter = [20.5937, 78.9629];
    this.init();
  }

  init() {
    // Initialize map with 3D-like features
    this.map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      maxZoom: 20,
      minZoom: 3
    }).setView(this.currentCenter, this.currentZoom);

    // Add custom zoom control
    L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map);

    this.setupLayers();
    this.setup3DControls();
    this.setupEventListeners();
  }

  setupLayers() {
    // Enhanced tile layers with offline caching support
    this.layers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
      maxZoom: 20,
      useCache: true,
      crossOrigin: true
    });

    this.layers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      useCache: true,
      crossOrigin: true
    });

    this.layers.terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png', {
      attribution: '&copy; Stamen Design',
      maxZoom: 18,
      useCache: true,
      crossOrigin: true
    });

    this.layers.navigation = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      useCache: true,
      crossOrigin: true
    });

    // Default to street view
    this.layers.street.addTo(this.map);

    // Layer control
    const baseLayers = {
      "Street": this.layers.street,
      "Navigation": this.layers.navigation,
      "Satellite": this.layers.satellite,
      "Terrain": this.layers.terrain
    };

    L.control.layers(baseLayers).addTo(this.map);
  }

  setup3DControls() {
    // 3D toggle button
    const toggle3DButton = L.control({ position: 'topright' });
    toggle3DButton.onAdd = () => {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = `<a href="#" title="Toggle 3D Navigation" id="toggle3D" style="
        background: white;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: #333;
        font-size: 18px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      ">🌍</a>`;

      div.onclick = (e) => {
        e.preventDefault();
        this.toggle3DNavigation();
      };

      return div;
    };
    toggle3DButton.addTo(this.map);
  }

  setupEventListeners() {
    this.map.on('zoom', () => {
      this.currentZoom = this.map.getZoom();
      if (this.is3DMode) {
        this.apply3DEffects();
      }
    });

    this.map.on('move', () => {
      this.currentCenter = this.map.getCenter();
      if (this.is3DMode) {
        this.apply3DEffects();
      }
    });
  }

  toggle3DNavigation() {
    this.is3DMode = !this.is3DMode;
    if (this.is3DMode) {
      this.apply3DEffects();
    } else {
      this.remove3DEffects();
    }
  }

  apply3DEffects() {
    // Add 3D-like visual effects
    const mapContainer = document.getElementById('map');
    if (this.is3DMode) {
      mapContainer.style.transform = 'perspective(1000px) rotateX(15deg)';
      mapContainer.style.transformOrigin = 'center bottom';
    }
  }

  remove3DEffects() {
    const mapContainer = document.getElementById('map');
    mapContainer.style.transform = 'none';
  }

  preloadTilesForArea(bounds, zoomLevels = [10, 12, 14]) {
    if (!bounds) bounds = this.map.getBounds();
    
    if (window.chatManager) {
      window.chatManager.addMessage('📥 Caching map tiles for offline use...', 'ai');
    }
    
    const currentLayer = this.map._layers[Object.keys(this.map._layers).find(key => this.map._layers[key]._url)];
    if (!currentLayer) return;
    
    let totalTiles = 0;
    let cachedTiles = 0;
    
    zoomLevels.forEach(zoom => {
      const tileBounds = L.bounds(
        this.map.project(bounds.getSouthWest(), zoom).divideBy(256).floor(),
        this.map.project(bounds.getNorthEast(), zoom).divideBy(256).ceil()
      );
      
      for (let x = tileBounds.min.x; x <= tileBounds.max.x; x++) {
        for (let y = tileBounds.min.y; y <= tileBounds.max.y; y++) {
          totalTiles++;
          const tileUrl = currentLayer._url
            .replace('{s}', currentLayer.options.subdomains[0] || 'a')
            .replace('{z}', zoom)
            .replace('{x}', x)
            .replace('{y}', y);
          
          fetch(tileUrl).then(() => {
            cachedTiles++;
            if (cachedTiles === totalTiles && window.chatManager) {
              window.chatManager.addMessage(`✅ Cached ${totalTiles} map tiles for offline use!`, 'ai');
            }
          }).catch(() => {});
        }
      }
    });
  }

  getMap() {
    return this.map;
  }
}

// Initialize map manager
window.mapManager = new MapManager();