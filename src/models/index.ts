// Core data models
export { Workspace } from './Workspace';
export { FileReference } from './FileReference';
export { ToolIntegration } from './ToolIntegration';
export { StateManager, stateManager } from './StateManager';

// Re-export types for convenience
export type {
  UserPreferences,
  CacheEntry,
  CacheManager,
  ApplicationState
} from './StateManager';

export type {
  Workspace as IWorkspace,
  WorkspaceType,
  WorkspaceSettings,
  WorkspaceFilter,
  WorkspaceSortOptions,
  WorkspaceSnapshot,
  WorkspaceStats,
  Collaborator
} from '../types/workspace';

export type {
  FileReference as IFileReference,
  FileMetadata,
  FileVersion,
  FilePermissions,
  FileTag,
  FileSource,
  FileProcessingStatus,
  FileUploadOptions,
  FileConversionOptions,
  FileSearchOptions,
  FileSortOptions,
  FileValidationRule,
  FileValidationResult
} from '../types/file';

export type {
  ToolIntegration as IToolIntegration,
  ToolCategory,
  ToolEmbedType,
  ToolCapability,
  ToolConfiguration,
  ToolStatus,
  ToolFilter,
  ToolSortOptions,
  ToolHealthStatus,
  ToolUsageStats,
  PricingPlan,
  ParameterDefinition,
  ActiveTool,
  ToolRegistry
} from '../types/tool';