import React, { useState, useCallback } from 'react';
import { MediaSuiteWorkspace, MediaFile, AudioProject, VideoProject, Playlist } from '@/types/media-suite';
import { Button } from '@/components/ui/Button';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { AudioEditor } from './AudioEditor';
import { VideoEditor } from './VideoEditor';
import { PlaylistManager } from './PlaylistManager';
import { MediaExportSystem } from './MediaExportSystem';
import { ScreenRecorder } from './ScreenRecorder';
import { AmbientAudioMixer } from './AmbientAudioMixer';
import { MediaHosting } from './MediaHosting';

interface MediaProductionSuiteProps {
  workspace: MediaSuiteWorkspace;
  onWorkspaceUpdate: (workspace: MediaSuiteWorkspace) => void;
}

type ActiveTool = 'audio' | 'video' | 'playlist' | 'export' | 'record' | 'ambient' | 'hosting' | null;

export const MediaProductionSuite: React.FC<MediaProductionSuiteProps> = ({
  workspace,
  onWorkspaceUpdate
}) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = useCallback(async (files: File[]) => {
    setIsLoading(true);
    try {
      const mediaFiles: MediaFile[] = [];
      
      for (const file of files) {
        const mediaFile: MediaFile = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type.startsWith('audio/') ? 'audio' : 
                file.type.startsWith('video/') ? 'video' : 'image',
          format: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          metadata: {
            customProperties: {}
          }
        };

        // Extract metadata for audio/video files
        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
          const duration = await getMediaDuration(file);
          mediaFile.duration = duration;
        }

        mediaFiles.push(mediaFile);
      }

      const updatedWorkspace = {
        ...workspace,
        mediaFiles: [...workspace.mediaFiles, ...mediaFiles]
      };

      onWorkspaceUpdate(updatedWorkspace);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspace, onWorkspaceUpdate]);

  const createAudioProject = useCallback(() => {
    const newProject: AudioProject = {
      id: crypto.randomUUID(),
      name: `Audio Project ${workspace.audioProjects.length + 1}`,
      tracks: [],
      effects: [],
      settings: workspace.settings.defaultAudioSettings,
      created: new Date(),
      lastModified: new Date()
    };

    const updatedWorkspace = {
      ...workspace,
      audioProjects: [...workspace.audioProjects, newProject]
    };

    onWorkspaceUpdate(updatedWorkspace);
    setSelectedProject(newProject.id);
    setActiveTool('audio');
  }, [workspace, onWorkspaceUpdate]);

  const createVideoProject = useCallback(() => {
    const newProject: VideoProject = {
      id: crypto.randomUUID(),
      name: `Video Project ${workspace.videoProjects.length + 1}`,
      timeline: [],
      settings: workspace.settings.defaultVideoSettings,
      created: new Date(),
      lastModified: new Date()
    };

    const updatedWorkspace = {
      ...workspace,
      videoProjects: [...workspace.videoProjects, newProject]
    };

    onWorkspaceUpdate(updatedWorkspace);
    setSelectedProject(newProject.id);
    setActiveTool('video');
  }, [workspace, onWorkspaceUpdate]);

  const createPlaylist = useCallback(() => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name: `Playlist ${workspace.playlists.length + 1}`,
      items: [],
      created: new Date(),
      lastModified: new Date()
    };

    const updatedWorkspace = {
      ...workspace,
      playlists: [...workspace.playlists, newPlaylist]
    };

    onWorkspaceUpdate(updatedWorkspace);
    setSelectedProject(newPlaylist.id);
    setActiveTool('playlist');
  }, [workspace, onWorkspaceUpdate]);

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'audio':
        const audioProject = workspace.audioProjects.find(p => p.id === selectedProject);
        return audioProject ? (
          <AudioEditor
            project={audioProject}
            mediaFiles={workspace.mediaFiles}
            onProjectUpdate={(updatedProject) => {
              const updatedWorkspace = {
                ...workspace,
                audioProjects: workspace.audioProjects.map(p => 
                  p.id === updatedProject.id ? updatedProject : p
                )
              };
              onWorkspaceUpdate(updatedWorkspace);
            }}
          />
        ) : null;

      case 'video':
        const videoProject = workspace.videoProjects.find(p => p.id === selectedProject);
        return videoProject ? (
          <VideoEditor
            project={videoProject}
            mediaFiles={workspace.mediaFiles}
            onProjectUpdate={(updatedProject) => {
              const updatedWorkspace = {
                ...workspace,
                videoProjects: workspace.videoProjects.map(p => 
                  p.id === updatedProject.id ? updatedProject : p
                )
              };
              onWorkspaceUpdate(updatedWorkspace);
            }}
          />
        ) : null;

      case 'playlist':
        const playlist = workspace.playlists.find(p => p.id === selectedProject);
        return playlist ? (
          <PlaylistManager
            playlist={playlist}
            onPlaylistUpdate={(updatedPlaylist) => {
              const updatedWorkspace = {
                ...workspace,
                playlists: workspace.playlists.map(p => 
                  p.id === updatedPlaylist.id ? updatedPlaylist : p
                )
              };
              onWorkspaceUpdate(updatedWorkspace);
            }}
          />
        ) : null;

      case 'export':
        return (
          <MediaExportSystem
            workspace={workspace}
            onExport={(exportedFile) => {
              console.log('File exported:', exportedFile);
            }}
          />
        );

      case 'record':
        return (
          <ScreenRecorder
            onRecordingComplete={(recordedFile) => {
              const updatedWorkspace = {
                ...workspace,
                mediaFiles: [...workspace.mediaFiles, recordedFile]
              };
              onWorkspaceUpdate(updatedWorkspace);
            }}
          />
        );

      case 'ambient':
        return <AmbientAudioMixer />;

      case 'hosting':
        return (
          <MediaHosting
            mediaFiles={workspace.mediaFiles}
            onUploadComplete={(url) => {
              console.log('Media uploaded:', url);
            }}
          />
        );

      default:
        return (
          <div className="media-suite-welcome">
            <h2>Media Production Suite</h2>
            <p>Create professional audio and video content with integrated tools</p>
            
            <div className="quick-actions">
              <Button onClick={createAudioProject}>
                New Audio Project
              </Button>
              <Button onClick={createVideoProject}>
                New Video Project
              </Button>
              <Button onClick={createPlaylist}>
                New Playlist
              </Button>
            </div>

            <FileDropZone
              onFilesDropped={handleFileUpload}
              acceptedTypes={['audio/*', 'video/*', 'image/*']}
              maxSize={500 * 1024 * 1024} // 500MB
              loading={isLoading}
            />
          </div>
        );
    }
  };

  return (
    <div className="media-production-suite">
      <div className="media-suite-toolbar">
        <div className="tool-group">
          <Button
            variant={activeTool === 'audio' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('audio')}
          >
            Audio Editor
          </Button>
          <Button
            variant={activeTool === 'video' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('video')}
          >
            Video Editor
          </Button>
          <Button
            variant={activeTool === 'playlist' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('playlist')}
          >
            Playlists
          </Button>
        </div>

        <div className="tool-group">
          <Button
            variant={activeTool === 'record' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('record')}
          >
            Screen Record
          </Button>
          <Button
            variant={activeTool === 'ambient' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('ambient')}
          >
            Ambient Audio
          </Button>
        </div>

        <div className="tool-group">
          <Button
            variant={activeTool === 'export' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('export')}
          >
            Export
          </Button>
          <Button
            variant={activeTool === 'hosting' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('hosting')}
          >
            Upload & Share
          </Button>
        </div>
      </div>

      <div className="media-suite-content">
        {renderActiveTool()}
      </div>
    </div>
  );
};

// Helper function to get media duration
async function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const element = file.type.startsWith('audio/') 
      ? document.createElement('audio')
      : document.createElement('video');
    
    element.src = URL.createObjectURL(file);
    element.onloadedmetadata = () => {
      resolve(element.duration);
      URL.revokeObjectURL(element.src);
    };
    element.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(element.src);
    };
  });
}