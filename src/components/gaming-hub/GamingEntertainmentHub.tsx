import React, { useState, useEffect } from 'react';
import { GamingHubState, GameSession, MusicStream, UserPreferences } from '@/types/gaming-hub';
import { GameInterface } from './GameInterface';
import { MusicStreaming } from './MusicStreaming';
import { ContentCreationTools } from './ContentCreationTools';
import { MultiplayerChat } from './MultiplayerChat';
import { ContentDiscovery } from './ContentDiscovery';
import { MusicCreationTools } from './MusicCreationTools';
import { AchievementSharing } from './AchievementSharing';
import { PreferenceCustomization } from './PreferenceCustomization';
import Button from '@/components/ui/Button';

interface GamingEntertainmentHubProps {
  onClose?: () => void;
}

export const GamingEntertainmentHub: React.FC<GamingEntertainmentHubProps> = ({ onClose }) => {
  const [state, setState] = useState<GamingHubState>({
    musicPlayer: {
      queue: [],
      volume: 0.7,
      isPlaying: false,
    },
    chat: {
      messages: [],
      activeUsers: [],
      enabled: true,
    },
    achievements: [],
    preferences: {
      favoriteGames: [],
      musicGenres: ['electronic', 'ambient'],
      contentTypes: ['drawing', 'meme'],
      chatEnabled: true,
      achievementsVisible: true,
      autoScreenshot: false,
      theme: 'gaming',
    },
    recommendations: {
      gameRecommendations: [],
      musicRecommendations: [],
      contentRecommendations: [],
    },
    screenshots: [],
    musicProjects: [],
  });

  const [activeTab, setActiveTab] = useState<'games' | 'music' | 'create' | 'discover'>('games');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserPreferences();
    initializeRecommendations();
  }, []);

  const loadUserPreferences = () => {
    const saved = localStorage.getItem('gaming-hub-preferences');
    if (saved) {
      const preferences = JSON.parse(saved);
      setState(prev => ({ ...prev, preferences }));
    }
  };

  const saveUserPreferences = (preferences: UserPreferences) => {
    localStorage.setItem('gaming-hub-preferences', JSON.stringify(preferences));
    setState(prev => ({ ...prev, preferences }));
  };

  const initializeRecommendations = async () => {
    setIsLoading(true);
    try {
      // Generate recommendations based on preferences
      const gameRecommendations = [
        {
          gameId: 'typeracer',
          title: 'TypeRacer',
          description: 'Test your typing speed in real-time races',
          url: 'https://play.typeracer.com',
          score: 0.9,
          reason: 'Popular typing game',
          category: 'skill',
        },
        {
          gameId: 'agar',
          title: 'Agar.io',
          description: 'Multiplayer cell eating game',
          url: 'https://agar.io',
          score: 0.8,
          reason: 'Multiplayer action',
          category: 'action',
        },
      ];

      const musicRecommendations = [
        {
          streamId: 'internet-radio',
          title: 'Internet Radio',
          genre: 'various',
          url: 'https://www.internet-radio.com',
          score: 0.9,
          reason: 'Wide variety of stations',
        },
        {
          streamId: 'jango',
          title: 'Jango Radio',
          genre: 'personalized',
          url: 'https://www.jango.com',
          score: 0.8,
          reason: 'Personalized radio',
        },
      ];

      setState(prev => ({
        ...prev,
        recommendations: {
          ...prev.recommendations,
          gameRecommendations,
          musicRecommendations,
        },
      }));
    } catch (error) {
      console.error('Failed to initialize recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameStart = (game: GameSession) => {
    setState(prev => ({ ...prev, activeGame: game }));
  };

  const handleMusicPlay = (stream: MusicStream) => {
    setState(prev => ({
      ...prev,
      musicPlayer: {
        ...prev.musicPlayer,
        currentStream: stream,
        isPlaying: true,
      },
    }));
  };

  const handleAchievementUnlock = (achievement: any) => {
    setState(prev => ({
      ...prev,
      achievements: [...prev.achievements, achievement],
    }));
  };

  return (
    <div className="gaming-hub">
      <div className="gaming-hub__header">
        <h1>Gaming & Entertainment Hub</h1>
        <div className="gaming-hub__tabs">
          <Button
            variant={activeTab === 'games' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('games')}
          >
            Games
          </Button>
          <Button
            variant={activeTab === 'music' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('music')}
          >
            Music
          </Button>
          <Button
            variant={activeTab === 'create' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('create')}
          >
            Create
          </Button>
          <Button
            variant={activeTab === 'discover' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </Button>
        </div>
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="gaming-hub__content">
        {activeTab === 'games' && (
          <div className="gaming-hub__games">
            <GameInterface
              recommendations={state.recommendations.gameRecommendations}
              onGameStart={handleGameStart}
              activeGame={state.activeGame}
              onAchievement={handleAchievementUnlock}
            />
            {state.chat.enabled && (
              <MultiplayerChat
                messages={state.chat.messages}
                activeUsers={state.chat.activeUsers}
                gameSession={state.activeGame?.id}
                onSendMessage={(message) => {
                  setState(prev => ({
                    ...prev,
                    chat: {
                      ...prev.chat,
                      messages: [...prev.chat.messages, message],
                    },
                  }));
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'music' && (
          <div className="gaming-hub__music">
            <MusicStreaming
              currentStream={state.musicPlayer.currentStream}
              queue={state.musicPlayer.queue}
              volume={state.musicPlayer.volume}
              isPlaying={state.musicPlayer.isPlaying}
              recommendations={state.recommendations.musicRecommendations}
              onPlay={handleMusicPlay}
              onVolumeChange={(volume) => {
                setState(prev => ({
                  ...prev,
                  musicPlayer: { ...prev.musicPlayer, volume },
                }));
              }}
            />
            <MusicCreationTools
              projects={state.musicProjects}
              onProjectCreate={(project) => {
                setState(prev => ({
                  ...prev,
                  musicProjects: [...prev.musicProjects, project],
                }));
              }}
            />
          </div>
        )}

        {activeTab === 'create' && (
          <ContentCreationTools
            preferences={state.preferences}
            onContentCreate={(content) => {
              console.log('Content created:', content);
            }}
          />
        )}

        {activeTab === 'discover' && (
          <ContentDiscovery
            recommendations={state.recommendations}
            preferences={state.preferences}
            onPreferencesUpdate={saveUserPreferences}
          />
        )}
      </div>

      <div className="gaming-hub__sidebar">
        <AchievementSharing
          achievements={state.achievements}
          screenshots={state.screenshots}
          onShare={(item) => {
            console.log('Sharing:', item);
          }}
        />
        <PreferenceCustomization
          preferences={state.preferences}
          onUpdate={saveUserPreferences}
        />
      </div>

      {isLoading && (
        <div className="gaming-hub__loading">
          <div className="loading-spinner" />
          <p>Loading entertainment options...</p>
        </div>
      )}
    </div>
  );
};