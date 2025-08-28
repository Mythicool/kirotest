export interface MathCalculation {
  id: string;
  expression: string;
  result: string;
  engine: 'wolfram' | 'desmos' | 'calculatoria';
  timestamp: Date;
  variables?: Record<string, number>;
}

export interface VisualizationTool {
  id: string;
  name: string;
  type: 'graph' | 'geometry' | 'diagram';
  url: string;
  capabilities: string[];
  inputFormats: string[];
  outputFormats: string[];
}

export interface ResearchQuery {
  id: string;
  query: string;
  engines: string[];
  results: SearchResult[];
  timestamp: Date;
  filters?: SearchFilters;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevance: number;
}

export interface SearchFilters {
  dateRange?: { start: Date; end: Date };
  domain?: string;
  language?: string;
  type?: 'academic' | 'general' | 'multimedia';
}

export interface CollaborativeNote {
  id: string;
  title: string;
  content: string;
  mathNotation: MathNotation[];
  collaborators: string[];
  lastModified: Date;
  version: number;
}

export interface MathNotation {
  id: string;
  latex: string;
  position: { x: number; y: number };
  rendered: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: string;
  created: Date;
  lastModified: Date;
}

export interface Slide {
  id: string;
  content: string;
  drawings: Drawing[];
  diagrams: Diagram[];
  notes?: string;
}

export interface Drawing {
  id: string;
  type: 'freehand' | 'shape' | 'text';
  data: string;
  style: DrawingStyle;
}

export interface DrawingStyle {
  color: string;
  strokeWidth: number;
  fill?: string;
  opacity?: number;
}

export interface Diagram {
  id: string;
  type: 'flowchart' | 'mindmap' | 'concept';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface DiagramNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  style: NodeStyle;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style: EdgeStyle;
}

export interface NodeStyle {
  shape: 'rectangle' | 'circle' | 'diamond';
  color: string;
  borderColor: string;
  textColor: string;
}

export interface EdgeStyle {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  arrow?: boolean;
}

export interface LanguageAnalysis {
  id: string;
  text: string;
  analysis: {
    wordCount: number;
    readabilityScore: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    complexity: 'simple' | 'moderate' | 'complex';
    suggestions: string[];
  };
  safetyCheck: SafetyResult;
}

export interface SafetyResult {
  isSafe: boolean;
  concerns: string[];
  recommendations: string[];
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'calculation' | 'diagram' | 'presentation';
  tags: string[];
  shared: boolean;
  exportFormats: string[];
  created: Date;
  lastModified: Date;
}

export interface LearningTool {
  id: string;
  name: string;
  type: 'typing' | 'math' | 'language' | 'science';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  url: string;
  description: string;
  skills: string[];
}

export interface SkillProgress {
  toolId: string;
  score: number;
  attempts: number;
  bestScore: number;
  timeSpent: number;
  lastPracticed: Date;
}

export interface EducationWorkspace {
  id: string;
  name: string;
  type: 'math' | 'science' | 'language' | 'general';
  calculations: MathCalculation[];
  notes: CollaborativeNote[];
  presentations: Presentation[];
  research: ResearchQuery[];
  knowledge: KnowledgeItem[];
  progress: SkillProgress[];
  settings: EducationSettings;
}

export interface EducationSettings {
  preferredMathEngine: 'wolfram' | 'desmos' | 'calculatoria';
  notationStyle: 'latex' | 'mathml';
  collaborationEnabled: boolean;
  autoSave: boolean;
  exportFormat: string;
  theme: 'light' | 'dark' | 'academic';
}