const CACHE_NAME = 'total-eng-address-v3-5-4';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './robots.txt',
  './js/app.js',
  './data/sites.json',
  './img/logo.png',
  './img/favicon-32.png',
  './img/icon-180.png',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )),
      self.clients.claim()
    ])
  );
});

async function cacheResponse(request, response) {
  if (!response || !response.ok || response.type !== 'basic') {
    return response;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    return cacheResponse(request, response);
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (fallbackUrl) return caches.match(fallbackUrl);
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const response = await fetch(request);
  return cacheResponse(request, response);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  if (url.pathname.endsWith('/data/sites.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
