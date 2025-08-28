// Developer Workflow Hub type definitions

import { BaseEntity, Named, UUID } from './common';
import { FileReference } from './file';

export enum CodeLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  HTML = 'html',
  CSS = 'css',
  SCSS = 'scss',
  JSON = 'json',
  MARKDOWN = 'markdown',
  JAVA = 'java',
  CPP = 'cpp',
  CSHARP = 'csharp',
  PHP = 'php',
  RUBY = 'ruby',
  GO = 'go',
  RUST = 'rust',
  SWIFT = 'swift',
  KOTLIN = 'kotlin',
  SQL = 'sql',
  SHELL = 'shell',
  YAML = 'yaml',
  XML = 'xml'
}

export enum ExecutionEnvironment {
  REPLIT = 'replit',
  CODEPEN = 'codepen',
  JSFIDDLE = 'jsfiddle',
  JSBIN = 'jsbin',
  CODESANDBOX = 'codesandbox',
  STACKBLITZ = 'stackblitz'
}

export enum OptimizationType {
  CSS_MINIFY = 'css-minify',
  JS_UGLIFY = 'js-uglify',
  HTML_MINIFY = 'html-minify',
  IMAGE_OPTIMIZE = 'image-optimize',
  BUNDLE_ANALYZE = 'bundle-analyze'
}

export enum PerformanceTestProvider {
  GTMETRIX = 'gtmetrix',
  PINGDOM = 'pingdom',
  PAGESPEED = 'pagespeed',
  WEBPAGETEST = 'webpagetest'
}

export interface CodeFile extends BaseEntity, Named {
  language: CodeLanguage;
  content: string;
  size: number;
  encoding: string;
  lineCount: number;
  isReadOnly: boolean;
  hasUnsavedChanges: boolean;
  lastCursorPosition?: {
    line: number;
    column: number;
  };
  breakpoints: number[];
  bookmarks: CodeBookmark[];
  foldedRegions: CodeRegion[];
  metadata: {
    author?: string;
    description?: string;
    tags: string[];
    dependencies: string[];
    version?: string;
  };
}

export interface CodeBookmark {
  id: UUID;
  line: number;
  column: number;
  label: string;
  description?: string;
  created: Date;
}

export interface CodeRegion {
  startLine: number;
  endLine: number;
  folded: boolean;
  label?: string;
}

export interface CodeProject extends BaseEntity, Named {
  type: 'web' | 'node' | 'python' | 'java' | 'mobile' | 'desktop' | 'library';
  files: CodeFile[];
  mainFile?: UUID;
  dependencies: ProjectDependency[];
  buildConfig?: BuildConfiguration;
  runConfig?: RunConfiguration;
  testConfig?: TestConfiguration;
  deployConfig?: DeployConfiguration;
  environment: ExecutionEnvironment;
  isPublic: boolean;
  shareUrl?: string;
  collaborators: string[];
  tags: string[];
  readme?: string;
  license?: string;
  repository?: string;
}

export interface ProjectDependency {
  name: string;
  version: string;
  type: 'runtime' | 'development' | 'peer';
  source: 'npm' | 'pip' | 'maven' | 'nuget' | 'cargo' | 'gem' | 'composer';
  isOptional: boolean;
}

export interface BuildConfiguration {
  command: string;
  outputDir: string;
  environment: Record<string, string>;
  beforeBuild?: string[];
  afterBuild?: string[];
  watch: boolean;
  sourceMaps: boolean;
  minify: boolean;
  target: string[];
}

export interface RunConfiguration {
  command: string;
  args: string[];
  environment: Record<string, string>;
  workingDir?: string;
  port?: number;
  host?: string;
  autoRestart: boolean;
  timeout?: number;
}

export interface TestConfiguration {
  framework: 'jest' | 'mocha' | 'jasmine' | 'pytest' | 'junit' | 'rspec' | 'go-test';
  testDir: string;
  testPattern: string;
  coverage: boolean;
  coverageThreshold?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  environment: Record<string, string>;
}

export interface DeployConfiguration {
  provider: 'netlify' | 'vercel' | 'github-pages' | 'heroku' | 'aws' | 'firebase';
  buildCommand?: string;
  outputDir?: string;
  environment: Record<string, string>;
  customDomain?: string;
  ssl: boolean;
}

export interface ExecutionResult {
  id: UUID;
  projectId: UUID;
  type: 'run' | 'test' | 'build' | 'deploy';
  status: 'running' | 'success' | 'error' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  output: ExecutionOutput[];
  exitCode?: number;
  error?: string;
  metrics?: ExecutionMetrics;
}

export interface ExecutionOutput {
  type: 'stdout' | 'stderr' | 'info' | 'warning' | 'error';
  content: string;
  timestamp: Date;
  source?: string;
}

export interface ExecutionMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  buildSize?: number;
  bundleSize?: number;
  loadTime?: number;
}

export interface TerminalSession extends BaseEntity {
  projectId?: UUID;
  isActive: boolean;
  currentDir: string;
  environment: Record<string, string>;
  history: TerminalCommand[];
  output: TerminalOutput[];
  maxHistorySize: number;
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
}

export interface TerminalCommand {
  id: UUID;
  command: string;
  args: string[];
  timestamp: Date;
  exitCode?: number;
  duration?: number;
}

export interface TerminalOutput {
  id: UUID;
  commandId?: UUID;
  type: 'stdout' | 'stderr' | 'system';
  content: string;
  timestamp: Date;
  isHtml: boolean;
}

export interface LivePreview {
  id: UUID;
  projectId: UUID;
  url: string;
  isActive: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  lastRefresh: Date;
  errors: PreviewError[];
  warnings: PreviewWarning[];
  performance: PreviewPerformance;
  devices: PreviewDevice[];
  activeDevice: string;
}

