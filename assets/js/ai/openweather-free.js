// Free Weather Service - No API key required
class FreeWeatherService {
  constructor() {
    this.endpoints = [
      'https://wttr.in', // Free weather service
      'https://api.open-meteo.com/v1/forecast', // Free weather API
      'https://goweather.herokuapp.com/weather' // Free weather API
    ];
  }

  async getWeatherInfo(cityName) {
    // Try multiple free weather APIs
    for (const endpoint of this.endpoints) {
      try {
        const weather = await this.tryWeatherAPI(endpoint, cityName);
        if (weather) return weather;
      } catch (error) {
        console.log(`Weather API ${endpoint} failed:`, error);
      }
    }

    return this.getWeatherAdvice(cityName);
  }

  async tryWeatherAPI(endpoint, cityName) {
    if (location.protocol === 'file:') return null;

    try {
      if (endpoint.includes('wttr.in')) {
        const response = await fetch(`${endpoint}/${encodeURIComponent(cityName)}?format=j1`);
        if (response.ok) {
          const data = await response.json();
          return this.parseWttrData(data, cityName);
        }
      } else if (endpoint.includes('open-meteo')) {
        // Get coordinates first, then weather
        const coords = await this.getCityCoordinates(cityName);
        if (coords) {
          const response = await fetch(`${endpoint}?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true`);
          if (response.ok) {
            const data = await response.json();
            return this.parseOpenMeteoData(data, cityName);
          }
        }
      } else if (endpoint.includes('goweather')) {
        const response = await fetch(`${endpoint}/${encodeURIComponent(cityName)}`);
        if (response.ok) {
          const data = await response.json();
          return this.parseGoWeatherData(data, cityName);
        }
      }
    } catch (error) {
      console.log('Weather API request failed:', error);
    }

    return null;
  }

  parseWttrData(data, cityName) {
    const current = data.current_condition?.[0];
    if (current) {
      return {
        city: cityName,
        temperature: `${current.temp_C}°C`,
        condition: current.weatherDesc?.[0]?.value || 'Unknown',
        humidity: `${current.humidity}%`,
        advice: this.getWeatherAdviceFromCondition(current.weatherDesc?.[0]?.value)
      };
    }
    return null;
  }

  parseOpenMeteoData(data, cityName) {
    const current = data.current_weather;
    if (current) {
      return {
        city: cityName,
        temperature: `${current.temperature}°C`,
        condition: this.getConditionFromCode(current.weathercode),
        windSpeed: `${current.windspeed} km/h`,
        advice: this.getWeatherAdviceFromTemp(current.temperature)
      };
    }
    return null;
  }

  parseGoWeatherData(data, cityName) {
    if (data.temperature) {
      return {
        city: cityName,
        temperature: data.temperature,
        condition: data.description || 'Unknown',
        advice: this.getWeatherAdviceFromCondition(data.description)
      };
    }
    return null;
  }

  getConditionFromCode(code) {
    const codes = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Depositing rime fog', 51: 'Light drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      80: 'Slight rain showers', 95: 'Thunderstorm'
    };
    return codes[code] || 'Unknown';
  }

  getWeatherAdviceFromCondition(condition) {
    if (!condition) return 'Check current conditions before traveling.';
    
    const cond = condition.toLowerCase();
    if (cond.includes('rain') || cond.includes('shower')) {
      return 'Pack an umbrella and waterproof clothing! ☔';
    } else if (cond.includes('sunny') || cond.includes('clear')) {
      return 'Perfect weather for sightseeing! Don\'t forget sunscreen. ☀️';
    } else if (cond.includes('cloud')) {
      return 'Great weather for walking around. Comfortable temperatures expected. ⛅';
    } else if (cond.includes('snow')) {
      return 'Bundle up! Pack warm clothes and waterproof boots. ❄️';
    } else if (cond.includes('fog')) {
      return 'Visibility might be low. Drive carefully and allow extra time. 🌫️';
    }
    return 'Check current conditions and pack accordingly for your trip.';
  }

  getWeatherAdviceFromTemp(temp) {
    if (temp > 30) {
      return 'Hot weather! Stay hydrated, wear light clothes, and seek shade. 🌡️';
    } else if (temp > 20) {
      return 'Pleasant weather! Perfect for outdoor activities and sightseeing. 😊';
    } else if (temp > 10) {
      return 'Cool weather. Pack a light jacket for comfort. 🧥';
    } else {
      return 'Cold weather! Pack warm clothes and layers. 🧣';
    }
  }

  getWeatherAdvice(cityName) {
    // Seasonal advice based on location
    const month = new Date().getMonth();
    const city = cityName.toLowerCase();
    
    if (city.includes('chennai') || city.includes('madras')) {
      if (month >= 3 && month <= 5) {
        return 'Chennai is hot in summer (35-40°C). Pack light cotton clothes, sunscreen, and stay hydrated! Best to visit early morning or evening.';
      } else if (month >= 9 && month <= 11) {
        return 'Chennai has pleasant weather during monsoon/post-monsoon. Pack light rain gear and enjoy the cooler temperatures!';
      } else {
        return 'Chennai has warm tropical weather. Pack light, breathable clothes and don\'t forget sunscreen!';
      }
    } else if (city.includes('theni')) {
      return 'Theni has pleasant hill station weather year-round. Pack light woolens for evenings and comfortable clothes for the day.';
    } else if (city.includes('london')) {
      return 'London weather is unpredictable! Pack layers, a waterproof jacket, and an umbrella. Temperatures range 5-20°C typically.';
    } else if (city.includes('paris')) {
      return 'Paris has mild weather. Pack layers for temperature changes and a light rain jacket. Great for walking around the city!';
    }
    
    return `Weather in ${cityName} varies by season. Pack versatile clothing and check current conditions before your trip!`;
  }

  async getCityCoordinates(cityName) {
    // Simple coordinate lookup for major cities
    const coords = {
      'chennai': { lat: 13.0827, lng: 80.2707 },
      'theni': { lat: 10.0104, lng: 77.4977 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'delhi': { lat: 28.7041, lng: 77.1025 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'paris': { lat: 48.8566, lng: 2.3522 }
    };
    
    return coords[cityName.toLowerCase()] || null;
  }
}