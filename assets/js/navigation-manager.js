// Navigation Manager - Turn-by-turn navigation with free APIs
class NavigationManager {
  constructor() {
    this.isNavigating = false;
    this.currentStep = 0;
    this.navigationSteps = [];
    this.currentPosition = null;
    this.watchId = null;
    this.speechSynthesis = window.speechSynthesis;
    this.voiceEnabled = true;
    this.currentHeading = 0;
    this.currentSpeed = 0;
    this.lastPosition = null;
    this.lastPositionTime = null;
    this.offRouteDistance = 100;
    this.isOffRoute = false;
  }

  async startNavigation(stops) {
    if (stops.length < 2) {
      alert('Please add at least 2 locations to start navigation.');
      return;
    }

    try {
      // Get detailed route with turn-by-turn instructions
      const route = await this.getDetailedRoute(stops);
      if (!route) {
        alert('Unable to calculate navigation route.');
        return;
      }

      this.navigationSteps = route.steps;
      this.currentStep = 0;
      this.isNavigating = true;

      // Optional: Enable subtle 3D effects for navigation
      setTimeout(() => {
        if (window.map3DManager) {
          window.map3DManager.enable3DMode();
        }
      }, 1000);
      
      // Show navigation UI
      this.showNavigationUI();
      
      // Start location tracking
      this.startLocationTracking();
      
      // Display first instruction
      this.updateNavigationDisplay();
      
      // Speak first instruction
      this.speakInstruction(this.navigationSteps[0]);

    } catch (error) {
      console.error('Navigation start failed:', error);
      alert('Navigation failed to start. Please try again.');
    }
  }

