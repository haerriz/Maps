/**
 * Chat Manager Module
 * Handles AI chat functionality and user interactions
 */

class ChatManager {
  constructor() {
    this.isChatOpen = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Enter key support for chat
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.target.id === 'chatInput') {
        this.sendMessage();
      }
    });

    // Close chat when clicking outside
    document.addEventListener('click', (e) => {
      const popup = document.getElementById('aiChatPopup');
      const bubble = document.getElementById('aiChatBubble');
      
      if (this.isChatOpen && !popup.contains(e.target) && !bubble.contains(e.target)) {
        this.toggleAIChat();
      }
    });
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    this.addMessage(message, 'user');
    input.value = '';
    
    // Show typing indicator
    this.addTypingIndicator();
    
    try {
      // Try multiple AI APIs with fallback
      const response = await this.getAIResponseWithFallback(message);
      this.removeTypingIndicator();
      this.addMessage(response, 'ai');
    } catch (error) {
      this.removeTypingIndicator();
      const fallback = this.getEnhancedLocalResponse(message);
      this.addMessage(fallback, 'ai');
    }
  }

  async getAIResponseWithFallback(message) {
    const apis = [
      () => this.tryHuggingFaceAPI(message),
      () => this.tryOpenAICompatibleAPI(message),
      () => this.tryGroqAPI(message),
      () => this.tryOllamaAPI(message)
    ];
    
    for (const api of apis) {
      try {
        const response = await Promise.race([
          api(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        if (response) return response;
      } catch (error) {
        continue;
      }
    }
    
    // Final fallback to enhanced local response
    return this.getEnhancedLocalResponse(message);
  }

  async tryHuggingFaceAPI(message) {
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: `Travel assistant: ${message}`,
        parameters: { max_length: 100, temperature: 0.7 }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data[0]?.generated_text?.replace(`Travel assistant: ${message}`, '').trim() || null;
    }
    return null;
  }

  async tryOpenAICompatibleAPI(message) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-key'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'You are a helpful travel assistant for a trip planning app. Be concise and practical.'
        }, {
          role: 'user',
          content: message
        }],
        max_tokens: 100,
        temperature: 0.7
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    }
    return null;
  }

  async tryGroqAPI(message) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-key'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{
          role: 'system',
          content: 'You are a travel planning assistant. Help with routes, distances, weather, and travel advice.'
        }, {
          role: 'user',
          content: message
        }],
        max_tokens: 100,
        temperature: 0.7
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    }
    return null;
  }

  async tryOllamaAPI(message) {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt: `As a travel assistant: ${message}`,
        stream: false
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.response?.trim() || null;
    }
    return null;
  }

  getEnhancedLocalResponse(message) {
    const msg = message.toLowerCase();
    
    // Distance queries
    const distanceMatch = msg.match(/(\w+)\s+to\s+(\w+)\s+distance/) || msg.match(/distance\s+from\s+(\w+)\s+to\s+(\w+)/) || msg.match(/(\w+)\s+(\w+)\s+distance/);
    if (distanceMatch || msg.includes('distance')) {
      const locations = this.extractLocations(message);
      if (locations.length >= 2) {
        return this.calculateDistanceBetweenCities(locations[0], locations[1]);
      }
      return "🗺️ I can calculate distances! Try asking 'distance from Chennai to Mumbai' or 'Delhi to Goa distance'. I can also add both locations to your route for detailed directions.";
    }
    
    // Route/directions queries
    if (msg.includes('route') || msg.includes('direction') || msg.includes('how to go') || msg.includes('how to reach')) {
      const locations = this.extractLocations(message);
      if (locations.length >= 2) {
        return `🛣️ I can help you plan the route from ${locations[0]} to ${locations[1]}! Let me add both locations to your trip and calculate the optimized route with turn-by-turn directions.\n\nWould you like me to add these as tour stops?`;
      }
      if (window.tourManager && window.tourManager.getTourStops().length >= 2) {
        return `🗺️ Your current route is optimized! You have ${window.tourManager.getTourStops().length} stops planned. Click 'Start Journey' to begin GPS navigation with real-time directions.`;
      }
      return "🧭 I can create optimized routes! Add locations using the search box above, and I'll automatically calculate the best path with turn-by-turn directions.";
    }
    
    // Weather queries
    if (msg.includes('weather') || msg.includes('climate') || msg.includes('temperature')) {
      const locations = this.extractLocations(message);
      if (locations.length > 0) {
        setTimeout(() => window.weatherManager?.getSpecificLocationWeather(locations[0]), 100);
        return `🌤️ Getting weather information for ${locations[0]}...`;
      }
      if (window.tourManager && window.tourManager.getTourStops().length > 0) {
        setTimeout(() => window.weatherManager?.getWeatherInfo(), 100);
        return `🌤️ Getting weather for your tour destinations: ${window.tourManager.getTourStops().map(s => s.name).join(', ')}...`;
      }
      return "🌤️ I can check weather! Add destinations to your trip or ask 'weather in Mumbai' for specific locations.";
    }
    
    // Default contextual responses
    const tourStops = window.tourManager ? window.tourManager.getTourStops() : [];
    if (tourStops.length === 0) {
      return "🗺️ Welcome to Haerriz Trip Planner! I can help you:\n• Calculate distances between cities\n• Plan optimized routes\n• Check weather conditions\n• Add locations to your journey\n\nTry asking 'Chennai to Mumbai distance' or 'add Delhi to my trip'!";
    } else if (tourStops.length === 1) {
      return `🎯 Great! You have ${tourStops[0].name} in your journey. I can:\n• Add more destinations\n• Calculate routes and distances\n• Check weather for your trip\n• Start GPS navigation\n\nWhat would you like to do next?`;
    } else {
      return `✨ Perfect! Your journey has ${tourStops.length} stops: ${tourStops.map(s => s.name).join(', ')}. I can:\n• Optimize your route\n• Start GPS navigation\n• Check weather for all stops\n• Calculate total distance and time\n\nReady to begin your adventure?`;
    }
  }

  extractLocations(message) {
    const locations = [];
    const cityNames = [
      'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad',
      'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam',
      'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot',
      'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'allahabad', 'ranchi',
      'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'madurai', 'raipur',
      'kota', 'guwahati', 'chandigarh', 'solapur', 'hubli', 'tiruchirappalli', 'bareilly',
      'mysore', 'tiruppur', 'gurgaon', 'aligarh', 'jalandhar', 'bhubaneswar', 'salem',
      'warangal', 'guntur', 'bhiwandi', 'saharanpur', 'gorakhpur', 'bikaner', 'amravati',
      'noida', 'jamshedpur', 'bhilai', 'cuttack', 'firozabad', 'kochi', 'nellore',
      'bhavnagar', 'dehradun', 'durgapur', 'asansol', 'rourkela', 'nanded', 'kolhapur',
      'ajmer', 'akola', 'gulbarga', 'jamnagar', 'ujjain', 'loni', 'siliguri', 'jhansi',
      'ulhasnagar', 'jammu', 'sangli', 'mangalore', 'erode', 'belgaum', 'ambattur',
      'tirunelveli', 'malegaon', 'gaya', 'jalgaon', 'udaipur', 'maheshtala', 'theni',
      'kodaikanal', 'ooty', 'goa', 'manali', 'shimla', 'darjeeling',
      'new york', 'london', 'paris', 'tokyo', 'dubai', 'singapore', 'bangkok', 'sydney',
      'rome', 'barcelona', 'amsterdam', 'berlin', 'madrid', 'istanbul', 'cairo'
    ];
    
    const words = message.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (cityNames.includes(cleanWord) && !locations.includes(cleanWord)) {
        locations.push(cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1));
      }
    });
    
    return locations;
  }

  calculateDistanceBetweenCities(city1, city2) {
    const cityCoords = {
      'Chennai': [13.0827, 80.2707], 'Mumbai': [19.0760, 72.8777], 'Delhi': [28.7041, 77.1025],
      'Bangalore': [12.9716, 77.5946], 'Kolkata': [22.5726, 88.3639], 'Hyderabad': [17.3850, 78.4867],
      'Pune': [18.5204, 73.8567], 'Ahmedabad': [23.0225, 72.5714], 'Jaipur': [26.9124, 75.7873],
      'Kochi': [9.9312, 76.2673], 'Goa': [15.2993, 74.1240], 'Theni': [10.0104, 77.4977],
      'Kodaikanal': [10.2381, 77.4892], 'Ooty': [11.4064, 76.6932], 'Manali': [32.2432, 77.1892],
      'Shimla': [31.1048, 77.1734], 'Darjeeling': [27.0360, 88.2627]
    };
    
    const coord1 = cityCoords[city1];
    const coord2 = cityCoords[city2];
    
    if (!coord1 || !coord2) {
      return `🗺️ I can calculate distances between major cities! Try asking about cities like Chennai, Mumbai, Delhi, Bangalore, etc. Would you like me to add ${city1} and ${city2} to your trip for detailed routing?`;
    }
    
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const driveTime = Math.round(distance / 60 * 60); // Assuming 60 km/h average
    const flightTime = Math.round(distance / 500 * 60); // Assuming 500 km/h flight speed
    
    return `🗺️ Distance from ${city1} to ${city2}:\n\n📏 ${Math.round(distance)} km (${Math.round(distance * 0.621)} miles)\n🚗 Driving: ~${Math.floor(driveTime/60)}h ${driveTime%60}m\n✈️ Flight: ~${flightTime}m\n\n💡 Would you like me to add both cities to your trip for detailed route planning with turn-by-turn directions?`;
  }

  addTypingIndicator() {
    const messages = document.getElementById('chatMessages');
    if (!messages) return;
    
    const typing = document.createElement('div');
    typing.className = 'message ai-message typing-indicator';
    typing.id = 'typingIndicator';
    typing.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
  }

  removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
  }

  addMessage(message, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  toggleAIChat() {
    const popup = document.getElementById('aiChatPopup');
    const notification = document.getElementById('chatNotification');
    
    this.isChatOpen = !this.isChatOpen;
    
    if (this.isChatOpen) {
      popup.classList.add('show');
      if (notification) notification.style.display = 'none';
      const chatInput = document.getElementById('chatInput');
      if (chatInput) chatInput.focus();
      
      // Add welcome message if chat is empty
      const messages = document.getElementById('chatMessages');
      if (messages && messages.children.length === 0) {
        this.addMessage('👋 Hi! I\'m your intelligent travel assistant. I can help you plan routes, check weather, find attractions, and give personalized travel advice. What would you like to explore?', 'ai');
      }
    } else {
      popup.classList.remove('show');
    }
  }

  sendQuickMessage(message) {
    document.getElementById('chatInput').value = message;
    this.sendMessage();
  }
}

// Initialize chat manager
window.chatManager = new ChatManager();