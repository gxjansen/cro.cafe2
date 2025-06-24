import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  offlineAudioStore,
  offlineAudioActions,
  type OfflineEpisode
} from '../stores/offlineAudioStore';
import type { Episode } from '../stores/audioPlayerStore';

interface OfflineEpisodeCardProps {
  episode: Episode;
  className?: string;
}

const OfflineEpisodeCard: React.FC<OfflineEpisodeCardProps> = ({ episode, className = '' }) => {
  const state = useStore(offlineAudioStore);
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if episode is offline
    const checkOfflineStatus = async () => {
      const offline = await offlineAudioActions.isEpisodeOffline(episode.id);
      setIsOffline(offline);
      setIsChecking(false);
    };
    
    checkOfflineStatus();
  }, [episode.id, state.offlineEpisodes]);

  const downloadProgress = offlineAudioActions.getDownloadProgress(episode.id);
  const isDownloading = offlineAudioActions.isDownloading(episode.id);

  const handleDownload = async () => {
    try {
      await offlineAudioActions.downloadEpisode(episode);
    } catch (error) {
      console.error('Failed to download episode:', error);
      // You might want to show a toast notification here
    }
  };

  const handleDelete = async () => {
    if (confirm('Remove this episode from offline storage?')) {
      try {
        await offlineAudioActions.deleteOfflineEpisode(episode.id);
      } catch (error) {
        console.error('Failed to delete offline episode:', error);
      }
    }
  };

  const handleCancelDownload = () => {
    offlineAudioActions.cancelDownload(episode.id);
  };

  if (isChecking) {
    return (
      <div className={`offline-episode-card ${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`offline-episode-card ${className}`}>
      {/* Offline Status Indicator */}
      {isOffline && !isDownloading && (
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Available Offline
            </span>
          </div>
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
        </div>
      )}

      {/* Download Button */}
      {!isOffline && !isDownloading && (
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <span>Download for Offline</span>
        </button>
      )}

      {/* Download Progress */}
      {isDownloading && downloadProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {downloadProgress.status === 'downloading' ? 'Downloading...' : downloadProgress.status}
            </span>
            <button
              onClick={handleCancelDownload}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Cancel
            </button>
          </div>
          
          <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="absolute top-0 left-0 h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress.progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {offlineAudioActions.formatBytes(downloadProgress.bytesDownloaded)}
            </span>
            <span>
              {downloadProgress.totalBytes > 0 
                ? offlineAudioActions.formatBytes(downloadProgress.totalBytes)
                : 'Calculating...'}
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {downloadProgress?.status === 'failed' && (
        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">
              {downloadProgress.error || 'Download failed'}
            </span>
          </div>
          <button
            onClick={handleDownload}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default OfflineEpisodeCard;