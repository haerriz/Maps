// Application Manager - Main app initialization and coordination
class AppManager {
  constructor() {
    this.isOffline = !navigator.onLine;
    this.tourStops = [];
    this.markers = [];
    this.routeLine = null;
    this.trafficRouteLines = [];
    this.isJourneyStarted = false;
    
    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.setupOfflineDetection();
    this.setupEventListeners();
    this.initializeModules();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('assets/js/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
            if (window.chatManager) {
              window.chatManager.addMessage('📱 Offline mode enabled! Maps will work without internet.', 'ai');
            }
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }

  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.isOffline = false;
      if (window.chatManager) {
        window.chatManager.addMessage('🌐 Back online! All features restored.', 'ai');
      }
      this.updateOfflineStatus();
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      if (window.chatManager) {
        window.chatManager.addMessage('📱 Offline mode active. Using cached maps and data.', 'ai');
      }
      this.updateOfflineStatus();
    });
  }

  updateOfflineStatus() {
    const statusDiv = document.getElementById('offlineStatus') || this.createOfflineStatusDiv();
    if (this.isOffline) {
      statusDiv.style.display = 'block';
      statusDiv.innerHTML = '📱 Offline Mode';
    } else {
      statusDiv.style.display = 'none';
    }
  }

  createOfflineStatusDiv() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'offlineStatus';
    statusDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: #ff9800;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      z-index: 1001;
      display: none;
    `;
    document.body.appendChild(statusDiv);
    return statusDiv;
  }

  setupEventListeners() {
    window.addEventListener('load', () => {
      this.updateOfflineStatus();
      if (this.isOffline && window.chatManager) {
        window.chatManager.addMessage('📱 Starting in offline mode. Limited features available.', 'ai');
      }
    });
  }

  initializeModules() {
    // Initialize all manager modules
    window.addEventListener('load', () => {
      // Modules will auto-initialize when loaded
      console.log('App Manager initialized');
    });
  }

  // Legacy compatibility functions
  sendMessage() {
    if (window.chatManager) {
      window.chatManager.sendMessage();
    }
  }

  toggleAIChat() {
    if (window.chatManager) {
      window.chatManager.toggleAIChat();
    }
  }

  sendQuickMessage(message) {
    if (window.chatManager) {
      window.chatManager.sendQuickMessage(message);
    }
  }
}

// Global functions for backward compatibility
function sendMessage() {
  if (window.appManager) {
    window.appManager.sendMessage();
  }
}

function toggleAIChat() {
  if (window.appManager) {
    window.appManager.toggleAIChat();
  }
}

function sendQuickMessage(message) {
  if (window.appManager) {
    window.appManager.sendQuickMessage(message);
  }
}

// Initialize app manager
window.addEventListener('DOMContentLoaded', () => {
  window.appManager = new AppManager();
});