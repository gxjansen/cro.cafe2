/**
 * Offline Audio Manager
 * Handles downloading, storing, and managing offline audio episodes
 * Uses IndexedDB for storage to avoid service worker caching conflicts
 */

import type { Episode } from '../stores/audioPlayerStore'

interface OfflineEpisode extends Episode {
  downloadedAt: number;
  fileSize: number;
  blobUrl?: string;
}

interface DownloadProgress {
  episodeId: string;
  progress: number;
  bytesDownloaded: number;
  totalBytes: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

class OfflineAudioManager {
  private dbName = 'cro-cafe-offline-audio'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private downloadQueue: Map<string, AbortController> = new Map()
  private progressCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map()

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeDB()
    }
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized for offline audio')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store for episode metadata
        if (!db.objectStoreNames.contains('episodes')) {
          const episodeStore = db.createObjectStore('episodes', { keyPath: 'id' })
          episodeStore.createIndex('downloadedAt', 'downloadedAt', { unique: false })
        }

        // Store for audio blobs
        if (!db.objectStoreNames.contains('audioBlobs')) {
          db.createObjectStore('audioBlobs', { keyPath: 'episodeId' })
        }
      }
    })
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDB()
    }
    if (!this.db) {
      throw new Error('Failed to initialize database')
    }
    return this.db
  }

  /**
   * Download an episode for offline playback
   */
  async downloadEpisode(
    episode: Episode,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    const db = await this.ensureDB()

    // Check if already downloading
    if (this.downloadQueue.has(episode.id)) {
      throw new Error('Episode is already being downloaded')
    }

    // Create abort controller for cancellation
    const abortController = new AbortController()
    this.downloadQueue.set(episode.id, abortController)

    if (onProgress) {
      this.progressCallbacks.set(episode.id, onProgress)
    }

    try {
      // Update progress: starting
      this.updateProgress(episode.id, {
        episodeId: episode.id,
        progress: 0,
        bytesDownloaded: 0,
        totalBytes: 0,
        status: 'downloading'
      })

      // Fetch the audio file with progress tracking
      const response = await fetch(episode.audioUrl, {
        signal: abortController.signal,
        // Include credentials if needed for Transistor.fm
        credentials: 'omit'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`)
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0')
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('No response body available')
      }

      // Read the response in chunks
      const chunks: Uint8Array[] = []
      let bytesDownloaded = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) {break}

        if (value) {
          chunks.push(value)
          bytesDownloaded += value.length

          // Update progress
          const progress = contentLength > 0 ? (bytesDownloaded / contentLength) * 100 : 0
          this.updateProgress(episode.id, {
            episodeId: episode.id,
            progress,
            bytesDownloaded,
            totalBytes: contentLength,
            status: 'downloading'
          })
        }
      }

      // Combine chunks into a single blob
      const blob = new Blob(chunks, { type: 'audio/mpeg' })

      // Store in IndexedDB
      const transaction = db.transaction(['episodes', 'audioBlobs'], 'readwrite')

      // Store episode metadata
      const episodeData: OfflineEpisode = {
        ...episode,
        downloadedAt: Date.now(),
        fileSize: blob.size
      }

      await transaction.objectStore('episodes').put(episodeData)

      // Store audio blob
      await transaction.objectStore('audioBlobs').put({
        episodeId: episode.id,
        blob: blob
      })

      await transaction.complete

      // Update progress: completed
      this.updateProgress(episode.id, {
        episodeId: episode.id,
        progress: 100,
        bytesDownloaded: blob.size,
        totalBytes: blob.size,
        status: 'completed'
      })

      // Cleanup
      this.downloadQueue.delete(episode.id)
      this.progressCallbacks.delete(episode.id)

    } catch (error) {
      // Update progress: failed
      this.updateProgress(episode.id, {
        episodeId: episode.id,
        progress: 0,
        bytesDownloaded: 0,
        totalBytes: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Download failed'
      })

      // Cleanup
      this.downloadQueue.delete(episode.id)
      this.progressCallbacks.delete(episode.id)

      throw error
    }
  }

  /**
   * Cancel an ongoing download
   */
  cancelDownload(episodeId: string): void {
    const controller = this.downloadQueue.get(episodeId)
    if (controller) {
      controller.abort()
      this.downloadQueue.delete(episodeId)

      this.updateProgress(episodeId, {
        episodeId,
        progress: 0,
        bytesDownloaded: 0,
        totalBytes: 0,
        status: 'cancelled'
      })

      this.progressCallbacks.delete(episodeId)
    }
  }

  /**
   * Update download progress
   */
  private updateProgress(episodeId: string, progress: DownloadProgress): void {
    const callback = this.progressCallbacks.get(episodeId)
    if (callback) {
      callback(progress)
    }

    // Dispatch custom event for global listeners
    window.dispatchEvent(new CustomEvent('offline-audio-progress', {
      detail: progress
    }))
  }

  /**
   * Get offline episode by ID
   */
  async getOfflineEpisode(episodeId: string): Promise<OfflineEpisode | null> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['episodes'], 'readonly')
    const episode = await transaction.objectStore('episodes').get(episodeId)
    return episode || null
  }

  /**
   * Get audio blob URL for offline playback
   */
  async getOfflineAudioUrl(episodeId: string): Promise<string | null> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['audioBlobs'], 'readonly')
    const result = await transaction.objectStore('audioBlobs').get(episodeId)

    if (result && result.blob) {
      // Create a blob URL for the audio element
      return URL.createObjectURL(result.blob)
    }

    return null
  }

  /**
   * Get all offline episodes
   */
  async getAllOfflineEpisodes(): Promise<OfflineEpisode[]> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['episodes'], 'readonly')
    const episodes = await transaction.objectStore('episodes').getAll()

    // Sort by download date, newest first
    return episodes.sort((a, b) => b.downloadedAt - a.downloadedAt)
  }

  /**
   * Delete an offline episode
   */
  async deleteOfflineEpisode(episodeId: string): Promise<void> {
    const db = await this.ensureDB()

    // Cancel download if in progress
    this.cancelDownload(episodeId)

    // Delete from both stores
    const transaction = db.transaction(['episodes', 'audioBlobs'], 'readwrite')
    await transaction.objectStore('episodes').delete(episodeId)
    await transaction.objectStore('audioBlobs').delete(episodeId)
    await transaction.complete

    // Dispatch event
    window.dispatchEvent(new CustomEvent('offline-audio-deleted', {
      detail: { episodeId }
    }))
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalSize: number;
    episodeCount: number;
    episodes: Array<{
      id: string;
      title: string;
      fileSize: number;
      downloadedAt: number;
    }>;
  }> {
    const db = await this.ensureDB()
    const episodes = await this.getAllOfflineEpisodes()

    const episodeStats = episodes.map(ep => ({
      id: ep.id,
      title: ep.title,
      fileSize: ep.fileSize,
      downloadedAt: ep.downloadedAt
    }))

    const totalSize = episodeStats.reduce((sum, ep) => sum + ep.fileSize, 0)

    return {
      totalSize,
      episodeCount: episodes.length,
      episodes: episodeStats
    }
  }

  /**
   * Check if episode is available offline
   */
  async isEpisodeOffline(episodeId: string): Promise<boolean> {
    const episode = await this.getOfflineEpisode(episodeId)
    return episode !== null
  }

  /**
   * Check if episode is currently downloading
   */
  isDownloading(episodeId: string): boolean {
    return this.downloadQueue.has(episodeId)
  }

  /**
   * Get available storage quota
   */
  async getStorageQuota(): Promise<{
    usage: number;
    quota: number;
    percentUsed: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentUsed = quota > 0 ? (usage / quota) * 100 : 0

      return { usage, quota, percentUsed }
    }

    // Fallback for browsers without storage estimate
    return { usage: 0, quota: 0, percentUsed: 0 }
  }

  /**
   * Clear all offline episodes
   */
  async clearAllOfflineEpisodes(): Promise<void> {
    const db = await this.ensureDB()

    // Cancel all downloads
    this.downloadQueue.forEach((controller, episodeId) => {
      this.cancelDownload(episodeId)
    })

    // Clear stores
    const transaction = db.transaction(['episodes', 'audioBlobs'], 'readwrite')
    await transaction.objectStore('episodes').clear()
    await transaction.objectStore('audioBlobs').clear()
    await transaction.complete

    // Dispatch event
    window.dispatchEvent(new CustomEvent('offline-audio-cleared'))
  }

  /**
   * Handle background sync for partial downloads
   */
  async resumePartialDownloads(): Promise<void> {
    // This would be implemented with Background Sync API
    // For now, we'll just check for incomplete downloads
    const episodes = await this.getAllOfflineEpisodes()

    for (const episode of episodes) {
      // Check if episode has incomplete download
      const blobData = await this.db?.transaction(['audioBlobs'], 'readonly')
        .objectStore('audioBlobs')
        .get(episode.id)

      if (!blobData || !blobData.blob) {
        // Re-download the episode
        console.log(`Resuming download for episode: ${episode.title}`)
        // Implementation would go here
      }
    }
  }
}

// Create singleton instance
export const offlineAudioManager = new OfflineAudioManager()

// Export types
export type { OfflineEpisode, DownloadProgress }