// Tool integration type definitions

import { BaseEntity, Named, Configurable, UUID, URL, MimeType, Status, Priority } from './common';

export enum ToolCategory {
  IMAGE_EDITOR = 'image-editor',
  CODE_EDITOR = 'code-editor',
  DOCUMENT_EDITOR = 'document-editor',
  AUDIO_EDITOR = 'audio-editor',
  VIDEO_EDITOR = 'video-editor',
  CONVERTER = 'converter',
  OPTIMIZER = 'optimizer',
  COMMUNICATION = 'communication',
  CALCULATOR = 'calculator',
  GAME = 'game',
  UTILITY = 'utility',
  COLLABORATION = 'collaboration'
}

export enum ToolEmbedType {
  IFRAME = 'iframe',
  API = 'api',
  PROXY = 'proxy',
  WIDGET = 'widget',
  POPUP = 'popup'
}

export interface ToolCapability {
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  inputFormats: MimeType[];
  outputFormats: MimeType[];
  async: boolean;
  requiresNetwork: boolean;
  cacheable: boolean;
}

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'select' | 'range';
  required: boolean;
  defaultValue?: any;
  options?: any[];
  min?: number;
  max?: number;
  description?: string;
  validation?: string; // regex pattern
}

export interface ToolConfiguration {
  apiKey?: string;
  baseUrl?: URL;
  timeout?: number;
  retryAttempts?: number;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
  customHeaders?: Record<string, string>;
  proxySettings?: {
    enabled: boolean;
    url?: URL;
    auth?: {
      username: string;
      password: string;
    };
  };
  embedSettings?: {
    width?: string;
    height?: string;
    allowFullscreen?: boolean;
    sandbox?: string[];
    permissions?: string[];
  };
  features?: Record<string, boolean>;
  customCSS?: string;
  customJS?: string;
}

export interface ToolIntegration extends BaseEntity, Named, Configurable<ToolConfiguration> {
  category: ToolCategory;
  url: URL;
  embedType: ToolEmbedType;
  capabilities: ToolCapability[];
  inputFormats: MimeType[];
  outputFormats: MimeType[];
  version: string;
  author: string;
  license: string;
  homepage?: URL;
  documentation?: URL;
  icon?: URL;
  screenshots?: URL[];
  tags: string[];
  popularity: number;
  rating: number;
  isOfflineCapable: boolean;
  requiresAuth: boolean;
  isPremium: boolean;
  pricing?: {
    free: boolean;
    plans: PricingPlan[];
  };
  status: ToolStatus;
  healthCheck?: {
    url: URL;
    interval: number; // in milliseconds
    timeout: number;
    expectedStatus: number;
  };
  fallbackTools?: UUID[];
  dependencies?: string[];
  minimumRequirements?: {
    browser?: string;
    version?: string;
    features?: string[];
  };
}

export interface PricingPlan {
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'one-time';
  features: string[];
  limits?: Record<string, number>;
}

export enum ToolStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

export interface ActiveTool {
  toolId: UUID;
  instanceId: UUID;
  workspaceId: UUID;
  status: Status;
  loadedAt: Date;
  lastUsed: Date;
  currentFile?: UUID;
  settings: Record<string, any>;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
  isMinimized: boolean;
  isMaximized: boolean;
  isDocked: boolean;
  dockPosition?: 'left' | 'right' | 'top' | 'bottom';
}

export interface ToolOperation {
  id: UUID;
  toolId: UUID;
  capability: string;
  parameters: Record<string, any>;
  inputFiles: UUID[];
  outputFiles?: UUID[];
  status: Status;
  priority: Priority;
  progress: number; // 0-100
  startTime: Date;
  endTime?: Date;
  error?: string;
  result?: any;
  retryCount: number;
  maxRetries: number;
}

export interface ToolEvent {
  id: UUID;
  toolId: UUID;
  instanceId?: UUID;
  type: 'loaded' | 'unloaded' | 'error' | 'operation_started' | 'operation_completed' | 'file_processed';
  timestamp: Date;
  data: Record<string, any>;
  userId?: UUID;
  workspaceId?: UUID;
}

export interface ToolHealthStatus {
  toolId: UUID;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
  errorCount: number;
  uptime: number; // percentage
  issues?: string[];
}

export interface ToolUsageStats {
  toolId: UUID;
  totalUsage: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  popularCapabilities: string[];
  errorRate: number;
  performanceMetrics: {
    averageLoadTime: number;
    averageOperationTime: number;
    memoryUsage: number;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface ToolFilter {
  category?: ToolCategory;
  inputFormat?: MimeType;
  outputFormat?: MimeType;
  isOfflineCapable?: boolean;
  requiresAuth?: boolean;
  isPremium?: boolean;
  status?: ToolStatus;
  tags?: string[];
  searchQuery?: string;
  rating?: {
    min: number;
    max: number;
  };
}

export interface ToolSortOptions {
  field: 'name' | 'popularity' | 'rating' | 'created' | 'lastUsed';
  direction: 'asc' | 'desc';
}

// Tool communication interfaces
export interface ToolMessage {
  id: UUID;
  type: 'command' | 'response' | 'event' | 'error';
  source: 'host' | 'tool';
  target: 'host' | 'tool';
  action: string;
  data?: any;
  timestamp: Date;
  correlationId?: UUID;
}

export interface ToolCommand extends ToolMessage {
  type: 'command';
  action: 'load_file' | 'save_file' | 'execute_operation' | 'get_capabilities' | 'configure';
  parameters?: Record<string, any>;
  expectsResponse: boolean;
  timeout?: number;
}

export interface ToolResponse extends ToolMessage {
  type: 'response';
  success: boolean;
  result?: any;
  error?: string;
  correlationId: UUID;
}

export interface ToolRegistry {
  tools: Map<UUID, ToolIntegration>;
  activeTools: Map<UUID, ActiveTool>;
  healthStatus: Map<UUID, ToolHealthStatus>;
  usageStats: Map<UUID, ToolUsageStats>;
}