export interface PreviewError {
  id: UUID;
  type: 'javascript' | 'css' | 'html' | 'network' | 'security';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
  timestamp: Date;
  severity: 'error' | 'warning' | 'info';
}

export interface PreviewWarning extends PreviewError {
  severity: 'warning';
  suggestion?: string;
}

export interface PreviewPerformance {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
  speedIndex: number;
  memoryUsage: number;
  networkRequests: number;
  transferSize: number;
  resourceCount: number;
}

export interface PreviewDevice {
  id: string;
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  userAgent: string;
  type: 'desktop' | 'tablet' | 'mobile';
  orientation: 'portrait' | 'landscape';
}

export interface CodeOptimization {
  id: UUID;
  type: OptimizationType;
  inputFile: FileReference;
  outputFile?: FileReference;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  originalSize: number;
  optimizedSize?: number;
  compressionRatio?: number;
  settings: OptimizationSettings;
  result?: OptimizationResult;
  error?: string;
}

export interface OptimizationSettings {
  level: 'basic' | 'aggressive' | 'custom';
  preserveComments: boolean;
  preserveWhitespace: boolean;
  mangleNames: boolean;
  removeUnused: boolean;
  inlineSmallAssets: boolean;
  customOptions?: Record<string, any>;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  timeSaved: number;
  warnings: string[];
  suggestions: string[];
  metrics: {
    parseTime: number;
    optimizeTime: number;
    outputTime: number;
  };
}

export interface PerformanceTest {
  id: UUID;
  projectId: UUID;
  url: string;
  provider: PerformanceTestProvider;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  location: string;
  device: string;
  connection: string;
  results?: PerformanceTestResult;
  error?: string;
}

export interface PerformanceTestResult {
  score: number;
  grades: {
    performance: string;
    structure: string;
    lcp: string;
    cls: string;
    fid: string;
  };
  metrics: {
    loadTime: number;
    firstByte: number;
    startRender: number;
    domInteractive: number;
    domComplete: number;
    onLoad: number;
    fullyLoaded: number;
    requests: number;
    bytesIn: number;
    bytesOut: number;
  };
  opportunities: PerformanceOpportunity[];
  diagnostics: PerformanceDiagnostic[];
  screenshots: PerformanceScreenshot[];
  waterfall?: string;
}

export interface PerformanceOpportunity {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  savings: number;
  unit: 'ms' | 'kb' | 'mb';
  details: string[];
}

export interface PerformanceDiagnostic {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  value: number;
  unit: string;
  details: string[];
}

export interface PerformanceScreenshot {
  timestamp: number;
  url: string;
  progress: number;
}

export interface BackendService {
  id: UUID;
  name: string;
  type: 'jsonstore' | 'firebase' | 'supabase' | 'mongodb' | 'custom';
  endpoint: string;
  apiKey?: string;
  configuration: Record<string, any>;
  collections: BackendCollection[];
  isConnected: boolean;
  lastSync: Date;
  usage: {
    requests: number;
    storage: number;
    bandwidth: number;
  };
}

export interface BackendCollection {
  id: UUID;
  name: string;
  schema?: Record<string, any>;
  documents: BackendDocument[];
  indexes: BackendIndex[];
  permissions: BackendPermissions;
  created: Date;
  lastModified: Date;
}

export interface BackendDocument {
  id: string;
  data: Record<string, any>;
  created: Date;
  lastModified: Date;
  version: number;
}

export interface BackendIndex {
  name: string;
  fields: string[];
  unique: boolean;
  sparse: boolean;
}

export interface BackendPermissions {
  read: 'public' | 'private' | 'authenticated';
  write: 'public' | 'private' | 'authenticated';
  delete: 'public' | 'private' | 'authenticated';
}

export interface DeveloperWorkspace {
  projects: CodeProject[];
  activeProjectId?: UUID;
  terminals: TerminalSession[];
  activeTerminalId?: UUID;
  previews: LivePreview[];
  optimizations: CodeOptimization[];
  performanceTests: PerformanceTest[];
  backendServices: BackendService[];
  preferences: DeveloperPreferences;
  recentFiles: UUID[];
  bookmarks: WorkspaceBookmark[];
  snippets: CodeSnippet[];
}

export interface DeveloperPreferences {
  editor: {
    theme: 'dark' | 'light' | 'auto';
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    autoSave: boolean;
    autoSaveDelay: number;
    formatOnSave: boolean;
    formatOnType: boolean;
  };
  terminal: {
    theme: 'dark' | 'light';
    fontSize: number;
    fontFamily: string;
    shell: string;
    maxHistorySize: number;
  };
  preview: {
    autoRefresh: boolean;
    refreshDelay: number;
    showErrors: boolean;
    showWarnings: boolean;
    defaultDevice: string;
  };
  performance: {
    defaultProvider: PerformanceTestProvider;
    defaultLocation: string;
    defaultDevice: string;
    defaultConnection: string;
  };
  optimization: {
    autoOptimize: boolean;
    defaultLevel: 'basic' | 'aggressive' | 'custom';
    preserveComments: boolean;
    showSavings: boolean;
  };
}

export interface WorkspaceBookmark {
  id: UUID;
  name: string;
  url: string;
  description?: string;
  tags: string[];
  created: Date;
  category: 'documentation' | 'tool' | 'reference' | 'inspiration' | 'other';
}

export interface CodeSnippet {
  id: UUID;
  name: string;
  description?: string;
  language: CodeLanguage;
  code: string;
  tags: string[];
  isPublic: boolean;
  created: Date;
  lastUsed: Date;
  useCount: number;
  variables: SnippetVariable[];
}

export interface SnippetVariable {
  name: string;
  description?: string;
  defaultValue?: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
}