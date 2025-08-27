/**
 * Search Manager Module
 * Handles location search, suggestions, and geocoding
 */

class SearchManager {
  constructor() {
    this.searchTimeout = null;
    this.currentSuggestions = [];
    this.popularDestinations = [
      { name: 'New York City, USA', category: 'Popular Cities', lat: 40.7128, lng: -74.0060 },
      { name: 'Paris, France', category: 'Popular Cities', lat: 48.8566, lng: 2.3522 },
      { name: 'London, UK', category: 'Popular Cities', lat: 51.5074, lng: -0.1278 },
      { name: 'Tokyo, Japan', category: 'Popular Cities', lat: 35.6762, lng: 139.6503 },
      { name: 'Rome, Italy', category: 'Popular Cities', lat: 41.9028, lng: 12.4964 },
      { name: 'Barcelona, Spain', category: 'Popular Cities', lat: 41.3851, lng: 2.1734 },
      { name: 'Amsterdam, Netherlands', category: 'Popular Cities', lat: 52.3676, lng: 4.9041 },
      { name: 'Berlin, Germany', category: 'Popular Cities', lat: 52.5200, lng: 13.4050 },
      { name: 'Sydney, Australia', category: 'Popular Cities', lat: -33.8688, lng: 151.2093 },
      { name: 'Dubai, UAE', category: 'Popular Cities', lat: 25.2048, lng: 55.2708 },
      { name: 'Bangkok, Thailand', category: 'Popular Cities', lat: 13.7563, lng: 100.5018 },
      { name: 'Istanbul, Turkey', category: 'Popular Cities', lat: 41.0082, lng: 28.9784 },
      { name: 'Mumbai, India', category: 'Popular Cities', lat: 19.0760, lng: 72.8777 },
      { name: 'Delhi, India', category: 'Popular Cities', lat: 28.7041, lng: 77.1025 },
      { name: 'Bangalore, India', category: 'Popular Cities', lat: 12.9716, lng: 77.5946 },
      { name: 'Chennai, India', category: 'Popular Cities', lat: 13.0827, lng: 80.2707 },
      { name: 'Kolkata, India', category: 'Popular Cities', lat: 22.5726, lng: 88.3639 },
      { name: 'Kodaikanal, India', category: 'Popular Cities', lat: 10.2381, lng: 77.4892 },
      { name: 'Ooty, India', category: 'Popular Cities', lat: 11.4064, lng: 76.6932 },
      { name: 'Goa, India', category: 'Beach Destinations', lat: 15.2993, lng: 74.1240 },
      { name: 'Manali, India', category: 'Mountain Destinations', lat: 32.2432, lng: 77.1892 },
      { name: 'Shimla, India', category: 'Mountain Destinations', lat: 31.1048, lng: 77.1734 }
    ];
    this.setupEventListeners();
  }

