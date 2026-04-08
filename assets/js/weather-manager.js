/**
 * Weather Manager Module
 * Handles weather information and forecasts
 */

class WeatherManager {
  constructor() {
    // Weather manager initialization
  }

  async getWeatherInfo() {
    const tourStops = window.tourManager ? window.tourManager.getTourStops() : [];
    if (tourStops.length === 0) {
      if (window.chatManager) {
        window.chatManager.addMessage('Add some tour stops first, then I can help you with weather information for those locations!', 'ai');
      }
      return;
    }
    
    if (window.chatManager) {
      window.chatManager.addMessage('🌤️ Fetching weather information for your tour stops...', 'ai');
    }
    
    try {
      const weatherPromises = tourStops.slice(0, 5).map(async (stop) => {
        return await this.fetchOpenMeteoWeather(stop.lat, stop.lng, stop.name);
      });
      
      const weatherData = (await Promise.all(weatherPromises)).filter(Boolean);
      if (weatherData.length > 0) {
        this.displayWeatherInfo(weatherData);
      } else {
        if (window.chatManager) {
          window.chatManager.addMessage('Unable to fetch weather data right now. Please try again shortly.', 'ai');
        }
      }
      
    } catch (error) {
      if (window.chatManager) {
        window.chatManager.addMessage('Unable to fetch weather data. Please check your internet connection and try again.', 'ai');
      }
    }
  }

  // Fetch weather using Open-Meteo — completely free, no API key, CORS-safe, unlimited
  async fetchOpenMeteoWeather(lat, lng, locationName) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&wind_speed_unit=kmh&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
      const data = await response.json();
      const c = data.current;
      return {
        location: locationName,
        temp: `${Math.round(c.temperature_2m)}°C`,
        description: this.wmoCodeToDescription(c.weather_code),
        humidity: `${c.relative_humidity_2m}%`,
        windSpeed: `${Math.round(c.wind_speed_10m)} km/h`,
        icon: this.wmoCodeToIcon(c.weather_code)
      };
    } catch (error) {
      console.warn('Open-Meteo failed for', locationName, error);
      // Try weather.gov as fallback for US locations
      return await this.fetchWeatherGovFallback(lat, lng, locationName);
    }
  }

  // WMO Weather Code mappings (used by Open-Meteo)
  wmoCodeToDescription(code) {
    const codes = {
      0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
      45:'Fog', 48:'Icy fog',
      51:'Light drizzle', 53:'Moderate drizzle', 55:'Dense drizzle',
      61:'Slight rain', 63:'Moderate rain', 65:'Heavy rain',
      71:'Slight snow', 73:'Moderate snow', 75:'Heavy snow', 77:'Snow grains',
      80:'Slight showers', 81:'Moderate showers', 82:'Violent showers',
      85:'Slight snow showers', 86:'Heavy snow showers',
      95:'Thunderstorm', 96:'Thunderstorm with hail', 99:'Thunderstorm with heavy hail'
    };
    return codes[code] || 'Unknown';
  }

  wmoCodeToIcon(code) {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 55) return '🌦️';
    if (code >= 61 && code <= 65) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  }

  async getSpecificLocationWeather(locationName) {
    // Geocode the name to coordinates first, then use Open-Meteo
    try {
      const geo = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locationName)}&limit=1`);
      if (geo.ok) {
        const geoData = await geo.json();
        if (geoData.features && geoData.features.length > 0) {
          const [lng, lat] = geoData.features[0].geometry.coordinates;
          const weather = await this.fetchOpenMeteoWeather(lat, lng, locationName);
          if (weather) { this.displayWeatherInfo([weather]); return; }
        }
      }
    } catch (e) { console.warn('Weather geocode failed:', e); }
    if (window.chatManager) {
      window.chatManager.addMessage(`Could not fetch weather for ${locationName}. Try adding it as a map stop first.`, 'ai');
    }
  }

  async fetchWeatherGovFallback(lat, lng, locationName) {
    try {
      // weather.gov only covers US locations (roughly)
      if (lat >= 20 && lat <= 50 && lng >= -180 && lng <= -60) {
        const pointResponse = await fetch(`https://api.weather.gov/points/${lat},${lng}`);
        if (pointResponse.ok) {
          const pointData = await pointResponse.json();
          const forecastResponse = await fetch(pointData.properties.forecast);
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            const current = forecastData.properties.periods[0];
            return {
              location: locationName,
              temp: `${current.temperature}°${current.temperatureUnit}`,
              description: current.shortForecast,
              humidity: 'N/A',
              windSpeed: current.windSpeed || 'N/A',
              icon: this.getWeatherIconFromDescription(current.shortForecast)
            };
          }
        }
      }
    } catch (error) {
      console.warn('Weather.gov fallback failed:', error);
    }
    return null;
  }

  getWeatherIconFromDescription(description) {
    const desc = description.toLowerCase();
    if (desc.includes('rain') || desc.includes('shower')) return '🌧️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('thunder')) return '⛈️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('clear') || desc.includes('sunny')) return '☀️';
    if (desc.includes('partly')) return '⛅';
    return '🌤️';
  }

  displayWeatherInfo(weatherData) {
    let weatherMessage = '🌤️ Weather Information:\n\n';
    
    weatherData.forEach((weather, index) => {
      weatherMessage += `${weather.icon} ${weather.location}\n`;
      weatherMessage += `   Temperature: ${weather.temp}\n`;
      weatherMessage += `   Condition: ${weather.description}\n`;
      weatherMessage += `   Humidity: ${weather.humidity}\n`;
      weatherMessage += `   Wind: ${weather.windSpeed}\n`;
      if (index < weatherData.length - 1) weatherMessage += '\n';
    });
    
    const tourStops = window.tourManager ? window.tourManager.getTourStops() : [];
    if (tourStops.length > 5) {
      weatherMessage += `\n📍 Showing weather for first 5 stops only.`;
    }
    
    weatherMessage += '\n\n💡 Pack accordingly and check for updates before traveling!';
    
    if (window.chatManager) {
      window.chatManager.addMessage(weatherMessage, 'ai');
    }
  }
}

// Initialize weather manager
window.weatherManager = new WeatherManager();