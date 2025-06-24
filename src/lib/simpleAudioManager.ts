/**
 * Simple Audio Manager - A clean, minimal audio player
 * No complex retry logic, just basic audio functionality
 */

import type { Episode } from '../stores/audioPlayerStore';

class SimpleAudioManager {
  private audio: HTMLAudioElement | null = null;
  private currentEpisode: Episode | null = null;
  private isLoading = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check for existing instance
      if ((window as any).__simpleAudioManager) {
        return (window as any).__simpleAudioManager;
      }
      
      // Create audio element
      this.audio = new Audio();
      // Set preload to auto to force loading
      this.audio.preload = 'auto';
      this.setupEventListeners();
      
      // Store globally
      (window as any).__simpleAudioManager = this;
      console.log('🎵 Simple Audio Manager initialized');
    }
  }

  private setupEventListeners() {
    if (!this.audio) return;

    // Loading events
    this.audio.addEventListener('loadstart', () => {
      console.log('🎵 Load start');
      this.isLoading = true;
      window.dispatchEvent(new CustomEvent('audioLoadStart'));
    });

    // Network state monitoring
    this.audio.addEventListener('progress', () => {
      console.log('🎵 Progress event - buffered:', this.audio!.buffered.length);
      if (this.audio!.buffered.length > 0) {
        console.log('🎵 Buffered range:', this.audio!.buffered.start(0), '-', this.audio!.buffered.end(0));
      }
    });

    this.audio.addEventListener('suspend', () => {
      console.log('🎵 Suspend event - network state:', this.audio!.networkState);
    });

    this.audio.addEventListener('stalled', () => {
      console.log('🚨 Stalled event - network state:', this.audio!.networkState);
    });

    // Basic events
    this.audio.addEventListener('play', () => {
      console.log('🎵 Audio playing');
      this.isLoading = false;
      window.dispatchEvent(new CustomEvent('audioPlay'));
    });

    this.audio.addEventListener('pause', () => {
      console.log('🎵 Audio paused');
      window.dispatchEvent(new CustomEvent('audioPause'));
    });

    this.audio.addEventListener('ended', () => {
      console.log('🎵 Audio ended');
      window.dispatchEvent(new CustomEvent('audioEnded'));
    });

    this.audio.addEventListener('timeupdate', () => {
      window.dispatchEvent(new CustomEvent('audioTimeUpdate', {
        detail: { currentTime: this.audio!.currentTime }
      }));
    });

    this.audio.addEventListener('loadedmetadata', () => {
      console.log('🎵 Metadata loaded');
      this.isLoading = false;
      window.dispatchEvent(new CustomEvent('audioDurationChange', {
        detail: { duration: this.audio!.duration }
      }));
    });

    this.audio.addEventListener('canplay', () => {
      console.log('🎵 Can play');
      this.isLoading = false;
      window.dispatchEvent(new CustomEvent('audioCanPlay'));
    });

    this.audio.addEventListener('error', (e) => {
      console.error('🚨 Audio error:', e);
      this.isLoading = false;
      window.dispatchEvent(new CustomEvent('audioError', {
        detail: { error: 'Failed to load audio' }
      }));
    });
  }

  async loadEpisode(episode: Episode) {
    if (!this.audio) return;

    console.log('🎵 Loading episode:', episode.title);
    console.log('🎵 Original Audio URL:', episode.audioUrl);
    this.currentEpisode = episode;
    
    // Reset the audio element to ensure clean state
    this.audio.pause();
    this.audio.currentTime = 0;
    
    // Set the audio source directly - browsers handle redirects automatically
    this.audio.src = episode.audioUrl;
    
    // Force load to start
    this.audio.load();
    
    console.log('🎵 Audio element state after load:', {
      src: this.audio.src,
      readyState: this.audio.readyState,
      networkState: this.audio.networkState,
      error: this.audio.error
    });
  }

  async play(): Promise<boolean> {
    if (!this.audio || !this.audio.src) {
      console.warn('🚨 No audio loaded');
      return false;
    }

    console.log('🎵 Play called - Audio state:', {
      src: this.audio.src,
      readyState: this.audio.readyState,
      networkState: this.audio.networkState,
      paused: this.audio.paused,
      duration: this.audio.duration,
      currentTime: this.audio.currentTime,
      error: this.audio.error
    });

    // If audio is not ready, wait for it
    if (this.audio.readyState < 2) {
      console.log('🎵 Audio not ready, waiting for canplay event...');
      
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for audio to be ready'));
          }, 5000);
          
          const canPlayHandler = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          const errorHandler = () => {
            clearTimeout(timeout);
            reject(new Error('Audio loading error'));
          };
          
          this.audio!.addEventListener('canplay', canPlayHandler, { once: true });
          this.audio!.addEventListener('error', errorHandler, { once: true });
        });
        
        console.log('🎵 Audio is now ready');
      } catch (waitError: any) {
        console.error('❌ Failed waiting for audio:', waitError.message);
        window.dispatchEvent(new CustomEvent('audioError', {
          detail: { error: waitError.message }
        }));
        return false;
      }
    }

    try {
      console.log('🎵 Calling audio.play()...');
      await this.audio.play();
      console.log('✅ Play succeeded');
      return true;
    } catch (error: any) {
      console.error('❌ Play failed:', error.name, error.message);
      window.dispatchEvent(new CustomEvent('audioError', {
        detail: { error: `${error.name}: ${error.message}` }
      }));
      return false;
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  async togglePlayPause(): Promise<boolean> {
    if (!this.audio) return false;
    
    if (this.audio.paused) {
      return this.play();
    } else {
      this.pause();
      return false;
    }
  }

  seek(time: number) {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  skipForward(seconds: number = 30) {
    if (this.audio) {
      this.audio.currentTime = Math.min(
        this.audio.currentTime + seconds,
        this.audio.duration || 0
      );
    }
  }

  skipBackward(seconds: number = 15) {
    if (this.audio) {
      this.audio.currentTime = Math.max(this.audio.currentTime - seconds, 0);
    }
  }

  setPlaybackRate(rate: number) {
    if (this.audio) {
      this.audio.playbackRate = rate;
      window.dispatchEvent(new CustomEvent('audioPlaybackRateChange', {
        detail: { playbackRate: rate }
      }));
    }
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
      window.dispatchEvent(new CustomEvent('audioVolumeChange', {
        detail: { volume: this.audio.volume }
      }));
    }
  }

  getState() {
    if (!this.audio) {
      return {
        currentTime: 0,
        duration: 0,
        paused: true,
        volume: 1,
        playbackRate: 1,
        episode: null,
        isLoading: false
      };
    }

    return {
      currentTime: this.audio.currentTime || 0,
      duration: this.audio.duration || 0,
      paused: this.audio.paused,
      volume: this.audio.volume,
      playbackRate: this.audio.playbackRate,
      episode: this.currentEpisode,
      isLoading: this.isLoading
    };
  }

  get audioElement() {
    return this.audio;
  }
}

// Create and export singleton
export const simpleAudioManager = new SimpleAudioManager();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).simpleAudioManager = simpleAudioManager;
}