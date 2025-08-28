import React, { useState, useRef, useEffect } from 'react';
import { MusicStream, MusicRecommendation } from '@/types/gaming-hub';
import Button from '@/components/ui/Button';

interface MusicStreamingProps {
  currentStream?: MusicStream;
  queue: MusicStream[];
  volume: number;
  isPlaying: boolean;
  recommendations: MusicRecommendation[];
  onPlay: (stream: MusicStream) => void;
  onVolumeChange: (volume: number) => void;
}

export const MusicStreaming: React.FC<MusicStreamingProps> = ({
  currentStream,
  queue,
  volume,
  isPlaying,
  recommendations,
  onPlay,
  onVolumeChange,
}) => {
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [customUrl, setCustomUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const radioStations = [
    {
      id: 'internet-radio',
      name: 'Internet Radio',
      description: 'Thousands of radio stations worldwide',
      url: 'https://www.internet-radio.com',
      type: 'radio' as const,
      genre: 'various',
    },
    {
      id: 'jango',
      name: 'Jango Radio',
      description: 'Free personalized radio',
      url: 'https://www.jango.com',
      type: 'radio' as const,
      genre: 'personalized',
    },
    {
      id: 'radio-garden',
      name: 'Radio Garden',
      description: 'Explore live radio stations around the world',
      url: 'https://radio.garden',
      type: 'radio' as const,
      genre: 'world',
    },
    {
      id: 'soma-fm',
      name: 'SomaFM',
      description: 'Commercial-free internet radio',
      url: 'https://somafm.com',
      type: 'radio' as const,
      genre: 'electronic',
    },
  ];

  const podcastPlatforms = [
    {
      id: 'podcast-addict',
      name: 'Podcast Republic',
      description: 'Free podcast player and manager',
      url: 'https://www.podcastrepublic.net',
      type: 'podcast' as const,
      genre: 'various',
    },
    {
      id: 'spotify-web',
      name: 'Spotify Web Player',
      description: 'Stream music and podcasts',
      url: 'https://open.spotify.com',
      type: 'playlist' as const,
      genre: 'various',
    },
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleStationSelect = (station: any) => {
    const stream: MusicStream = {
      id: station.id,
      title: station.name,
      url: station.url,
      type: station.type,
      genre: station.genre,
      isPlaying: false,
    };

    setSelectedStation(station.id);
    onPlay(stream);
  };

  const handleCustomStream = () => {
    if (customUrl) {
      const stream: MusicStream = {
        id: `custom-${Date.now()}`,
        title: 'Custom Stream',
        url: customUrl,
        type: 'radio',
        isPlaying: false,
      };

      onPlay(stream);
      setCustomUrl('');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };

  return (
    <div className="music-streaming">
      <div className="music-player">
        {currentStream ? (
          <div className="current-stream">
            <div className="stream-info">
              <h3>{currentStream.title}</h3>
              {currentStream.artist && <p>by {currentStream.artist}</p>}
              <span className="stream-type">{currentStream.type}</span>
            </div>
            
            <div className="player-controls">
              <Button
                onClick={() => {
                  // Toggle play/pause
                  const updatedStream = { ...currentStream, isPlaying: !isPlaying };
                  onPlay(updatedStream);
                }}
                variant="primary"
              >
                {isPlaying ? '⏸️' : '▶️'}
              </Button>
              
              <div className="volume-control">
                <span>🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
                <span>{Math.round(volume * 100)}%</span>
              </div>
            </div>

            <div className="stream-player">
              <iframe
                src={currentStream.url}
                title={currentStream.title}
                className="music-iframe"
                sandbox="allow-scripts allow-same-origin"
                allow="autoplay; encrypted-media"
              />
            </div>
          </div>
        ) : (
          <div className="no-stream">
            <p>Select a radio station or podcast to start listening</p>
          </div>
        )}
      </div>

      <div className="station-selection">
        <div className="radio-stations">
          <h3>Radio Stations</h3>
          <div className="station-grid">
            {radioStations.map((station) => (
              <div
                key={station.id}
                className={`station-card ${selectedStation === station.id ? 'active' : ''}`}
              >
                <h4>{station.name}</h4>
                <p>{station.description}</p>
                <span className="station-genre">{station.genre}</span>
                <Button
                  onClick={() => handleStationSelect(station)}
                  variant={selectedStation === station.id ? 'primary' : 'secondary'}
                >
                  {selectedStation === station.id ? 'Playing' : 'Listen'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="podcast-platforms">
          <h3>Podcasts & Playlists</h3>
          <div className="platform-grid">
            {podcastPlatforms.map((platform) => (
              <div key={platform.id} className="platform-card">
                <h4>{platform.name}</h4>
                <p>{platform.description}</p>
                <Button
                  onClick={() => handleStationSelect(platform)}
                  variant="secondary"
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="custom-stream">
          <h3>Custom Stream</h3>
          <div className="custom-input">
            <input
              type="url"
              placeholder="Enter stream URL..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="stream-input"
            />
            <Button
              onClick={handleCustomStream}
              disabled={!customUrl}
              variant="primary"
            >
              Play
            </Button>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="music-recommendations">
            <h3>Recommended for You</h3>
            <div className="recommendation-list">
              {recommendations.map((rec) => (
                <div key={rec.streamId} className="music-recommendation">
                  <div className="rec-info">
                    <h4>{rec.title}</h4>
                    {rec.artist && <p>by {rec.artist}</p>}
                    <span className="rec-genre">{rec.genre}</span>
                    <p className="rec-reason">{rec.reason}</p>
                  </div>
                  <Button
                    onClick={() => handleStationSelect({
                      id: rec.streamId,
                      name: rec.title,
                      url: rec.url,
                      type: 'radio',
                      genre: rec.genre,
                    })}
                    variant="secondary"
                  >
                    Try It
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {queue.length > 0 && (
        <div className="music-queue">
          <h3>Queue ({queue.length})</h3>
          <div className="queue-list">
            {queue.map((stream, index) => (
              <div key={`${stream.id}-${index}`} className="queue-item">
                <span className="queue-position">{index + 1}</span>
                <div className="queue-info">
                  <h4>{stream.title}</h4>
                  {stream.artist && <p>{stream.artist}</p>}
                </div>
                <Button
                  onClick={() => onPlay(stream)}
                  variant="secondary"
                  size="small"
                >
                  Play Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};