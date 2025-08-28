import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SVGEditIntegration as ISVGEditIntegration } from '@/types/creative-studio';
import Button from '@/components/ui/Button';

interface SVGEditIntegrationProps {
  initialSVG?: string;
  onSVGChange?: (svg: string) => void;
  onSave?: (svg: string) => void;
  className?: string;
}

export const SVGEditIntegration: React.FC<SVGEditIntegrationProps> = ({
  initialSVG,
  onSVGChange,
  onSave,
  className = ''
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSVG, setCurrentSVG] = useState<string>(initialSVG || '');
  const [showPreview, setShowPreview] = useState(false);

  // SVG-Edit integration implementation
  const svgEditIntegration: ISVGEditIntegration = {
    async loadSVG(svgContent: string): Promise<void> {
      if (!iframeRef.current) throw new Error('SVG-Edit not initialized');
      
      try {
        const message = {
          type: 'load_svg',
          data: { content: svgContent }
        };

        iframeRef.current?.contentWindow?.postMessage(message, '*');
        setCurrentSVG(svgContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load SVG');
        throw err;
      }
    },

    async saveSVG(): Promise<string> {
      if (!iframeRef.current) throw new Error('SVG-Edit not initialized');

      return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'svg_saved') {
            window.removeEventListener('message', messageHandler);
            
            if (event.data.success) {
              resolve(event.data.content);
            } else {
              reject(new Error(event.data.error || 'Failed to save SVG'));
            }
          }
        };

        window.addEventListener('message', messageHandler);

        const message = { type: 'save_svg' };
        iframeRef.current.contentWindow?.postMessage(message, '*');

        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('Save operation timed out'));
        }, 10000);
      });
    },

    async createElement(type: string, attributes: Record<string, any>): Promise<void> {
      if (!iframeRef.current) throw new Error('SVG-Edit not initialized');

      const message = {
        type: 'create_element',
        data: { type, attributes }
      };

      iframeRef.current.contentWindow?.postMessage(message, '*');
    },

    async updateElement(id: string, attributes: Record<string, any>): Promise<void> {
      if (!iframeRef.current) throw new Error('SVG-Edit not initialized');

      const message = {
        type: 'update_element',
        data: { id, attributes }
      };

      iframeRef.current.contentWindow?.postMessage(message, '*');
    },

    async deleteElement(id: string): Promise<void> {
      if (!iframeRef.current) throw new Error('SVG-Edit not initialized');

      const message = {
        type: 'delete_element',
        data: { id }
      };

      iframeRef.current.contentWindow?.postMessage(message, '*');
    }
  };

  // Handle messages from SVG-Edit
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from SVG-Edit domains
      const allowedOrigins = [
        'https://svg-edit.github.io',
        'https://svgedit.netlify.app',
        'http://localhost:3000' // For local development
      ];
      
      if (!allowedOrigins.some(origin => event.origin.startsWith(origin))) return;

      switch (event.data.type) {
        case 'svgedit_loaded':
          setIsLoaded(true);
          setIsLoading(false);
          setError(null);
          break;

        case 'svg_changed':
          if (event.data.content) {
            setCurrentSVG(event.data.content);
            if (onSVGChange) {
              onSVGChange(event.data.content);
            }
          }
          break;

        case 'element_created':
        case 'element_updated':
        case 'element_deleted':
          // Trigger SVG change event
          svgEditIntegration.saveSVG()
            .then(svg => {
              setCurrentSVG(svg);
              if (onSVGChange) {
                onSVGChange(svg);
              }
            })
            .catch(console.error);
          break;

        case 'error':
          setError(event.data.message);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSVGChange]);

  // Load initial SVG when component loads
  useEffect(() => {
    if (initialSVG && isLoaded) {
      svgEditIntegration.loadSVG(initialSVG).catch(console.error);
    }
  }, [initialSVG, isLoaded]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    
    // Initialize SVG-Edit with custom settings
    if (iframeRef.current) {
      const initMessage = {
        type: 'init',
        data: {
          theme: 'dark',
          language: 'en',
          showGrid: true,
          snapToGrid: false
        }
      };
      
      // Wait for SVG-Edit to fully load
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(initMessage, '*');
      }, 2000);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const svg = await svgEditIntegration.saveSVG();
      if (onSave) {
        onSave(svg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save SVG');
    }
  }, [onSave]);

  const handleCreateShape = useCallback(async (shape: string) => {
    try {
      const attributes: Record<string, any> = {};
      
      switch (shape) {
        case 'rect':
          attributes.width = 100;
          attributes.height = 100;
          attributes.x = 50;
          attributes.y = 50;
          attributes.fill = '#0066cc';
          break;
        case 'circle':
          attributes.cx = 100;
          attributes.cy = 100;
          attributes.r = 50;
          attributes.fill = '#cc6600';
          break;
        case 'line':
          attributes.x1 = 50;
          attributes.y1 = 50;
          attributes.x2 = 150;
          attributes.y2 = 150;
          attributes.stroke = '#000000';
          attributes['stroke-width'] = 2;
          break;
        case 'text':
          attributes.x = 50;
          attributes.y = 50;
          attributes.fill = '#000000';
          attributes['font-size'] = 16;
          attributes['font-family'] = 'Arial';
          break;
      }

      await svgEditIntegration.createElement(shape, attributes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shape');
    }
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (confirm('Clear the entire canvas? This action cannot be undone.')) {
      const emptySVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
        <title>Empty Canvas</title>
      </svg>`;
      
      svgEditIntegration.loadSVG(emptySVG).catch(console.error);
    }
  }, []);

  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  return (
    <div className={`svgedit-integration ${className}`}>
      {/* Custom Toolbar */}
      <div className="svgedit-toolbar">
        <div className="toolbar-section">
          <h4>Shapes</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateShape('rect')}
            disabled={!isLoaded}
            title="Add Rectangle"
          >
            ⬜
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateShape('circle')}
            disabled={!isLoaded}
            title="Add Circle"
          >
            ⭕
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateShape('line')}
            disabled={!isLoaded}
            title="Add Line"
          >
            📏
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateShape('text')}
            disabled={!isLoaded}
            title="Add Text"
          >
            📝
          </Button>
        </div>

        <div className="toolbar-section">
          <h4>Actions</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!isLoaded}
            title="Save SVG"
          >
            💾 Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearCanvas}
            disabled={!isLoaded}
            title="Clear Canvas"
          >
            🗑️ Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePreview}
            disabled={!isLoaded}
            title="Toggle Preview"
          >
            {showPreview ? '✏️ Edit' : '👁️ Preview'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="svgedit-content">
        {/* SVG-Edit iframe */}
        <div className={`svgedit-container ${showPreview ? 'split-view' : ''}`}>
          {isLoading && (
            <div className="svgedit-loading">
              <div className="loading-spinner"></div>
              <p>Loading SVG-Edit...</p>
            </div>
          )}

          {error && (
            <div className="svgedit-error">
              <p>Error: {error}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  if (iframeRef.current) {
                    iframeRef.current.src = iframeRef.current.src;
                  }
                }}
              >
                Retry
              </Button>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src="https://svg-edit.github.io/svgedit/editor/svg-editor.html"
            className="svgedit-iframe"
            onLoad={handleIframeLoad}
            title="SVG-Edit Vector Editor"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ display: error ? 'none' : 'block' }}
          />
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="svg-preview">
            <div className="preview-header">
              <h4>Live Preview</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const blob = new Blob([currentSVG], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'drawing.svg';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={!currentSVG}
                title="Download SVG"
              >
                ⬇️
              </Button>
            </div>
            <div className="preview-content">
              {currentSVG ? (
                <div
                  className="svg-display"
                  dangerouslySetInnerHTML={{ __html: currentSVG }}
                />
              ) : (
                <div className="preview-placeholder">
                  <p>No SVG content to preview</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .svgedit-integration {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .svgedit-toolbar {
          display: flex;
          gap: var(--spacing-lg);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
          overflow-x: auto;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          white-space: nowrap;
        }

        .toolbar-section h4 {
          margin: 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
          margin-right: var(--spacing-sm);
        }

        .svgedit-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .svgedit-container {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .svgedit-container.split-view {
          flex: 0 0 60%;
        }

        .svgedit-iframe {
          flex: 1;
          border: none;
          width: 100%;
          height: 100%;
          min-height: 600px;
        }

        .svgedit-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          z-index: 10;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .svgedit-loading p {
          color: var(--color-text-secondary);
          font-size: var(--font-size-md);
        }

        .svgedit-error {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          z-index: 10;
          gap: var(--spacing-md);
        }

        .svgedit-error p {
          color: var(--color-error);
          font-size: var(--font-size-md);
          text-align: center;
          margin: 0;
        }

        .svg-preview {
          flex: 0 0 40%;
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--color-border);
          background: var(--color-surface-elevated);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }

        .preview-header h4 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .preview-content {
          flex: 1;
          padding: var(--spacing-md);
          overflow: auto;
        }

        .svg-display {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }

        .svg-display :global(svg) {
          max-width: 100%;
          max-height: 100%;
          height: auto;
        }

        .preview-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          background: var(--color-surface);
          border-radius: var(--radius-sm);
          border: 2px dashed var(--color-border);
        }

        .preview-placeholder p {
          color: var(--color-text-secondary);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .svgedit-toolbar {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .toolbar-section {
            flex-wrap: wrap;
          }

          .svgedit-content {
            flex-direction: column;
          }

          .svgedit-container.split-view {
            flex: 0 0 60%;
          }

          .svg-preview {
            flex: 0 0 40%;
            border-left: none;
            border-top: 1px solid var(--color-border);
          }

          .svgedit-iframe {
            min-height: 400px;
          }
        }
      `}</style>
    </div>
  );
};