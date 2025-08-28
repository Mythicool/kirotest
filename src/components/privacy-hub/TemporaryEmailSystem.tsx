import React, { useState, useEffect } from 'react';
import { TemporaryEmail, EmailMessage, PrivacySettings } from '@/types/privacy-hub';
import Button from '@/components/ui/Button';

interface TemporaryEmailSystemProps {
  emails: TemporaryEmail[];
  onEmailCreate: (email: TemporaryEmail) => void;
  settings: PrivacySettings;
}

export const TemporaryEmailSystem: React.FC<TemporaryEmailSystemProps> = ({
  emails,
  onEmailCreate,
  settings
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'10minutemail' | 'mailinator'>('10minutemail');
  const [customAddress, setCustomAddress] = useState('');
  const [activeEmail, setActiveEmail] = useState<TemporaryEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const providers = [
    {
      id: '10minutemail' as const,
      name: '10 Minute Mail',
      description: 'Temporary email that expires in 10 minutes',
      features: ['Auto-expires', 'Extendable', 'No registration'],
      baseUrl: 'https://10minutemail.com'
    },
    {
      id: 'mailinator' as const,
      name: 'Mailinator',
      description: 'Public temporary email with custom addresses',
      features: ['Custom addresses', 'Public inbox', 'No expiry'],
      baseUrl: 'https://www.mailinator.com'
    }
  ];

  const generateRandomAddress = (provider: string): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    
    switch (provider) {
      case '10minutemail':
        return `temp-${timestamp}-${random}@10minutemail.com`;
      case 'mailinator':
        return `privacy-${timestamp}-${random}@mailinator.com`;
      default:
        return `temp-${timestamp}@example.com`;
    }
  };

  const createTemporaryEmail = async () => {
    setLoading(true);
    
    try {
      const address = customAddress.trim() || generateRandomAddress(selectedProvider);
      const expiryTime = selectedProvider === '10minutemail' 
        ? new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for mailinator

      const tempEmail: TemporaryEmail = {
        id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        address,
        provider: selectedProvider,
        expires: expiryTime,
        messages: [],
        autoRefresh: true
      };

      onEmailCreate(tempEmail);
      setActiveEmail(tempEmail);
      setCustomAddress('');
    } catch (error) {
      console.error('Failed to create temporary email:', error);
      alert('Failed to create temporary email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshMessages = async (email: TemporaryEmail) => {
    setRefreshing(true);
    
    try {
      // Simulate fetching messages from the provider
      const mockMessages: EmailMessage[] = [
        {
          id: `msg-${Date.now()}`,
          from: 'noreply@example.com',
          subject: 'Welcome to our service',
          body: 'Thank you for signing up! Please verify your email address.',
          received: new Date(),
          attachments: []
        }
      ];

      // In a real implementation, this would fetch from the actual provider
      const updatedEmail = {
        ...email,
        messages: [...email.messages, ...mockMessages]
      };

      setActiveEmail(updatedEmail);
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const extendExpiry = (email: TemporaryEmail) => {
    if (email.provider === '10minutemail') {
      const extendedExpiry = new Date(email.expires.getTime() + 10 * 60 * 1000);
      const updatedEmail = { ...email, expires: extendedExpiry };
      setActiveEmail(updatedEmail);
      alert('Email extended by 10 minutes');
    }
  };

  const copyEmailAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(() => {
      alert('Email address copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy address. Please copy manually: ' + address);
    });
  };

  const openInProvider = (email: TemporaryEmail) => {
    const provider = providers.find(p => p.id === email.provider);
    if (provider) {
      let url = provider.baseUrl;
      if (email.provider === 'mailinator') {
        const username = email.address.split('@')[0];
        url = `${provider.baseUrl}/v4/public/inboxes.jsp?to=${username}`;
      }
      window.open(url, '_blank');
    }
  };

  const formatTimeRemaining = (expires: Date): string => {
    const now = new Date();
    const remaining = expires.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s remaining`;
    }
    return `${seconds}s remaining`;
  };

  // Auto-refresh messages for active email
  useEffect(() => {
    if (!activeEmail?.autoRefresh) return;
    
    const interval = setInterval(() => {
      if (activeEmail && new Date() < activeEmail.expires) {
        refreshMessages(activeEmail);
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [activeEmail]);

  if (activeEmail) {
    const isExpired = new Date() > activeEmail.expires;
    
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Active Temporary Email</h3>
              <p className="text-gray-600 font-mono text-sm">
                {activeEmail.address}
              </p>
            </div>
            <Button onClick={() => setActiveEmail(null)} variant="outline">
              Close
            </Button>
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-4 text-sm">
              <span className={`px-2 py-1 rounded ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {isExpired ? '❌ Expired' : `⏰ ${formatTimeRemaining(activeEmail.expires)}`}
              </span>
              <span className="text-gray-600">
                📧 {activeEmail.messages.length} messages
              </span>
              <span className="text-gray-600">
                🏷️ {activeEmail.provider}
              </span>
            </div>
          </div>

          <div className="flex space-x-2 mb-4">
            <Button
              onClick={() => copyEmailAddress(activeEmail.address)}
              variant="outline"
              className="flex-1"
            >
              📋 Copy Address
            </Button>
            <Button
              onClick={() => refreshMessages(activeEmail)}
              disabled={refreshing || isExpired}
              variant="outline"
              className="flex-1"
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </Button>
            {activeEmail.provider === '10minutemail' && !isExpired && (
              <Button
                onClick={() => extendExpiry(activeEmail)}
                variant="outline"
                className="flex-1"
              >
                ⏰ Extend +10min
              </Button>
            )}
            <Button
              onClick={() => openInProvider(activeEmail)}
              variant="outline"
              className="flex-1"
            >
              🔗 Open in Provider
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Messages ({activeEmail.messages.length})</h4>
            
            {activeEmail.messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>No messages yet</p>
                <p className="text-sm">Messages will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeEmail.messages.map((message) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{message.subject}</div>
                        <div className="text-sm text-gray-600">
                          From: {message.from}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {message.received.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {message.body}
                    </div>
                    
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Attachments:
                        </div>
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                            📎 {attachment.name} ({attachment.size} bytes)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Create Temporary Email</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Provider
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    {provider.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {provider.features.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedProvider === 'mailinator' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Address (optional)
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="your-custom-name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
                  @mailinator.com
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for auto-generated address
              </p>
            </div>
          )}

          <Button
            onClick={createTemporaryEmail}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Email...' : 'Create Temporary Email'}
          </Button>
        </div>
      </div>

      {emails.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Temporary Emails</h3>
          <div className="space-y-3">
            {emails.slice(-5).reverse().map((email) => {
              const isExpired = new Date() > email.expires;
              return (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-mono text-sm">{email.address}</div>
                    <div className="text-sm text-gray-600">
                      {email.provider} • {email.messages.length} messages
                    </div>
                    <div className={`text-xs ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                      {isExpired ? 'Expired' : formatTimeRemaining(email.expires)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => copyEmailAddress(email.address)}
                      variant="outline"
                      size="sm"
                    >
                      Copy
                    </Button>
                    <Button
                      onClick={() => setActiveEmail(email)}
                      size="sm"
                      disabled={isExpired}
                    >
                      {isExpired ? 'Expired' : 'Open'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Temporary Email Usage</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Use for sign-ups, verifications, and one-time communications</li>
          <li>• 10 Minute Mail expires quickly but can be extended</li>
          <li>• Mailinator allows custom addresses and longer retention</li>
          <li>• Messages are automatically refreshed every 30 seconds</li>
          <li>• Never use for important or sensitive communications</li>
        </ul>
      </div>
    </div>
  );
};