# Modular JavaScript Structure

The large script in index.html has been refactored into separate, manageable modules for better organization and maintainability.

## Module Structure

### Core Modules

1. **map-manager.js** - Map initialization, layers, and 3D features
   - Handles Leaflet map setup
   - Manages tile layers (street, satellite, terrain, navigation)
   - 3D navigation controls and effects
   - Offline tile caching

2. **tour-manager.js** - Tour stops and route planning
   - Tour stop management (add, remove, reorder)
   - Route calculation and optimization
   - Drag and drop functionality
   - Real-time route drawing

3. **chat-manager.js** - AI chat functionality
   - AI API integration with fallbacks
   - Local response generation
   - Chat UI management
   - Message handling

4. **search-manager.js** - Location search and suggestions
   - Nominatim API integration
   - Search suggestions and autocomplete
   - Popular destinations
   - Location geocoding

5. **traffic-manager.js** - Traffic visualization
   - Real-time traffic simulation
   - Traffic-colored route segments
   - Dynamic traffic updates
   - Road data integration

6. **weather-manager.js** - Weather information
   - Weather API integration
   - Weather data display
   - Location-based weather
   - Fallback weather simulation

7. **ui-manager.js** - UI interactions and controls
   - Mobile view toggle
   - Travel mode management
   - GPS location handling
   - Global function wrappers

### Configuration

- **app.config.js** - Application configuration and settings

### Utilities

- **utils.js** - Utility functions (legacy)
- **sw.js** - Service worker for offline functionality

## Benefits of Modular Structure

1. **Better Organization** - Each module has a specific responsibility
2. **Easier Maintenance** - Changes are isolated to relevant modules
3. **Improved Debugging** - Easier to locate and fix issues
4. **Code Reusability** - Modules can be reused or replaced independently
5. **Better Performance** - Modules can be loaded as needed
6. **Team Collaboration** - Multiple developers can work on different modules

## Global Access

All modules are accessible through the global window object:
- `window.mapManager`
- `window.tourManager`
- `window.chatManager`
- `window.searchManager`
- `window.trafficManager`
- `window.weatherManager`
- `window.uiManager`

## Backward Compatibility

Global functions are maintained for backward compatibility through wrapper functions in ui-manager.js.

## Loading Order

Modules are loaded in the correct dependency order in index.html:
1. External libraries (Leaflet)
2. Configuration
3. Core modules
4. Utility modules