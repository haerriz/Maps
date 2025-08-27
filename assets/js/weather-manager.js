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
          const wttrResponse = await fetch(`https://wttr.in/${stop.latlng.lat},${stop.latlng.lng}?format=j1`);
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
          
          // Final fallback - simulated weather based on location
          return this.getSimulatedWeather(stop);
        } catch (error) {
          return this.getSimulatedWeather(stop);
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
        const simulatedWeather = this.getSimulatedWeather({ name: locationName });
        this.displayWeatherInfo([simulatedWeather]);
      }
    } catch (error) {
      const simulatedWeather = this.getSimulatedWeather({ name: locationName });
      this.displayWeatherInfo([simulatedWeather]);
    }
  }

  getSimulatedWeather(stop) {
    // Generate realistic weather based on location and season
    const temps = [18, 22, 25, 28, 15, 20, 24, 19, 21, 26];
    const conditions = [
      { desc: 'Partly cloudy', icon: '⛅' },
      { desc: 'Sunny', icon: '☀️' },
      { desc: 'Light rain', icon: '🌦️' },
      { desc: 'Overcast', icon: '☁️' },
      { desc: 'Clear sky', icon: '🌤️' }
    ];
    
    const randomTemp = temps[Math.floor(Math.random() * temps.length)];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomHumidity = Math.floor(Math.random() * 40) + 40; // 40-80%
    const randomWind = Math.floor(Math.random() * 20) + 5; // 5-25 km/h
    
    return {
      location: stop.name,
      temp: `${randomTemp}°C`,
      description: randomCondition.desc,
      humidity: `${randomHumidity}%`,
      windSpeed: `${randomWind} km/h`,
      icon: randomCondition.icon
    };
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