  async getDetailedRoute(stops) {
    try {
      const coordinates = stops.map(stop => `${stop.lng},${stop.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?steps=true&geometries=geojson&overview=full`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const steps = [];
        
        // Process each leg of the route
        route.legs.forEach((leg, legIndex) => {
          leg.steps.forEach((step, stepIndex) => {
            const instruction = this.parseInstruction(step);
            steps.push({
              instruction: instruction.text,
              distance: step.distance,
              duration: step.duration,
              coordinates: step.geometry.coordinates.map(coord => [coord[1], coord[0]]),
              maneuver: step.maneuver,
              roadName: this.extractRoadName(step),
              stepIndex: stepIndex,
              legIndex: legIndex
            });
          });
        });
        
        return { steps, totalDistance: route.distance, totalDuration: route.duration };
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
    }
    return null;
  }

  parseInstruction(step) {
    const maneuver = step.maneuver;
    const type = maneuver.type;
    const modifier = maneuver.modifier;
    const distance = Math.round(step.distance);
    const roadName = this.extractRoadName(step) || 'the road';

    let instruction = '';
    let icon = '🚗';

    switch (type) {
      case 'depart':
        instruction = `Start on ${roadName}`;
        icon = '🚀';
        break;
      case 'turn':
        if (modifier === 'left') {
          instruction = `Turn left onto ${roadName}`;
          icon = '↰';
        } else if (modifier === 'right') {
          instruction = `Turn right onto ${roadName}`;
          icon = '↱';
        } else if (modifier === 'slight left') {
          instruction = `Keep left onto ${roadName}`;
          icon = '↖';
        } else if (modifier === 'slight right') {
          instruction = `Keep right onto ${roadName}`;
          icon = '↗';
        } else if (modifier === 'sharp left') {
          instruction = `Sharp left onto ${roadName}`;
          icon = '↰';
        } else if (modifier === 'sharp right') {
          instruction = `Sharp right onto ${roadName}`;
          icon = '↱';
        }
        break;
      case 'merge':
        instruction = `Merge onto ${roadName}`;
        icon = '🔀';
        break;
      case 'ramp':
        instruction = `Take the ramp to ${roadName}`;
        icon = '🛣️';
        break;
      case 'roundabout':
        instruction = `Take the roundabout and exit onto ${roadName}`;
        icon = '🔄';
        break;
      case 'continue':
        instruction = `Continue on ${roadName}`;
        icon = '⬆️';
        break;
      case 'arrive':
        instruction = `Arrive at your destination`;
        icon = '🏁';
        break;
      default:
        instruction = `Continue for ${distance}m on ${roadName}`;
        icon = '➡️';
    }

    if (distance > 0 && type !== 'arrive') {
      instruction += ` for ${this.formatDistance(distance)}`;
    }

    return { text: instruction, icon };
  }

  extractRoadName(step) {
    if (step.name) return step.name;
    if (step.ref) return step.ref;
    if (step.destinations) return step.destinations;
    return null;
  }

  formatDistance(meters) {
    if (meters < 1000) {
      return `${meters}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  showNavigationUI() {
    // Create navigation overlay
    const navOverlay = document.createElement('div');
    navOverlay.id = 'navigationOverlay';
    navOverlay.className = 'navigation-overlay';
    
    navOverlay.innerHTML = `
      <div class="nav-header">
        <div class="nav-info">
          <div class="nav-step-icon" id="navStepIcon">🚗</div>
          <div class="nav-instruction" id="navInstruction">Starting navigation...</div>
        </div>
        <div class="nav-controls">
          <button class="nav-voice-toggle active" onclick="window.navigationManager.toggleVoice()" title="Toggle Voice">
            <span class="material-icons">volume_up</span>
          </button>
          <button class="nav-close" onclick="window.navigationManager.stopNavigation()">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
      <div class="nav-details">
        <div class="nav-distance" id="navDistance">0m</div>
        <div class="nav-road" id="navRoad">Calculating route...</div>
        <div class="nav-speed" id="navSpeed">0 km/h</div>
      </div>
      <div class="nav-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="progressFill"></div>
        </div>
        <div class="nav-eta" id="navEta">ETA: Calculating...</div>
      </div>
      <div class="nav-actions">
        <button class="nav-directions-btn" onclick="window.navigationManager.toggleDirections()">
          <span class="material-icons">list</span>
          <span>Directions</span>
        </button>
      </div>
    `;
    
    document.body.appendChild(navOverlay);
  }

  updateNavigationDisplay() {
    if (!this.isNavigating || this.currentStep >= this.navigationSteps.length) return;

    const step = this.navigationSteps[this.currentStep];
    const instruction = this.parseInstruction({ 
      maneuver: step.maneuver, 
      distance: step.distance,
      name: step.roadName 
    });

    // Update UI elements
    const navInstruction = document.getElementById('navInstruction');
    const navStepIcon = document.getElementById('navStepIcon');
    const navDistance = document.getElementById('navDistance');
    const navRoad = document.getElementById('navRoad');
    const progressFill = document.getElementById('progressFill');
    const navEta = document.getElementById('navEta');

    if (navInstruction) navInstruction.textContent = instruction.text;
    if (navStepIcon) navStepIcon.textContent = instruction.icon;
    if (navDistance) navDistance.textContent = this.formatDistance(step.distance);
    if (navRoad) {
      const roadName = step.roadName || this.extractCurrentRoadName() || 'Continue straight';
      navRoad.textContent = roadName;
    }
    
    // Update progress
    const progress = (this.currentStep / this.navigationSteps.length) * 100;
    if (progressFill) progressFill.style.width = `${progress}%`;
    
    // Calculate ETA
    const remainingTime = this.calculateRemainingTime();
    if (navEta) navEta.textContent = `ETA: ${remainingTime}`;
  }

  calculateRemainingTime() {
    let totalDuration = 0;
    for (let i = this.currentStep; i < this.navigationSteps.length; i++) {
      totalDuration += this.navigationSteps[i].duration;
    }
    
    const minutes = Math.round(totalDuration / 60);
    const now = new Date();
    const eta = new Date(now.getTime() + (totalDuration * 1000));
    
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  startLocationTracking() {
    // Location tracking disabled - use simulated navigation
    console.log('Location tracking disabled - using simulated navigation');
    this.simulateLocationTracking();
  }

  simulateLocationTracking() {
    // Simulate location updates for navigation demo
    let stepIndex = 0;
    this.simulationInterval = setInterval(() => {
      if (!this.isNavigating || stepIndex >= this.navigationSteps.length) {
        clearInterval(this.simulationInterval);
        return;
      }

      const currentStep = this.navigationSteps[stepIndex];
      if (currentStep && currentStep.coordinates && currentStep.coordinates.length > 0) {
        const coord = currentStep.coordinates[0];
        this.currentPosition = {
          lat: coord[0],
          lng: coord[1],
          heading: 0,
          speed: 50 // Simulated speed
        };

        this.updateSpeed(this.currentPosition);
        this.updateUserLocationMarker(this.currentPosition);
        
        // Move to next step
        stepIndex++;
        this.currentStep = stepIndex;
        
        if (stepIndex < this.navigationSteps.length) {
          this.updateNavigationDisplay();
          this.speakInstruction(this.navigationSteps[stepIndex]);
        } else {
          this.arriveAtDestination();
        }
      }
    }, 5000); // Update every 5 seconds for demo
  }

  handleNavigationLocationError(error) {
    let message = 'Navigation location error: ';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message += 'Location access denied. Navigation requires location permissions.';
        break;
      case error.POSITION_UNAVAILABLE:
        message += 'Location unavailable. Please check your GPS signal.';
        break;
      case error.TIMEOUT:
        message += 'Location timeout. Retrying...';
        // Retry location tracking
        setTimeout(() => {
          if (this.isNavigating) {
            this.startLocationTracking();
          }
        }, 5000);
        return;
      default:
        message += 'Unknown location error occurred.';
        break;
    }
    
    console.error(message);
    this.showNavigationError(message);
  }

  showNavigationError(message) {
    const navInstruction = document.getElementById('navInstruction');
    if (navInstruction) {
      navInstruction.textContent = message;
    }
    
    if (this.voiceEnabled) {
      this.speakText('Navigation error occurred');
    }
  }

  checkNavigationProgress() {
    if (!this.currentPosition || !this.isNavigating) return;

    const currentStep = this.navigationSteps[this.currentStep];
    if (!currentStep) return;

    // Check if we're close to the next step
    const stepEndCoord = currentStep.coordinates[currentStep.coordinates.length - 1];
    const distance = this.calculateDistance([
      { lat: this.currentPosition.lat, lng: this.currentPosition.lng },
      { lat: stepEndCoord[0], lng: stepEndCoord[1] }
    ]);

    // If within 50 meters of step end, move to next step
    if (distance < 50) {
      this.currentStep++;
      
      if (this.currentStep >= this.navigationSteps.length) {
        this.arriveAtDestination();
      } else {
        this.updateNavigationDisplay();
        this.speakInstruction(this.navigationSteps[this.currentStep]);
      }
    }
  }

  checkIfOffRoute() {
    if (!this.currentPosition || !this.navigationSteps[this.currentStep]) return;
    
    const currentStep = this.navigationSteps[this.currentStep];
    let minDistance = Infinity;
    
    currentStep.coordinates.forEach(coord => {
      const distance = this.calculateDistance([
        { lat: this.currentPosition.lat, lng: this.currentPosition.lng },
        { lat: coord[0], lng: coord[1] }
      ]);
      minDistance = Math.min(minDistance, distance);
    });
    
    if (minDistance > this.offRouteDistance && !this.isOffRoute) {
      this.isOffRoute = true;
      this.handleOffRoute();
    } else if (minDistance <= this.offRouteDistance && this.isOffRoute) {
      this.isOffRoute = false;
    }
  }

  calculateDistance(coords) {
    if (coords.length < 2) return 0;
    
    const R = 6371000; // Earth's radius in meters
    const lat1 = coords[0].lat * Math.PI / 180;
    const lat2 = coords[1].lat * Math.PI / 180;
    const deltaLat = (coords[1].lat - coords[0].lat) * Math.PI / 180;
    const deltaLng = (coords[1].lng - coords[0].lng) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    const voiceBtn = document.querySelector('.nav-voice-toggle');
    const icon = voiceBtn?.querySelector('.material-icons');
    
    if (voiceBtn) {
      voiceBtn.classList.toggle('active', this.voiceEnabled);
    }
    if (icon) {
      icon.textContent = this.voiceEnabled ? 'volume_up' : 'volume_off';
    }
    
    if (!this.voiceEnabled && this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  updateSpeed(position) {
    if (this.lastPosition && this.lastPositionTime) {
      const distance = this.calculateDistance([
        { lat: this.lastPosition.lat, lng: this.lastPosition.lng },
        { lat: position.lat, lng: position.lng }
      ]);
      
      const timeElapsed = (Date.now() - this.lastPositionTime) / 1000;
      
      if (timeElapsed > 0) {
        this.currentSpeed = (distance / timeElapsed) * 3.6;
      }
    }
    
    this.lastPosition = position;
    this.lastPositionTime = Date.now();
    
    const speedElement = document.getElementById('navSpeed');
    if (speedElement) {
      speedElement.textContent = `${Math.round(this.currentSpeed)} km/h`;
    }
  }

  updateUserLocationMarker(position) {
    if (window.mapManager) {
      window.mapManager.updateUserLocationWithHeading(
        position.lat, 
        position.lng, 
        this.currentHeading
      );
    }
    
    // Optional: Update 3D camera following
    if (window.map3DManager && window.map3DManager.is3DMode) {
      try {
        window.map3DManager.followUserLocation(
          position.lat,
          position.lng,
          this.currentHeading
        );
      } catch (error) {
        console.warn('3D camera update failed:', error);
      }
    }
  }

  async handleOffRoute() {
    if (this.voiceEnabled) {
      this.speakText('Recalculating route...');
    }
    
    const navInstruction = document.getElementById('navInstruction');
    if (navInstruction) {
      navInstruction.textContent = 'Recalculating route...';
    }
    
    try {
      const remainingStops = this.getRemainingStops();
      if (remainingStops.length > 0) {
        const newRoute = await this.getDetailedRoute([
          { lat: this.currentPosition.lat, lng: this.currentPosition.lng },
          ...remainingStops
        ]);
        
        if (newRoute) {
          this.navigationSteps = newRoute.steps;
          this.currentStep = 0;
          this.updateNavigationDisplay();
          
          if (this.voiceEnabled) {
            this.speakInstruction(this.navigationSteps[0]);
          }
        }
      }
    } catch (error) {
      console.error('Rerouting failed:', error);
    }
  }

  getRemainingStops() {
    const currentStepLeg = this.navigationSteps[this.currentStep]?.legIndex || 0;
    const originalStops = window.tourManager?.getStops() || [];
    return originalStops.slice(currentStepLeg + 1);
  }

  speakInstruction(step) {
    if (!this.voiceEnabled || !this.speechSynthesis) return;

    const instruction = this.parseInstruction({
      maneuver: step.maneuver,
      distance: step.distance,
      name: step.roadName
    });

    this.speakText(instruction.text);
  }

  speakText(text) {
    if (!this.voiceEnabled || !this.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    this.speechSynthesis.speak(utterance);
  }

  extractCurrentRoadName() {
    const currentStep = this.navigationSteps[this.currentStep];
    if (currentStep && currentStep.roadName) {
      return currentStep.roadName;
    }
    return null;
  }

  toggleDirections() {
    const existingPanel = document.getElementById('directionsPanel');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }
    
    this.showDirectionsPanel();
  }

  showDirectionsPanel() {
    const panel = document.createElement('div');
    panel.id = 'directionsPanel';
    panel.className = 'directions-panel';
    
    const upcomingSteps = this.navigationSteps.slice(this.currentStep, this.currentStep + 8);
    
    panel.innerHTML = `
      <div class="directions-header">
        <h3>Trip Directions</h3>
        <button class="close-directions" onclick="document.getElementById('directionsPanel').remove()">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="directions-content">
        ${upcomingSteps.map((step, index) => {
          const instruction = this.parseInstruction({
            maneuver: step.maneuver,
            distance: step.distance,
            name: step.roadName
          });
          const isCurrent = index === 0;
          const trafficColor = this.getTrafficColorForStep(step);
          
          return `
            <div class="direction-step ${isCurrent ? 'current' : ''}">
              <div class="step-icon">${instruction.icon}</div>
              <div class="step-info">
                <div class="step-instruction">${instruction.text}</div>
                <div class="step-details">
                  <span class="step-distance">${this.formatDistance(step.distance)}</span>
                  <span class="step-road">${step.roadName || 'Unnamed road'}</span>
                  <span class="step-traffic" style="color: ${trafficColor}">
                    <span class="material-icons">traffic</span>
                    ${this.getTrafficText(step)}
                  </span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    document.body.appendChild(panel);
  }

  getTrafficColorForStep(step) {
    // Simulate traffic based on road type and time
    const hour = new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    
    if (step.roadName && step.roadName.toLowerCase().includes('highway')) {
      return isRushHour ? '#ea4335' : '#fbbc04';
    } else if (step.roadName && step.roadName.toLowerCase().includes('main')) {
      return isRushHour ? '#fbbc04' : '#34a853';
    }
    return '#34a853';
  }

  getTrafficText(step) {
    const color = this.getTrafficColorForStep(step);
    if (color === '#ea4335') return 'Heavy';
    if (color === '#fbbc04') return 'Moderate';
    return 'Light';
  }

  arriveAtDestination() {
    this.isNavigating = false;
    
    // Update UI to show arrival
    const navInstruction = document.getElementById('navInstruction');
    const navStepIcon = document.getElementById('navStepIcon');
    
    if (navInstruction) navInstruction.textContent = 'You have arrived at your destination!';
    if (navStepIcon) navStepIcon.textContent = '🏁';
    
    // Speak arrival message
    this.speakInstruction({
      maneuver: { type: 'arrive' },
      distance: 0,
      roadName: ''
    });
    
    // Auto-close navigation after 5 seconds
    setTimeout(() => {
      this.stopNavigation();
    }, 5000);
  }

  stopNavigation() {
    this.isNavigating = false;
    this.currentStep = 0;
    this.navigationSteps = [];
    
    // Disable 3D mode
    if (window.map3DManager) {
      window.map3DManager.disable3DMode();
    }
    
    // Stop simulation interval
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    // Remove navigation UI
    const navOverlay = document.getElementById('navigationOverlay');
    if (navOverlay) {
      navOverlay.remove();
    }
    
    // Stop speech synthesis
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }
}

// Initialize navigation manager
window.addEventListener('DOMContentLoaded', () => {
  window.navigationManager = new NavigationManager();
});