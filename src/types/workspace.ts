// Workspace-related type definitions

import { BaseEntity, Named, Configurable, UUID } from './common';
import { FileReference } from './file';
import { ActiveTool } from './tool';

export enum WorkspaceType {
  CREATIVE_STUDIO = 'creative-studio',
  DEVELOPER_HUB = 'developer-hub',
  DOCUMENT_PIPELINE = 'document-pipeline',
  MEDIA_SUITE = 'media-suite',
  PRIVACY_HUB = 'privacy-hub',
  EDUCATION_PLATFORM = 'education-platform',
  BUSINESS_SUITE = 'business-suite',
  GAMING_HUB = 'gaming-hub'
}

export interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  autoSaveInterval: number; // in milliseconds
  maxFileSize: number; // in bytes
  enableCollaboration: boolean;
  enableOfflineMode: boolean;
  preferredTools: Record<string, string>; // file type -> tool id mapping
  customShortcuts: Record<string, string>;
  privacy: {
    allowAnalytics: boolean;
    allowCrashReporting: boolean;
    shareUsageData: boolean;
  };
}

export interface Collaborator {
  id: UUID;
  name: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  permissions: CollaboratorPermissions;
}

export interface CollaboratorPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canInvite: boolean;
  canChangeSettings: boolean;
}

export interface WorkspaceSnapshot {
  id: UUID;
  workspaceId: UUID;
  name: string;
  description?: string;
  created: Date;
  fileCount: number;
  totalSize: number;
  metadata: Record<string, any>;
}

export interface WorkspaceStats {
  totalFiles: number;
  totalSize: number;
  toolsUsed: string[];
  lastActivity: Date;
  collaboratorCount: number;
  snapshotCount: number;
}

export interface Workspace extends BaseEntity, Named, Configurable<WorkspaceSettings> {
  type: WorkspaceType;
  files: FileReference[];
  activeTools: ActiveTool[];
  collaborators?: Collaborator[];
  snapshots: WorkspaceSnapshot[];
  stats: WorkspaceStats;
  isPublic: boolean;
  shareUrl?: string;
  tags: string[];
  parentWorkspaceId?: UUID;
  childWorkspaceIds: UUID[];
}

export interface WorkspaceTemplate {
  id: UUID;
  name: string;
  description: string;
  type: WorkspaceType;
  category: string;
  thumbnail?: string;
  defaultSettings: Partial<WorkspaceSettings>;
  defaultTools: string[];
  sampleFiles?: FileReference[];
  popularity: number;
  rating: number;
  author: string;
  tags: string[];
}

export interface WorkspaceFilter {
  type?: WorkspaceType;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  collaborator?: UUID;
  hasFiles?: boolean;
  isPublic?: boolean;
  searchQuery?: string;
}

export interface WorkspaceSortOptions {
  field: 'name' | 'created' | 'lastModified' | 'fileCount' | 'size';
  direction: 'asc' | 'desc';
}

// Workspace operations
export interface WorkspaceOperation {
  type: 'create' | 'update' | 'delete' | 'duplicate' | 'archive' | 'restore';
  workspaceId: UUID;
  userId?: UUID;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface WorkspaceEvent {
  id: UUID;
  workspaceId: UUID;
  type: 'file_added' | 'file_removed' | 'tool_activated' | 'collaborator_joined' | 'settings_changed';
  userId?: UUID;
  timestamp: Date;
  data: Record<string, any>;
}