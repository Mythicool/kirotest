import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface AmbientSound {
  id: string;
  name: string;
  category: string;
  url: string;
  volume: number;
  loop: boolean;
  playing: boolean;
}

interface AmbientMix {
  id: string;
  name: string;
  sounds: AmbientSound[];
  masterVolume: number;
}

export const AmbientAudioMixer: React.FC = () => {
  const [currentMix, setCurrentMix] = useState<AmbientMix>({
    id: crypto.randomUUID(),
    name: 'New Mix',
    sounds: [],
    masterVolume: 0.7
  });
  const [availableSounds, setAvailableSounds] = useState<AmbientSound[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useAmbientMixer, setUseAmbientMixer] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const ambientMixerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Initialize Web Audio API
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Load default ambient sounds
    loadDefaultSounds();

    return () => {
      // Cleanup audio elements
      audioElementsRef.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioElementsRef.current.clear();
    };
  }, []);

  const loadDefaultSounds = () => {
    const defaultSounds: AmbientSound[] = [
      // Nature sounds
      { id: '1', name: 'Rain', category: 'Nature', url: '/sounds/rain.mp3', volume: 0.5, loop: true, playing: false },
      { id: '2', name: 'Forest', category: 'Nature', url: '/sounds/forest.mp3', volume: 0.5, loop: true, playing: false },
      { id: '3', name: 'Ocean Waves', category: 'Nature', url: '/sounds/ocean.mp3', volume: 0.5, loop: true, playing: false },
      { id: '4', name: 'Thunderstorm', category: 'Nature', url: '/sounds/thunder.mp3', volume: 0.5, loop: true, playing: false },
      { id: '5', name: 'Wind', category: 'Nature', url: '/sounds/wind.mp3', volume: 0.5, loop: true, playing: false },
      
      // Urban sounds
      { id: '6', name: 'City Traffic', category: 'Urban', url: '/sounds/traffic.mp3', volume: 0.3, loop: true, playing: false },
      { id: '7', name: 'Coffee Shop', category: 'Urban', url: '/sounds/coffeeshop.mp3', volume: 0.4, loop: true, playing: false },
      { id: '8', name: 'Library', category: 'Urban', url: '/sounds/library.mp3', volume: 0.3, loop: true, playing: false },
      
      // Ambient tones
      { id: '9', name: 'White Noise', category: 'Tones', url: '/sounds/whitenoise.mp3', volume: 0.4, loop: true, playing: false },
      { id: '10', name: 'Pink Noise', category: 'Tones', url: '/sounds/pinknoise.mp3', volume: 0.4, loop: true, playing: false },
      { id: '11', name: 'Brown Noise', category: 'Tones', url: '/sounds/brownnoise.mp3', volume: 0.4, loop: true, playing: false },
      
      // Instrumental
      { id: '12', name: 'Piano Ambient', category: 'Instrumental', url: '/sounds/piano-ambient.mp3', volume: 0.6, loop: true, playing: false },
      { id: '13', name: 'Meditation Bells', category: 'Instrumental', url: '/sounds/bells.mp3', volume: 0.5, loop: true, playing: false },
    ];

    setAvailableSounds(defaultSounds);
  };

  const addSoundToMix = (sound: AmbientSound) => {
    if (currentMix.sounds.find(s => s.id === sound.id)) return;

    const updatedMix = {
      ...currentMix,
      sounds: [...currentMix.sounds, { ...sound }]
    };

    setCurrentMix(updatedMix);
  };

  const removeSoundFromMix = (soundId: string) => {
    // Stop the sound if playing
    const audioElement = audioElementsRef.current.get(soundId);
    if (audioElement) {
      audioElement.pause();
      audioElementsRef.current.delete(soundId);
    }

    const updatedMix = {
      ...currentMix,
      sounds: currentMix.sounds.filter(s => s.id !== soundId)
    };

    setCurrentMix(updatedMix);
  };

  const updateSoundVolume = (soundId: string, volume: number) => {
    const updatedMix = {
      ...currentMix,
      sounds: currentMix.sounds.map(s => 
        s.id === soundId ? { ...s, volume } : s
      )
    };

    setCurrentMix(updatedMix);

    // Update audio element volume
    const audioElement = audioElementsRef.current.get(soundId);
    if (audioElement) {
      audioElement.volume = volume * currentMix.masterVolume;
    }
  };

  const toggleSound = async (soundId: string) => {
    const sound = currentMix.sounds.find(s => s.id === soundId);
    if (!sound) return;

    let audioElement = audioElementsRef.current.get(soundId);
    
    if (!audioElement) {
      audioElement = new Audio(sound.url);
      audioElement.loop = sound.loop;
      audioElement.volume = sound.volume * currentMix.masterVolume;
      audioElementsRef.current.set(soundId, audioElement);
    }

    if (sound.playing) {
      audioElement.pause();
    } else {
      try {
        await audioElement.play();
      } catch (error) {
        console.error('Error playing sound:', error);
        return;
      }
    }

    const updatedMix = {
      ...currentMix,
      sounds: currentMix.sounds.map(s => 
        s.id === soundId ? { ...s, playing: !s.playing } : s
      )
    };

    setCurrentMix(updatedMix);
  };

  const playAllSounds = async () => {
    setIsPlaying(true);
    
    for (const sound of currentMix.sounds) {
      if (!sound.playing) {
        await toggleSound(sound.id);
      }
    }
  };

  const stopAllSounds = () => {
    setIsPlaying(false);
    
    currentMix.sounds.forEach(sound => {
      if (sound.playing) {
        toggleSound(sound.id);
      }
    });
  };

  const updateMasterVolume = (volume: number) => {
    const updatedMix = {
      ...currentMix,
      masterVolume: volume
    };

    setCurrentMix(updatedMix);

    // Update all audio element volumes
    audioElementsRef.current.forEach((audioElement, soundId) => {
      const sound = currentMix.sounds.find(s => s.id === soundId);
      if (sound) {
        audioElement.volume = sound.volume * volume;
      }
    });
  };

  const saveMix = () => {
    const mixData = {
      name: currentMix.name,
      sounds: currentMix.sounds.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        volume: s.volume,
        loop: s.loop
      })),
      masterVolume: currentMix.masterVolume
    };

    const blob = new Blob([JSON.stringify(mixData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMix.name}.ambientmix`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const loadAmbientMixer = () => {
    setUseAmbientMixer(true);
    if (ambientMixerRef.current) {
      ambientMixerRef.current.src = 'https://www.ambient-mixer.com/';
    }
  };

  const groupedSounds = availableSounds.reduce((groups, sound) => {
    if (!groups[sound.category]) {
      groups[sound.category] = [];
    }
    groups[sound.category].push(sound);
    return groups;
  }, {} as Record<string, AmbientSound[]>);

  if (useAmbientMixer) {
    return (
      <div className="ambient-mixer-integration">
        <div className="mixer-header">
          <h3>Ambient Mixer</h3>
          <Button onClick={() => setUseAmbientMixer(false)}>
            Back to Simple Mixer
          </Button>
        </div>
        
        <iframe
          ref={ambientMixerRef}
          className="ambient-mixer-iframe"
          title="Ambient Mixer"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    );
  }

  return (
    <div className="ambient-audio-mixer">
      <div className="mixer-header">
        <div className="mix-info">
          <input
            type="text"
            value={currentMix.name}
            onChange={(e) => setCurrentMix({
              ...currentMix,
              name: e.target.value
            })}
            className="mix-name"
          />
        </div>

        <div className="mixer-controls">
          <Button onClick={loadAmbientMixer}>
            Use Ambient Mixer
          </Button>
          <Button onClick={saveMix}>
            Save Mix
          </Button>
        </div>
      </div>

      <div className="master-controls">
        <div className="master-volume">
          <label>Master Volume:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={currentMix.masterVolume}
            onChange={(e) => updateMasterVolume(parseFloat(e.target.value))}
          />
          <span>{Math.round(currentMix.masterVolume * 100)}%</span>
        </div>

        <div className="playback-controls">
          <Button onClick={playAllSounds} disabled={isPlaying}>
            Play All
          </Button>
          <Button onClick={stopAllSounds} disabled={!isPlaying}>
            Stop All
          </Button>
        </div>
      </div>

      <div className="mixer-content">
        <div className="current-mix">
          <h3>Current Mix ({currentMix.sounds.length} sounds)</h3>
          <div className="mix-sounds">
            {currentMix.sounds.map(sound => (
              <div key={sound.id} className="mix-sound">
                <div className="sound-info">
                  <span className="sound-name">{sound.name}</span>
                  <span className="sound-category">{sound.category}</span>
                </div>
                
                <div className="sound-controls">
                  <Button
                    size="small"
                    onClick={() => toggleSound(sound.id)}
                    variant={sound.playing ? 'primary' : 'secondary'}
                  >
                    {sound.playing ? 'Stop' : 'Play'}
                  </Button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={sound.volume}
                    onChange={(e) => updateSoundVolume(sound.id, parseFloat(e.target.value))}
                    className="volume-slider"
                  />
                  
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => removeSoundFromMix(sound.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="available-sounds">
          <h3>Available Sounds</h3>
          {Object.entries(groupedSounds).map(([category, sounds]) => (
            <div key={category} className="sound-category">
              <h4>{category}</h4>
              <div className="sounds-grid">
                {sounds.map(sound => (
                  <div key={sound.id} className="available-sound">
                    <span className="sound-name">{sound.name}</span>
                    <Button
                      size="small"
                      onClick={() => addSoundToMix(sound)}
                      disabled={currentMix.sounds.some(s => s.id === sound.id)}
                    >
                      {currentMix.sounds.some(s => s.id === sound.id) ? 'Added' : 'Add'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mixer-tips">
        <h4>Tips for Creating Ambient Mixes</h4>
        <ul>
          <li>Layer different types of sounds for depth</li>
          <li>Keep nature sounds at moderate volumes</li>
          <li>Use white/pink noise as a base layer</li>
          <li>Adjust individual volumes to create the perfect balance</li>
          <li>Save your favorite mixes for later use</li>
        </ul>
      </div>
    </div>
  );
};