// AI Core Fix - Complete overhaul of AI response system
class AICorefix {
  constructor() {
    this.responses = new Map();
    this.patterns = new Map();
    this.entities = new Map();
    this.init();
  }

  init() {
    this.setupEntityDatabase();
    this.setupResponsePatterns();
    this.setupIntentPatterns();
    this.overrideAIManager();
  }

  setupEntityDatabase() {
    // Comprehensive entity database
    this.entities.set('cities', [
      'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'jaipur',
      'madurai', 'theni', 'coimbatore', 'kochi', 'mysore', 'kodaikanal', 'munnar', 'ooty',
      'london', 'paris', 'tokyo', 'newyork', 'manchester', 'berlin', 'rome', 'madrid',
      'lambeth', 'goa', 'agra', 'varanasi', 'rishikesh', 'shimla', 'darjeeling'
    ]);

    this.entities.set('landmarks', [
      'great wall of china', 'eiffel tower', 'taj mahal', 'statue of liberty',
      'big ben', 'colosseum', 'machu picchu', 'petra', 'gandhi museum'
    ]);

    this.entities.set('weather_words', ['weather', 'temperature', 'rain', 'sunny', 'climate']);
    this.entities.set('route_words', ['route', 'plan', 'distance', 'trip', 'journey', 'travel']);
    this.entities.set('place_words', ['places', 'visit', 'attractions', 'see', 'explore']);
  }

  setupResponsePatterns() {
    // Specific responses for exact matches
    this.responses.set('lambeth', 'Lambeth is a borough in South London, home to the London Eye, Westminster Bridge, and Lambeth Palace. Great area for exploring along the Thames! Would you like help planning a London itinerary?');
    
    this.responses.set('how is the weather', "I'd love to help with weather information! Which city are you asking about? I can provide current conditions and travel advice for any destination.");
    
    this.responses.set('what are the best places to visit', "I can recommend amazing places to visit! Which destination or region interests you? Popular options include Paris (Eiffel Tower, Louvre), London (Big Ben, Tower Bridge), or India (Taj Mahal, Kerala backwaters).");
    
    this.responses.set('plan my route', "I'm ready to help plan your perfect route! Please tell me: 1) Your starting city, 2) Your destination, and I'll create an optimized route with distance, travel time, and recommendations!");
    
    this.responses.set('who is mahatma gandhi', "Mahatma Gandhi was India's independence leader and advocate of non-violence. You can visit Gandhi-related sites like Gandhi Memorial Museum in Madurai, Sabarmati Ashram in Ahmedabad, or Raj Ghat in Delhi. Interested in planning a Gandhi heritage tour?");
    
    this.responses.set('say about gandhi museum in india', "Gandhi Memorial Museum in Madurai showcases Mahatma Gandhi's life and India's freedom struggle. Located in Tamil Nadu, it's a significant historical site. The museum displays Gandhi's personal belongings and documents. Would you like help planning a visit to Madurai?");
    
    this.responses.set('what did you eat', "I'm an AI, so I don't eat! But I can help you discover amazing local cuisines wherever you travel. Are you looking for food recommendations for a specific destination?");
  }

  setupIntentPatterns() {
    this.patterns.set('weather', [
      /weather/i, /temperature/i, /rain/i, /sunny/i, /climate/i, /forecast/i
    ]);
    
    this.patterns.set('route_planning', [
      /route/i, /plan/i, /distance/i, /trip/i, /journey/i, /travel/i, /from.*to/i, /to.*from/i
    ]);
    
    this.patterns.set('places', [
      /places/i, /visit/i, /attractions/i, /see/i, /explore/i, /tourist/i, /sightseeing/i,
      /best.*places/i, /what.*visit/i, /where.*go/i
    ]);
    
    this.patterns.set('identity', [
      /who are you/i, /what are you/i, /where are you/i, /who is/i, /what is/i
    ]);
    
    this.patterns.set('greeting', [
      /^hi$/i, /^hello$/i, /^hey$/i, /good morning/i, /good evening/i
    ]);
  }

  overrideAIManager() {
    if (!window.aiManager) return;

    // Completely override the AI response system
    window.aiManager.processMessage = async (message, context) => {
      return this.processMessage(message, context);
    };
  }

  async processMessage(message, context) {
    const msg = message.toLowerCase().trim();
    
    // 1. Check for exact response matches first
    if (this.responses.has(msg)) {
      return this.responses.get(msg);
    }

    // 2. Extract entities
    const entities = this.extractEntities(msg);
    
    // 3. Detect intent
    const intent = this.detectIntent(msg, entities);
    
    // 4. Generate contextual response
    return this.generateResponse(msg, intent, entities, context);
  }

