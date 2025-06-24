/**
 * Global Audio Manager - Maintains persistent audio element across page navigation
 * This creates a single audio element that lives outside the React component tree
 */

import type { Episode } from '../stores/audioPlayerStore';
import { offlineAudioManager } from './offlineAudioManager';

class GlobalAudioManager {
  private audio: HTMLAudioElement | null = null;
  private initialized = false;
  private currentEpisode: Episode | null = null;
  private boundEventHandlers: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check if we already have a global instance
      if ((window as any).__globalAudioManager) {
        console.log('🎵 Returning existing GlobalAudioManager instance');
        return (window as any).__globalAudioManager;
      }
      
      // Store this instance globally
      (window as any).__globalAudioManager = this;
      
      // Initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initialize());
      } else {
        this.initialize();
      }
    }
  }

  private initialize() {
    if (this.initialized) return;

    // Check if we have a persistent audio element on window
    if ((window as any).__persistentAudio) {
      console.log('🎵 Using existing window.__persistentAudio element');
      this.audio = (window as any).__persistentAudio;
    } else {
      console.log('🎵 Creating new persistent audio element');
      // Create a persistent audio element
      this.audio = document.createElement('audio');
      this.audio.id = 'global-persistent-audio';
      this.audio.preload = 'auto'; // Changed from 'metadata' to 'auto' for better buffering
      this.audio.style.display = 'none';
      
      // Set crossOrigin to handle CORS issues
      this.audio.crossOrigin = 'anonymous';
      
      // Store it on window to persist across view transitions
      (window as any).__persistentAudio = this.audio;
      
      // Add it to the body
      document.body.appendChild(this.audio);
    }

    // Add event listeners for audio events
    this.setupEventListeners();
    
    this.initialized = true;
    console.log('🎵 Global Audio Manager initialized');
    console.log('🎵 Audio element:', this.audio);
    console.log('🎵 Audio src:', this.audio.src);
    console.log('🎵 Audio paused:', this.audio.paused);
  }

  private setupEventListeners() {
    if (!this.audio) return;

    // Remove existing listeners to avoid duplicates
    this.removeEventListeners();

    // Store references to bound functions for cleanup
    this.boundEventHandlers = {
      ended: () => {
        console.log('🎵 Audio ended');
        window.dispatchEvent(new CustomEvent('audioEnded'));
      },
      timeupdate: () => {
        if (this.audio) {
          // Log every 4 seconds to debug the stopping issue
          if (Math.floor(this.audio.currentTime) === 4 && this.audio.currentTime < 4.1) {
            console.log('🔍 4-second mark reached:', {
              paused: this.audio.paused,
              currentTime: this.audio.currentTime,
              buffered: this.audio.buffered.length > 0 ? {
                start: this.audio.buffered.start(0),
                end: this.audio.buffered.end(0)
              } : 'No buffered ranges',
              readyState: this.audio.readyState,
              networkState: this.audio.networkState
            });
          }
          
          window.dispatchEvent(new CustomEvent('audioTimeUpdate', {
            detail: { currentTime: this.audio.currentTime }
          }));
        }
      },
      loadedmetadata: () => {
        if (this.audio) {
          console.log('🎵 Audio metadata loaded, duration:', this.audio.duration);
          window.dispatchEvent(new CustomEvent('audioDurationChange', {
            detail: { duration: this.audio.duration }
          }));
        }
      },
      play: () => {
        console.log('🎵 Audio play event');
        window.dispatchEvent(new CustomEvent('audioPlay'));
      },
      pause: () => {
        console.log('🎵 Audio pause event');
        console.log('🎵 Pause triggered - currentTime:', this.audio?.currentTime);
        console.log('🎵 Pause triggered - duration:', this.audio?.duration);
        console.log('🎵 Pause triggered - networkState:', this.audio?.networkState);
        console.log('🎵 Pause triggered - readyState:', this.audio?.readyState);
        console.log('🎵 Pause triggered - error:', this.audio?.error);
        // Log stack trace to see what triggered the pause
        console.trace('🎵 Pause stack trace');
        window.dispatchEvent(new CustomEvent('audioPause'));
      },
      loadstart: () => {
        console.log('🎵 Audio load start');
        window.dispatchEvent(new CustomEvent('audioLoadStart'));
      },
      canplay: () => {
        console.log('🎵 Audio can play');
        window.dispatchEvent(new CustomEvent('audioCanPlay'));
      },
      error: (e: any) => {
        console.error('🚨 Audio error:', e);
        window.dispatchEvent(new CustomEvent('audioError', { detail: e }));
      }
    };

    // Add event listeners
    this.audio.addEventListener('ended', this.boundEventHandlers.ended);
    this.audio.addEventListener('timeupdate', this.boundEventHandlers.timeupdate);
    this.audio.addEventListener('loadedmetadata', this.boundEventHandlers.loadedmetadata);
    this.audio.addEventListener('play', this.boundEventHandlers.play);
    this.audio.addEventListener('pause', this.boundEventHandlers.pause);
    this.audio.addEventListener('loadstart', this.boundEventHandlers.loadstart);
    this.audio.addEventListener('canplay', this.boundEventHandlers.canplay);
    this.audio.addEventListener('error', this.boundEventHandlers.error);
    
    // Add additional event listeners for debugging
    this.audio.addEventListener('stalled', () => {
      console.log('🚨 Audio stalled - network stalled while fetching media data');
      console.log('🚨 Current time:', this.audio?.currentTime);
      console.log('🚨 Buffered ranges:', this.audio?.buffered.length);
    });
    
    this.audio.addEventListener('suspend', () => {
      console.log('⚠️ Audio suspend - browser is intentionally not getting media data');
    });
    
    this.audio.addEventListener('waiting', () => {
      console.log('⏳ Audio waiting - playback stopped due to lack of data');
      console.log('⏳ Current time:', this.audio?.currentTime);
      console.log('⏳ Buffered:', this.audio?.buffered.length);
    });
    
    this.audio.addEventListener('abort', () => {
      console.log('❌ Audio abort - fetching process aborted');
    });
    
    console.log('🎵 Event listeners attached to audio element');
  }

  private removeEventListeners() {
    if (!this.audio || !this.boundEventHandlers) return;

    this.audio.removeEventListener('ended', this.boundEventHandlers.ended);
    this.audio.removeEventListener('timeupdate', this.boundEventHandlers.timeupdate);
    this.audio.removeEventListener('loadedmetadata', this.boundEventHandlers.loadedmetadata);
    this.audio.removeEventListener('play', this.boundEventHandlers.play);
    this.audio.removeEventListener('pause', this.boundEventHandlers.pause);
    this.audio.removeEventListener('loadstart', this.boundEventHandlers.loadstart);
    this.audio.removeEventListener('canplay', this.boundEventHandlers.canplay);
    this.audio.removeEventListener('error', this.boundEventHandlers.error);
  }

  // Ensure initialization
  private ensureInitialized() {
    if (!this.initialized && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  // Get the current state of the audio
  getCurrentState() {
    if (!this.audio) return null;
    
    return {
      src: this.audio.src,
      currentTime: this.audio.currentTime,
      paused: this.audio.paused,
      volume: this.audio.volume,
      playbackRate: this.audio.playbackRate,
      currentEpisode: this.currentEpisode
    };
  }

  // Load a new episode
  async loadEpisode(episode: Episode) {
    this.ensureInitialized();
    
    if (!this.audio) {
      console.warn('🚨 Audio element not initialized');
      return;
    }

    // Always set the episode, even if it's the same one (handles refresh cases)
    this.currentEpisode = episode;
    
    // Check if episode is available offline
    let audioUrl = episode.audioUrl;
    const isOffline = await offlineAudioManager.isEpisodeOffline(episode.id);
    
    if (isOffline) {
      console.log('🎵 Loading offline version of episode');
      const offlineUrl = await offlineAudioManager.getOfflineAudioUrl(episode.id);
      if (offlineUrl) {
        audioUrl = offlineUrl;
        console.log('🎵 Using offline audio URL');
      }
    }
    
    // Check if we need to reload the audio source
    if (this.audio.src !== audioUrl) {
      // Clean up any existing blob URLs to prevent memory leaks
      if (this.audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(this.audio.src);
      }
      
      this.audio.src = audioUrl;
      this.audio.load();
      console.log('🎵 Loaded episode:', episode.title);
      console.log('🎵 Audio URL:', audioUrl);
      console.log('🎵 Is offline:', isOffline);
      console.log('🎵 Audio element src:', this.audio.src);
    } else {
      console.log('🎵 Episode already loaded:', episode.title);
      // Ensure metadata is loaded for restored episodes
      if (this.audio.readyState >= 1) {
        // Metadata is already loaded, fire the event manually
        window.dispatchEvent(new CustomEvent('audioDurationChange', {
          detail: { duration: this.audio.duration }
        }));
      }
    }
  }

  // Play the current audio
  async play() {
    this.ensureInitialized();
    
    if (!this.audio) {
      console.warn('🚨 Audio element not initialized');
      return false;
    }

    if (!this.audio.src) {
      console.warn('🚨 No audio source loaded');
      return false;
    }

    console.log('🎵 Attempting to play audio...');
    console.log('🎵 Audio ready state:', this.audio.readyState);
    console.log('🎵 Audio network state:', this.audio.networkState);
    
    try {
      // Store start time for debugging
      const playStartTime = Date.now();
      console.log('🎵 Starting playback at:', new Date().toISOString());
      
      await this.audio.play();
      console.log('🎵 Audio playing successfully');
      
      // Set up a timer to check if audio is still playing after 4 seconds
      setTimeout(() => {
        const elapsedTime = (Date.now() - playStartTime) / 1000;
        console.log(`🔍 Audio check after ${elapsedTime.toFixed(1)}s:`, {
          paused: this.audio?.paused,
          currentTime: this.audio?.currentTime,
          readyState: this.audio?.readyState,
          networkState: this.audio?.networkState,
          error: this.audio?.error
        });
      }, 4500);
      
      return true;
    } catch (error) {
      console.error('🚨 Failed to play audio:', error);
      return false;
    }
  }

  // Pause the current audio
  pause() {
    if (!this.audio) {
      console.warn('Audio element not initialized');
      return;
    }

    this.audio.pause();
  }

  // Toggle play/pause
  async togglePlayPause() {
    if (!this.audio) return false;

    if (this.audio.paused) {
      return await this.play();
    } else {
      this.pause();
      return true;
    }
  }

  // Set current time
  setCurrentTime(time: number) {
    if (!this.audio) return;
    this.audio.currentTime = time;
  }

  // Set volume
  setVolume(volume: number) {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  // Set playback rate
  setPlaybackRate(rate: number) {
    if (!this.audio) return;
    this.audio.playbackRate = rate;
  }

  // Skip forward/backward
  skip(seconds: number) {
    if (!this.audio) return;
    this.audio.currentTime = Math.max(0, this.audio.currentTime + seconds);
  }

  // Get current state
  getState() {
    if (!this.audio) {
      return {
        currentTime: 0,
        duration: 0,
        paused: true,
        volume: 1,
        playbackRate: 1,
        episode: null
      };
    }

    return {
      currentTime: this.audio.currentTime || 0,
      duration: this.audio.duration || 0,
      paused: this.audio.paused,
      volume: this.audio.volume,
      playbackRate: this.audio.playbackRate,
      episode: this.currentEpisode
    };
  }

  // Check if an episode is loaded
  hasEpisode() {
    return this.currentEpisode !== null;
  }

  // Get current episode
  getCurrentEpisode() {
    return this.currentEpisode;
  }

  // Cleanup (usually not needed since audio should persist)
  destroy() {
    if (this.audio) {
      // Clean up blob URLs if any
      if (this.audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(this.audio.src);
      }
      
      if (this.audio.parentNode) {
        this.audio.parentNode.removeChild(this.audio);
      }
      
      this.audio = null;
      this.initialized = false;
    }
  }
}

// Create singleton instance - ensure true persistence across view transitions
let globalAudioManager: GlobalAudioManager;

if (typeof window !== 'undefined') {
  if ((window as any).__globalAudioManager) {
    globalAudioManager = (window as any).__globalAudioManager;
    console.log('🎵 Using existing GlobalAudioManager from window');
  } else {
    globalAudioManager = new GlobalAudioManager();
    console.log('🎵 Created new GlobalAudioManager');
  }
} else {
  globalAudioManager = new GlobalAudioManager();
}

export { globalAudioManager };