  setupEventListeners() {
    const searchInput = document.getElementById('startLocation');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      clearTimeout(this.searchTimeout);
      
      if (query.length < 2) {
        this.hideSuggestions();
        return;
      }
      
      this.searchTimeout = setTimeout(() => {
        this.showSuggestions(query);
      }, 150);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          this.searchAndAddStop();
        } else {
          this.searchLocation();
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateSuggestions(e.key === 'ArrowDown' ? 1 : -1);
      } else if (e.key === 'Escape') {
        this.hideSuggestions();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#startLocation') && !e.target.closest('#searchSuggestions')) {
        this.hideSuggestions();
      }
    });
  }

  async searchLocation() {
    const location = document.getElementById('startLocation').value.trim();
    if (!location) {
      if (window.chatManager) {
        window.chatManager.addMessage('Please enter a location to search for.', 'ai');
      }
      return;
    }
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        const latlng = [parseFloat(result.lat), parseFloat(result.lon)];
        
        if (window.mapManager) {
          window.mapManager.getMap().setView(latlng, 13);
        }
        
        // Remove any existing search marker
        if (window.searchMarker && window.mapManager) {
          window.mapManager.getMap().removeLayer(window.searchMarker);
        }
        
        // Add new search marker with different color
        if (window.mapManager) {
          window.searchMarker = L.marker(latlng, {
            icon: L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          }).addTo(window.mapManager.getMap());
          
          const locationName = result.display_name.split(',')[0];
          window.searchMarker.bindPopup(`
            <div style="text-align: center;">
              <strong>📍 ${locationName}</strong><br>
              <small>${result.display_name}</small><br><br>
              <button onclick="window.searchManager.addFoundLocationAsStop('${locationName.replace(/'/g, "\\'")}')"
                      class="btn btn-success" style="padding: 8px 16px;">
                <span class="material-icons" style="font-size: 16px;">add_location</span>
                Add as Tour Stop
              </button>
            </div>
          `).openPopup();
          
          if (window.chatManager) {
            window.chatManager.addMessage(`Found ${locationName}! I've centered the map and added a blue marker. Click the marker to add it as a tour stop.`, 'ai');
          }
          
          // Clear search input
          document.getElementById('startLocation').value = '';
          this.hideSuggestions();
        }
      } else {
        if (window.chatManager) {
          window.chatManager.addMessage("I couldn't find that location. Try being more specific or check the spelling.", 'ai');
        }
      }
    } catch (error) {
      if (window.chatManager) {
        window.chatManager.addMessage("There was an error searching for that location. Please check your internet connection and try again.", 'ai');
      }
    }
  }

  async searchAndAddStop() {
    const location = document.getElementById('startLocation').value.trim();
    if (!location) {
      if (window.chatManager) {
        window.chatManager.addMessage('Please enter a location to add as a tour stop.', 'ai');
      }
      return;
    }
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`);
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        const latlng = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        const locationName = result.display_name.split(',')[0];
        
        if (window.tourManager) {
          window.tourManager.addTourStop(latlng, locationName);
          if (window.chatManager) {
            window.chatManager.addMessage(`Added ${locationName} as tour stop #${window.tourManager.getTourStops().length}! 🎉`, 'ai');
          }
          
          // Clear search input and hide suggestions
          document.getElementById('startLocation').value = '';
          this.hideSuggestions();
          
          // Center map on new stop
          if (window.mapManager) {
            window.mapManager.getMap().setView([latlng.lat, latlng.lng], 12);
          }
        }
      } else {
        if (window.chatManager) {
          window.chatManager.addMessage("I couldn't find that location to add as a stop. Try being more specific.", 'ai');
        }
      }
    } catch (error) {
      if (window.chatManager) {
        window.chatManager.addMessage("There was an error adding that location. Please try again.", 'ai');
      }
    }
  }

  addFoundLocationAsStop(locationName) {
    if (window.searchMarker && window.mapManager && window.tourManager) {
      const latlng = window.searchMarker.getLatLng();
      window.tourManager.addTourStop(latlng, locationName);
      if (window.chatManager) {
        window.chatManager.addMessage(`Added ${locationName} as tour stop #${window.tourManager.getTourStops().length}! 🎉`, 'ai');
      }
      
      // Remove the search marker since it's now a tour stop
      window.mapManager.getMap().removeLayer(window.searchMarker);
      window.searchMarker = null;
    }
  }

  async showSuggestions(query) {
    const suggestions = [];
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    // Show loading indicator
    suggestionsDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #5f6368; font-size: 12px;">🔍 Searching...</div>';
    suggestionsDiv.style.display = 'block';
    
    // Add popular destinations that match
    const matchingPopular = this.popularDestinations.filter(dest => 
      dest.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matchingPopular.length > 0) {
      suggestions.push({ type: 'category', name: '🌟 Popular Cities' });
      matchingPopular.slice(0, 5).forEach(dest => {
        suggestions.push({ type: 'suggestion', name: dest.name, lat: dest.lat, lng: dest.lng });
      });
    }
    
    // Enhanced multi-API search with fallback
    try {
      const searchResults = await this.searchWithFallback(query);
      
      if (searchResults.length > 0) {
        suggestions.push({ type: 'category', name: '🔍 Search Results' });
        searchResults.slice(0, 25).forEach(result => {
          suggestions.push({
            type: 'suggestion',
            name: result.display_name || result.name,
            lat: result.lat,
            lon: result.lon || result.lng
          });
        });
      }
    } catch (error) {
      console.log('Search error:', error);
      if (suggestions.length === 0) {
        suggestions.push({ type: 'category', name: '❌ No results found' });
        suggestions.push({ type: 'suggestion', name: 'Try different keywords or check spelling', lat: null, lon: null });
      }
    }
    
    this.displaySuggestions(suggestions);
  }

  async searchWithFallback(query) {
    const allResults = [];
    
    // API 1: Nominatim OpenStreetMap (Primary)
    try {
      const nominatimResponse = await Promise.race([
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=15&addressdetails=1&countrycodes=in`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
      
      if (nominatimResponse.ok) {
        const data = await nominatimResponse.json();
        allResults.push(...data.map(item => ({
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
          source: 'OSM'
        })));
      }
    } catch (e) {}
    
    // API 2: Global search without country restriction for international queries
    if (allResults.length < 5) {
      try {
        const globalResponse = await Promise.race([
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        
        if (globalResponse.ok) {
          const data = await globalResponse.json();
          allResults.push(...data.map(item => ({
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
            source: 'Global'
          })));
        }
      } catch (e) {}
    }
    
    // Remove duplicates and sort by relevance
    const uniqueResults = [];
    const seen = new Set();
    
    allResults.forEach(result => {
      const key = `${result.lat},${result.lon}`;
      if (!seen.has(key) && result.display_name) {
        seen.add(key);
        uniqueResults.push(result);
      }
    });
    
    // Sort by relevance (exact matches first, then partial matches)
    return uniqueResults.sort((a, b) => {
      const aName = a.display_name.toLowerCase();
      const bName = b.display_name.toLowerCase();
      const queryLower = query.toLowerCase();
      
      const aExact = aName.includes(queryLower) ? 0 : 1;
      const bExact = bName.includes(queryLower) ? 0 : 1;
      
      return aExact - bExact;
    });
  }

  displaySuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    this.currentSuggestions = suggestions.filter(s => s.type === 'suggestion');
    
    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }
    
    suggestionsDiv.innerHTML = suggestions.map((item) => {
      if (item.type === 'category') {
        return `<div class="suggestion-category">${item.name}</div>`;
      } else {
        const safeName = item.name.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const lat = item.lat || null;
        const lon = item.lon || item.lng || null;
        
        // Don't show action buttons for non-actionable items
        if (!lat || !lon) {
          return `
            <div class="suggestion-item" style="opacity: 0.6; cursor: default;">
              <div class="suggestion-text">${item.name}</div>
            </div>
          `;
        }
        
        return `
          <div class="suggestion-item">
            <div class="suggestion-text">${item.name}</div>
            <div class="suggestion-actions">
              <button class="suggestion-btn find" onclick="window.searchManager.selectSuggestion('${safeName}', ${lat}, ${lon})" title="Find & Center Map">
                <span class="material-icons" style="font-size: 14px;">search</span>
              </button>
              <button class="suggestion-btn add" onclick="window.searchManager.addSuggestionAsStop('${safeName}', ${lat}, ${lon})" title="Add as Tour Stop">
                <span class="material-icons" style="font-size: 14px;">add_location</span>
              </button>
            </div>
          </div>
        `;
      }
    }).join('');
    
    suggestionsDiv.style.display = 'block';
  }

  hideSuggestions() {
    document.getElementById('searchSuggestions').style.display = 'none';
    this.currentSuggestions = [];
  }

  selectSuggestion(name, lat, lon) {
    this.hideSuggestions();
    
    if (lat && lon && window.mapManager) {
      const latlng = [parseFloat(lat), parseFloat(lon)];
      window.mapManager.getMap().setView(latlng, 13);
      
      if (window.searchMarker) {
        window.mapManager.getMap().removeLayer(window.searchMarker);
      }
      
      window.searchMarker = L.marker(latlng, {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(window.mapManager.getMap());
      
      const locationName = name.split(',')[0];
      window.searchMarker.bindPopup(`
        <div style="text-align: center;">
          <strong>📍 ${locationName}</strong><br>
          <small>${name}</small><br><br>
          <button onclick="window.searchManager.addFoundLocationAsStop('${locationName.replace(/'/g, "\\'")}')"
                  style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
            ➕ Add as Tour Stop
          </button>
        </div>
      `).openPopup();
      
      if (window.chatManager) {
        window.chatManager.addMessage(`Found ${locationName}! Click the blue marker to add it as a tour stop.`, 'ai');
      }
      document.getElementById('startLocation').value = '';
    }
  }

  addSuggestionAsStop(name, lat, lon) {
    if (lat && lon && lat !== 'null' && lon !== 'null' && window.tourManager) {
      const latlng = { lat: parseFloat(lat), lng: parseFloat(lon) };
      const locationName = name.split(',')[0];
      
      window.tourManager.addTourStop(latlng, locationName);
      if (window.chatManager) {
        window.chatManager.addMessage(`Added ${locationName} as tour stop #${window.tourManager.getTourStops().length}! 🎉`, 'ai');
      }
      
      document.getElementById('startLocation').value = '';
      this.hideSuggestions();
      
      if (window.mapManager) {
        window.mapManager.getMap().setView([latlng.lat, latlng.lng], 12);
      }
    }
  }

  navigateSuggestions(direction) {
    // Implementation for keyboard navigation through suggestions
  }

  async quickAddLocation(locationName) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`);
      const data = await response.json();
      
      if (data.length > 0 && window.tourManager) {
        const result = data[0];
        const latlng = {lat: parseFloat(result.lat), lng: parseFloat(result.lon)};
        const stopName = locationName.split(',')[0];
        
        window.tourManager.addTourStop(latlng, stopName);
        
        if (window.chatManager) {
          window.chatManager.addMessage(`✅ Added ${stopName} to your journey!`, 'ai');
        }
      }
    } catch (error) {
      if (window.chatManager) {
        window.chatManager.addMessage(`❌ Couldn't add ${locationName}. Try searching manually.`, 'ai');
      }
    }
  }
}

// Initialize search manager
window.searchManager = new SearchManager();