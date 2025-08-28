import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CodeProject, CodeFile, CodeLanguage, DeveloperPreferences } from '@/types/developer-hub';
import Button from '@/components/ui/Button';

interface CodeEditorProps {
  project: CodeProject;
  preferences: DeveloperPreferences['editor'];
  onProjectChange: (project: CodeProject) => void;
  onError: (error: string) => void;
}

interface EditorTab {
  fileId: string;
  fileName: string;
  language: CodeLanguage;
  hasUnsavedChanges: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  project,
  preferences,
  onProjectChange,
  onError
}) => {
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize with main file or first file
  useEffect(() => {
    if (openTabs.length === 0 && project.files.length > 0) {
      const mainFile = project.files.find(f => f.id === project.mainFile) || project.files[0];
      openFile(mainFile);
    }
  }, [project.files, project.mainFile, openTabs.length]);

  const openFile = useCallback((file: CodeFile) => {
    const existingTab = openTabs.find(tab => tab.fileId === file.id);
    
    if (!existingTab) {
      const newTab: EditorTab = {
        fileId: file.id,
        fileName: file.name,
        language: file.language,
        hasUnsavedChanges: file.hasUnsavedChanges
      };
      
      setOpenTabs(prev => [...prev, newTab]);
    }
    
    setActiveTabId(file.id);
  }, [openTabs]);

  const closeTab = useCallback((fileId: string) => {
    const file = project.files.find(f => f.id === fileId);
    if (file?.hasUnsavedChanges) {
      const shouldClose = window.confirm(`${file.name} has unsaved changes. Close anyway?`);
      if (!shouldClose) return;
    }

    setOpenTabs(prev => prev.filter(tab => tab.fileId !== fileId));
    
    if (activeTabId === fileId) {
      const remainingTabs = openTabs.filter(tab => tab.fileId !== fileId);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].fileId : null);
    }
  }, [project.files, activeTabId, openTabs]);

  const getCurrentFile = (): CodeFile | undefined => {
    return project.files.find(f => f.id === activeTabId);
  };

  const handleContentChange = useCallback((content: string) => {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    const updatedFile: CodeFile = {
      ...currentFile,
      content,
      hasUnsavedChanges: true,
      lastModified: new Date(),
      lineCount: content.split('\n').length,
      size: new Blob([content]).size
    };

    const updatedProject: CodeProject = {
      ...project,
      files: project.files.map(f => f.id === currentFile.id ? updatedFile : f),
      lastModified: new Date()
    };

    onProjectChange(updatedProject);

    // Update tab state
    setOpenTabs(prev => prev.map(tab => 
      tab.fileId === currentFile.id 
        ? { ...tab, hasUnsavedChanges: true }
        : tab
    ));

    // Auto-save
    if (preferences.autoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave(updatedFile);
      }, preferences.autoSaveDelay);
    }
  }, [getCurrentFile, project, onProjectChange, preferences.autoSave, preferences.autoSaveDelay]);

  const handleSave = useCallback((file?: CodeFile) => {
    const targetFile = file || getCurrentFile();
    if (!targetFile) return;

    const updatedFile: CodeFile = {
      ...targetFile,
      hasUnsavedChanges: false,
      lastModified: new Date()
    };

    const updatedProject: CodeProject = {
      ...project,
      files: project.files.map(f => f.id === targetFile.id ? updatedFile : f),
      lastModified: new Date()
    };

    onProjectChange(updatedProject);

    // Update tab state
    setOpenTabs(prev => prev.map(tab => 
      tab.fileId === targetFile.id 
        ? { ...tab, hasUnsavedChanges: false }
        : tab
    ));
  }, [getCurrentFile, project, onProjectChange]);

  const handleSaveAll = useCallback(() => {
    const updatedFiles = project.files.map(file => ({
      ...file,
      hasUnsavedChanges: false,
      lastModified: new Date()
    }));

    const updatedProject: CodeProject = {
      ...project,
      files: updatedFiles,
      lastModified: new Date()
    };

    onProjectChange(updatedProject);

    // Update all tabs
    setOpenTabs(prev => prev.map(tab => ({ ...tab, hasUnsavedChanges: false })));
  }, [project, onProjectChange]);

  const createNewFile = useCallback(() => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    const extension = fileName.split('.').pop()?.toLowerCase();
    let language = CodeLanguage.JAVASCRIPT;

    // Determine language from extension
    switch (extension) {
      case 'html':
        language = CodeLanguage.HTML;
        break;
      case 'css':
        language = CodeLanguage.CSS;
        break;
      case 'scss':
        language = CodeLanguage.SCSS;
        break;
      case 'js':
        language = CodeLanguage.JAVASCRIPT;
        break;
      case 'ts':
        language = CodeLanguage.TYPESCRIPT;
        break;
      case 'py':
        language = CodeLanguage.PYTHON;
        break;
      case 'java':
        language = CodeLanguage.JAVA;
        break;
      case 'cpp':
      case 'cc':
      case 'cxx':
        language = CodeLanguage.CPP;
        break;
      case 'cs':
        language = CodeLanguage.CSHARP;
        break;
      case 'php':
        language = CodeLanguage.PHP;
        break;
      case 'rb':
        language = CodeLanguage.RUBY;
        break;
      case 'go':
        language = CodeLanguage.GO;
        break;
      case 'rs':
        language = CodeLanguage.RUST;
        break;
      case 'swift':
        language = CodeLanguage.SWIFT;
        break;
      case 'kt':
        language = CodeLanguage.KOTLIN;
        break;
      case 'sql':
        language = CodeLanguage.SQL;
        break;
      case 'sh':
      case 'bash':
        language = CodeLanguage.SHELL;
        break;
      case 'yml':
      case 'yaml':
        language = CodeLanguage.YAML;
        break;
      case 'xml':
        language = CodeLanguage.XML;
        break;
      case 'md':
        language = CodeLanguage.MARKDOWN;
        break;
      case 'json':
        language = CodeLanguage.JSON;
        break;
    }

    const newFile: CodeFile = {
      id: `file_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: fileName,
      language,
      content: '',
      size: 0,
      encoding: 'utf-8',
      lineCount: 1,
      isReadOnly: false,
      hasUnsavedChanges: true,
      breakpoints: [],
      bookmarks: [],
      foldedRegions: [],
      metadata: {
        tags: [],
        dependencies: []
      },
      created: new Date(),
      lastModified: new Date()
    };

    const updatedProject: CodeProject = {
      ...project,
      files: [...project.files, newFile],
      lastModified: new Date()
    };

    onProjectChange(updatedProject);
    openFile(newFile);
  }, [project, onProjectChange, openFile]);

  const deleteFile = useCallback((file: CodeFile) => {
    const shouldDelete = window.confirm(`Delete ${file.name}?`);
    if (!shouldDelete) return;

    // Close tab if open
    closeTab(file.id);

    const updatedProject: CodeProject = {
      ...project,
      files: project.files.filter(f => f.id !== file.id),
      lastModified: new Date()
    };

    // Update main file if deleted
    if (project.mainFile === file.id && updatedProject.files.length > 0) {
      updatedProject.mainFile = updatedProject.files[0].id;
    }

    onProjectChange(updatedProject);
  }, [project, onProjectChange, closeTab]);

  const formatCode = useCallback(() => {
    const currentFile = getCurrentFile();
    if (!currentFile) return;

    try {
      let formattedContent = currentFile.content;

      // Basic formatting for different languages
      switch (currentFile.language) {
        case CodeLanguage.JSON:
          formattedContent = JSON.stringify(JSON.parse(currentFile.content), null, preferences.tabSize);
          break;
        case CodeLanguage.HTML:
          // Basic HTML formatting
          formattedContent = currentFile.content
            .replace(/></g, '>\n<')
            .replace(/^\s+|\s+$/gm, '')
            .split('\n')
            .map((line, index, lines) => {
              const depth = line.match(/<\//g) ? -1 : line.match(/</g)?.length || 0;
              const indent = ' '.repeat(Math.max(0, depth * preferences.tabSize));
              return indent + line.trim();
            })
            .join('\n');
          break;
        case CodeLanguage.CSS:
        case CodeLanguage.SCSS:
          // Basic CSS formatting
          formattedContent = currentFile.content
            .replace(/\{/g, ' {\n')
            .replace(/\}/g, '\n}\n')
            .replace(/;/g, ';\n')
            .split('\n')
            .map(line => {
              const trimmed = line.trim();
              if (trimmed.endsWith('{') || trimmed.endsWith('}')) {
                return trimmed;
              }
              return trimmed ? ' '.repeat(preferences.tabSize) + trimmed : '';
            })
            .join('\n')
            .replace(/\n\s*\n/g, '\n');
          break;
      }

      handleContentChange(formattedContent);
    } catch (error) {
      onError(`Failed to format code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [getCurrentFile, handleContentChange, preferences.tabSize, onError]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          if (e.shiftKey) {
            handleSaveAll();
          } else {
            handleSave();
          }
          break;
        case 'f':
          e.preventDefault();
          setShowSearch(true);
          break;
        case 'n':
          e.preventDefault();
          createNewFile();
          break;
        case 'w':
          e.preventDefault();
          if (activeTabId) {
            closeTab(activeTabId);
          }
          break;
      }
    }
  }, [handleSave, handleSaveAll, createNewFile, activeTabId, closeTab]);

  const currentFile = getCurrentFile();

  return (
    <div className="code-editor" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header */}
      <div className="editor-header">
        <div className="editor-title">
          <h3>Code Editor</h3>
          <div className="project-name">{project.name}</div>
        </div>
        
        <div className="editor-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFileTree(!showFileTree)}
            title="Toggle File Tree"
          >
            📁
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            title="Search (Ctrl+F)"
          >
            🔍
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={formatCode}
            disabled={!currentFile}
            title="Format Code"
          >
            ✨
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={createNewFile}
            title="New File (Ctrl+N)"
          >
            ➕
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave()}
            disabled={!currentFile?.hasUnsavedChanges}
            title="Save (Ctrl+S)"
          >
            💾
          </Button>
        </div>
      </div>

      <div className="editor-content">
        {/* File Tree */}
        {showFileTree && (
          <div className="file-tree">
            <div className="file-tree-header">
              <h4>Files</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={createNewFile}
                title="New File"
              >
                ➕
              </Button>
            </div>
            
            <div className="file-list">
              {project.files.map(file => (
                <div
                  key={file.id}
                  className={`file-item ${activeTabId === file.id ? 'active' : ''}`}
                  onClick={() => openFile(file)}
                >
                  <div className="file-info">
                    <span className="file-name">
                      {file.name}
                      {file.hasUnsavedChanges && <span className="unsaved-indicator">●</span>}
                    </span>
                    <span className="file-language">{file.language}</span>
                  </div>
                  
                  <div className="file-actions">
                    <button
                      className="file-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file);
                      }}
                      title="Delete File"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="editor-area">
          {/* Search Panel */}
          {showSearch && (
            <div className="search-panel">
              <div className="search-inputs">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <input
                  type="text"
                  placeholder="Replace..."
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="search-actions">
                <Button variant="ghost" size="sm">Find</Button>
                <Button variant="ghost" size="sm">Replace</Button>
                <Button variant="ghost" size="sm">Replace All</Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(false)}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          {openTabs.length > 0 && (
            <div className="editor-tabs">
              {openTabs.map(tab => (
                <div
                  key={tab.fileId}
                  className={`editor-tab ${activeTabId === tab.fileId ? 'active' : ''}`}
                  onClick={() => setActiveTabId(tab.fileId)}
                >
                  <span className="tab-name">
                    {tab.fileName}
                    {tab.hasUnsavedChanges && <span className="unsaved-dot">●</span>}
                  </span>
                  <button
                    className="tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.fileId);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Code Editor */}
          <div className="code-editor-container">
            {currentFile ? (
              <textarea
                ref={editorRef}
                className="code-textarea"
                value={currentFile.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start coding..."
                spellCheck={false}
                style={{
                  fontSize: `${preferences.fontSize}px`,
                  fontFamily: preferences.fontFamily,
                  tabSize: preferences.tabSize,
                  whiteSpace: preferences.wordWrap ? 'pre-wrap' : 'pre'
                }}
              />
            ) : (
              <div className="no-file-selected">
                <p>No file selected</p>
                <Button variant="primary" onClick={createNewFile}>
                  Create New File
                </Button>
              </div>
            )}
          </div>

          {/* Status Bar */}
          {currentFile && (
            <div className="status-bar">
              <div className="status-left">
                <span>Line {currentFile.lineCount}</span>
                <span>•</span>
                <span>{currentFile.language}</span>
                <span>•</span>
                <span>{currentFile.encoding}</span>
              </div>
              
              <div className="status-right">
                <span>{currentFile.size} bytes</span>
                {currentFile.hasUnsavedChanges && (
                  <>
                    <span>•</span>
                    <span className="unsaved-status">Unsaved</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .code-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
          outline: none;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
        }

        .editor-title h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .project-name {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        .editor-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .editor-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .file-tree {
          width: 250px;
          background: var(--color-surface-elevated);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
        }

        .file-tree-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }

        .file-tree-header h4 {
          margin: 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .file-list {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-sm);
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 0.2s ease;
          margin-bottom: var(--spacing-xs);
        }

        .file-item:hover {
          background: var(--color-surface-hover);
        }

        .file-item.active {
          background: var(--color-primary-subtle);
          color: var(--color-primary);
        }

        .file-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          flex: 1;
        }

        .file-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .file-language {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }

        .unsaved-indicator,
        .unsaved-dot {
          color: var(--color-warning);
          font-weight: bold;
        }

        .file-actions {
          display: flex;
          gap: var(--spacing-xs);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .file-item:hover .file-actions {
          opacity: 1;
        }

        .file-action {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          transition: background-color 0.2s ease;
        }

        .file-action:hover {
          background: var(--color-surface-hover);
        }

        .editor-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .search-panel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
          gap: var(--spacing-md);
        }

        .search-inputs {
          display: flex;
          gap: var(--spacing-sm);
          flex: 1;
        }

        .search-input {
          flex: 1;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .search-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .editor-tabs {
          display: flex;
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
          overflow-x: auto;
        }

        .editor-tab {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          cursor: pointer;
          transition: background-color 0.2s ease;
          white-space: nowrap;
          min-width: 120px;
        }

        .editor-tab:hover {
          background: var(--color-surface-hover);
        }

        .editor-tab.active {
          background: var(--color-surface-elevated);
          border-bottom: 2px solid var(--color-primary);
        }

        .tab-name {
          font-size: var(--font-size-sm);
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .tab-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          transition: all 0.2s ease;
        }

        .tab-close:hover {
          background: var(--color-surface-hover);
          color: var(--color-text-primary);
        }

        .code-editor-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .code-textarea {
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          resize: none;
          padding: var(--spacing-md);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-family: 'Monaco', 'Consolas', monospace;
          line-height: 1.5;
          overflow: auto;
        }

        .no-file-selected {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: var(--spacing-lg);
          color: var(--color-text-secondary);
        }

        .no-file-selected p {
          margin: 0;
          font-size: var(--font-size-lg);
        }

        .status-bar {
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

        .unsaved-status {
          color: var(--color-warning);
          font-weight: var(--font-weight-medium);
        }

        @media (max-width: 1024px) {
          .file-tree {
            width: 200px;
          }

          .editor-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .editor-actions {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .editor-content {
            flex-direction: column;
          }

          .file-tree {
            width: 100%;
            height: 200px;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }

          .search-panel {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .search-actions {
            justify-content: center;
          }

          .status-bar {
            flex-direction: column;
            gap: var(--spacing-xs);
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};