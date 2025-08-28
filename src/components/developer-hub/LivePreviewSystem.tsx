import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CodeProject, LivePreview, PreviewDevice, PreviewError, DeveloperPreferences } from '@/types/developer-hub';
import Button from '@/components/ui/Button';

interface LivePreviewSystemProps {
  project: CodeProject;
  previews: LivePreview[];
  preferences: DeveloperPreferences['preview'];
  onPreviewCreate: () => void;
  onPreviewChange: (preview: LivePreview) => void;
}

export const LivePreviewSystem: React.FC<LivePreviewSystemProps> = ({
  project,
  previews,
  preferences,
  onPreviewCreate,
  onPreviewChange
}) => {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Get active preview
  const activePreview = previews.find(p => p.id === activePreviewId) || previews[0];

  // Initialize with first preview or create one
  useEffect(() => {
    if (previews.length === 0) {
      onPreviewCreate();
    } else if (!activePreviewId) {
      setActivePreviewId(previews[0].id);
    }
  }, [previews.length, activePreviewId, onPreviewCreate]);

  // Generate preview content from project files
  const generatePreviewContent = useCallback(() => {
    const htmlFile = project.files.find(f => f.name.endsWith('.html') || f.language === 'html');
    const cssFiles = project.files.filter(f => f.name.endsWith('.css') || f.language === 'css');
    const jsFiles = project.files.filter(f => f.name.endsWith('.js') || f.language === 'javascript');

    if (!htmlFile) {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview - ${project.name}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 2rem;
                    background: #f5f5f5;
                    color: #333;
                    text-align: center;
                }
                .preview-message {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 500px;
                    margin: 2rem auto;
                }
                .preview-message h1 {
                    color: #666;
                    margin-bottom: 1rem;
                }
                .preview-message p {
                    color: #888;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <div class="preview-message">
                <h1>No HTML File Found</h1>
                <p>Create an HTML file in your project to see the live preview.</p>
                <p>Project: <strong>${project.name}</strong></p>
                <p>Files: ${project.files.length}</p>
            </div>
        </body>
        </html>
      `;
    }

    let content = htmlFile.content;

    // Inject CSS files
    if (cssFiles.length > 0) {
      const cssContent = cssFiles.map(file => `<style>\n${file.content}\n</style>`).join('\n');
      
      if (content.includes('</head>')) {
        content = content.replace('</head>', `${cssContent}\n</head>`);
      } else {
        content = `<head>\n${cssContent}\n</head>\n${content}`;
      }
    }

    // Inject JavaScript files
    if (jsFiles.length > 0) {
      const jsContent = jsFiles.map(file => `<script>\n${file.content}\n</script>`).join('\n');
      
      if (content.includes('</body>')) {
        content = content.replace('</body>', `${jsContent}\n</body>`);
      } else {
        content = `${content}\n${jsContent}`;
      }
    }

    // Add error handling script
    const errorHandlingScript = `
      <script>
        window.addEventListener('error', function(e) {
          window.parent.postMessage({
            type: 'preview-error',
            error: {
              message: e.message,
              filename: e.filename,
              lineno: e.lineno,
              colno: e.colno,
              stack: e.error ? e.error.stack : null
            }
          }, '*');
        });

        window.addEventListener('unhandledrejection', function(e) {
          window.parent.postMessage({
            type: 'preview-error',
            error: {
              message: e.reason.message || e.reason,
              stack: e.reason.stack
            }
          }, '*');
        });

        // Performance monitoring
        window.addEventListener('load', function() {
          setTimeout(function() {
            const perfData = performance.getEntriesByType('navigation')[0];
            window.parent.postMessage({
              type: 'preview-performance',
              performance: {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
              }
            }, '*');
          }, 100);
        });
      </script>
    `;

    if (content.includes('</body>')) {
      content = content.replace('</body>', `${errorHandlingScript}\n</body>`);
    } else {
      content = `${content}\n${errorHandlingScript}`;
    }

    return content;
  }, [project]);

  // Update preview content when project changes
  useEffect(() => {
    const newContent = generatePreviewContent();
    setPreviewContent(newContent);

    // Auto-refresh if enabled
    if (activePreview?.autoRefresh && preferences.autoRefresh) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        refreshPreview();
      }, preferences.refreshDelay);
    }
  }, [project.files, generatePreviewContent, activePreview?.autoRefresh, preferences.autoRefresh, preferences.refreshDelay]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!activePreview) return;

      switch (event.data.type) {
        case 'preview-error':
          const error: PreviewError = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'javascript',
            message: event.data.error.message,
            file: event.data.error.filename,
            line: event.data.error.lineno,
            column: event.data.error.colno,
            stack: event.data.error.stack,
            timestamp: new Date(),
            severity: 'error'
          };

          onPreviewChange({
            ...activePreview,
            errors: [...activePreview.errors, error],
            lastRefresh: new Date()
          });
          break;

        case 'preview-performance':
          onPreviewChange({
            ...activePreview,
            performance: {
              ...activePreview.performance,
              ...event.data.performance
            },
            lastRefresh: new Date()
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activePreview, onPreviewChange]);

  const refreshPreview = useCallback(() => {
    if (!activePreview || !iframeRef.current) return;

    setIsRefreshing(true);
    
    // Clear previous errors
    onPreviewChange({
      ...activePreview,
      errors: [],
      warnings: [],
      lastRefresh: new Date()
    });

    // Refresh iframe
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (doc) {
      doc.open();
      doc.write(previewContent);
      doc.close();
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [activePreview, previewContent, onPreviewChange]);

  const changeDevice = useCallback((device: PreviewDevice) => {
    if (!activePreview) return;

    onPreviewChange({
      ...activePreview,
      activeDevice: device.id
    });
    
    setShowDeviceSelector(false);
  }, [activePreview, onPreviewChange]);

  const toggleAutoRefresh = useCallback(() => {
    if (!activePreview) return;

    onPreviewChange({
      ...activePreview,
      autoRefresh: !activePreview.autoRefresh
    });
  }, [activePreview, onPreviewChange]);

  const clearErrors = useCallback(() => {
    if (!activePreview) return;

    onPreviewChange({
      ...activePreview,
      errors: [],
      warnings: []
    });
  }, [activePreview, onPreviewChange]);

  if (!activePreview) {
    return (
      <div className="live-preview-system no-preview">
        <div className="no-preview-content">
          <h3>No Preview Available</h3>
          <p>Create a preview to see your project in action.</p>
          <Button variant="primary" onClick={onPreviewCreate}>
            Create Preview
          </Button>
        </div>
      </div>
    );
  }

  const currentDevice = activePreview.devices.find(d => d.id === activePreview.activeDevice) || activePreview.devices[0];
  const hasErrors = activePreview.errors.length > 0;
  const hasWarnings = activePreview.warnings.length > 0;

  return (
    <div className="live-preview-system">
      {/* Header */}
      <div className="preview-header">
        <div className="preview-title">
          <h3>Live Preview</h3>
          <div className="preview-info">
            {project.name} • {currentDevice.name}
          </div>
        </div>
        
        <div className="preview-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeviceSelector(!showDeviceSelector)}
            title="Change Device"
          >
            📱 {currentDevice.name}
          </Button>
          <Button
            variant={activePreview.autoRefresh ? "primary" : "ghost"}
            size="sm"
            onClick={toggleAutoRefresh}
            title="Toggle Auto Refresh"
          >
            🔄 Auto
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPreview}
            disabled={isRefreshing}
            title="Refresh Preview"
          >
            {isRefreshing ? '⏳' : '🔄'} Refresh
          </Button>
          {(hasErrors || hasWarnings) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowErrorPanel(!showErrorPanel)}
              title="Show Errors"
              className={hasErrors ? 'error-indicator' : 'warning-indicator'}
            >
              {hasErrors ? '❌' : '⚠️'} {activePreview.errors.length + activePreview.warnings.length}
            </Button>
          )}
        </div>
      </div>

      {/* Device Selector */}
      {showDeviceSelector && (
        <div className="device-selector">
          {activePreview.devices.map(device => (
            <button
              key={device.id}
              className={`device-option ${device.id === activePreview.activeDevice ? 'active' : ''}`}
              onClick={() => changeDevice(device)}
            >
              <div className="device-name">{device.name}</div>
              <div className="device-specs">{device.width}×{device.height}</div>
            </button>
          ))}
        </div>
      )}

      {/* Error Panel */}
      {showErrorPanel && (hasErrors || hasWarnings) && (
        <div className="error-panel">
          <div className="error-panel-header">
            <h4>Issues ({activePreview.errors.length + activePreview.warnings.length})</h4>
            <div className="error-panel-actions">
              <Button variant="ghost" size="sm" onClick={clearErrors}>
                Clear
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowErrorPanel(false)}>
                ✕
              </Button>
            </div>
          </div>
          
          <div className="error-list">
            {activePreview.errors.map(error => (
              <div key={error.id} className="error-item error">
                <div className="error-header">
                  <span className="error-type">❌ {error.type}</span>
                  <span className="error-time">{error.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="error-message">{error.message}</div>
                {error.file && (
                  <div className="error-location">
                    {error.file}:{error.line}:{error.column}
                  </div>
                )}
              </div>
            ))}
            
            {activePreview.warnings.map(warning => (
              <div key={warning.id} className="error-item warning">
                <div className="error-header">
                  <span className="error-type">⚠️ {warning.type}</span>
                  <span className="error-time">{warning.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="error-message">{warning.message}</div>
                {warning.suggestion && (
                  <div className="error-suggestion">💡 {warning.suggestion}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Content */}
      <div className="preview-content">
        <div 
          className="preview-frame"
          style={{
            width: currentDevice.width,
            height: currentDevice.height,
            maxWidth: '100%',
            maxHeight: '100%',
            transform: currentDevice.width > 800 ? 'scale(0.8)' : 'scale(1)',
            transformOrigin: 'top left'
          }}
        >
          <iframe
            ref={iframeRef}
            className="preview-iframe"
            title="Live Preview"
            srcDoc={previewContent}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'white'
            }}
          />
          
          {isRefreshing && (
            <div className="refresh-overlay">
              <div className="refresh-spinner"></div>
              <p>Refreshing...</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="preview-status">
        <div className="status-left">
          <span>Last updated: {activePreview.lastRefresh.toLocaleTimeString()}</span>
          {activePreview.performance.loadTime > 0 && (
            <>
              <span>•</span>
              <span>Load time: {activePreview.performance.loadTime.toFixed(0)}ms</span>
            </>
          )}
        </div>
        
        <div className="status-right">
          {activePreview.autoRefresh && (
            <span className="auto-refresh-indicator">🔄 Auto-refresh enabled</span>
          )}
        </div>
      </div>

      <style>{`
        .live-preview-system {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
        }

        .no-preview {
          justify-content: center;
          align-items: center;
        }

        .no-preview-content {
          text-align: center;
          color: var(--color-text-secondary);
        }

        .no-preview-content h3 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--color-text-primary);
        }

        .no-preview-content p {
          margin: 0 0 var(--spacing-lg) 0;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
        }

        .preview-title h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .preview-info {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        .preview-actions {
          display: flex;
          gap: var(--spacing-sm);
          align-items: center;
        }

        .error-indicator {
          color: var(--color-error) !important;
        }

        .warning-indicator {
          color: var(--color-warning) !important;
        }

        .device-selector {
          display: flex;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
          overflow-x: auto;
        }

        .device-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 80px;
        }

        .device-option:hover {
          background: var(--color-surface-hover);
        }

        .device-option.active {
          background: var(--color-primary-subtle);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .device-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .device-specs {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .error-panel {
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
          max-height: 200px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .error-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }

        .error-panel-header h4 {
          margin: 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .error-panel-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .error-list {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-sm);
        }

        .error-item {
          padding: var(--spacing-sm);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-sm);
        }

        .error-item.error {
          background: rgba(255, 107, 107, 0.1);
          border-left: 3px solid var(--color-error);
        }

        .error-item.warning {
          background: rgba(255, 193, 7, 0.1);
          border-left: 3px solid var(--color-warning);
        }

        .error-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }

        .error-type {
          font-weight: var(--font-weight-medium);
        }

        .error-time {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .error-message {
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .error-location {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          font-family: monospace;
        }

        .error-suggestion {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .preview-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          overflow: auto;
          background: #f5f5f5;
        }

        .preview-frame {
          position: relative;
          box-shadow: var(--shadow-lg);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .preview-iframe {
          display: block;
        }

        .refresh-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
        }

        .refresh-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-border);
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .refresh-overlay p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .preview-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-surface-elevated);
          border-top: 1px solid var(--color-border);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .status-left,
        .status-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .auto-refresh-indicator {
          color: var(--color-primary);
          font-weight: var(--font-weight-medium);
        }

        @media (max-width: 1024px) {
          .preview-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .preview-actions {
            justify-content: center;
          }

          .device-selector {
            justify-content: center;
          }

          .preview-content {
            padding: var(--spacing-md);
          }

          .preview-frame {
            transform: scale(0.9) !important;
          }
        }

        @media (max-width: 768px) {
          .error-panel {
            max-height: 150px;
          }

          .error-panel-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .error-panel-actions {
            justify-content: center;
          }

          .preview-status {
            flex-direction: column;
            gap: var(--spacing-xs);
            align-items: stretch;
            text-align: center;
          }

          .preview-frame {
            transform: scale(0.7) !important;
          }
        }
      `}</style>
    </div>
  );
};