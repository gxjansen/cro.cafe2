import React, { useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  offlineAudioStore,
  offlineAudioActions,
  storagePercentUsed,
  totalStorageUsed,
  storageQuota,
  offlineEpisodes
} from '../stores/offlineAudioStore'

interface OfflineStorageManagerProps {
  className?: string;
}

const OfflineStorageManager: React.FC<OfflineStorageManagerProps> = ({ className = '' }) => {
  const episodes = useStore(offlineEpisodes)
  const storageUsed = useStore(totalStorageUsed)
  const quota = useStore(storageQuota)
  const percentUsed = useStore(storagePercentUsed)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDeleteEpisode = async (episodeId: string) => {
    if (confirm('Remove this episode from offline storage?')) {
      setIsDeleting(episodeId)
      try {
        await offlineAudioActions.deleteOfflineEpisode(episodeId)
      } catch (error) {
        console.error('Failed to delete episode:', error)
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const handleClearAll = async () => {
    if (confirm('Remove all offline episodes? This cannot be undone.')) {
      try {
        await offlineAudioActions.clearAllOfflineEpisodes()
      } catch (error) {
        console.error('Failed to clear offline episodes:', error)
      }
    }
  }

  const getStorageColor = () => {
    if (percentUsed < 50) {return 'bg-green-500'}
    if (percentUsed < 80) {return 'bg-yellow-500'}
    return 'bg-red-500'
  }

  return (
    <div className={`offline-storage-manager ${className} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Offline Storage
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {isExpanded ? 'Collapse' : 'Manage'}
        </button>
      </div>

      {/* Storage Overview */}
      <div className="space-y-3">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              {offlineAudioActions.formatBytes(storageUsed)} used
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {quota > 0 ? offlineAudioActions.formatBytes(quota) : 'Calculating...'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getStorageColor()}`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Episode Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'} offline
          </span>
          {episodes.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Expanded View - Episode List */}
      {isExpanded && episodes.length > 0 && (
        <div className="mt-6 space-y-3 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Offline Episodes
          </h4>
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {episode.imageUrl && (
                  <img
                    src={episode.imageUrl}
                    alt={episode.title}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {episode.title}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {offlineAudioActions.formatBytes(episode.fileSize)} •
                    Downloaded {new Date(episode.downloadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteEpisode(episode.id)}
                disabled={isDeleting === episode.id}
                className="ml-2 p-2 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
              >
                {isDeleting === episode.id ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {isExpanded && episodes.length === 0 && (
        <div className="mt-6 text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No episodes downloaded yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Download episodes to listen offline
          </p>
        </div>
      )}
    </div>
  )
}

export default OfflineStorageManager