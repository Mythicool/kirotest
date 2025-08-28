import React, { useState, useRef } from 'react';
import { FileShareSession, SharedFile, PrivacySettings } from '@/types/privacy-hub';
import Button from '@/components/ui/Button';

interface P2PFileSharingProps {
  sessions: FileShareSession[];
  onSessionCreate: (session: FileShareSession) => void;
  settings: PrivacySettings;
}

export const P2PFileSharing: React.FC<P2PFileSharingProps> = ({
  sessions,
  onSessionCreate,
  settings
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [shareType, setShareType] = useState<'p2p' | 'secure-transfer'>('p2p');
  const [password, setPassword] = useState('');
  const [downloadLimit, setDownloadLimit] = useState(1);
  const [expiryHours, setExpiryHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<FileShareSession | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const createP2PSession = async (): Promise<FileShareSession> => {
    // Simulate P2P connection setup with EFShare-like functionality
    const sessionId = `p2p-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const sharedFiles: SharedFile[] = selectedFiles.map((file, index) => ({
      id: `file-${index}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      encrypted: settings.secureByDefault,
      shareUrl: `efshare://share/${sessionId}/${index}`
    }));

    return {
      id: sessionId,
      type: 'p2p',
      provider: 'efshare',
      files: sharedFiles,
      downloadLimit,
      expiresIn: expiryHours * 3600,
      password: password ? true : false,
      created: new Date()
    };
  };

  const createSecureTransferSession = async (): Promise<FileShareSession> => {
    // Simulate Firefox Send-like secure transfer
    const sessionId = `secure-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const sharedFiles: SharedFile[] = selectedFiles.map((file, index) => ({
      id: `file-${index}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      encrypted: true,
      downloadUrl: `https://send.firefox.com/download/${sessionId}/${index}`,
      shareUrl: `https://send.firefox.com/share/${sessionId}`
    }));

    return {
      id: sessionId,
      type: 'secure-transfer',
      provider: 'firefox-send',
      files: sharedFiles,
      downloadLimit,
      expiresIn: expiryHours * 3600,
      password: password ? true : false,
      created: new Date()
    };
  };

  const createShareSession = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to share');
      return;
    }

    setLoading(true);
    
    try {
      const session = shareType === 'p2p' 
        ? await createP2PSession()
        : await createSecureTransferSession();

      onSessionCreate(session);
      setActiveSession(session);
      
      // Reset form
      setSelectedFiles([]);
      setPassword('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to create file share session:', error);
      alert('Failed to create share session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyShareUrl = (session: FileShareSession) => {
    const url = session.files[0]?.shareUrl || `Share ID: ${session.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Share URL copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy URL. Please copy manually: ' + url);
    });
  };

  const getExpiryTime = (session: FileShareSession): Date => {
    return new Date(session.created.getTime() + (session.expiresIn || 0) * 1000);
  };

  const formatTimeRemaining = (session: FileShareSession): string => {
    if (!session.expiresIn) return 'No expiry';
    
    const now = new Date();
    const expiry = getExpiryTime(session);
    const remaining = expiry.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const getTotalSize = (files: File[]): string => {
    const total = files.reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(total);
  };

  if (activeSession) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">File Share Active</h3>
              <p className="text-gray-600">
                {activeSession.provider} • {activeSession.files.length} files
              </p>
            </div>
            <Button onClick={() => setActiveSession(null)} variant="outline">
              Close
            </Button>
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>🔒 {activeSession.password ? 'Password protected' : 'Public'}</span>
              <span>📥 {activeSession.downloadLimit} downloads max</span>
              <span>⏰ {formatTimeRemaining(activeSession)}</span>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {activeSession.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-gray-600">
                    {formatFileSize(file.size)} • {file.encrypted ? '🔒 Encrypted' : '🔓 Unencrypted'}
                  </div>
                </div>
                {file.downloadUrl && (
                  <Button
                    onClick={() => window.open(file.downloadUrl, '_blank')}
                    size="sm"
                    variant="outline"
                  >
                    Download
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => copyShareUrl(activeSession)}
              className="flex-1"
            >
              📋 Copy Share URL
            </Button>
            {activeSession.type === 'p2p' && (
              <Button
                onClick={() => alert('P2P connection details:\n' + JSON.stringify(activeSession, null, 2))}
                variant="outline"
                className="flex-1"
              >
                🔗 Connection Info
              </Button>
            )}
          </div>

          {activeSession.type === 'p2p' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">P2P Sharing Instructions</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Share the connection URL with recipients</li>
                <li>2. Recipients will connect directly to your device</li>
                <li>3. Keep this tab open while sharing</li>
                <li>4. Files transfer directly without servers</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Share Files Securely</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sharing Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setShareType('p2p')}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  shareType === 'p2p'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Peer-to-Peer (EFShare)</div>
                <div className="text-sm text-gray-600 mt-1">
                  Direct connection • No file size limits
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Files transfer directly between devices
                </div>
              </div>
              
              <div
                onClick={() => setShareType('secure-transfer')}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  shareType === 'secure-transfer'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Secure Transfer (Firefox Send)</div>
                <div className="text-sm text-gray-600 mt-1">
                  Encrypted upload • Easy sharing
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Files encrypted and stored temporarily
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {selectedFiles.length} files selected • Total: {getTotalSize(selectedFiles)}
              </div>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Selected Files
              </label>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{file.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <Button
                    onClick={() => removeFile(index)}
                    variant="outline"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password (optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for no password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Download Limit
              </label>
              <select
                value={downloadLimit}
                onChange={(e) => setDownloadLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={1}>1 download</option>
                <option value={5}>5 downloads</option>
                <option value={10}>10 downloads</option>
                <option value={100}>100 downloads</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires In
              </label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={168}>7 days</option>
              </select>
            </div>
          </div>

          <Button
            onClick={createShareSession}
            disabled={loading || selectedFiles.length === 0}
            className="w-full"
          >
            {loading ? 'Creating Share...' : `Create ${shareType === 'p2p' ? 'P2P' : 'Secure'} Share`}
          </Button>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Shares</h3>
          <div className="space-y-3">
            {sessions.slice(-5).reverse().map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {session.provider} • {session.files.length} files
                  </div>
                  <div className="text-sm text-gray-600">
                    {session.password ? '🔒 Password protected' : '🔓 Public'} • 
                    {formatTimeRemaining(session)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {session.created.toLocaleString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => copyShareUrl(session)}
                    variant="outline"
                    size="sm"
                  >
                    Copy URL
                  </Button>
                  <Button
                    onClick={() => setActiveSession(session)}
                    size="sm"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Secure File Sharing</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• P2P sharing connects devices directly for maximum privacy</li>
          <li>• Secure transfers are encrypted end-to-end</li>
          <li>• Files automatically expire for security</li>
          <li>• No registration or personal information required</li>
          <li>• Download limits prevent unauthorized access</li>
        </ul>
      </div>
    </div>
  );
};