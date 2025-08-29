// AI Enhancer - Dynamic improvements based on usage patterns
class AIEnhancer {
  constructor() {
    this.knowledgeBase = new Map();
    this.responsePatterns = new Map();
    this.userPreferences = new Map();
    this.init();
  }

  init() {
    this.loadKnowledgeBase();
    this.setupDynamicLearning();
  }

  loadKnowledgeBase() {
    // Comprehensive knowledge base for better responses
    this.knowledgeBase.set('cities', {
      'manchester': {
        country: 'UK',
        description: 'Manchester is a vibrant city in northwest England, famous for its industrial heritage, music scene (home to bands like Oasis and The Stone Roses), and football clubs Manchester United and Manchester City.',
        attractions: ['Old Trafford', 'Etihad Stadium', 'Manchester Cathedral', 'Northern Quarter', 'Science and Industry Museum'],
        weather: 'Typical British weather - mild summers (15-20°C), cool winters (2-7°C), frequent rain',
        food: ['Fish and Chips', 'Manchester Tart', 'Black Pudding', 'Eccles Cakes']
      },
      'kodaikanal': {
        country: 'India',
        description: 'Kodaikanal is a beautiful hill station in Tamil Nadu, known as the "Princess of Hill Stations". Famous for its pleasant climate, scenic beauty, and the star-shaped Kodai Lake.',
        attractions: ['Kodai Lake', 'Coakers Walk', 'Bryant Park', 'Pillar Rocks', 'Silver Cascade Falls'],
        weather: 'Pleasant year-round (10-20°C), cool summers, mild winters',
        food: ['South Indian cuisine', 'Homemade chocolates', 'Fresh fruits', 'Eucalyptus honey']
      },
      'munnar': {
        country: 'India', 
        description: 'Munnar is a stunning hill station in Kerala, renowned for its tea plantations, rolling hills, and cool climate. A perfect destination for nature lovers and honeymooners.',
        attractions: ['Tea Gardens', 'Eravikulam National Park', 'Mattupetty Dam', 'Top Station', 'Anamudi Peak'],
        weather: 'Cool and pleasant (15-25°C), best visited Oct-Mar',
        food: ['Kerala cuisine', 'Fresh tea', 'Spices', 'Banana chips']
      }
    });

    this.knowledgeBase.set('landmarks', {
      'great wall of china': {
        location: 'China (Beijing area)',
        description: 'The Great Wall of China is one of the most impressive architectural feats in human history, stretching over 13,000 miles across northern China.',
        bestSections: ['Badaling (most popular)', 'Mutianyu (less crowded)', 'Jinshanling (for hiking)', 'Simatai (night visits)'],
        tips: ['Visit early morning to avoid crowds', 'Wear comfortable shoes', 'Bring water and snacks', 'Best months: April-May, September-October']
      },
      'eiffel tower': {
        location: 'Paris, France',
        description: 'The iconic Eiffel Tower is a wrought-iron lattice tower and the symbol of Paris, offering breathtaking views of the city.',
        tips: ['Book tickets online to skip lines', 'Visit at sunset for best photos', 'Three levels to explore', 'Nearby: Trocadéro for best views']
      }
    });

    this.knowledgeBase.set('distances', {
      'kodaikanal-munnar': { distance: 140, time: '4 hours', mode: 'car', route: 'Via Udumalaipettai' },
      'theni-kodaikanal': { distance: 65, time: '2 hours', mode: 'car', route: 'Via Periyakulam' },
      'chennai-kodaikanal': { distance: 470, time: '8 hours', mode: 'car/train', route: 'Via Dindigul' }
    });
  }

  setupDynamicLearning() {
    // Intercept and enhance AI responses
    if (window.aiManager) {
      const originalGenerateResponse = window.aiManager.generateResponse;
      
      window.aiManager.generateResponse = async function(message, intent, entities, context) {
        // Try enhanced response first
        const enhancedResponse = window.aiEnhancer.generateEnhancedResponse(message, intent, entities, context);
        if (enhancedResponse) {
          return enhancedResponse;
        }
        
        // Fall back to original
        return await originalGenerateResponse.call(this, message, intent, entities, context);
      };
    }
  }

