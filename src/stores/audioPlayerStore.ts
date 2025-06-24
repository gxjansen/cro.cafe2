import { atom, computed } from 'nanostores';
import { simpleAudioManager } from '../lib/simpleAudioManager';

export interface Episode {
  id: string;
  title: string;
  audioUrl: string;
  duration?: number;
  description?: string;
  publishDate?: string;
  imageUrl?: string;
  slug?: string;
  guests?: string[];
  language?: string;
}

export interface AudioPlayerState {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isLoading: boolean;
  isMinimized: boolean;
  queue: Episode[];
  queueIndex: number;
}

// Initial state
const initialState: AudioPlayerState = {
  currentEpisode: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  volume: 0.8,
  isLoading: false,
  isMinimized: false,
  queue: [],
  queueIndex: -1,
};

// Main audio player store
export const audioPlayerStore = atom<AudioPlayerState>(initialState);

// Derived computed values
export const currentEpisode = computed(audioPlayerStore, state => state.currentEpisode);
export const isPlaying = computed(audioPlayerStore, state => state.isPlaying);
export const currentTime = computed(audioPlayerStore, state => state.currentTime);
export const duration = computed(audioPlayerStore, state => state.duration);
export const progress = computed(audioPlayerStore, state => 
  state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0
);
export const playbackRate = computed(audioPlayerStore, state => state.playbackRate);
export const volume = computed(audioPlayerStore, state => state.volume);
export const isLoading = computed(audioPlayerStore, state => state.isLoading);
export const isMinimized = computed(audioPlayerStore, state => state.isMinimized);

