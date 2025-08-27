// Utility functions
function clearTour() {
  if (confirm('Are you sure you want to clear all tour stops?')) {
    markers.forEach(marker => map.removeLayer(marker));
    if (routeLine) map.removeLayer(routeLine);
    
    tourStops = [];
    markers = [];
    routeLine = null;
    
    updateStopsList();
  }
}

function exportTour() {
  if (tourStops.length === 0) {
    alert('Add some tour stops first!');
    return;
  }
  
  const tourData = {
    title: 'My Tour Plan',
    created: new Date().toISOString(),
    stops: tourStops.map((stop, index) => ({
      order: index + 1,
      name: stop.name,
      latitude: stop.latlng.lat,
      longitude: stop.latlng.lng
    }))
  };
  
  const dataStr = JSON.stringify(tourData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tour-plan.json';
  link.click();
}

function useMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      map.setView([lat, lng], 15);
      
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup('Your current location').openPopup();
    });
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}

function startJourney() {
  if (tourStops.length < 2) {
    alert('Add at least 2 stops to start your journey!');
    return;
  }
  alert('Journey started! This would begin GPS navigation.');
}