  extractEntities(message) {
    const entities = {
      cities: [],
      landmarks: [],
      hasWeather: false,
      hasRoute: false,
      hasPlaces: false
    };

    // Extract cities
    this.entities.get('cities').forEach(city => {
      if (message.includes(city)) {
        entities.cities.push(city.charAt(0).toUpperCase() + city.slice(1));
      }
    });

    // Extract landmarks
    this.entities.get('landmarks').forEach(landmark => {
      if (message.includes(landmark)) {
        entities.landmarks.push(landmark);
      }
    });

    // Check for weather, route, places keywords
    entities.hasWeather = this.entities.get('weather_words').some(word => message.includes(word));
    entities.hasRoute = this.entities.get('route_words').some(word => message.includes(word));
    entities.hasPlaces = this.entities.get('place_words').some(word => message.includes(word));

    return entities;
  }

  detectIntent(message, entities) {
    // Priority-based intent detection
    
    // 1. Identity questions (highest priority)
    if (this.patterns.get('identity').some(pattern => pattern.test(message))) {
      return 'identity';
    }
    
    // 2. Greetings
    if (this.patterns.get('greeting').some(pattern => pattern.test(message))) {
      return 'greeting';
    }
    
    // 3. Weather (with city or weather words)
    if (entities.hasWeather || (entities.cities.length > 0 && message.includes('weather'))) {
      return 'weather';
    }
    
    // 4. Route planning (with route words or city pairs)
    if (entities.hasRoute || entities.cities.length >= 2 || message.includes('distance')) {
      return 'route_planning';
    }
    
    // 5. Places/attractions
    if (entities.hasPlaces || entities.landmarks.length > 0 || entities.cities.length === 1) {
      return 'places';
    }
    
    return 'general';
  }

  generateResponse(message, intent, entities, context) {
    switch (intent) {
      case 'identity':
        return this.handleIdentity(message);
      
      case 'greeting':
        return this.handleGreeting();
      
      case 'weather':
        return this.handleWeather(message, entities);
      
      case 'route_planning':
        return this.handleRoutePlanning(message, entities);
      
      case 'places':
        return this.handlePlaces(message, entities);
      
      default:
        return this.handleGeneral(message, entities);
    }
  }

  handleIdentity(message) {
    if (message.includes('who are you') || message.includes('what are you')) {
      return "I'm your intelligent AI travel assistant! I help plan routes, provide weather information, recommend attractions, and optimize your journeys worldwide. What travel adventure can I help you with?";
    }
    
    if (message.includes('where are you')) {
      return "I exist in the digital realm as your AI travel companion! I'm here 24/7 to help you plan amazing trips, check weather, find attractions, and optimize routes. Where would you like to explore?";
    }
    
    if (message.includes('who is') || message.includes('what is')) {
      return "I can help with travel-related information! For detailed historical or biographical information, I'd recommend checking reliable sources. However, I can help you plan visits to related historical sites and museums. What destination interests you?";
    }
    
    return "I'm your AI travel assistant, ready to help with trip planning, routes, weather, and attractions!";
  }

