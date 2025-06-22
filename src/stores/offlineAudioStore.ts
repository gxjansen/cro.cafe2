import { atom, computed } from 'nanostores';
import { offlineAudioManager, type OfflineEpisode, type DownloadProgress } from '../lib/offlineAudioManager';
import type { Episode } from './audioPlayerStore';

export interface OfflineAudioState {
  offlineEpisodes: OfflineEpisode[];
  downloadProgress: Map<string, DownloadProgress>;
  totalStorageUsed: number;
  storageQuota: number;
  isInitialized: boolean;
}

// Initial state
const initialState: OfflineAudioState = {
  offlineEpisodes: [],
  downloadProgress: new Map(),
  totalStorageUsed: 0,
  storageQuota: 0,
  isInitialized: false,
};

// Main offline audio store
export const offlineAudioStore = atom<OfflineAudioState>(initialState);

// Computed values
export const offlineEpisodes = computed(offlineAudioStore, state => state.offlineEpisodes);
export const downloadProgress = computed(offlineAudioStore, state => state.downloadProgress);
export const totalStorageUsed = computed(offlineAudioStore, state => state.totalStorageUsed);
export const storageQuota = computed(offlineAudioStore, state => state.storageQuota);
export const storagePercentUsed = computed(offlineAudioStore, state => 
  state.storageQuota > 0 ? (state.totalStorageUsed / state.storageQuota) * 100 : 0
);

// Actions
export const offlineAudioActions = {
  /**
   * Initialize offline audio store
   */
  async initialize() {
    try {
      // Get all offline episodes
      const episodes = await offlineAudioManager.getAllOfflineEpisodes();
      
      // Get storage stats
      const stats = await offlineAudioManager.getStorageStats();
      const quota = await offlineAudioManager.getStorageQuota();
      
      offlineAudioStore.set({
        ...offlineAudioStore.get(),
        offlineEpisodes: episodes,
        totalStorageUsed: stats.totalSize,
        storageQuota: quota.quota,
        isInitialized: true
      });
    } catch (error) {
      console.error('Failed to initialize offline audio store:', error);
    }
  },

  /**
   * Download an episode for offline playback
   */
  async downloadEpisode(episode: Episode) {
    const state = offlineAudioStore.get();
    
    // Check if already offline
    const isOffline = state.offlineEpisodes.some(ep => ep.id === episode.id);
    if (isOffline) {
      console.log('Episode already available offline');
      return;
    }

    // Start download with progress tracking
    try {
      await offlineAudioManager.downloadEpisode(episode, (progress) => {
        const currentState = offlineAudioStore.get();
        const newProgress = new Map(currentState.downloadProgress);
        newProgress.set(episode.id, progress);
        
        offlineAudioStore.set({
          ...currentState,
          downloadProgress: newProgress
        });

        // If completed, refresh the episode list
        if (progress.status === 'completed') {
          offlineAudioActions.refreshOfflineEpisodes();
          
          // Remove from progress after a delay
          setTimeout(() => {
            const state = offlineAudioStore.get();
            const updatedProgress = new Map(state.downloadProgress);
            updatedProgress.delete(episode.id);
            offlineAudioStore.set({
              ...state,
              downloadProgress: updatedProgress
            });
          }, 2000);
        }
      });
    } catch (error) {
      console.error('Failed to download episode:', error);
      throw error;
    }
  },

  /**
   * Cancel an ongoing download
   */
  cancelDownload(episodeId: string) {
    offlineAudioManager.cancelDownload(episodeId);
    
    const state = offlineAudioStore.get();
    const newProgress = new Map(state.downloadProgress);
    newProgress.delete(episodeId);
    
    offlineAudioStore.set({
      ...state,
      downloadProgress: newProgress
    });
  },

  /**
   * Delete an offline episode
   */
  async deleteOfflineEpisode(episodeId: string) {
    try {
      await offlineAudioManager.deleteOfflineEpisode(episodeId);
      await offlineAudioActions.refreshOfflineEpisodes();
    } catch (error) {
      console.error('Failed to delete offline episode:', error);
      throw error;
    }
  },

  /**
   * Refresh the list of offline episodes
   */
  async refreshOfflineEpisodes() {
    try {
      const episodes = await offlineAudioManager.getAllOfflineEpisodes();
      const stats = await offlineAudioManager.getStorageStats();
      const quota = await offlineAudioManager.getStorageQuota();
      
      offlineAudioStore.set({
        ...offlineAudioStore.get(),
        offlineEpisodes: episodes,
        totalStorageUsed: stats.totalSize,
        storageQuota: quota.quota
      });
    } catch (error) {
      console.error('Failed to refresh offline episodes:', error);
    }
  },

  /**
   * Clear all offline episodes
   */
  async clearAllOfflineEpisodes() {
    try {
      await offlineAudioManager.clearAllOfflineEpisodes();
      
      offlineAudioStore.set({
        ...offlineAudioStore.get(),
        offlineEpisodes: [],
        downloadProgress: new Map(),
        totalStorageUsed: 0
      });
    } catch (error) {
      console.error('Failed to clear offline episodes:', error);
      throw error;
    }
  },

  /**
   * Check if an episode is available offline
   */
  async isEpisodeOffline(episodeId: string): Promise<boolean> {
    return await offlineAudioManager.isEpisodeOffline(episodeId);
  },

  /**
   * Check if an episode is currently downloading
   */
  isDownloading(episodeId: string): boolean {
    const state = offlineAudioStore.get();
    return state.downloadProgress.has(episodeId);
  },

  /**
   * Get download progress for an episode
   */
  getDownloadProgress(episodeId: string): DownloadProgress | undefined {
    const state = offlineAudioStore.get();
    return state.downloadProgress.get(episodeId);
  },

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// Initialize store when loaded
if (typeof window !== 'undefined') {
  // Initialize on load
  offlineAudioActions.initialize();
  
  // Listen for offline audio events
  window.addEventListener('offline-audio-deleted', () => {
    offlineAudioActions.refreshOfflineEpisodes();
  });
  
  window.addEventListener('offline-audio-cleared', () => {
    offlineAudioStore.set({
      ...offlineAudioStore.get(),
      offlineEpisodes: [],
      totalStorageUsed: 0
    });
  });
}