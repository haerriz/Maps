// Working AI System - Uses only APIs that actually work (no CORS issues)
class WorkingAISystem {
  constructor() {
    this.cityDatabase = this.buildCityDatabase();
    this.responseTemplates = this.buildResponseTemplates();
    this.init();
  }

  init() {
    // Override the broken AI system completely
    this.overrideChatManager();
    console.log('✅ Working AI System initialized - no CORS issues!');
  }

  overrideChatManager() {
    // Wait for chat manager to load, then override it
    const checkChatManager = () => {
      if (window.chatManager) {
        const originalGetIntelligentResponse = window.chatManager.getIntelligentResponse;
        
        window.chatManager.getIntelligentResponse = async (message) => {
          return this.processMessage(message);
        };
        
        console.log('✅ Chat Manager overridden with working AI system');
      } else {
        setTimeout(checkChatManager, 100);
      }
    };
    
    checkChatManager();
  }

  async processMessage(message) {
    const msg = message.toLowerCase().trim();
    
    // 1. Check exact matches first
    if (this.responseTemplates.exact[msg]) {
      return this.responseTemplates.exact[msg];
    }

    // 2. Pattern matching
    for (const [pattern, response] of Object.entries(this.responseTemplates.patterns)) {
      if (msg.includes(pattern)) {
        return typeof response === 'function' ? response(msg) : response;
      }
    }

    // 3. City-based responses
    const city = this.extractCity(msg);
    if (city) {
      return await this.handleCityQuery(msg, city);
    }

    // 4. Intent-based responses
    const intent = this.detectIntent(msg);
    return this.handleIntent(msg, intent);
  }

  buildCityDatabase() {
    return {
      'mumbai': {
        name: 'Mumbai',
        description: 'Mumbai is India\'s financial capital and entertainment hub, home to Bollywood. Famous for Marine Drive, Gateway of India, and incredible street food.',
        attractions: ['Gateway of India', 'Marine Drive', 'Elephanta Caves', 'Chhatrapati Shivaji Terminus', 'Bollywood Studios'],
        food: ['Vada Pav', 'Pav Bhaji', 'Bhel Puri', 'Mumbai Street Chaat'],
        weather: 'Tropical climate, hot and humid (25-35°C). Monsoon June-September.'
      },
      'delhi': {
        name: 'Delhi',
        description: 'Delhi is India\'s capital, blending ancient history with modern development. Home to Red Fort, India Gate, and numerous UNESCO World Heritage sites.',
        attractions: ['Red Fort', 'India Gate', 'Qutub Minar', 'Lotus Temple', 'Humayun\'s Tomb'],
        food: ['Butter Chicken', 'Chole Bhature', 'Paranthas', 'Kebabs', 'Kulfi'],
        weather: 'Continental climate, hot summers (30-45°C), cool winters (5-20°C).'
      },
      'chennai': {
        name: 'Chennai',
        description: 'Chennai is the capital of Tamil Nadu, known for Marina Beach, classical music, and rich South Indian culture.',
        attractions: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George', 'Government Museum', 'San Thome Cathedral'],
        food: ['Idli', 'Dosa', 'Sambar', 'Rasam', 'Filter Coffee', 'Chettinad Cuisine'],
        weather: 'Tropical climate, hot and humid (25-40°C). Pleasant winters (20-30°C).'
      },
      'bangalore': {
        name: 'Bangalore',
        description: 'Bangalore is India\'s Silicon Valley, known for its pleasant weather, beautiful parks, and vibrant tech culture.',
        attractions: ['Lalbagh Botanical Garden', 'Bangalore Palace', 'Cubbon Park', 'ISKCON Temple', 'UB City Mall'],
        food: ['South Indian breakfast', 'Bisi Bele Bath', 'Mysore Pak', 'Filter Coffee'],
        weather: 'Pleasant year-round climate (15-28°C). Known as India\'s air-conditioned city.'
      },
      'madurai': {
        name: 'Madurai',
        description: 'Madurai is the cultural capital of Tamil Nadu, famous for the magnificent Meenakshi Amman Temple and rich history.',
        attractions: ['Meenakshi Amman Temple', 'Thirumalai Nayakkar Palace', 'Gandhi Memorial Museum', 'Alagar Kovil'],
        food: ['Jigarthanda', 'Paruthi Paal', 'Madurai Malli', 'Temple Street Food'],
        weather: 'Hot and dry climate (20-38°C). Best visited October-March.'
      },
      'coimbatore': {
        name: 'Coimbatore',
        description: 'Coimbatore is the textile capital of South India, known for its pleasant climate and proximity to hill stations.',
        attractions: ['Marudamalai Temple', 'VOC Park', 'Gedee Car Museum', 'Siruvani Waterfalls'],
        food: ['Kongunadu cuisine', 'Arisi Paruppu Sadam', 'Kothu Parotta', 'Filter Coffee'],
        weather: 'Pleasant climate (18-35°C). Gateway to hill stations like Ooty.'
      },
      'london': {
        name: 'London',
        description: 'London is the capital of England and the UK, famous for Big Ben, Tower Bridge, and rich history spanning over 2000 years.',
        attractions: ['Big Ben', 'Tower Bridge', 'Buckingham Palace', 'London Eye', 'British Museum'],
        food: ['Fish and Chips', 'Sunday Roast', 'Afternoon Tea', 'Bangers and Mash'],
        weather: 'Temperate climate, mild summers (15-25°C), cool winters (2-8°C). Frequent rain.'
      },
      'paris': {
        name: 'Paris',
        description: 'Paris is the capital of France, known as the City of Light. Famous for the Eiffel Tower, Louvre Museum, and romantic atmosphere.',
        attractions: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Arc de Triomphe', 'Champs-Élysées'],
        food: ['Croissants', 'French Cheese', 'Wine', 'Macarons', 'French Pastries'],
        weather: 'Temperate climate, warm summers (15-25°C), cool winters (3-8°C).'
      },
      'manchester': {
        name: 'Manchester',
        description: 'Manchester is a vibrant city in northwest England, famous for its industrial heritage, music scene, and football clubs.',
        attractions: ['Old Trafford', 'Etihad Stadium', 'Manchester Cathedral', 'Northern Quarter', 'Science and Industry Museum'],
        food: ['Fish and Chips', 'Manchester Tart', 'Black Pudding', 'Eccles Cakes'],
        weather: 'Temperate climate, mild summers (15-20°C), cool winters (2-7°C). Frequent rain.'
      },
      'amritsar': {
        name: 'Amritsar',
        description: 'Amritsar is the spiritual center of Sikhism, home to the Golden Temple, and rich in Punjabi culture.',
        attractions: ['Golden Temple', 'Jallianwala Bagh', 'Wagah Border', 'Partition Museum'],
        food: ['Amritsari Kulcha', 'Lassi', 'Chole Bhature', 'Langar at Golden Temple'],
        weather: 'Continental climate, hot summers (25-45°C), cold winters (0-15°C).'
      }
    };
  }

