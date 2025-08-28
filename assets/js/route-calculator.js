// Route Calculator - Handles route calculation and optimization
class RouteCalculator {
  constructor() {
    this.currentRoute = null;
  }

  async calculateRoute(stops) {
    if (stops.length < 1) {
      this.clearRoute();
      return null;
    }

    // Single stop - show location only
    if (stops.length === 1) {
      this.handleSingleStop(stops[0]);
      return null;
    }

    try {
      const coordinates = stops.map(stop => `${stop.lng},${stop.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        this.currentRoute = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        // Display route on map
        if (window.mapManager) {
          window.mapManager.drawRoute(this.currentRoute);
        }
        
        // Analyze traffic if enabled
        let trafficData = { totalDelay: 0, avgSpeed: 50 };
        if (window.trafficManager && window.trafficManager.trafficEnabled) {
          const routeCoords = this.currentRoute.map(coord => ({ lat: coord[0], lng: coord[1] }));
          trafficData = await window.trafficManager.analyzeRouteTraffic(routeCoords);
        }
        
        // Calculate adjusted time with traffic
        const baseTime = Math.round(route.duration / 60);
        const adjustedTime = baseTime + Math.round(trafficData.totalDelay);
        
        const routeInfo = {
          distance: (route.distance / 1000).toFixed(1),
          duration: adjustedTime,
          baseTime: baseTime,
          trafficDelay: Math.round(trafficData.totalDelay),
          avgSpeed: Math.round(trafficData.avgSpeed)
        };
        
        return routeInfo;
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
    }
    
    return null;
  }

  handleSingleStop(stop) {
    // For single stop, just show message about needing destination
    if (window.tourManager) {
      window.tourManager.showSingleStopMessage();
    }
  }

  clearRoute() {
    this.currentRoute = null;
    if (window.mapManager) {
      window.mapManager.clearRoute();
    }
    if (window.trafficManager) {
      window.trafficManager.clearRouteTrafficLayers();
    }
  }

  getCurrentRoute() {
    return this.currentRoute;
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  window.routeCalculator = new RouteCalculator();
});