// Actions
export const audioPlayerActions = {
  // Episode management
  loadEpisode: (episode: Episode) => {
    console.log('🎵 Store: Loading episode', {
      title: episode.title,
      audioUrl: episode.audioUrl,
      hasAudioManager: !!simpleAudioManager,
      episode: episode
    });
    
    try {
      simpleAudioManager.loadEpisode(episode);
      audioPlayerStore.set({
        ...audioPlayerStore.get(),
        currentEpisode: episode,
        isLoading: true,
        currentTime: 0,
        duration: 0,
      });
      console.log('🎵 Store: Episode loaded successfully, store updated');
    } catch (error) {
      console.error('❌ Store: Failed to load episode', error);
    }
  },

  // Playback controls
  play: async () => {
    console.log('🎵 Store: Play requested');
    const success = await simpleAudioManager.play();
    console.log('🎵 Store: Play result:', success);
    if (success) {
      audioPlayerStore.set({
        ...audioPlayerStore.get(),
        isPlaying: true,
      });
    }
  },

  pause: () => {
    simpleAudioManager.pause();
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      isPlaying: false,
    });
  },

  togglePlayPause: async () => {
    const state = audioPlayerStore.get();
    const success = await simpleAudioManager.togglePlayPause();
    if (success) {
      audioPlayerStore.set({
        ...state,
        isPlaying: !state.isPlaying,
      });
    }
  },

  // Time controls
  setCurrentTime: (time: number) => {
    simpleAudioManager.setCurrentTime(time);
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      currentTime: Math.max(0, time),
    });
  },

  setDuration: (duration: number) => {
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      duration: Math.max(0, duration),
    });
  },

  skipForward: (seconds: number = 30) => {
    simpleAudioManager.skipForward(seconds);
    const state = audioPlayerStore.get();
    const newTime = Math.min(state.currentTime + seconds, state.duration);
    audioPlayerStore.set({
      ...state,
      currentTime: newTime,
    });
  },

  skipBackward: (seconds: number = 15) => {
    simpleAudioManager.skipBackward(seconds);
    const state = audioPlayerStore.get();
    const newTime = Math.max(state.currentTime - seconds, 0);
    audioPlayerStore.set({
      ...state,
      currentTime: newTime,
    });
  },

  // Playback rate
  setPlaybackRate: (rate: number) => {
    const validRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const clampedRate = validRates.includes(rate) ? rate : 1;
    simpleAudioManager.setPlaybackRate(clampedRate);
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      playbackRate: clampedRate,
    });
  },

  // Volume
  setVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    simpleAudioManager.setVolume(clampedVolume);
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      volume: clampedVolume,
    });
  },

  // Loading state
  setLoading: (isLoading: boolean) => {
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      isLoading,
    });
  },

  // UI state
  toggleMinimized: () => {
    const state = audioPlayerStore.get();
    audioPlayerStore.set({
      ...state,
      isMinimized: !state.isMinimized,
    });
  },

  setMinimized: (isMinimized: boolean) => {
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      isMinimized,
    });
  },

  // Queue management
  setQueue: (episodes: Episode[], startIndex: number = 0) => {
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      queue: episodes,
      queueIndex: startIndex,
    });
  },

  nextEpisode: () => {
    const state = audioPlayerStore.get();
    if (state.queueIndex < state.queue.length - 1) {
      const nextIndex = state.queueIndex + 1;
      const nextEpisode = state.queue[nextIndex];
      audioPlayerStore.set({
        ...state,
        currentEpisode: nextEpisode,
        queueIndex: nextIndex,
        currentTime: 0,
        isLoading: true,
      });
    }
  },

  previousEpisode: () => {
    const state = audioPlayerStore.get();
    if (state.queueIndex > 0) {
      const prevIndex = state.queueIndex - 1;
      const prevEpisode = state.queue[prevIndex];
      audioPlayerStore.set({
        ...state,
        currentEpisode: prevEpisode,
        queueIndex: prevIndex,
        currentTime: 0,
        isLoading: true,
      });
    }
  },

  // Clear/reset
  clearPlayer: () => {
    console.log('🎵 Store: Clearing player...');
    
    // Stop any playing audio
    simpleAudioManager.pause();
    
    // Reset store to initial state
    audioPlayerStore.set(initialState);
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cro-cafe-audio-player');
    }
    
    // Clear the audio source to prevent further events
    // Use setTimeout to ensure the store reset happens first
    setTimeout(() => {
      if (simpleAudioManager.audio) {
        simpleAudioManager.audio.src = '';
        simpleAudioManager.audio.load(); // Reset the audio element
      }
      
      // Ensure final state is correct after any delayed events
      setTimeout(() => {
        const currentState = audioPlayerStore.get();
        if (!currentState.currentEpisode && (currentState.isLoading || currentState.isPlaying)) {
          console.log('🎵 Store: Final cleanup - ensuring cleared state');
          audioPlayerStore.set({
            ...initialState
          });
        }
      }, 200);
    }, 50);
  },
};

// Persistence helpers
export const savePlayerState = () => {
  if (typeof window !== 'undefined') {
    const state = audioPlayerStore.get();
    const persistableState = {
      currentEpisode: state.currentEpisode,
      currentTime: state.currentTime,
      playbackRate: state.playbackRate,
      volume: state.volume,
      queue: state.queue,
      queueIndex: state.queueIndex,
    };
    localStorage.setItem('cro-cafe-audio-player', JSON.stringify(persistableState));
  }
};

export const loadPlayerState = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('cro-cafe-audio-player');
      if (saved) {
        const parsedState = JSON.parse(saved);
        const currentState = audioPlayerStore.get();
        
        // Only restore state if we have a valid episode
        if (parsedState.currentEpisode && parsedState.currentEpisode.audioUrl) {
          audioPlayerStore.set({
            ...currentState,
            ...parsedState,
            isPlaying: false, // Never auto-play on load
            isLoading: false,
          });
          
          // Re-initialize the audio element with the saved episode
          if (parsedState.currentEpisode) {
            simpleAudioManager.loadEpisode(parsedState.currentEpisode);
          }
        } else {
          // Clear invalid state
          audioPlayerStore.set(initialState);
        }
      }
    } catch (error) {
      console.error('Failed to load audio player state:', error);
      // Clear corrupted state
      localStorage.removeItem('cro-cafe-audio-player');
      audioPlayerStore.set(initialState);
    }
  }
};