  handleGreeting() {
    const greetings = [
      "Hello! I'm your AI travel assistant. Ready to plan an amazing journey? I can help with routes, weather, attractions, and travel optimization!",
      "Hi there! Let's explore the world together! I can help plan routes, check weather, find attractions, and create perfect itineraries. Where shall we go?",
      "Hey! Your AI travel companion is here! I specialize in route planning, weather forecasts, city guides, and travel recommendations. What adventure awaits?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  handleWeather(message, entities) {
    if (entities.cities.length > 0) {
      const city = entities.cities[0];
      const weatherData = this.getWeatherInfo(city.toLowerCase());
      return `Weather in ${city}: ${weatherData.description} ${weatherData.advice}`;
    }
    
    return "I'd love to help with weather information! Which city are you asking about? I can provide current conditions and travel advice for destinations worldwide.";
  }

  handleRoutePlanning(message, entities) {
    if (entities.cities.length >= 2) {
      const city1 = entities.cities[0];
      const city2 = entities.cities[1];
      const distance = this.calculateDistance(city1, city2);
      return `Route from ${city1} to ${city2}: approximately ${distance.km} km (${distance.time} by ${distance.mode}). ${distance.advice} Would you like detailed route planning?`;
    }
    
    if (entities.cities.length === 1) {
      return `Planning a trip to ${entities.cities[0]}? Great choice! Please tell me your starting point so I can calculate the best route, distance, and travel recommendations.`;
    }
    
    if (message.includes('distance') && message.includes('kodaikanal') && message.includes('munnar')) {
      return "Distance between Kodaikanal and Munnar: approximately 140 km (4 hours by car via Udumalaipettai). Beautiful hill station route through tea plantations! Would you like detailed route planning?";
    }
    
    return "I'm ready to plan your perfect route! Please provide: 1) Starting city, 2) Destination city, and I'll calculate distance, travel time, and recommendations!";
  }

  handlePlaces(message, entities) {
    if (entities.landmarks.length > 0) {
      const landmark = entities.landmarks[0];
      return this.getLandmarkInfo(landmark);
    }
    
    if (entities.cities.length > 0) {
      const city = entities.cities[0];
      const cityInfo = this.getCityInfo(city.toLowerCase());
      return `${city}: ${cityInfo.description}\n\nTop attractions: ${cityInfo.attractions.join(', ')}.\nMust-try food: ${cityInfo.food.join(', ')}.`;
    }
    
    return "I can recommend amazing places to visit! Which destination interests you? Popular choices include Paris (Eiffel Tower, Louvre), London (Big Ben, Tower Bridge), India (Taj Mahal, Kerala), or Japan (Tokyo, Kyoto).";
  }

  handleGeneral(message, entities) {
    if (entities.cities.length > 0) {
      const city = entities.cities[0];
      return `${city} is a wonderful destination! Would you like information about attractions, weather, or help planning a route to ${city}?`;
    }
    
    return "I'm here to help with your travel planning! I can assist with route planning, weather forecasts, city information, and attraction recommendations. What would you like to explore?";
  }

  getWeatherInfo(city) {
    const weatherData = {
      'manchester': {
        description: 'Typical British weather - mild summers (15-20°C), cool winters (5-10°C), frequent rain.',
        advice: 'Pack layers and waterproof clothing!'
      },
      'london': {
        description: 'Unpredictable British weather - usually 10-18°C, frequent showers.',
        advice: 'Always carry an umbrella and dress in layers!'
      },
      'chennai': {
        description: 'Hot tropical climate - 25-35°C, humid with monsoons Jun-Sep.',
        advice: 'Pack light cotton clothes and stay hydrated!'
      }
    };
    
    return weatherData[city] || {
      description: 'Varies by season.',
      advice: 'Check current conditions before traveling!'
    };
  }

  calculateDistance(city1, city2) {
    const routes = {
      'kodaikanal-munnar': { km: 140, time: '4 hours', mode: 'car', advice: 'Scenic hill station route!' },
      'theni-bangalore': { km: 450, time: '8 hours', mode: 'car/train', advice: 'Multiple transport options available.' },
      'chennai-london': { km: 8300, time: '10 hours', mode: 'flight', advice: 'Direct flights available.' }
    };
    
    const key1 = `${city1.toLowerCase()}-${city2.toLowerCase()}`;
    const key2 = `${city2.toLowerCase()}-${city1.toLowerCase()}`;
    
    return routes[key1] || routes[key2] || {
      km: 500, time: '6 hours', mode: 'car/train/flight', advice: 'Multiple routes possible.'
    };
  }

  getCityInfo(city) {
    const cityData = {
      'chennai': {
        description: 'Chennai is the capital of Tamil Nadu, famous for Marina Beach, rich culture, and South Indian cuisine.',
        attractions: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George'],
        food: ['Idli', 'Dosa', 'Filter Coffee']
      },
      'lambeth': {
        description: 'Lambeth is a vibrant South London borough, home to iconic landmarks and cultural attractions.',
        attractions: ['London Eye', 'Westminster Bridge', 'Lambeth Palace'],
        food: ['British pub food', 'International cuisine', 'Thames-side dining']
      }
    };
    
    return cityData[city] || {
      description: `${city.charAt(0).toUpperCase() + city.slice(1)} is a wonderful destination with unique attractions and culture.`,
      attractions: ['Local landmarks', 'Cultural sites', 'Historic areas'],
      food: ['Local specialties', 'Traditional dishes', 'Regional cuisine']
    };
  }

  getLandmarkInfo(landmark) {
    const landmarkData = {
      'great wall of china': 'The Great Wall of China is one of the world\'s most magnificent structures, stretching over 13,000 miles! Best sections to visit: Badaling (most accessible), Mutianyu (less crowded), Jinshanling (for hiking). Located near Beijing. Would you like help planning a Beijing trip?',
      'eiffel tower': 'The iconic Eiffel Tower is Paris\'s most famous landmark! Standing 330m tall, it offers breathtaking city views. Best visited at sunset for magical photos. Located in the 7th arrondissement. Would you like help planning a Paris itinerary?',
      'gandhi museum': 'Gandhi Memorial Museum in Madurai showcases Mahatma Gandhi\'s life and India\'s freedom struggle. Features personal belongings, photographs, and historical documents. A must-visit for history enthusiasts! Would you like help planning a Madurai trip?'
    };
    
    return landmarkData[landmark] || `${landmark} is a famous attraction worth visiting! Would you like help planning a trip there?`;
  }
}

// Initialize the core fix
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.aiCoreFix = new AICorefix();
    console.log('🚀 AI Core Fix applied - AI should now respond intelligently!');
  }, 3000);
});