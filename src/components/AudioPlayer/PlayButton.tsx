import React from 'react';
import { audioPlayerActions, type Episode } from '../../stores/audioPlayerStore';

interface PlayButtonProps {
  episode: Episode;
  episodes?: Episode[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  children?: React.ReactNode;
}

const PlayButton: React.FC<PlayButtonProps> = ({
  episode,
  episodes = [],
  className = '',
  size = 'md',
  variant = 'primary',
  children,
}) => {
  const handlePlay = () => {
    // Set up queue if multiple episodes provided
    if (episodes.length > 0) {
      const episodeIndex = episodes.findIndex(ep => ep.id === episode.id);
      audioPlayerActions.setQueue(episodes, episodeIndex >= 0 ? episodeIndex : 0);
    }
    
    // Load and play the episode
    audioPlayerActions.loadEpisode(episode);
    audioPlayerActions.play();
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const variantClasses = {
    primary: '',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handlePlay}
      className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        ${className}
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      `}
      title={`Play ${episode.title}`}
    >
      <svg 
        className={`${iconSizes[size]} flex-shrink-0`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
          clipRule="evenodd"
        />
      </svg>
      {children && <span className="ml-3">{children}</span>}
    </button>
  );
};

export default PlayButton;