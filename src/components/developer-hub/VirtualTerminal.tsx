import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TerminalSession, TerminalCommand, TerminalOutput, DeveloperPreferences } from '@/types/developer-hub';
import Button from '@/components/ui/Button';

interface VirtualTerminalProps {
  session?: TerminalSession;
  preferences: DeveloperPreferences['terminal'];
  onSessionChange: (session: TerminalSession) => void;
  onCreateNew: () => void;
}

interface CommandSuggestion {
  command: string;
  description: string;
  category: 'file' | 'git' | 'npm' | 'system' | 'custom';
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  { command: 'ls', description: 'List directory contents', category: 'file' },
  { command: 'cd', description: 'Change directory', category: 'file' },
  { command: 'mkdir', description: 'Create directory', category: 'file' },
  { command: 'touch', description: 'Create file', category: 'file' },
  { command: 'rm', description: 'Remove file/directory', category: 'file' },
  { command: 'cp', description: 'Copy file/directory', category: 'file' },
  { command: 'mv', description: 'Move/rename file/directory', category: 'file' },
  { command: 'cat', description: 'Display file contents', category: 'file' },
  { command: 'grep', description: 'Search text patterns', category: 'file' },
  { command: 'find', description: 'Find files and directories', category: 'file' },
  { command: 'git init', description: 'Initialize git repository', category: 'git' },
  { command: 'git add', description: 'Add files to staging', category: 'git' },
  { command: 'git commit', description: 'Commit changes', category: 'git' },
  { command: 'git push', description: 'Push to remote repository', category: 'git' },
  { command: 'git pull', description: 'Pull from remote repository', category: 'git' },
  { command: 'git status', description: 'Show repository status', category: 'git' },
  { command: 'git log', description: 'Show commit history', category: 'git' },
  { command: 'npm init', description: 'Initialize npm project', category: 'npm' },
  { command: 'npm install', description: 'Install dependencies', category: 'npm' },
  { command: 'npm run', description: 'Run npm script', category: 'npm' },
  { command: 'npm test', description: 'Run tests', category: 'npm' },
  { command: 'npm build', description: 'Build project', category: 'npm' },
  { command: 'ps', description: 'Show running processes', category: 'system' },
  { command: 'top', description: 'Show system processes', category: 'system' },
  { command: 'df', description: 'Show disk usage', category: 'system' },
  { command: 'free', description: 'Show memory usage', category: 'system' },
  { command: 'whoami', description: 'Show current user', category: 'system' },
  { command: 'pwd', description: 'Show current directory', category: 'system' },
  { command: 'history', description: 'Show command history', category: 'system' },
  { command: 'clear', description: 'Clear terminal screen', category: 'system' }
];

