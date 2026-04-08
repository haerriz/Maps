// Utility Functions - Free API Integration
class Utils {
  
  // Currency conversion using free API
  static async getCurrencyRates(baseCurrency = 'USD') {
    try {
      const response = await fetch(`https://api.fxratesapi.com/latest?base=${baseCurrency}`);
      const data = await response.json();
      return data.rates;
    } catch (error) {

      return this.getFallbackRates();
    }
  }
  
  // Weather data using free wttr.in API
  static async getWeather(location) {
    try {
      const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
      const data = await response.json();
      return {
        temperature: data.current_condition[0].temp_C,
        condition: data.current_condition[0].weatherDesc[0].value,
        humidity: data.current_condition[0].humidity,
        windSpeed: data.current_condition[0].windspeedKmph,
        icon: this.getWeatherIcon(data.current_condition[0].weatherCode)
      };
    } catch (error) {

      return null;
    }
  }
  
  // Get user location - returns default location (no IP APIs due to CORS)
  static async getUserLocation() {
    // Return default Chennai location since IP APIs have CORS issues

    return {
      lat: 13.0827,
      lng: 80.2707,
      city: 'Chennai',
      country: 'India'
    };
  }
  
  // Geocoding using Photon (CORS-safe, no rate limit, OpenStreetMap data)
  static async geocodeLocation(query) {
    try {
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      if (!data || !data.features || data.features.length === 0) return [];
      return data.features.map(f => {
        const p = f.properties;
        const nameParts = [p.name, p.city, p.state, p.country].filter(Boolean);
        return {
          name: nameParts.join(', '),
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          type: p.osm_value || p.type || 'place',
          importance: p.extent ? 1 : 0.5
        };
      });
    } catch (error) {

      return [];
    }
  }
  
  // Route calculation using free OSRM API
  static async calculateRoute(coordinates, profile = 'driving') {
    try {
      const coords = coordinates.map(c => `${c.lng},${c.lat}`).join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Convert GeoJSON coordinates to Leaflet format [lat, lng]
        const leafletCoords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: {
            coordinates: leafletCoords,
            type: route.geometry.type
          },
          steps: route.legs[0]?.steps || []
        };
      }
      return null;
    } catch (error) {

      return null;
    }
  }
  
  // Real currency rates from multiple free APIs
  static async getFallbackRates() {
    try {
      // Try exchangerate-api.com (free, no key required)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.ok) {
        const data = await response.json();
        return data.rates;
      }
    } catch (error) {

    }
    
    try {
      // Try exchangerate.host (completely free, no key)
      const response = await fetch('https://api.exchangerate.host/latest?base=USD');
      if (response.ok) {
        const data = await response.json();
        return data.rates;
      }
    } catch (error) {

    }
    
    try {
      // Try floatrates (free, no key)
      const response = await fetch('https://www.floatrates.com/daily/usd.json');
      if (response.ok) {
        const data = await response.json();
        const rates = { USD: 1 };
        Object.keys(data).forEach(key => {
          rates[key.toUpperCase()] = data[key].rate;
        });
        return rates;
      }
    } catch (error) {

    }
    
    // Final fallback: return empty object to indicate failure
    return {};
  }
  
  // Weather icon mapping
  static getWeatherIcon(code) {
    const iconMap = {
      113: '☀️', // Sunny
      116: '⛅', // Partly cloudy
      119: '☁️', // Cloudy
      122: '☁️', // Overcast
      143: '🌫️', // Mist
      176: '🌦️', // Patchy rain possible
      179: '🌨️', // Patchy snow possible
      182: '🌧️', // Patchy sleet possible
      185: '🌧️', // Patchy freezing drizzle possible
      200: '⛈️', // Thundery outbreaks possible
      227: '🌨️', // Blowing snow
      230: '❄️', // Blizzard
      248: '🌫️', // Fog
      260: '🌫️', // Freezing fog
      263: '🌦️', // Patchy light drizzle
      266: '🌧️', // Light drizzle
      281: '🌧️', // Freezing drizzle
      284: '🌧️', // Heavy freezing drizzle
      293: '🌦️', // Patchy light rain
      296: '🌧️', // Light rain
      299: '🌧️', // Moderate rain at times
      302: '🌧️', // Moderate rain
      305: '🌧️', // Heavy rain at times
      308: '🌧️', // Heavy rain
      311: '🌧️', // Light freezing rain
      314: '🌧️', // Moderate or heavy freezing rain
      317: '🌧️', // Light sleet
      320: '🌧️', // Moderate or heavy sleet
      323: '🌨️', // Patchy light snow
      326: '🌨️', // Light snow
      329: '🌨️', // Patchy moderate snow
      332: '🌨️', // Moderate snow
      335: '🌨️', // Patchy heavy snow
      338: '❄️', // Heavy snow
      350: '🌧️', // Ice pellets
      353: '🌦️', // Light rain shower
      356: '🌧️', // Moderate or heavy rain shower
      359: '🌧️', // Torrential rain shower
      362: '🌧️', // Light sleet showers
      365: '🌧️', // Moderate or heavy sleet showers
      368: '🌨️', // Light snow showers
      371: '🌨️', // Moderate or heavy snow showers
      374: '🌧️', // Light showers of ice pellets
      377: '🌧️', // Moderate or heavy showers of ice pellets
      386: '⛈️', // Patchy light rain with thunder
      389: '⛈️', // Moderate or heavy rain with thunder
      392: '⛈️', // Patchy light snow with thunder
      395: '⛈️'  // Moderate or heavy snow with thunder
    };
    return iconMap[code] || '🌤️';
  }
  
  // Format distance
  static formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }
  
  // Format duration
  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  // Format currency
  static formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  // Debounce function for API calls
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
} else {
  window.Utils = Utils;
}