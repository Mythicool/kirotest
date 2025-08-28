import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Document, CollaborationSession } from '@/types/document-pipeline';
import Button from '@/components/ui/Button';

interface HackMDIntegrationProps {
  document: Document;
  onDocumentUpdate: (content: string) => void;
  onCollaborationStart: (session: CollaborationSession) => void;
}

export const HackMDIntegration: React.FC<HackMDIntegrationProps> = ({
  document,
  onDocumentUpdate,
  onCollaborationStart
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hackmdUrl, setHackmdUrl] = useState('');
  const [embedMode, setEmbedMode] = useState<'view' | 'edit' | 'both'>('both');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const createHackMDDocument = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Simulate creating a new HackMD document
      // In a real implementation, this would use HackMD's API
      const mockHackMDId = `hackmd-${Date.now()}`;
      const mockUrl = `https://hackmd.io/${mockHackMDId}`;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHackmdUrl(mockUrl);
      setIsConnected(true);
      
      // Create collaboration session
      const collaborationSession: CollaborationSession = {
        id: `hackmd-session-${mockHackMDId}`,
        documentId: document.id,
        participants: [
          {
            id: 'current-user',
            name: 'You',
            color: '#3B82F6',
            lastSeen: new Date()
          }
        ],
        operations: [],
        isActive: true
      };
      
      onCollaborationStart(collaborationSession);
      
    } catch (error) {
      console.error('Failed to create HackMD document:', error);
    } finally {
      setIsLoading(false);
    }
  }, [document.id, onCollaborationStart]);

  const loadExistingDocument = useCallback(async (url: string) => {
    setIsLoading(true);
    
    try {
      // Validate HackMD URL
      if (!url.includes('hackmd.io')) {
        throw new Error('Invalid HackMD URL');
      }
      
      setHackmdUrl(url);
      setIsConnected(true);
      
      // Simulate loading existing document
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Failed to load HackMD document:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncWithHackMD = useCallback(async () => {
    if (!isConnected || !hackmdUrl) return;
    
    try {
      // Simulate syncing content from HackMD
      // In a real implementation, this would fetch the latest content
      const mockUpdatedContent = `# ${document.name}\n\nThis content was synced from HackMD at ${new Date().toLocaleTimeString()}\n\n${document.content}`;
      
      onDocumentUpdate(mockUpdatedContent);
      
    } catch (error) {
      console.error('Failed to sync with HackMD:', error);
    }
  }, [isConnected, hackmdUrl, document.name, document.content, onDocumentUpdate]);

  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current && hackmdUrl) {
      // Set up postMessage communication with HackMD iframe
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== 'https://hackmd.io') return;
        
        if (event.data.type === 'content-change') {
          onDocumentUpdate(event.data.content);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [hackmdUrl, onDocumentUpdate]);

  const getEmbedUrl = () => {
    if (!hackmdUrl) return '';
    
    const baseUrl = hackmdUrl.replace('hackmd.io', 'hackmd.io');
    
    switch (embedMode) {
      case 'view':
        return `${baseUrl}?view`;
      case 'edit':
        return `${baseUrl}?edit`;
      case 'both':
        return `${baseUrl}?both`;
      default:
        return baseUrl;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Controls */}
      <div className="bg-white p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-4">HackMD Integration</h3>
        
        {!isConnected ? (
          <div className="space-y-4">
            <div>
              <Button
                onClick={createHackMDDocument}
                disabled={isLoading}
                className="mr-2"
              >
                {isLoading ? 'Creating...' : 'Create New HackMD Document'}
              </Button>
              <span className="text-sm text-gray-600">
                Create a new collaborative document on HackMD
              </span>
            </div>
            
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">
                Or load existing HackMD document:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://hackmd.io/your-document-id"
                  className="flex-1 p-2 border rounded-md"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      loadExistingDocument((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    const input = window.document.querySelector('input[type="url"]') as HTMLInputElement;
                    if (input?.value) {
                      loadExistingDocument(input.value);
                    }
                  }}
                  disabled={isLoading}
                >
                  Load
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Connected to HackMD</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={embedMode}
                  onChange={(e) => setEmbedMode(e.target.value as 'view' | 'edit' | 'both')}
                  className="text-sm p-1 border rounded"
                >
                  <option value="both">Edit & Preview</option>
                  <option value="edit">Edit Only</option>
                  <option value="view">Preview Only</option>
                </select>
                <Button size="sm" onClick={syncWithHackMD}>
                  Sync
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsConnected(false);
                    setHackmdUrl('');
                  }}
                >
                  Disconnect
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <strong>Document URL:</strong>{' '}
              <a
                href={hackmdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {hackmdUrl}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* HackMD Embed */}
      {isConnected && hackmdUrl && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-3 border-b bg-gray-50">
            <h4 className="font-medium">Collaborative Editor</h4>
            <p className="text-sm text-gray-600">
              Changes made here will be synced in real-time with all collaborators
            </p>
          </div>
          
          <div className="relative" style={{ height: '600px' }}>
            <iframe
              ref={iframeRef}
              src={getEmbedUrl()}
              className="w-full h-full border-none"
              onLoad={handleIframeLoad}
              title="HackMD Collaborative Editor"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
            
            {/* Overlay for demo purposes */}
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium mb-2">HackMD Integration</h3>
                <p className="text-gray-600 max-w-md">
                  In a real implementation, this would show the embedded HackMD editor
                  with real-time collaboration features.
                </p>
                <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
                  <strong>Features:</strong>
                  <ul className="text-left mt-2 space-y-1">
                    <li>• Real-time collaborative editing</li>
                    <li>• Markdown syntax support</li>
                    <li>• Live preview</li>
                    <li>• Version history</li>
                    <li>• Comment system</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Status */}
      {isConnected && (
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-800">Live Collaboration Active</span>
          </div>
          <p className="text-sm text-blue-700">
            Share the HackMD URL with collaborators to enable real-time editing.
            All changes will be automatically synced across all participants.
          </p>
        </div>
      )}
    </div>
  );
};