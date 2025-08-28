export interface GameSession {
  id: string;
  gameType: 'typeracer' | 'agar' | 'browser-game';
  gameUrl: string;
  startTime: Date;
  score?: number;
  achievements: Achievement[];
  duration?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  gameType: string;
  value?: number;
}

export interface MusicStream {
  id: string;
  title: string;
  artist?: string;
  url: string;
  type: 'radio' | 'podcast' | 'playlist';
  genre?: string;
  duration?: number;
  isPlaying: boolean;
}

export interface ContentCreationTool {
  id: string;
  name: string;
  type: 'drawing' | 'meme' | 'music';
  url?: string;
  capabilities: string[];
  outputFormats: string[];
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  gameSession?: string;
  type: 'text' | 'achievement' | 'system';
}

export interface UserPreferences {
  favoriteGames: string[];
  musicGenres: string[];
  contentTypes: string[];
  chatEnabled: boolean;
  achievementsVisible: boolean;
  autoScreenshot: boolean;
  theme: 'light' | 'dark' | 'gaming';
}

export interface RecommendationEngine {
  gameRecommendations: GameRecommendation[];
  musicRecommendations: MusicRecommendation[];
  contentRecommendations: ContentRecommendation[];
}

export interface GameRecommendation {
  gameId: string;
  title: string;
  description: string;
  url: string;
  score: number;
  reason: string;
  category: string;
}

export interface MusicRecommendation {
  streamId: string;
  title: string;
  artist?: string;
  genre: string;
  url: string;
  score: number;
  reason: string;
}

export interface ContentRecommendation {
  toolId: string;
  name: string;
  type: string;
  description: string;
  score: number;
  reason: string;
}

export interface ScreenshotCapture {
  id: string;
  gameSession: string;
  imageData: string;
  timestamp: Date;
  achievement?: Achievement;
  shared: boolean;
}

export interface MusicCreationProject {
  id: string;
  name: string;
  tracks: AudioTrack[];
  effects: SoundEffect[];
  tempo: number;
  duration: number;
  lastModified: Date;
}

export interface AudioTrack {
  id: string;
  name: string;
  audioData: ArrayBuffer;
  volume: number;
  startTime: number;
  duration: number;
  effects: string[];
}

export interface SoundEffect {
  id: string;
  name: string;
  type: 'reverb' | 'delay' | 'distortion' | 'filter';
  parameters: Record<string, number>;
}

export interface GamingHubState {
  activeGame?: GameSession;
  musicPlayer: {
    currentStream?: MusicStream;
    queue: MusicStream[];
    volume: number;
    isPlaying: boolean;
  };
  chat: {
    messages: ChatMessage[];
    activeUsers: string[];
    enabled: boolean;
  };
  achievements: Achievement[];
  preferences: UserPreferences;
  recommendations: RecommendationEngine;
  screenshots: ScreenshotCapture[];
  musicProjects: MusicCreationProject[];
}