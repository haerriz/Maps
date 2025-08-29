// AI Manager - Orchestrates all AI services
class AIManager {
  constructor() {
    this.services = {
      freeai: new FreeAIService(),
      wikipedia: new WikipediaService(),
      weather: new FreeWeatherService(),
      huggingface: new HuggingFaceService(),
      openai: new OpenAIService(),
      cohere: new CohereService(),
      nlp: new NLPService(),
      geocoding: new GeocodingService()
    };
    this.cache = new Map();
  }

  async processMessage(message, context) {
    const cacheKey = `${message.toLowerCase()}_${JSON.stringify(context)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Step 1: Extract entities using multiple services
      const entities = await this.extractEntities(message);
      console.log('Extracted entities:', entities);

      // Step 2: Detect intent using AI
      const intent = await this.detectIntent(message, entities);
      console.log('Detected intent:', intent);

      // Store context for follow-up questions
      if (entities.cities.length > 0) {
        context.lastCities = entities.cities;
      }

      // Step 3: Generate response using best available AI
      const response = await this.generateResponse(message, intent, entities, context);
      
      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error('AI Manager error:', error);
      return this.getFallbackResponse(message, context);
    }
  }

  async extractEntities(message) {
    const results = await Promise.allSettled([
      this.services.geocoding.extractCities(message),
      this.services.nlp.extractEntities(message),
      this.services.huggingface.extractEntities(message)
    ]);

    // Combine results from all services
    const entities = {
      cities: [],
      places: [],
      activities: [],
      keywords: []
    };

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        Object.keys(entities).forEach(key => {
          if (result.value[key]) {
            entities[key] = [...new Set([...entities[key], ...result.value[key]])];
          }
        });
      }
    });

    return entities;
  }

  async detectIntent(message, entities) {
    const intents = await Promise.allSettled([
      this.services.huggingface.classifyIntent(message),
      this.services.cohere.classifyIntent(message),
      this.services.nlp.analyzeIntent(message, entities)
    ]);

    // Use the most confident result
    let bestIntent = 'general';
    let bestConfidence = 0;

    intents.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        if (result.value.confidence > bestConfidence) {
          bestIntent = result.value.intent;
          bestConfidence = result.value.confidence;
        }
      }
    });

    return bestIntent;
  }

  async generateResponse(message, intent, entities, context) {
    // Generate smart contextual response immediately
    const smartResponse = this.generateSmartResponse(message, intent, entities, context);
    if (smartResponse) return smartResponse;

    // Try async enhanced responses
    const enhancedResponse = await this.generateEnhancedResponse(message, intent, entities, context);
    if (enhancedResponse) return enhancedResponse;

    // Try multiple AI services for generation
    try {
      // Try free AI service first
      const freeAIResponse = await this.services.freeai.generateResponse(message, intent, entities, context);
      if (freeAIResponse && freeAIResponse.length > 10) {
        return freeAIResponse;
      }
      
      // Try pattern-based response
      const patternResponse = this.services.freeai.generatePatternResponse(message, intent, entities, context);
      if (patternResponse) {
        return patternResponse;
      }
      
      // Try HuggingFace as backup
      const hfResponse = await this.services.huggingface.generateResponse(message, intent, entities, context);
      if (hfResponse && hfResponse.length > 10) {
        return hfResponse;
      }
    } catch (error) {
      console.log('AI generation failed, using template');
    }

    // Fallback to template-based response
    return this.services.nlp.generateTemplateResponse(message, intent, entities, context);
  }

  generateSmartResponse(message, intent, entities, context) {
    const msg = message.toLowerCase();

    // Handle specific patterns with dynamic responses
    if (intent === 'route_planning' && entities.cities.length >= 2) {
      const city1 = entities.cities[0];
      const city2 = entities.cities[1];
      const distance = this.estimateDistance(city1, city2);
      const mode = distance > 3000 ? 'flight' : distance > 500 ? 'train or flight' : 'car';
      return `Perfect! I can help you plan a route from ${city1} to ${city2} (approximately ${distance} km by ${mode}). Use the search box to add these cities and I'll optimize the route with real-time data!`;
    }

