// Geocoding Service - Extract cities and places using free APIs
class GeocodingService {
  constructor() {
    this.apis = [
      'https://nominatim.openstreetmap.org',
      'https://api.bigdatacloud.net',
      'https://geocode.maps.co'
    ];
    this.cache = new Map();
  }

  async extractCities(message) {
    const cities = [];
    const places = [];

    // First, try pattern-based extraction for common cities
    const patternCities = this.extractCitiesWithPatterns(message);
    cities.push(...patternCities);

    // Then try API-based validation for remaining words
    const words = message.toLowerCase().split(/\s+/);
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (cleanWord.length > 2 && !cities.includes(cleanWord)) {
        const cityData = await this.checkIfCity(cleanWord);
        if (cityData) {
          cities.push(cityData.name);
        }
      }
    }

    // Check for multi-word city names
    const multiWordCities = await this.extractMultiWordCities(message);
    cities.push(...multiWordCities);

    return {
      cities: [...new Set(cities)],
      places: places,
      activities: this.extractActivities(message),
      keywords: this.extractKeywords(message)
    };
  }

  extractCitiesWithPatterns(message) {
    const cities = [];
    const msg = message.toLowerCase();
    
    // Comprehensive city database for instant recognition
    const worldCities = {
      // Indian cities (with aliases)
      'mumbai': 'Mumbai', 'bombay': 'Mumbai', 'delhi': 'Delhi', 'newdelhi': 'New Delhi',
      'bangalore': 'Bangalore', 'bengaluru': 'Bangalore', 'chennai': 'Chennai', 'madras': 'Chennai',
      'kolkata': 'Kolkata', 'calcutta': 'Kolkata', 'hyderabad': 'Hyderabad', 'pune': 'Pune',
      'jaipur': 'Jaipur', 'madurai': 'Madurai', 'theni': 'Theni', 'coimbatore': 'Coimbatore',
      'kochi': 'Kochi', 'cochin': 'Kochi', 'mysore': 'Mysore', 'trivandrum': 'Trivandrum',
      'calicut': 'Calicut', 'kozhikode': 'Calicut', 'salem': 'Salem',
      
      // Countries and regions
      'america': 'United States', 'usa': 'United States', 'us': 'United States',
      'uk': 'United Kingdom', 'britain': 'United Kingdom', 'england': 'England',
      'india': 'India', 'bharat': 'India', 'china': 'China', 'japan': 'Japan',
      
      // International cities
      'london': 'London', 'paris': 'Paris', 'tokyo': 'Tokyo', 'newyork': 'New York',
      'singapore': 'Singapore', 'dubai': 'Dubai', 'bangkok': 'Bangkok', 'sydney': 'Sydney',
      'melbourne': 'Melbourne', 'toronto': 'Toronto', 'vancouver': 'Vancouver', 'berlin': 'Berlin',
      'rome': 'Rome', 'madrid': 'Madrid', 'amsterdam': 'Amsterdam', 'zurich': 'Zurich',
      'vienna': 'Vienna', 'prague': 'Prague', 'budapest': 'Budapest', 'stockholm': 'Stockholm',
      'oslo': 'Oslo', 'copenhagen': 'Copenhagen', 'helsinki': 'Helsinki', 'moscow': 'Moscow',
      'istanbul': 'Istanbul', 'cairo': 'Cairo', 'johannesburg': 'Johannesburg', 'lagos': 'Lagos',
      'nairobi': 'Nairobi', 'casablanca': 'Casablanca', 'beijing': 'Beijing', 'shanghai': 'Shanghai',
      'hongkong': 'Hong Kong', 'seoul': 'Seoul', 'manila': 'Manila', 'jakarta': 'Jakarta',
      'kualalumpur': 'Kuala Lumpur', 'riyadh': 'Riyadh', 'doha': 'Doha', 'kuwait': 'Kuwait',
      'tehran': 'Tehran', 'karachi': 'Karachi', 'lahore': 'Lahore', 'islamabad': 'Islamabad',
      'dhaka': 'Dhaka', 'colombo': 'Colombo', 'kathmandu': 'Kathmandu', 'male': 'Male'
    };

    // Check each word against the database
    const words = msg.split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (worldCities[cleanWord]) {
        cities.push(worldCities[cleanWord]);
      }
    });

    // Check for multi-word patterns
    if (msg.includes('new york')) cities.push('New York');
    if (msg.includes('los angeles')) cities.push('Los Angeles');
    if (msg.includes('san francisco')) cities.push('San Francisco');
    if (msg.includes('hong kong')) cities.push('Hong Kong');
    if (msg.includes('kuala lumpur')) cities.push('Kuala Lumpur');

    return cities;
  }

  async checkIfCity(cityName) {
    const cacheKey = `city_${cityName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (location.protocol === 'file:') {
      // Fallback for local development
      const commonCities = {
        'mumbai': { name: 'Mumbai', country: 'India' },
        'delhi': { name: 'Delhi', country: 'India' },
        'bangalore': { name: 'Bangalore', country: 'India' },
        'chennai': { name: 'Chennai', country: 'India' },
        'kolkata': { name: 'Kolkata', country: 'India' },
        'hyderabad': { name: 'Hyderabad', country: 'India' },
        'pune': { name: 'Pune', country: 'India' },
        'jaipur': { name: 'Jaipur', country: 'India' },
        'madurai': { name: 'Madurai', country: 'India' },
        'theni': { name: 'Theni', country: 'India' },
        'coimbatore': { name: 'Coimbatore', country: 'India' },
        'kochi': { name: 'Kochi', country: 'India' },
        'mysore': { name: 'Mysore', country: 'India' }
      };
      
      const result = commonCities[cityName.toLowerCase()] || null;
      this.cache.set(cacheKey, result);
      return result;
    }

    // Try multiple geocoding APIs
    for (const api of this.apis) {
      try {
        const cityData = await this.queryGeocodingAPI(api, cityName);
        if (cityData) {
          this.cache.set(cacheKey, cityData);
          return cityData;
        }
      } catch (error) {
        console.log(`Geocoding API ${api} failed for ${cityName}:`, error);
      }
    }

    this.cache.set(cacheKey, null);
    return null;
  }

  async queryGeocodingAPI(api, cityName) {
    let url;
    
    switch (api) {
      case 'https://nominatim.openstreetmap.org':
        url = `${api}/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1`;
        break;
      case 'https://api.bigdatacloud.net':
        url = `${api}/data/reverse-geocode-client?latitude=0&longitude=0&localityLanguage=en`;
        return null; // Skip this for city search
      case 'https://geocode.maps.co':
        url = `${api}/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
        break;
      default:
        return null;
    }

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    
    // Validate it's actually a city/town
    if (result.type === 'city' || result.type === 'town' || 
        result.class === 'place' || result.category === 'place' ||
        (result.address && (result.address.city || result.address.town))) {
      
      return {
        name: result.display_name ? result.display_name.split(',')[0] : cityName,
        country: result.address?.country || 'Unknown',
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon || result.lng)
      };
    }

    return null;
  }

  async extractMultiWordCities(message) {
    const cities = [];
    const commonMultiWordCities = [
      'New York', 'Los Angeles', 'San Francisco', 'Las Vegas',
      'New Delhi', 'Navi Mumbai', 'Greater Noida', 'Pimpri Chinchwad',
      'Salt Lake City', 'Kansas City', 'Oklahoma City'
    ];

    const msgLower = message.toLowerCase();
    
    for (const city of commonMultiWordCities) {
      if (msgLower.includes(city.toLowerCase())) {
        cities.push(city);
      }
    }

    return cities;
  }

  extractActivities(message) {
    const activities = [];
    const activityKeywords = [
      'visit', 'see', 'explore', 'tour', 'travel', 'go', 'trip', 
      'journey', 'vacation', 'holiday', 'sightseeing', 'adventure'
    ];

    const words = message.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (activityKeywords.includes(word)) {
        activities.push(word);
      }
    });

    return activities;
  }

  extractKeywords(message) {
    const keywords = [];
    const importantWords = message.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'will', 'with'].includes(word));

    return importantWords.slice(0, 5); // Return top 5 keywords
  }

  async getCityCoordinates(cityName) {
    const cityData = await this.checkIfCity(cityName);
    if (cityData && cityData.lat && cityData.lng) {
      return { lat: cityData.lat, lng: cityData.lng };
    }
    return null;
  }

  async getDistance(city1, city2) {
    const coords1 = await this.getCityCoordinates(city1);
    const coords2 = await this.getCityCoordinates(city2);

    if (coords1 && coords2) {
      // Calculate distance using Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
      const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return Math.round(R * c);
    }

    return null;
  }
}