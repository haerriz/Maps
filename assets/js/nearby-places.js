// Nearby Places Manager
// Data source: Overpass API (overpass-api.de + kumi mirror)
// Three categories: amenities, attractions (tourism/leisure), transit
class NearbyPlacesManager {
  constructor() {
    this.lastApiCall = 0;
    this.apiRateLimit = 5000; // ms between calls
    this.updateTimeout = null;
    this.activeCategory = 'amenities';
  }

  // ── Public entry points ───────────────────────────────────────────────────

  async loadNearbyPlaces(category) {
    if (category) this.activeCategory = category;
    const center = this.getCurrentMapCenter();
    if (!center) return;

    const nearbyContainer = document.getElementById('nearbyPlaces');
    const statusEl        = document.getElementById('nearbyStatus');
    const now = Date.now();
    if (now - this.lastApiCall < this.apiRateLimit) {
      if (statusEl) statusEl.textContent = 'Please wait a moment...';
      return;
    }

    const locationLabel = this.getLocationSource();
    if (nearbyContainer) nearbyContainer.innerHTML = '<p class="loading-text">🔍 Searching...</p>';
    if (statusEl) statusEl.textContent = `Searching near ${locationLabel}...`;

    try {
      const places = await this.fetchByCategory(center.lat, center.lng, this.activeCategory);
      this.displayNearbyPlaces(places);
      if (statusEl) statusEl.textContent = `${places.length} places near ${locationLabel}`;
    } catch (error) {
      if (nearbyContainer) nearbyContainer.innerHTML = '<p class="no-places">Could not load places. Try again.</p>';
      if (statusEl) statusEl.textContent = 'Search failed';
    }
  }

  // ── Category routing ──────────────────────────────────────────────────────

  async fetchByCategory(lat, lng, category) {
    switch (category) {
      case 'attractions': return await this.fetchAttractions(lat, lng);
      case 'transit':     return await this.fetchTransit(lat, lng);
      default:            return await this.fetchAmenities(lat, lng);
    }
  }

  // ── Overpass queries ──────────────────────────────────────────────────────

  async fetchAmenities(lat, lng) {
    const tags = ['restaurant', 'cafe', 'hospital', 'bank', 'pharmacy', 'fuel', 'supermarket', 'atm'];
    const filters = tags.map(t => `node["amenity"="${t}"](around:1000,${lat},${lng});`).join('\n');
    return this.overpassQuery(`[out:json][timeout:12];\n(\n${filters}\n);\nout 15;`, lat, lng);
  }

  async fetchAttractions(lat, lng) {
    // OpenTripMap equivalent via Overpass tourism=* and leisure=* tags
    const filters = [
      `node["tourism"~"museum|attraction|viewpoint|artwork|hotel|hostel|camp_site|information"](around:2000,${lat},${lng});`,
      `node["leisure"~"park|garden|nature_reserve|stadium|sports_centre"](around:2000,${lat},${lng});`,
      `node["historic"~"monument|memorial|castle|ruins|archaeological_site"](around:2000,${lat},${lng});`,
      `way["tourism"~"museum|attraction|viewpoint"](around:2000,${lat},${lng});`,
      `way["historic"](around:2000,${lat},${lng});`
    ].join('\n');
    return this.overpassQuery(`[out:json][timeout:15];\n(\n${filters}\n);\nout center 20;`, lat, lng);
  }

  async fetchTransit(lat, lng) {
    const filters = [
      `node["highway"="bus_stop"](around:800,${lat},${lng});`,
      `node["railway"~"station|halt|tram_stop|subway_entrance"](around:1200,${lat},${lng});`,
      `node["amenity"~"taxi|ferry_terminal|bicycle_rental|car_rental"](around:1200,${lat},${lng});`,
      `node["aeroway"="aerodrome"](around:30000,${lat},${lng});`
    ].join('\n');
    return this.overpassQuery(`[out:json][timeout:12];\n(\n${filters}\n);\nout 20;`, lat, lng);
  }

