// Main application JavaScript
// Initialize map
const map = L.map('map', {
  zoomControl: false,
  attributionControl: false,
  preferCanvas: true,
  maxZoom: 20,
  minZoom: 3
}).setView([20.5937, 78.9629], 5);

// Add tile layer
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19,
  useCache: true,
  crossOrigin: true
});

streetLayer.addTo(map);

// Global variables
let tourStops = [];
let markers = [];
let routeLine = null;

// Basic functions
function addTourStop(latlng, name) {
  const marker = L.marker(latlng).addTo(map);
  marker.bindPopup(`<strong>${name}</strong>`);
  
  const stop = { latlng, name, marker };
  tourStops.push(stop);
  markers.push(marker);
  
  updateStopsList();
}

function updateStopsList() {
  const stopsList = document.getElementById('stopsList');
  if (tourStops.length === 0) {
    stopsList.innerHTML = '<p style="color: #6c757d; text-align: center;">Click on the map to add stops</p>';
    return;
  }
  
  stopsList.innerHTML = tourStops.map((stop, index) => `
    <div class="stop-item">
      <span>${index + 1}. ${stop.name}</span>
      <button onclick="removeStop(${index})">Remove</button>
    </div>
  `).join('');
}

function removeStop(index) {
  map.removeLayer(markers[index]);
  tourStops.splice(index, 1);
  markers.splice(index, 1);
  updateStopsList();
}

// Map click handler
map.on('click', function(e) {
  const name = prompt('Enter a name for this stop:');
  if (name) {
    addTourStop(e.latlng, name);
  }
});

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(error => console.log('SW registration failed'));
  });
}