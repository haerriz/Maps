# Haerriz Trip Planner

AI-Powered Global Travel Route Optimizer with offline capabilities.

## Features

- 🗺️ Interactive map interface with multiple tile layers
- 📱 Progressive Web App (PWA) with offline support
- 🚗 Multi-modal transport planning (driving, walking, cycling, transit)
- 🚦 Real-time traffic integration
- 🌤️ Weather information for destinations
- 💰 Multi-currency support with real-time exchange rates
- 🧭 GPS navigation with turn-by-turn directions
- 📤 Export/import trip plans
- 🎯 Drag-and-drop route optimization

## Project Structure

```
Maps/
├── assets/
│   ├── css/
│   │   └── styles.css          # Main stylesheet
│   ├── js/
│   │   ├── app.js              # Core application logic
│   │   └── utils.js            # Utility functions
│   ├── images/                 # Image assets
│   └── icons/                  # Icon files
├── config/
│   └── app.config.js           # Application configuration
├── docs/
│   └── README.md               # This file
├── index.html                  # Main application file
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker for offline support
└── README.md                   # Project overview
```

## Installation

1. Clone or download the project
2. Serve the files through a web server (required for PWA features)
3. Open `index.html` in a modern web browser

## Usage

1. **Add Destinations**: Click on the map or use the search box
2. **Plan Route**: The app automatically optimizes your route
3. **Choose Transport**: Select from driving, walking, cycling, or transit
4. **Start Journey**: Begin GPS navigation with real-time directions

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Leaflet.js with OpenStreetMap
- **Routing**: OSRM (Open Source Routing Machine)
- **PWA**: Service Worker, Web App Manifest
- **APIs**: Nominatim, Overpass, Weather APIs

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions, please create an issue on GitHub.