// NLP Service - Advanced natural language processing
class NLPService {
  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);
  }

  extractEntities(message) {
    const entities = {
      cities: [],
      places: [],
      activities: [],
      keywords: []
    };

    // Extract potential city names (capitalized words)
    const words = message.split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length > 2 && /^[A-Z]/.test(cleanWord)) {
        entities.cities.push(cleanWord);
      }
    });

    // Extract activities
    const activityPatterns = [
      /\b(visit|see|explore|tour|travel|go to|trip to|journey to)\b/gi,
      /\b(vacation|holiday|sightseeing|adventure)\b/gi
    ];

    activityPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        entities.activities.push(...matches.map(m => m.toLowerCase()));
      }
    });

    // Extract place types
    const placePatterns = [
      /\b(temple|palace|fort|beach|hill|mountain|lake|park|museum|market|restaurant|hotel|mall|airport|station)\b/gi,
      /\b(attraction|landmark|monument|gallery|theater|stadium)\b/gi
    ];

    placePatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        entities.places.push(...matches.map(m => m.toLowerCase()));
      }
    });

    // Extract keywords (important non-stop words)
    entities.keywords = this.extractKeywords(message);

    return entities;
  }

  extractKeywords(message) {
    return message.toLowerCase()
      .split(/\s+/)
      .map(word => word.replace(/[^a-z]/g, ''))
      .filter(word => word.length > 2)
      .filter(word => !this.stopWords.has(word))
      .slice(0, 10);
  }

  analyzeIntent(message, entities) {
    const msg = message.toLowerCase();
    const scores = {};

    // Route planning analysis
    scores.route_planning = this.calculateRouteScore(msg, entities);
    
    // Weather analysis
    scores.weather = this.calculateWeatherScore(msg, entities);
    
    // Places analysis
    scores.places = this.calculatePlacesScore(msg, entities);
    
    // Greeting analysis
    scores.greeting = this.calculateGreetingScore(msg);
    
    // Help analysis
    scores.help = this.calculateHelpScore(msg);
    
    // Location search analysis
    scores.location = this.calculateLocationScore(msg);

    // Find best intent
    const bestIntent = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );

    return {
      intent: bestIntent,
      confidence: scores[bestIntent]
    };
  }

  calculateRouteScore(msg, entities) {
    let score = 0;

    // Direct route keywords
    const routeKeywords = ['plan', 'route', 'trip', 'journey', 'travel', 'navigate', 'directions', 'path'];
    routeKeywords.forEach(keyword => {
      if (msg.includes(keyword)) score += 0.3;
    });

    // Preposition patterns (from X to Y)
    if (msg.includes(' to ') || msg.includes(' from ')) score += 0.4;
    if (msg.match(/\bfrom\s+\w+\s+to\s+\w+/)) score += 0.5;

    // Multiple cities mentioned
    if (entities.cities && entities.cities.length >= 2) score += 0.6;

    // Transportation keywords
    const transportKeywords = ['drive', 'car', 'bus', 'train', 'flight', 'walk'];
    transportKeywords.forEach(keyword => {
      if (msg.includes(keyword)) score += 0.2;
    });

    return Math.min(score, 1.0);
  }

  calculateWeatherScore(msg, entities) {
    let score = 0;

    const weatherKeywords = ['weather', 'temperature', 'rain', 'sunny', 'cloudy', 'hot', 'cold', 'climate', 'forecast'];
    weatherKeywords.forEach(keyword => {
      if (msg.includes(keyword)) score += 0.6;
    });

    // Weather-related questions
    if (msg.includes('how is the weather') || msg.includes('what is the temperature')) score += 0.7;
    if (msg.startsWith('weather') || msg.endsWith('weather')) score += 0.5;

    return Math.min(score, 1.0);
  }

  calculatePlacesScore(msg, entities) {
    let score = 0;

    const placeKeywords = ['visit', 'see', 'explore', 'attractions', 'places', 'tourist', 'sightseeing'];
    placeKeywords.forEach(keyword => {
      if (msg.includes(keyword)) score += 0.4;
    });

    // Recommendation keywords
    const recKeywords = ['recommend', 'suggest', 'best', 'top', 'famous', 'popular', 'special'];
    recKeywords.forEach(keyword => {
      if (msg.includes(keyword)) score += 0.4;
    });

    // "What is special in" pattern
    if (msg.includes('what') && msg.includes('special')) score += 0.6;
    if (msg.includes('what') && msg.includes('famous')) score += 0.6;

    // Place types mentioned
    if (entities.places && entities.places.length > 0) score += 0.4;

    return Math.min(score, 1.0);
  }

  calculateGreetingScore(msg) {
    let score = 0;

    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon'];
    greetings.forEach(greeting => {
      if (msg.includes(greeting)) score += 0.8;
    });

    // Short messages are more likely to be greetings
    if (msg.split(' ').length <= 3) score += 0.2;

    return Math.min(score, 1.0);
  }

  calculateHelpScore(msg) {
    let score = 0;

    const helpKeywords = ['help', 'guide', 'assist', 'support', 'explain'];
    helpKeywords.forEach(keyword => {
      if (msg.includes(keyword)) score += 0.4;
    });

    // Question words (but not weather or location specific)
    const questionWords = ['how', 'what', 'why', 'when'];
    questionWords.forEach(word => {
      if (msg.startsWith(word + ' ') && !msg.includes('weather') && !msg.includes('where')) {
        score += 0.3;
      }
    });

    // Question patterns
    if (msg.endsWith('?') && !msg.includes('weather') && !msg.includes('where')) score += 0.2;

    return Math.min(score, 1.0);
  }

  calculateLocationScore(msg) {
    let score = 0;

    const locationKeywords = ['where', 'find', 'search', 'locate', 'address', 'coordinates'];
    locationKeywords.forEach(keyword => {
      if (msg.includes(keyword)) score += 0.4;
    });

    return Math.min(score, 1.0);
  }

  generateTemplateResponse(message, intent, entities, context) {
    const templates = this.getResponseTemplates();
    const intentTemplates = templates[intent] || templates.general;
    
    // Select template based on context
    let selectedTemplate;
    if (entities.cities && entities.cities.length >= 2) {
      selectedTemplate = intentTemplates.multiCity || intentTemplates.default;
    } else if (entities.cities && entities.cities.length === 1) {
      selectedTemplate = intentTemplates.singleCity || intentTemplates.default;
    } else {
      selectedTemplate = intentTemplates.default;
    }

    // Replace placeholders
    let response = Array.isArray(selectedTemplate) 
      ? selectedTemplate[Math.floor(Math.random() * selectedTemplate.length)]
      : selectedTemplate;

    // Replace city placeholders
    if (entities.cities && entities.cities.length > 0) {
      response = response.replace('{city1}', entities.cities[0]);
      if (entities.cities.length > 1) {
        response = response.replace('{city2}', entities.cities[1]);
      }
    }

    return response;
  }

  getResponseTemplates() {
    return {
      route_planning: {
        multiCity: [
          "Perfect! I can help you plan a route from {city1} to {city2}. Use the search box to add these destinations and I'll optimize the path!",
          "Great choice! {city1} to {city2} sounds like an amazing journey. Let me help you create the best route with real-time traffic data.",
          "Excellent! I'll help you plan the optimal route from {city1} to {city2}. Add these cities to start building your trip!"
        ],
        singleCity: [
          "I'd love to help you plan a trip to {city1}! Add it to your route and tell me where you'd like to start from.",
          "{city1} is a wonderful destination! Where would you like to travel from to create your route?"
        ],
        default: [
          "I'm ready to help you plan the perfect route! Tell me your starting point and destination.",
          "Let's create an amazing journey together! Which cities would you like to travel between?"
        ]
      },
      weather: {
        singleCity: [
          "I can check the weather for {city1}! Add it to your trip and click the Weather button for detailed forecasts.",
          "Weather planning for {city1} is smart! Add the city to your route to get current conditions and forecasts."
        ],
        default: [
          "Weather information is crucial for travel planning! Add your destinations to get accurate forecasts.",
          "I can provide weather updates for any city. Just add your destinations to the trip!"
        ]
      },
      places: {
        singleCity: [
          "I'd love to help you discover amazing places in {city1}! What type of attractions interest you most?",
          "{city1} has so many wonderful attractions! Add it to your trip and I'll show you the best places to visit."
        ],
        default: [
          "I can help you find incredible places to visit! Which destinations are you considering?",
          "There are amazing attractions everywhere! Tell me which cities you're interested in exploring."
        ]
      },
      greeting: {
        default: [
          "Hello! I'm your AI travel assistant. Ready to plan an incredible journey?",
          "Hi there! I'm here to help you create the perfect trip. Where would you like to explore?",
          "Hey! Let's plan something amazing together. What destinations are calling to you?"
        ]
      },
      help: {
        default: [
          "I'm your intelligent travel assistant! I can help plan routes, check weather, find attractions, and optimize your journeys. What would you like to know?",
          "I'm here to make travel planning effortless! Ask me about destinations, routes, weather, or attractions anywhere in the world.",
          "I can assist with trip planning, route optimization, weather forecasts, and discovering amazing places. How can I help you today?"
        ]
      },
      general: {
        default: [
          "I'm here to help with all your travel planning needs! What adventure shall we create together?",
          "Let me assist you in planning the perfect trip. What would you like to explore?",
          "I'm your travel companion for planning amazing journeys. How can I help you today?"
        ]
      }
    };
  }
}