// Auto-save state changes
audioPlayerStore.subscribe((state) => {
  // Debounce saves to avoid excessive localStorage writes
  if (typeof window !== 'undefined') {
    clearTimeout((window as any).__audioPlayerSaveTimeout);
    (window as any).__audioPlayerSaveTimeout = setTimeout(savePlayerState, 1000);
  }
});

// Initialize global audio manager event listeners
if (typeof window !== 'undefined') {
  // Debounce variables for preventing rapid state changes
  let playStateDebounceTimeout: NodeJS.Timeout | null = null;
  let pauseStateDebounceTimeout: NodeJS.Timeout | null = null;
  let lastKnownPlayingState: boolean | null = null;

  // Sync global audio manager events with store
  window.addEventListener('audioTimeUpdate', (e: any) => {
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      currentTime: e.detail.currentTime,
    });
  });

  window.addEventListener('audioDurationChange', (e: any) => {
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      duration: e.detail.duration,
      isLoading: false,
    });
  });

  window.addEventListener('audioPlay', () => {
    // Clear any pending pause state updates
    if (pauseStateDebounceTimeout) {
      clearTimeout(pauseStateDebounceTimeout);
      pauseStateDebounceTimeout = null;
    }

    // Only process if state is actually changing
    if (lastKnownPlayingState === true) {
      console.log('🎵 Store: Ignoring duplicate play event');
      return;
    }

    // Debounce the play state update
    if (playStateDebounceTimeout) {
      clearTimeout(playStateDebounceTimeout);
    }

    playStateDebounceTimeout = setTimeout(() => {
      const currentState = audioPlayerStore.get();
      if (!currentState.isPlaying) {
        console.log('🎵 Store: Audio play event - updating isPlaying to true');
        audioPlayerStore.set({
          ...currentState,
          isPlaying: true,
        });
        lastKnownPlayingState = true;
      }
      playStateDebounceTimeout = null;
    }, 150); // 150ms debounce
  });

  window.addEventListener('audioPause', () => {
    // Clear any pending play state updates
    if (playStateDebounceTimeout) {
      clearTimeout(playStateDebounceTimeout);
      playStateDebounceTimeout = null;
    }

    // Only process if state is actually changing
    if (lastKnownPlayingState === false) {
      console.log('🎵 Store: Ignoring duplicate pause event');
      return;
    }

    // Debounce the pause state update
    if (pauseStateDebounceTimeout) {
      clearTimeout(pauseStateDebounceTimeout);
    }

    pauseStateDebounceTimeout = setTimeout(() => {
      const currentState = audioPlayerStore.get();
      if (currentState.isPlaying) {
        console.log('🎵 Store: Audio pause event - updating isPlaying to false');
        audioPlayerStore.set({
          ...currentState,
          isPlaying: false,
        });
        lastKnownPlayingState = false;
      }
      pauseStateDebounceTimeout = null;
    }, 150); // 150ms debounce
  });

  window.addEventListener('audioLoadStart', () => {
    const currentState = audioPlayerStore.get();
    // Only set loading if we have a current episode
    if (currentState.currentEpisode) {
      audioPlayerStore.set({
        ...currentState,
        isLoading: true,
      });
    }
  });

  window.addEventListener('audioCanPlay', () => {
    const currentState = audioPlayerStore.get();
    // Only update loading state if we have a current episode
    if (currentState.currentEpisode) {
      audioPlayerStore.set({
        ...currentState,
        isLoading: false,
      });
    }
  });

  window.addEventListener('audioEnded', () => {
    audioPlayerActions.nextEpisode();
  });

  window.addEventListener('audioError', (e: any) => {
    console.error('Global audio error:', e.detail);
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      isLoading: false,
      isPlaying: false,
    });
  });
}