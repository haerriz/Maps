// Cohere AI Service (Free Tier)
class CohereService {
  constructor() {
    this.baseUrl = 'https://api.cohere.ai/v1';
    // Note: Cohere offers free tier but requires API key
    // Using alternative free text analysis services
    this.alternatives = [
      'https://api.meaningcloud.com/sentiment-2.1',
      'https://api.textrazor.com',
      'https://api.aylien.com/api/v1'
    ];
  }

  async classifyIntent(message) {
    // Use free text classification alternatives
    try {
      const classification = await this.classifyWithAlternatives(message);
      if (classification) return classification;
    } catch (error) {
      console.log('Cohere alternatives failed:', error);
    }

    // Fallback to rule-based classification
    return this.ruleBasedClassification(message);
  }

  async classifyWithAlternatives(message) {
    if (location.protocol === 'file:') return null;

    // Try free sentiment/classification APIs
    const intents = [
      'route planning', 'weather inquiry', 'place recommendation',
      'greeting', 'help request', 'location search'
    ];

    // Simple keyword-based classification with confidence scoring
    const scores = {};
    intents.forEach(intent => {
      scores[intent] = this.calculateIntentScore(message, intent);
    });

    const bestIntent = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );

    return {
      intent: this.mapIntentName(bestIntent),
      confidence: scores[bestIntent]
    };
  }

  calculateIntentScore(message, intent) {
    const msg = message.toLowerCase();
    const keywords = {
      'route planning': ['plan', 'route', 'from', 'to', 'travel', 'trip', 'journey', 'navigate'],
      'weather inquiry': ['weather', 'temperature', 'rain', 'sunny', 'climate', 'forecast'],
      'place recommendation': ['visit', 'see', 'attractions', 'places', 'recommend', 'suggest'],
      'greeting': ['hi', 'hello', 'hey', 'good morning', 'good evening'],
      'help request': ['help', 'how', 'what', 'guide', 'assist'],
      'location search': ['where', 'find', 'search', 'locate', 'address']
    };

    const intentKeywords = keywords[intent] || [];
    let score = 0;

    intentKeywords.forEach(keyword => {
      if (msg.includes(keyword)) {
        score += 0.2;
      }
    });

    // Boost score for exact matches
    if (intentKeywords.some(keyword => msg === keyword)) {
      score += 0.5;
    }

    return Math.min(score, 1.0);
  }

  mapIntentName(intent) {
    const mapping = {
      'route planning': 'route_planning',
      'weather inquiry': 'weather',
      'place recommendation': 'places',
      'greeting': 'greeting',
      'help request': 'help',
      'location search': 'location'
    };
    return mapping[intent] || 'general';
  }

  ruleBasedClassification(message) {
    const msg = message.toLowerCase();
    
    // Route planning patterns
    if (msg.includes(' to ') || msg.includes(' from ') || 
        msg.includes('plan') || msg.includes('route')) {
      return { intent: 'route_planning', confidence: 0.8 };
    }

    // Weather patterns
    if (msg.includes('weather') || msg.includes('temperature') || 
        msg.includes('rain') || msg.includes('sunny')) {
      return { intent: 'weather', confidence: 0.8 };
    }

    // Places patterns
    if (msg.includes('visit') || msg.includes('see') || 
        msg.includes('attractions') || msg.includes('places')) {
      return { intent: 'places', confidence: 0.8 };
    }

    // Greeting patterns
    if (msg.includes('hi') || msg.includes('hello') || 
        msg.includes('hey') || msg.includes('good')) {
      return { intent: 'greeting', confidence: 0.9 };
    }

    // Help patterns
    if (msg.includes('help') || msg.includes('how') || 
        msg.includes('what') || msg.includes('who')) {
      return { intent: 'help', confidence: 0.8 };
    }

    return { intent: 'general', confidence: 0.5 };
  }

  async generateResponse(message, intent, entities, context) {
    // Use template-based generation since Cohere requires API key
    return this.generateTemplateResponse(message, intent, entities, context);
  }

  generateTemplateResponse(message, intent, entities, context) {
    const templates = {
      route_planning: [
        `I can help you plan a route${entities.cities.length >= 2 ? ` from ${entities.cities[0]} to ${entities.cities[1]}` : ''}! Use the search box to add your destinations.`,
        `Great! Let me help you create the perfect route${entities.cities.length > 0 ? ` for ${entities.cities.join(' and ')}` : ''}. Add your stops and I'll optimize the path.`
      ],
      weather: [
        `I can check the weather${entities.cities.length > 0 ? ` for ${entities.cities[0]}` : ' for your destinations'}! Add locations to your trip for weather forecasts.`,
        `Weather planning is important for travel${entities.cities.length > 0 ? ` to ${entities.cities[0]}` : ''}. Click the Weather button after adding destinations.`
      ],
      places: [
        `I'd love to help you discover amazing places${entities.cities.length > 0 ? ` in ${entities.cities[0]}` : ''}! What type of attractions interest you?`,
        `There are so many great places to explore${entities.cities.length > 0 ? ` around ${entities.cities[0]}` : ''}. Add destinations to see nearby attractions.`
      ],
      greeting: [
        "Hello! I'm your AI travel assistant. Ready to plan an amazing journey?",
        "Hi there! I'm here to help you create the perfect trip. Where would you like to go?",
        "Hey! Let's plan something exciting together. What destinations are calling you?"
      ],
      help: [
        "I'm your intelligent travel assistant! I can help plan routes, check weather, find attractions, and optimize your journeys.",
        "I'm here to make travel planning easy! Ask me about destinations, routes, weather, or attractions anywhere in the world.",
        "I can assist with trip planning, route optimization, weather forecasts, and finding amazing places to visit!"
      ]
    };

    const intentTemplates = templates[intent] || [
      "I'm here to help with your travel planning! What would you like to know?",
      "Let me assist you with your journey. How can I help make your trip amazing?"
    ];

    return intentTemplates[Math.floor(Math.random() * intentTemplates.length)];
  }
}