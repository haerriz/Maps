// Application Configuration - Free APIs Only (no API keys required)
const CONFIG = {
  // ── Map Tiles (OpenStreetMap) ─────────────────────────────────
  MAP_PROVIDER: 'OpenStreetMap',
  MAP_TILES: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  MAP_ATTRIBUTION: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

  // ── Routing engines (OSRM primary, ORS optional with key) ────
  // OSRM public demo: free, keyless, supports driving / cycling / foot
  OSRM_URL: 'https://router.project-osrm.org/route/v1',
  // OpenRouteService: free key from openrouteservice.org (optional)
  // Set ORS_KEY to enable ORS as the active engine; leave empty to use OSRM.
  ORS_KEY: '',
  ORS_URL: 'https://api.openrouteservice.org/v2/directions',

  // ── Geocoding ─────────────────────────────────────────────────
  // Photon: CORS-safe, keyless, no rate limit, same OSM data
  PHOTON_URL: 'https://photon.komoot.io/api',
  // Nominatim: used only for REVERSE geocoding (stop name lookup)
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org',

  // ── POI / Nearby Places (Overpass API) ───────────────────────
  OVERPASS_ENDPOINTS: [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ],

  // ── Attractions (OpenTripMap-equivalent via Overpass tourism=*) ─
  // Uses free Overpass API with tourism=* tags — no key required

  // ── Weather (Open-Meteo) ─────────────────────────────────────
  WEATHER_URL: 'https://api.open-meteo.com/v1/forecast',

  // ── Elevation (Open-Elevation) ────────────────────────────────
  ELEVATION_URL: 'https://api.open-elevation.com/api/v1/lookup',

  // ── Map defaults ─────────────────────────────────────────────
  DEFAULT_ZOOM: 13,
  DEFAULT_CENTER: null, // set dynamically from browser geolocation
  MAX_ZOOM: 19,
  MIN_ZOOM: 2,

  async initializeLocation() {
    try {
      const userLocation = await Utils.getUserLocation();
      if (userLocation) {
        this.DEFAULT_CENTER = [userLocation.lat, userLocation.lng];
        return this.DEFAULT_CENTER;
      }
    } catch (e) { /* ignore */ }
    this.DEFAULT_CENTER = [13.0827, 80.2707]; // Chennai fallback
    return this.DEFAULT_CENTER;
  },

  // ── Transport modes → OSRM profile mapping ───────────────────
  TRANSPORT_MODES: {
    driving:  { icon: '🚗', label: 'Driving',  osrm: 'driving',  ors: 'driving-car' },
    walking:  { icon: '🚶', label: 'Walking',  osrm: 'foot',     ors: 'foot-walking' },
    cycling:  { icon: '🚴', label: 'Cycling',  osrm: 'bike',     ors: 'cycling-regular' },
    transit:  { icon: '🚌', label: 'Transit',  osrm: 'driving',  ors: 'driving-car' }
  },

  // Active routing engine: 'osrm' or 'ors' (auto-selected based on ORS_KEY)
  get ACTIVE_ROUTER() {
    return this.ORS_KEY ? 'ors' : 'osrm';
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}