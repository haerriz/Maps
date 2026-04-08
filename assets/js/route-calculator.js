// Route Calculator - Handles route calculation via OSRM (primary) or OpenRouteService (optional)
class RouteCalculator {
  constructor() {
    this.currentRoute = null;
  }

  // Returns the active OSRM profile for the selected travel mode
  getOsrmProfile() {
    const mode = document.getElementById('travelMode')?.value || 'driving';
    const profiles = { driving: 'driving', walking: 'foot', cycling: 'bike', transit: 'driving' };
    return profiles[mode] || 'driving';
  }

  // Returns the ORS profile string for the selected travel mode
  getOrsProfile() {
    const mode = document.getElementById('travelMode')?.value || 'driving';
    const profiles = {
      driving: 'driving-car',
      walking:  'foot-walking',
      cycling:  'cycling-regular',
      transit:  'driving-car'
    };
    return profiles[mode] || 'driving-car';
  }

  async calculateRoute(stops) {
    if (stops.length < 1) { this.clearRoute(); return null; }
    if (stops.length === 1) { this.handleSingleStop(stops[0]); return null; }

    // Try ORS first if a key is configured, then fall back to OSRM
    const config = window.CONFIG;
    if (config && config.ORS_KEY) {
      const orsResult = await this.calculateWithORS(stops, config);
      if (orsResult) return orsResult;
    }
    return await this.calculateWithOSRM(stops);
  }

  async calculateWithOSRM(stops) {
    try {
      const profile  = this.getOsrmProfile();
      const coordinates = stops.map(s => `${s.lng},${s.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`OSRM ${response.status}`);
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) return null;
      return this._processRoute(data.routes[0]);
    } catch (error) {
      console.error('OSRM route calculation failed:', error);
      return null;
    }
  }

  async calculateWithORS(stops, config) {
    try {
      const profile = this.getOrsProfile();
      const coordinates = stops.map(s => [s.lng, s.lat]);
      const url = `${config.ORS_URL}/${profile}/geojson`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.ORS_KEY
        },
        body: JSON.stringify({ coordinates })
      });

      if (!response.ok) {
        console.warn('ORS failed, falling back to OSRM:', response.status);
        return null;
      }

      const data = await response.json();
      if (!data.features || data.features.length === 0) return null;

      const feature = data.features[0];
      const props   = feature.properties.summary;
      this.currentRoute = feature.geometry.coordinates.map(c => [c[1], c[0]]);
      if (window.mapManager) window.mapManager.drawRoute(this.currentRoute);

      return {
        distance:     (props.distance / 1000).toFixed(1),
        duration:     Math.round(props.duration / 60),
        baseTime:     Math.round(props.duration / 60),
        trafficDelay: 0,
        avgSpeed:     50,
        engine:       'OpenRouteService'
      };
    } catch (error) {
      console.warn('ORS error, falling back to OSRM:', error);
      return null;
    }
  }

  async _processRoute(route) {
    this.currentRoute = route.geometry.coordinates.map(c => [c[1], c[0]]);
    if (window.mapManager) window.mapManager.drawRoute(this.currentRoute);

    let trafficData = { totalDelay: 0, avgSpeed: 50 };
    if (window.trafficManager && window.trafficManager.trafficEnabled) {
      const routeCoords = this.currentRoute.map(c => ({ lat: c[0], lng: c[1] }));
      trafficData = await window.trafficManager.analyzeRouteTraffic(routeCoords);
    }

    const baseTime = Math.round(route.duration / 60);
    return {
      distance:     (route.distance / 1000).toFixed(1),
      duration:     baseTime + Math.round(trafficData.totalDelay),
      baseTime:     baseTime,
      trafficDelay: Math.round(trafficData.totalDelay),
      avgSpeed:     Math.round(trafficData.avgSpeed),
      engine:       'OSRM'
    };
  }

  handleSingleStop(stop) {
    if (window.tourManager) window.tourManager.showSingleStopMessage();
  }

  clearRoute() {
    this.currentRoute = null;
    if (window.mapManager) window.mapManager.clearRoute();
    if (window.trafficManager) window.trafficManager.clearRouteTrafficLayers();
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.routeCalculator = new RouteCalculator();
});
