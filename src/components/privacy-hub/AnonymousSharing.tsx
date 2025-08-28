import React, { useState } from 'react';
import { AnonymousShare, PrivacySettings } from '@/types/privacy-hub';
import Button from '@/components/ui/Button';

interface AnonymousSharingProps {
  shares: AnonymousShare[];
  onShareCreate: (share: AnonymousShare) => void;
  settings: PrivacySettings;
}

export const AnonymousSharing: React.FC<AnonymousSharingProps> = ({
  shares,
  onShareCreate,
  settings
}) => {
  const [originalEmail, setOriginalEmail] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const generateProtectedEmail = (email: string, alias?: string): string => {
    const domain = email.split('@')[1] || 'example.com';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    
    if (alias) {
      return `${alias}-${random}@scr.im`;
    }
    
    return `protected-${timestamp}-${random}@scr.im`;
  };

  const createAnonymousShare = async () => {
    if (!originalEmail.trim()) {
      alert('Please enter an email address to protect');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(originalEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const protectedEmail = generateProtectedEmail(originalEmail, customAlias);
      const shareUrl = `https://scr.im/share/${protectedEmail.split('@')[0]}`;
      const expiryDate = expiryDays > 0 ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : undefined;

      const anonymousShare: AnonymousShare = {
        id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        provider: 'scr.im',
        originalEmail,
        protectedEmail,
        shareUrl,
        created: new Date(),
        expires: expiryDate
      };

      onShareCreate(anonymousShare);
      
      // Reset form
      setOriginalEmail('');
      setCustomAlias('');
    } catch (error) {
      console.error('Failed to create anonymous share:', error);
      alert('Failed to create anonymous share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyProtectedEmail = (email: string) => {
    navigator.clipboard.writeText(email).then(() => {
      alert('Protected email copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy email. Please copy manually: ' + email);
    });
  };

  const copyShareUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      alert('Share URL copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy URL. Please copy manually: ' + url);
    });
  };

  const openShareUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const formatTimeRemaining = (expires?: Date): string => {
    if (!expires) return 'Never expires';
    
    const now = new Date();
    const remaining = expires.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Expired';
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} days, ${hours} hours remaining`;
    }
    return `${hours} hours remaining`;
  };

  const isExpired = (expires?: Date): boolean => {
    if (!expires) return false;
    return new Date() > expires;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Create Anonymous Email Share</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email Address
            </label>
            <input
              type="email"
              value={originalEmail}
              onChange={(e) => setOriginalEmail(e.target.value)}
              placeholder="Enter your real email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be protected and hidden from public view
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Alias (optional)
            </label>
            <input
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
              placeholder="Enter custom alias (e.g., myproject, contact)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for auto-generated alias
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Period
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={0}>Never expires</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How long the protected email should remain active
            </p>
          </div>

          <Button
            onClick={createAnonymousShare}
            disabled={loading || !originalEmail.trim()}
            className="w-full"
          >
            {loading ? 'Creating Protected Email...' : '🕶️ Create Anonymous Share'}
          </Button>
        </div>
      </div>

      {shares.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Your Anonymous Shares</h3>
          <div className="space-y-4">
            {shares.slice().reverse().map((share) => {
              const expired = isExpired(share.expires);
              
              return (
                <div
                  key={share.id}
                  className={`p-4 border rounded-lg ${expired ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm mb-1">
                        Protected Email
                      </div>
                      <div className="font-mono text-sm text-purple-600 mb-2">
                        {share.protectedEmail}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        Original: {share.originalEmail}
                      </div>
                      <div className={`text-xs ${expired ? 'text-red-600' : 'text-green-600'}`}>
                        {formatTimeRemaining(share.expires)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-1 ml-4">
                      <Button
                        onClick={() => copyProtectedEmail(share.protectedEmail)}
                        variant="outline"
                        size="sm"
                        disabled={expired}
                      >
                        📧 Copy Email
                      </Button>
                      <Button
                        onClick={() => copyShareUrl(share.shareUrl)}
                        variant="outline"
                        size="sm"
                        disabled={expired}
                      >
                        🔗 Copy URL
                      </Button>
                      <Button
                        onClick={() => openShareUrl(share.shareUrl)}
                        variant="outline"
                        size="sm"
                        disabled={expired}
                      >
                        🌐 Open
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 border-t pt-2">
                    Created: {share.created.toLocaleString()}
                  </div>
                  
                  {expired && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
                      ⚠️ This protected email has expired and is no longer active
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 mb-2">How Anonymous Sharing Works</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Your real email is hidden behind a protected alias</li>
          <li>• People can contact you without seeing your actual email</li>
          <li>• Messages are forwarded to your real email address</li>
          <li>• You can set expiry dates for automatic cleanup</li>
          <li>• Perfect for online forms, temporary contacts, and privacy</li>
          <li>• No registration required - completely anonymous</li>
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Use Cases</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Online Forms:</strong> Use protected email for signups and registrations</li>
          <li>• <strong>Temporary Projects:</strong> Share contact info for short-term collaborations</li>
          <li>• <strong>Public Listings:</strong> Post contact info on websites or forums safely</li>
          <li>• <strong>Testing:</strong> Use for testing email functionality without spam risk</li>
          <li>• <strong>Privacy:</strong> Keep your real email private while staying reachable</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Protected emails forward messages to your real email</li>
          <li>• Keep track of your protected emails and their expiry dates</li>
          <li>• Expired protected emails will stop forwarding messages</li>
          <li>• This service is provided by scr.im - check their terms of service</li>
          <li>• Consider using different aliases for different purposes</li>
        </ul>
      </div>
    </div>
  );
};