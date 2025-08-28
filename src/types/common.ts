// Common types and enums used across the platform

export interface BaseEntity {
  id: string;
  created: Date;
  lastModified: Date;
}

export interface Timestamped {
  timestamp: Date;
}

export interface Versioned {
  version: number;
}

export interface Named {
  name: string;
  description?: string;
}

export interface Configurable<T = Record<string, any>> {
  configuration: T;
}

export interface Cacheable {
  cacheKey: string;
  cacheTTL?: number;
}

export interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}

export type UUID = string;
export type Timestamp = number;
export type URL = string;
export type MimeType = string;

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum Status {
  IDLE = 'idle',
  LOADING = 'loading',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  message?: string;
  estimatedTimeRemaining?: number;
}

export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  recoverable: boolean;
}

export interface NetworkStatus {
  online: boolean;
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
}