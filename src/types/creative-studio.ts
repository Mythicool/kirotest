// Creative Content Studio specific types

import { UUID, URL } from './common';
import { FileReference } from './file';

export enum CanvasType {
  RASTER = 'raster',
  VECTOR = 'vector',
  ANIMATION = 'animation'
}

export enum LayerType {
  IMAGE = 'image',
  TEXT = 'text',
  SHAPE = 'shape',
  EFFECT = 'effect',
  GROUP = 'group'
}

export enum BlendMode {
  NORMAL = 'normal',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  SOFT_LIGHT = 'soft-light',
  HARD_LIGHT = 'hard-light',
  COLOR_DODGE = 'color-dodge',
  COLOR_BURN = 'color-burn',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion'
}

export interface Canvas {
  id: UUID;
  name: string;
  type: CanvasType;
  width: number;
  height: number;
  dpi: number;
  colorMode: 'RGB' | 'CMYK' | 'Grayscale';
  backgroundColor: string;
  layers: Layer[];
  activeLayerId?: UUID;
  created: Date;
  lastModified: Date;
  metadata: Record<string, any>;
}

export interface Layer {
  id: UUID;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0-1
  blendMode: BlendMode;
  position: {
    x: number;
    y: number;
    z: number; // z-index
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number; // degrees
  content: LayerContent;
  effects: LayerEffect[];
  parentId?: UUID; // for grouped layers
  childIds: UUID[]; // for group layers
  created: Date;
  lastModified: Date;
}

export interface LayerContent {
  type: LayerType;
  data: any; // Type-specific data
}

export interface ImageLayerContent extends LayerContent {
  type: LayerType.IMAGE;
  data: {
    src: string;
    originalSrc?: string;
    filters: ImageFilter[];
    adjustments: ImageAdjustments;
  };
}

export interface TextLayerContent extends LayerContent {
  type: LayerType.TEXT;
  data: {
    text: string;
    font: TextStyle;
    alignment: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
    letterSpacing: number;
  };
}

export interface ShapeLayerContent extends LayerContent {
  type: LayerType.SHAPE;
  data: {
    shape: 'rectangle' | 'circle' | 'polygon' | 'path';
    fill: Fill;
    stroke: Stroke;
    path?: string; // SVG path for custom shapes
  };
}

export interface LayerEffect {
  id: UUID;
  type: 'drop-shadow' | 'inner-shadow' | 'glow' | 'bevel' | 'gradient-overlay';
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface ImageFilter {
  type: 'blur' | 'sharpen' | 'brightness' | 'contrast' | 'saturation' | 'hue' | 'sepia' | 'grayscale';
  value: number;
  enabled: boolean;
}

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  gamma: number;
  exposure: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
}

export interface TextStyle {
  family: string;
  size: number;
  weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  style: 'normal' | 'italic' | 'oblique';
  color: string;
  decoration: 'none' | 'underline' | 'overline' | 'line-through';
}

export interface Fill {
  type: 'solid' | 'gradient' | 'pattern';
  color?: string;
  gradient?: Gradient;
  pattern?: Pattern;
}

export interface Stroke {
  enabled: boolean;
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  dashArray?: number[];
}

export interface Gradient {
  type: 'linear' | 'radial' | 'conic';
  stops: GradientStop[];
  angle?: number; // for linear gradients
  center?: { x: number; y: number }; // for radial/conic gradients
  radius?: number; // for radial gradients
}

export interface GradientStop {
  color: string;
  position: number; // 0-1
}

export interface Pattern {
  src: string;
  repeat: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
  size: { width: number; height: number };
  offset: { x: number; y: number };
}

export interface ColorPalette {
  id: UUID;
  name: string;
  colors: string[];
  source: 'coolors' | 'adobe' | 'custom';
  url?: URL;
  created: Date;
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'gif' | 'webp';
  quality?: number; // 0-100 for lossy formats
  width?: number;
  height?: number;
  dpi?: number;
  optimize: boolean;
  progressive?: boolean; // for JPEG
  transparent?: boolean; // for PNG
  compression?: 'none' | 'lzw' | 'zip'; // for TIFF
}

export interface CreativeStudioWorkspace {
  canvases: Canvas[];
  activeCanvasId?: UUID;
  palettes: ColorPalette[];
  recentColors: string[];
  tools: CreativeToolState;
  history: HistoryState;
  preferences: CreativeStudioPreferences;
}

export interface CreativeToolState {
  activeTool: string;
  brushSettings: BrushSettings;
  selectionSettings: SelectionSettings;
  textSettings: TextStyle;
  shapeSettings: ShapeSettings;
}

export interface BrushSettings {
  size: number;
  hardness: number;
  opacity: number;
  flow: number;
  color: string;
  blendMode: BlendMode;
}

export interface SelectionSettings {
  type: 'rectangle' | 'ellipse' | 'lasso' | 'magic-wand';
  feather: number;
  antiAlias: boolean;
  tolerance: number; // for magic wand
}

export interface ShapeSettings {
  fill: Fill;
  stroke: Stroke;
  cornerRadius?: number; // for rectangles
}

export interface HistoryState {
  states: HistoryEntry[];
  currentIndex: number;
  maxStates: number;
}

export interface HistoryEntry {
  id: UUID;
  name: string;
  timestamp: Date;
  canvasState: any; // Serialized canvas state
}

export interface CreativeStudioPreferences {
  defaultCanvasSize: { width: number; height: number };
  defaultDPI: number;
  defaultColorMode: 'RGB' | 'CMYK' | 'Grayscale';
  autoSave: boolean;
  autoSaveInterval: number;
  maxHistoryStates: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  units: 'px' | 'in' | 'cm' | 'mm' | 'pt';
}

// Tool integration interfaces
export interface PhotoPeaIntegration {
  loadImage(file: FileReference): Promise<void>;
  saveImage(format: string, quality?: number): Promise<Blob>;
  applyFilter(filter: string, parameters: Record<string, any>): Promise<void>;
  getLayerData(): Promise<Layer[]>;
  setLayerData(layers: Layer[]): Promise<void>;
}

export interface SVGEditIntegration {
  loadSVG(svgContent: string): Promise<void>;
  saveSVG(): Promise<string>;
  createElement(type: string, attributes: Record<string, any>): Promise<void>;
  updateElement(id: string, attributes: Record<string, any>): Promise<void>;
  deleteElement(id: string): Promise<void>;
}

export interface CoolorsIntegration {
  generatePalette(baseColor?: string): Promise<ColorPalette>;
  searchPalettes(query: string): Promise<ColorPalette[]>;
  getTrendingPalettes(): Promise<ColorPalette[]>;
}

export interface TinyPNGIntegration {
  optimizeImage(file: Blob): Promise<Blob>;
  getCompressionStats(originalSize: number, compressedSize: number): {
    ratio: number;
    savings: number;
    percentage: number;
  };
}