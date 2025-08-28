import React, { useState, useCallback, useEffect } from 'react';
import { DeveloperWorkspace, CodeProject, TerminalSession, LivePreview, CodeLanguage, ExecutionEnvironment } from '@/types/developer-hub';
import { CodeEditor } from './CodeEditor';
import { VirtualTerminal } from './VirtualTerminal';
import { LivePreviewSystem } from './LivePreviewSystem';
import { ReplitIntegration } from './ReplitIntegration';
import { CodePenIntegration } from './CodePenIntegration';
import { CodeOptimizer } from './CodeOptimizer';
import { PerformanceTester } from './PerformanceTester';
import { BackendIntegration } from './BackendIntegration';
import Button from '@/components/ui/Button';

interface DeveloperWorkflowHubProps {
  workspaceId: string;
  onWorkspaceChange?: (workspace: DeveloperWorkspace) => void;
  className?: string;
}

type ActiveTool = 'editor' | 'terminal' | 'preview' | 'replit' | 'codepen' | 'optimizer' | 'performance' | 'backend';

export const DeveloperWorkflowHub: React.FC<DeveloperWorkflowHubProps> = ({
  workspaceId,
  onWorkspaceChange,
  className = ''
}) => {
  const [workspace, setWorkspace] = useState<DeveloperWorkspace>({
    projects: [],
    terminals: [],
    previews: [],
    optimizations: [],
    performanceTests: [],
    backendServices: [],
    preferences: {
      editor: {
        theme: 'dark',
        fontSize: 14,
        fontFamily: 'Monaco, Consolas, monospace',
        tabSize: 2,
        insertSpaces: true,
        wordWrap: true,
        lineNumbers: true,
        minimap: true,
        autoSave: true,
        autoSaveDelay: 1000,
        formatOnSave: true,
        formatOnType: false
      },
      terminal: {
        theme: 'dark',
        fontSize: 14,
        fontFamily: 'Monaco, Consolas, monospace',
        shell: 'bash',
        maxHistorySize: 1000
      },
      preview: {
        autoRefresh: true,
        refreshDelay: 500,
        showErrors: true,
        showWarnings: true,
        defaultDevice: 'desktop'
      },
      performance: {
        defaultProvider: 'gtmetrix',
        defaultLocation: 'vancouver',
        defaultDevice: 'desktop',
        defaultConnection: 'cable'
      },
      optimization: {
        autoOptimize: false,
        defaultLevel: 'basic',
        preserveComments: false,
        showSavings: true
      }
    },
    recentFiles: [],
    bookmarks: [],
    snippets: []
  });

  const [activeTool, setActiveTool] = useState<ActiveTool>('editor');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize workspace with a default project if empty
  useEffect(() => {
    if (workspace.projects.length === 0) {
      const defaultProject: CodeProject = {
        id: `project_${Date.now()}_default`,
        name: 'New Project',
        type: 'web',
        files: [
          {
            id: `file_${Date.now()}_html`,
            name: 'index.html',
            language: CodeLanguage.HTML,
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <p>Welcome to your new project.</p>
        <button onclick="greet()">Click me!</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
            size: 0,
            encoding: 'utf-8',
            lineCount: 0,
            isReadOnly: false,
            hasUnsavedChanges: false,
            breakpoints: [],
            bookmarks: [],
            foldedRegions: [],
            metadata: {
              tags: [],
              dependencies: []
            },
            created: new Date(),
            lastModified: new Date()
          },
          {
            id: `file_${Date.now()}_css`,
            name: 'style.css',
            language: CodeLanguage.CSS,
            content: `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    text-align: center;
    max-width: 400px;
}

h1 {
    color: #333;
    margin-bottom: 1rem;
}

p {
    color: #666;
    margin-bottom: 2rem;
}

button {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s ease;
}

button:hover {
    background: #5a6fd8;
}`,
            size: 0,
            encoding: 'utf-8',
            lineCount: 0,
            isReadOnly: false,
            hasUnsavedChanges: false,
            breakpoints: [],
            bookmarks: [],
            foldedRegions: [],
            metadata: {
              tags: [],
              dependencies: []
            },
            created: new Date(),
            lastModified: new Date()
          },
          {
            id: `file_${Date.now()}_js`,
            name: 'script.js',
            language: CodeLanguage.JAVASCRIPT,
            content: `function greet() {
    const messages = [
        'Hello, Developer!',
        'Welcome to the workflow!',
        'Ready to code?',
        'Let\\'s build something amazing!',
        'Happy coding!'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    alert(randomMessage);
}

// Add some interactivity
document.addEventListener('DOMContentLoaded', function() {
    console.log('Project loaded successfully!');
    
    // Add click animation
    const button = document.querySelector('button');
    if (button) {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    }
});`,
            size: 0,
            encoding: 'utf-8',
            lineCount: 0,
            isReadOnly: false,
            hasUnsavedChanges: false,
            breakpoints: [],
            bookmarks: [],
            foldedRegions: [],
            metadata: {
              tags: [],
              dependencies: []
            },
            created: new Date(),
            lastModified: new Date()
          }
        ],
        dependencies: [],
        environment: ExecutionEnvironment.CODEPEN,
        isPublic: false,
        collaborators: [],
        tags: ['web', 'html', 'css', 'javascript'],
        created: new Date(),
        lastModified: new Date()
      };

      // Set main file to HTML
      defaultProject.mainFile = defaultProject.files[0].id;

      setWorkspace(prev => ({
        ...prev,
        projects: [defaultProject],
        activeProjectId: defaultProject.id
      }));
    }
  }, [workspace.projects.length]);

  // Save workspace changes
  useEffect(() => {
    if (onWorkspaceChange) {
      onWorkspaceChange(workspace);
    }
  }, [workspace, onWorkspaceChange]);

  const handleWorkspaceChange = useCallback((updatedWorkspace: DeveloperWorkspace) => {
    setWorkspace(updatedWorkspace);
  }, []);

  const handleProjectChange = useCallback((updatedProject: CodeProject) => {
    setWorkspace(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === updatedProject.id ? updatedProject : project
      )
    }));
  }, []);

  const handleProjectSelect = useCallback((projectId: string) => {
    setWorkspace(prev => ({
      ...prev,
      activeProjectId: projectId
    }));
  }, []);

  const handleTerminalCreate = useCallback(() => {
    const newTerminal: TerminalSession = {
      id: `terminal_${Date.now()}`,
      isActive: true,
      currentDir: '/',
      environment: {},
      history: [],
      output: [],
      maxHistorySize: workspace.preferences.terminal.maxHistorySize,
      theme: workspace.preferences.terminal.theme,
      fontSize: workspace.preferences.terminal.fontSize,
      fontFamily: workspace.preferences.terminal.fontFamily,
      created: new Date(),
      lastModified: new Date()
    };

    setWorkspace(prev => ({
      ...prev,
      terminals: [...prev.terminals, newTerminal],
      activeTerminalId: newTerminal.id
    }));
  }, [workspace.preferences.terminal]);

  const handlePreviewCreate = useCallback((projectId: string) => {
    const newPreview: LivePreview = {
      id: `preview_${Date.now()}`,
      projectId,
      url: `http://localhost:3000/preview/${projectId}`,
      isActive: true,
      autoRefresh: workspace.preferences.preview.autoRefresh,
      refreshInterval: workspace.preferences.preview.refreshDelay,
      lastRefresh: new Date(),
      errors: [],
      warnings: [],
      performance: {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        totalBlockingTime: 0,
        speedIndex: 0,
        memoryUsage: 0,
        networkRequests: 0,
        transferSize: 0,
        resourceCount: 0
      },
      devices: [
        {
          id: 'desktop',
          name: 'Desktop',
          width: 1920,
          height: 1080,
          pixelRatio: 1,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          type: 'desktop',
          orientation: 'landscape'
        },
        {
          id: 'tablet',
          name: 'Tablet',
          width: 768,
          height: 1024,
          pixelRatio: 2,
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          type: 'tablet',
          orientation: 'portrait'
        },
        {
          id: 'mobile',
          name: 'Mobile',
          width: 375,
          height: 667,
          pixelRatio: 2,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          type: 'mobile',
          orientation: 'portrait'
        }
      ],
      activeDevice: workspace.preferences.preview.defaultDevice
    };

    setWorkspace(prev => ({
      ...prev,
      previews: [...prev.previews, newPreview]
    }));
  }, [workspace.preferences.preview]);

  const getCurrentProject = (): CodeProject | undefined => {
    return workspace.projects.find(project => project.id === workspace.activeProjectId);
  };

  const getCurrentTerminal = (): TerminalSession | undefined => {
    return workspace.terminals.find(terminal => terminal.id === workspace.activeTerminalId);
  };

  const renderActiveTool = () => {
    const currentProject = getCurrentProject();
    const currentTerminal = getCurrentTerminal();
    
    switch (activeTool) {
      case 'editor':
        return currentProject ? (
          <CodeEditor
            project={currentProject}
            preferences={workspace.preferences.editor}
            onProjectChange={handleProjectChange}
            onError={setError}
          />
        ) : (
          <div className="tool-placeholder">
            <p>No project selected</p>
            <Button
              variant="primary"
              onClick={() => {
                // Create new project logic would go here
                console.log('Create new project');
              }}
            >
              Create Project
            </Button>
          </div>
        );
      
      case 'terminal':
        return (
          <VirtualTerminal
            session={currentTerminal}
            preferences={workspace.preferences.terminal}
            onSessionChange={(session) => {
              setWorkspace(prev => ({
                ...prev,
                terminals: prev.terminals.map(t => t.id === session.id ? session : t)
              }));
            }}
            onCreateNew={handleTerminalCreate}
          />
        );
      
      case 'preview':
        return currentProject ? (
          <LivePreviewSystem
            project={currentProject}
            previews={workspace.previews.filter(p => p.projectId === currentProject.id)}
            preferences={workspace.preferences.preview}
            onPreviewCreate={() => handlePreviewCreate(currentProject.id)}
            onPreviewChange={(preview) => {
              setWorkspace(prev => ({
                ...prev,
                previews: prev.previews.map(p => p.id === preview.id ? preview : p)
              }));
            }}
          />
        ) : (
          <div className="tool-placeholder">
            <p>No project selected for preview</p>
          </div>
        );
      
      case 'replit':
        return currentProject ? (
          <ReplitIntegration
            project={currentProject}
            onProjectChange={handleProjectChange}
          />
        ) : (
          <div className="tool-placeholder">
            <p>No project selected</p>
          </div>
        );
      
      case 'codepen':
        return currentProject ? (
          <CodePenIntegration
            project={currentProject}
            onProjectChange={handleProjectChange}
          />
        ) : (
          <div className="tool-placeholder">
            <p>No project selected</p>
          </div>
        );
      
      case 'optimizer':
        return (
          <CodeOptimizer
            optimizations={workspace.optimizations}
            preferences={workspace.preferences.optimization}
            onOptimizationChange={(optimization) => {
              setWorkspace(prev => ({
                ...prev,
                optimizations: prev.optimizations.map(o => o.id === optimization.id ? optimization : o)
              }));
            }}
            onOptimizationCreate={(optimization) => {
              setWorkspace(prev => ({
                ...prev,
                optimizations: [...prev.optimizations, optimization]
              }));
            }}
          />
        );
      
      case 'performance':
        return (
          <PerformanceTester
            tests={workspace.performanceTests}
            preferences={workspace.preferences.performance}
            onTestChange={(test) => {
              setWorkspace(prev => ({
                ...prev,
                performanceTests: prev.performanceTests.map(t => t.id === test.id ? test : t)
              }));
            }}
            onTestCreate={(test) => {
              setWorkspace(prev => ({
                ...prev,
                performanceTests: [...prev.performanceTests, test]
              }));
            }}
          />
        );
      
      case 'backend':
        return (
          <BackendIntegration
            services={workspace.backendServices}
            onServiceChange={(service) => {
              setWorkspace(prev => ({
                ...prev,
                backendServices: prev.backendServices.map(s => s.id === service.id ? service : s)
              }));
            }}
            onServiceCreate={(service) => {
              setWorkspace(prev => ({
                ...prev,
                backendServices: [...prev.backendServices, service]
              }));
            }}
          />
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
    <div className={`developer-workflow-hub ${className}`}>
      {/* Header */}
      <div className="hub-header">
        <div className="hub-title">
          <h2>Developer Workflow Hub</h2>
          <div className="project-info">
            {getCurrentProject() && (
              <span>{getCurrentProject()?.name} • {getCurrentProject()?.type}</span>
            )}
          </div>
        </div>
        
        <div className="hub-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTool('preview')}
            disabled={!getCurrentProject()}
          >
            👁️ Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTool('performance')}
            disabled={!getCurrentProject()}
          >
            ⚡ Test
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="hub-content">
        {/* Sidebar */}
        <div className="hub-sidebar">
          <div className="tool-tabs">
            <button
              className={`tool-tab ${activeTool === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTool('editor')}
              title="Code Editor"
            >
              📝 Editor
            </button>
            <button
              className={`tool-tab ${activeTool === 'terminal' ? 'active' : ''}`}
              onClick={() => setActiveTool('terminal')}
              title="Terminal"
            >
              💻 Terminal
            </button>
            <button
              className={`tool-tab ${activeTool === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTool('preview')}
              title="Live Preview"
            >
              👁️ Preview
            </button>
            <button
              className={`tool-tab ${activeTool === 'replit' ? 'active' : ''}`}
              onClick={() => setActiveTool('replit')}
              title="Repl.it Integration"
            >
              🔧 Repl.it
            </button>
            <button
              className={`tool-tab ${activeTool === 'codepen' ? 'active' : ''}`}
              onClick={() => setActiveTool('codepen')}
              title="CodePen Integration"
            >
              🖊️ CodePen
            </button>
            <button
              className={`tool-tab ${activeTool === 'optimizer' ? 'active' : ''}`}
              onClick={() => setActiveTool('optimizer')}
              title="Code Optimizer"
            >
              ⚡ Optimize
            </button>
            <button
              className={`tool-tab ${activeTool === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTool('performance')}
              title="Performance Testing"
            >
              📊 Perf
            </button>
            <button
              className={`tool-tab ${activeTool === 'backend' ? 'active' : ''}`}
              onClick={() => setActiveTool('backend')}
              title="Backend Services"
            >
              🗄️ Backend
            </button>
          </div>
        </div>

        {/* Tool Panel */}
        <div className="tool-panel">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            renderActiveTool()
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
        .developer-workflow-hub {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--color-background);
          color: var(--color-text-primary);
        }

        .hub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }

        .hub-title h2 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .project-info {
          margin-top: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .hub-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .hub-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .hub-sidebar {
          width: 80px;
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
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-align: center;
          line-height: 1.2;
          padding: var(--spacing-xs);
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
          flex: 1;
          background: var(--color-surface);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .tool-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: var(--spacing-lg);
          text-align: center;
          color: var(--color-text-secondary);
        }

        .tool-placeholder p {
          margin: 0;
          font-size: var(--font-size-lg);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
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
          font-size: var(--font-size-md);
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
          .hub-content {
            flex-direction: column;
          }

          .hub-sidebar {
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

          .tool-tab {
            min-width: 64px;
            height: 48px;
            font-size: var(--font-size-xs);
          }

          .tool-panel {
            min-height: 500px;
          }
        }

        @media (max-width: 768px) {
          .hub-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .tool-tab {
            min-width: 56px;
            height: 40px;
            font-size: 10px;
          }

          .tool-panel {
            min-height: 400px;
          }
        }
      `}</style>
    </div>
  );
};