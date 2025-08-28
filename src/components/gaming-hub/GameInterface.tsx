import React, { useState, useRef, useEffect } from 'react';
import { GameSession, GameRecommendation, Achievement } from '@/types/gaming-hub';
import Button from '@/components/ui/Button';

interface GameInterfaceProps {
  recommendations: GameRecommendation[];
  onGameStart: (game: GameSession) => void;
  activeGame?: GameSession;
  onAchievement: (achievement: Achievement) => void;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({
  recommendations,
  onGameStart,
  activeGame,
  onAchievement,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameRecommendation | null>(null);
  const [gameStats, setGameStats] = useState<Record<string, any>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const games = [
    {
      id: 'typeracer',
      name: 'TypeRacer',
      description: 'Test your typing speed in competitive races',
      url: 'https://play.typeracer.com',
      category: 'skill',
      thumbnail: '/images/typeracer.png',
    },
    {
      id: 'agar',
      name: 'Agar.io',
      description: 'Multiplayer cell eating survival game',
      url: 'https://agar.io',
      category: 'action',
      thumbnail: '/images/agar.png',
    },
    {
      id: 'slither',
      name: 'Slither.io',
      description: 'Snake-like multiplayer game',
      url: 'https://slither.io',
      category: 'action',
      thumbnail: '/images/slither.png',
    },
    {
      id: 'tetris',
      name: 'Tetris',
      description: 'Classic block puzzle game',
      url: 'https://tetris.com/play-tetris',
      category: 'puzzle',
      thumbnail: '/images/tetris.png',
    },
    {
      id: '2048',
      name: '2048',
      description: 'Number combining puzzle game',
      url: 'https://play2048.co',
      category: 'puzzle',
      thumbnail: '/images/2048.png',
    },
  ];

  useEffect(() => {
    // Listen for game events from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'game-score') {
        handleScoreUpdate(event.data.score);
      } else if (event.data.type === 'game-achievement') {
        handleAchievementUnlock(event.data.achievement);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeGame]);

  const handleGameSelect = (game: any) => {
    const gameSession: GameSession = {
      id: `${game.id}-${Date.now()}`,
      gameType: game.id as any,
      gameUrl: game.url,
      startTime: new Date(),
      achievements: [],
    };

    setSelectedGame(game);
    onGameStart(gameSession);
  };

  const handleScoreUpdate = (score: number) => {
    if (activeGame) {
      setGameStats(prev => ({
        ...prev,
        [activeGame.id]: { ...prev[activeGame.id], score },
      }));
    }
  };

  const handleAchievementUnlock = (achievementData: any) => {
    const achievement: Achievement = {
      id: `${Date.now()}-${Math.random()}`,
      title: achievementData.title,
      description: achievementData.description,
      icon: achievementData.icon || '🏆',
      unlockedAt: new Date(),
      gameType: activeGame?.gameType || 'unknown',
      value: achievementData.value,
    };

    onAchievement(achievement);
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen();
    }
  };

  const handleScreenshot = async () => {
    if (iframeRef.current) {
      try {
        // Use html2canvas or similar library to capture screenshot
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Implementation would depend on available screenshot API
        console.log('Screenshot captured');
      } catch (error) {
        console.error('Screenshot failed:', error);
      }
    }
  };

  return (
    <div className="game-interface">
      {!selectedGame ? (
        <div className="game-selection">
          <h2>Choose Your Game</h2>
          <div className="game-grid">
            {games.map((game) => (
              <div key={game.id} className="game-card">
                <div className="game-thumbnail">
                  <img src={game.thumbnail} alt={game.name} />
                </div>
                <div className="game-info">
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <span className="game-category">{game.category}</span>
                </div>
                <Button
                  onClick={() => handleGameSelect(game)}
                  variant="primary"
                >
                  Play Now
                </Button>
              </div>
            ))}
          </div>

          {recommendations.length > 0 && (
            <div className="recommended-games">
              <h3>Recommended for You</h3>
              <div className="recommendation-list">
                {recommendations.map((rec) => (
                  <div key={rec.gameId} className="recommendation-card">
                    <h4>{rec.title}</h4>
                    <p>{rec.description}</p>
                    <span className="recommendation-reason">{rec.reason}</span>
                    <Button
                      onClick={() => handleGameSelect({
                        id: rec.gameId,
                        name: rec.title,
                        url: rec.url,
                        category: rec.category,
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
      ) : (
        <div className="game-player">
          <div className="game-controls">
            <div className="game-info">
              <h3>{selectedGame.title}</h3>
              {activeGame && gameStats[activeGame.id]?.score && (
                <span className="current-score">
                  Score: {gameStats[activeGame.id].score}
                </span>
              )}
            </div>
            <div className="control-buttons">
              <Button onClick={handleFullscreen} variant="secondary">
                Fullscreen
              </Button>
              <Button onClick={handleScreenshot} variant="secondary">
                Screenshot
              </Button>
              <Button
                onClick={() => setSelectedGame(null)}
                variant="secondary"
              >
                Change Game
              </Button>
            </div>
          </div>

          <div className="game-container">
            <iframe
              ref={iframeRef}
              src={selectedGame.url}
              title={selectedGame.title}
              className="game-iframe"
              sandbox="allow-scripts allow-same-origin allow-forms"
              allow="fullscreen; gamepad; microphone"
            />
          </div>

          <div className="game-stats">
            <div className="session-info">
              <p>Session started: {activeGame?.startTime.toLocaleTimeString()}</p>
              <p>Achievements: {activeGame?.achievements.length || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};