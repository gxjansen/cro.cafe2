/**
 * Global Audio Manager - Maintains persistent audio element across page navigation
 * This creates a single audio element that lives outside the React component tree
 */

import type { Episode } from '../stores/audioPlayerStore';

class GlobalAudioManager {
  private audio: HTMLAudioElement | null = null;
  private initialized = false;
  private currentEpisode: Episode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (this.initialized) return;

    // Create a persistent audio element
    this.audio = document.createElement('audio');
    this.audio.preload = 'metadata';
    this.audio.style.display = 'none';
    
    // Add it to the body (not managed by any framework)
    document.body.appendChild(this.audio);

    // Add event listeners for audio events
    this.setupEventListeners();
    
    this.initialized = true;
    console.log('Global Audio Manager initialized');
  }

  private setupEventListeners() {
    if (!this.audio) return;

    // Handle ended event
    this.audio.addEventListener('ended', () => {
      console.log('Audio ended');
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('audioEnded'));
    });

    // Handle time updates
    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        window.dispatchEvent(new CustomEvent('audioTimeUpdate', {
          detail: { currentTime: this.audio.currentTime }
        }));
      }
    });

    // Handle duration loaded
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio) {
        window.dispatchEvent(new CustomEvent('audioDurationChange', {
          detail: { duration: this.audio.duration }
        }));
      }
    });

    // Handle play/pause events
    this.audio.addEventListener('play', () => {
      window.dispatchEvent(new CustomEvent('audioPlay'));
    });

    this.audio.addEventListener('pause', () => {
      window.dispatchEvent(new CustomEvent('audioPause'));
    });

    // Handle loading states
    this.audio.addEventListener('loadstart', () => {
      window.dispatchEvent(new CustomEvent('audioLoadStart'));
    });

    this.audio.addEventListener('canplay', () => {
      window.dispatchEvent(new CustomEvent('audioCanPlay'));
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      window.dispatchEvent(new CustomEvent('audioError', { detail: e }));
    });
  }

  // Load a new episode
  loadEpisode(episode: Episode) {
    if (!this.audio) {
      console.warn('Audio element not initialized');
      return;
    }

    // Only reload if it's a different episode
    if (this.currentEpisode?.id !== episode.id) {
      this.currentEpisode = episode;
      this.audio.src = episode.audioUrl;
      this.audio.load();
      console.log('Loaded episode:', episode.title);
    }
  }

  // Play the current audio
  async play() {
    if (!this.audio) {
      console.warn('Audio element not initialized');
      return false;
    }

    try {
      await this.audio.play();
      return true;
    } catch (error) {
      console.error('Failed to play audio:', error);
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
    if (this.audio && this.audio.parentNode) {
      this.audio.parentNode.removeChild(this.audio);
      this.audio = null;
      this.initialized = false;
    }
  }
}

// Create singleton instance
export const globalAudioManager = new GlobalAudioManager();