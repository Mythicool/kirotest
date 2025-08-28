import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, DocumentType, DocumentFormat, CollaborationSession } from '@/types/document-pipeline';
import Button from '@/components/ui/Button';

interface DocumentEditorProps {
  document: Document;
  onContentChange: (content: string) => void;
  onSave: () => void;
  collaborationSession?: CollaborationSession;
  readOnly?: boolean;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  onContentChange,
  onSave,
  collaborationSession,
  readOnly = false
}) => {
  const [content, setContent] = useState(document.content);
  const [isModified, setIsModified] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(document.content);
    setIsModified(false);
  }, [document.content]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsModified(true);
    onContentChange(newContent);
  }, [onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      onSave();
      setIsModified(false);
    }
  }, [onSave]);

  const updateCursorPosition = useCallback(() => {
    if (editorRef.current) {
      const textarea = editorRef.current;
      const text = textarea.value;
      const cursorPos = textarea.selectionStart;
      
      const lines = text.substring(0, cursorPos).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      setCursorPosition({ line, column });
    }
  }, []);

  const insertText = useCallback((text: string) => {
    if (editorRef.current && !readOnly) {
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + text + content.substring(end);
      
      handleContentChange(newContent);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    }
  }, [content, handleContentChange, readOnly]);

  const renderToolbar = () => {
    if (document.type === DocumentType.MARKDOWN) {
      return (
        <div className="flex gap-2 p-2 border-b bg-gray-50">
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('**Bold**')}
            disabled={readOnly}
          >
            B
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('*Italic*')}
            disabled={readOnly}
          >
            I
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('# Heading')}
            disabled={readOnly}
          >
            H1
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('- List item')}
            disabled={readOnly}
          >
            List
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('[Link](url)')}
            disabled={readOnly}
          >
            Link
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('```\nCode block\n```')}
            disabled={readOnly}
          >
            Code
          </Button>
        </div>
      );
    }

    if (document.type === DocumentType.LATEX) {
      return (
        <div className="flex gap-2 p-2 border-b bg-gray-50">
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('\\textbf{Bold}')}
            disabled={readOnly}
          >
            Bold
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('\\textit{Italic}')}
            disabled={readOnly}
          >
            Italic
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('\\section{Section}')}
            disabled={readOnly}
          >
            Section
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('\\begin{equation}\n\n\\end{equation}')}
            disabled={readOnly}
          >
            Equation
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => insertText('\\begin{itemize}\n\\item \n\\end{itemize}')}
            disabled={readOnly}
          >
            List
          </Button>
        </div>
      );
    }

    return null;
  };

  const renderCollaborators = () => {
    if (!collaborationSession || collaborationSession.participants.length === 0) {
      return null;
    }

    return (
      <div className="flex gap-2 p-2 border-b bg-blue-50">
        <span className="text-sm text-gray-600">Collaborators:</span>
        {collaborationSession.participants.map(collaborator => (
          <div
            key={collaborator.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{ backgroundColor: collaborator.color + '20', color: collaborator.color }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: collaborator.color }}
            />
            {collaborator.name}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">{document.name}</h3>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
            {document.type.toUpperCase()}
          </span>
          {isModified && (
            <span className="text-xs text-orange-600">• Modified</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Line {cursorPosition.line}, Column {cursorPosition.column}
          </span>
          <Button
            size="sm"
            onClick={onSave}
            disabled={!isModified || readOnly}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Collaborators */}
      {renderCollaborators()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Editor */}
      <div className="flex-1 relative">
        {document.type === DocumentType.SPREADSHEET ? (
          <div className="p-4">
            <div className="text-center text-gray-500">
              <p>Spreadsheet Editor</p>
              <p className="text-sm">Integration with EtherCalc would be implemented here</p>
            </div>
          </div>
        ) : (
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onSelect={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            className="w-full h-full p-4 font-mono text-sm resize-none border-none outline-none"
            placeholder={`Start writing your ${document.type} document...`}
            readOnly={readOnly}
            spellCheck={document.type !== DocumentType.LATEX}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-t bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>Words: {content.split(/\s+/).filter(word => word.length > 0).length}</span>
          <span>Characters: {content.length}</span>
          {document.metadata.language && (
            <span>Language: {document.metadata.language}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {collaborationSession?.isActive && (
            <span className="text-green-600">• Live</span>
          )}
          <span>Last saved: {document.lastModified.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};