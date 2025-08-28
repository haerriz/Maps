// Utility Functions - Free API Integration
class Utils {
  
  // Currency conversion using free API
  static async getCurrencyRates(baseCurrency = 'USD') {
    try {
      const response = await fetch(`https://api.fxratesapi.com/latest?base=${baseCurrency}`);
      const data = await response.json();
      return data.rates;
    } catch (error) {
      console.warn('Currency API unavailable, using fallback rates');
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
      console.warn('Weather API unavailable');
      return null;
    }
  }
  
  // Get user location using free IP geolocation
  static async getUserLocation() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude),
        city: data.city,
        country: data.country_name
      };
    } catch (error) {
      console.warn('Location API unavailable');
      return null;
    }
  }
  
  // Geocoding using free Nominatim API
  static async geocodeLocation(query) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      return data.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
        importance: item.importance
      }));
    } catch (error) {
      console.warn('Geocoding API unavailable');
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
      console.warn('Routing API unavailable');
      return null;
    }
  }
  
  // Fallback currency rates (static data)
  static getFallbackRates() {
    return {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      AUD: 1.35,
      CAD: 1.25,
      CHF: 0.92,
      CNY: 6.45,
      INR: 74.5
    };
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