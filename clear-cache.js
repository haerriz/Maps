// Smart cache clearing - only run once
const CACHE_VERSION = '2025010201';
const CACHE_KEY = 'haerriz_cache_cleared';

// Check if cache was already cleared for this version
const cacheCleared = localStorage.getItem(CACHE_KEY);

if (cacheCleared !== CACHE_VERSION) {
  console.log('Clearing old caches...');
  
  // Clear service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
      }
    });
  }

  // Clear browser caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }

  // Mark cache as cleared for this version
  localStorage.setItem(CACHE_KEY, CACHE_VERSION);
  
  // Only reload if this is the first time clearing cache
  if (!cacheCleared) {
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  }
}