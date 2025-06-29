/**
 * Enhanced Service Worker for Dual Experience PWA
 * Provides different caching strategies for PWA vs Browser contexts
 */

const CACHE_VERSION = 'v1.0.0'
const PWA_CACHE = `pwa-cache-${CACHE_VERSION}`
const BROWSER_CACHE = `browser-cache-${CACHE_VERSION}`
const AUDIO_CACHE = `audio-cache-${CACHE_VERSION}`
const IMAGES_CACHE = `images-cache-${CACHE_VERSION}`

// PWA-focused URLs (minimal, audio-focused)
const PWA_ESSENTIAL_URLS = [
  '/',
  '/offline.html',
  '/en/episodes/',
  '/search/',
  '/manifest.json'
]

// Browser-focused URLs (full experience)
const BROWSER_URLS = [
  '/',
  '/about/',
  '/en/subscribe/',
  '/privacy-policy/',
  '/en/guests/',
  '/search/'
]

// Detect if request is from PWA context
function isPWAContext(request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''
  const referrer = request.headers.get('referer') || ''

  // Check for PWA indicators
  const isStandalone = referrer.includes('android-app://') ||
                      userAgent.includes('wv') || // WebView
                      request.mode === 'navigate' &&
                      !request.headers.get('sec-fetch-dest')

  return isStandalone
}

// Install event - cache essential resources
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache PWA essentials
      caches.open(PWA_CACHE).then(cache => {
        return cache.addAll(PWA_ESSENTIAL_URLS)
      }),
      // Cache browser experience
      caches.open(BROWSER_CACHE).then(cache => {
        return cache.addAll(BROWSER_URLS)
      })
    ]).then(() => {
      console.log('✅ Dual experience SW installed')
      self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName =>
            cacheName.startsWith('pwa-cache-') ||
            cacheName.startsWith('browser-cache-') ||
            cacheName.startsWith('audio-cache-') ||
            cacheName.startsWith('images-cache-')
          )
          .filter(cacheName =>
            !cacheName.includes(CACHE_VERSION)
          )
          .map(cacheName => caches.delete(cacheName))
      )
    }).then(() => {
      console.log('✅ Dual experience SW activated')
      return self.clients.claim()
    })
  )
})

// Fetch event - smart caching strategy
self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {return}

  // Handle different resource types
  if (url.pathname.match(/\.(mp3|wav|ogg|m4a)$/)) {
    // Audio files - always cache first
    event.respondWith(handleAudioRequest(request))
  } else if (url.pathname.match(/\.(jpg|jpeg|png|webp|svg|ico)$/)) {
    // Images - cache first with fallback
    event.respondWith(handleImageRequest(request))
  } else if (url.pathname.includes('/episodes/') || url.pathname.includes('/guests/')) {
    // Content pages - network first for freshness
    event.respondWith(handleContentRequest(request))
  } else if (url.pathname.includes('/about') || url.pathname.includes('/subscribe')) {
    // Marketing pages - different strategy based on context
    event.respondWith(handleMarketingRequest(request))
  } else {
    // Navigation and other resources
    event.respondWith(handleNavigationRequest(request))
  }
})

// Audio request handler
async function handleAudioRequest(request) {
  const cache = await caches.open(AUDIO_CACHE)

  try {
    // Try cache first
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {return cachedResponse}

    // Fetch and cache
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.log('Audio fetch failed:', error)
    return new Response('Audio unavailable offline', { status: 503 })
  }
}

// Image request handler
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGES_CACHE)

  try {
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {return cachedResponse}

    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return placeholder image for PWA context
    return caches.match('/images/placeholder-episode.jpg') ||
           new Response('Image unavailable', { status: 503 })
  }
}

// Content request handler (episodes, guests)
async function handleContentRequest(request) {
  const isPWA = isPWAContext(request)
  const cacheName = isPWA ? PWA_CACHE : BROWSER_CACHE
  const cache = await caches.open(cacheName)

  try {
    // Network first with 3s timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(request, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {return cachedResponse}

    // Ultimate fallback
    return caches.match('/offline.html') ||
           new Response('Content unavailable offline', {
             status: 503,
             headers: { 'Content-Type': 'text/html' }
           })
  }
}

// Marketing request handler
async function handleMarketingRequest(request) {
  const isPWA = isPWAContext(request)

  // For PWA context, serve minimal version or redirect to core functionality
  if (isPWA) {
    const url = new URL(request.url)
    if (url.pathname.includes('/about')) {
      // Redirect to episodes in PWA mode
      return Response.redirect('/en/episodes/', 302)
    }
    if (url.pathname.includes('/subscribe')) {
      // Minimal subscribe experience
      return handleContentRequest(request)
    }
  }

  // Full browser experience
  return handleContentRequest(request)
}

// Navigation request handler
async function handleNavigationRequest(request) {
  const isPWA = isPWAContext(request)
  const cacheName = isPWA ? PWA_CACHE : BROWSER_CACHE

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Serve appropriate offline experience
    const cache = await caches.open(cacheName)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {return cachedResponse}

    // Fallback to offline page
    return caches.match('/offline.html') ||
           new Response('App unavailable offline', {
             status: 503,
             headers: { 'Content-Type': 'text/html' }
           })
  }
}

// Background sync for audio download
self.addEventListener('sync', event => {
  if (event.tag === 'audio-download') {
    event.waitUntil(downloadAudioForOffline())
  }
})

// Download popular episodes for offline listening
async function downloadAudioForOffline() {
  try {
    const cache = await caches.open(AUDIO_CACHE)

    // Get list of popular episodes (this would come from your API)
    const response = await fetch('/api/popular-episodes')
    if (!response.ok) {return}

    const episodes = await response.json()

    // Download audio files for top episodes
    const downloadPromises = episodes.slice(0, 5).map(async episode => {
      if (episode.audioUrl) {
        try {
          const audioResponse = await fetch(episode.audioUrl)
          if (audioResponse.ok) {
            await cache.put(episode.audioUrl, audioResponse)
            console.log(`Downloaded: ${episode.title}`)
          }
        } catch (error) {
          console.log(`Failed to download: ${episode.title}`, error)
        }
      }
    })

    await Promise.all(downloadPromises)
    console.log('✅ Background audio download complete')
  } catch (error) {
    console.log('Background audio download failed:', error)
  }
}

// Handle push notifications (future enhancement)
self.addEventListener('push', event => {
  if (!event.data) {return}

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/images/badge-icon.png',
    data: data.url,
    actions: [
      {
        action: 'listen',
        title: 'Listen Now',
        icon: '/images/play-icon.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'listen') {
    // Open to episode with audio ready
    event.waitUntil(
      clients.openWindow(event.notification.data)
    )
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats)
    })
  }
})

async function getCacheStats() {
  const cacheNames = await caches.keys()
  const stats = {}

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    stats[cacheName] = keys.length
  }

  return stats
}