/**
 * UI Manager Module
 * Handles UI interactions, mobile view, and general interface functions
 */

class UIManager {
  constructor() {
    this.isMobileView = false;
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  setupEventListeners() {
    // Mobile toggle functionality
    const mobileToggle = document.getElementById('mobileToggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => this.toggleMobileView());
    }

    // Chat toggle functionality
    const aiChatBubble = document.getElementById('aiChatBubble');
    if (aiChatBubble) {
      aiChatBubble.addEventListener('click', () => {
        if (window.chatManager) {
          window.chatManager.toggleAIChat();
        }
      });
    }

    // Quick message buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion-chip')) {
        const message = e.target.textContent;
        if (window.chatManager) {
          window.chatManager.sendQuickMessage(message);
        }
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 's':
            e.preventDefault();
            if (window.tourManager) {
              window.tourManager.exportTour();
            }
            break;
          case 'r':
            e.preventDefault();
            const tourStops = window.tourManager ? window.tourManager.getTourStops() : [];
            if (tourStops.length >= 2) {
              window.tourManager.drawRealRoute();
            }
            break;
        }
      }
    });
  }

  toggleMobileView() {
    this.isMobileView = !this.isMobileView;
    const sidebar = document.querySelector('.sidebar');
    const mobileToggle = document.getElementById('mobileToggle');
    
    if (this.isMobileView) {
      sidebar.classList.add('mobile-open');
      mobileToggle.textContent = '🗺️ Map';
    } else {
      sidebar.classList.remove('mobile-open');
      mobileToggle.textContent = '📍 Map';
    }
  }

  updateTravelMode() {
    const mode = document.getElementById('travelMode')?.value;
    if (!mode) return;
    
    let modeEmoji = '🚗';
    switch(mode) {
      case 'walking': modeEmoji = '🚶'; break;
      case 'cycling': modeEmoji = '🚴'; break;
      case 'transit': modeEmoji = '🚌'; break;
      case 'mixed': modeEmoji = '🔄'; break;
    }
    
    // Hide traffic toggle for non-driving modes
    const trafficToggle = document.getElementById('trafficToggle')?.parentElement?.parentElement;
    if (trafficToggle) {
      if (mode === 'driving') {
        trafficToggle.style.display = 'block';
      } else {
        trafficToggle.style.display = 'none';
        const trafficCheckbox = document.getElementById('trafficToggle');
        if (trafficCheckbox) {
          trafficCheckbox.checked = false;
          this.updateTrafficMode();
        }
      }
    }
    
    // Show transport information for transit mode
    if (mode === 'transit' && window.tourManager && window.tourManager.getTourStops().length >= 2) {
      if (window.transportManager) {
        window.transportManager.showTransportOptions();
      }
    } else {
      const transportInfo = document.getElementById('transportInfo');
      if (transportInfo) {
        transportInfo.style.display = 'none';
      }
    }
    
    // Redraw routes with updated mode
    if (window.tourManager && window.tourManager.getTourStops().length > 1) {
      window.tourManager.drawRealRoute();
    }
    
    if (window.chatManager) {
      window.chatManager.addMessage(`🔄 Travel mode updated to ${modeEmoji} ${mode}! This will optimize your route planning and time estimates.`, 'ai');
    }
  }

  updateTrafficMode() {
    const trafficEnabled = document.getElementById('trafficToggle')?.checked;
    const mapTrafficToggle = document.getElementById('mapTrafficToggle');
    const statusSpan = document.getElementById('trafficStatus');
    
    // Sync both toggles
    if (mapTrafficToggle) {
      mapTrafficToggle.checked = trafficEnabled;
    }
    
    if (statusSpan) {
      if (trafficEnabled) {
        statusSpan.textContent = 'On';
        statusSpan.style.color = '#28a745';
        if (window.chatManager) {
          window.chatManager.addMessage('🚗 Traffic enabled! Routes show real-time conditions.', 'ai');
        }
      } else {
        statusSpan.textContent = 'Off';
        statusSpan.style.color = '#6c757d';
        if (window.chatManager) {
          window.chatManager.addMessage('🚗 Traffic disabled. Standard route display.', 'ai');
        }
      }
    }
    
    // Redraw route with traffic settings
    if (window.tourManager && window.tourManager.getTourStops().length >= 2) {
      window.tourManager.drawRealRoute();
    }
  }

  setStartTime(when) {
    const timeInput = document.getElementById('startTime');
    const dateInput = document.getElementById('startDate');
    
    if (when === 'now' && timeInput && dateInput) {
      const now = new Date();
      timeInput.value = now.toTimeString().slice(0, 5);
      dateInput.value = now.toISOString().slice(0, 10);
      if (window.chatManager) {
        window.chatManager.addMessage('🕐 Journey start time set to now! This will help optimize transport schedules and suggest appropriate breaks.', 'ai');
      }
    }
  }

  useMyLocation() {
    if (!navigator.geolocation) {
      if (window.chatManager) {
        window.chatManager.addMessage('❌ Geolocation is not supported by this browser.', 'ai');
      }
      return;
    }
    
    // Request permission explicitly for mobile devices
    if (navigator.permissions) {
      navigator.permissions.query({name: 'geolocation'}).then((result) => {
        if (result.state === 'denied') {
          if (window.chatManager) {
            window.chatManager.addMessage('❌ Location access denied. Please enable location permissions in your browser settings:\n\n📱 Mobile: Settings > Browser > Location > Allow\n💻 Desktop: Click the location icon in address bar', 'ai');
          }
          return;
        } else if (result.state === 'prompt') {
          if (window.chatManager) {
            window.chatManager.addMessage('📍 Please allow location access when prompted by your browser.', 'ai');
          }
        }
        this.startLocationProcess();
      }).catch(() => {
        // Fallback if permissions API not supported
        this.startLocationProcess();
      });
    } else {
      this.startLocationProcess();
    }
  }

  startLocationProcess() {
    if (window.chatManager) {
      window.chatManager.addMessage('🎯 Getting high-precision GPS location...', 'ai');
    }
    
    const gpsOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 0);
        
        if (window.mapManager) {
          window.mapManager.getMap().setView([lat, lng], 16);
        }
        
        const accuracyStatus = accuracy < 10 ? '🎯 Excellent' : accuracy < 30 ? '✅ Good' : accuracy < 100 ? '⚠️ Fair' : '❌ Poor';
        if (window.chatManager) {
          window.chatManager.addMessage(`${accuracyStatus} Located! Accuracy: ±${accuracy}m`, 'ai');
        }
      },
      (error) => {
        this.handleLocationError(error);
      },
      gpsOptions
    );
  }

  handleLocationError(error) {
    let message = '❌ Location access failed: ';
    switch(error.code) {
      case error.PERMISSION_DENIED:
        message += 'Permission denied. Please enable location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        message += 'Location information unavailable. Please check your GPS/network connection.';
        break;
      case error.TIMEOUT:
        message += 'Location request timed out. Please try again.';
        break;
      default:
        message += 'Unknown error occurred.';
        break;
    }
    
    if (window.chatManager) {
      window.chatManager.addMessage(message, 'ai');
    }
  }

  addCurrentLocationAsStop() {
    if (!navigator.geolocation) {
      if (window.chatManager) {
        window.chatManager.addMessage('❌ Geolocation is not supported by this browser. Please add locations manually.', 'ai');
      }
      return;
    }
    
    if (window.chatManager) {
      window.chatManager.addMessage('📍 Getting high-precision GPS location for tour stop...', 'ai');
    }
    
    const gpsOptions = {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 0);
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          
          const locationName = data.display_name ? 
            data.display_name.split(',')[0] || 'Current Location' : 
            'Current Location';
          
          if (window.tourManager) {
            window.tourManager.addTourStop({lat, lng}, locationName);
            
            const accuracyStatus = accuracy < 10 ? '🎯 Excellent' : accuracy < 30 ? '✅ Good' : accuracy < 100 ? '⚠️ Fair' : '❌ Poor';
            if (window.chatManager) {
              window.chatManager.addMessage(`${accuracyStatus} Added your current location (${locationName}) as tour stop #${window.tourManager.getTourStops().length}! GPS Accuracy: ±${accuracy}m`, 'ai');
            }
            
            const zoom = accuracy < 10 ? 18 : accuracy < 30 ? 17 : accuracy < 100 ? 16 : 15;
            if (window.mapManager) {
              window.mapManager.getMap().setView([lat, lng], zoom);
            }
          }
        } catch (error) {
          if (window.tourManager) {
            window.tourManager.addTourStop({lat, lng}, 'Current Location');
            const accuracyStatus = accuracy < 10 ? '🎯 Excellent' : accuracy < 30 ? '✅ Good' : accuracy < 100 ? '⚠️ Fair' : '❌ Poor';
            if (window.chatManager) {
              window.chatManager.addMessage(`${accuracyStatus} Added your current location as tour stop #${window.tourManager.getTourStops().length}! GPS Accuracy: ±${accuracy}m`, 'ai');
            }
            if (window.mapManager) {
              window.mapManager.getMap().setView([lat, lng], 16);
            }
          }
        }
      },
      (error) => {
        this.handleLocationError(error);
      },
      gpsOptions
    );
  }

  cacheCurrentArea() {
    if (window.mapManager) {
      window.mapManager.preloadTilesForArea();
    }
  }

  startJourney() {
    const tourStops = window.tourManager ? window.tourManager.getTourStops() : [];
    if (tourStops.length === 0) {
      if (window.chatManager) {
        window.chatManager.addMessage('❌ Please add some tour stops before starting your journey!', 'ai');
      }
      return;
    }
    
    if (!navigator.geolocation) {
      if (window.chatManager) {
        window.chatManager.addMessage('❌ GPS tracking is not supported by this browser.', 'ai');
      }
      return;
    }
    
    if (window.chatManager) {
      window.chatManager.addMessage('🚀 Starting journey! This would begin GPS navigation with turn-by-turn directions.', 'ai');
    }
  }

  // Quick add location functions for chips
  quickAddLocation(locationName) {
    if (window.searchManager) {
      window.searchManager.quickAddLocation(locationName);
    }
  }
}

