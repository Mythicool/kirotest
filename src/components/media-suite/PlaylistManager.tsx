import React, { useState, useRef } from 'react';
import { Playlist, PlaylistItem } from '@/types/media-suite';
import { Button } from '@/components/ui/Button';

interface PlaylistManagerProps {
  playlist: Playlist;
  onPlaylistUpdate: (playlist: Playlist) => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlist,
  onPlaylistUpdate
}) => {
  const [newItemUrl, setNewItemUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const youtubeRef = useRef<HTMLIFrameElement>(null);

  const addItem = async (url: string, title?: string) => {
    try {
      const itemInfo = await extractMediaInfo(url);
      
      const newItem: PlaylistItem = {
        id: crypto.randomUUID(),
        title: title || itemInfo.title || 'Untitled',
        url,
        duration: itemInfo.duration,
        thumbnail: itemInfo.thumbnail,
        order: playlist.items.length
      };

      const updatedPlaylist = {
        ...playlist,
        items: [...playlist.items, newItem],
        lastModified: new Date()
      };

      onPlaylistUpdate(updatedPlaylist);
      setNewItemUrl('');
    } catch (error) {
      console.error('Error adding playlist item:', error);
    }
  };

  const removeItem = (itemId: string) => {
    const updatedPlaylist = {
      ...playlist,
      items: playlist.items.filter(item => item.id !== itemId),
      lastModified: new Date()
    };

    onPlaylistUpdate(updatedPlaylist);
  };

  const reorderItems = (dragIndex: number, dropIndex: number) => {
    const items = [...playlist.items];
    const draggedItem = items[dragIndex];
    
    items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, draggedItem);
    
    // Update order values
    const reorderedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    const updatedPlaylist = {
      ...playlist,
      items: reorderedItems,
      lastModified: new Date()
    };

    onPlaylistUpdate(updatedPlaylist);
  };

  const importFromYoutube = async () => {
    setIsImporting(true);
    
    try {
      // Load YouTube Dynamic Playlists in iframe
      if (youtubeRef.current) {
        youtubeRef.current.src = 'https://youtube-dynamic-playlists.com/';
      }
    } catch (error) {
      console.error('Error importing from YouTube:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const exportPlaylist = () => {
    const playlistData = {
      name: playlist.name,
      description: playlist.description,
      items: playlist.items.map(item => ({
        title: item.title,
        url: item.url,
        duration: item.duration
      }))
    };

    const blob = new Blob([JSON.stringify(playlistData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const playItem = (item: PlaylistItem) => {
    setCurrentlyPlaying(item.id);
    
    // Handle different URL types
    if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
      playYouTubeVideo(item.url);
    } else if (item.url.includes('soundcloud.com')) {
      playSoundCloudTrack(item.url);
    } else {
      // Generic media player
      playGenericMedia(item.url);
    }
  };

  const playYouTubeVideo = (url: string) => {
    const videoId = extractYouTubeVideoId(url);
    if (videoId && youtubeRef.current) {
      youtubeRef.current.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
  };

  const playSoundCloudTrack = (url: string) => {
    if (youtubeRef.current) {
      youtubeRef.current.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true`;
    }
  };

  const playGenericMedia = (url: string) => {
    // Create a generic media player
    const mediaElement = document.createElement(url.includes('video') ? 'video' : 'audio');
    mediaElement.src = url;
    mediaElement.controls = true;
    mediaElement.autoplay = true;
    
    // Replace iframe content with media element
    if (youtubeRef.current?.parentNode) {
      youtubeRef.current.parentNode.replaceChild(mediaElement, youtubeRef.current);
    }
  };

  const getTotalDuration = () => {
    return playlist.items.reduce((total, item) => total + (item.duration || 0), 0);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="playlist-manager">
      <div className="playlist-header">
        <div className="playlist-info">
          <input
            type="text"
            value={playlist.name}
            onChange={(e) => onPlaylistUpdate({
              ...playlist,
              name: e.target.value,
              lastModified: new Date()
            })}
            className="playlist-title"
          />
          <textarea
            value={playlist.description || ''}
            onChange={(e) => onPlaylistUpdate({
              ...playlist,
              description: e.target.value,
              lastModified: new Date()
            })}
            placeholder="Playlist description..."
            className="playlist-description"
          />
          <div className="playlist-stats">
            <span>{playlist.items.length} items</span>
            <span>Total duration: {formatDuration(getTotalDuration())}</span>
          </div>
        </div>

        <div className="playlist-actions">
          <Button onClick={importFromYoutube} disabled={isImporting}>
            {isImporting ? 'Importing...' : 'Import from YouTube'}
          </Button>
          <Button onClick={exportPlaylist}>
            Export Playlist
          </Button>
        </div>
      </div>

      <div className="playlist-content">
        <div className="playlist-items">
          <div className="add-item">
            <input
              type="text"
              value={newItemUrl}
              onChange={(e) => setNewItemUrl(e.target.value)}
              placeholder="Enter URL (YouTube, SoundCloud, etc.)"
              className="url-input"
            />
            <Button
              onClick={() => addItem(newItemUrl)}
              disabled={!newItemUrl.trim()}
            >
              Add Item
            </Button>
          </div>

          <div className="items-list">
            {playlist.items
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <div
                  key={item.id}
                  className={`playlist-item ${currentlyPlaying === item.id ? 'playing' : ''}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    reorderItems(dragIndex, index);
                  }}
                >
                  <div className="item-thumbnail">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} />
                    ) : (
                      <div className="placeholder-thumbnail">
                        {getMediaTypeIcon(item.url)}
                      </div>
                    )}
                  </div>

                  <div className="item-info">
                    <div className="item-title">{item.title}</div>
                    <div className="item-url">{item.url}</div>
                    {item.duration && (
                      <div className="item-duration">{formatDuration(item.duration)}</div>
                    )}
                  </div>

                  <div className="item-controls">
                    <Button
                      size="small"
                      onClick={() => playItem(item)}
                      variant={currentlyPlaying === item.id ? 'primary' : 'secondary'}
                    >
                      {currentlyPlaying === item.id ? 'Playing' : 'Play'}
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="media-player">
          <iframe
            ref={youtubeRef}
            className="media-player-iframe"
            title="Media Player"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>

      <div className="youtube-integration">
        <h4>YouTube Dynamic Playlists Integration</h4>
        <p>Import playlists from YouTube or create dynamic playlists based on search criteria.</p>
        <Button onClick={importFromYoutube}>
          Open YouTube Playlists
        </Button>
      </div>
    </div>
  );
};

async function extractMediaInfo(url: string): Promise<{
  title?: string;
  duration?: number;
  thumbnail?: string;
}> {
  try {
    // For YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        // In a real implementation, you'd use YouTube API
        return {
          title: `YouTube Video ${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        };
      }
    }

    // For other URLs, try to extract basic info
    return {
      title: url.split('/').pop() || 'Unknown'
    };
  } catch (error) {
    console.error('Error extracting media info:', error);
    return {};
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getMediaTypeIcon(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return '📺';
  } else if (url.includes('soundcloud.com')) {
    return '🎵';
  } else if (url.includes('spotify.com')) {
    return '🎶';
  } else if (url.includes('twitch.tv')) {
    return '🎮';
  }
  return '🎬';
}