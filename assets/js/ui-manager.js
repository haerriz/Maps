// UI Manager - User interface management
class UIManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeUI();
  }

  setupEventListeners() {
    // Mobile sidebar toggle
    const mobileToggle = document.getElementById('mobileToggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', this.toggleMobileSidebar);
    }

    // Form submissions
    const searchInput = document.getElementById('startLocation');
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }

    // Travel mode changes
    const travelMode = document.getElementById('travelMode');
    if (travelMode) {
      travelMode.addEventListener('change', this.handleTravelModeChange);
    }

    // Preference checkboxes
    this.setupPreferenceListeners();
  }

  setupPreferenceListeners() {
    const preferences = ['includeBreaks', 'includeFood', 'includeFuel'];
    preferences.forEach(prefId => {
      const element = document.getElementById(prefId);
      if (element) {
        element.addEventListener('change', () => {
          this.updatePreferences();
        });
      }
    });
  }

  initializeUI() {
    // Set default date and time
    this.setDefaultDateTime();
    
    // Update initial stats
    this.updateTourStats();
    
    // Initialize mobile view
    this.handleMobileView();
  }

  setDefaultDateTime() {
    const now = new Date();
    const timeInput = document.getElementById('startTime');
    const dateInput = document.getElementById('startDate');
    
    if (timeInput) {
      timeInput.value = now.toTimeString().slice(0, 5);
    }
    if (dateInput) {
      dateInput.value = now.toISOString().slice(0, 10);
    }
  }

  toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('mobile-open');
    }
  }

  handleSearch() {
    const query = document.getElementById('startLocation')?.value;
    if (query && window.searchManager) {
      window.searchManager.performSearch(query);
    }
  }

  handleTravelModeChange() {
    const mode = document.getElementById('travelMode')?.value;
    console.log('Travel mode changed to:', mode);
    
    // Update route type display
    const routeType = document.getElementById('routeType');
    if (routeType) {
      const modeNames = {
        driving: 'Driving',
        walking: 'Walking',
        cycling: 'Cycling',
        transit: 'Transit',
        mixed: 'Mixed'
      };
      routeType.textContent = modeNames[mode] || 'Direct';
    }
  }

  updatePreferences() {
    const preferences = {
      breaks: document.getElementById('includeBreaks')?.checked,
      food: document.getElementById('includeFood')?.checked,
      fuel: document.getElementById('includeFuel')?.checked
    };
    
    console.log('Preferences updated:', preferences);
  }

  updateTourStats() {
    const stops = window.tourManager?.getTourStops() || [];
    
    const totalStops = document.getElementById('totalStops');
    if (totalStops) {
      totalStops.textContent = stops.length;
    }
    
    // Distance will be updated when route is calculated
    this.updateStopsList(stops);
  }

  updateStopsList(stops) {
    const stopsList = document.getElementById('stopsList');
    if (!stopsList) return;

    if (stops.length === 0) {
      stopsList.innerHTML = '<p class="empty-stops">Click on the map to add stops</p>';
      return;
    }

    const stopsHtml = stops.map((stop, index) => `
      <div class="stop-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 4px 0; background: #f8f9fa; border-radius: 6px;">
        <span style="flex: 1; font-size: 13px;">${stop.name || `Stop ${index + 1}`}</span>
        <button onclick="window.tourManager.removeStop(${index})" style="background: #ea4335; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer;">Remove</button>
      </div>
    `).join('');

    stopsList.innerHTML = stopsHtml;
  }

  showTransportInfo(transportData) {
    const transportInfo = document.getElementById('transportInfo');
    const transportDetails = document.getElementById('transportDetails');
    
    if (transportInfo && transportDetails && transportData) {
      transportDetails.innerHTML = `
        <div style="font-size: 12px; line-height: 1.4;">
          <p><strong>Duration:</strong> ${transportData.duration || 'Calculating...'}</p>
          <p><strong>Distance:</strong> ${transportData.distance || 'Calculating...'}</p>
          <p><strong>Mode:</strong> ${transportData.mode || 'Mixed'}</p>
        </div>
      `;
      transportInfo.style.display = 'block';
    }
  }

  hideTransportInfo() {
    const transportInfo = document.getElementById('transportInfo');
    if (transportInfo) {
      transportInfo.style.display = 'none';
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#ea4335' : '#34a853'};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  handleMobileView() {
    // Handle mobile-specific UI adjustments
    if (window.innerWidth <= 768) {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.remove('mobile-open');
      }
    }
  }

  // Update UI when tour changes
  onTourUpdate() {
    this.updateTourStats();
  }

  // Update UI when route is calculated
  onRouteCalculated(routeData) {
    if (routeData) {
      const totalDistance = document.getElementById('totalDistance');
      if (totalDistance && routeData.distance) {
        totalDistance.textContent = Utils.formatDistance(routeData.distance);
      }
      
      this.showTransportInfo({
        duration: Utils.formatDuration(routeData.duration),
        distance: Utils.formatDistance(routeData.distance),
        mode: document.getElementById('travelMode')?.value || 'driving'
      });
    }
  }
}

// Global UI functions for compatibility
function toggleMobileView() {
  if (window.uiManager) {
    window.uiManager.toggleMobileSidebar();
  }
}

function toggleMobileSheet() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('mobile-expanded');
  }
}

// Initialize UI manager
window.addEventListener('DOMContentLoaded', () => {
  window.uiManager = new UIManager();
  
  // Listen for tour updates
  if (window.tourManager) {
    const originalAddStop = window.tourManager.addStop.bind(window.tourManager);
    const originalRemoveStop = window.tourManager.removeStop.bind(window.tourManager);
    
    window.tourManager.addStop = function(latlng) {
      originalAddStop(latlng);
      window.uiManager.onTourUpdate();
    };
    
    window.tourManager.removeStop = function(index) {
      originalRemoveStop(index);
      window.uiManager.onTourUpdate();
    };
  }
});