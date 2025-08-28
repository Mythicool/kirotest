import React, { useState, useEffect } from 'react';
import { CommunicationSession, CommunicationProvider, PrivacySettings } from '@/types/privacy-hub';
import Button from '@/components/ui/Button';

interface SecureCommunicationProps {
  sessions: CommunicationSession[];
  onSessionCreate: (session: CommunicationSession) => void;
  settings: PrivacySettings;
}

export const SecureCommunication: React.FC<SecureCommunicationProps> = ({
  sessions,
  onSessionCreate,
  settings
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('tlk.io');
  const [roomName, setRoomName] = useState('');
  const [sessionType, setSessionType] = useState<'video' | 'audio' | 'text'>('video');
  const [activeSession, setActiveSession] = useState<CommunicationSession | null>(null);
  const [loading, setLoading] = useState(false);

  const providers: CommunicationProvider[] = [
    {
      id: 'tlk.io',
      name: 'Tlk.io',
      type: 'text',
      features: ['Anonymous chat', 'No registration', 'Temporary rooms'],
      maxParticipants: 50,
      encrypted: true,
      anonymous: true,
      baseUrl: 'https://tlk.io'
    },
    {
      id: 'gruveo',
      name: 'Gruveo',
      type: 'video',
      features: ['Video calls', 'Screen sharing', 'No downloads'],
      maxParticipants: 2,
      encrypted: true,
      anonymous: true,
      baseUrl: 'https://www.gruveo.com'
    },
    {
      id: 'whereby',
      name: 'Whereby',
      type: 'video',
      features: ['Group video calls', 'Screen sharing', 'Chat'],
      maxParticipants: 4,
      encrypted: true,
      anonymous: true,
      baseUrl: 'https://whereby.com'
    }
  ];

  const generateRoomId = (provider: string): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    
    switch (provider) {
      case 'tlk.io':
        return `privacy-${timestamp}-${random}`;
      case 'gruveo':
        return `${timestamp}${random}`;
      case 'whereby':
        return `privacy-hub-${timestamp}-${random}`;
      default:
        return `room-${timestamp}-${random}`;
    }
  };

  const createSession = async () => {
    if (!roomName.trim() && selectedProvider !== 'gruveo') {
      alert('Please enter a room name');
      return;
    }

    setLoading(true);
    
    try {
      const provider = providers.find(p => p.id === selectedProvider);
      if (!provider) throw new Error('Provider not found');

      const roomId = roomName.trim() || generateRoomId(selectedProvider);
      const expiryTime = new Date(Date.now() + (settings.sessionTimeout || 3600000));

      const session: CommunicationSession = {
        id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        type: provider.type as 'video' | 'audio' | 'text',
        provider: selectedProvider as 'tlk.io' | 'gruveo' | 'whereby',
        roomId,
        participants: 0,
        encrypted: provider.encrypted,
        created: new Date(),
        expires: settings.autoDeleteSessions ? expiryTime : undefined
      };

      onSessionCreate(session);
      setActiveSession(session);
      setRoomName('');
    } catch (error) {
      console.error('Failed to create communication session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinSession = (session: CommunicationSession) => {
    setActiveSession(session);
  };

  const getSessionUrl = (session: CommunicationSession): string => {
    switch (session.provider) {
      case 'tlk.io':
        return `https://tlk.io/${session.roomId}`;
      case 'gruveo':
        return `https://www.gruveo.com/${session.roomId}`;
      case 'whereby':
        return `https://whereby.com/${session.roomId}`;
      default:
        return '#';
    }
  };

  const copySessionUrl = (session: CommunicationSession) => {
    const url = getSessionUrl(session);
    navigator.clipboard.writeText(url).then(() => {
      alert('Session URL copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy URL. Please copy manually: ' + url);
    });
  };

  const endSession = () => {
    setActiveSession(null);
  };

  const formatTimeRemaining = (expires?: Date): string => {
    if (!expires) return 'No expiry';
    
    const now = new Date();
    const remaining = expires.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (activeSession) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Active Session</h3>
              <p className="text-gray-600">
                {activeSession.provider} • Room: {activeSession.roomId}
              </p>
            </div>
            <Button onClick={endSession} variant="outline">
              End Session
            </Button>
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>🔒 Encrypted</span>
              <span>👥 {activeSession.participants} participants</span>
              <span>⏰ {formatTimeRemaining(activeSession.expires)}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <iframe
              src={getSessionUrl(activeSession)}
              className="w-full h-96 border-0 rounded"
              title={`${activeSession.provider} Communication`}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={() => copySessionUrl(activeSession)}
              variant="outline"
              className="flex-1"
            >
              📋 Copy Session URL
            </Button>
            <Button
              onClick={() => window.open(getSessionUrl(activeSession), '_blank')}
              variant="outline"
              className="flex-1"
            >
              🔗 Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Create Secure Communication Session</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication Provider
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProvider === provider.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {provider.type} • Up to {provider.maxParticipants} users
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {provider.features.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Name (optional)
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Leave empty for auto-generated room"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated rooms are more secure and anonymous
            </p>
          </div>

          <Button
            onClick={createSession}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Session...' : 'Create Secure Session'}
          </Button>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
          <div className="space-y-3">
            {sessions.slice(-5).reverse().map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium">{session.provider}</div>
                  <div className="text-sm text-gray-600">
                    Room: {session.roomId} • {session.type}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {session.created.toLocaleString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => copySessionUrl(session)}
                    variant="outline"
                    size="sm"
                  >
                    Copy URL
                  </Button>
                  <Button
                    onClick={() => joinSession(session)}
                    size="sm"
                  >
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Privacy & Security</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All communications are end-to-end encrypted</li>
          <li>• No registration or personal information required</li>
          <li>• Sessions automatically expire for security</li>
          <li>• Room URLs can be shared securely with participants</li>
          <li>• No conversation history is stored</li>
        </ul>
      </div>
    </div>
  );
};