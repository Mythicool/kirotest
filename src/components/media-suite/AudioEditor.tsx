import React, { useState, useRef, useEffect } from 'react';
import { AudioProject, MediaFile, AudioTrack, AudioEffect } from '@/types/media-suite';
import { Button } from '@/components/ui/Button';
import { BfxrIntegration } from './BfxrIntegration';
import { AIVocalRemover } from './AIVocalRemover';

interface AudioEditorProps {
  project: AudioProject;
  mediaFiles: MediaFile[];
  onProjectUpdate: (project: AudioProject) => void;
}

type AudioTool = 'twistedweb' | 'filelab' | 'bfxr' | 'vocal-remover' | null;

export const AudioEditor: React.FC<AudioEditorProps> = ({
  project,
  mediaFiles,
  onProjectUpdate
}) => {
  const [activeTool, setActiveTool] = useState<AudioTool>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const twistedWebRef = useRef<HTMLIFrameElement>(null);
  const filelabRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Initialize Web Audio API
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const addTrack = (mediaFile: MediaFile) => {
    if (mediaFile.type !== 'audio') return;

    const newTrack: AudioTrack = {
      id: crypto.randomUUID(),
      name: mediaFile.name,
      file: mediaFile,
      volume: 1.0,
      muted: false,
      effects: [],
      startTime: 0,
      endTime: mediaFile.duration || 0
    };

    const updatedProject = {
      ...project,
      tracks: [...project.tracks, newTrack],
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
  };

  const removeTrack = (trackId: string) => {
    const updatedProject = {
      ...project,
      tracks: project.tracks.filter(t => t.id !== trackId),
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
  };

  const updateTrack = (trackId: string, updates: Partial<AudioTrack>) => {
    const updatedProject = {
      ...project,
      tracks: project.tracks.map(t => 
        t.id === trackId ? { ...t, ...updates } : t
      ),
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
  };

  const addEffect = (trackId: string, effect: AudioEffect) => {
    const track = project.tracks.find(t => t.id === trackId);
    if (!track) return;

    const updatedTrack = {
      ...track,
      effects: [...track.effects, effect]
    };

    updateTrack(trackId, updatedTrack);
  };

  const openTwistedWeb = (trackId?: string) => {
    setActiveTool('twistedweb');
    setSelectedTrack(trackId || null);
    
    // Load TwistedWeb Online in iframe
    if (twistedWebRef.current) {
      twistedWebRef.current.src = 'https://twistedwave.com/online/';
    }
  };

  const openFilelab = (trackId?: string) => {
    setActiveTool('filelab');
    setSelectedTrack(trackId || null);
    
    // Load Filelab Audio Editor in iframe
    if (filelabRef.current) {
      filelabRef.current.src = 'https://www.filelab.com/audio-editor';
    }
  };

  const exportProject = async () => {
    // Implement audio project export logic
    console.log('Exporting audio project:', project);
  };

  const renderTimeline = () => {
    const totalDuration = Math.max(...project.tracks.map(t => t.endTime), 60);
    
    return (
      <div className="audio-timeline">
        <div className="timeline-header">
          <div className="playback-controls">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              variant="primary"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
        </div>

        <div className="tracks-container">
          {project.tracks.map((track, index) => (
            <div key={track.id} className="audio-track">
              <div className="track-header">
                <span className="track-name">{track.name}</span>
                <div className="track-controls">
                  <Button
                    size="small"
                    onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  >
                    {track.muted ? 'Unmute' : 'Mute'}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={track.volume}
                    onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
                  />
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => openTwistedWeb(track.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => removeTrack(track.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              
              <div className="track-waveform">
                <div 
                  className="waveform-clip"
                  style={{
                    left: `${(track.startTime / totalDuration) * 100}%`,
                    width: `${((track.endTime - track.startTime) / totalDuration) * 100}%`
                  }}
                >
                  {track.file.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderToolInterface = () => {
    switch (activeTool) {
      case 'twistedweb':
        return (
          <div className="tool-interface">
            <div className="tool-header">
              <h3>TwistedWeb Online Audio Editor</h3>
              <Button onClick={() => setActiveTool(null)}>Close</Button>
            </div>
            <iframe
              ref={twistedWebRef}
              className="audio-editor-iframe"
              title="TwistedWeb Online"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        );

      case 'filelab':
        return (
          <div className="tool-interface">
            <div className="tool-header">
              <h3>Filelab Audio Editor</h3>
              <Button onClick={() => setActiveTool(null)}>Close</Button>
            </div>
            <iframe
              ref={filelabRef}
              className="audio-editor-iframe"
              title="Filelab Audio Editor"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        );

      case 'bfxr':
        return (
          <BfxrIntegration
            onSoundGenerated={(audioFile) => {
              addTrack(audioFile);
              setActiveTool(null);
            }}
            onClose={() => setActiveTool(null)}
          />
        );

      case 'vocal-remover':
        return (
          <AIVocalRemover
            tracks={project.tracks}
            onProcessComplete={(processedTrack) => {
              addTrack(processedTrack.file);
              setActiveTool(null);
            }}
            onClose={() => setActiveTool(null)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="audio-editor">
      <div className="audio-editor-toolbar">
        <div className="tool-group">
          <Button onClick={() => openTwistedWeb()}>
            TwistedWeb Editor
          </Button>
          <Button onClick={() => openFilelab()}>
            Filelab Editor
          </Button>
        </div>

        <div className="tool-group">
          <Button onClick={() => setActiveTool('bfxr')}>
            Sound Effects (bfxr)
          </Button>
          <Button onClick={() => setActiveTool('vocal-remover')}>
            AI Vocal Remover
          </Button>
        </div>

        <div className="tool-group">
          <Button onClick={exportProject} variant="primary">
            Export Project
          </Button>
        </div>
      </div>

      <div className="audio-editor-content">
        {activeTool ? renderToolInterface() : (
          <>
            {renderTimeline()}
            
            <div className="media-library">
              <h3>Audio Files</h3>
              <div className="media-grid">
                {mediaFiles
                  .filter(file => file.type === 'audio')
                  .map(file => (
                    <div key={file.id} className="media-item">
                      <div className="media-info">
                        <span className="media-name">{file.name}</span>
                        <span className="media-duration">
                          {file.duration ? formatTime(file.duration) : 'Unknown'}
                        </span>
                      </div>
                      <Button
                        size="small"
                        onClick={() => addTrack(file)}
                      >
                        Add to Timeline
                      </Button>
                    </div>
                  ))
                }
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}