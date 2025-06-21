import { atom, computed } from 'nanostores';
import { globalAudioManager } from '../lib/audioManager';

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
    globalAudioManager.loadEpisode(episode);
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      currentEpisode: episode,
      isLoading: true,
      currentTime: 0,
      duration: 0,
    });
  },

  // Playback controls
  play: async () => {
    const success = await globalAudioManager.play();
    if (success) {
      audioPlayerStore.set({
        ...audioPlayerStore.get(),
        isPlaying: true,
      });
    }
  },

  pause: () => {
    globalAudioManager.pause();
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      isPlaying: false,
    });
  },

  togglePlayPause: async () => {
    const state = audioPlayerStore.get();
    const success = await globalAudioManager.togglePlayPause();
    if (success) {
      audioPlayerStore.set({
        ...state,
        isPlaying: !state.isPlaying,
      });
    }
  },

  // Time controls
  setCurrentTime: (time: number) => {
    globalAudioManager.setCurrentTime(time);
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
    globalAudioManager.skip(seconds);
    const state = audioPlayerStore.get();
    const newTime = Math.min(state.currentTime + seconds, state.duration);
    audioPlayerStore.set({
      ...state,
      currentTime: newTime,
    });
  },

  skipBackward: (seconds: number = 15) => {
    globalAudioManager.skip(-seconds);
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
    globalAudioManager.setPlaybackRate(clampedRate);
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      playbackRate: clampedRate,
    });
  },

  // Volume
  setVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    globalAudioManager.setVolume(clampedVolume);
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
    audioPlayerStore.set(initialState);
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
        audioPlayerStore.set({
          ...currentState,
          ...parsedState,
          isPlaying: false, // Never auto-play on load
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to load audio player state:', error);
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
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      isPlaying: true,
    });
  });

  window.addEventListener('audioPause', () => {
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      isPlaying: false,
    });
  });

  window.addEventListener('audioLoadStart', () => {
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      isLoading: true,
    });
  });

  window.addEventListener('audioCanPlay', () => {
    audioPlayerStore.set({
      ...audioPlayerStore.get(),
      isLoading: false,
    });
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