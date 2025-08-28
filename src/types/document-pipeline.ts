export interface DocumentWorkspace {
  id: string;
  name: string;
  documents: Document[];
  activeDocument?: string;
  collaborators: Collaborator[];
  settings: DocumentWorkspaceSettings;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  content: string;
  format: DocumentFormat;
  metadata: DocumentMetadata;
  versions: DocumentVersion[];
  lastModified: Date;
  collaborationSession?: CollaborationSession;
}

export enum DocumentType {
  MARKDOWN = 'markdown',
  LATEX = 'latex',
  SPREADSHEET = 'spreadsheet',
  PDF = 'pdf',
  PLAIN_TEXT = 'plain_text'
}

export enum DocumentFormat {
  MD = 'md',
  TEX = 'tex',
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf',
  TXT = 'txt',
  HTML = 'html',
  DOCX = 'docx'
}

export interface DocumentMetadata {
  wordCount?: number;
  pageCount?: number;
  language?: string;
  tags: string[];
  customProperties: Record<string, any>;
}

export interface DocumentVersion {
  id: string;
  timestamp: Date;
  author?: string;
  changes: string;
  content: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  lastSeen: Date;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface CollaborationSession {
  id: string;
  documentId: string;
  participants: Collaborator[];
  operations: CollaborationOperation[];
  isActive: boolean;
}

export interface CollaborationOperation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  author: string;
  timestamp: Date;
}

export interface DocumentWorkspaceSettings {
  autoSave: boolean;
  collaborationEnabled: boolean;
  defaultFormat: DocumentFormat;
  theme: 'light' | 'dark';
  fontSize: number;
  showLineNumbers: boolean;
}

export interface FormatConversionOptions {
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  quality?: number;
  preserveFormatting?: boolean;
  customOptions?: Record<string, any>;
}

export interface ConversionProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: string;
  error?: string;
}

export interface ShareOptions {
  expirationTime?: Date;
  password?: string;
  downloadLimit?: number;
  allowComments?: boolean;
}

export interface DocumentComparison {
  id: string;
  document1: string;
  document2: string;
  differences: DocumentDifference[];
  similarity: number;
}

export interface DocumentDifference {
  type: 'addition' | 'deletion' | 'modification';
  position: number;
  oldContent?: string;
  newContent?: string;
  line: number;
}

export interface PDFProcessingOptions {
  extractText?: boolean;
  extractImages?: boolean;
  ocrLanguage?: string;
  quality?: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  boundingBoxes?: TextBoundingBox[];
}

export interface TextBoundingBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}