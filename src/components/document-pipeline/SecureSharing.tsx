import React, { useState, useCallback } from 'react';
import { ShareOptions } from '@/types/document-pipeline';
import Button from '@/components/ui/Button';

interface ShareLink {
  id: string;
  fileName: string;
  url: string;
  password?: string;
  expirationTime?: Date;
  downloadLimit?: number;
  downloadsRemaining: number;
  createdAt: Date;
  isActive: boolean;
}

interface SecureSharingProps {
  document?: { name: string; content: string };
  onError: (error: string) => void;
}

export const SecureSharing: React.FC<SecureSharingProps> = ({
  document,
  onError
}) => {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    downloadLimit: 5,
    allowComments: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const createSecureLink = useCallback(async () => {
    if (!document && !selectedFile) {
      onError('Please provide a document or select a file to share');
      return;
    }

    setIsCreatingLink(true);

    try {
      // Simulate Firefox Send API integration
      await new Promise(resolve => setTimeout(resolve, 2000));

      const shareLink: ShareLink = {
        id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: document?.name || selectedFile?.name || 'document',
        url: `https://send.firefox.com/download/${Math.random().toString(36).substr(2, 16)}`,
        password: shareOptions.password,
        expirationTime: shareOptions.expirationTime,
        downloadLimit: shareOptions.downloadLimit || 1,
        downloadsRemaining: shareOptions.downloadLimit || 1,
        createdAt: new Date(),
        isActive: true
      };

      setShareLinks(prev => [shareLink, ...prev]);

      // Clear form
      setShareOptions({
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        downloadLimit: 5,
        allowComments: false
      });

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to create secure link');
    } finally {
      setIsCreatingLink(false);
    }
  }, [document, selectedFile, shareOptions, onError]);

  const revokeLink = useCallback((linkId: string) => {
    setShareLinks(prev => prev.map(link => 
      link.id === linkId 
        ? { ...link, isActive: false }
        : link
    ));
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // In a real app, you'd show a toast notification here
      console.log('Link copied to clipboard');
    } catch (error) {
      onError('Failed to copy link to clipboard');
    }
  }, [onError]);

  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setShareOptions(prev => ({ ...prev, password }));
  }, []);

  const formatTimeRemaining = (expirationTime: Date): string => {
    const now = new Date();
    const diff = expirationTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Secure Link */}
      <div className="bg-white p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-4">Create Secure Share Link</h3>
        
        <div className="space-y-4">
          {!document && (
            <div>
              <label className="block text-sm font-medium mb-2">Select File to Share</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          )}

          {(document || selectedFile) && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="font-medium mb-1">File to Share</h4>
              <p className="text-sm text-gray-600">
                {document?.name || selectedFile?.name}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Expiration Time</label>
              <select
                value={shareOptions.expirationTime ? 
                  Math.floor((shareOptions.expirationTime.getTime() - Date.now()) / (1000 * 60 * 60)) : 24}
                onChange={(e) => {
                  const hours = parseInt(e.target.value);
                  setShareOptions(prev => ({
                    ...prev,
                    expirationTime: new Date(Date.now() + hours * 60 * 60 * 1000)
                  }));
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>1 week</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Download Limit</label>
              <select
                value={shareOptions.downloadLimit || 1}
                onChange={(e) => setShareOptions(prev => ({
                  ...prev,
                  downloadLimit: parseInt(e.target.value)
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value={1}>1 download</option>
                <option value={5}>5 downloads</option>
                <option value={10}>10 downloads</option>
                <option value={25}>25 downloads</option>
                <option value={100}>100 downloads</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password Protection (Optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareOptions.password || ''}
                onChange={(e) => setShareOptions(prev => ({
                  ...prev,
                  password: e.target.value || undefined
                }))}
                placeholder="Enter password or generate one"
                className="flex-1 p-2 border rounded-md"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={generatePassword}
              >
                Generate
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowComments"
              checked={shareOptions.allowComments || false}
              onChange={(e) => setShareOptions(prev => ({
                ...prev,
                allowComments: e.target.checked
              }))}
              className="rounded"
            />
            <label htmlFor="allowComments" className="text-sm">
              Allow comments on shared document
            </label>
          </div>

          <Button
            onClick={createSecureLink}
            disabled={isCreatingLink || (!document && !selectedFile)}
            className="w-full"
          >
            {isCreatingLink ? 'Creating Secure Link...' : 'Create Secure Share Link'}
          </Button>
        </div>
      </div>

      {/* Active Share Links */}
      {shareLinks.length > 0 && (
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Active Share Links</h3>
          
          <div className="space-y-4">
            {shareLinks.map(link => (
              <div key={link.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{link.fileName}</h4>
                    <p className="text-sm text-gray-600">
                      Created {link.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      link.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {link.isActive ? 'Active' : 'Revoked'}
                    </span>
                    {link.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeLink(link.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>

                {link.isActive && (
                  <>
                    <div className="bg-gray-50 p-3 rounded-md mb-3">
                      <div className="flex items-center justify-between">
                        <code className="text-sm break-all">{link.url}</code>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(link.url)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Downloads:</span>
                        <div className="font-medium">
                          {link.downloadsRemaining} / {link.downloadLimit} remaining
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Expires:</span>
                        <div className="font-medium">
                          {link.expirationTime ? formatTimeRemaining(link.expirationTime) : 'Never'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Password:</span>
                        <div className="font-medium">
                          {link.password ? '••••••••' : 'None'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Comments:</span>
                        <div className="font-medium">
                          {shareOptions.allowComments ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                    </div>

                    {link.password && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <strong>Password:</strong> {link.password}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(link.password!)}
                            className="ml-2"
                          >
                            Copy Password
                          </Button>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Firefox Send Info */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">About Firefox Send Integration</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• End-to-end encrypted file sharing</p>
          <p>• Automatic deletion after expiration or download limit</p>
          <p>• No account required for recipients</p>
          <p>• Password protection available</p>
          <p>• Files are deleted from servers after expiration</p>
        </div>
      </div>
    </div>
  );
};