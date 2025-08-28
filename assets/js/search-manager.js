// Search Manager - Location search and geocoding
class SearchManager {
  constructor() {
    this.searchInput = null;
    this.suggestionsContainer = null;
    this.init();
  }

  init() {
    this.searchInput = document.getElementById('startLocation');
    this.suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (this.searchInput) {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // Debounced search
    const debouncedSearch = Utils.debounce((query) => {
      this.performSearch(query);
    }, 300);

    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length > 2) {
        debouncedSearch(query);
      } else {
        this.hideSuggestions();
      }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.suggestionsContainer?.contains(e.target)) {
        this.hideSuggestions();
      }
    });
  }

  async performSearch(query) {
    try {
      const results = await Utils.geocodeLocation(query);
      this.displaySuggestions(results);
    } catch (error) {
      console.warn('Search failed:', error);
      this.hideSuggestions();
    }
  }

  displaySuggestions(results) {
    if (!this.suggestionsContainer || results.length === 0) {
      this.hideSuggestions();
      return;
    }

    const suggestionsHtml = results.map(result => `
      <div class="suggestion-item" onclick="window.searchManager.selectLocation(${result.lat}, ${result.lng}, '${result.name.replace(/'/g, "\\'")}')">
        <div class="suggestion-text">${result.name}</div>
        <div class="suggestion-actions">
          <button class="suggestion-btn find" onclick="event.stopPropagation(); window.searchManager.centerOnLocation(${result.lat}, ${result.lng})" title="Center on map">
            <span class="material-icons">center_focus_strong</span>
          </button>
          <button class="suggestion-btn add" onclick="event.stopPropagation(); window.searchManager.addAsStop(${result.lat}, ${result.lng}, '${result.name.replace(/'/g, "\\'")}');" title="Add as stop">
            <span class="material-icons">add_location</span>
          </button>
        </div>
      </div>
    `).join('');

    this.suggestionsContainer.innerHTML = suggestionsHtml;
    this.suggestionsContainer.style.display = 'block';
  }

  hideSuggestions() {
    if (this.suggestionsContainer) {
      this.suggestionsContainer.style.display = 'none';
    }
  }

  selectLocation(lat, lng, name) {
    this.searchInput.value = name;
    this.centerOnLocation(lat, lng);
    this.hideSuggestions();
  }

  centerOnLocation(lat, lng) {
    if (window.mapManager && window.mapManager.map) {
      window.mapManager.map.setView([lat, lng], 15);
    }
  }

  centerAndAddLocation(lat, lng, name) {
    // Center map first, then add marker
    if (window.mapManager) {
      window.mapManager.centerOnLocation(lat, lng, 15);
      window.mapManager.addMarker({ lat, lng });
    }
    if (window.tourManager) {
      window.tourManager.addStop({ lat, lng, name });
    }
  }

  addAsStop(lat, lng, name) {
    if (window.tourManager) {
      window.tourManager.addStop({ lat, lng, name });
    }
    if (window.mapManager) {
      window.mapManager.addMarker({ lat, lng });
    }
    this.hideSuggestions();
  }
}

// Global functions for compatibility
function searchLocation() {
  const query = document.getElementById('startLocation')?.value;
  if (query && window.searchManager) {
    window.searchManager.performSearch(query);
  }
}

function searchAndAddStop() {
  const query = document.getElementById('startLocation')?.value;
  if (query && window.Utils) {
    Utils.geocodeLocation(query).then(results => {
      if (results.length > 0) {
        const result = results[0];
        if (window.tourManager) {
          window.tourManager.addStop(result);
        }
        if (window.mapManager) {
          window.mapManager.addMarker(result);
        }
      }
    });
  }
}

// Initialize search manager
window.addEventListener('DOMContentLoaded', () => {
  window.searchManager = new SearchManager();
});