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

    // Add user message
    this.addMessage(message, 'user');
    this.chatInput.value = '';

    // Simulate AI response
    setTimeout(() => {
      this.generateAIResponse(message);
    }, 500);
  }

  sendQuickMessage(message) {
    this.chatInput.value = message;
    this.sendMessage();
  }

  addMessage(text, sender) {
    if (!this.chatMessages) return;

    // Remove welcome message if it exists
    const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
    if (welcomeMessage && this.messages.length === 0) {
      welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message-sidebar ${sender}-message-sidebar`;
    messageDiv.textContent = text;

    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    this.messages.push({ text, sender, timestamp: new Date() });
  }

  generateAIResponse(userMessage) {
    // Use intelligent contextual analysis instead of external APIs
    const response = this.getIntelligentResponse(userMessage.toLowerCase());
    this.addMessage(response, 'ai');
  }

  getIntelligentResponse(message) {
    // Analyze user intent and provide contextual responses
    const context = this.analyzeUserContext();
    const intent = this.detectIntent(message);
    
    switch (intent) {
      case 'weather':
        return this.getWeatherResponse(context);
      case 'route':
        return this.getRouteResponse(context);
      case 'traffic':
        return this.getTrafficResponse(context);
      case 'places':
        return this.getPlacesResponse(context);
      case 'help':
        return this.getHelpResponse(context);
      case 'location':
        return this.getLocationResponse(message, context);
      default:
        return this.getContextualResponse(message, context);
    }
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

  detectIntent(message) {
    const intents = {
      weather: ['weather', 'temperature', 'rain', 'sunny', 'forecast', 'climate'],
      route: ['route', 'plan', 'journey', 'trip', 'navigate', 'directions'],
      traffic: ['traffic', 'congestion', 'busy', 'jam', 'delay'],
      places: ['places', 'attractions', 'restaurants', 'hotels', 'visit', 'see'],
      help: ['help', 'how', 'what', 'guide', 'tutorial'],
      location: ['where', 'location', 'address', 'find', 'search']
    };
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return intent;
      }
    }
    
    return 'general';
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

  getContextualResponse(message, context) {
    // Provide intelligent contextual responses based on current state
    if (context.hasRoute) {
      return "Your trip is looking good! I can help with navigation, weather updates, finding nearby attractions, or optimizing your route further. What interests you?";
    } else if (context.hasStops) {
      return "You've added one location. Add another destination to create a route, and I'll help optimize the best path with real-time traffic and weather considerations.";
    }
    return "Welcome to your AI travel assistant! I can help plan routes, check weather, find attractions, and optimize your journey. Start by adding some destinations to get personalized recommendations.";
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