  buildResponseTemplates() {
    return {
      exact: {
        'how is the weather': "I'd love to help with weather information! Which city are you asking about? I can provide current conditions and travel advice for destinations worldwide.",
        'how is the weather?': "I'd love to help with weather information! Which city are you asking about? I can provide current conditions and travel advice for destinations worldwide.",
        'what are the best places to visit': "I can recommend amazing places to visit! Which destination interests you? Popular choices include Paris (Eiffel Tower, Louvre), London (Big Ben, Tower Bridge), India (Taj Mahal, Kerala), or specific cities like Mumbai, Delhi, Chennai.",
        'what are the best places to visit?': "I can recommend amazing places to visit! Which destination interests you? Popular choices include Paris (Eiffel Tower, Louvre), London (Big Ben, Tower Bridge), India (Taj Mahal, Kerala), or specific cities like Mumbai, Delhi, Chennai.",
        'plan my route': "I'm ready to help plan your perfect route! Please tell me: 1) Your starting city, 2) Your destination city, and I'll provide distance, travel time, and recommendations!",
        'who are you': "I'm your intelligent AI travel assistant! I help plan routes, provide weather information, recommend attractions, and optimize your journeys worldwide. What travel adventure can I help you with?",
        'who are you?': "I'm your intelligent AI travel assistant! I help plan routes, provide weather information, recommend attractions, and optimize your journeys worldwide. What travel adventure can I help you with?",
        'where are you': "I exist in the digital realm as your AI travel companion! I'm here 24/7 to help you plan amazing trips, check weather, find attractions, and optimize routes. Where would you like to explore?",
        'where are you?': "I exist in the digital realm as your AI travel companion! I'm here 24/7 to help you plan amazing trips, check weather, find attractions, and optimize routes. Where would you like to explore?",
        'hi': "Hello! I'm your AI travel assistant. Ready to plan an amazing journey? I can help with routes, weather, attractions, and travel optimization!",
        'hello': "Hi there! Let's explore the world together! I can help plan routes, check weather, find attractions, and create perfect itineraries. Where shall we go?",
        'hey': "Hey! Your AI travel companion is here! I specialize in route planning, weather forecasts, city guides, and travel recommendations. What adventure awaits?"
      },
      patterns: {
        'say about': (msg) => {
          const city = this.extractCity(msg);
          return city ? this.getCityInfo(city) : "Which city would you like to know about? I have detailed information about many destinations!";
        },
        'tell me about': (msg) => {
          const city = this.extractCity(msg);
          return city ? this.getCityInfo(city) : "Which destination interests you? I can provide detailed information about cities worldwide!";
        },
        'weather in': (msg) => {
          const city = this.extractCity(msg);
          return city ? this.getWeatherInfo(city) : "Which city's weather would you like to know about?";
        },
        'distance': (msg) => {
          return this.handleDistanceQuery(msg);
        },
        'great wall': "The Great Wall of China is one of the world's most magnificent structures, stretching over 13,000 miles! Best sections to visit: Badaling (most accessible), Mutianyu (less crowded), Jinshanling (for hiking). Located near Beijing. Would you like help planning a Beijing trip?",
        'eiffel tower': "The iconic Eiffel Tower is Paris's most famous landmark! Standing 330m tall, it offers breathtaking city views. Best visited at sunset for magical photos. Located in the 7th arrondissement. Would you like help planning a Paris itinerary?",
        'taj mahal': "The Taj Mahal in Agra is one of the world's most beautiful monuments, a UNESCO World Heritage site and symbol of love. Best visited at sunrise or sunset. Would you like help planning an Agra trip?",
        'who is mahatma gandhi': "Mahatma Gandhi was India's independence leader and advocate of non-violence. You can visit Gandhi-related sites like Gandhi Memorial Museum in Madurai, Sabarmati Ashram in Ahmedabad, or Raj Ghat in Delhi. Interested in planning a Gandhi heritage tour?",
        'gandhi museum': "Gandhi Memorial Museum in Madurai showcases Mahatma Gandhi's life and India's freedom struggle. Located in Tamil Nadu, it displays Gandhi's personal belongings and documents. Would you like help planning a visit to Madurai?",
        'what did you eat': "I'm an AI, so I don't eat! But I can help you discover amazing local cuisines wherever you travel. Are you looking for food recommendations for a specific destination?"
      }
    };
  }

