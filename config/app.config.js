// Application Configuration - Free APIs Only
const CONFIG = {
  // Map Configuration
  MAP_PROVIDER: 'OpenStreetMap',
  MAP_TILES: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  MAP_ATTRIBUTION: '© OpenStreetMap contributors',
  
  // Routing Service (Free)
  ROUTING_SERVICE: 'OSRM',
  ROUTING_URL: 'https://router.project-osrm.org/route/v1',
  
  // Geocoding Service (Free)
  GEOCODING_SERVICE: 'Nominatim',
  GEOCODING_URL: 'https://nominatim.openstreetmap.org/search',
  
  // Weather Service (Free - No API Key Required)
  WEATHER_SERVICE: 'wttr.in',
  WEATHER_URL: 'https://wttr.in',
  
  // Currency Exchange (Free - No API Key Required)
  CURRENCY_SERVICE: 'fxratesapi',
  CURRENCY_URL: 'https://api.fxratesapi.com/latest',
  
  // Location Service (Free - No API Key Required)
  LOCATION_SERVICE: 'ipapi',
  LOCATION_URL: 'https://ipapi.co/json',
  
  // Traffic Data (Free via OpenStreetMap)
  TRAFFIC_SERVICE: 'overpass',
  TRAFFIC_URL: 'https://overpass-api.de/api/interpreter',
  
  // Default Settings
  DEFAULT_ZOOM: 13,
  DEFAULT_CENTER: [51.505, -0.09], // London
  MAX_ZOOM: 18,
  MIN_ZOOM: 2,
  
  // Rate Limiting
  RATE_LIMIT: {
    GEOCODING: 1000, // requests per hour
    ROUTING: 5000,   // requests per hour
    WEATHER: 1000,   // requests per hour
  },
  
  // Supported Languages
  LANGUAGES: ['en', 'es', 'fr', 'de', 'hi', 'zh', 'ja'],
  
  // Transport Modes
  TRANSPORT_MODES: {
    driving: { icon: '🚗', osrm: 'driving' },
    walking: { icon: '🚶', osrm: 'foot' },
    cycling: { icon: '🚴', osrm: 'bike' },
    transit: { icon: '🚌', osrm: 'driving' }, // Fallback to driving
    mixed: { icon: '🔄', osrm: 'driving' }
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}