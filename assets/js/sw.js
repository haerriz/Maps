// Service Worker for offline functionality
const CACHE_NAME = 'haerriz-maps-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/base.css',
  '/assets/css/desktop.css',
  '/assets/css/tablet.css',
  '/assets/css/mobile.css',
  '/assets/css/chat.css',
  '/assets/js/app-manager.js',
  '/assets/js/map-manager.js',
  '/assets/js/tour-manager.js',
  '/assets/js/chat-manager.js',
  '/assets/js/search-manager.js',
  '/assets/js/traffic-manager.js',
  '/assets/js/weather-manager.js',
  '/assets/js/ui-manager.js',
  '/assets/js/utils.js',
  '/assets/icons/favicon.svg',
  '/favicon.ico',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});