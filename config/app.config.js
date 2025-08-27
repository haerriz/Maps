// Application configuration
const APP_CONFIG = {
  name: 'Haerriz Trip Planner',
  version: '2.0.0',
  description: 'AI-Powered Global Travel Route Optimizer',
  
  // Map configuration
  map: {
    defaultCenter: [20.5937, 78.9629],
    defaultZoom: 5,
    maxZoom: 20,
    minZoom: 3
  },
  
  // API endpoints
  apis: {
    nominatim: 'https://nominatim.openstreetmap.org',
    osrm: 'https://router.project-osrm.org',
    overpass: 'https://overpass-api.de/api/interpreter'
  },
  
  // Feature flags
  features: {
    offlineMode: true,
    trafficData: true,
    weatherInfo: true,
    multiModal: true
  },
  
  // UI settings
  ui: {
    sidebarWidth: 465,
    animationDuration: 300,
    theme: 'light'
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}