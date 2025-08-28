import React, { useState, useCallback, useEffect } from 'react';
import { CodeOptimization, OptimizationType, OptimizationSettings, DeveloperPreferences } from '@/types/developer-hub';
import { FileReference } from '@/types/file';
import Button from '@/components/ui/Button';

interface CodeOptimizerProps {
  optimizations: CodeOptimization[];
  preferences: DeveloperPreferences['optimization'];
  onOptimizationChange: (optimization: CodeOptimization) => void;
  onOptimizationCreate: (optimization: CodeOptimization) => void;
}

interface OptimizationTool {
  type: OptimizationType;
  name: string;
  description: string;
  icon: string;
  supportedFormats: string[];
  defaultSettings: OptimizationSettings;
}

const OPTIMIZATION_TOOLS: OptimizationTool[] = [
  {
    type: OptimizationType.CSS_MINIFY,
    name: 'CSS Minifier',
    description: 'Minify CSS files by removing whitespace, comments, and optimizing selectors',
    icon: '🎨',
    supportedFormats: ['css', 'scss', 'sass', 'less'],
    defaultSettings: {
      level: 'basic',
      preserveComments: false,
      preserveWhitespace: false,
      mangleNames: false,
      removeUnused: true,
      inlineSmallAssets: false
    }
  },
  {
    type: OptimizationType.JS_UGLIFY,
    name: 'JavaScript Uglifier',
    description: 'Minify and obfuscate JavaScript code for production',
    icon: '⚡',
    supportedFormats: ['js', 'jsx', 'ts', 'tsx'],
    defaultSettings: {
      level: 'basic',
      preserveComments: false,
      preserveWhitespace: false,
      mangleNames: true,
      removeUnused: true,
      inlineSmallAssets: true
    }
  },
  {
    type: OptimizationType.HTML_MINIFY,
    name: 'HTML Minifier',
    description: 'Compress HTML by removing unnecessary whitespace and comments',
    icon: '🌐',
    supportedFormats: ['html', 'htm'],
    defaultSettings: {
      level: 'basic',
      preserveComments: false,
      preserveWhitespace: false,
      mangleNames: false,
      removeUnused: true,
      inlineSmallAssets: false
    }
  },
  {
    type: OptimizationType.IMAGE_OPTIMIZE,
    name: 'Image Optimizer',
    description: 'Compress images without losing quality',
    icon: '🖼️',
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    defaultSettings: {
      level: 'basic',
      preserveComments: false,
      preserveWhitespace: false,
      mangleNames: false,
      removeUnused: false,
      inlineSmallAssets: false
    }
  },
  {
    type: OptimizationType.BUNDLE_ANALYZE,
    name: 'Bundle Analyzer',
    description: 'Analyze bundle size and identify optimization opportunities',
    icon: '📊',
    supportedFormats: ['js', 'css', 'json'],
    defaultSettings: {
      level: 'basic',
      preserveComments: false,
      preserveWhitespace: false,
      mangleNames: false,
      removeUnused: true,
      inlineSmallAssets: false
    }
  }
];

