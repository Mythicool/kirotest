import React, { useState } from 'react';
import { MediaSuiteWorkspace, ExportOptions, MediaFile } from '@/types/media-suite';
import { Button } from '@/components/ui/Button';

interface MediaExportSystemProps {
  workspace: MediaSuiteWorkspace;
  onExport: (exportedFile: MediaFile) => void;
}

type ExportType = 'audio' | 'video' | 'playlist' | 'mix';

export const MediaExportSystem: React.FC<MediaExportSystemProps> = ({
  workspace,
  onExport
}) => {
  const [exportType, setExportType] = useState<ExportType>('audio');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'mp3',
    quality: 'high',
    compression: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const getAvailableFormats = (type: ExportType): string[] => {
    switch (type) {
      case 'audio':
        return ['mp3', 'wav', 'flac', 'aac', 'ogg'];
      case 'video':
        return ['mp4', 'webm', 'avi', 'mov', 'mkv'];
      case 'playlist':
        return ['m3u', 'pls', 'json', 'xml'];
      case 'mix':
        return ['mp3', 'wav', 'json'];
      default:
        return [];
    }
  };

  const getQualityOptions = (type: ExportType): Array<{ value: string; label: string }> => {
    if (type === 'audio' || type === 'mix') {
      return [
        { value: 'low', label: '128 kbps (Small file)' },
        { value: 'medium', label: '192 kbps (Balanced)' },
        { value: 'high', label: '320 kbps (High quality)' },
        { value: 'lossless', label: 'Lossless (Largest file)' }
      ];
    } else if (type === 'video') {
      return [
        { value: 'low', label: '480p (Small file)' },
        { value: 'medium', label: '720p (Balanced)' },
        { value: 'high', label: '1080p (High quality)' },
        { value: 'lossless', label: '4K (Largest file)' }
      ];
    }
    return [{ value: 'high', label: 'Standard' }];
  };

  const exportProject = async () => {
    if (!selectedProject) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      let exportedFile: MediaFile;

      switch (exportType) {
        case 'audio':
          exportedFile = await exportAudioProject();
          break;
        case 'video':
          exportedFile = await exportVideoProject();
          break;
        case 'playlist':
          exportedFile = await exportPlaylist();
          break;
        case 'mix':
          exportedFile = await exportAmbientMix();
          break;
        default:
          throw new Error('Invalid export type');
      }

      onExport(exportedFile);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportAudioProject = async (): Promise<MediaFile> => {
    const project = workspace.audioProjects.find(p => p.id === selectedProject);
    if (!project) throw new Error('Project not found');

    // Simulate audio rendering process
    for (let i = 0; i <= 100; i += 10) {
      setExportProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Create export blob (simplified)
    const audioData = await renderAudioProject(project);
    const blob = new Blob([audioData], { 
      type: `audio/${exportOptions.format}` 
    });

    return {
      id: crypto.randomUUID(),
      name: `${project.name}.${exportOptions.format}`,
      type: 'audio',
      format: `audio/${exportOptions.format}`,
      size: blob.size,
      url: URL.createObjectURL(blob),
      metadata: {
        bitrate: getBitrate(exportOptions.quality),
        customProperties: {
          exported: true,
          originalProject: project.id,
          exportOptions
        }
      }
    };
  };

  const exportVideoProject = async (): Promise<MediaFile> => {
    const project = workspace.videoProjects.find(p => p.id === selectedProject);
    if (!project) throw new Error('Project not found');

    // Simulate video rendering process
    for (let i = 0; i <= 100; i += 5) {
      setExportProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Create export blob (simplified)
    const videoData = await renderVideoProject(project);
    const blob = new Blob([videoData], { 
      type: `video/${exportOptions.format}` 
    });

    return {
      id: crypto.randomUUID(),
      name: `${project.name}.${exportOptions.format}`,
      type: 'video',
      format: `video/${exportOptions.format}`,
      size: blob.size,
      url: URL.createObjectURL(blob),
      metadata: {
        resolution: getResolution(exportOptions.quality),
        fps: project.settings.fps,
        customProperties: {
          exported: true,
          originalProject: project.id,
          exportOptions
        }
      }
    };
  };

  const exportPlaylist = async (): Promise<MediaFile> => {
    const playlist = workspace.playlists.find(p => p.id === selectedProject);
    if (!playlist) throw new Error('Playlist not found');

    setExportProgress(50);
    await new Promise(resolve => setTimeout(resolve, 500));

    let content: string;
    let mimeType: string;

    switch (exportOptions.format) {
      case 'm3u':
        content = generateM3U(playlist);
        mimeType = 'audio/x-mpegurl';
        break;
      case 'pls':
        content = generatePLS(playlist);
        mimeType = 'audio/x-scpls';
        break;
      case 'json':
        content = JSON.stringify(playlist, null, 2);
        mimeType = 'application/json';
        break;
      case 'xml':
        content = generateXML(playlist);
        mimeType = 'application/xml';
        break;
      default:
        throw new Error('Unsupported playlist format');
    }

    setExportProgress(100);

    const blob = new Blob([content], { type: mimeType });

    return {
      id: crypto.randomUUID(),
      name: `${playlist.name}.${exportOptions.format}`,
      type: 'audio',
      format: mimeType,
      size: blob.size,
      url: URL.createObjectURL(blob),
      metadata: {
        customProperties: {
          exported: true,
          originalPlaylist: playlist.id,
          itemCount: playlist.items.length
        }
      }
    };
  };

  const exportAmbientMix = async (): Promise<MediaFile> => {
    // For ambient mix export, we'd need to access the current mix
    // This is a simplified implementation
    setExportProgress(100);

    const mixData = {
      name: 'Ambient Mix',
      sounds: [],
      masterVolume: 0.7
    };

    const content = JSON.stringify(mixData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });

    return {
      id: crypto.randomUUID(),
      name: `Ambient Mix.${exportOptions.format}`,
      type: 'audio',
      format: exportOptions.format === 'json' ? 'application/json' : `audio/${exportOptions.format}`,
      size: blob.size,
      url: URL.createObjectURL(blob),
      metadata: {
        customProperties: {
          exported: true,
          type: 'ambient-mix'
        }
      }
    };
  };

  const getProjectOptions = () => {
    switch (exportType) {
      case 'audio':
        return workspace.audioProjects.map(p => ({ id: p.id, name: p.name }));
      case 'video':
        return workspace.videoProjects.map(p => ({ id: p.id, name: p.name }));
      case 'playlist':
        return workspace.playlists.map(p => ({ id: p.id, name: p.name }));
      case 'mix':
        return [{ id: 'current', name: 'Current Ambient Mix' }];
      default:
        return [];
    }
  };

  return (
    <div className="media-export-system">
      <div className="export-header">
        <h3>Export Media</h3>
        <p>Export your projects in various formats with customizable quality settings</p>
      </div>

      <div className="export-options">
        <div className="option-group">
          <label>Export Type:</label>
          <select
            value={exportType}
            onChange={(e) => {
              setExportType(e.target.value as ExportType);
              setSelectedProject('');
              setExportOptions({
                ...exportOptions,
                format: getAvailableFormats(e.target.value as ExportType)[0]
              });
            }}
            disabled={isExporting}
          >
            <option value="audio">Audio Project</option>
            <option value="video">Video Project</option>
            <option value="playlist">Playlist</option>
            <option value="mix">Ambient Mix</option>
          </select>
        </div>

        <div className="option-group">
          <label>Select Project:</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={isExporting}
          >
            <option value="">Choose a project...</option>
            {getProjectOptions().map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="option-group">
          <label>Format:</label>
          <select
            value={exportOptions.format}
            onChange={(e) => setExportOptions({
              ...exportOptions,
              format: e.target.value
            })}
            disabled={isExporting}
          >
            {getAvailableFormats(exportType).map(format => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="option-group">
          <label>Quality:</label>
          <select
            value={exportOptions.quality}
            onChange={(e) => setExportOptions({
              ...exportOptions,
              quality: e.target.value as ExportOptions['quality']
            })}
            disabled={isExporting}
          >
            {getQualityOptions(exportType).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="option-group">
          <label>
            <input
              type="checkbox"
              checked={exportOptions.compression}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                compression: e.target.checked
              })}
              disabled={isExporting}
            />
            Enable Compression
          </label>
        </div>
      </div>

      {isExporting && (
        <div className="export-progress">
          <h4>Exporting...</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <p>{exportProgress}% complete</p>
        </div>
      )}

      <div className="export-actions">
        <Button
          onClick={exportProject}
          disabled={!selectedProject || isExporting}
          variant="primary"
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>

      <div className="export-info">
        <h4>Export Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>Audio Projects:</strong>
            <p>Export multi-track audio projects as single files with effects applied.</p>
          </div>
          <div className="info-item">
            <strong>Video Projects:</strong>
            <p>Render video timelines with transitions and effects into final video files.</p>
          </div>
          <div className="info-item">
            <strong>Playlists:</strong>
            <p>Export playlists in standard formats compatible with media players.</p>
          </div>
          <div className="info-item">
            <strong>Ambient Mixes:</strong>
            <p>Save ambient audio mixes as audio files or configuration files.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions (simplified implementations)
async function renderAudioProject(project: any): Promise<ArrayBuffer> {
  // In a real implementation, this would render the audio project
  return new ArrayBuffer(1024 * 1024); // 1MB dummy data
}

async function renderVideoProject(project: any): Promise<ArrayBuffer> {
  // In a real implementation, this would render the video project
  return new ArrayBuffer(10 * 1024 * 1024); // 10MB dummy data
}

function generateM3U(playlist: any): string {
  let content = '#EXTM3U\n';
  playlist.items.forEach((item: any) => {
    content += `#EXTINF:${item.duration || -1},${item.title}\n`;
    content += `${item.url}\n`;
  });
  return content;
}

function generatePLS(playlist: any): string {
  let content = '[playlist]\n';
  playlist.items.forEach((item: any, index: number) => {
    content += `File${index + 1}=${item.url}\n`;
    content += `Title${index + 1}=${item.title}\n`;
    content += `Length${index + 1}=${item.duration || -1}\n`;
  });
  content += `NumberOfEntries=${playlist.items.length}\n`;
  content += 'Version=2\n';
  return content;
}

function generateXML(playlist: any): string {
  let content = '<?xml version="1.0" encoding="UTF-8"?>\n';
  content += '<playlist>\n';
  content += `  <name>${playlist.name}</name>\n`;
  playlist.items.forEach((item: any) => {
    content += '  <track>\n';
    content += `    <title>${item.title}</title>\n`;
    content += `    <url>${item.url}</url>\n`;
    content += `    <duration>${item.duration || 0}</duration>\n`;
    content += '  </track>\n';
  });
  content += '</playlist>\n';
  return content;
}

function getBitrate(quality: string): number {
  switch (quality) {
    case 'low': return 128;
    case 'medium': return 192;
    case 'high': return 320;
    case 'lossless': return 1411;
    default: return 192;
  }
}

function getResolution(quality: string): { width: number; height: number } {
  switch (quality) {
    case 'low': return { width: 854, height: 480 };
    case 'medium': return { width: 1280, height: 720 };
    case 'high': return { width: 1920, height: 1080 };
    case 'lossless': return { width: 3840, height: 2160 };
    default: return { width: 1280, height: 720 };
  }
}