/**
 * Background Sync Manager
 * Handles background synchronization for offline audio downloads
 */

interface PendingDownload {
  episodeId: string;
  episodeData: any; // Episode data to retry
  timestamp: number;
}

class BackgroundSyncManager {
  private syncTag = 'offline-audio-sync'
  private pendingDownloadsKey = 'cro-cafe-pending-downloads'

  constructor() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      this.registerSyncHandlers()
    }
  }

  /**
   * Register sync event handlers
   */
  private async registerSyncHandlers() {
    try {
      const registration = await navigator.serviceWorker.ready

      // Check if Background Sync is supported
      if ('sync' in registration) {
        console.log('Background Sync API is supported')
      } else {
        console.log('Background Sync API is not supported')
      }
    } catch (error) {
      console.error('Failed to register sync handlers:', error)
    }
  }

  /**
   * Add a download to the sync queue
   */
  async queueDownload(episode: any): Promise<void> {
    // Get existing pending downloads
    const pending = this.getPendingDownloads()

    // Add new download if not already queued
    if (!pending.find(p => p.episodeId === episode.id)) {
      pending.push({
        episodeId: episode.id,
        episodeData: episode,
        timestamp: Date.now()
      })

      // Save to localStorage
      localStorage.setItem(this.pendingDownloadsKey, JSON.stringify(pending))
    }

    // Request background sync
    await this.requestBackgroundSync()
  }

  /**
   * Remove a download from the sync queue
   */
  removeFromQueue(episodeId: string): void {
    const pending = this.getPendingDownloads()
    const filtered = pending.filter(p => p.episodeId !== episodeId)
    localStorage.setItem(this.pendingDownloadsKey, JSON.stringify(filtered))
  }

  /**
   * Get all pending downloads
   */
  getPendingDownloads(): PendingDownload[] {
    try {
      const data = localStorage.getItem(this.pendingDownloadsKey)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  /**
   * Request a background sync
   */
  private async requestBackgroundSync(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready

      if ('sync' in registration) {
        await (registration as any).sync.register(this.syncTag)
        console.log('Background sync registered')
      } else {
        // Fallback: Try to download immediately if sync not supported
        console.log('Background sync not supported, attempting immediate download')
        this.processPendingDownloads()
      }
    } catch (error) {
      console.error('Failed to register background sync:', error)
      // Fallback: Try to download immediately
      this.processPendingDownloads()
    }
  }

  /**
   * Process all pending downloads
   */
  async processPendingDownloads(): Promise<void> {
    const pending = this.getPendingDownloads()

    if (pending.length === 0) {return}

    console.log(`Processing ${pending.length} pending downloads`)

    // Import offline audio manager dynamically to avoid circular dependencies
    const { offlineAudioManager } = await import('./offlineAudioManager')

    for (const item of pending) {
      try {
        // Check if already downloaded
        const isOffline = await offlineAudioManager.isEpisodeOffline(item.episodeId)

        if (!isOffline) {
          console.log(`Attempting to download: ${item.episodeData.title}`)
          await offlineAudioManager.downloadEpisode(item.episodeData)
        }

        // Remove from queue on success
        this.removeFromQueue(item.episodeId)
      } catch (error) {
        console.error(`Failed to download episode ${item.episodeId}:`, error)

        // Keep in queue for retry, but check if too old (> 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        if (item.timestamp < sevenDaysAgo) {
          console.log(`Removing stale download: ${item.episodeId}`)
          this.removeFromQueue(item.episodeId)
        }
      }
    }
  }

  /**
   * Handle visibility change to resume downloads
   */
  handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Check for pending downloads when app becomes visible
      const pending = this.getPendingDownloads()
      if (pending.length > 0) {
        console.log('App visible, checking pending downloads')
        this.processPendingDownloads()
      }
    }
  }

  /**
   * Handle online event to resume downloads
   */
  handleOnline(): void {
    console.log('Network connection restored, checking pending downloads')
    this.processPendingDownloads()
  }
}

// Create singleton instance
export const backgroundSyncManager = new BackgroundSyncManager()

// Set up event listeners
if (typeof window !== 'undefined') {
  // Resume downloads when app becomes visible
  document.addEventListener('visibilitychange', () => {
    backgroundSyncManager.handleVisibilityChange()
  })

  // Resume downloads when network comes back online
  window.addEventListener('online', () => {
    backgroundSyncManager.handleOnline()
  })
}