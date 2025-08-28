import React, { useState } from 'react';
import { UserPreferences } from '@/types/gaming-hub';
import Button from '@/components/ui/Button';

interface PreferenceCustomizationProps {
  preferences: UserPreferences;
  onUpdate: (preferences: UserPreferences) => void;
}

export const PreferenceCustomization: React.FC<PreferenceCustomizationProps> = ({
  preferences,
  onUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempPreferences, setTempPreferences] = useState(preferences);

  const gameCategories = [
    { id: 'action', name: 'Action', description: 'Fast-paced games' },
    { id: 'puzzle', name: 'Puzzle', description: 'Brain teasers and logic games' },
    { id: 'skill', name: 'Skill', description: 'Games that test abilities' },
    { id: 'multiplayer', name: 'Multiplayer', description: 'Play with others' },
    { id: 'casual', name: 'Casual', description: 'Relaxed gaming' },
    { id: 'strategy', name: 'Strategy', description: 'Planning and tactics' },
    { id: 'arcade', name: 'Arcade', description: 'Classic arcade style' },
    { id: 'simulation', name: 'Simulation', description: 'Real-world simulations' },
  ];

  const musicGenres = [
    { id: 'electronic', name: 'Electronic', description: 'EDM, techno, house' },
    { id: 'ambient', name: 'Ambient', description: 'Atmospheric, relaxing' },
    { id: 'rock', name: 'Rock', description: 'Classic and modern rock' },
    { id: 'jazz', name: 'Jazz', description: 'Jazz and blues' },
    { id: 'classical', name: 'Classical', description: 'Classical music' },
    { id: 'world', name: 'World', description: 'International music' },
    { id: 'podcast', name: 'Podcasts', description: 'Talk shows and stories' },
    { id: 'lo-fi', name: 'Lo-Fi', description: 'Chill, study music' },
  ];

  const contentTypes = [
    { id: 'drawing', name: 'Drawing', description: 'Digital art and sketching' },
    { id: 'meme', name: 'Memes', description: 'Funny image creation' },
    { id: 'music', name: 'Music Creation', description: 'Making beats and songs' },
    { id: 'video', name: 'Video', description: 'Video editing and creation' },
    { id: 'writing', name: 'Writing', description: 'Text and story creation' },
    { id: 'animation', name: 'Animation', description: 'Moving graphics' },
  ];

  const themes = [
    { id: 'light', name: 'Light', description: 'Clean, bright interface' },
    { id: 'dark', name: 'Dark', description: 'Easy on the eyes' },
    { id: 'gaming', name: 'Gaming', description: 'Colorful gaming theme' },
  ];

  const handlePreferenceToggle = (
    category: 'favoriteGames' | 'musicGenres' | 'contentTypes',
    value: string
  ) => {
    const currentList = tempPreferences[category] as string[];
    const updatedList = currentList.includes(value)
      ? currentList.filter(item => item !== value)
      : [...currentList, value];

    setTempPreferences(prev => ({
      ...prev,
      [category]: updatedList,
    }));
  };

  const handleBooleanToggle = (key: keyof UserPreferences) => {
    setTempPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'gaming') => {
    setTempPreferences(prev => ({
      ...prev,
      theme,
    }));
  };

  const handleSave = () => {
    onUpdate(tempPreferences);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setTempPreferences(preferences);
  };

  const handleClearAll = () => {
    setTempPreferences({
      favoriteGames: [],
      musicGenres: [],
      contentTypes: [],
      chatEnabled: true,
      achievementsVisible: true,
      autoScreenshot: false,
      theme: 'gaming',
    });
  };

  if (!isExpanded) {
    return (
      <div className="preferences-collapsed">
        <div className="preferences-summary">
          <h4>Preferences</h4>
          <div className="preference-counts">
            <span>{preferences.favoriteGames.length} games</span>
            <span>{preferences.musicGenres.length} music</span>
            <span>{preferences.contentTypes.length} content</span>
          </div>
          <Button
            onClick={() => setIsExpanded(true)}
            variant="secondary"
            size="small"
          >
            Customize
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="preference-customization">
      <div className="preferences-header">
        <h3>Customize Your Experience</h3>
        <Button
          onClick={() => setIsExpanded(false)}
          variant="secondary"
          size="small"
        >
          ✕
        </Button>
      </div>

      <div className="preferences-content">
        <div className="preference-section">
          <h4>Game Preferences</h4>
          <p>Select game types you enjoy:</p>
          <div className="preference-grid">
            {gameCategories.map((category) => (
              <div
                key={category.id}
                className={`preference-item ${
                  tempPreferences.favoriteGames.includes(category.id) ? 'selected' : ''
                }`}
                onClick={() => handlePreferenceToggle('favoriteGames', category.id)}
              >
                <h5>{category.name}</h5>
                <p>{category.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="preference-section">
          <h4>Music Preferences</h4>
          <p>Choose your favorite music genres:</p>
          <div className="preference-grid">
            {musicGenres.map((genre) => (
              <div
                key={genre.id}
                className={`preference-item ${
                  tempPreferences.musicGenres.includes(genre.id) ? 'selected' : ''
                }`}
                onClick={() => handlePreferenceToggle('musicGenres', genre.id)}
              >
                <h5>{genre.name}</h5>
                <p>{genre.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="preference-section">
          <h4>Content Creation</h4>
          <p>Select content types you're interested in:</p>
          <div className="preference-grid">
            {contentTypes.map((type) => (
              <div
                key={type.id}
                className={`preference-item ${
                  tempPreferences.contentTypes.includes(type.id) ? 'selected' : ''
                }`}
                onClick={() => handlePreferenceToggle('contentTypes', type.id)}
              >
                <h5>{type.name}</h5>
                <p>{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="preference-section">
          <h4>Interface Settings</h4>
          <div className="setting-toggles">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={tempPreferences.chatEnabled}
                  onChange={() => handleBooleanToggle('chatEnabled')}
                />
                <span>Enable chat in games</span>
              </label>
              <p>Show multiplayer chat interface</p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={tempPreferences.achievementsVisible}
                  onChange={() => handleBooleanToggle('achievementsVisible')}
                />
                <span>Show achievements</span>
              </label>
              <p>Display achievement notifications</p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={tempPreferences.autoScreenshot}
                  onChange={() => handleBooleanToggle('autoScreenshot')}
                />
                <span>Auto-screenshot achievements</span>
              </label>
              <p>Automatically capture screenshots when unlocking achievements</p>
            </div>
          </div>
        </div>

        <div className="preference-section">
          <h4>Theme</h4>
          <div className="theme-selection">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className={`theme-option ${
                  tempPreferences.theme === theme.id ? 'selected' : ''
                }`}
                onClick={() => handleThemeChange(theme.id as any)}
              >
                <div className={`theme-preview theme-${theme.id}`}></div>
                <h5>{theme.name}</h5>
                <p>{theme.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="preferences-actions">
          <div className="primary-actions">
            <Button onClick={handleSave} variant="primary">
              Save Preferences
            </Button>
            <Button onClick={handleReset} variant="secondary">
              Reset Changes
            </Button>
          </div>
          <div className="secondary-actions">
            <Button
              onClick={handleClearAll}
              variant="secondary"
              size="small"
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="preferences-info">
          <h4>Privacy Notice</h4>
          <p>
            Your preferences are stored locally in your browser. No account is required,
            and your data is not shared with external services.
          </p>
        </div>
      </div>
    </div>
  );
};