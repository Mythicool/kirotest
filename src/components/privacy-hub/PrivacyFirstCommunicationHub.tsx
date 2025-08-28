import React, { useState, useEffect } from 'react';
import { PrivacyHubWorkspace, CommunicationSession, FileShareSession, TemporaryEmail } from '@/types/privacy-hub';
import Button from '@/components/ui/Button';
import { SecureCommunication } from './SecureCommunication';
import { P2PFileSharing } from './P2PFileSharing';
import { TemporaryEmailSystem } from './TemporaryEmailSystem';
import { TextEncryption } from './TextEncryption';
import { SecureNoteCreation } from './SecureNoteCreation';
import { AnonymousSharing } from './AnonymousSharing';
import { VirusScanning } from './VirusScanning';
import { PasswordGeneration } from './PasswordGeneration';

interface PrivacyFirstCommunicationHubProps {
  workspaceId: string;
  onWorkspaceUpdate?: (workspace: PrivacyHubWorkspace) => void;
}

export const PrivacyFirstCommunicationHub: React.FC<PrivacyFirstCommunicationHubProps> = ({
  workspaceId,
  onWorkspaceUpdate
}) => {
  const [workspace, setWorkspace] = useState<PrivacyHubWorkspace | null>(null);
  const [activeTab, setActiveTab] = useState<string>('communication');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeWorkspace();
  }, [workspaceId]);

  const initializeWorkspace = async () => {
    try {
      setLoading(true);
      
      // Load existing workspace or create new one
      const existingWorkspace = localStorage.getItem(`privacy-hub-${workspaceId}`);
      
      if (existingWorkspace) {
        const parsed = JSON.parse(existingWorkspace);
        setWorkspace({
          ...parsed,
          created: new Date(parsed.created),
          lastUsed: new Date()
        });
      } else {
        const newWorkspace: PrivacyHubWorkspace = {
          id: workspaceId,
          name: 'Privacy Hub Workspace',
          communications: [],
          fileShares: [],
          tempEmails: [],
          encryptions: [],
          secureNotes: [],
          anonymousShares: [],
          virusScans: [],
          passwords: [],
          settings: {
            autoDeleteSessions: true,
            sessionTimeout: 3600000, // 1 hour
            defaultEncryption: 'aes-256',
            autoScanFiles: true,
            secureByDefault: true,
            anonymizeData: true
          },
          created: new Date(),
          lastUsed: new Date()
        };
        
        setWorkspace(newWorkspace);
        saveWorkspace(newWorkspace);
      }
    } catch (error) {
      console.error('Failed to initialize privacy hub workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkspace = (updatedWorkspace: PrivacyHubWorkspace) => {
    try {
      localStorage.setItem(`privacy-hub-${workspaceId}`, JSON.stringify(updatedWorkspace));
      onWorkspaceUpdate?.(updatedWorkspace);
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  };

  const updateWorkspace = (updates: Partial<PrivacyHubWorkspace>) => {
    if (!workspace) return;
    
    const updatedWorkspace = {
      ...workspace,
      ...updates,
      lastUsed: new Date()
    };
    
    setWorkspace(updatedWorkspace);
    saveWorkspace(updatedWorkspace);
  };

  const addCommunicationSession = (session: CommunicationSession) => {
    if (!workspace) return;
    
    updateWorkspace({
      communications: [...workspace.communications, session]
    });
  };

  const addFileShareSession = (session: FileShareSession) => {
    if (!workspace) return;
    
    updateWorkspace({
      fileShares: [...workspace.fileShares, session]
    });
  };

  const addTemporaryEmail = (email: TemporaryEmail) => {
    if (!workspace) return;
    
    updateWorkspace({
      tempEmails: [...workspace.tempEmails, email]
    });
  };

  const cleanupExpiredSessions = () => {
    if (!workspace) return;
    
    const now = new Date();
    
    const activeCommunications = workspace.communications.filter(
      comm => !comm.expires || comm.expires > now
    );
    
    const activeFileShares = workspace.fileShares.filter(
      share => {
        if (!share.expiresIn) return true;
        const expiryTime = new Date(share.created.getTime() + share.expiresIn * 1000);
        return expiryTime > now;
      }
    );
    
    const activeTempEmails = workspace.tempEmails.filter(
      email => email.expires > now
    );
    
    updateWorkspace({
      communications: activeCommunications,
      fileShares: activeFileShares,
      tempEmails: activeTempEmails
    });
  };

  // Auto-cleanup expired sessions
  useEffect(() => {
    if (!workspace?.settings.autoDeleteSessions) return;
    
    const interval = setInterval(cleanupExpiredSessions, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [workspace]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading Privacy Hub...</span>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load workspace</p>
        <Button onClick={initializeWorkspace} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'communication', label: 'Secure Communication', icon: '💬' },
    { id: 'file-sharing', label: 'File Sharing', icon: '📁' },
    { id: 'temp-email', label: 'Temporary Email', icon: '📧' },
    { id: 'encryption', label: 'Text Encryption', icon: '🔐' },
    { id: 'secure-notes', label: 'Secure Notes', icon: '📝' },
    { id: 'anonymous', label: 'Anonymous Sharing', icon: '🕶️' },
    { id: 'virus-scan', label: 'Virus Scanning', icon: '🛡️' },
    { id: 'passwords', label: 'Password Generation', icon: '🔑' }
  ];

  return (
    <div className="privacy-hub-container h-full flex flex-col">
      <div className="privacy-hub-header bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Privacy-First Communication Hub</h1>
        <p className="text-purple-100">
          Secure communication, file sharing, and privacy tools without accounts
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <span>🔒 End-to-end encrypted</span>
          <span>🚫 No registration required</span>
          <span>⏰ Auto-cleanup enabled</span>
        </div>
      </div>

      <div className="privacy-hub-tabs border-b border-gray-200 bg-white">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="privacy-hub-content flex-1 overflow-auto bg-gray-50">
        {activeTab === 'communication' && (
          <SecureCommunication
            sessions={workspace.communications}
            onSessionCreate={addCommunicationSession}
            settings={workspace.settings}
          />
        )}
        
        {activeTab === 'file-sharing' && (
          <P2PFileSharing
            sessions={workspace.fileShares}
            onSessionCreate={addFileShareSession}
            settings={workspace.settings}
          />
        )}
        
        {activeTab === 'temp-email' && (
          <TemporaryEmailSystem
            emails={workspace.tempEmails}
            onEmailCreate={addTemporaryEmail}
            settings={workspace.settings}
          />
        )}
        
        {activeTab === 'encryption' && (
          <TextEncryption
            encryptions={workspace.encryptions}
            onEncryptionCreate={(encryption) => 
              updateWorkspace({ encryptions: [...workspace.encryptions, encryption] })
            }
            settings={workspace.settings}
          />
        )}
        
        {activeTab === 'secure-notes' && (
          <SecureNoteCreation
            notes={workspace.secureNotes}
            onNoteCreate={(note) => 
              updateWorkspace({ secureNotes: [...workspace.secureNotes, note] })
            }
            settings={workspace.settings}
          />
        )}
        
        {activeTab === 'anonymous' && (
          <AnonymousSharing
            shares={workspace.anonymousShares}
            onShareCreate={(share) => 
              updateWorkspace({ anonymousShares: [...workspace.anonymousShares, share] })
            }
            settings={workspace.settings}
          />
        )}
        
        {activeTab === 'virus-scan' && (
          <VirusScanning
            scans={workspace.virusScans}
            onScanCreate={(scan) => 
              updateWorkspace({ virusScans: [...workspace.virusScans, scan] })
            }
            settings={workspace.settings}
          />
        )}
        
        {activeTab === 'passwords' && (
          <PasswordGeneration
            passwords={workspace.passwords}
            onPasswordCreate={(password) => 
              updateWorkspace({ passwords: [...workspace.passwords, password] })
            }
            settings={workspace.settings}
          />
        )}
      </div>
    </div>
  );
};