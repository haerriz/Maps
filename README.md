# 🗺️ Haerriz Maps - AI-Powered Trip Planner

[![Live Site](https://img.shields.io/badge/Live%20Site-maps.haerriz.com-blue?style=for-the-badge)](https://maps.haerriz.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green?style=for-the-badge)](https://maps.haerriz.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> **Free AI-powered trip planner and route optimizer with offline support for 200+ countries**

## ✨ Features

### 🤖 AI-Powered Planning
- **Smart Route Optimization** - AI analyzes traffic, weather, and preferences
- **Multi-Modal Transport** - Driving, walking, cycling, public transit
- **Real-Time Traffic** - Live traffic updates every 1.5 seconds
- **Weather Integration** - Weather forecasts for your destinations

### 🗺️ Interactive Mapping
- **Click-to-Add Stops** - Simple map interaction for route planning
- **Drag & Drop** - Reorder stops by dragging
- **Live Preview** - See routes update in real-time
- **Offline Maps** - Works without internet connection

### 🚀 Smart Features
- **AI Travel Assistant** - Chat with AI for travel recommendations
- **Quick Add Locations** - Pre-populated popular destinations
- **Export Tours** - Save and share your itineraries
- **Currency Conversion** - Automatic currency calculations
- **Fuel Cost Calculator** - Estimate travel costs

### 📱 Progressive Web App
- **Offline Support** - Service worker for offline functionality
- **Mobile Optimized** - Responsive design for all devices
- **App-Like Experience** - Install as native app
- **Fast Loading** - Optimized performance

## 🚀 Quick Start

### Live Demo
Visit **[maps.haerriz.com](https://maps.haerriz.com/)** to start planning your trip instantly!

### Local Development
```bash
# Clone the repository
git clone https://github.com/haerriz/Maps.git

# Navigate to project directory
cd Maps

# Serve locally (Python)
python -m http.server 8000

# Or use Node.js
npx serve .

# Open http://localhost:8000
```

## 🏗️ Architecture

### Modular JavaScript Structure
```
assets/js/
├── app-manager.js      # Main app coordinator & service worker
├── map-manager.js      # Leaflet map integration
├── tour-manager.js     # Route planning & optimization
├── chat-manager.js     # AI assistant functionality
├── search-manager.js   # Location search & geocoding
├── traffic-manager.js  # Real-time traffic integration
├── weather-manager.js  # Weather API integration
├── ui-manager.js       # User interface management
└── utils.js           # Utility functions
```

### Responsive CSS Architecture
```
assets/css/
├── base.css           # Common styles & variables
├── desktop.css        # Desktop styles (1024px+)
├── tablet.css         # Tablet styles (768px-1023px)
├── mobile.css         # Mobile styles (up to 767px)
└── chat.css          # AI chat component styles
```

## 🛠️ Technologies

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Mapping**: Leaflet.js with OpenStreetMap
- **Routing**: OSRM (Open Source Routing Machine)
- **Geocoding**: Nominatim API
- **Weather**: OpenWeatherMap API
- **PWA**: Service Worker, Web App Manifest
- **Styling**: Google Material Design, CSS Grid/Flexbox

## 🌍 Supported Features

### Geographic Coverage
- **200+ Countries** - Worldwide route planning
- **Multi-Language** - English, Spanish, French, German, Hindi, Chinese, Japanese
- **Local Transport** - Public transit integration where available
- **Currency Support** - Automatic conversion for 150+ currencies

### Transport Modes
- 🚗 **Driving** - Car routes with traffic optimization
- 🚶 **Walking** - Pedestrian-friendly paths
- 🚴 **Cycling** - Bike lanes and cycling routes
- 🚌 **Public Transit** - Buses, trains, metro systems
- 🔄 **Mixed Mode** - Combination of transport types

## 📊 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 2.5s
- **Offline Ready**: Full functionality without internet
- **Mobile Optimized**: Touch-friendly interface

## 🔧 Configuration

### Environment Setup
```javascript
// config/app.config.js
const CONFIG = {
  MAP_PROVIDER: 'OpenStreetMap',
  ROUTING_SERVICE: 'OSRM',
  WEATHER_API: 'OpenWeatherMap',
  GEOCODING_SERVICE: 'Nominatim'
};
```

### API Keys (Optional)
For enhanced features, add API keys:
- Weather forecasts: OpenWeatherMap API
- Enhanced geocoding: MapBox API
- Traffic data: HERE API

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Leaflet** - Interactive map library
- **OpenStreetMap** - Map data and tiles
- **OSRM** - Routing engine
- **Google Material Design** - UI components and icons
- **Nominatim** - Geocoding service

## 📞 Support

- **Website**: [maps.haerriz.com](https://maps.haerriz.com/)
- **Issues**: [GitHub Issues](https://github.com/haerriz/Maps/issues)
- **Email**: haerriz@haerriz.com
- **Twitter**: [@HaerrizTech](https://twitter.com/HaerrizTech)

---

<div align="center">
  <strong>Made with ❤️ by Haerriz Technologies</strong><br>
  <em>Empowering travelers with AI-powered route optimization</em>
</div>