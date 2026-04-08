// app.js — Legacy entry point (NOT loaded by index.html)
//
// Fix #1: This file previously contained a second L.map('map') initialisation
// that conflicted with MapManager (map-manager.js), its own tourStops/markers
// globals that shadowed TourManager's state, and a raw map.click handler using
// prompt() that clashed with MapManager's handler.
//
// All map, tour, and service-worker logic is now handled by the modular
// managers loaded in index.html:
//   - map-manager.js    → MapManager  (map init, markers, drawRoute)
//   - tour-manager.js   → TourManager (stop list, route calculation)
//   - app-manager.js    → AppManager  (service worker, offline detection)
//
// This file is kept for reference only. Do not re-add it to index.html.