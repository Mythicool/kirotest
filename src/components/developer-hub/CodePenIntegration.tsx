import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CodeProject, CodeLanguage } from '@/types/developer-hub';
import Button from '@/components/ui/Button';

interface CodePenIntegrationProps {
  project: CodeProject;
  onProjectChange: (project: CodeProject) => void;
}

interface CodePenData {
  html: string;
  css: string;
  js: string;
  title: string;
  description: string;
  tags: string[];
  editors: string;
  layout: 'top' | 'left' | 'right';
  theme: 'light' | 'dark';
}

interface CodePenPen {
  id: string;
  title: string;
  description: string;
  url: string;
  embedUrl: string;
  created: Date;
  lastModified: Date;
  isPublic: boolean;
}

export const CodePenIntegration: React.FC<CodePenIntegrationProps> = ({
  project,
  onProjectChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPen, setCurrentPen] = useState<CodePenPen | null>(null);
  const [savedPens, setSavedPens] = useState<CodePenPen[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [embedLayout, setEmbedLayout] = useState<'top' | 'left' | 'right'>('top');
  const [embedTheme, setEmbedTheme] = useState<'light' | 'dark'>('dark');
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract CodePen data from project
  const extractCodePenData = useCallback((): CodePenData => {
    const htmlFile = project.files.find(f => 
      f.language === CodeLanguage.HTML || f.name.endsWith('.html')
    );
    const cssFile = project.files.find(f => 
      f.language === CodeLanguage.CSS || f.name.endsWith('.css')
    );
    const jsFile = project.files.find(f => 
      f.language === CodeLanguage.JAVASCRIPT || f.name.endsWith('.js')
    );

    return {
      html: htmlFile?.content || '',
      css: cssFile?.content || '',
      js: jsFile?.content || '',
      title: project.name,
      description: project.readme || `A project created in Developer Workflow Hub`,
      tags: project.tags,
      editors: '111', // Show all editors (HTML, CSS, JS)
      layout: embedLayout,
      theme: embedTheme
    };
  }, [project, embedLayout, embedTheme]);

  // Create CodePen embed URL
  const createCodePenEmbed = useCallback((data: CodePenData): string => {
    const encodedData = btoa(JSON.stringify(data));
    return `https://codepen.io/pen/debug/${encodedData}`;
  }, []);

  // Create a new CodePen
  const createCodePen = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = extractCodePenData();
      
      // Simulate CodePen API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newPen: CodePenPen = {
        id: `pen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title,
        description: data.description,
        url: `https://codepen.io/user/pen/${Math.random().toString(36).substr(2, 9)}`,
        embedUrl: createCodePenEmbed(data),
        created: new Date(),
        lastModified: new Date(),
        isPublic: true
      };

      setCurrentPen(newPen);
      setSavedPens(prev => [newPen, ...prev]);
      setIsConnected(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create CodePen');
    } finally {
      setIsLoading(false);
    }
  }, [extractCodePenData, createCodePenEmbed]);

  // Update existing CodePen
  const updateCodePen = useCallback(async () => {
    if (!currentPen) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = extractCodePenData();
      
      // Simulate CodePen API update
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedPen: CodePenPen = {
        ...currentPen,
        title: data.title,
        description: data.description,
        embedUrl: createCodePenEmbed(data),
        lastModified: new Date()
      };

      setCurrentPen(updatedPen);
      setSavedPens(prev => 
        prev.map(pen => pen.id === updatedPen.id ? updatedPen : pen)
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update CodePen');
    } finally {
      setIsLoading(false);
    }
  }, [currentPen, extractCodePenData, createCodePenEmbed]);

  // Fork existing CodePen
  const forkCodePen = useCallback(async (originalPen: CodePenPen) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate fork operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const forkedPen: CodePenPen = {
        id: `pen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${originalPen.title} (Fork)`,
        description: `Forked from ${originalPen.title}`,
        url: `https://codepen.io/user/pen/${Math.random().toString(36).substr(2, 9)}`,
        embedUrl: originalPen.embedUrl,
        created: new Date(),
        lastModified: new Date(),
        isPublic: true
      };

      setCurrentPen(forkedPen);
      setSavedPens(prev => [forkedPen, ...prev]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fork CodePen');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete CodePen
  const deleteCodePen = useCallback(async (pen: CodePenPen) => {
    const shouldDelete = window.confirm(`Delete "${pen.title}"?`);
    if (!shouldDelete) return;

    setIsLoading(true);

    try {
      // Simulate delete operation
      await new Promise(resolve => setTimeout(resolve, 500));

      setSavedPens(prev => prev.filter(p => p.id !== pen.id));
      
      if (currentPen?.id === pen.id) {
        setCurrentPen(null);
        setIsConnected(false);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete CodePen');
    } finally {
      setIsLoading(false);
    }
  }, [currentPen]);

  // Load existing CodePen
  const loadCodePen = useCallback((pen: CodePenPen) => {
    setCurrentPen(pen);
    setIsConnected(true);
  }, []);

  // Auto-update when project changes
  useEffect(() => {
    if (currentPen && isConnected) {
      const timeoutId = setTimeout(() => {
        updateCodePen();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [project.files, currentPen, isConnected, updateCodePen]);

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin.includes('codepen.io')) {
        switch (event.data.type) {
          case 'codepen-ready':
            setIsConnected(true);
            break;
          case 'codepen-error':
            setError(event.data.message);
            break;
          case 'codepen-change':
            // Handle changes from CodePen editor
            console.log('CodePen changed:', event.data);
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const data = extractCodePenData();
  const hasWebFiles = data.html || data.css || data.js;

  return (
    <div className="codepen-integration">
      {/* Header */}
      <div className="integration-header">
        <div className="integration-title">
          <h3>CodePen Integration</h3>
          <div className="integration-info">
            {currentPen ? currentPen.title : 'No pen selected'} • {project.files.length} files
          </div>
        </div>
        
        <div className="integration-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            title="Toggle Preview"
          >
            {showPreview ? '👁️' : '📝'} {showPreview ? 'Preview' : 'Editor'}
          </Button>
          
          {currentPen ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={updateCodePen}
                disabled={isLoading || !hasWebFiles}
                title="Update CodePen"
              >
                {isLoading ? '⏳' : '💾'} Update
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => forkCodePen(currentPen)}
                disabled={isLoading}
                title="Fork CodePen"
              >
                🍴 Fork
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(currentPen.url, '_blank')}
                title="Open in CodePen"
              >
                🔗 Open
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={createCodePen}
              disabled={isLoading || !hasWebFiles}
              title="Create CodePen"
            >
              {isLoading ? '⏳' : '➕'} Create Pen
            </Button>
          )}
        </div>
      </div>

      <div className="integration-content">
        {/* Sidebar */}
        <div className="codepen-sidebar">
          {/* Settings */}
          <div className="settings-section">
            <h4>Settings</h4>
            
            <div className="setting-group">
              <label>Layout</label>
              <select
                value={embedLayout}
                onChange={(e) => setEmbedLayout(e.target.value as 'top' | 'left' | 'right')}
                className="setting-select"
              >
                <option value="top">Top</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>Theme</label>
              <select
                value={embedTheme}
                onChange={(e) => setEmbedTheme(e.target.value as 'light' | 'dark')}
                className="setting-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          {/* Project Info */}
          <div className="project-section">
            <h4>Project Files</h4>
            
            <div className="file-status">
              <div className={`file-indicator ${data.html ? 'active' : 'inactive'}`}>
                <span className="file-icon">🌐</span>
                <span className="file-label">HTML</span>
                <span className="file-size">{data.html.length} chars</span>
              </div>
              
              <div className={`file-indicator ${data.css ? 'active' : 'inactive'}`}>
                <span className="file-icon">🎨</span>
                <span className="file-label">CSS</span>
                <span className="file-size">{data.css.length} chars</span>
              </div>
              
              <div className={`file-indicator ${data.js ? 'active' : 'inactive'}`}>
                <span className="file-icon">⚡</span>
                <span className="file-label">JavaScript</span>
                <span className="file-size">{data.js.length} chars</span>
              </div>
            </div>
            
            {!hasWebFiles && (
              <div className="no-files-warning">
                <p>⚠️ No web files found</p>
                <p>Create HTML, CSS, or JavaScript files to use CodePen integration.</p>
              </div>
            )}
          </div>

          {/* Saved Pens */}
          {savedPens.length > 0 && (
            <div className="pens-section">
              <h4>Saved Pens ({savedPens.length})</h4>
              
              <div className="pens-list">
                {savedPens.map(pen => (
                  <div
                    key={pen.id}
                    className={`pen-item ${currentPen?.id === pen.id ? 'active' : ''}`}
                  >
                    <div className="pen-info" onClick={() => loadCodePen(pen)}>
                      <div className="pen-title">{pen.title}</div>
                      <div className="pen-date">
                        {pen.lastModified.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="pen-actions">
                      <button
                        className="pen-action"
                        onClick={() => forkCodePen(pen)}
                        title="Fork"
                        disabled={isLoading}
                      >
                        🍴
                      </button>
                      <button
                        className="pen-action"
                        onClick={() => window.open(pen.url, '_blank')}
                        title="Open in CodePen"
                      >
                        🔗
                      </button>
                      <button
                        className="pen-action delete"
                        onClick={() => deleteCodePen(pen)}
                        title="Delete"
                        disabled={isLoading}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="codepen-main">
          {currentPen && showPreview ? (
            <div className="codepen-preview">
              <div className="preview-header">
                <h4>{currentPen.title}</h4>
                <div className="preview-info">
                  Last updated: {currentPen.lastModified.toLocaleTimeString()}
                </div>
              </div>
              
              <iframe
                ref={iframeRef}
                src={currentPen.embedUrl}
                className="codepen-iframe"
                title={`CodePen - ${currentPen.title}`}
                allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb"
                sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
              />
            </div>
          ) : (
            <div className="codepen-placeholder">
              <div className="placeholder-content">
                <h3>CodePen Integration</h3>
                <p>Create and share your web projects on CodePen.</p>
                
                <div className="features-list">
                  <div className="feature-item">
                    <span className="feature-icon">🌐</span>
                    <span>Live preview and editing</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🎨</span>
                    <span>CSS preprocessors support</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📚</span>
                    <span>External libraries</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🤝</span>
                    <span>Community sharing</span>
                  </div>
                </div>
                
                {hasWebFiles ? (
                  <div className="action-buttons">
                    <Button variant="primary" onClick={createCodePen} disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create CodePen'}
                    </Button>
                  </div>
                ) : (
                  <div className="no-files-message">
                    <p>Add HTML, CSS, or JavaScript files to your project to get started.</p>
                  </div>
                )}
                
                {isLoading && (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Working with CodePen...</p>
                  </div>
                )}
              </div>
            </div>
          )}
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
        .codepen-integration {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
        }

        .integration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
        }

        .integration-title h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .integration-info {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        .integration-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .integration-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .codepen-sidebar {
          width: 280px;
          background: var(--color-surface-elevated);
          border-right: 1px solid var(--color-border);
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .settings-section,
        .project-section,
        .pens-section {
          margin-bottom: var(--spacing-lg);
        }

        .settings-section h4,
        .project-section h4,
        .pens-section h4 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .setting-group {
          margin-bottom: var(--spacing-md);
        }

        .setting-group label {
          display: block;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .setting-select {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .setting-select:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .file-status {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .file-indicator {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }

        .file-indicator.active {
          background: var(--color-success-subtle);
          border: 1px solid var(--color-success);
        }

        .file-indicator.inactive {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          opacity: 0.6;
        }

        .file-icon {
          font-size: var(--font-size-md);
        }

        .file-label {
          flex: 1;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .file-size {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .no-files-warning {
          padding: var(--spacing-md);
          background: var(--color-warning-subtle);
          border: 1px solid var(--color-warning);
          border-radius: var(--radius-sm);
          text-align: center;
        }

        .no-files-warning p {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
        }

        .no-files-warning p:last-child {
          margin-bottom: 0;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .pens-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .pen-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }

        .pen-item:hover {
          background: var(--color-surface-hover);
        }

        .pen-item.active {
          background: var(--color-primary-subtle);
          border-color: var(--color-primary);
        }

        .pen-info {
          flex: 1;
          cursor: pointer;
        }

        .pen-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .pen-date {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .pen-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .pen-action {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
          transition: background-color 0.2s ease;
        }

        .pen-action:hover {
          background: var(--color-surface-hover);
        }

        .pen-action.delete:hover {
          background: var(--color-error-subtle);
          color: var(--color-error);
        }

        .pen-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .codepen-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .codepen-preview {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .preview-header {
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
        }

        .preview-header h4 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .preview-info {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .codepen-iframe {
          flex: 1;
          width: 100%;
          border: none;
          background: white;
        }

        .codepen-placeholder {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
        }

        .placeholder-content {
          text-align: center;
          max-width: 400px;
          padding: var(--spacing-lg);
        }

        .placeholder-content h3 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--color-text-primary);
        }

        .placeholder-content p {
          margin: 0 0 var(--spacing-lg) 0;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .feature-icon {
          font-size: var(--font-size-md);
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: var(--spacing-sm);
        }

        .no-files-message {
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .no-files-message p {
          margin: 0;
          font-size: var(--font-size-sm);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-lg);
        }

        .loading-spinner {
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

        .loading-state p {
          margin: 0;
          font-size: var(--font-size-sm);
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
          .integration-content {
            flex-direction: column;
          }

          .codepen-sidebar {
            width: 100%;
            height: 300px;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }

          .integration-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .integration-actions {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .codepen-sidebar {
            height: 250px;
            padding: var(--spacing-sm);
          }

          .placeholder-content {
            padding: var(--spacing-md);
          }

          .features-list {
            align-items: center;
          }

          .pen-item {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-sm);
          }

          .pen-actions {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};