export interface MediaFile {
  id: string;
  name: string;
  type: 'audio' | 'video' | 'image';
  format: string;
  size: number;
  duration?: number;
  url: string;
  thumbnail?: string;
  metadata: MediaMetadata;
}

export interface MediaMetadata {
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  resolution?: { width: number; height: number };
  fps?: number;
  codec?: string;
  customProperties: Record<string, any>;
}

export interface AudioProject {
  id: string;
  name: string;
  tracks: AudioTrack[];
  effects: AudioEffect[];
  settings: AudioSettings;
  created: Date;
  lastModified: Date;
}

export interface AudioTrack {
  id: string;
  name: string;
  file: MediaFile;
  volume: number;
  muted: boolean;
  effects: AudioEffect[];
  startTime: number;
  endTime: number;
}

export interface AudioEffect {
  id: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface AudioSettings {
  sampleRate: number;
  bitDepth: number;
  channels: number;
  format: string;
}

export interface VideoProject {
  id: string;
  name: string;
  timeline: VideoClip[];
  settings: VideoSettings;
  created: Date;
  lastModified: Date;
}

export interface VideoClip {
  id: string;
  name: string;
  file: MediaFile;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  effects: VideoEffect[];
}

export interface VideoEffect {
  id: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface VideoSettings {
  resolution: { width: number; height: number };
  fps: number;
  bitrate: number;
  codec: string;
  format: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  created: Date;
  lastModified: Date;
}

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  order: number;
}

export interface ExportOptions {
  format: string;
  quality: 'low' | 'medium' | 'high' | 'lossless';
  compression: boolean;
  customSettings?: Record<string, any>;
}

export interface MediaHostingOptions {
  service: 'clyp' | 'sendvid' | 'local';
  privacy: 'public' | 'unlisted' | 'private';
  title?: string;
  description?: string;
}

export interface ScreenRecordingOptions {
  source: 'screen' | 'window' | 'tab';
  audio: boolean;
  quality: 'low' | 'medium' | 'high';
  fps: number;
}

export interface MediaSuiteWorkspace {
  id: string;
  type: 'media-suite';
  audioProjects: AudioProject[];
  videoProjects: VideoProject[];
  playlists: Playlist[];
  mediaFiles: MediaFile[];
  settings: MediaSuiteSettings;
}

export interface MediaSuiteSettings {
  defaultAudioSettings: AudioSettings;
  defaultVideoSettings: VideoSettings;
  autoSave: boolean;
  exportPath: string;
  integrations: {
    twistedWeb: boolean;
    filelab: boolean;
    bfxr: boolean;
    aiVocalRemover: boolean;
    videoToolbox: boolean;
    vileo: boolean;
    youtubePlaylists: boolean;
    ambientMixer: boolean;
    clyp: boolean;
    sendvid: boolean;
  };
}