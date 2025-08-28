import React, { useState, useCallback, useEffect } from 'react';
import { CreativeStudioWorkspace, Canvas, ColorPalette, CanvasType, LayerType, BlendMode } from '@/types/creative-studio';
import { FileReference } from '@/types/file';
import { CanvasManager } from './CanvasManager';
import { LayerManager } from './LayerManager';
import { PhotoPeaIntegration } from './PhotoPeaIntegration';
import { SVGEditIntegration } from './SVGEditIntegration';
import { CoolorsIntegration } from './CoolorsIntegration';
import { TinyPNGIntegration } from './TinyPNGIntegration';
import { ExportSystem } from './ExportSystem';
import Button from '@/components/ui/Button';

interface CreativeContentStudioProps {
  workspaceId: string;
  onWorkspaceChange?: (workspace: CreativeStudioWorkspace) => void;
  className?: string;
}

type ActiveTool = 'canvas' | 'layers' | 'photopea' | 'svgedit' | 'colors' | 'optimize' | 'export';

export const CreativeContentStudio: React.FC<CreativeContentStudioProps> = ({
  onWorkspaceChange,
  className = ''
}) => {
  const [workspace, setWorkspace] = useState<CreativeStudioWorkspace>({
    canvases: [],
    palettes: [],
    recentColors: [],
    tools: {
      activeTool: 'brush',
      brushSettings: {
        size: 10,
        hardness: 100,
        opacity: 1,
        flow: 1,
        color: '#000000',
        blendMode: BlendMode.NORMAL
      },
      selectionSettings: {
        type: 'rectangle',
        feather: 0,
        antiAlias: true,
        tolerance: 32
      },
      textSettings: {
        family: 'Arial',
        size: 24,
        weight: 'normal',
        style: 'normal',
        color: '#000000',
        decoration: 'none'
      },
      shapeSettings: {
        fill: {
          type: 'solid',
          color: '#0066cc'
        },
        stroke: {
          enabled: true,
          color: '#000000',
          width: 1,
          style: 'solid'
        }
      }
    },
    history: {
      states: [],
      currentIndex: -1,
      maxStates: 50
    },
    preferences: {
      defaultCanvasSize: { width: 1920, height: 1080 },
      defaultDPI: 72,
      defaultColorMode: 'RGB',
      autoSave: true,
      autoSaveInterval: 30000,
      maxHistoryStates: 50,
      showGrid: false,
      snapToGrid: false,
      gridSize: 20,
      showRulers: true,
      units: 'px'
    }
  });

  const [activeTool, setActiveTool] = useState<ActiveTool>('canvas');
  const [selectedFile] = useState<FileReference | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize workspace with a default canvas if empty
  useEffect(() => {
    if (workspace.canvases.length === 0) {
      const defaultCanvas: Canvas = {
        id: `canvas_${Date.now()}_default`,
        name: 'Untitled Canvas',
        type: CanvasType.RASTER,
        width: workspace.preferences.defaultCanvasSize.width,
        height: workspace.preferences.defaultCanvasSize.height,
        dpi: workspace.preferences.defaultDPI,
        colorMode: workspace.preferences.defaultColorMode,
        backgroundColor: '#ffffff',
        layers: [
          {
            id: `layer_${Date.now()}_bg`,
            name: 'Background',
            type: LayerType.IMAGE,
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: BlendMode.NORMAL,
            position: { x: 0, y: 0, z: 0 },
            size: { 
              width: workspace.preferences.defaultCanvasSize.width, 
              height: workspace.preferences.defaultCanvasSize.height 
            },
            rotation: 0,
            content: {
              type: LayerType.IMAGE,
              data: {
                src: '',
                filters: [],
                adjustments: {
                  brightness: 0,
                  contrast: 0,
                  saturation: 0,
                  hue: 0,
                  gamma: 1,
                  exposure: 0,
                  highlights: 0,
                  shadows: 0,
                  whites: 0,
                  blacks: 0
                }
              }
            },
            effects: [],
            childIds: [],
            created: new Date(),
            lastModified: new Date()
          }
        ],
        created: new Date(),
        lastModified: new Date(),
        metadata: {}
      };

      setWorkspace(prev => ({
        ...prev,
        canvases: [defaultCanvas],
        activeCanvasId: defaultCanvas.id
      }));
    }
  }, [workspace.canvases.length, workspace.preferences]);

  // Save workspace changes
  useEffect(() => {
    if (onWorkspaceChange) {
      onWorkspaceChange(workspace);
    }
  }, [workspace, onWorkspaceChange]);

  const handleWorkspaceChange = useCallback((updatedWorkspace: CreativeStudioWorkspace) => {
    setWorkspace(updatedWorkspace);
  }, []);

  const handleCanvasChange = useCallback((updatedCanvas: Canvas) => {
    setWorkspace(prev => ({
      ...prev,
      canvases: prev.canvases.map(canvas =>
        canvas.id === updatedCanvas.id ? updatedCanvas : canvas
      )
    }));
  }, []);

  const handleCanvasSelect = useCallback((canvasId: string) => {
    setWorkspace(prev => ({
      ...prev,
      activeCanvasId: canvasId
    }));
  }, []);

  const handlePaletteSelect = useCallback((palette: ColorPalette) => {
    setWorkspace(prev => ({
      ...prev,
      palettes: [palette, ...prev.palettes.filter(p => p.id !== palette.id)],
      recentColors: [...palette.colors.slice(0, 5), ...prev.recentColors.slice(0, 15)]
    }));
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setWorkspace(prev => ({
      ...prev,
      recentColors: [color, ...prev.recentColors.filter(c => c !== color).slice(0, 19)],
      tools: {
        ...prev.tools,
        brushSettings: {
          ...prev.tools.brushSettings,
          color
        },
        textSettings: {
          ...prev.tools.textSettings,
          color
        }
      }
    }));
  }, []);

  const handleFileOptimized = useCallback((originalFile: File, optimizedBlob: Blob, stats: any) => {
    // Handle optimized file - could save to workspace or trigger download
    console.log('File optimized:', {
      original: originalFile.name,
      originalSize: originalFile.size,
      optimizedSize: optimizedBlob.size,
      savings: stats.percentage
    });
  }, []);

  const handleExport = useCallback((blob: Blob, format: string) => {
    // Handle export - download the file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getCurrentCanvas()?.name || 'canvas'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const getCurrentCanvas = (): Canvas | undefined => {
    return workspace.canvases.find(canvas => canvas.id === workspace.activeCanvasId);
  };

  const renderActiveTool = () => {
    const currentCanvas = getCurrentCanvas();
    
    switch (activeTool) {
      case 'canvas':
        return (
          <CanvasManager
            workspace={workspace}
            onWorkspaceChange={handleWorkspaceChange}
            onCanvasSelect={handleCanvasSelect}
          />
        );
      
      case 'layers':
        return currentCanvas ? (
          <LayerManager
            canvas={currentCanvas}
            onCanvasChange={handleCanvasChange}
          />
        ) : (
          <div className="tool-placeholder">
            <p>No canvas selected</p>
          </div>
        );
      
      case 'photopea':
        return (
          <PhotoPeaIntegration
            file={selectedFile || undefined}
            onSave={(blob, format) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `edited_image.${format}`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          />
        );
      
      case 'svgedit':
        return (
          <SVGEditIntegration
            onSave={(svg) => {
              const blob = new Blob([svg], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'drawing.svg';
              a.click();
              URL.revokeObjectURL(url);
            }}
          />
        );
      
      case 'colors':
        return (
          <CoolorsIntegration
            onPaletteSelect={handlePaletteSelect}
            onColorSelect={handleColorSelect}
          />
        );
      
      case 'optimize':
        return (
          <TinyPNGIntegration
            onOptimized={handleFileOptimized}
          />
        );
      
      case 'export':
        return currentCanvas ? (
          <ExportSystem
            canvas={currentCanvas}
            onExport={handleExport}
          />
        ) : (
          <div className="tool-placeholder">
            <p>No canvas selected</p>
          </div>
        );
      
      default:
        return (
          <div className="tool-placeholder">
            <p>Select a tool to get started</p>
          </div>
        );
    }
  };

  return (
    <div className={`creative-content-studio ${className}`}>
      {/* Header */}
      <div className="studio-header">
        <div className="studio-title">
          <h2>Creative Content Studio</h2>
          <div className="canvas-info">
            {getCurrentCanvas() && (
              <span>{getCurrentCanvas()?.name} • {getCurrentCanvas()?.width}×{getCurrentCanvas()?.height}</span>
            )}
          </div>
        </div>
        
        <div className="studio-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTool('export')}
            disabled={!getCurrentCanvas()}
          >
            📤 Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="studio-content">
        {/* Sidebar */}
        <div className="studio-sidebar">
          <div className="tool-tabs">
            <button
              className={`tool-tab ${activeTool === 'canvas' ? 'active' : ''}`}
              onClick={() => setActiveTool('canvas')}
              title="Canvas Manager"
            >
              🖼️ Canvas
            </button>
            <button
              className={`tool-tab ${activeTool === 'layers' ? 'active' : ''}`}
              onClick={() => setActiveTool('layers')}
              title="Layer Manager"
            >
              📚 Layers
            </button>
            <button
              className={`tool-tab ${activeTool === 'photopea' ? 'active' : ''}`}
              onClick={() => setActiveTool('photopea')}
              title="PhotoPea Editor"
            >
              🎨 PhotoPea
            </button>
            <button
              className={`tool-tab ${activeTool === 'svgedit' ? 'active' : ''}`}
              onClick={() => setActiveTool('svgedit')}
              title="SVG Editor"
            >
              ⚡ SVG Edit
            </button>
            <button
              className={`tool-tab ${activeTool === 'colors' ? 'active' : ''}`}
              onClick={() => setActiveTool('colors')}
              title="Color Palettes"
            >
              🎨 Colors
            </button>
            <button
              className={`tool-tab ${activeTool === 'optimize' ? 'active' : ''}`}
              onClick={() => setActiveTool('optimize')}
              title="Image Optimization"
            >
              ⚡ Optimize
            </button>
            <button
              className={`tool-tab ${activeTool === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTool('export')}
              title="Export System"
            >
              📤 Export
            </button>
          </div>
        </div>

        {/* Tool Panel */}
        <div className="tool-panel">
          {renderActiveTool()}
        </div>

        {/* Main Canvas Area */}
        <div className="canvas-area">
          <div className="canvas-viewport">
            {getCurrentCanvas() ? (
              <div className="canvas-container">
                <div 
                  className="canvas-preview"
                  style={{
                    width: Math.min(600, getCurrentCanvas()!.width),
                    height: Math.min(400, getCurrentCanvas()!.height),
                    backgroundColor: getCurrentCanvas()!.backgroundColor,
                    aspectRatio: `${getCurrentCanvas()!.width} / ${getCurrentCanvas()!.height}`
                  }}
                >
                  <div className="canvas-overlay">
                    <p>Canvas Preview</p>
                    <small>{getCurrentCanvas()!.width} × {getCurrentCanvas()!.height}</small>
                  </div>
                </div>
              </div>
            ) : (
              <div className="canvas-placeholder">
                <p>Create a canvas to get started</p>
                <Button
                  variant="primary"
                  onClick={() => setActiveTool('canvas')}
                >
                  Create Canvas
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-toast">
          <p>{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
          >
            ✕
          </Button>
        </div>
      )}

      <style>{`
        .creative-content-studio {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--color-background);
          color: var(--color-text-primary);
        }

        .studio-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }

        .studio-title h2 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .canvas-info {
          margin-top: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .studio-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .studio-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .studio-sidebar {
          width: 60px;
          background: var(--color-surface-elevated);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
        }

        .tool-tabs {
          display: flex;
          flex-direction: column;
          padding: var(--spacing-sm);
          gap: var(--spacing-xs);
        }

        .tool-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-align: center;
          line-height: 1.2;
        }

        .tool-tab:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-border);
        }

        .tool-tab.active {
          background: var(--color-primary-subtle);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .tool-panel {
          width: 320px;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          overflow: hidden;
        }

        .canvas-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--color-background);
        }

        .canvas-viewport {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          overflow: auto;
        }

        .canvas-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .canvas-preview {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-md);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 200px;
          min-height: 150px;
        }

        .canvas-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--color-text-secondary);
          text-align: center;
        }

        .canvas-overlay p {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-medium);
        }

        .canvas-overlay small {
          font-size: var(--font-size-sm);
        }

        .canvas-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
          text-align: center;
          color: var(--color-text-secondary);
        }

        .canvas-placeholder p {
          margin: 0;
          font-size: var(--font-size-lg);
        }

        .tool-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--color-text-secondary);
          text-align: center;
        }

        .tool-placeholder p {
          margin: 0;
          font-style: italic;
        }

        .error-toast {
          position: fixed;
          bottom: var(--spacing-lg);
          right: var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--color-error);
          color: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
        }

        .error-toast p {
          margin: 0;
          font-size: var(--font-size-sm);
        }

        @media (max-width: 1024px) {
          .studio-content {
            flex-direction: column;
          }

          .studio-sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }

          .tool-tabs {
            flex-direction: row;
            overflow-x: auto;
            padding: var(--spacing-sm) var(--spacing-md);
          }

          .tool-panel {
            width: 100%;
            height: 300px;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }

          .canvas-area {
            min-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .studio-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .tool-panel {
            height: 250px;
          }

          .canvas-viewport {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
};