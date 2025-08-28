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
    const responses = this.getContextualResponse(userMessage.toLowerCase());
    const response = responses[Math.floor(Math.random() * responses.length)];
    this.addMessage(response, 'ai');
  }

  getContextualResponse(message) {
    if (message.includes('weather')) {
      return [
        "I can help you check weather for your destinations! Add some stops to your journey and I'll get weather forecasts.",
        "Weather is important for trip planning. Use the 'Weather Info' button to get forecasts for your route.",
        "I'll check weather conditions along your route. Make sure to add your destinations first!"
      ];
    }
    
    if (message.includes('route') || message.includes('plan')) {
      return [
        "Great! Click on the map to add stops, then hit 'Start Journey' to see your optimized route.",
        "I can help optimize your route! Add multiple stops and I'll find the best path considering traffic and distance.",
        "For route planning, try adding destinations using the search box or clicking on the map. I'll handle the optimization!"
      ];
    }
    
    if (message.includes('traffic')) {
      return [
        "Enable 'Live Traffic' in preferences to see real-time traffic conditions on your routes.",
        "Traffic data helps optimize your journey timing. Toggle it on in the Travel Preferences section.",
        "I monitor traffic conditions to suggest the best departure times and routes for your trip."
      ];
    }
    
    if (message.includes('best places') || message.includes('attractions')) {
      return [
        "Try the quick location chips below for popular destinations, or search for specific attractions in the search box.",
        "I can suggest great places! What type of destinations interest you - cities, landmarks, or natural attractions?",
        "Use the location search to find attractions, restaurants, and points of interest worldwide."
      ];
    }
    
    if (message.includes('help') || message.includes('how')) {
      return [
        "I'm here to help! Click on the map to add stops, use the search box for locations, or ask me about travel tips.",
        "You can plan trips by adding stops, choosing transport modes, and setting preferences. What would you like to know?",
        "I can assist with route planning, weather info, travel suggestions, and trip optimization. What do you need help with?"
      ];
    }

    // Default responses
    return [
      "That's interesting! I can help you plan routes, check weather, and find great destinations. What would you like to explore?",
      "I'm your AI travel assistant! I can help optimize routes, suggest destinations, and provide travel insights. How can I assist?",
      "Great question! I specialize in trip planning and travel optimization. Try adding some destinations to get started!",
      "I'm here to make your travel planning easier! Add stops to your journey and I'll help optimize everything.",
      "Let me help you plan the perfect trip! Use the map or search to add destinations, and I'll handle the rest."
    ];
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