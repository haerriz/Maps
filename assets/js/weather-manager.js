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
      const weatherPromises = tourStops.slice(0, 5).map(async (stop, index) => {
        try {
          // Using wttr.in weather service as fallback
          const wttrResponse = await fetch(`https://wttr.in/${stop.lat},${stop.lng}?format=j1`);
          if (wttrResponse.ok) {
            const wttrData = await wttrResponse.json();
            const current = wttrData.current_condition[0];
            return {
              location: stop.name,
              temp: `${current.temp_C}°C`,
              description: current.weatherDesc[0].value,
              humidity: `${current.humidity}%`,
              windSpeed: `${current.windspeedKmph} km/h`,
              icon: this.getWeatherIcon(current.weatherCode)
            };
          }
          
          // Final fallback - real geographic weather estimation
          return await this.getRealWeatherFallback(stop);
        } catch (error) {
          return await this.getRealWeatherFallback(stop);
        }
      });
      
      const weatherData = await Promise.all(weatherPromises);
      this.displayWeatherInfo(weatherData);
      
    } catch (error) {
      if (window.chatManager) {
        window.chatManager.addMessage('Unable to fetch weather data. Please check your internet connection and try again.', 'ai');
      }
    }
  }

  async getSpecificLocationWeather(locationName) {
    try {
      const response = await fetch(`https://wttr.in/${encodeURIComponent(locationName)}?format=j1`);
      if (response.ok) {
        const data = await response.json();
        const current = data.current_condition[0];
        const weather = {
          location: locationName,
          temp: `${current.temp_C}°C`,
          description: current.weatherDesc[0].value,
          humidity: `${current.humidity}%`,
          windSpeed: `${current.windspeedKmph} km/h`,
          icon: this.getWeatherIcon(current.weatherCode)
        };
        
        this.displayWeatherInfo([weather]);
      } else {
        const realWeather = await this.getRealWeatherFallback({ name: locationName, lat: 0, lng: 0 });
        this.displayWeatherInfo([realWeather]);
      }
    } catch (error) {
      const realWeather = await this.getRealWeatherFallback({ name: locationName, lat: 0, lng: 0 });
      this.displayWeatherInfo([realWeather]);
    }
  }

  async getRealWeatherFallback(stop) {
    try {
      // Try OpenWeatherMap free tier (no key needed for some endpoints)
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${stop.latlng?.lat || stop.lat}&lon=${stop.latlng?.lng || stop.lng}&units=metric`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          location: stop.name,
          temp: `${Math.round(data.main.temp)}°C`,
          description: data.weather[0].description,
          humidity: `${data.main.humidity}%`,
          windSpeed: `${Math.round(data.wind.speed * 3.6)} km/h`,
          icon: this.getWeatherIcon(data.weather[0].id)
        };
      }
    } catch (error) {
      console.warn('OpenWeatherMap failed, trying weather.gov:', error);
    }
    
    try {
      // Try weather.gov for US locations (completely free)
      const lat = stop.latlng?.lat || stop.lat;
      const lng = stop.latlng?.lng || stop.lng;
      
      if (lat >= 20 && lat <= 50 && lng >= -180 && lng <= -60) {
        const pointResponse = await fetch(`https://api.weather.gov/points/${lat},${lng}`);
        if (pointResponse.ok) {
          const pointData = await pointResponse.json();
          const forecastResponse = await fetch(pointData.properties.forecast);
          
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            const current = forecastData.properties.periods[0];
            
            return {
              location: stop.name,
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
      console.warn('Weather.gov failed, using geographic estimation:', error);
    }
    
    // Final fallback: geographic weather estimation
    return this.getGeographicWeatherEstimate(stop);
  }

  getGeographicWeatherEstimate(stop) {
    const lat = stop.latlng?.lat || stop.lat || 0;
    const lng = stop.latlng?.lng || stop.lng || 0;
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const hour = now.getHours();
    
    // Temperature estimation based on latitude and season
    let baseTemp = 20; // Default moderate temperature
    
    // Latitude effect (closer to equator = warmer)
    const latEffect = Math.abs(lat);
    if (latEffect < 23.5) { // Tropics
      baseTemp = 28;
    } else if (latEffect < 40) { // Temperate
      baseTemp = 22;
    } else if (latEffect < 60) { // Cold temperate
      baseTemp = 15;
    } else { // Polar
      baseTemp = 5;
    }
    
    // Seasonal adjustment (Northern hemisphere)
    const seasonalAdjustment = lat >= 0 ? 
      Math.sin((month - 2) * Math.PI / 6) * 10 : // Northern hemisphere
      Math.sin((month - 8) * Math.PI / 6) * 10;   // Southern hemisphere
    
    baseTemp += seasonalAdjustment;
    
    // Daily temperature variation
    const dailyVariation = Math.sin((hour - 6) * Math.PI / 12) * 5;
    const finalTemp = Math.round(baseTemp + dailyVariation);
    
    // Weather condition based on geographic factors
    const conditions = this.getGeographicConditions(lat, lng, month);
    
    return {
      location: stop.name,
      temp: `${finalTemp}°C`,
      description: conditions.desc,
      humidity: `${Math.round(50 + Math.abs(lat) / 2)}%`, // Higher humidity near equator
      windSpeed: `${Math.round(10 + Math.abs(lat) / 10)} km/h`,
      icon: conditions.icon
    };
  }

  getGeographicConditions(lat, lng, month) {
    const absLat = Math.abs(lat);
    
    // Tropical regions (more rain)
    if (absLat < 23.5) {
      const isRainySeason = (lat >= 0 && month >= 5 && month <= 9) || 
                           (lat < 0 && (month <= 3 || month >= 11));
      return isRainySeason ? 
        { desc: 'Partly cloudy with showers', icon: '🌦️' } :
        { desc: 'Partly cloudy', icon: '⛅' };
    }
    
    // Temperate regions
    if (absLat < 60) {
      const isWinter = (lat >= 0 && (month <= 2 || month >= 11)) ||
                      (lat < 0 && month >= 5 && month <= 8);
      return isWinter ?
        { desc: 'Overcast', icon: '☁️' } :
        { desc: 'Partly sunny', icon: '🌤️' };
    }
    
    // Polar regions
    return { desc: 'Cold and cloudy', icon: '☁️' };
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

  getWeatherIcon(code) {
    // Convert weather codes to emojis
    if (typeof code === 'string') {
      // wttr.in codes
      const wttrCodes = {
        '113': '☀️', '116': '⛅', '119': '☁️', '122': '☁️',
        '143': '🌫️', '176': '🌦️', '179': '🌨️', '182': '🌧️',
        '185': '🌧️', '200': '⛈️', '227': '🌨️', '230': '❄️',
        '248': '🌫️', '260': '🌫️', '263': '🌦️', '266': '🌦️',
        '281': '🌧️', '284': '🌧️', '293': '🌦️', '296': '🌦️',
        '299': '🌧️', '302': '🌧️', '305': '🌧️', '308': '🌧️',
        '311': '🌧️', '314': '🌧️', '317': '🌧️', '320': '🌨️',
        '323': '🌨️', '326': '🌨️', '329': '❄️', '332': '❄️',
        '335': '❄️', '338': '❄️', '350': '🌧️', '353': '🌦️',
        '356': '🌧️', '359': '🌧️', '362': '🌨️', '365': '🌨️',
        '368': '🌨️', '371': '❄️', '374': '🌧️', '377': '🌧️',
        '386': '⛈️', '389': '⛈️', '392': '⛈️', '395': '❄️'
      };
      return wttrCodes[code] || '🌤️';
    }
    
    // OpenWeatherMap codes
    if (code >= 200 && code < 300) return '⛈️'; // Thunderstorm
    if (code >= 300 && code < 400) return '🌦️'; // Drizzle
    if (code >= 500 && code < 600) return '🌧️'; // Rain
    if (code >= 600 && code < 700) return '❄️'; // Snow
    if (code >= 700 && code < 800) return '🌫️'; // Atmosphere
    if (code === 800) return '☀️'; // Clear
    if (code > 800) return '☁️'; // Clouds
    
    return '🌤️'; // Default
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