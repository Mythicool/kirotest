import React, { useState, useRef } from 'react';
import { VideoProject, MediaFile, VideoClip, VideoEffect } from '@/types/media-suite';
import { Button } from '@/components/ui/Button';

interface VideoEditorProps {
  project: VideoProject;
  mediaFiles: MediaFile[];
  onProjectUpdate: (project: VideoProject) => void;
}

type VideoTool = 'videotoolbox' | 'effects' | null;

export const VideoEditor: React.FC<VideoEditorProps> = ({
  project,
  mediaFiles,
  onProjectUpdate
}) => {
  const [activeTool, setActiveTool] = useState<VideoTool>(null);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoToolboxRef = useRef<HTMLIFrameElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);

  const addClip = (mediaFile: MediaFile) => {
    if (mediaFile.type !== 'video') return;

    const newClip: VideoClip = {
      id: crypto.randomUUID(),
      name: mediaFile.name,
      file: mediaFile,
      startTime: project.timeline.length > 0 
        ? Math.max(...project.timeline.map(c => c.startTime + (c.endTime - c.startTime)))
        : 0,
      endTime: (project.timeline.length > 0 
        ? Math.max(...project.timeline.map(c => c.startTime + (c.endTime - c.startTime)))
        : 0) + (mediaFile.duration || 10),
      trimStart: 0,
      trimEnd: mediaFile.duration || 10,
      effects: []
    };

    const updatedProject = {
      ...project,
      timeline: [...project.timeline, newClip],
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
  };

  const removeClip = (clipId: string) => {
    const updatedProject = {
      ...project,
      timeline: project.timeline.filter(c => c.id !== clipId),
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
  };

  const updateClip = (clipId: string, updates: Partial<VideoClip>) => {
    const updatedProject = {
      ...project,
      timeline: project.timeline.map(c => 
        c.id === clipId ? { ...c, ...updates } : c
      ),
      lastModified: new Date()
    };

    onProjectUpdate(updatedProject);
  };

  const addEffect = (clipId: string, effect: VideoEffect) => {
    const clip = project.timeline.find(c => c.id === clipId);
    if (!clip) return;

    const updatedClip = {
      ...clip,
      effects: [...clip.effects, effect]
    };

    updateClip(clipId, updatedClip);
  };

  const openVideoToolbox = (clipId?: string) => {
    setActiveTool('videotoolbox');
    setSelectedClip(clipId || null);
    
    if (videoToolboxRef.current) {
      videoToolboxRef.current.src = 'https://www.videotoolbox.com/';
    }
  };

  const exportProject = async () => {
    console.log('Exporting video project:', project);
    // Implement video export logic
  };

  const renderTimeline = () => {
    const totalDuration = Math.max(...project.timeline.map(c => c.endTime), 60);
    
    return (
      <div className="video-timeline">
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
          
          <div className="timeline-settings">
            <label>
              Resolution:
              <select
                value={`${project.settings.resolution.width}x${project.settings.resolution.height}`}
                onChange={(e) => {
                  const [width, height] = e.target.value.split('x').map(Number);
                  const updatedProject = {
                    ...project,
                    settings: {
                      ...project.settings,
                      resolution: { width, height }
                    }
                  };
                  onProjectUpdate(updatedProject);
                }}
              >
                <option value="1920x1080">1080p (1920x1080)</option>
                <option value="1280x720">720p (1280x720)</option>
                <option value="854x480">480p (854x480)</option>
                <option value="640x360">360p (640x360)</option>
              </select>
            </label>
            
            <label>
              FPS:
              <select
                value={project.settings.fps}
                onChange={(e) => {
                  const updatedProject = {
                    ...project,
                    settings: {
                      ...project.settings,
                      fps: parseInt(e.target.value)
                    }
                  };
                  onProjectUpdate(updatedProject);
                }}
              >
                <option value="24">24 fps</option>
                <option value="30">30 fps</option>
                <option value="60">60 fps</option>
              </select>
            </label>
          </div>
        </div>

        <div className="clips-container">
          {project.timeline.map((clip, index) => (
            <div key={clip.id} className="video-clip">
              <div className="clip-header">
                <span className="clip-name">{clip.name}</span>
                <div className="clip-controls">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => openVideoToolbox(clip.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => removeClip(clip.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              
              <div className="clip-timeline">
                <div 
                  className="clip-segment"
                  style={{
                    left: `${(clip.startTime / totalDuration) * 100}%`,
                    width: `${((clip.endTime - clip.startTime) / totalDuration) * 100}%`
                  }}
                >
                  <div className="clip-thumbnail">
                    {clip.file.thumbnail && (
                      <img src={clip.file.thumbnail} alt={clip.name} />
                    )}
                  </div>
                  <div className="clip-info">
                    <span>{clip.name}</span>
                    <span>{formatTime(clip.endTime - clip.startTime)}</span>
                  </div>
                </div>
              </div>

              {clip.effects.length > 0 && (
                <div className="clip-effects">
                  {clip.effects.map(effect => (
                    <span key={effect.id} className="effect-tag">
                      {effect.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    return (
      <div className="video-preview">
        <video
          ref={previewRef}
          className="preview-video"
          controls
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        <div className="preview-controls">
          <Button onClick={() => previewRef.current?.play()}>
            Play Preview
          </Button>
          <Button onClick={() => previewRef.current?.pause()}>
            Pause
          </Button>
        </div>
      </div>
    );
  };

  const renderToolInterface = () => {
    switch (activeTool) {
      case 'videotoolbox':
        return (
          <div className="tool-interface">
            <div className="tool-header">
              <h3>VideoToolbox Editor</h3>
              <Button onClick={() => setActiveTool(null)}>Close</Button>
            </div>
            <iframe
              ref={videoToolboxRef}
              className="video-editor-iframe"
              title="VideoToolbox"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        );

      case 'effects':
        return (
          <div className="effects-panel">
            <h3>Video Effects</h3>
            <div className="effects-grid">
              {videoEffects.map(effect => (
                <Button
                  key={effect.type}
                  onClick={() => {
                    if (selectedClip) {
                      addEffect(selectedClip, {
                        id: crypto.randomUUID(),
                        type: effect.type,
                        parameters: effect.defaultParams,
                        enabled: true
                      });
                    }
                  }}
                >
                  {effect.name}
                </Button>
              ))}
            </div>
            <Button onClick={() => setActiveTool(null)}>Close</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="video-editor">
      <div className="video-editor-toolbar">
        <div className="tool-group">
          <Button onClick={() => openVideoToolbox()}>
            VideoToolbox Editor
          </Button>
          <Button onClick={() => setActiveTool('effects')}>
            Add Effects
          </Button>
        </div>

        <div className="tool-group">
          <Button onClick={exportProject} variant="primary">
            Export Project
          </Button>
        </div>
      </div>

      <div className="video-editor-content">
        {activeTool ? renderToolInterface() : (
          <div className="editor-layout">
            <div className="editor-main">
              {renderPreview()}
              {renderTimeline()}
            </div>
            
            <div className="media-library">
              <h3>Video Files</h3>
              <div className="media-grid">
                {mediaFiles
                  .filter(file => file.type === 'video')
                  .map(file => (
                    <div key={file.id} className="media-item">
                      <div className="media-thumbnail">
                        {file.thumbnail && (
                          <img src={file.thumbnail} alt={file.name} />
                        )}
                      </div>
                      <div className="media-info">
                        <span className="media-name">{file.name}</span>
                        <span className="media-duration">
                          {file.duration ? formatTime(file.duration) : 'Unknown'}
                        </span>
                      </div>
                      <Button
                        size="small"
                        onClick={() => addClip(file)}
                      >
                        Add to Timeline
                      </Button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const videoEffects = [
  { type: 'fade-in', name: 'Fade In', defaultParams: { duration: 1 } },
  { type: 'fade-out', name: 'Fade Out', defaultParams: { duration: 1 } },
  { type: 'blur', name: 'Blur', defaultParams: { intensity: 5 } },
  { type: 'brightness', name: 'Brightness', defaultParams: { value: 1.2 } },
  { type: 'contrast', name: 'Contrast', defaultParams: { value: 1.2 } },
  { type: 'saturation', name: 'Saturation', defaultParams: { value: 1.2 } },
  { type: 'sepia', name: 'Sepia', defaultParams: { intensity: 0.8 } },
  { type: 'grayscale', name: 'Grayscale', defaultParams: {} },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}