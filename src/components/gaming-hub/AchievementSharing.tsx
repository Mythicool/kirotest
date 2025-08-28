import React, { useState } from 'react';
import { Achievement, ScreenshotCapture } from '@/types/gaming-hub';
import Button from '@/components/ui/Button';

interface AchievementSharingProps {
  achievements: Achievement[];
  screenshots: ScreenshotCapture[];
  onShare: (item: Achievement | ScreenshotCapture) => void;
}

export const AchievementSharing: React.FC<AchievementSharingProps> = ({
  achievements,
  screenshots,
  onShare,
}) => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'screenshots'>('achievements');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [shareText, setShareText] = useState('');

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleShare = (item: Achievement | ScreenshotCapture) => {
    onShare(item);
    
    // Generate share text
    if ('title' in item) {
      // Achievement
      setShareText(`🏆 Just unlocked: ${item.title}! ${item.description}`);
    } else {
      // Screenshot
      setShareText(`📸 Check out this gaming moment!`);
    }
  };

  const handleBulkShare = () => {
    const selectedAchievements = achievements.filter(a => selectedItems.includes(a.id));
    const selectedScreenshots = screenshots.filter(s => selectedItems.includes(s.id));
    
    const shareContent = [
      ...selectedAchievements.map(a => `🏆 ${a.title}`),
      ...selectedScreenshots.map(() => '📸 Gaming screenshot'),
    ].join('\n');

    setShareText(shareContent);
    setSelectedItems([]);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    alert('Copied to clipboard!');
  };

  const handleAutoScreenshot = () => {
    // This would integrate with the game interface to take automatic screenshots
    console.log('Auto-screenshot feature would be implemented here');
  };

  const getAchievementIcon = (gameType: string) => {
    const icons: Record<string, string> = {
      'typeracer': '⌨️',
      'agar': '🔴',
      'puzzle': '🧩',
      'action': '⚡',
      'skill': '🎯',
      'default': '🏆',
    };
    return icons[gameType] || icons.default;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="achievement-sharing">
      <div className="sharing-header">
        <h3>Share Your Progress</h3>
        <div className="tab-buttons">
          <Button
            variant={activeTab === 'achievements' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('achievements')}
            size="small"
          >
            🏆 Achievements
          </Button>
          <Button
            variant={activeTab === 'screenshots' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('screenshots')}
            size="small"
          >
            📸 Screenshots
          </Button>
        </div>
      </div>

      {activeTab === 'achievements' && (
        <div className="achievements-section">
          {achievements.length === 0 ? (
            <div className="empty-state">
              <p>🎮 No achievements yet!</p>
              <p>Start playing games to unlock achievements.</p>
            </div>
          ) : (
            <>
              <div className="achievements-stats">
                <div className="stat">
                  <span className="stat-number">{achievements.length}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="stat">
                  <span className="stat-number">
                    {new Set(achievements.map(a => a.gameType)).size}
                  </span>
                  <span className="stat-label">Games</span>
                </div>
                <div className="stat">
                  <span className="stat-number">
                    {achievements.filter(a => 
                      new Date().getTime() - a.unlockedAt.getTime() < 24 * 60 * 60 * 1000
                    ).length}
                  </span>
                  <span className="stat-label">Today</span>
                </div>
              </div>

              <div className="achievements-list">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`achievement-item ${
                      selectedItems.includes(achievement.id) ? 'selected' : ''
                    }`}
                    onClick={() => handleItemSelect(achievement.id)}
                  >
                    <div className="achievement-icon">
                      {getAchievementIcon(achievement.gameType)}
                    </div>
                    <div className="achievement-info">
                      <h4>{achievement.title}</h4>
                      <p>{achievement.description}</p>
                      <div className="achievement-meta">
                        <span className="game-type">{achievement.gameType}</span>
                        <span className="unlock-date">
                          {formatDate(achievement.unlockedAt)}
                        </span>
                        {achievement.value && (
                          <span className="achievement-value">
                            {achievement.value} pts
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="achievement-actions">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(achievement);
                        }}
                        variant="secondary"
                        size="small"
                      >
                        Share
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'screenshots' && (
        <div className="screenshots-section">
          <div className="screenshot-controls">
            <Button
              onClick={handleAutoScreenshot}
              variant="primary"
              size="small"
            >
              📸 Take Screenshot
            </Button>
          </div>

          {screenshots.length === 0 ? (
            <div className="empty-state">
              <p>📸 No screenshots yet!</p>
              <p>Capture your best gaming moments.</p>
            </div>
          ) : (
            <div className="screenshots-grid">
              {screenshots.map((screenshot) => (
                <div
                  key={screenshot.id}
                  className={`screenshot-item ${
                    selectedItems.includes(screenshot.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleItemSelect(screenshot.id)}
                >
                  <div className="screenshot-image">
                    <img
                      src={screenshot.imageData}
                      alt="Game screenshot"
                      loading="lazy"
                    />
                    {screenshot.achievement && (
                      <div className="screenshot-achievement">
                        🏆 {screenshot.achievement.title}
                      </div>
                    )}
                  </div>
                  <div className="screenshot-info">
                    <p className="screenshot-date">
                      {formatDate(screenshot.timestamp)}
                    </p>
                    {screenshot.shared && (
                      <span className="shared-indicator">✓ Shared</span>
                    )}
                  </div>
                  <div className="screenshot-actions">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(screenshot);
                      }}
                      variant="secondary"
                      size="small"
                    >
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="bulk-actions">
          <p>{selectedItems.length} items selected</p>
          <div className="bulk-buttons">
            <Button onClick={handleBulkShare} variant="primary" size="small">
              Share Selected
            </Button>
            <Button
              onClick={() => setSelectedItems([])}
              variant="secondary"
              size="small"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {shareText && (
        <div className="share-preview">
          <h4>Share Preview</h4>
          <div className="share-text">
            <textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              rows={3}
              placeholder="Add your message..."
            />
          </div>
          <div className="share-actions">
            <Button onClick={handleCopyToClipboard} variant="primary" size="small">
              Copy to Clipboard
            </Button>
            <Button
              onClick={() => setShareText('')}
              variant="secondary"
              size="small"
            >
              Clear
            </Button>
          </div>
          <div className="share-platforms">
            <p>Share on:</p>
            <div className="platform-buttons">
              <Button
                onClick={() => {
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                  window.open(url, '_blank');
                }}
                variant="secondary"
                size="small"
              >
                Twitter
              </Button>
              <Button
                onClick={() => {
                  const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`;
                  window.open(url, '_blank');
                }}
                variant="secondary"
                size="small"
              >
                Facebook
              </Button>
              <Button
                onClick={() => {
                  const url = `https://www.reddit.com/submit?title=${encodeURIComponent(shareText)}`;
                  window.open(url, '_blank');
                }}
                variant="secondary"
                size="small"
              >
                Reddit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};