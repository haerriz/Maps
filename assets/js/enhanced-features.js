// Enhanced Features - Free APIs integration

class EnhancedFeatures {
  constructor() {
    this.cache = new Map();
    this.init();
  }

  init() {
    this.setupLocationEnhancements();
    this.addFeatureButtons();
  }

  setupLocationEnhancements() {
    // Auto-enhance locations when added
    document.addEventListener('locationAdded', (e) => {
      this.enhanceLocation(e.detail.lat, e.detail.lng);
    });
  }

  async enhanceLocation(lat, lng) {
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const enhancements = await Promise.allSettled([
      this.getCountryInfo(lat, lng),
      this.getSunTimes(lat, lng),
      this.getElevation(lat, lng),
      this.getAirQuality(lat, lng)
    ]);

    const result = {
      country: enhancements[0].status === 'fulfilled' ? enhancements[0].value : null,
      sunTimes: enhancements[1].status === 'fulfilled' ? enhancements[1].value : null,
      elevation: enhancements[2].status === 'fulfilled' ? enhancements[2].value : null,
      airQuality: enhancements[3].status === 'fulfilled' ? enhancements[3].value : null
    };

    this.cache.set(cacheKey, result);
    this.displayEnhancements(result);
    return result;
  }

  async getCountryInfo(lat, lng) {
    // Skip API calls for local development (file:// protocol)
    if (location.protocol === 'file:') {
      return {
        name: { common: 'Demo Country' },
        flag: '🌍',
        currencies: { USD: { name: 'US Dollar' } }
      };
    }
    
    try {
      const countryResponse = await fetch(`https://restcountries.com/v3.1/alpha/US`);
      const countryData = await countryResponse.json();
      return countryData[0];
    } catch (error) {
      return null;
    }
  }

  async getSunTimes(lat, lng) {
    if (location.protocol === 'file:') {
      return {
        results: {
          sunrise: new Date().toISOString(),
          sunset: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        }
      };
    }
    
    try {
      const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`);
      return response.json();
    } catch {
      return null;
    }
  }

  async getElevation(lat, lng) {
    if (location.protocol === 'file:') {
      return { elevation: Math.floor(Math.random() * 1000) + 100 };
    }
    
    try {
      const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
      const data = await response.json();
      return data.results[0];
    } catch {
      return null;
    }
  }

  async getAirQuality(lat, lng) {
    // OpenWeatherMap requires API key, skip for now
    return null;
  }

  displayEnhancements(data) {
    const container = document.getElementById('locationEnhancements') || this.createEnhancementsContainer();
    
    let html = '<div class="enhancement-grid">';
    
    if (data.country) {
      html += `
        <div class="enhancement-card country">
          <div class="enhancement-icon">${data.country.flag}</div>
          <div class="enhancement-info">
            <strong>${data.country.name.common}</strong>
            <small>Currency: ${Object.values(data.country.currencies || {})[0]?.name || 'N/A'}</small>
          </div>
        </div>
      `;
    }

    if (data.elevation) {
      html += `
        <div class="enhancement-card elevation">
          <div class="enhancement-icon">⛰️</div>
          <div class="enhancement-info">
            <strong>${data.elevation.elevation}m</strong>
            <small>Elevation</small>
          </div>
        </div>
      `;
    }

    if (data.sunTimes?.results) {
      const sunrise = new Date(data.sunTimes.results.sunrise).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const sunset = new Date(data.sunTimes.results.sunset).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      html += `
        <div class="enhancement-card sun-times">
          <div class="enhancement-icon">🌅</div>
          <div class="enhancement-info">
            <strong>${sunrise} - ${sunset}</strong>
            <small>Sunrise - Sunset</small>
          </div>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  createEnhancementsContainer() {
    // Check if container already exists
    let container = document.getElementById('locationEnhancements');
    if (container) return container;
    
    container = document.createElement('div');
    container.id = 'locationEnhancements';
    container.className = 'location-enhancements';
    
    const sidebar = document.querySelector('.sidebar-content');
    if (sidebar) {
      // Simply append to avoid insertBefore issues
      sidebar.appendChild(container);
    }
    
    return container;
  }

  addFeatureButtons() {
    const actionsSection = document.getElementById('actions');
    if (actionsSection) {
      const newButtons = `
        <button class="btn btn-secondary" onclick="window.enhancedFeatures.showTimeZones()">
          <span class="material-icons">schedule</span>
          Time Zones
        </button>
        <button class="btn btn-secondary" onclick="window.enhancedFeatures.showWikipediaInfo()">
          <span class="material-icons">article</span>
          Wikipedia
        </button>
      `;
      
      const actionGrid = actionsSection.querySelector('.action-grid');
      actionGrid.innerHTML += newButtons;
    }
  }

  async showTimeZones() {
    const stops = window.tourManager?.stops || [];
    if (stops.length === 0) return;

    let timeZoneInfo = '<div class="timezone-info">';
    
    for (const stop of stops) {
      try {
        // Use worldtimeapi.org (free, no key required)
        const response = await fetch(`https://worldtimeapi.org/api/timezone/Etc/GMT`);
        const data = await response.json();
        
        const localTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        timeZoneInfo += `
          <div class="timezone-item">
            <strong>${stop.name}</strong>
            <span>${localTime} (Local Time)</span>
          </div>
        `;
      } catch (error) {
        console.log('Timezone fetch failed for', stop.name);
      }
    }
    
    timeZoneInfo += '</div>';
    
    if (window.chatManager) {
      window.chatManager.addMessage(timeZoneInfo, 'ai');
    }
  }

  async showWikipediaInfo() {
    const stops = window.tourManager?.stops || [];
    if (stops.length === 0) return;

    const lastStop = stops[stops.length - 1];
    
    try {
      const searchResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/geosearch?latitude=${lastStop.lat}&longitude=${lastStop.lng}&radius=10000&limit=3`);
      const searchData = await searchResponse.json();
      
      if (searchData.pages && searchData.pages.length > 0) {
        const page = searchData.pages[0];
        const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${page.title}`);
        const summaryData = await summaryResponse.json();
        
        const wikiInfo = `
          <div class="wikipedia-info">
            <h4>📖 ${summaryData.title}</h4>
            <p>${summaryData.extract}</p>
            <a href="${summaryData.content_urls.desktop.page}" target="_blank" class="btn btn-outline btn-sm">Read More</a>
          </div>
        `;
        
        if (window.chatManager) {
          window.chatManager.addMessage(wikiInfo, 'ai');
        }
      }
    } catch (error) {
      console.log('Wikipedia fetch failed');
    }
  }

  // Route elevation profile
  async getRouteElevation(coordinates) {
    const elevationPoints = [];
    const samplePoints = coordinates.filter((_, index) => index % 5 === 0); // Sample every 5th point
    
    for (const coord of samplePoints) {
      try {
        const elevation = await this.getElevation(coord[0], coord[1]);
        elevationPoints.push(elevation.elevation);
      } catch (error) {
        elevationPoints.push(0);
      }
    }
    
    return elevationPoints;
  }
}

// Initialize enhanced features
window.addEventListener('DOMContentLoaded', () => {
  window.enhancedFeatures = new EnhancedFeatures();
});