export const VirtualTerminal: React.FC<VirtualTerminalProps> = ({
  session,
  preferences,
  onSessionChange,
  onCreateNew
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when terminal is active
  useEffect(() => {
    if (inputRef.current && session?.isActive) {
      inputRef.current.focus();
    }
  }, [session?.isActive]);

  // Scroll to bottom when new output is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [session?.output]);

  // Update command history from session
  useEffect(() => {
    if (session) {
      const commands = session.history.map(cmd => cmd.command);
      setCommandHistory(commands);
    }
  }, [session?.history]);

  const updateSession = useCallback((updates: Partial<TerminalSession>) => {
    if (!session) return;
    
    const updatedSession: TerminalSession = {
      ...session,
      ...updates,
      lastModified: new Date()
    };
    
    onSessionChange(updatedSession);
  }, [session, onSessionChange]);

  const addOutput = useCallback((content: string, type: TerminalOutput['type'] = 'stdout') => {
    if (!session) return;

    const newOutput: TerminalOutput = {
      id: `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      timestamp: new Date(),
      isHtml: false
    };

    updateSession({
      output: [...session.output, newOutput]
    });
  }, [session, updateSession]);

  const executeCommand = useCallback(async (commandStr: string) => {
    if (!session || !commandStr.trim()) return;

    setIsExecuting(true);
    
    const [command, ...args] = commandStr.trim().split(' ');
    
    const newCommand: TerminalCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      command,
      args,
      timestamp: new Date()
    };

    // Add command to history
    updateSession({
      history: [...session.history, newCommand].slice(-preferences.maxHistorySize)
    });

    // Add command to output
    addOutput(`${session.currentDir}$ ${commandStr}`, 'system');

    try {
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));

      let output = '';
      let exitCode = 0;

      switch (command.toLowerCase()) {
        case 'ls':
        case 'dir':
          output = `index.html    style.css     script.js     package.json
README.md     src/          dist/         node_modules/
.git/         .gitignore    tsconfig.json vite.config.ts`;
          break;

        case 'pwd':
          output = session.currentDir;
          break;

        case 'whoami':
          output = 'developer';
          break;

        case 'date':
          output = new Date().toString();
          break;

        case 'clear':
          updateSession({ output: [] });
          setIsExecuting(false);
          return;

        case 'history':
          output = session.history
            .map((cmd, index) => `${index + 1}  ${cmd.command} ${cmd.args.join(' ')}`)
            .join('\n');
          break;

        case 'echo':
          output = args.join(' ');
          break;

        case 'cat':
          if (args.length === 0) {
            output = 'cat: missing file operand';
            exitCode = 1;
          } else {
            const filename = args[0];
            switch (filename) {
              case 'package.json':
                output = `{
  "name": "developer-project",
  "version": "1.0.0",
  "description": "A developer workflow project",
  "main": "index.js",
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}`;
                break;
              case 'README.md':
                output = `# Developer Project

This is a sample project created in the Developer Workflow Hub.

## Getting Started

1. Install dependencies: \`npm install\`
2. Start development server: \`npm start\`
3. Build for production: \`npm run build\`

## Features

- Modern development workflow
- Live preview and hot reloading
- Code optimization and performance testing
- Integrated terminal and editor`;
                break;
              default:
                output = `cat: ${filename}: No such file or directory`;
                exitCode = 1;
            }
          }
          break;

        case 'mkdir':
          if (args.length === 0) {
            output = 'mkdir: missing operand';
            exitCode = 1;
          } else {
            output = `Directory '${args[0]}' created`;
          }
          break;

        case 'touch':
          if (args.length === 0) {
            output = 'touch: missing file operand';
            exitCode = 1;
          } else {
            output = `File '${args[0]}' created`;
          }
          break;

        case 'git':
          if (args.length === 0) {
            output = `usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]
           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]
           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]
           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]
           <command> [<args>]`;
          } else {
            const gitCommand = args[0];
            switch (gitCommand) {
              case 'status':
                output = `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   src/components/CodeEditor.tsx
        modified:   src/components/Terminal.tsx

Untracked files:
  (use "git add <file>..." to include in what will be committed)

        src/components/NewComponent.tsx

no changes added to commit (use "git add" and/or "git commit -a")`;
                break;
              case 'log':
                output = `commit a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0 (HEAD -> main, origin/main)
Author: Developer <developer@example.com>
Date:   ${new Date().toDateString()}

    Add developer workflow hub components

commit b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1
Author: Developer <developer@example.com>
Date:   ${new Date(Date.now() - 86400000).toDateString()}

    Initial project setup`;
                break;
              case 'init':
                output = 'Initialized empty Git repository in .git/';
                break;
              case 'add':
                if (args.length === 1) {
                  output = 'git add: missing pathspec';
                  exitCode = 1;
                } else {
                  output = `Added ${args.slice(1).join(', ')} to staging area`;
                }
                break;
              case 'commit':
                if (args.includes('-m')) {
                  const messageIndex = args.indexOf('-m') + 1;
                  const message = args.slice(messageIndex).join(' ');
                  output = `[main ${Math.random().toString(36).substr(2, 7)}] ${message}
 2 files changed, 45 insertions(+), 12 deletions(-)`;
                } else {
                  output = 'Aborting commit due to empty commit message.';
                  exitCode = 1;
                }
                break;
              default:
                output = `git: '${gitCommand}' is not a git command. See 'git --help'.`;
                exitCode = 1;
            }
          }
          break;

        case 'npm':
          if (args.length === 0) {
            output = `Usage: npm <command>

where <command> is one of:
    install, i          install all the dependencies in your project
    run                 run arbitrary package scripts
    test                run tests
    start               run the start script
    build               run the build script
    init                create a package.json file`;
          } else {
            const npmCommand = args[0];
            switch (npmCommand) {
              case 'install':
              case 'i':
                output = `npm WARN deprecated package@1.0.0: This package is deprecated
added 1337 packages from 892 contributors and audited 1337 packages in 12.345s

found 0 vulnerabilities`;
                break;
              case 'start':
                output = `> developer-project@1.0.0 start
> vite

  VITE v4.0.0  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose`;
                break;
              case 'run':
                if (args.length === 1) {
                  output = `Scripts available in developer-project@1.0.0 via \`npm run\`:
  start
    vite
  build
    vite build
  test
    jest`;
                } else {
                  const script = args[1];
                  output = `> developer-project@1.0.0 ${script}
> ${script}

Script '${script}' executed successfully`;
                }
                break;
              case 'test':
                output = `> developer-project@1.0.0 test
> jest

 PASS  src/__tests__/components.test.ts
 PASS  src/__tests__/utils.test.ts

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        2.345 s
Ran all test suites.`;
                break;
              case 'build':
                output = `> developer-project@1.0.0 build
> vite build

✓ 45 modules transformed.
dist/index.html                  0.46 kB
dist/assets/index-a1b2c3d4.css   1.23 kB │ gzip:  0.67 kB
dist/assets/index-e5f6g7h8.js   12.34 kB │ gzip:  4.56 kB
✓ built in 1.23s`;
                break;
              default:
                output = `npm ERR! Unknown command: "${npmCommand}"`;
                exitCode = 1;
            }
          }
          break;

        case 'help':
          output = `Available commands:
File operations: ls, cd, mkdir, touch, rm, cp, mv, cat, grep, find
Git commands: git init, git add, git commit, git push, git pull, git status, git log
NPM commands: npm install, npm start, npm build, npm test, npm run
System commands: ps, top, df, free, whoami, pwd, history, clear, date, echo
Type 'help <command>' for more information about a specific command.`;
          break;

        default:
          output = `${command}: command not found`;
          exitCode = 127;
      }

      // Add output
      if (output) {
        addOutput(output, exitCode === 0 ? 'stdout' : 'stderr');
      }

      // Update command with exit code and duration
      const endTime = new Date();
      const duration = endTime.getTime() - newCommand.timestamp.getTime();
      
      updateSession({
        history: session.history.map(cmd => 
          cmd.id === newCommand.id 
            ? { ...cmd, exitCode, duration }
            : cmd
        )
      });

    } catch (error) {
      addOutput(`Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`, 'stderr');
    }

    setIsExecuting(false);
  }, [session, preferences.maxHistorySize, updateSession, addOutput]);

  const handleInputChange = useCallback((value: string) => {
    setCurrentInput(value);
    
    // Show suggestions when typing
    if (value.trim()) {
      const filtered = COMMAND_SUGGESTIONS.filter(suggestion =>
        suggestion.command.toLowerCase().startsWith(value.toLowerCase()) ||
        suggestion.description.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (currentInput.trim()) {
          executeCommand(currentInput);
          setCurrentInput('');
          setShowSuggestions(false);
          setHistoryIndex(-1);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (commandHistory.length > 0) {
          const newIndex = historyIndex === -1 
            ? commandHistory.length - 1 
            : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex] || '');
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex >= 0) {
          const newIndex = historyIndex + 1;
          if (newIndex >= commandHistory.length) {
            setHistoryIndex(-1);
            setCurrentInput('');
          } else {
            setHistoryIndex(newIndex);
            setCurrentInput(commandHistory[newIndex] || '');
          }
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (suggestions.length > 0) {
          setCurrentInput(suggestions[0].command);
          setShowSuggestions(false);
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        break;

      case 'c':
        if (e.ctrlKey) {
          e.preventDefault();
          if (isExecuting) {
            addOutput('^C', 'system');
            setIsExecuting(false);
          }
        }
        break;

      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          updateSession({ output: [] });
        }
        break;
    }
  }, [currentInput, commandHistory, historyIndex, suggestions, isExecuting, executeCommand, addOutput, updateSession]);

  const selectSuggestion = useCallback((suggestion: CommandSuggestion) => {
    setCurrentInput(suggestion.command);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  if (!session) {
    return (
      <div className="virtual-terminal no-session">
        <div className="no-session-content">
          <h3>No Terminal Session</h3>
          <p>Create a new terminal session to get started.</p>
          <Button variant="primary" onClick={onCreateNew}>
            New Terminal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="virtual-terminal">
      {/* Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          <h3>Terminal</h3>
          <div className="terminal-info">
            {session.currentDir} • {preferences.shell}
          </div>
        </div>
        
        <div className="terminal-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateSession({ output: [] })}
            title="Clear Terminal (Ctrl+L)"
          >
            🗑️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateNew}
            title="New Terminal"
          >
            ➕
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="terminal-content">
        <div 
          ref={terminalRef}
          className="terminal-output"
          style={{
            fontSize: `${preferences.fontSize}px`,
            fontFamily: preferences.fontFamily
          }}
        >
          {session.output.map(output => (
            <div
              key={output.id}
              className={`output-line ${output.type}`}
            >
              {output.isHtml ? (
                <div dangerouslySetInnerHTML={{ __html: output.content }} />
              ) : (
                <pre>{output.content}</pre>
              )}
            </div>
          ))}
          
          {/* Current Input Line */}
          <div className="input-line">
            <span className="prompt">{session.currentDir}$ </span>
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="terminal-input"
                disabled={isExecuting}
                placeholder={isExecuting ? 'Executing...' : 'Type a command...'}
                style={{
                  fontSize: `${preferences.fontSize}px`,
                  fontFamily: preferences.fontFamily
                }}
              />
              
              {/* Command Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-popup">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <div className="suggestion-command">{suggestion.command}</div>
                      <div className="suggestion-description">{suggestion.description}</div>
                      <div className="suggestion-category">{suggestion.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .virtual-terminal {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
        }

        .no-session {
          justify-content: center;
          align-items: center;
        }

        .no-session-content {
          text-align: center;
          color: var(--color-text-secondary);
        }

        .no-session-content h3 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--color-text-primary);
        }

        .no-session-content p {
          margin: 0 0 var(--spacing-lg) 0;
        }

        .terminal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
        }

        .terminal-title h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .terminal-info {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
          font-family: monospace;
        }

        .terminal-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .terminal-content {
          flex: 1;
          overflow: hidden;
          background: ${preferences.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
        }

        .terminal-output {
          height: 100%;
          overflow-y: auto;
          padding: var(--spacing-md);
          color: ${preferences.theme === 'dark' ? '#ffffff' : '#000000'};
          font-family: monospace;
          line-height: 1.4;
        }

        .output-line {
          margin-bottom: var(--spacing-xs);
        }

        .output-line pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: inherit;
        }

        .output-line.stdout {
          color: ${preferences.theme === 'dark' ? '#ffffff' : '#000000'};
        }

        .output-line.stderr {
          color: #ff6b6b;
        }

        .output-line.system {
          color: ${preferences.theme === 'dark' ? '#4ecdc4' : '#2196f3'};
        }

        .input-line {
          display: flex;
          align-items: flex-start;
          margin-top: var(--spacing-sm);
        }

        .prompt {
          color: ${preferences.theme === 'dark' ? '#4ecdc4' : '#2196f3'};
          font-weight: bold;
          white-space: nowrap;
          margin-right: var(--spacing-sm);
        }

        .input-container {
          flex: 1;
          position: relative;
        }

        .terminal-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: inherit;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }

        .terminal-input:disabled {
          opacity: 0.6;
        }

        .suggestions-popup {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
        }

        .suggestion-item {
          padding: var(--spacing-sm);
          cursor: pointer;
          border-bottom: 1px solid var(--color-border);
          transition: background-color 0.2s ease;
        }

        .suggestion-item:hover {
          background: var(--color-surface-hover);
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-command {
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-xs);
        }

        .suggestion-description {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .suggestion-category {
          font-size: var(--font-size-xs);
          color: var(--color-primary);
          text-transform: uppercase;
          font-weight: var(--font-weight-medium);
        }

        @media (max-width: 768px) {
          .terminal-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .terminal-actions {
            justify-content: center;
          }

          .terminal-output {
            padding: var(--spacing-sm);
          }

          .suggestions-popup {
            max-height: 150px;
          }
        }
      `}</style>
    </div>
  );
};