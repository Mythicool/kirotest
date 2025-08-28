import React, { useState, useCallback } from 'react';
import { DocumentWorkspace, Document, DocumentType, DocumentFormat } from '@/types/document-pipeline';
import { DocumentEditor } from './DocumentEditor';
import { useCollaboration } from './CollaborationManager';
import { FormatConverter } from './FormatConverter';
import { HackMDIntegration } from './HackMDIntegration';
import { CloudConvertIntegration } from './CloudConvertIntegration';
import { PDFProcessor } from './PDFProcessor';
import { SecureSharing } from './SecureSharing';
import { DocumentComparisonTool } from './DocumentComparison';
import Button from '@/components/ui/Button';

export const DocumentProcessingPipeline: React.FC = () => {
  const [workspace, setWorkspace] = useState<DocumentWorkspace>({
    id: 'doc-workspace-1',
    name: 'Document Processing Workspace',
    documents: [],
    collaborators: [],
    settings: {
      autoSave: true,
      collaborationEnabled: true,
      defaultFormat: DocumentFormat.MD,
      theme: 'light',
      fontSize: 14,
      showLineNumbers: true
    }
  });

  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'convert' | 'hackmd' | 'cloudconvert' | 'pdf' | 'share' | 'compare'>('editor');

  const collaboration = useCollaboration(
    activeDocument?.id || '',
    'current-user',
    'Current User'
  );

  const createNewDocument = useCallback((type: DocumentType = DocumentType.MARKDOWN) => {
    const newDocument: Document = {
      id: `doc-${Date.now()}`,
      name: `New ${type} Document`,
      type,
      content: getDefaultContent(type),
      format: getDefaultFormat(type),
      metadata: {
        tags: [],
        customProperties: {}
      },
      versions: [],
      lastModified: new Date()
    };

    setWorkspace(prev => ({
      ...prev,
      documents: [...prev.documents, newDocument]
    }));

    setActiveDocument(newDocument);
  }, []);

  const getDefaultContent = (type: DocumentType): string => {
    switch (type) {
      case DocumentType.MARKDOWN:
        return `# New Markdown Document

Welcome to your new markdown document. You can start writing here.

## Features
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- \`Code snippets\`

### Lists
- Item 1
- Item 2
- Item 3

\`\`\`javascript
// Code blocks
console.log('Hello, world!');
\`\`\`
`;

      case DocumentType.LATEX:
        return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\title{New LaTeX Document}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This is a new LaTeX document. You can start writing your content here.

\\subsection{Subsection}
Add your content here.

\\begin{itemize}
\\item First item
\\item Second item
\\item Third item
\\end{itemize}

\\end{document}`;

      case DocumentType.PLAIN_TEXT:
        return 'New plain text document.\n\nStart writing your content here...';

      default:
        return 'New document content...';
    }
  };

  const getDefaultFormat = (type: DocumentType): DocumentFormat => {
    switch (type) {
      case DocumentType.MARKDOWN:
        return DocumentFormat.MD;
      case DocumentType.LATEX:
        return DocumentFormat.TEX;
      case DocumentType.SPREADSHEET:
        return DocumentFormat.CSV;
      default:
        return DocumentFormat.TXT;
    }
  };

  const handleDocumentContentChange = useCallback((content: string) => {
    if (!activeDocument) return;

    const updatedDocument = {
      ...activeDocument,
      content,
      lastModified: new Date()
    };

    setActiveDocument(updatedDocument);
    setWorkspace(prev => ({
      ...prev,
      documents: prev.documents.map(doc => 
        doc.id === activeDocument.id ? updatedDocument : doc
      )
    }));
  }, [activeDocument]);

  const handleDocumentSave = useCallback(() => {
    if (!activeDocument) return;
    
    // In a real implementation, this would save to a backend
    console.log('Document saved:', activeDocument);
    
    // Add version to history
    const newVersion = {
      id: `version-${Date.now()}`,
      timestamp: new Date(),
      changes: 'Manual save',
      content: activeDocument.content
    };

    const updatedDocument = {
      ...activeDocument,
      versions: [...activeDocument.versions, newVersion]
    };

    setActiveDocument(updatedDocument);
    setWorkspace(prev => ({
      ...prev,
      documents: prev.documents.map(doc => 
        doc.id === activeDocument.id ? updatedDocument : doc
      )
    }));
  }, [activeDocument]);

  const handleConversionComplete = useCallback((result: string, format: DocumentFormat) => {
    if (!activeDocument) return;

    const convertedDocument: Document = {
      ...activeDocument,
      id: `${activeDocument.id}-converted`,
      name: `${activeDocument.name} (${format.toUpperCase()})`,
      content: result,
      format,
      lastModified: new Date()
    };

    setWorkspace(prev => ({
      ...prev,
      documents: [...prev.documents, convertedDocument]
    }));

    setActiveDocument(convertedDocument);
  }, [activeDocument]);

  const handleError = useCallback((error: string) => {
    console.error('Document processing error:', error);
    // In a real implementation, you'd show a toast notification
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'editor':
        return activeDocument ? (
          <DocumentEditor
            document={activeDocument}
            onContentChange={handleDocumentContentChange}
            onSave={handleDocumentSave}
            collaborationSession={collaboration.session}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
            <p className="text-gray-600 mb-4">Create a new document to get started</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => createNewDocument(DocumentType.MARKDOWN)}>
                New Markdown
              </Button>
              <Button onClick={() => createNewDocument(DocumentType.LATEX)}>
                New LaTeX
              </Button>
              <Button onClick={() => createNewDocument(DocumentType.PLAIN_TEXT)}>
                New Text
              </Button>
            </div>
          </div>
        );

      case 'convert':
        return (
          <FormatConverter
            onConversionComplete={handleConversionComplete}
            onError={handleError}
          />
        );

      case 'hackmd':
        return activeDocument ? (
          <HackMDIntegration
            document={activeDocument}
            onDocumentUpdate={handleDocumentContentChange}
            onCollaborationStart={(session) => {
              // Handle collaboration session start
              console.log('Collaboration started:', session);
            }}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Select a document to enable HackMD integration</p>
          </div>
        );

      case 'cloudconvert':
        return (
          <CloudConvertIntegration
            onConversionComplete={handleConversionComplete}
            onError={handleError}
          />
        );

      case 'pdf':
        return (
          <PDFProcessor
            onTextExtracted={(text, ocrResult) => {
              // Create new document from extracted text
              const extractedDocument: Document = {
                id: `extracted-${Date.now()}`,
                name: 'Extracted Text',
                type: DocumentType.PLAIN_TEXT,
                content: text,
                format: DocumentFormat.TXT,
                metadata: {
                  tags: ['extracted', 'ocr'],
                  customProperties: ocrResult ? { ocrResult } : {}
                },
                versions: [],
                lastModified: new Date()
              };

              setWorkspace(prev => ({
                ...prev,
                documents: [...prev.documents, extractedDocument]
              }));

              setActiveDocument(extractedDocument);
            }}
            onError={handleError}
          />
        );

      case 'share':
        return (
          <SecureSharing
            document={activeDocument ? { name: activeDocument.name, content: activeDocument.content } : undefined}
            onError={handleError}
          />
        );

      case 'compare':
        return (
          <DocumentComparisonTool
            onComparisonComplete={(comparison) => {
              console.log('Comparison complete:', comparison);
            }}
            onError={handleError}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Document Processing Pipeline</h1>
            <p className="text-gray-600">Create, edit, convert, and share documents</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => createNewDocument(DocumentType.MARKDOWN)}
            >
              + New Document
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r p-4">
          <div className="space-y-4">
            {/* Document List */}
            <div>
              <h3 className="font-medium mb-2">Documents</h3>
              <div className="space-y-1">
                {workspace.documents.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocument(doc)}
                    className={`w-full text-left p-2 rounded text-sm ${
                      activeDocument?.id === doc.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium truncate">{doc.name}</div>
                    <div className="text-xs text-gray-500">
                      {doc.type.toUpperCase()} • {doc.lastModified.toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div>
              <h3 className="font-medium mb-2">Tools</h3>
              <div className="space-y-1">
                {[
                  { id: 'editor', label: 'Editor', icon: '📝' },
                  { id: 'convert', label: 'Format Converter', icon: '🔄' },
                  { id: 'hackmd', label: 'HackMD', icon: '👥' },
                  { id: 'cloudconvert', label: 'Cloud Convert', icon: '☁️' },
                  { id: 'pdf', label: 'PDF Processor', icon: '📄' },
                  { id: 'share', label: 'Secure Sharing', icon: '🔗' },
                  { id: 'compare', label: 'Compare', icon: '⚖️' }
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTab(tool.id as any)}
                    className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                      activeTab === tool.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>{tool.icon}</span>
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};