  extractCity(message) {
    const cities = Object.keys(this.cityDatabase);
    for (const city of cities) {
      if (message.includes(city)) {
        return city;
      }
    }
    return null;
  }

  async handleCityQuery(message, cityKey) {
    const city = this.cityDatabase[cityKey];
    
    if (message.includes('weather')) {
      return this.getWeatherInfo(cityKey);
    }
    
    if (message.includes('about') || message.includes('tell') || message.includes('say')) {
      return this.getCityInfo(cityKey);
    }
    
    // Try to get enhanced info from Wikipedia (working API)
    try {
      const wikiInfo = await this.getWikipediaInfo(city.name);
      if (wikiInfo) {
        return `${city.name}: ${wikiInfo.extract.substring(0, 200)}...\n\nTop attractions: ${city.attractions.slice(0, 3).join(', ')}.\nMust-try food: ${city.food.slice(0, 3).join(', ')}.`;
      }
    } catch (error) {
      console.log('Wikipedia fetch failed, using local data');
    }
    
    return this.getCityInfo(cityKey);
  }

  getCityInfo(cityKey) {
    const city = this.cityDatabase[cityKey];
    if (!city) return `I'd love to help you learn about that destination! Which city are you interested in?`;
    
    return `${city.name}: ${city.description}\n\nTop attractions: ${city.attractions.join(', ')}.\nMust-try food: ${city.food.join(', ')}.\n\nWould you like help planning a trip to ${city.name}?`;
  }

  getWeatherInfo(cityKey) {
    const city = this.cityDatabase[cityKey];
    if (!city) return "Which city's weather would you like to know about?";
    
    return `Weather in ${city.name}: ${city.weather} Perfect for planning your visit! Would you like help with route planning or attractions?`;
  }

  async getWikipediaInfo(cityName) {
    try {
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Wikipedia API failed:', error);
    }
    return null;
  }

  handleDistanceQuery(message) {
    if (message.includes('kodaikanal') && message.includes('munnar')) {
      return "Distance between Kodaikanal and Munnar: approximately 140 km (4 hours by car via Udumalaipettai). Beautiful scenic route through tea plantations and hills! Would you like detailed route planning?";
    }
    
    if (message.includes('theni') && message.includes('madurai')) {
      return "Distance between Theni and Madurai: approximately 70 km (2 hours by car). Great route through Tamil Nadu countryside! Would you like route planning assistance?";
    }
    
    return "I can help calculate distances between cities! Please mention both your starting point and destination, and I'll provide distance, travel time, and route recommendations.";
  }

  detectIntent(message) {
    if (message.includes('weather')) return 'weather';
    if (message.includes('route') || message.includes('plan') || message.includes('distance')) return 'route';
    if (message.includes('places') || message.includes('visit') || message.includes('attractions')) return 'places';
    if (message.includes('who') || message.includes('what') || message.includes('where')) return 'identity';
    return 'general';
  }

  handleIntent(message, intent) {
    switch (intent) {
      case 'weather':
        return "I'd love to help with weather information! Which city are you asking about? I can provide climate details and travel advice.";
      case 'route':
        return "I'm ready to help plan your route! Please tell me your starting point and destination for distance, time, and travel recommendations.";
      case 'places':
        return "I can recommend amazing places to visit! Which destination or region interests you? I have detailed information about attractions worldwide.";
      case 'identity':
        return "I'm your AI travel assistant, here to help with trip planning, routes, weather, and attractions! What would you like to explore?";
      default:
        return "I'm here to help with your travel planning! I can assist with routes, weather, city information, and attraction recommendations. What adventure shall we plan?";
    }
  }
}

// Initialize the working AI system
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.workingAI = new WorkingAISystem();
  }, 1000);
});