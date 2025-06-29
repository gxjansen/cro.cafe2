/**
 * Service Worker Background Sync Handler
 * Add this to your existing service worker or include it as a module
 */

// Handle sync events
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sync event received:', event.tag)

  if (event.tag === 'offline-audio-sync') {
    event.waitUntil(handleOfflineAudioSync())
  }
})

// Handle offline audio sync
async function handleOfflineAudioSync() {
  console.log('Service Worker: Processing offline audio sync')

  try {
    // Send message to all clients to process pending downloads
    const clients = await self.clients.matchAll({ type: 'window' })

    for (const client of clients) {
      client.postMessage({
        type: 'PROCESS_PENDING_DOWNLOADS',
        timestamp: Date.now()
      })
    }

    return Promise.resolve()
  } catch (error) {
    console.error('Service Worker: Sync failed:', error)
    return Promise.reject(error)
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Optional: Periodic background sync for checking downloads
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-offline-downloads') {
      event.waitUntil(checkOfflineDownloads())
    }
  })
}

async function checkOfflineDownloads() {
  console.log('Service Worker: Checking offline downloads periodically')

  // Send message to clients to check pending downloads
  const clients = await self.clients.matchAll({ type: 'window' })

  for (const client of clients) {
    client.postMessage({
      type: 'CHECK_PENDING_DOWNLOADS',
      timestamp: Date.now()
    })
  }
}