    // Handle single city mentions for information (synchronous)
    if (entities.cities.length === 1 && (intent === 'general' || intent === 'places')) {
      const city = entities.cities[0];
      const cityInfo = this.services.wikipedia.getOfflineCityInfo(city);
      
      if (msg.includes('about') || msg.includes('tell') || msg.includes('say') || intent === 'places') {
        let response = `${cityInfo.extract}`;
        if (cityInfo.attractions) {
          response += ` \n\nTop attractions: ${cityInfo.attractions.slice(0, 3).join(', ')}.`;
        }
        if (cityInfo.food) {
          response += ` \n\nMust-try food: ${cityInfo.food.slice(0, 3).join(', ')}.`;
        }
        return response;
      }
      
      return `${city} is a wonderful destination! ${cityInfo.extract.substring(0, 100)}... Would you like to know about attractions, weather, or plan a route to ${city}?`;
    }

    if (intent === 'places' && entities.cities.length > 0) {
      const city = entities.cities[0];
      const cityInfo = this.services.wikipedia.getOfflineCityInfo(city);
      
      let response = `${city} has amazing attractions! `;
      if (cityInfo.attractions && cityInfo.attractions.length > 0) {
        response += `Top places to visit: ${cityInfo.attractions.join(', ')}. `;
      }
      if (cityInfo.food && cityInfo.food.length > 0) {
        response += `Must-try food: ${cityInfo.food.join(', ')}. `;
      }
      response += `Add ${city} to your trip for detailed route planning!`;
      
      return response;
    }

    // Handle weather questions
    if (intent === 'weather' && entities.cities.length > 0) {
      const city = entities.cities[0];
      const weatherAdvice = this.services.weather.getWeatherAdvice(city);
      return weatherAdvice;
    }

    // Handle weather questions without cities
    if (intent === 'weather' && msg.includes('weather') && !entities.cities.length) {
      return "I'd love to help with weather information! Which city or destination are you asking about? Just mention the city name and I'll provide weather details.";
    }

    // Handle country/region questions
    if (msg.includes('america') || msg.includes('usa')) {
      if (msg.includes('special') || msg.includes('attractions')) {
        return "America has incredible diversity! From New York's skyline to California's beaches, Grand Canyon, Yellowstone, Disney World, and vibrant cities like San Francisco and Chicago. What type of experience interests you most?";
      }
      if (msg.includes('where')) {
        return "America (United States) is in North America, bordered by Canada and Mexico. It spans from the Atlantic to Pacific Ocean with 50 states. Which American cities would you like to explore?";
      }
    }

    // Handle action requests
    if (msg.includes('do it') || msg.includes('add them') || msg.includes('create route')) {
      if (context.lastCities && context.lastCities.length >= 2) {
        return `I'd love to add ${context.lastCities.join(' and ')} to your route! Please use the search box above to add these cities, then I can optimize the path for you.`;
      }
      return "I'm ready to help! Please use the search box to add your destinations, and I'll create the perfect route for you.";
    }

