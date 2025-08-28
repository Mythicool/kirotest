import {
  ToolIntegration as IToolIntegration,
  ToolCategory,
  ToolEmbedType,
  ToolCapability,
  ToolConfiguration,
  ToolStatus,
  ToolFilter,
  ToolSortOptions,
  PricingPlan
} from '../types/tool';
import { UUID, URL, MimeType } from '../types/common';

export class ToolIntegration implements IToolIntegration {
  id: UUID;
  name: string;
  description?: string;
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
    interval: number;
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
  configuration: ToolConfiguration;
  created: Date;
  lastModified: Date;

  constructor(data: Partial<IToolIntegration> & {
    name: string;
    category: ToolCategory;
    url: URL;
    embedType: ToolEmbedType;
  }) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.url = data.url;
    this.embedType = data.embedType;
    this.capabilities = data.capabilities || [];
    this.inputFormats = data.inputFormats || [];
    this.outputFormats = data.outputFormats || [];
    this.version = data.version || '1.0.0';
    this.author = data.author || 'Unknown';
    this.license = data.license || 'Unknown';
    this.homepage = data.homepage;
    this.documentation = data.documentation;
    this.icon = data.icon;
    this.screenshots = data.screenshots;
    this.tags = data.tags || [];
    this.popularity = data.popularity || 0;
    this.rating = data.rating || 0;
    this.isOfflineCapable = data.isOfflineCapable || false;
    this.requiresAuth = data.requiresAuth || false;
    this.isPremium = data.isPremium || false;
    this.pricing = data.pricing;
    this.status = data.status || ToolStatus.ACTIVE;
    this.healthCheck = data.healthCheck;
    this.fallbackTools = data.fallbackTools;
    this.dependencies = data.dependencies;
    this.minimumRequirements = data.minimumRequirements;
    this.configuration = data.configuration || this.getDefaultConfiguration();
    this.created = data.created || new Date();
    this.lastModified = data.lastModified || new Date();
  }

  private generateId(): UUID {
    return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getDefaultConfiguration(): ToolConfiguration {
    return {
      timeout: 30000,
      retryAttempts: 3,
      rateLimit: {
        requests: 100,
        window: 60000
      },
      customHeaders: {},
      features: {},
      embedSettings: {
        width: '100%',
        height: '600px',
        allowFullscreen: true,
        sandbox: ['allow-scripts', 'allow-same-origin', 'allow-forms'],
        permissions: []
      }
    };
  }

  static async create(data: {
    name: string;
    category: ToolCategory;
    url: URL;
    embedType: ToolEmbedType;
  } & Partial<IToolIntegration>): Promise<ToolIntegration> {
    const tool = new ToolIntegration(data);
    await tool.save();
    return tool;
  }

  static async findById(id: UUID): Promise<ToolIntegration | null> {
    try {
      const data = localStorage.getItem(`tool_${id}`);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return new ToolIntegration({
        ...parsed,
        created: new Date(parsed.created),
        lastModified: new Date(parsed.lastModified)
      });
    } catch (error) {
      console.error('Error loading tool:', error);
      return null;
    }
  }

  static async findAll(filter?: ToolFilter, sort?: ToolSortOptions): Promise<ToolIntegration[]> {
    const tools: ToolIntegration[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tool_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const tool = new ToolIntegration({
              ...parsed,
              created: new Date(parsed.created),
              lastModified: new Date(parsed.lastModified)
            });

            if (this.matchesFilter(tool, filter)) {
              tools.push(tool);
            }
          }
        } catch (error) {
          console.error(`Error loading tool from key ${key}:`, error);
        }
      }
    }

    if (sort) {
      tools.sort((a, b) => {
        const aValue = this.getSortValue(a, sort.field);
        const bValue = this.getSortValue(b, sort.field);
        
        if (sort.direction === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    return tools;
  }

  private static matchesFilter(tool: ToolIntegration, filter?: ToolFilter): boolean {
    if (!filter) return true;

    if (filter.category && tool.category !== filter.category) return false;
    if (filter.status && tool.status !== filter.status) return false;
    if (filter.isOfflineCapable !== undefined && tool.isOfflineCapable !== filter.isOfflineCapable) return false;
    if (filter.requiresAuth !== undefined && tool.requiresAuth !== filter.requiresAuth) return false;
    if (filter.isPremium !== undefined && tool.isPremium !== filter.isPremium) return false;

    if (filter.inputFormat && !tool.inputFormats.includes(filter.inputFormat)) return false;
    if (filter.outputFormat && !tool.outputFormats.includes(filter.outputFormat)) return false;

    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(tag => tool.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }

    if (filter.rating) {
      if (tool.rating < filter.rating.min || tool.rating > filter.rating.max) return false;
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matchesName = tool.name.toLowerCase().includes(query);
      const matchesDescription = tool.description?.toLowerCase().includes(query);
      const matchesTags = tool.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesName && !matchesDescription && !matchesTags) return false;
    }

    return true;
  }

  private static getSortValue(tool: ToolIntegration, field: string): any {
    switch (field) {
      case 'name': return tool.name.toLowerCase();
      case 'popularity': return tool.popularity;
      case 'rating': return tool.rating;
      case 'created': return tool.created.getTime();
      case 'lastUsed': return tool.lastModified.getTime();
      default: return tool.name.toLowerCase();
    }
  }

  async save(): Promise<void> {
    this.lastModified = new Date();
    
    try {
      const data = this.toJSON();
      localStorage.setItem(`tool_${this.id}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving tool:', error);
      throw new Error('Failed to save tool');
    }
  }

  async delete(): Promise<void> {
    try {
      localStorage.removeItem(`tool_${this.id}`);
    } catch (error) {
      console.error('Error deleting tool:', error);
      throw new Error('Failed to delete tool');
    }
  }

  addCapability(capability: ToolCapability): void {
    if (!this.capabilities.find(c => c.name === capability.name)) {
      this.capabilities.push(capability);
      this.lastModified = new Date();
    }
  }

  removeCapability(capabilityName: string): boolean {
    const index = this.capabilities.findIndex(c => c.name === capabilityName);
    if (index !== -1) {
      this.capabilities.splice(index, 1);
      this.lastModified = new Date();
      return true;
    }
    return false;
  }

  hasCapability(capabilityName: string): boolean {
    return this.capabilities.some(c => c.name === capabilityName);
  }

  getCapability(capabilityName: string): ToolCapability | undefined {
    return this.capabilities.find(c => c.name === capabilityName);
  }

  supportsInputFormat(format: MimeType): boolean {
    return this.inputFormats.includes(format);
  }

  supportsOutputFormat(format: MimeType): boolean {
    return this.outputFormats.includes(format);
  }

  canConvert(fromFormat: MimeType, toFormat: MimeType): boolean {
    return this.supportsInputFormat(fromFormat) && this.supportsOutputFormat(toFormat);
  }

  updateConfiguration(config: Partial<ToolConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    this.lastModified = new Date();
  }

  updateStatus(status: ToolStatus): void {
    this.status = status;
    this.lastModified = new Date();
  }

  isHealthy(): boolean {
    return this.status === ToolStatus.ACTIVE;
  }

  getEmbedUrl(): URL {
    return this.url;
  }

  getDisplayName(): string {
    return this.name;
  }

  getShortDescription(): string {
    if (!this.description) return '';
    return this.description.length > 100 
      ? `${this.description.substring(0, 97)}...`
      : this.description;
  }

  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      url: this.url,
      embedType: this.embedType,
      capabilities: this.capabilities,
      inputFormats: this.inputFormats,
      outputFormats: this.outputFormats,
      version: this.version,
      author: this.author,
      license: this.license,
      homepage: this.homepage,
      documentation: this.documentation,
      icon: this.icon,
      screenshots: this.screenshots,
      tags: this.tags,
      popularity: this.popularity,
      rating: this.rating,
      isOfflineCapable: this.isOfflineCapable,
      requiresAuth: this.requiresAuth,
      isPremium: this.isPremium,
      pricing: this.pricing,
      status: this.status,
      healthCheck: this.healthCheck,
      fallbackTools: this.fallbackTools,
      dependencies: this.dependencies,
      minimumRequirements: this.minimumRequirements,
      configuration: this.configuration,
      created: this.created.toISOString(),
      lastModified: this.lastModified.toISOString()
    };
  }
}