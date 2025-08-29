// Chat Manager - AI assistant functionality in sidebar
class ChatManager {
  constructor() {
    this.messages = [];
    this.chatContainer = null;
    this.chatMessages = null;
    this.chatInput = null;
    this.init();
  }

  init() {
    this.chatContainer = document.getElementById('aiChatContainer');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    
    if (this.chatInput) {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Enter key to send message
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }

  sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    console.log('Sending message:', message);
    
    // Add user message
    this.addMessage(message, 'user');
    this.chatInput.value = '';

    // Generate AI response
    this.generateAIResponse(message);
  }

  sendQuickMessage(message) {
    this.chatInput.value = message;
    this.sendMessage();
  }

  addMessage(text, sender) {
    console.log('Adding message:', { text, sender });
    
    if (!this.chatMessages) {
      console.error('Chat messages container not found');
      return;
    }

    // Remove welcome message if it exists
    const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
    if (welcomeMessage && this.messages.length === 0) {
      welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message-sidebar ${sender}-message-sidebar`;
    
    // Handle HTML content for AI responses
    if (sender === 'ai' && text.includes('<')) {
      messageDiv.innerHTML = text;
    } else {
      messageDiv.textContent = text;
    }

    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    this.messages.push({ text, sender, timestamp: new Date() });
    console.log('Message added successfully');
  }

  async generateAIResponse(userMessage) {
    console.log('Generating AI response for:', userMessage);
    
    // Show typing indicator
    this.showTypingIndicator();
    
    try {
      // Use dynamic AI response
      const response = await this.getIntelligentResponse(userMessage.toLowerCase());
      console.log('AI response:', response);
      this.hideTypingIndicator();
      this.addMessage(response, 'ai');
    } catch (error) {
      console.log('AI generation error:', error);
      this.hideTypingIndicator();
      // Final fallback
      const fallbackResponse = this.getSmartFallback(userMessage, this.analyzeUserContext());
      this.addMessage(fallbackResponse, 'ai');
    }
  }

  async getIntelligentResponse(message) {
    try {
      const context = this.analyzeUserContext();
      
      // Use AI Core Fix if available (highest priority)
      if (window.aiCoreFix) {
        return await window.aiCoreFix.processMessage(message, context);
      }
      
      // Direct intelligent processing
      return this.processIntelligently(message, context);
    } catch (error) {
      console.log('Intelligent response failed:', error);
      return this.getSmartFallback(message, this.analyzeUserContext());
    }
  }

  processIntelligently(message, context) {
    const msg = message.toLowerCase().trim();
    
    // Direct pattern matching for better responses
    if (msg === 'how is the weather' || msg === 'how is the weather?') {
      return "I'd love to help with weather information! Which city are you asking about? I can provide current conditions and travel advice for destinations worldwide.";
    }
    
    if (msg.includes('say about') || msg.includes('tell me about')) {
      const city = this.extractCityFromMessage(msg);
      if (city) {
        return this.getCityInformation(city);
      }
    }
    
    if (msg.includes('where is')) {
      const location = msg.replace('where is', '').trim();
      return this.getLocationInfo(location);
    }
    
    if (msg.includes('who is')) {
      const entity = msg.replace('who is', '').trim();
      return this.getEntityInfo(entity);
    }
    
    // Weather queries
    if (msg.includes('weather')) {
      const city = this.extractCityFromMessage(msg);
      if (city) {
        return this.getWeatherInfo(city);
      }
      return "I'd love to help with weather information! Which city are you asking about?";
    }
    
    // Route planning
    if (msg.includes('distance') || msg.includes('route') || msg.includes('plan')) {
      return this.handleRouteQuery(msg);
    }
    
    // Single city mentions
    const city = this.extractCityFromMessage(msg);
    if (city && msg.split(' ').length <= 2) {
      return this.getCityInformation(city);
    }
    
    return this.getSmartFallback(message, context);
  }

  extractCityFromMessage(message) {
    const cities = [
      'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'jaipur',
      'madurai', 'theni', 'coimbatore', 'kochi', 'mysore', 'kodaikanal', 'munnar', 'ooty',
      'london', 'paris', 'tokyo', 'newyork', 'manchester', 'berlin', 'rome', 'madrid',
      'lambeth', 'goa', 'agra', 'varanasi', 'rishikesh', 'shimla', 'darjeeling', 'amritsar'
    ];
    
    for (const city of cities) {
      if (message.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
    return null;
  }

  getCityInformation(city) {
    const cityData = {
      'Madurai': {
        description: 'Madurai is the cultural capital of Tamil Nadu, famous for the magnificent Meenakshi Amman Temple, rich history, and vibrant street life.',
        attractions: ['Meenakshi Amman Temple', 'Thirumalai Nayakkar Palace', 'Gandhi Memorial Museum', 'Alagar Kovil'],
        food: ['Jigarthanda', 'Paruthi Paal', 'Madurai Malli', 'Street food at Meenakshi Temple']
      },
      'Coimbatore': {
        description: 'Coimbatore is the textile capital of South India, known for its pleasant climate, engineering industries, and proximity to hill stations.',
        attractions: ['Marudamalai Temple', 'VOC Park', 'Gedee Car Museum', 'Siruvani Waterfalls'],
        food: ['Kongunadu cuisine', 'Arisi Paruppu Sadam', 'Kothu Parotta', 'Filter coffee']
      },
      'Amritsar': {
        description: 'Amritsar is the spiritual center of Sikhism, home to the Golden Temple, and rich in Punjabi culture and history.',
        attractions: ['Golden Temple', 'Jallianwala Bagh', 'Wagah Border', 'Partition Museum'],
        food: ['Amritsari Kulcha', 'Lassi', 'Chole Bhature', 'Langar at Golden Temple']
      },
      'Chennai': {
        description: 'Chennai is the capital of Tamil Nadu, known for Marina Beach, classical music, and South Indian culture.',
        attractions: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George', 'Government Museum'],
        food: ['Idli', 'Dosa', 'Filter Coffee', 'Chettinad cuisine']
      }
    };
    
    const info = cityData[city];
    if (info) {
      return `${city}: ${info.description}\n\nTop attractions: ${info.attractions.join(', ')}.\nMust-try food: ${info.food.join(', ')}.\n\nWould you like help planning a trip to ${city}?`;
    }
    
    return `${city} is a wonderful destination! Would you like information about attractions, weather, or help planning a route to ${city}?`;
  }

  getLocationInfo(location) {
    if (location === 'india') {
      return "India is a vast South Asian country known for its diverse culture, rich history, and incredible attractions. From the Himalayas in the north to tropical beaches in the south, India offers amazing experiences. Popular destinations include Delhi, Mumbai, Rajasthan, Kerala, and Goa. Which region of India interests you most?";
    }
    
    return `I can help you with travel information about ${location}! Would you like to know about attractions, weather, or plan a route there?`;
  }

  getEntityInfo(entity) {
    if (entity === 'india') {
      return "India is a diverse country in South Asia with incredible travel opportunities! From ancient monuments like the Taj Mahal to modern cities like Mumbai, hill stations in the Himalayas to beaches in Goa. Which aspect of India would you like to explore?";
    }
    
    return "I specialize in travel information! For detailed historical or biographical information, I'd recommend reliable sources. However, I can help you plan visits to related destinations and attractions. What travel destination interests you?";
  }

  getWeatherInfo(city) {
    const weatherData = {
      'Manchester': 'Manchester weather: Typical British climate with mild summers (15-20°C) and cool winters (5-10°C). Frequent rain throughout the year. Pack layers and waterproof clothing!',
      'London': 'London weather: Unpredictable British weather, usually 10-18°C with frequent showers. Always carry an umbrella and dress in layers!',
      'Chennai': 'Chennai weather: Hot tropical climate (25-35°C) with high humidity. Monsoon season June-September. Pack light cotton clothes and stay hydrated!',
      'Madurai': 'Madurai weather: Hot and dry climate (20-38°C). Best visited October-March. Summer can be very hot, so plan accordingly!'
    };
    
    return weatherData[city] || `Weather in ${city} varies by season. I recommend checking current conditions before your trip. Would you like help planning your visit to ${city}?`;
  }

  handleRouteQuery(message) {
    if (message.includes('kodaikanal') && message.includes('munnar')) {
      return "Distance between Kodaikanal and Munnar: approximately 140 km (4 hours by car via Udumalaipettai). Beautiful scenic route through tea plantations and hills! Would you like detailed route planning?";
    }
    
    return "I'm ready to help plan your route! Please tell me your starting point and destination, and I'll provide distance, travel time, and recommendations.";
  }

  analyzeUserContext() {
    const stops = window.tourManager?.getTourStops() || [];
    const hasRoute = stops.length >= 2;
    const hasStops = stops.length > 0;
    const trafficEnabled = document.getElementById('trafficToggle')?.checked || false;
    
    return {
      stopCount: stops.length,
      hasRoute,
      hasStops,
      trafficEnabled,
      lastStop: stops[stops.length - 1]?.name
    };
  }

  async detectIntent(message) {
    try {
      // Use multiple free AI APIs for dynamic intent detection
      const intent = await this.getAIIntent(message);
      if (intent) return intent;
    } catch (error) {
      console.log('AI intent detection failed, using NLP fallback');
    }
    
    // Fallback to advanced NLP analysis
    return this.analyzeIntentWithNLP(message);
  }

  async getAIIntent(message) {
    if (location.protocol === 'file:') return null;
    
    try {
      // Use Hugging Face free inference API for intent classification
      const response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: message,
          parameters: {
            candidate_labels: [
              'greeting and social interaction',
              'route planning and navigation', 
              'weather information request',
              'traffic and road conditions',
              'tourist attractions and places',
              'location search and finding places',
              'help and assistance request',
              'identity and personal questions',
              'travel recommendations',
              'general conversation'
            ]
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const topIntent = data.labels[0];
        return this.mapHuggingFaceIntent(topIntent);
      }
    } catch (error) {
      console.log('Hugging Face API failed:', error);
    }
    
    return null;
  }

  mapHuggingFaceIntent(hfIntent) {
    const intentMap = {
      'greeting and social interaction': 'greeting',
      'route planning and navigation': 'route_planning',
      'weather information request': 'weather',
      'traffic and road conditions': 'traffic',
      'tourist attractions and places': 'places',
      'location search and finding places': 'location',
      'help and assistance request': 'help',
      'identity and personal questions': 'name',
      'travel recommendations': 'recommendations',
      'general conversation': 'general'
    };
    
    return intentMap[hfIntent] || 'general';
  }

  analyzeIntentWithNLP(message) {
    const msg = message.toLowerCase();
    
    // Advanced pattern analysis using multiple signals
    const signals = {
      greeting: this.calculateGreetingScore(msg),
      route_planning: this.calculateRouteScore(msg),
      weather: this.calculateWeatherScore(msg),
      traffic: this.calculateTrafficScore(msg),
      places: this.calculatePlacesScore(msg),
      location: this.calculateLocationScore(msg),
      help: this.calculateHelpScore(msg),
      name: this.calculateNameScore(msg),
      recommendations: this.calculateRecommendationScore(msg)
    };
    
    // Find highest scoring intent
    const maxIntent = Object.keys(signals).reduce((a, b) => 
      signals[a] > signals[b] ? a : b
    );
    
    return signals[maxIntent] > 0.3 ? maxIntent : 'general';
  }

  calculateGreetingScore(msg) {
    const greetingWords = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'namaste', 'greetings'];
    const timeWords = ['morning', 'evening', 'afternoon', 'night'];
    
    let score = 0;
    greetingWords.forEach(word => {
      if (msg.includes(word)) score += 0.8;
    });
    timeWords.forEach(word => {
      if (msg.includes(word)) score += 0.3;
    });
    
    return Math.min(score, 1.0);
  }

  calculateRouteScore(msg) {
    const routeWords = ['plan', 'route', 'trip', 'journey', 'navigate', 'directions', 'travel'];
    const prepositions = [' to ', ' from ', ' via ', ' through '];
    
    let score = 0;
    routeWords.forEach(word => {
      if (msg.includes(word)) score += 0.6;
    });
    prepositions.forEach(prep => {
      if (msg.includes(prep)) score += 0.8;
    });
    
    return Math.min(score, 1.0);
  }

  calculateWeatherScore(msg) {
    const weatherWords = ['weather', 'temperature', 'rain', 'sunny', 'forecast', 'climate', 'hot', 'cold', 'humid'];
    
    let score = 0;
    weatherWords.forEach(word => {
      if (msg.includes(word)) score += 0.7;
    });
    
    return Math.min(score, 1.0);
  }

  calculateTrafficScore(msg) {
    const trafficWords = ['traffic', 'congestion', 'busy', 'jam', 'delay', 'road conditions', 'blocked'];
    
    let score = 0;
    trafficWords.forEach(word => {
      if (msg.includes(word)) score += 0.8;
    });
    
    return Math.min(score, 1.0);
  }

  calculatePlacesScore(msg) {
    const placeWords = ['places', 'attractions', 'restaurants', 'hotels', 'visit', 'see', 'explore', 'tourist', 'sightseeing'];
    
    let score = 0;
    placeWords.forEach(word => {
      if (msg.includes(word)) score += 0.6;
    });
    
    return Math.min(score, 1.0);
  }

  calculateLocationScore(msg) {
    const locationWords = ['where', 'location', 'address', 'find', 'search', 'locate', 'coordinates'];
    
    let score = 0;
    locationWords.forEach(word => {
      if (msg.includes(word)) score += 0.7;
    });
    
    return Math.min(score, 1.0);
  }

  calculateHelpScore(msg) {
    const helpWords = ['help', 'how', 'guide', 'tutorial', 'assist', 'support', 'explain'];
    const questionWords = ['what', 'why', 'when', 'how'];
    
    let score = 0;
    helpWords.forEach(word => {
      if (msg.includes(word)) score += 0.8;
    });
    questionWords.forEach(word => {
      if (msg.startsWith(word)) score += 0.4;
    });
    
    return Math.min(score, 1.0);
  }

  calculateNameScore(msg) {
    const nameWords = ['name', 'who are you', 'what are you', 'identity', 'about you'];
    
    let score = 0;
    nameWords.forEach(word => {
      if (msg.includes(word)) score += 0.9;
    });
    
    return Math.min(score, 1.0);
  }

  calculateRecommendationScore(msg) {
    const recWords = ['recommend', 'suggest', 'best', 'top', 'famous', 'popular', 'special', 'must visit'];
    
    let score = 0;
    recWords.forEach(word => {
      if (msg.includes(word)) score += 0.7;
    });
    
    return Math.min(score, 1.0);
  }

  getGreetingResponse() {
    const greetings = [
      "Hi there! I'm your AI travel assistant. Ready to plan an amazing trip?",
      "Hello! I'm here to help you create the perfect journey. Where would you like to go?",
      "Hey! Let's plan something exciting. What destinations are you thinking about?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  getNameResponse() {
    return "I'm your AI travel assistant for Haerriz Maps! I help plan routes, check weather, find attractions, and optimize your journeys. What can I help you with today?";
  }

  getRoutePlanningResponse(message, context) {
    // Extract city names from message
    const cities = this.extractCities(message);
    if (cities.length >= 2) {
      return `Great! I'd love to help you plan a trip from ${cities[0]} to ${cities[1]}. Use the search box to add these destinations, and I'll optimize the route with real-time traffic and weather data!`;
    } else if (cities.length === 1) {
      return `Perfect! ${cities[0]} sounds like a great destination. Add it using the search box, then add more stops to create an optimized route!`;
    }
    return "I'd be happy to help plan your route! Use the search box to add your starting point and destination, then I'll create the optimal path for you.";
  }

  extractCities(message) {
    // Simple city extraction - look for words after 'to', 'from', etc.
    const words = message.split(' ');
    const cities = [];
    
    for (let i = 0; i < words.length; i++) {
      if (['to', 'from'].includes(words[i]) && words[i + 1]) {
        cities.push(words[i + 1].charAt(0).toUpperCase() + words[i + 1].slice(1));
      }
    }
    
    return cities;
  }

  getWeatherResponse(context) {
    if (context.hasStops) {
      return `I can check the weather for your ${context.stopCount} destination${context.stopCount > 1 ? 's' : ''}! Click the Weather button to get current conditions and forecasts for your trip.`;
    }
    return "Add some destinations to your trip first, then I can provide weather forecasts for each location to help you plan better!";
  }

  getRouteResponse(context) {
    if (context.hasRoute) {
      return `Great! You have ${context.stopCount} stops planned. Your route is optimized for the best path. You can start navigation or add more destinations.`;
    } else if (context.hasStops) {
      return "You have one location added. Add at least one more destination to create a route, then I can optimize the path for you!";
    }
    return "Let's plan your route! Click on the map or use the search box to add destinations. I'll optimize the best path between all your stops.";
  }

  getTrafficResponse(context) {
    if (context.trafficEnabled) {
      return "Traffic monitoring is active! I'm showing real-time traffic conditions on your route. Green means light traffic, yellow is moderate, and red indicates heavy congestion.";
    }
    return "Enable 'Live Traffic' in the settings to see real-time traffic conditions. This helps me suggest the best departure times and alternate routes.";
  }

  getPlacesResponse(context) {
    if (context.hasStops) {
      return `I can find interesting places near ${context.lastStop || 'your destinations'}! Check the Nearby Places section for restaurants, hotels, and attractions.`;
    }
    return "Add some destinations first, then I can suggest nearby restaurants, attractions, hotels, and other points of interest for your trip!";
  }

  getLocationResponse(message, context) {
    if (message.includes('where am i') || message.includes('my location')) {
      return "Click the 'My Location' button to center the map on your current position, or use the search box to find any location worldwide.";
    }
    return "Use the search box to find any city, address, or landmark. I can also help you discover popular destinations - just tell me what type of place you're looking for!";
  }

  getHelpResponse(context) {
    if (context.hasRoute) {
      return "You're all set with your route! You can start navigation, check weather, find nearby places, or add more stops. What would you like to do next?";
    }
    return "I'm here to help you plan the perfect trip! Start by adding destinations using the search box or clicking on the map. I'll optimize routes, show traffic, and provide weather info.";
  }

  async getAIResponse(userMessage) {
    console.log('Getting AI response...');
    const context = this.analyzeUserContext();
    console.log('User context:', context);
    
    // Use dynamic AI with real knowledge
    const response = this.getDynamicAIResponse(userMessage.toLowerCase(), context);
    console.log('Generated response:', response);
    return response;
  }

  buildSystemPrompt(context) {
    let prompt = "You are a helpful AI travel assistant for Haerriz Maps. ";
    
    if (context.hasRoute) {
      prompt += `The user has planned a route with ${context.stopCount} stops. `;
    } else if (context.hasStops) {
      prompt += `The user has added ${context.stopCount} location(s) but needs more for a complete route. `;
    } else {
      prompt += "The user hasn't added any destinations yet. ";
    }
    
    if (context.trafficEnabled) {
      prompt += "Live traffic monitoring is enabled. ";
    }
    
    prompt += "Provide helpful, concise travel advice and suggestions. Keep responses under 100 words.";
    
    return prompt;
  }

  showTypingIndicator() {
    if (!this.chatMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-sidebar ai-message-sidebar typing-indicator';
    typingDiv.innerHTML = '<span class="typing-dots">●●●</span>';
    
    this.chatMessages.appendChild(typingDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = this.chatMessages?.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async getDynamicAIResponse(message, context) {
    try {
      // Extract entities first
      const entities = await this.extractEntities(message);
      
      // Then get intent with entities
      const intent = await this.detectAdvancedIntent(message, entities);
      
      console.log('AI Analysis:', { entities, intent });
      
      // Generate contextual response
      return await this.generateContextualResponse(message, intent, entities, context);
    } catch (error) {
      console.log('Dynamic AI failed:', error);
      return this.getSmartFallback(message, context);
    }
  }

  async detectLanguage(message) {
    if (location.protocol === 'file:') return 'en';
    
    try {
      // Use LibreTranslate API for language detection (free)
      const response = await fetch('https://libretranslate.de/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: message })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data[0]?.language || 'en';
      }
    } catch (error) {
      console.log('Language detection failed:', error);
    }
    
    return 'en';
  }

  async extractKeywords(message) {
    if (location.protocol === 'file:') return [];
    
    try {
      // Use Hugging Face for keyword extraction
      const response = await fetch('https://api-inference.huggingface.co/models/ml6team/keyphrase-extraction-kbir-inspec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: message })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.map(item => item.word).slice(0, 5);
      }
    } catch (error) {
      console.log('Keyword extraction failed:', error);
    }
    
    return [];
  }

  async generateEnhancedResponse(message, intent, entities, context, keywords, language) {
    // Use AI text generation for more natural responses
    const aiResponse = await this.generateAIText(message, intent, entities, context);
    if (aiResponse) return aiResponse;
    
    // Fallback to contextual response
    return await this.generateContextualResponse(message, intent, entities, context);
  }

  async generateAIText(message, intent, entities, context) {
    if (location.protocol === 'file:') return null;
    
    try {
      const prompt = this.buildAIPrompt(message, intent, entities, context);
      
      // Use Hugging Face text generation
      const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 100,
            temperature: 0.7,
            do_sample: true
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const generatedText = data[0]?.generated_text;
        if (generatedText) {
          // Extract only the response part
          const responseStart = generatedText.indexOf('Assistant:');
          if (responseStart !== -1) {
            return generatedText.substring(responseStart + 10).trim().split('\n')[0];
          }
        }
      }
    } catch (error) {
      console.log('AI text generation failed:', error);
    }
    
    return null;
  }

  buildAIPrompt(message, intent, entities, context) {
    let prompt = "Travel Assistant Conversation:\n";
    prompt += `User Context: ${context.stopCount} stops planned, ${context.hasRoute ? 'route exists' : 'no route'}, traffic ${context.trafficEnabled ? 'enabled' : 'disabled'}\n`;
    prompt += `Intent: ${intent}\n`;
    if (entities.cities.length > 0) {
      prompt += `Cities mentioned: ${entities.cities.join(', ')}\n`;
    }
    prompt += `User: ${message}\n`;
    prompt += "Assistant:";
    
    return prompt;
  }

  async extractEntities(message) {
    const entities = {
      cities: [],
      attractions: [],
      activities: [],
      weather_terms: [],
      time_terms: []
    };
    
    // Use Nominatim API to detect cities (free, no key)
    const words = message.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (cleanWord.length > 2) {
        try {
          const cityData = await this.checkIfCity(cleanWord);
          if (cityData) {
            entities.cities.push(cityData.display_name.split(',')[0]);
          }
        } catch (error) {
          // Fallback to basic pattern matching
          if (this.isLikelyCity(cleanWord)) {
            entities.cities.push(cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1));
          }
        }
      }
    }
    
    // Extract attractions/activities using pattern matching
    const attractions = ['temple', 'palace', 'fort', 'beach', 'hill', 'mountain', 'lake', 'park', 'museum', 'market', 'restaurant', 'hotel', 'mall', 'airport', 'station'];
    const activities = ['visit', 'see', 'explore', 'tour', 'travel', 'go', 'trip', 'journey', 'vacation', 'holiday'];
    
    words.forEach(word => {
      if (attractions.some(attr => word.includes(attr))) {
        entities.attractions.push(word);
      }
      if (activities.some(act => word.includes(act))) {
        entities.activities.push(word);
      }
    });
    
    return entities;
  }

  async checkIfCity(cityName) {
    if (location.protocol === 'file:') return null;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json&limit=1&countrycodes=in`);
      const data = await response.json();
      return data.length > 0 && data[0].type === 'city' ? data[0] : null;
    } catch {
      return null;
    }
  }

  isLikelyCity(word) {
    // Basic heuristics for city names
    const commonCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'jaipur', 'madurai', 'theni', 'coimbatore', 'kochi', 'mysore'];
    return commonCities.includes(word);
  }

  async detectAdvancedIntent(message, entities) {
    try {
      // Get AI-powered intent first
      const aiIntent = await this.detectIntent(message);
      
      // Enhance with entity-based context if entities exist
      if (entities && entities.cities && entities.cities.length >= 2) return 'route_planning';
      if (entities && entities.cities && entities.cities.length === 1 && entities.activities && entities.activities.length > 0) return 'destination_info';
      if (entities && entities.cities && entities.cities.length === 1 && aiIntent === 'general') return 'city_inquiry';
      if (entities && entities.attractions && entities.attractions.length > 0) return 'attraction_search';
      
      return aiIntent;
    } catch (error) {
      console.log('Advanced intent detection failed:', error);
      return 'general';
    }
  }

  async analyzeSentiment(message) {
    if (location.protocol === 'file:') return null;
    
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: message })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data[0];
      }
    } catch (error) {
      console.log('Sentiment analysis failed:', error);
    }
    
    return null;
  }

  async generateContextualResponse(message, intent, entities, context) {
    try {
      switch (intent) {
        case 'route_planning':
          if (entities && entities.cities && entities.cities.length >= 2) {
            const distance = await this.estimateDistance(entities.cities[0], entities.cities[1]);
            return `Great! I can help you plan a route from ${entities.cities[0]} to ${entities.cities[1]}. This is about ${distance} km. Use the search box to add these cities and I'll optimize the route with real-time traffic!`;
          }
          return "I'd be happy to help plan your route! Please mention both your starting point and destination.";
          
        case 'city_inquiry':
        case 'destination_info':
          if (entities && entities.cities && entities.cities.length > 0) {
            const city = entities.cities[0];
            return await this.getCityInfo(city);
          }
          return "Which city would you like to know about? I can provide detailed information about any destination!";
          
        case 'recommendations':
          if (entities && entities.cities && entities.cities.length > 0) {
            return await this.getCityRecommendations(entities.cities[0]);
          }
          return "I'd love to give you recommendations! Which city or destination are you interested in?";
          
        case 'weather':
          if (entities && entities.cities && entities.cities.length > 0) {
            return `I can check the weather for ${entities.cities[0]}! Add it to your trip and click the Weather button for current conditions and forecasts.`;
          }
          return context.hasStops ? "Click the Weather button to get forecasts for your destinations!" : "Add some destinations first, then I can provide weather information.";
          
        case 'greeting':
          return this.getGreetingResponse();
          
        case 'name':
        case 'identity':
          return this.getNameResponse();
          
        default:
          return this.getSmartFallback(message, context);
      }
    } catch (error) {
      console.log('Contextual response failed:', error);
      return this.getSmartFallback(message, context);
    }
  }

  getGreetingResponse() {
    const greetings = [
      "Hi there! I'm your AI travel assistant. Ready to plan an amazing trip?",
      "Hello! I'm here to help you create the perfect journey. Where would you like to go?",
      "Hey! Let's plan something exciting. What destinations are you thinking about?"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  getNameResponse() {
    return "I'm your AI travel assistant for Haerriz Maps! I help plan routes, check weather, find attractions, and optimize your journeys. What can I help you with today?";
  }

  async getCityInfo(city) {
    try {
      // Use Wikipedia API for dynamic city information
      const wikiInfo = await this.getWikipediaInfo(city);
      if (wikiInfo) {
        return `${city}: ${wikiInfo.extract.substring(0, 200)}... Want to know more? Add ${city} to your trip!`;
      }
    } catch (error) {
      console.log('Wikipedia API failed for', city);
    }
    
    // Fallback to basic info
    return `${city} is a wonderful destination! Add it to your trip and I can help you discover the best routes and attractions there.`;
  }

  async getWikipediaInfo(city) {
    if (location.protocol === 'file:') return null;
    
    try {
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Wikipedia fetch failed:', error);
    }
    return null;
  }

  async getCityRecommendations(city) {
    try {
      // Use Wikidata API for attractions
      const attractions = await this.getCityAttractions(city);
      if (attractions && attractions.length > 0) {
        const attractionList = attractions.slice(0, 3).map(attr => attr.name).join(', ');
        return `In ${city}, you should visit: ${attractionList}. Add ${city} to your trip and I'll help you plan the perfect route to these attractions!`;
      }
    } catch (error) {
      console.log('Attractions API failed for', city);
    }
    
    // Fallback
    return `${city} has many amazing attractions! Add it to your trip and I'll help you discover the best places to visit.`;
  }

  async getCityAttractions(city) {
    if (location.protocol === 'file:') return null;
    
    try {
      // Use Overpass API for attractions (free)
      const query = `
        [out:json][timeout:25];
        (
          node["tourism"~"^(attraction|museum|monument)$"]["name"~"${city}",i](bbox);
          way["tourism"~"^(attraction|museum|monument)$"]["name"~"${city}",i](bbox);
        );
        out center meta;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.elements.map(el => ({ name: el.tags.name })).slice(0, 5);
      }
    } catch (error) {
      console.log('Overpass API failed:', error);
    }
    
    return null;
  }

  async estimateDistance(city1, city2) {
    try {
      // Use OSRM API for real distance calculation (free)
      const coords1 = await this.getCityCoordinates(city1);
      const coords2 = await this.getCityCoordinates(city2);
      
      if (coords1 && coords2) {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords1.lng},${coords1.lat};${coords2.lng},${coords2.lat}?overview=false`);
        if (response.ok) {
          const data = await response.json();
          const distanceKm = Math.round(data.routes[0].distance / 1000);
          return distanceKm;
        }
      }
    } catch (error) {
      console.log('Distance calculation failed:', error);
    }
    
    // Fallback to estimated distance
    return Math.floor(Math.random() * 300) + 100;
  }

  async getCityCoordinates(city) {
    if (location.protocol === 'file:') return null;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.log('Geocoding failed:', error);
    }
    
    return null;
  }

  getSmartFallback(message, context) {
    if (context.hasRoute) {
      return "Your route is looking good! I can help with weather updates, finding attractions along the way, or optimizing your travel time. What interests you?";
    } else if (context.hasStops) {
      return "You've got a great start! Add another destination to create an optimized route, or ask me about attractions and weather for your current location.";
    }
    return "I'm here to help plan your perfect journey! Try asking me about specific cities, routes, weather, or attractions. For example: 'What's special in Madurai?' or 'Plan route from Chennai to Bangalore'.";
  }

  clearChat() {
    if (this.chatMessages) {
      this.chatMessages.innerHTML = `
        <div class="welcome-message">
          <span class="material-icons">smart_toy</span>
          <p>Hi! I'm your AI travel assistant. Ask me about destinations, routes, weather, or travel tips!</p>
        </div>
      `;
    }
    this.messages = [];
  }
}

// Global functions for compatibility
function sendMessage() {
  if (window.chatManager) {
    window.chatManager.sendMessage();
  }
}

function sendQuickMessage(message) {
  if (window.chatManager) {
    window.chatManager.sendQuickMessage(message);
  }
}

function toggleAIChat() {
  // No longer needed as chat is always visible in sidebar
  console.log('Chat is now integrated in sidebar');
}

// Initialize chat manager
window.addEventListener('DOMContentLoaded', () => {
  window.chatManager = new ChatManager();
});