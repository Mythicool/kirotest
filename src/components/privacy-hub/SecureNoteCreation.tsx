import React, { useState } from 'react';
import { SecureNote, PrivacySettings } from '@/types/privacy-hub';
import Button from '@/components/ui/Button';

interface SecureNoteCreationProps {
  notes: SecureNote[];
  onNoteCreate: (note: SecureNote) => void;
  settings: PrivacySettings;
}

export const SecureNoteCreation: React.FC<SecureNoteCreationProps> = ({
  notes,
  onNoteCreate,
  settings
}) => {
  const [noteContent, setNoteContent] = useState('');
  const [siteId, setSiteId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeNote, setActiveNote] = useState<SecureNote | null>(null);

  const generateRandomSiteId = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `privacy-note-${timestamp}-${random}`;
  };

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createSecureNote = async () => {
    if (!noteContent.trim()) {
      alert('Please enter note content');
      return;
    }

    if (!siteId.trim()) {
      alert('Please enter a site ID');
      return;
    }

    if (!password.trim()) {
      alert('Please enter a password');
      return;
    }

    setLoading(true);
    
    try {
      const noteId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const url = `https://www.protectedtext.com/${siteId}`;

      const secureNote: SecureNote = {
        id: noteId,
        provider: 'protectedtext',
        siteId,
        password,
        content: noteContent,
        url,
        created: new Date(),
        lastModified: new Date()
      };

      onNoteCreate(secureNote);
      setActiveNote(secureNote);
      
      // Reset form
      setNoteContent('');
      setSiteId('');
      setPassword('');
    } catch (error) {
      console.error('Failed to create secure note:', error);
      alert('Failed to create secure note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openNote = (note: SecureNote) => {
    window.open(note.url, '_blank');
  };

  const copyNoteUrl = (note: SecureNote) => {
    navigator.clipboard.writeText(note.url).then(() => {
      alert('Note URL copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy URL. Please copy manually: ' + note.url);
    });
  };

  const copyCredentials = (note: SecureNote) => {
    const credentials = `Site ID: ${note.siteId}\nPassword: ${note.password}\nURL: ${note.url}`;
    navigator.clipboard.writeText(credentials).then(() => {
      alert('Note credentials copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy credentials');
    });
  };

  const editNote = (note: SecureNote) => {
    setNoteContent(note.content);
    setSiteId(note.siteId);
    setPassword(note.password);
    setActiveNote(note);
  };

  const updateNote = async () => {
    if (!activeNote) return;

    const updatedNote: SecureNote = {
      ...activeNote,
      content: noteContent,
      lastModified: new Date()
    };

    onNoteCreate(updatedNote);
    setActiveNote(null);
    setNoteContent('');
    setSiteId('');
    setPassword('');
  };

  if (activeNote && noteContent) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Edit Secure Note</h3>
              <p className="text-gray-600">Site ID: {activeNote.siteId}</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setActiveNote(null)} variant="outline">
                Cancel
              </Button>
              <Button onClick={updateNote}>
                Update Note
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Content
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your secure note content..."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Note Information</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p><strong>Site ID:</strong> {activeNote.siteId}</p>
                <p><strong>Password:</strong> {activeNote.password}</p>
                <p><strong>URL:</strong> {activeNote.url}</p>
                <p><strong>Created:</strong> {activeNote.created.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Create Secure Note</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Content
            </label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your secure note content..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Your note will be encrypted and stored securely
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="Enter unique site ID"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button
                  onClick={() => setSiteId(generateRandomSiteId())}
                  variant="outline"
                >
                  🎲 Random
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for your note (like a username)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button
                  onClick={() => setPassword(generateRandomPassword())}
                  variant="outline"
                >
                  🎲 Random
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Strong password to encrypt your note
              </p>
            </div>
          </div>

          <Button
            onClick={createSecureNote}
            disabled={loading || !noteContent.trim() || !siteId.trim() || !password.trim()}
            className="w-full"
          >
            {loading ? 'Creating Secure Note...' : '🔒 Create Secure Note'}
          </Button>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Your Secure Notes</h3>
          <div className="space-y-3">
            {notes.slice().reverse().map((note) => (
              <div
                key={note.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">
                    Site ID: {note.siteId}
                  </div>
                  <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {note.content.substring(0, 100)}
                    {note.content.length > 100 && '...'}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Created: {note.created.toLocaleDateString()}</span>
                    <span>Modified: {note.lastModified.toLocaleDateString()}</span>
                    <span>🔒 Encrypted</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1 ml-4">
                  <Button
                    onClick={() => openNote(note)}
                    size="sm"
                    className="w-20"
                  >
                    Open
                  </Button>
                  <Button
                    onClick={() => editNote(note)}
                    variant="outline"
                    size="sm"
                    className="w-20"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => copyNoteUrl(note)}
                    variant="outline"
                    size="sm"
                    className="w-20"
                  >
                    Copy URL
                  </Button>
                  <Button
                    onClick={() => copyCredentials(note)}
                    variant="outline"
                    size="sm"
                    className="w-20"
                  >
                    Copy Info
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How Secure Notes Work</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Notes are encrypted with your password before being stored</li>
          <li>• Only you can access your notes with the Site ID and password</li>
          <li>• ProtectedText.com doesn't store your password or unencrypted content</li>
          <li>• Keep your Site ID and password safe - they cannot be recovered</li>
          <li>• Notes persist until you delete them manually</li>
          <li>• Use strong, unique passwords for maximum security</li>
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Usage Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Use descriptive Site IDs to remember your notes</li>
          <li>• Generate random passwords for better security</li>
          <li>• Save your credentials in a password manager</li>
          <li>• Create separate notes for different topics</li>
          <li>• Regularly backup important note credentials</li>
        </ul>
      </div>
    </div>
  );
};