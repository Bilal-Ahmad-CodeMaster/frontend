// public/sw.js
// Service Worker — caches first-aid GIFs for offline use

const CACHE_NAME = 'madad-animations-v1'

// Files to pre-cache on install
const PRECACHE_URLS = [
  '/assets/animations/cpr.gif',
  '/assets/animations/bleeding.gif',
  '/assets/animations/choking.gif',
  '/assets/animations/burns.gif',
  '/assets/animations/fracture.gif',
]

// ── INSTALL: pre-cache all GIFs ───────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching first-aid animations')
      // Use individual adds so one missing file doesn't break all others
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => console.warn(`[SW] Could not cache ${url}:`, err))
        )
      )
    })
  )
  self.skipWaiting()
})

// ── ACTIVATE: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── FETCH: cache-first for GIFs, network-first for everything else ────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Cache-first strategy for animation GIFs
  if (url.pathname.startsWith('/assets/animations/') && url.pathname.endsWith('.gif')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          console.log('[SW] Serving from cache:', url.pathname)
          return cached
        }
        // Not in cache — fetch and store
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
      })
    )
    return
  }

  // Network-first for everything else (API calls, pages)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})