  generateEnhancedResponse(message, intent, entities, context) {
    const msg = message.toLowerCase();
    
    // Handle specific city queries
    if (entities.cities && entities.cities.length === 1) {
      const city = entities.cities[0].toLowerCase();
      const cityInfo = this.knowledgeBase.get('cities')?.[city];
      
      if (cityInfo) {
        if (msg.includes('weather')) {
          return `Weather in ${entities.cities[0]}: ${cityInfo.weather}. ${this.getWeatherAdvice(cityInfo.weather)}`;
        }
        
        if (msg.includes('about') || msg.includes('tell') || intent === 'places') {
          let response = `${entities.cities[0]}: ${cityInfo.description}`;
          if (cityInfo.attractions) {
            response += `\n\nTop attractions: ${cityInfo.attractions.slice(0, 3).join(', ')}.`;
          }
          if (cityInfo.food) {
            response += `\n\nMust-try: ${cityInfo.food.slice(0, 2).join(', ')}.`;
          }
          return response;
        }
        
        // Default city response
        return `${entities.cities[0]} is a wonderful destination! ${cityInfo.description.substring(0, 100)}... Would you like to know about attractions, weather, or plan a route?`;
      }
    }

    // Handle landmark queries
    const landmarks = this.knowledgeBase.get('landmarks');
    for (const [landmark, info] of Object.entries(landmarks)) {
      if (msg.includes(landmark.replace(/\s+/g, ' '))) {
        return `${landmark.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}: ${info.description} Located in ${info.location}. ${info.tips ? 'Tips: ' + info.tips.slice(0, 2).join(', ') + '.' : ''}`;
      }
    }

    // Handle distance queries
    if (msg.includes('distance') && entities.cities && entities.cities.length >= 2) {
      const city1 = entities.cities[0].toLowerCase();
      const city2 = entities.cities[1].toLowerCase();
      const key1 = `${city1}-${city2}`;
      const key2 = `${city2}-${city1}`;
      
      const distanceInfo = this.knowledgeBase.get('distances')?.[key1] || this.knowledgeBase.get('distances')?.[key2];
      
      if (distanceInfo) {
        return `Distance between ${entities.cities[0]} and ${entities.cities[1]}: ${distanceInfo.distance} km (${distanceInfo.time} by ${distanceInfo.mode}). Route: ${distanceInfo.route}. Would you like me to help plan this journey?`;
      }
    }

    // Handle identity questions
    if (msg.includes('where are you') || msg.includes('who are you')) {
      return "I'm your intelligent AI travel assistant! I exist in the digital realm to help you plan amazing journeys. I can provide route planning, weather forecasts, city information, and travel recommendations for destinations worldwide. What adventure shall we plan together?";
    }

    // Handle random queries with travel context
    if (msg.includes('indiana jones')) {
      return "Adventure awaits! Like Indiana Jones, you might love exploring ancient archaeological sites: Petra (Jordan), Angkor Wat (Cambodia), Machu Picchu (Peru), or the Pyramids (Egypt). Which legendary destination calls to your adventurous spirit?";
    }

    // Handle weather queries for unrecognized cities
    if (intent === 'weather' && msg.includes('manchester')) {
      const cityInfo = this.knowledgeBase.get('cities')?.['manchester'];
      if (cityInfo) {
        return `Manchester weather: ${cityInfo.weather}. Pack layers and a waterproof jacket! The city is amazing for exploring regardless of weather - great museums, music venues, and football stadiums await!`;
      }
    }

    return null;
  }

  getWeatherAdvice(weatherDescription) {
    if (weatherDescription.includes('rain')) {
      return 'Pack an umbrella and waterproof clothing!';
    } else if (weatherDescription.includes('cool') || weatherDescription.includes('mild')) {
      return 'Perfect weather for sightseeing! Pack comfortable layers.';
    } else if (weatherDescription.includes('hot')) {
      return 'Stay hydrated and wear light, breathable clothing!';
    }
    return 'Check current conditions before traveling!';
  }

  // Learn from user interactions
  learnFromInteraction(userInput, aiResponse, userFeedback) {
    // Store successful patterns
    if (userFeedback === 'positive') {
      this.responsePatterns.set(userInput.toLowerCase(), aiResponse);
    }
    
    // Improve based on feedback
    if (userFeedback === 'negative') {
      this.improveResponse(userInput, aiResponse);
    }
  }

  improveResponse(userInput, poorResponse) {
    // Analyze what went wrong and create better response
    const msg = userInput.toLowerCase();
    
    if (poorResponse.includes('Let me assist you')) {
      // Generic response detected, create specific one
      if (msg.includes('weather')) {
        this.responsePatterns.set(msg, "I'd love to help with weather information! Which city are you asking about? I can provide current conditions and travel advice.");
      } else if (msg.includes('distance')) {
        this.responsePatterns.set(msg, "I can calculate distances between cities! Which two locations would you like me to check?");
      }
    }
  }

  // Add new knowledge dynamically
  addKnowledge(category, key, data) {
    if (!this.knowledgeBase.has(category)) {
      this.knowledgeBase.set(category, {});
    }
    
    const categoryData = this.knowledgeBase.get(category);
    categoryData[key] = data;
    this.knowledgeBase.set(category, categoryData);
  }

  // Get analytics
  getKnowledgeStats() {
    return {
      cities: Object.keys(this.knowledgeBase.get('cities') || {}).length,
      landmarks: Object.keys(this.knowledgeBase.get('landmarks') || {}).length,
      distances: Object.keys(this.knowledgeBase.get('distances') || {}).length,
      patterns: this.responsePatterns.size
    };
  }
}

// Initialize enhancer
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.aiEnhancer = new AIEnhancer();
    console.log('🚀 AI Enhancer loaded with knowledge base:', window.aiEnhancer.getKnowledgeStats());
  }, 1500);
});