    // Handle greetings with context
    if (intent === 'greeting') {
      const greetings = [
        "Hello! I'm your AI travel assistant. I can help you plan routes, check weather, and discover amazing places. Where would you like to go?",
        "Hi there! Ready to plan an incredible journey? I can help with routes, weather forecasts, and finding the best attractions.",
        "Hey! I'm here to make your travel planning effortless. Tell me your destinations and I'll create the perfect itinerary!"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    return null;
  }

  estimateDistance(city1, city2) {
    // Comprehensive distance database
    const distances = {
      // Indian routes
      'theni-madurai': 70, 'madurai-theni': 70,
      'chennai-bangalore': 350, 'bangalore-chennai': 350,
      'chennai-madurai': 460, 'madurai-chennai': 460,
      'mumbai-pune': 150, 'pune-mumbai': 150,
      'mumbai-delhi': 1400, 'delhi-mumbai': 1400,
      'delhi-jaipur': 280, 'jaipur-delhi': 280,
      'bangalore-mumbai': 980, 'mumbai-bangalore': 980,
      'kolkata-delhi': 1470, 'delhi-kolkata': 1470,
      
      // International routes (flight distances)
      'chennai-london': 8300, 'london-chennai': 8300,
      'mumbai-london': 7200, 'london-mumbai': 7200,
      'delhi-london': 6700, 'london-delhi': 6700,
      'london-paris': 450, 'paris-london': 450,
      'london-newyork': 5500, 'newyork-london': 5500,
      'paris-newyork': 5800, 'newyork-paris': 5800,
      'tokyo-osaka': 400, 'osaka-tokyo': 400,
      'singapore-bangkok': 1400, 'bangkok-singapore': 1400,
      'dubai-mumbai': 1900, 'mumbai-dubai': 1900,
      
      // Country to country estimates
      'india-unitedstates': 15000, 'unitedstates-india': 15000,
      'india-unitedkingdom': 8000, 'unitedkingdom-india': 8000,
      'india-france': 7500, 'france-india': 7500
    };
    
    const key1 = `${city1.toLowerCase().replace(/\s+/g, '')}-${city2.toLowerCase().replace(/\s+/g, '')}`;
    const key2 = `${city2.toLowerCase().replace(/\s+/g, '')}-${city1.toLowerCase().replace(/\s+/g, '')}`;
    
    return distances[key1] || distances[key2] || this.calculateApproximateDistance(city1, city2);
  }

  calculateApproximateDistance(city1, city2) {
    // Determine if it's domestic or international
    const indianCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'jaipur', 'madurai', 'theni'];
    const isCity1Indian = indianCities.some(city => city1.toLowerCase().includes(city));
    const isCity2Indian = indianCities.some(city => city2.toLowerCase().includes(city));
    
    if (isCity1Indian && isCity2Indian) {
      // Domestic Indian route
      return Math.floor(Math.random() * 1500) + 200;
    } else if (isCity1Indian || isCity2Indian) {
      // International route
      return Math.floor(Math.random() * 5000) + 5000;
    } else {
      // International to international
      return Math.floor(Math.random() * 3000) + 1000;
    }
  }

  async generateEnhancedResponse(message, intent, entities, context) {
    try {
      // Handle weather with real API data
      if (intent === 'weather' && entities.cities.length > 0) {
        const city = entities.cities[0];
        const weatherInfo = await this.services.weather.getWeatherInfo(city);
        if (weatherInfo && weatherInfo.temperature) {
          return `Weather in ${city}: ${weatherInfo.temperature}, ${weatherInfo.condition}. ${weatherInfo.advice}`;
        }
      }

      // Handle city information with Wikipedia
      if (entities.cities.length === 1 && (intent === 'general' || intent === 'places')) {
        const city = entities.cities[0];
        const cityInfo = await this.services.wikipedia.getCityInfo(city);
        
        if (cityInfo && cityInfo.extract) {
          let response = `${cityInfo.extract}`;
          if (cityInfo.attractions) {
            response += ` \n\nTop attractions: ${cityInfo.attractions.slice(0, 3).join(', ')}.`;
          }
          return response;
        }
      }
    } catch (error) {
      console.log('Enhanced response failed:', error);
    }
    
    return null;
  }

  getFallbackResponse(message, context) {
    const fallbacks = [
      "I'm here to help you plan your perfect trip! What destinations are you thinking about?",
      "Let me assist you with your travel planning. Where would you like to go?",
      "I can help you create an amazing journey. Tell me about your travel plans!"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// Initialize AI Manager
window.aiManager = new AIManager();