  async overpassQuery(query, lat, lng) {
    this.lastApiCall = Date.now();
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`
        });
        if (!res.ok) { console.warn(`Overpass ${endpoint} → ${res.status}`); continue; }
        const data = await res.json();
        return (data.elements || [])
          .map(el => ({
            lat: el.lat ?? el.center?.lat,
            lon: el.lon ?? el.center?.lon,
            tags: el.tags || {}
          }))
          .filter(p => p.lat != null && p.lon != null)
          .slice(0, 20);
      } catch (err) {
        console.warn(`Overpass ${endpoint} error:`, err);
      }
    }
    throw new Error('All Overpass endpoints failed');
  }

  // ── Display ───────────────────────────────────────────────────────────────

  displayNearbyPlaces(places) {
    const container = document.getElementById('nearbyPlaces');
    if (!container) return;

    if (places.length === 0) {
      container.innerHTML = '<p class="no-places">No places found nearby. Try a different category or zoom area.</p>';
      return;
    }

    const html = places.map(place => {
      const name    = place.tags.name || place.tags.brand || this.getPlaceTypeLabel(place.tags);
      const address = this.getPlaceAddress(place.tags);
      const icon    = this.getPlaceIcon(place.tags);
      const type    = this.getPlaceType(place.tags);
      const safeName = name.replace(/'/g, "\\'");

      return `
        <div class="nearby-place" onclick="window.nearbyPlacesManager.addNearbyPlace(${place.lat}, ${place.lon}, '${safeName}')">
          <span class="place-icon">${icon}</span>
          <div class="place-info">
            <span class="place-name">${name}</span>
            <small class="place-type">${type}</small>
            ${address ? `<small class="place-address">${address}</small>` : ''}
          </div>
        </div>`;
    }).join('');

    container.innerHTML = html;
  }

  // ── Icon / label helpers ──────────────────────────────────────────────────

  getPlaceIcon(tags) {
    const a = tags.amenity, t = tags.tourism, l = tags.leisure, h = tags.historic, hw = tags.highway, r = tags.railway;
    if (a === 'restaurant') return '🍽️';
    if (a === 'cafe')       return '☕';
    if (a === 'hospital')   return '🏥';
    if (a === 'pharmacy')   return '💊';
    if (a === 'bank')       return '🏦';
    if (a === 'atm')        return '💳';
    if (a === 'fuel')       return '⛽';
    if (a === 'supermarket') return '🛒';
    if (a === 'taxi')       return '🚖';
    if (a === 'ferry_terminal') return '⛴️';
    if (a === 'bicycle_rental') return '🚲';
    if (a === 'car_rental') return '🚗';
    if (t === 'museum')     return '🏛️';
    if (t === 'viewpoint')  return '🔭';
    if (t === 'artwork')    return '🎨';
    if (t === 'hotel' || t === 'hostel') return '🏨';
    if (t === 'information') return 'ℹ️';
    if (t === 'camp_site')  return '⛺';
    if (t === 'attraction') return '🎡';
    if (l === 'park' || l === 'garden') return '🌳';
    if (l === 'nature_reserve') return '🌿';
    if (l === 'stadium' || l === 'sports_centre') return '🏟️';
    if (h === 'monument' || h === 'memorial') return '🗿';
    if (h === 'castle')     return '🏰';
    if (h === 'ruins' || h === 'archaeological_site') return '🏚️';
    if (hw === 'bus_stop')  return '🚌';
    if (r === 'station' || r === 'halt') return '🚉';
    if (r === 'tram_stop')  return '🚊';
    if (r === 'subway_entrance') return '🚇';
    if (tags.aeroway)       return '✈️';
    return '📍';
  }

  getPlaceType(tags) {
    const key = tags.amenity || tags.tourism || tags.leisure || tags.historic || tags.highway || tags.railway || tags.aeroway || 'place';
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getPlaceTypeLabel(tags) {
    return this.getPlaceType(tags) + ' nearby';
  }

  getPlaceAddress(tags) {
    const parts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getCurrentMapCenter() {
    if (window.locationManager?.userLocation) return window.locationManager.userLocation;
    if (window.tourManager?.stops.length > 0) {
      const s = window.tourManager.stops[window.tourManager.stops.length - 1];
      return { lat: s.lat, lng: s.lng };
    }
    if (window.mapManager?.map) {
      const c = window.mapManager.map.getCenter();
      return { lat: c.lat, lng: c.lng };
    }
    return null;
  }

  getLocationSource() {
    if (window.locationManager?.userLocation) return 'your location';
    if (window.tourManager?.stops.length > 0) return 'selected stop';
    return 'map center';
  }

  addNearbyPlace(lat, lng, name) {
    if (window.mapManager) window.mapManager.addMarker({ lat, lng, name });
  }

  setupMapMoveListener() {
    if (window.mapManager?.map) {
      window.mapManager.map.on('moveend', () => {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          if (Date.now() - this.lastApiCall > this.apiRateLimit) {
            this.loadNearbyPlaces();
          }
        }, 2500);
      });
    }
  }
}

// ── Global helpers ────────────────────────────────────────────────────────────
function loadNearbyPlaces(category) {
  if (window.nearbyPlacesManager) window.nearbyPlacesManager.loadNearbyPlaces(category);
}

function addNearbyPlace(lat, lng, name) {
  if (window.nearbyPlacesManager) window.nearbyPlacesManager.addNearbyPlace(lat, lng, name);
}

window.addEventListener('DOMContentLoaded', () => {
  window.nearbyPlacesManager = new NearbyPlacesManager();
  setTimeout(() => window.nearbyPlacesManager.setupMapMoveListener(), 2000);
});
