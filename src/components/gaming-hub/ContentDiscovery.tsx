import React, { useState, useEffect } from 'react';
import { RecommendationEngine, UserPreferences } from '@/types/gaming-hub';
import Button from '@/components/ui/Button';

interface ContentDiscoveryProps {
  recommendations: RecommendationEngine;
  preferences: UserPreferences;
  onPreferencesUpdate: (preferences: UserPreferences) => void;
}

export const ContentDiscovery: React.FC<ContentDiscoveryProps> = ({
  recommendations,
  preferences,
  onPreferencesUpdate,
}) => {
  const [discoveryTab, setDiscoveryTab] = useState<'games' | 'music' | 'content'>('games');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecommendations, setFilteredRecommendations] = useState(recommendations);

  const gameCategories = [
    { id: 'action', name: 'Action', icon: '⚡' },
    { id: 'puzzle', name: 'Puzzle', icon: '🧩' },
    { id: 'skill', name: 'Skill', icon: '🎯' },
    { id: 'multiplayer', name: 'Multiplayer', icon: '👥' },
    { id: 'casual', name: 'Casual', icon: '🎮' },
    { id: 'strategy', name: 'Strategy', icon: '♟️' },
  ];

  const musicGenres = [
    { id: 'electronic', name: 'Electronic', icon: '🎵' },
    { id: 'ambient', name: 'Ambient', icon: '🌙' },
    { id: 'rock', name: 'Rock', icon: '🎸' },
    { id: 'jazz', name: 'Jazz', icon: '🎺' },
    { id: 'classical', name: 'Classical', icon: '🎼' },
    { id: 'world', name: 'World', icon: '🌍' },
    { id: 'podcast', name: 'Podcasts', icon: '🎙️' },
  ];

  const contentTypes = [
    { id: 'drawing', name: 'Drawing', icon: '🎨' },
    { id: 'meme', name: 'Memes', icon: '😂' },
    { id: 'music', name: 'Music Creation', icon: '🎹' },
    { id: 'video', name: 'Video', icon: '🎬' },
  ];

  useEffect(() => {
    filterRecommendations();
  }, [searchQuery, preferences, recommendations]);

  const filterRecommendations = () => {
    const filtered = {
      gameRecommendations: recommendations.gameRecommendations.filter(game =>
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      musicRecommendations: recommendations.musicRecommendations.filter(music =>
        music.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        music.genre.toLowerCase().includes(searchQuery.toLowerCase())
      ),
      contentRecommendations: recommendations.contentRecommendations.filter(content =>
        content.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    };

    setFilteredRecommendations(filtered);
  };

  const handlePreferenceToggle = (type: 'favoriteGames' | 'musicGenres' | 'contentTypes', value: string) => {
    const currentList = preferences[type] as string[];
    const updatedList = currentList.includes(value)
      ? currentList.filter(item => item !== value)
      : [...currentList, value];

    onPreferencesUpdate({
      ...preferences,
      [type]: updatedList,
    });
  };

  const getRecommendationScore = (item: any) => {
    return Math.round(item.score * 100);
  };

  const handleItemInteraction = (item: any, action: 'like' | 'dislike' | 'try') => {
    console.log(`${action} on item:`, item);
    // In a real implementation, this would update recommendation algorithms
  };

  return (
    <div className="content-discovery">
      <div className="discovery-header">
        <h2>Discover Content</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search games, music, tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="discovery-tabs">
        <Button
          variant={discoveryTab === 'games' ? 'primary' : 'secondary'}
          onClick={() => setDiscoveryTab('games')}
        >
          🎮 Games
        </Button>
        <Button
          variant={discoveryTab === 'music' ? 'primary' : 'secondary'}
          onClick={() => setDiscoveryTab('music')}
        >
          🎵 Music
        </Button>
        <Button
          variant={discoveryTab === 'content' ? 'primary' : 'secondary'}
          onClick={() => setDiscoveryTab('content')}
        >
          🎨 Create
        </Button>
      </div>

      <div className="preferences-section">
        <h3>Your Preferences</h3>
        
        {discoveryTab === 'games' && (
          <div className="preference-categories">
            <h4>Game Categories</h4>
            <div className="category-tags">
              {gameCategories.map((category) => (
                <button
                  key={category.id}
                  className={`category-tag ${
                    preferences.favoriteGames.includes(category.id) ? 'active' : ''
                  }`}
                  onClick={() => handlePreferenceToggle('favoriteGames', category.id)}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {discoveryTab === 'music' && (
          <div className="preference-categories">
            <h4>Music Genres</h4>
            <div className="category-tags">
              {musicGenres.map((genre) => (
                <button
                  key={genre.id}
                  className={`category-tag ${
                    preferences.musicGenres.includes(genre.id) ? 'active' : ''
                  }`}
                  onClick={() => handlePreferenceToggle('musicGenres', genre.id)}
                >
                  {genre.icon} {genre.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {discoveryTab === 'content' && (
          <div className="preference-categories">
            <h4>Content Types</h4>
            <div className="category-tags">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  className={`category-tag ${
                    preferences.contentTypes.includes(type.id) ? 'active' : ''
                  }`}
                  onClick={() => handlePreferenceToggle('contentTypes', type.id)}
                >
                  {type.icon} {type.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="recommendations-section">
        <h3>Recommended for You</h3>

        {discoveryTab === 'games' && (
          <div className="game-recommendations">
            {filteredRecommendations.gameRecommendations.length === 0 ? (
              <p>No game recommendations found. Try adjusting your preferences!</p>
            ) : (
              <div className="recommendation-grid">
                {filteredRecommendations.gameRecommendations.map((game) => (
                  <div key={game.gameId} className="recommendation-card">
                    <div className="card-header">
                      <h4>{game.title}</h4>
                      <span className="recommendation-score">
                        {getRecommendationScore(game)}% match
                      </span>
                    </div>
                    <p className="card-description">{game.description}</p>
                    <div className="card-meta">
                      <span className="category-badge">{game.category}</span>
                      <span className="reason-text">{game.reason}</span>
                    </div>
                    <div className="card-actions">
                      <Button
                        onClick={() => handleItemInteraction(game, 'try')}
                        variant="primary"
                      >
                        Try Game
                      </Button>
                      <Button
                        onClick={() => handleItemInteraction(game, 'like')}
                        variant="secondary"
                        size="small"
                      >
                        👍
                      </Button>
                      <Button
                        onClick={() => handleItemInteraction(game, 'dislike')}
                        variant="secondary"
                        size="small"
                      >
                        👎
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {discoveryTab === 'music' && (
          <div className="music-recommendations">
            {filteredRecommendations.musicRecommendations.length === 0 ? (
              <p>No music recommendations found. Try adjusting your preferences!</p>
            ) : (
              <div className="recommendation-grid">
                {filteredRecommendations.musicRecommendations.map((music) => (
                  <div key={music.streamId} className="recommendation-card">
                    <div className="card-header">
                      <h4>{music.title}</h4>
                      <span className="recommendation-score">
                        {getRecommendationScore(music)}% match
                      </span>
                    </div>
                    {music.artist && <p className="artist-name">by {music.artist}</p>}
                    <div className="card-meta">
                      <span className="genre-badge">{music.genre}</span>
                      <span className="reason-text">{music.reason}</span>
                    </div>
                    <div className="card-actions">
                      <Button
                        onClick={() => handleItemInteraction(music, 'try')}
                        variant="primary"
                      >
                        Listen
                      </Button>
                      <Button
                        onClick={() => handleItemInteraction(music, 'like')}
                        variant="secondary"
                        size="small"
                      >
                        👍
                      </Button>
                      <Button
                        onClick={() => handleItemInteraction(music, 'dislike')}
                        variant="secondary"
                        size="small"
                      >
                        👎
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {discoveryTab === 'content' && (
          <div className="content-recommendations">
            {filteredRecommendations.contentRecommendations.length === 0 ? (
              <p>No content creation recommendations found. Try adjusting your preferences!</p>
            ) : (
              <div className="recommendation-grid">
                {filteredRecommendations.contentRecommendations.map((content) => (
                  <div key={content.toolId} className="recommendation-card">
                    <div className="card-header">
                      <h4>{content.name}</h4>
                      <span className="recommendation-score">
                        {getRecommendationScore(content)}% match
                      </span>
                    </div>
                    <p className="card-description">{content.description}</p>
                    <div className="card-meta">
                      <span className="type-badge">{content.type}</span>
                      <span className="reason-text">{content.reason}</span>
                    </div>
                    <div className="card-actions">
                      <Button
                        onClick={() => handleItemInteraction(content, 'try')}
                        variant="primary"
                      >
                        Try Tool
                      </Button>
                      <Button
                        onClick={() => handleItemInteraction(content, 'like')}
                        variant="secondary"
                        size="small"
                      >
                        👍
                      </Button>
                      <Button
                        onClick={() => handleItemInteraction(content, 'dislike')}
                        variant="secondary"
                        size="small"
                      >
                        👎
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="discovery-stats">
        <h3>Your Activity</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{preferences.favoriteGames.length}</span>
            <span className="stat-label">Favorite Game Types</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{preferences.musicGenres.length}</span>
            <span className="stat-label">Music Genres</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{preferences.contentTypes.length}</span>
            <span className="stat-label">Content Interests</span>
          </div>
        </div>
      </div>
    </div>
  );
};