import React, { useState, useRef } from 'react';
import { MusicCreationProject, AudioTrack, SoundEffect } from '@/types/gaming-hub';
import Button from '@/components/ui/Button';

interface MusicCreationToolsProps {
  projects: MusicCreationProject[];
  onProjectCreate: (project: MusicCreationProject) => void;
}

export const MusicCreationTools: React.FC<MusicCreationToolsProps> = ({
  projects,
  onProjectCreate,
}) => {
  const [activeProject, setActiveProject] = useState<MusicCreationProject | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const musicTools = [
    {
      id: 'beepbox',
      name: 'BeepBox',
      description: 'Chiptune music maker with sequencer',
      url: 'https://www.beepbox.co',
      features: ['Chiptune sounds', 'Pattern sequencer', 'Export options'],
      category: 'sequencer',
    },
    {
      id: 'soundtrap',
      name: 'Soundtrap',
      description: 'Online music studio by Spotify',
      url: 'https://www.soundtrap.com',
      features: ['Multitrack recording', 'Virtual instruments', 'Effects'],
      category: 'daw',
    },
    {
      id: 'bandlab',
      name: 'BandLab',
      description: 'Free online music creation platform',
      url: 'https://www.bandlab.com',
      features: ['Collaboration', 'Cloud storage', 'Mobile app'],
      category: 'daw',
    },
    {
      id: 'chrome-music-lab',
      name: 'Chrome Music Lab',
      description: 'Interactive music experiments',
      url: 'https://musiclab.chromeexperiments.com',
      features: ['Educational', 'Interactive', 'No signup'],
      category: 'experimental',
    },
  ];

  const soundEffectTools = [
    {
      id: 'sfxr',
      name: 'sfxr',
      description: 'Retro sound effect generator',
      url: 'https://sfxr.me',
      type: 'generator',
    },
    {
      id: 'freesound',
      name: 'Freesound',
      description: 'Collaborative sound library',
      url: 'https://freesound.org',
      type: 'library',
    },
    {
      id: 'zapsplat',
      name: 'Zapsplat',
      description: 'Sound effects library',
      url: 'https://www.zapsplat.com',
      type: 'library',
    },
  ];

  const handleCreateProject = () => {
    const newProject: MusicCreationProject = {
      id: `project-${Date.now()}`,
      name: `New Project ${projects.length + 1}`,
      tracks: [],
      effects: [],
      tempo: 120,
      duration: 0,
      lastModified: new Date(),
    };

    setActiveProject(newProject);
    onProjectCreate(newProject);
  };

  const handleToolSelect = (tool: any) => {
    setSelectedTool(tool.id);
    // Open tool in new window/tab
    window.open(tool.url, '_blank', 'width=1200,height=800');
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        if (activeProject) {
          const newTrack: AudioTrack = {
            id: `track-${Date.now()}`,
            name: `Recording ${activeProject.tracks.length + 1}`,
            audioData: arrayBuffer,
            volume: 1.0,
            startTime: 0,
            duration: audioBlob.size / 44100, // Approximate duration
            effects: [],
          };

          const updatedProject = {
            ...activeProject,
            tracks: [...activeProject.tracks, newTrack],
            lastModified: new Date(),
          };

          setActiveProject(updatedProject);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAddSoundEffect = (effectType: string) => {
    if (activeProject) {
      const newEffect: SoundEffect = {
        id: `effect-${Date.now()}`,
        name: effectType,
        type: effectType as any,
        parameters: {},
      };

      const updatedProject = {
        ...activeProject,
        effects: [...activeProject.effects, newEffect],
        lastModified: new Date(),
      };

      setActiveProject(updatedProject);
    }
  };

  const handleExportProject = () => {
    if (activeProject) {
      // In a real implementation, this would render the audio
      console.log('Exporting project:', activeProject);
      alert('Export functionality would be implemented here');
    }
  };

  return (
    <div className="music-creation-tools">
      <div className="tools-header">
        <h3>Music Creation Studio</h3>
        <div className="header-actions">
          <Button onClick={handleCreateProject} variant="primary">
            New Project
          </Button>
          {activeProject && (
            <Button onClick={handleExportProject} variant="secondary">
              Export Project
            </Button>
          )}
        </div>
      </div>

      <div className="tools-content">
        <div className="external-tools">
          <h4>Music Creation Tools</h4>
          <div className="tool-grid">
            {musicTools.map((tool) => (
              <div key={tool.id} className="tool-card">
                <div className="tool-header">
                  <h5>{tool.name}</h5>
                  <span className="tool-category">{tool.category}</span>
                </div>
                <p>{tool.description}</p>
                <div className="tool-features">
                  {tool.features.map((feature, index) => (
                    <span key={index} className="feature-tag">
                      {feature}
                    </span>
                  ))}
                </div>
                <Button
                  onClick={() => handleToolSelect(tool)}
                  variant={selectedTool === tool.id ? 'primary' : 'secondary'}
                >
                  {selectedTool === tool.id ? 'Active' : 'Open Tool'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="sound-effects">
          <h4>Sound Effects</h4>
          <div className="effect-tools">
            {soundEffectTools.map((tool) => (
              <div key={tool.id} className="effect-tool">
                <h5>{tool.name}</h5>
                <p>{tool.description}</p>
                <span className="tool-type">{tool.type}</span>
                <Button
                  onClick={() => window.open(tool.url, '_blank')}
                  variant="secondary"
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        </div>

        {activeProject && (
          <div className="project-workspace">
            <div className="project-header">
              <h4>{activeProject.name}</h4>
              <div className="project-controls">
                <label>
                  Tempo:
                  <input
                    type="number"
                    value={activeProject.tempo}
                    onChange={(e) => {
                      const updatedProject = {
                        ...activeProject,
                        tempo: parseInt(e.target.value),
                        lastModified: new Date(),
                      };
                      setActiveProject(updatedProject);
                    }}
                    min="60"
                    max="200"
                  />
                  BPM
                </label>
              </div>
            </div>

            <div className="recording-section">
              <h5>Audio Recording</h5>
              <div className="recording-controls">
                {!isRecording ? (
                  <Button onClick={handleStartRecording} variant="primary">
                    🎤 Start Recording
                  </Button>
                ) : (
                  <Button onClick={handleStopRecording} variant="secondary">
                    ⏹️ Stop Recording
                  </Button>
                )}
                {isRecording && (
                  <div className="recording-indicator">
                    <span className="recording-dot"></span>
                    Recording...
                  </div>
                )}
              </div>
            </div>

            <div className="tracks-section">
              <h5>Tracks ({activeProject.tracks.length})</h5>
              {activeProject.tracks.length === 0 ? (
                <p>No tracks yet. Record some audio or import from external tools.</p>
              ) : (
                <div className="track-list">
                  {activeProject.tracks.map((track, index) => (
                    <div key={track.id} className="track-item">
                      <span className="track-number">{index + 1}</span>
                      <div className="track-info">
                        <h6>{track.name}</h6>
                        <p>Duration: {Math.round(track.duration)}s</p>
                      </div>
                      <div className="track-controls">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={track.volume}
                          onChange={(e) => {
                            const updatedTracks = activeProject.tracks.map(t =>
                              t.id === track.id
                                ? { ...t, volume: parseFloat(e.target.value) }
                                : t
                            );
                            setActiveProject({
                              ...activeProject,
                              tracks: updatedTracks,
                              lastModified: new Date(),
                            });
                          }}
                        />
                        <span>{Math.round(track.volume * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="effects-section">
              <h5>Effects</h5>
              <div className="effect-controls">
                <Button
                  onClick={() => handleAddSoundEffect('reverb')}
                  variant="secondary"
                  size="small"
                >
                  Add Reverb
                </Button>
                <Button
                  onClick={() => handleAddSoundEffect('delay')}
                  variant="secondary"
                  size="small"
                >
                  Add Delay
                </Button>
                <Button
                  onClick={() => handleAddSoundEffect('distortion')}
                  variant="secondary"
                  size="small"
                >
                  Add Distortion
                </Button>
              </div>
              {activeProject.effects.length > 0 && (
                <div className="active-effects">
                  {activeProject.effects.map((effect) => (
                    <div key={effect.id} className="effect-item">
                      <span>{effect.name}</span>
                      <Button
                        onClick={() => {
                          const updatedEffects = activeProject.effects.filter(
                            e => e.id !== effect.id
                          );
                          setActiveProject({
                            ...activeProject,
                            effects: updatedEffects,
                            lastModified: new Date(),
                          });
                        }}
                        variant="secondary"
                        size="small"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div className="project-list">
            <h4>Your Projects</h4>
            <div className="projects-grid">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`project-card ${
                    activeProject?.id === project.id ? 'active' : ''
                  }`}
                >
                  <h5>{project.name}</h5>
                  <p>{project.tracks.length} tracks</p>
                  <p>Modified: {project.lastModified.toLocaleDateString()}</p>
                  <Button
                    onClick={() => setActiveProject(project)}
                    variant={activeProject?.id === project.id ? 'primary' : 'secondary'}
                  >
                    {activeProject?.id === project.id ? 'Active' : 'Open'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};