// Global functions for backward compatibility
function toggleMobileView() {
  if (window.uiManager) {
    window.uiManager.toggleMobileView();
  }
}

function updateTravelMode() {
  if (window.uiManager) {
    window.uiManager.updateTravelMode();
  }
}

function updateTrafficMode() {
  if (window.uiManager) {
    window.uiManager.updateTrafficMode();
  }
}

function setStartTime(when) {
  if (window.uiManager) {
    window.uiManager.setStartTime(when);
  }
}

function useMyLocation() {
  if (window.uiManager) {
    window.uiManager.useMyLocation();
  }
}

function addCurrentLocationAsStop() {
  if (window.uiManager) {
    window.uiManager.addCurrentLocationAsStop();
  }
}

function cacheCurrentArea() {
  if (window.uiManager) {
    window.uiManager.cacheCurrentArea();
  }
}

function startJourney() {
  if (window.uiManager) {
    window.uiManager.startJourney();
  }
}

function clearTour() {
  if (window.tourManager) {
    window.tourManager.clearTour();
  }
}

function exportTour() {
  if (window.tourManager) {
    window.tourManager.exportTour();
  }
}

function getWeatherInfo() {
  if (window.weatherManager) {
    window.weatherManager.getWeatherInfo();
  }
}

function quickAddLocation(locationName) {
  if (window.uiManager) {
    window.uiManager.quickAddLocation(locationName);
  }
}

function searchLocation() {
  if (window.searchManager) {
    window.searchManager.searchLocation();
  }
}

function searchAndAddStop() {
  if (window.searchManager) {
    window.searchManager.searchAndAddStop();
  }
}

function toggleAIChat() {
  if (window.chatManager) {
    window.chatManager.toggleAIChat();
  }
}

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

// Initialize UI manager
window.uiManager = new UIManager();