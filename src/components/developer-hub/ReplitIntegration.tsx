import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CodeProject, ExecutionResult, ExecutionEnvironment } from '@/types/developer-hub';
import Button from '@/components/ui/Button';

interface ReplitIntegrationProps {
  project: CodeProject;
  onProjectChange: (project: CodeProject) => void;
}

interface ReplitConfig {
  language: string;
  files: Record<string, string>;
  theme: 'light' | 'dark';
  layout: 'split' | 'editor' | 'console';
}

export const ReplitIntegration: React.FC<ReplitIntegrationProps> = ({
  project,
  onProjectChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [replitUrl, setReplitUrl] = useState<string>('');
  const [showCustomUI, setShowCustomUI] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate Repl.it configuration from project
  const generateReplitConfig = useCallback((): ReplitConfig => {
    const files: Record<string, string> = {};
    
    project.files.forEach(file => {
      files[file.name] = file.content;
    });

    // Determine primary language
    let language = 'html';
    if (project.type === 'node') language = 'nodejs';
    else if (project.type === 'python') language = 'python3';
    else if (project.type === 'java') language = 'java';
    else if (project.files.some(f => f.language === 'typescript')) language = 'typescript';
    else if (project.files.some(f => f.language === 'javascript')) language = 'nodejs';

    return {
      language,
      files,
      theme: 'dark',
      layout: 'split'
    };
  }, [project]);

  // Create Repl.it embed URL
  const createReplitEmbed = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const config = generateReplitConfig();
      
      // Create a simple embed URL (in a real implementation, you'd use Repl.it's API)
      const embedUrl = `https://replit.com/@embed?language=${config.language}&theme=${config.theme}&layout=${config.layout}`;
      
      setReplitUrl(embedUrl);
      setIsConnected(true);

      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Repl.it embed');
    } finally {
      setIsLoading(false);
    }
  }, [generateReplitConfig]);

  // Execute code in Repl.it
  const executeCode = useCallback(async () => {
    if (!isConnected) {
      await createReplitEmbed();
      return;
    }

    setIsLoading(true);
    
    const executionResult: ExecutionResult = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: project.id,
      type: 'run',
      status: 'running',
      startTime: new Date(),
      output: []
    };

    setExecutionResults(prev => [...prev, executionResult]);

    try {
      // Simulate code execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedResult: ExecutionResult = {
        ...executionResult,
        status: 'success',
        endTime: new Date(),
        duration: 2000,
        output: [
          {
            type: 'stdout',
            content: 'Starting development server...',
            timestamp: new Date(),
            source: 'replit'
          },
          {
            type: 'stdout',
            content: 'Server running on https://project.username.repl.co',
            timestamp: new Date(),
            source: 'replit'
          },
          {
            type: 'info',
            content: 'Code executed successfully in Repl.it environment',
            timestamp: new Date(),
            source: 'system'
          }
        ],
        exitCode: 0,
        metrics: {
          memoryUsage: 45.2,
          cpuUsage: 12.8,
          networkRequests: 3,
          loadTime: 1200
        }
      };

      setExecutionResults(prev => 
        prev.map(result => result.id === executionResult.id ? updatedResult : result)
      );

    } catch (err) {
      const errorResult: ExecutionResult = {
        ...executionResult,
        status: 'error',
        endTime: new Date(),
        duration: 1000,
        error: err instanceof Error ? err.message : 'Execution failed',
        exitCode: 1,
        output: [
          {
            type: 'stderr',
            content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            timestamp: new Date(),
            source: 'replit'
          }
        ]
      };

      setExecutionResults(prev => 
        prev.map(result => result.id === executionResult.id ? errorResult : result)
      );
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, createReplitEmbed, project.id]);

  // Sync project files to Repl.it
  const syncToReplit = useCallback(async () => {
    if (!isConnected) return;

    setIsLoading(true);
    
    try {
      // Simulate file sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would send the files to Repl.it
      console.log('Syncing files to Repl.it:', project.files.map(f => f.name));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync files');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, project.files]);

  // Auto-sync when project files change
  useEffect(() => {
    if (isConnected) {
      const timeoutId = setTimeout(syncToReplit, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [project.files, isConnected, syncToReplit]);

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle messages from Repl.it iframe
      if (event.origin.includes('replit.com')) {
        switch (event.data.type) {
          case 'replit-ready':
            setIsConnected(true);
            setIsLoading(false);
            break;
          case 'replit-error':
            setError(event.data.message);
            break;
          case 'replit-output':
            // Handle output from Repl.it
            console.log('Repl.it output:', event.data.output);
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const clearResults = useCallback(() => {
    setExecutionResults([]);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setReplitUrl('');
    setExecutionResults([]);
  }, []);

  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'nodejs':
        return '🟨';
      case 'python':
      case 'python3':
        return '🐍';
      case 'java':
        return '☕';
      case 'html':
        return '🌐';
      case 'typescript':
        return '🔷';
      default:
        return '📄';
    }
  };

  const config = generateReplitConfig();
  const latestResult = executionResults[executionResults.length - 1];

  return (
    <div className="replit-integration">
      {/* Header */}
      <div className="integration-header">
        <div className="integration-title">
          <h3>Repl.it Integration</h3>
          <div className="integration-info">
            {getLanguageIcon(config.language)} {config.language} • {Object.keys(config.files).length} files
          </div>
        </div>
        
        <div className="integration-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomUI(!showCustomUI)}
            title="Toggle Custom UI"
          >
            {showCustomUI ? '🎛️' : '🖼️'} UI
          </Button>
          {isConnected ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={executeCode}
                disabled={isLoading}
                title="Run Code"
              >
                {isLoading ? '⏳' : '▶️'} Run
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={syncToReplit}
                disabled={isLoading}
                title="Sync Files"
              >
                🔄 Sync
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                title="Disconnect"
              >
                🔌 Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={createReplitEmbed}
              disabled={isLoading}
              title="Connect to Repl.it"
            >
              {isLoading ? '⏳' : '🔗'} Connect
            </Button>
          )}
        </div>
      </div>

      <div className="integration-content">
        {/* Custom UI Panel */}
        {showCustomUI && (
          <div className="custom-ui-panel">
            {/* Project Info */}
            <div className="project-info-section">
              <h4>Project Configuration</h4>
              <div className="config-grid">
                <div className="config-item">
                  <label>Language</label>
                  <span>{config.language}</span>
                </div>
                <div className="config-item">
                  <label>Files</label>
                  <span>{Object.keys(config.files).length}</span>
                </div>
                <div className="config-item">
                  <label>Theme</label>
                  <span>{config.theme}</span>
                </div>
                <div className="config-item">
                  <label>Layout</label>
                  <span>{config.layout}</span>
                </div>
              </div>
            </div>

            {/* File List */}
            <div className="file-list-section">
              <h4>Files to Sync</h4>
              <div className="file-list">
                {Object.entries(config.files).map(([filename, content]) => (
                  <div key={filename} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{filename}</span>
                      <span className="file-size">{content.length} chars</span>
                    </div>
                    <div className="file-preview">
                      {content.slice(0, 100)}
                      {content.length > 100 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Results */}
            {executionResults.length > 0 && (
              <div className="results-section">
                <div className="results-header">
                  <h4>Execution Results</h4>
                  <Button variant="ghost" size="sm" onClick={clearResults}>
                    Clear
                  </Button>
                </div>
                
                <div className="results-list">
                  {executionResults.slice(-3).map(result => (
                    <div key={result.id} className={`result-item ${result.status}`}>
                      <div className="result-header">
                        <span className="result-type">{result.type}</span>
                        <span className="result-status">{result.status}</span>
                        <span className="result-time">
                          {result.startTime.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {result.duration && (
                        <div className="result-duration">
                          Duration: {result.duration}ms
                        </div>
                      )}
                      
                      {result.output.length > 0 && (
                        <div className="result-output">
                          {result.output.slice(-3).map((output, index) => (
                            <div key={index} className={`output-line ${output.type}`}>
                              {output.content}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {result.error && (
                        <div className="result-error">
                          Error: {result.error}
                        </div>
                      )}
                      
                      {result.metrics && (
                        <div className="result-metrics">
                          <span>Memory: {result.metrics.memoryUsage}MB</span>
                          <span>CPU: {result.metrics.cpuUsage}%</span>
                          {result.metrics.loadTime && (
                            <span>Load: {result.metrics.loadTime}ms</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Repl.it Embed */}
        <div className="replit-embed">
          {isConnected && replitUrl ? (
            <iframe
              ref={iframeRef}
              src={replitUrl}
              className="replit-iframe"
              title="Repl.it Environment"
              allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb"
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            />
          ) : (
            <div className="embed-placeholder">
              <div className="placeholder-content">
                <h3>Repl.it Integration</h3>
                <p>Connect to Repl.it to run your code in a cloud environment.</p>
                
                <div className="features-list">
                  <div className="feature-item">
                    <span className="feature-icon">☁️</span>
                    <span>Cloud-based execution</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔄</span>
                    <span>Real-time collaboration</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📦</span>
                    <span>Package management</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🌐</span>
                    <span>Instant deployment</span>
                  </div>
                </div>
                
                {!isLoading && (
                  <Button variant="primary" onClick={createReplitEmbed}>
                    Connect to Repl.it
                  </Button>
                )}
                
                {isLoading && (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Connecting to Repl.it...</p>
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
        .replit-integration {
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

        .custom-ui-panel {
          width: 300px;
          background: var(--color-surface-elevated);
          border-right: 1px solid var(--color-border);
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .project-info-section,
        .file-list-section,
        .results-section {
          margin-bottom: var(--spacing-lg);
        }

        .project-info-section h4,
        .file-list-section h4,
        .results-section h4 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .config-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-sm);
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .config-item label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .config-item span {
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
        }

        .file-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .file-item {
          padding: var(--spacing-sm);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }

        .file-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }

        .file-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .file-size {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .file-preview {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          font-family: monospace;
          background: var(--color-surface-elevated);
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          white-space: pre-wrap;
          overflow: hidden;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .result-item {
          padding: var(--spacing-sm);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }

        .result-item.success {
          border-left: 3px solid var(--color-success);
        }

        .result-item.error {
          border-left: 3px solid var(--color-error);
        }

        .result-item.running {
          border-left: 3px solid var(--color-warning);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }

        .result-type {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          text-transform: uppercase;
        }

        .result-status {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .result-time {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .result-duration {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .result-output {
          background: var(--color-surface-elevated);
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-xs);
        }

        .output-line {
          font-size: var(--font-size-xs);
          font-family: monospace;
          margin-bottom: var(--spacing-xs);
        }

        .output-line.stdout {
          color: var(--color-text-primary);
        }

        .output-line.stderr {
          color: var(--color-error);
        }

        .output-line.info {
          color: var(--color-primary);
        }

        .result-error {
          font-size: var(--font-size-xs);
          color: var(--color-error);
          margin-bottom: var(--spacing-xs);
        }

        .result-metrics {
          display: flex;
          gap: var(--spacing-sm);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .replit-embed {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .replit-iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: white;
        }

        .embed-placeholder {
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

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          color: var(--color-text-secondary);
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

          .custom-ui-panel {
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
          .custom-ui-panel {
            height: 250px;
            padding: var(--spacing-sm);
          }

          .config-grid {
            grid-template-columns: 1fr;
          }

          .placeholder-content {
            padding: var(--spacing-md);
          }

          .features-list {
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};