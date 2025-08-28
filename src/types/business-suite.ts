export interface BusinessSuiteWorkspace {
  id: string;
  name: string;
  type: 'business-suite';
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
  marketingMaterials: MarketingMaterial[];
  backups: BackupItem[];
  settings: BusinessSettings;
}

export interface Invoice {
  id: string;
  clientId: string;
  number: string;
  date: Date;
  dueDate: Date;
  items: InvoiceItem[];
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  template: InvoiceTemplate;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  layout: 'professional' | 'modern' | 'classic';
  colors: {
    primary: string;
    secondary: string;
    text: string;
  };
  logo?: string;
  fields: InvoiceField[];
}

export interface InvoiceField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency';
  required: boolean;
  position: { x: number; y: number };
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  company?: string;
  notes?: string;
  projects: string[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId?: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  startDate: Date;
  endDate?: Date;
  mindMap?: MindMapData;
  tasks: ProjectTask[];
  budget?: number;
  spent?: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
}

export interface MindMapData {
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  layout: 'radial' | 'tree' | 'force';
}

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: 'small' | 'medium' | 'large';
  type: 'root' | 'branch' | 'leaf';
}

export interface MindMapConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
}

export interface MarketingMaterial {
  id: string;
  name: string;
  type: 'logo' | 'banner' | 'flyer' | 'business-card' | 'social-media';
  format: string;
  url: string;
  thumbnail?: string;
  dimensions: { width: number; height: number };
  createdDate: Date;
  tags: string[];
}

export interface FinancialData {
  cryptocurrencies: CryptocurrencyData[];
  tradingInfo: TradingInfo;
  portfolioValue: number;
  lastUpdated: Date;
}

export interface CryptocurrencyData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
}

export interface TradingInfo {
  positions: TradingPosition[];
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface TradingPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface VideoConference {
  id: string;
  title: string;
  participants: Participant[];
  startTime: Date;
  duration: number;
  recordingUrl?: string;
  chatMessages: ChatMessage[];
  sharedFiles: SharedFile[];
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'host' | 'participant';
  joinTime: Date;
  leaveTime?: Date;
  micMuted: boolean;
  videoEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
}

export interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  sharedBy: string;
  sharedAt: Date;
}

export interface SEOAnalysis {
  url: string;
  score: number;
  issues: SEOIssue[];
  recommendations: SEORecommendation[];
  keywords: KeywordAnalysis[];
  performance: PerformanceMetrics;
  lastAnalyzed: Date;
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'technical' | 'content' | 'performance' | 'accessibility';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  howToFix: string;
}

export interface SEORecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
  implementation: string;
}

export interface KeywordAnalysis {
  keyword: string;
  density: number;
  position: number;
  searchVolume: number;
  difficulty: number;
  opportunities: string[];
}

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  mobileScore: number;
  desktopScore: number;
}

export interface SocialMediaPost {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube';
  content: string;
  media: MediaAttachment[];
  scheduledTime: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement?: PostEngagement;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnail?: string;
  altText?: string;
  dimensions: { width: number; height: number };
}

export interface PostEngagement {
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  impressions: number;
  reach: number;
}

export interface BackupItem {
  id: string;
  name: string;
  type: 'project' | 'client-data' | 'invoices' | 'marketing-materials' | 'full-backup';
  size: number;
  createdDate: Date;
  location: 'local' | 'cloud';
  cloudProvider?: 'dropbox' | 'google-drive' | 'onedrive';
  url?: string;
  encrypted: boolean;
  status: 'creating' | 'completed' | 'failed' | 'restoring';
}

export interface BusinessSettings {
  companyInfo: CompanyInfo;
  invoiceSettings: InvoiceSettings;
  notificationSettings: NotificationSettings;
  integrationSettings: IntegrationSettings;
  backupSettings: BackupSettings;
}

export interface CompanyInfo {
  name: string;
  logo?: string;
  address: Address;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  currency: string;
  timezone: string;
}

export interface InvoiceSettings {
  defaultTemplate: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  paymentTerms: number;
  lateFee: number;
  autoReminders: boolean;
  reminderDays: number[];
}

export interface NotificationSettings {
  emailNotifications: boolean;
  invoiceReminders: boolean;
  projectDeadlines: boolean;
  backupAlerts: boolean;
  performanceReports: boolean;
}

export interface IntegrationSettings {
  invoiceToMe: {
    enabled: boolean;
    apiKey?: string;
  };
  bubbl: {
    enabled: boolean;
    userId?: string;
  };
  cryptoApi: {
    enabled: boolean;
    provider: 'coinapi' | 'cryptocompare' | 'coingecko';
    apiKey?: string;
  };
  videoConferencing: {
    provider: 'jitsi' | 'whereby' | 'meet';
    roomPrefix: string;
  };
  seoTools: {
    provider: 'gtmetrix' | 'pingdom' | 'pagespeed';
    apiKey?: string;
  };
  socialMedia: {
    platforms: string[];
    schedulingEnabled: boolean;
  };
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionPeriod: number;
  cloudProvider?: 'dropbox' | 'google-drive' | 'onedrive';
  encryption: boolean;
  includeFiles: boolean;
}

export interface BusinessWorkflowEvent {
  type: 'invoice-created' | 'invoice-sent' | 'payment-received' | 'project-completed' | 'backup-created';
  data: any;
  timestamp: Date;
  userId?: string;
}

export interface BusinessAnalytics {
  revenue: RevenueAnalytics;
  projects: ProjectAnalytics;
  clients: ClientAnalytics;
  performance: BusinessPerformanceMetrics;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number[];
  averageInvoiceValue: number;
  outstandingAmount: number;
  paidInvoices: number;
  overdueInvoices: number;
}

export interface ProjectAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  averageProjectDuration: number;
  projectProfitability: number;
  onTimeDelivery: number;
}

export interface ClientAnalytics {
  totalClients: number;
  activeClients: number;
  clientRetention: number;
  averageClientValue: number;
  topClients: Array<{ clientId: string; revenue: number }>;
}

export interface BusinessPerformanceMetrics {
  websiteTraffic: number;
  conversionRate: number;
  socialMediaReach: number;
  brandMentions: number;
  customerSatisfaction: number;
}