export const CodeOptimizer: React.FC<CodeOptimizerProps> = ({
  optimizations,
  preferences,
  onOptimizationChange,
  onOptimizationCreate
}) => {
  const [selectedTool, setSelectedTool] = useState<OptimizationTool>(OPTIMIZATION_TOOLS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customSettings, setCustomSettings] = useState<OptimizationSettings>(selectedTool.defaultSettings);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Update settings when tool changes
  useEffect(() => {
    setCustomSettings(selectedTool.defaultSettings);
  }, [selectedTool]);

  // File drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension && selectedTool.supportedFormats.includes(extension)) {
        setSelectedFile(file);
      } else {
        alert(`File type .${extension} is not supported by ${selectedTool.name}`);
      }
    }
  }, [selectedTool]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  // Optimization simulation
  const simulateOptimization = useCallback(async (
    file: File,
    tool: OptimizationTool,
    settings: OptimizationSettings
  ): Promise<{ optimizedContent: string; stats: any }> => {
    const content = await file.text();
    let optimizedContent = content;
    let originalSize = content.length;
    let optimizedSize = originalSize;

    // Simulate optimization based on tool type
    switch (tool.type) {
      case OptimizationType.CSS_MINIFY:
        if (!settings.preserveWhitespace) {
          optimizedContent = content
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, '}')
            .replace(/{\s*/g, '{')
            .replace(/;\s*/g, ';')
            .trim();
        }
        if (!settings.preserveComments) {
          optimizedContent = optimizedContent.replace(/\/\*[\s\S]*?\*\//g, '');
        }
        if (settings.removeUnused) {
          // Simulate removing unused CSS (basic simulation)
          optimizedSize = Math.floor(optimizedSize * 0.8);
        }
        break;

      case OptimizationType.JS_UGLIFY:
        if (!settings.preserveWhitespace) {
          optimizedContent = content
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, ';}')
            .replace(/{\s*/g, '{')
            .trim();
        }
        if (!settings.preserveComments) {
          optimizedContent = optimizedContent
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');
        }
        if (settings.mangleNames) {
          // Simulate variable name mangling
          optimizedSize = Math.floor(optimizedSize * 0.7);
        }
        break;

      case OptimizationType.HTML_MINIFY:
        if (!settings.preserveWhitespace) {
          optimizedContent = content
            .replace(/>\s+</g, '><')
            .replace(/\s+/g, ' ')
            .trim();
        }
        if (!settings.preserveComments) {
          optimizedContent = optimizedContent.replace(/<!--[\s\S]*?-->/g, '');
        }
        break;

      case OptimizationType.IMAGE_OPTIMIZE:
        // Simulate image compression
        optimizedSize = Math.floor(originalSize * 0.6);
        optimizedContent = `[Optimized ${file.type} image - ${optimizedSize} bytes]`;
        break;

      case OptimizationType.BUNDLE_ANALYZE:
        // Simulate bundle analysis
        optimizedContent = JSON.stringify({
          totalSize: originalSize,
          gzippedSize: Math.floor(originalSize * 0.3),
          modules: [
            { name: 'main.js', size: Math.floor(originalSize * 0.6) },
            { name: 'vendor.js', size: Math.floor(originalSize * 0.3) },
            { name: 'styles.css', size: Math.floor(originalSize * 0.1) }
          ],
          recommendations: [
            'Consider code splitting for better performance',
            'Remove unused dependencies',
            'Enable gzip compression'
          ]
        }, null, 2);
        break;
    }

    if (optimizedSize === originalSize) {
      optimizedSize = optimizedContent.length;
    }

    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

    return {
      optimizedContent,
      stats: {
        originalSize,
        optimizedSize,
        compressionRatio,
        timeSaved: Math.floor(compressionRatio * 10), // Simulate time saved in ms
        warnings: [],
        suggestions: [
          compressionRatio > 50 ? 'Excellent compression achieved!' : 'Consider more aggressive settings for better compression',
          'Enable gzip compression on your server for additional savings'
        ]
      }
    };
  }, []);

  const startOptimization = useCallback(async () => {
    if (!selectedFile) return;

    setIsOptimizing(true);

    try {
      const fileRef: FileReference = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        url: URL.createObjectURL(selectedFile),
        metadata: {
          lastModified: new Date(selectedFile.lastModified),
          customProperties: {}
        },
        permissions: {
          canRead: true,
          canWrite: true,
          canDelete: true,
          canShare: false
        },
        created: new Date(),
        lastModified: new Date(),
        versions: []
      };

      const optimization: CodeOptimization = {
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedTool.type,
        inputFile: fileRef,
        status: 'processing',
        progress: 0,
        startTime: new Date(),
        originalSize: selectedFile.size,
        settings: customSettings,
        created: new Date(),
        lastModified: new Date()
      };

      onOptimizationCreate(optimization);

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        onOptimizationChange({
          ...optimization,
          progress,
          lastModified: new Date()
        });
      }

      // Perform optimization
      const { optimizedContent, stats } = await simulateOptimization(
        selectedFile,
        selectedTool,
        customSettings
      );

      // Create optimized file
      const optimizedBlob = new Blob([optimizedContent], { type: selectedFile.type });
      const optimizedFileRef: FileReference = {
        ...fileRef,
        id: `file_${Date.now()}_optimized`,
        name: `${selectedFile.name.split('.')[0]}.min.${selectedFile.name.split('.').pop()}`,
        size: optimizedBlob.size,
        url: URL.createObjectURL(optimizedBlob)
      };

      const completedOptimization: CodeOptimization = {
        ...optimization,
        status: 'completed',
        progress: 100,
        endTime: new Date(),
        outputFile: optimizedFileRef,
        optimizedSize: stats.optimizedSize,
        compressionRatio: stats.compressionRatio,
        result: {
          originalSize: stats.originalSize,
          optimizedSize: stats.optimizedSize,
          compressionRatio: stats.compressionRatio,
          timeSaved: stats.timeSaved,
          warnings: stats.warnings,
          suggestions: stats.suggestions,
          metrics: {
            parseTime: 50,
            optimizeTime: 150,
            outputTime: 25
          }
        },
        lastModified: new Date()
      };

      onOptimizationChange(completedOptimization);

    } catch (error) {
      const failedOptimization: CodeOptimization = {
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedTool.type,
        inputFile: {
          id: 'temp',
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          url: '',
          metadata: { customProperties: {} },
          permissions: { canRead: true, canWrite: true, canDelete: true, canShare: false },
          created: new Date(),
          lastModified: new Date(),
          versions: []
        },
        status: 'failed',
        progress: 0,
        startTime: new Date(),
        endTime: new Date(),
        originalSize: selectedFile.size,
        settings: customSettings,
        error: error instanceof Error ? error.message : 'Optimization failed',
        created: new Date(),
        lastModified: new Date()
      };

      onOptimizationChange(failedOptimization);
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedFile, selectedTool, customSettings, onOptimizationCreate, onOptimizationChange, simulateOptimization]);

  const downloadOptimizedFile = useCallback((optimization: CodeOptimization) => {
    if (!optimization.outputFile) return;

    const a = document.createElement('a');
    a.href = optimization.outputFile.url;
    a.download = optimization.outputFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const clearOptimizations = useCallback(() => {
    // This would typically call a parent function to clear optimizations
    console.log('Clear optimizations');
  }, []);

  const recentOptimizations = optimizations.slice(-5);
  const totalSavings = optimizations.reduce((total, opt) => {
    return total + (opt.result?.compressionRatio || 0);
  }, 0);

  return (
    <div className="code-optimizer">
      {/* Header */}
      <div className="optimizer-header">
        <div className="optimizer-title">
          <h3>Code Optimizer</h3>
          <div className="optimizer-stats">
            {optimizations.length} optimizations • {totalSavings.toFixed(1)}% avg savings
          </div>
        </div>
        
        <div className="optimizer-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearOptimizations}
            disabled={optimizations.length === 0}
            title="Clear History"
          >
            🗑️ Clear
          </Button>
        </div>
      </div>

      <div className="optimizer-content">
        {/* Tool Selection */}
        <div className="tool-selection">
          <h4>Optimization Tools</h4>
          <div className="tools-grid">
            {OPTIMIZATION_TOOLS.map(tool => (
              <button
                key={tool.type}
                className={`tool-card ${selectedTool.type === tool.type ? 'active' : ''}`}
                onClick={() => setSelectedTool(tool)}
              >
                <div className="tool-icon">{tool.icon}</div>
                <div className="tool-info">
                  <div className="tool-name">{tool.name}</div>
                  <div className="tool-description">{tool.description}</div>
                  <div className="tool-formats">
                    {tool.supportedFormats.join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="file-upload-section">
          <h4>Select File</h4>
          <div
            className={`file-drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="selected-file">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                  <div className="file-type">{selectedFile.type}</div>
                </div>
                <button
                  className="remove-file"
                  onClick={() => setSelectedFile(null)}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="drop-placeholder">
                <div className="drop-icon">📁</div>
                <p>Drop a file here or click to select</p>
                <p className="supported-formats">
                  Supported: {selectedTool.supportedFormats.join(', ')}
                </p>
              </div>
            )}
            
            <input
              type="file"
              onChange={handleFileSelect}
              accept={selectedTool.supportedFormats.map(f => `.${f}`).join(',')}
              className="file-input"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="settings-section">
          <h4>Optimization Settings</h4>
          <div className="settings-grid">
            <div className="setting-group">
              <label>
                <input
                  type="radio"
                  name="level"
                  value="basic"
                  checked={customSettings.level === 'basic'}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, level: e.target.value as any }))}
                />
                Basic optimization
              </label>
            </div>
            
            <div className="setting-group">
              <label>
                <input
                  type="radio"
                  name="level"
                  value="aggressive"
                  checked={customSettings.level === 'aggressive'}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, level: e.target.value as any }))}
                />
                Aggressive optimization
              </label>
            </div>
            
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={customSettings.preserveComments}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, preserveComments: e.target.checked }))}
                />
                Preserve comments
              </label>
            </div>
            
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={customSettings.removeUnused}
                  onChange={(e) => setCustomSettings(prev => ({ ...prev, removeUnused: e.target.checked }))}
                />
                Remove unused code
              </label>
            </div>
            
            {selectedTool.type === OptimizationType.JS_UGLIFY && (
              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={customSettings.mangleNames}
                    onChange={(e) => setCustomSettings(prev => ({ ...prev, mangleNames: e.target.checked }))}
                  />
                  Mangle variable names
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Optimize Button */}
        <div className="optimize-section">
          <Button
            variant="primary"
            size="lg"
            onClick={startOptimization}
            disabled={!selectedFile || isOptimizing}
            className="optimize-button"
          >
            {isOptimizing ? '⏳ Optimizing...' : `🚀 Optimize with ${selectedTool.name}`}
          </Button>
        </div>

        {/* Recent Optimizations */}
        {recentOptimizations.length > 0 && (
          <div className="results-section">
            <h4>Recent Optimizations</h4>
            <div className="results-list">
              {recentOptimizations.map(optimization => (
                <div key={optimization.id} className={`result-item ${optimization.status}`}>
                  <div className="result-header">
                    <div className="result-info">
                      <span className="result-tool">
                        {OPTIMIZATION_TOOLS.find(t => t.type === optimization.type)?.icon} 
                        {OPTIMIZATION_TOOLS.find(t => t.type === optimization.type)?.name}
                      </span>
                      <span className="result-file">{optimization.inputFile.name}</span>
                    </div>
                    <div className="result-status">{optimization.status}</div>
                  </div>
                  
                  {optimization.status === 'processing' && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${optimization.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {optimization.result && (
                    <div className="result-stats">
                      <div className="stat-item">
                        <span className="stat-label">Original:</span>
                        <span className="stat-value">{(optimization.result.originalSize / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Optimized:</span>
                        <span className="stat-value">{(optimization.result.optimizedSize / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="stat-item savings">
                        <span className="stat-label">Savings:</span>
                        <span className="stat-value">{optimization.result.compressionRatio.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                  
                  {optimization.error && (
                    <div className="result-error">
                      Error: {optimization.error}
                    </div>
                  )}
                  
                  {optimization.outputFile && (
                    <div className="result-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadOptimizedFile(optimization)}
                      >
                        📥 Download
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .code-optimizer {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
        }

        .optimizer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
        }

        .optimizer-title h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .optimizer-stats {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        .optimizer-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .optimizer-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-lg);
        }

        .tool-selection,
        .file-upload-section,
        .settings-section,
        .optimize-section,
        .results-section {
          margin-bottom: var(--spacing-lg);
        }

        .tool-selection h4,
        .file-upload-section h4,
        .settings-section h4,
        .results-section h4 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }

        .tool-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .tool-card:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-primary);
        }

        .tool-card.active {
          background: var(--color-primary-subtle);
          border-color: var(--color-primary);
        }

        .tool-icon {
          font-size: var(--font-size-xl);
          min-width: 40px;
        }

        .tool-info {
          flex: 1;
        }

        .tool-name {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .tool-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xs);
          line-height: 1.4;
        }

        .tool-formats {
          font-size: var(--font-size-xs);
          color: var(--color-primary);
          font-weight: var(--font-weight-medium);
          text-transform: uppercase;
        }

        .file-drop-zone {
          position: relative;
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-xl);
          text-align: center;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .file-drop-zone:hover,
        .file-drop-zone.drag-over {
          border-color: var(--color-primary);
          background: var(--color-primary-subtle);
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .selected-file {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-radius: var(--radius-sm);
        }

        .file-icon {
          font-size: var(--font-size-xl);
        }

        .file-info {
          flex: 1;
          text-align: left;
        }

        .file-name {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .file-size,
        .file-type {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .remove-file {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-sm);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          transition: all 0.2s ease;
        }

        .remove-file:hover {
          background: var(--color-error-subtle);
          color: var(--color-error);
        }

        .drop-placeholder {
          color: var(--color-text-secondary);
        }

        .drop-icon {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-md);
        }

        .drop-placeholder p {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-md);
        }

        .supported-formats {
          font-size: var(--font-size-sm) !important;
          color: var(--color-text-secondary) !important;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .setting-group label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          cursor: pointer;
        }

        .setting-group input[type="checkbox"],
        .setting-group input[type="radio"] {
          margin: 0;
        }

        .optimize-section {
          text-align: center;
        }

        .optimize-button {
          min-width: 200px;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .result-item {
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .result-item.completed {
          border-left: 4px solid var(--color-success);
        }

        .result-item.failed {
          border-left: 4px solid var(--color-error);
        }

        .result-item.processing {
          border-left: 4px solid var(--color-warning);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .result-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .result-tool {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .result-file {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .result-status {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          text-transform: capitalize;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: var(--color-border);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: var(--spacing-sm);
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary);
          transition: width 0.3s ease;
        }

        .result-stats {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-sm);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .stat-item.savings {
          color: var(--color-success);
        }

        .stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }

        .stat-value {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .stat-item.savings .stat-value {
          color: var(--color-success);
        }

        .result-error {
          color: var(--color-error);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-sm);
        }

        .result-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        @media (max-width: 1024px) {
          .tools-grid {
            grid-template-columns: 1fr;
          }

          .settings-grid {
            grid-template-columns: 1fr;
          }

          .result-stats {
            flex-direction: column;
            gap: var(--spacing-sm);
          }
        }

        @media (max-width: 768px) {
          .optimizer-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .optimizer-actions {
            justify-content: center;
          }

          .optimizer-content {
            padding: var(--spacing-md);
          }

          .result-header {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-sm);
          }
        }
      `}</style>
    </div>
  );
};