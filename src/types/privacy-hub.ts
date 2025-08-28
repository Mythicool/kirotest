export interface CommunicationSession {
  id: string;
  type: 'video' | 'audio' | 'text';
  provider: 'tlk.io' | 'gruveo' | 'whereby';
  roomId: string;
  participants: number;
  encrypted: boolean;
  created: Date;
  expires?: Date;
}

export interface FileShareSession {
  id: string;
  type: 'p2p' | 'secure-transfer';
  provider: 'efshare' | 'firefox-send';
  files: SharedFile[];
  downloadLimit?: number;
  expiresIn?: number;
  password?: boolean;
  created: Date;
}

export interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  encrypted: boolean;
  downloadUrl?: string;
  shareUrl?: string;
}

export interface TemporaryEmail {
  id: string;
  address: string;
  provider: '10minutemail' | 'mailinator';
  expires: Date;
  messages: EmailMessage[];
  autoRefresh: boolean;
}

export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  received: Date;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  name: string;
  size: number;
  type: string;
  downloadUrl: string;
}

export interface EncryptionSession {
  id: string;
  provider: 'cryptii' | 'encipher.it';
  algorithm: string;
  inputText: string;
  outputText: string;
  key?: string;
  mode: 'encrypt' | 'decrypt';
  created: Date;
}

export interface SecureNote {
  id: string;
  provider: 'protectedtext';
  siteId: string;
  password: string;
  content: string;
  url: string;
  created: Date;
  lastModified: Date;
}

export interface AnonymousShare {
  id: string;
  provider: 'scr.im';
  originalEmail: string;
  protectedEmail: string;
  shareUrl: string;
  created: Date;
  expires?: Date;
}

export interface VirusScanResult {
  id: string;
  fileName: string;
  fileSize: number;
  scanProvider: 'jotti';
  status: 'scanning' | 'clean' | 'infected' | 'error';
  threats: string[];
  scanDate: Date;
  reportUrl?: string;
}

export interface PasswordGeneration {
  id: string;
  provider: 'random.org';
  password: string;
  length: number;
  includeSymbols: boolean;
  includeNumbers: boolean;
  includeUppercase: boolean;
  includeLowercase: boolean;
  entropy: number;
  generated: Date;
}

export interface PrivacyHubWorkspace {
  id: string;
  name: string;
  communications: CommunicationSession[];
  fileShares: FileShareSession[];
  tempEmails: TemporaryEmail[];
  encryptions: EncryptionSession[];
  secureNotes: SecureNote[];
  anonymousShares: AnonymousShare[];
  virusScans: VirusScanResult[];
  passwords: PasswordGeneration[];
  settings: PrivacySettings;
  created: Date;
  lastUsed: Date;
}

export interface PrivacySettings {
  autoDeleteSessions: boolean;
  sessionTimeout: number;
  defaultEncryption: string;
  autoScanFiles: boolean;
  secureByDefault: boolean;
  anonymizeData: boolean;
}

export interface CommunicationProvider {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  features: string[];
  maxParticipants: number;
  encrypted: boolean;
  anonymous: boolean;
  baseUrl: string;
}

export interface EncryptionProvider {
  id: string;
  name: string;
  algorithms: string[];
  keyRequired: boolean;
  bidirectional: boolean;
  baseUrl: string;
}