import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  audioPlayerStore,
  audioPlayerActions,
  currentEpisode,
  isPlaying,
  currentTime,
  duration,
  progress,
  playbackRate,
  volume,
  isLoading,
  isMinimized,
  type Episode,
} from '../../stores/audioPlayerStore';

interface AudioPlayerCoreProps {
  episodes?: Episode[];
  autoInitialize?: boolean;
}

const AudioPlayerCore: React.FC<AudioPlayerCoreProps> = ({
  episodes = [],
  autoInitialize = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Subscribe to store state
  const episode = useStore(currentEpisode);
  const playing = useStore(isPlaying);
  const time = useStore(currentTime);
  const dur = useStore(duration);
  const prog = useStore(progress);
  const rate = useStore(playbackRate);
  const vol = useStore(volume);
  const loading = useStore(isLoading);
  const minimized = useStore(isMinimized);

  // Handle view transitions to maintain playback
  useEffect(() => {
    const handleBeforeSwap = () => {
      const audio = audioRef.current;
      if (!audio) return;
      
      // Store the current playing state and time before navigation
      if (!audio.paused) {
        sessionStorage.setItem('audio-was-playing', 'true');
        sessionStorage.setItem('audio-current-time', audio.currentTime.toString());
      }
    };

    const handleAfterSwap = () => {
      const audio = audioRef.current;
      if (!audio) return;
      
      // Restore playing state after navigation
      const wasPlaying = sessionStorage.getItem('audio-was-playing') === 'true';
      const savedTime = sessionStorage.getItem('audio-current-time');
      
      if (wasPlaying && episode) {
        if (savedTime) {
          audio.currentTime = parseFloat(savedTime);
        }
        audio.play().catch(console.error);
        sessionStorage.removeItem('audio-was-playing');
        sessionStorage.removeItem('audio-current-time');
      }
    };

    // Listen for Astro view transition events
    document.addEventListener('astro:before-swap', handleBeforeSwap);
    document.addEventListener('astro:after-swap', handleAfterSwap);

    return () => {
      document.removeEventListener('astro:before-swap', handleBeforeSwap);
      document.removeEventListener('astro:after-swap', handleAfterSwap);
    };
  }, [episode]);

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      audioPlayerActions.setDuration(audio.duration);
      audioPlayerActions.setLoading(false);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        audioPlayerActions.setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      audioPlayerActions.pause();
      audioPlayerActions.nextEpisode();
    };

    const handleLoadStart = () => {
      audioPlayerActions.setLoading(true);
    };

    const handleCanPlay = () => {
      audioPlayerActions.setLoading(false);
    };

    const handleError = () => {
      audioPlayerActions.setLoading(false);
      console.error('Audio playback error');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [isDragging]);

  // Sync audio element with store state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = vol;
  }, [vol]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;

    if (Math.abs(audio.currentTime - time) > 1) {
      audio.currentTime = time;
    }
  }, [time, isDragging]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress bar interaction
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || dur === 0) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    const newTime = (newProgress / 100) * dur;
    
    audioPlayerActions.setCurrentTime(newTime);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!progressRef.current || dur === 0) return;

      const rect = progressRef.current.getBoundingClientRect();
      const dragX = moveEvent.clientX - rect.left;
      const newProgress = Math.max(0, Math.min(100, (dragX / rect.width) * 100));
      const newTime = (newProgress / 100) * dur;
      
      audioPlayerActions.setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Playback rate options
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  if (!episode) {
    return null; // Don't render if no episode is loaded
  }

  return (
    <div 
      className={`
        audio-player-core bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 
        shadow-lg transition-all duration-300 ${minimized ? 'h-16' : 'h-20 sm:h-24'}
      `}
      style={{ viewTransitionName: 'audio-player' }}
    >
      <audio
        ref={audioRef}
        src={episode.audioUrl}
        preload="metadata"
        style={{ viewTransitionName: 'audio-element' }}
        onLoadedMetadata={() => {
          // Restore playing state if we have saved data
          const wasPlaying = sessionStorage.getItem('audio-was-playing') === 'true';
          const savedTime = sessionStorage.getItem('audio-current-time');
          
          if (wasPlaying && audioRef.current) {
            if (savedTime) {
              audioRef.current.currentTime = parseFloat(savedTime);
            }
            audioRef.current.play().catch(console.error);
            sessionStorage.removeItem('audio-was-playing');
            sessionStorage.removeItem('audio-current-time');
          }
        }}
      />

      {/* Full Player View */}
      {!minimized && (
        <div className="flex items-center gap-4 p-4 h-full">
          {/* Episode Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <a 
              href={`/${episode.language || 'en'}/episodes/${episode.slug}/`}
              className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              title={`Go to episode: ${episode.title}`}
            >
              {episode.imageUrl && (
                <img
                  src={episode.imageUrl}
                  alt={episode.title}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                  {episode.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {episode.guests && episode.guests.length > 0 
                    ? episode.guests.length === 1 
                      ? `with ${episode.guests[0]}` 
                      : `with ${episode.guests[0]} +${episode.guests.length - 1} more`
                    : 'CRO.CAFE Podcast'
                  }
                </p>
              </div>
            </a>
          </div>

          {/* Main Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Skip Backward */}
            <button
              onClick={() => audioPlayerActions.skipBackward(15)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Skip back 15s"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/>
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={audioPlayerActions.togglePlayPause}
              disabled={loading}
              className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-full transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : playing ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                </svg>
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => audioPlayerActions.skipForward(30)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Skip forward 30s"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z"/>
              </svg>
            </button>
          </div>

          {/* Playback Rate */}
          <div className="hidden sm:flex items-center gap-2">
            <select
              value={rate}
              onChange={(e) => audioPlayerActions.setPlaybackRate(Number(e.target.value))}
              className="text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
            >
              {playbackRates.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}×
                </option>
              ))}
            </select>
          </div>

          {/* Minimize */}
          <button
            onClick={() => audioPlayerActions.setMinimized(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Minimize player"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      )}

      {/* Minimized Player View */}
      {minimized && (
        <div className="flex items-center gap-3 p-3 h-full">
          <button
            onClick={audioPlayerActions.togglePlayPause}
            disabled={loading}
            className="p-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-full transition-colors flex-shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : playing ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
              </svg>
            )}
          </button>

          <a 
            href={`/${episode.language || 'en'}/episodes/${episode.slug}/`}
            className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
            title={`Go to episode: ${episode.title}`}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {episode.title}
            </p>
          </a>

          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatTime(time)}</span>
            <span>/</span>
            <span>{formatTime(dur)}</span>
          </div>

          <button
            onClick={() => audioPlayerActions.setMinimized(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            title="Expand player"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      )}

      {/* Progress Bar (always visible) */}
      <div
        ref={progressRef}
        className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 cursor-pointer"
        onClick={handleProgressClick}
        onMouseDown={handleProgressDrag}
      >
        <div
          className="h-full bg-primary-600 transition-all duration-150"
          style={{ width: `${prog}%` }}
        />
      </div>

      {/* Time display for full view */}
      {!minimized && (
        <div className="absolute bottom-1 right-4 text-xs text-gray-500 dark:text-gray-400">
          {formatTime(time)} / {formatTime(dur)}
        </div>
      )}
    </div>
  );
};

export default AudioPlayerCore;