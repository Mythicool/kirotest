import React, { useState } from 'react';
import { BackupItem, BusinessSettings, BusinessSuiteWorkspace } from '@/types/business-suite';
import Button from '@/components/ui/Button';

interface DataBackupSystemProps {
  backups: BackupItem[];
  settings: BusinessSettings;
  workspace: BusinessSuiteWorkspace;
  onBackupUpdate: (backups: BackupItem[]) => void;
}

export const DataBackupSystem: React.FC<DataBackupSystemProps> = ({
  backups,
  settings,
  workspace,
  onBackupUpdate
}) => {
  const [activeView, setActiveView] = useState<'backups' | 'create' | 'restore' | 'settings'>('backups');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [newBackupType, setNewBackupType] = useState<'project' | 'client-data' | 'invoices' | 'marketing-materials' | 'full-backup'>('full-backup');

  const cloudProviders = [
    { id: 'dropbox', name: 'Dropbox', icon: '📦', description: 'Sync with Dropbox' },
    { id: 'google-drive', name: 'Google Drive', icon: '💾', description: 'Store in Google Drive' },
    { id: 'onedrive', name: 'OneDrive', icon: '☁️', description: 'Microsoft OneDrive storage' }
  ];

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      // Simulate backup creation process
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 2500));

      const backup: BackupItem = {
        id: `backup-${Date.now()}`,
        name: `${newBackupType} - ${new Date().toLocaleDateString()}`,
        type: newBackupType,
        size: calculateBackupSize(newBackupType),
        createdDate: new Date(),
        location: settings.backupSettings.cloudProvider ? 'cloud' : 'local',
        cloudProvider: settings.backupSettings.cloudProvider,
        encrypted: settings.backupSettings.encryption,
        status: 'completed'
      };

      const updatedBackups = [...backups, backup];
      onBackupUpdate(updatedBackups);
      setActiveView('backups');
    } catch (error) {
      console.error('Backup creation failed:', error);
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const calculateBackupSize = (type: string): number => {
    switch (type) {
      case 'project':
        return workspace.projects.length * 2.5; // MB per project
      case 'client-data':
        return workspace.clients.length * 0.5; // MB per client
      case 'invoices':
        return workspace.invoices.length * 0.3; // MB per invoice
      case 'marketing-materials':
        return workspace.marketingMaterials.length * 5; // MB per material
      case 'full-backup':
        return (workspace.projects.length * 2.5) + 
               (workspace.clients.length * 0.5) + 
               (workspace.invoices.length * 0.3) + 
               (workspace.marketingMaterials.length * 5) + 10; // Base overhead
      default:
        return 10;
    }
  };

  const handleRestoreBackup = async (backup: BackupItem) => {
    if (!confirm(`Are you sure you want to restore from "${backup.name}"? This will overwrite current data.`)) {
      return;
    }

    try {
      // Simulate restore process
      const updatedBackups = backups.map(b => 
        b.id === backup.id ? { ...b, status: 'restoring' as const } : b
      );
      onBackupUpdate(updatedBackups);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const finalBackups = backups.map(b => 
        b.id === backup.id ? { ...b, status: 'completed' as const } : b
      );
      onBackupUpdate(finalBackups);

      alert('Backup restored successfully!');
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Restore failed. Please try again.');
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    const updatedBackups = backups.filter(b => b.id !== backupId);
    onBackupUpdate(updatedBackups);
  };

  const renderBackupList = () => (
    <div className="backup-list">
      <div className="list-header">
        <h3>Data Backups</h3>
        <Button onClick={() => setActiveView('create')} className="primary">
          Create Backup
        </Button>
      </div>
      
      <div className="backup-stats">
        <div className="stat-card">
          <h4>Total Backups</h4>
          <div className="stat-value">{backups.length}</div>
        </div>
        <div className="stat-card">
          <h4>Total Size</h4>
          <div className="stat-value">
            {(backups.reduce((sum, b) => sum + b.size, 0)).toFixed(1)} MB
          </div>
        </div>
        <div className="stat-card">
          <h4>Cloud Backups</h4>
          <div className="stat-value">
            {backups.filter(b => b.location === 'cloud').length}
          </div>
        </div>
        <div className="stat-card">
          <h4>Last Backup</h4>
          <div className="stat-value">
            {backups.length > 0 
              ? Math.floor((Date.now() - Math.max(...backups.map(b => b.createdDate.getTime()))) / (1000 * 60 * 60 * 24))
              : 'Never'
            } days ago
          </div>
        </div>
      </div>
      
      <div className="backup-table">
        <div className="table-header">
          <div>Name</div>
          <div>Type</div>
          <div>Size</div>
          <div>Location</div>
          <div>Created</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        
        {backups.map(backup => (
          <div key={backup.id} className="table-row">
            <div className="backup-name">
              {backup.name}
              {backup.encrypted && <span className="encrypted-badge">🔒</span>}
            </div>
            <div className="backup-type">
              <span className={`type-badge ${backup.type}`}>
                {backup.type.replace('-', ' ')}
              </span>
            </div>
            <div>{backup.size.toFixed(1)} MB</div>
            <div className="backup-location">
              <span className={`location-badge ${backup.location}`}>
                {backup.location === 'cloud' ? (
                  <>
                    {cloudProviders.find(p => p.id === backup.cloudProvider)?.icon || '☁️'}
                    {backup.cloudProvider}
                  </>
                ) : (
                  <>💻 Local</>
                )}
              </span>
            </div>
            <div>{backup.createdDate.toLocaleDateString()}</div>
            <div>
              <span className={`status-badge ${backup.status}`}>
                {backup.status}
              </span>
            </div>
            <div className="action-buttons">
              <Button 
                onClick={() => handleRestoreBackup(backup)}
                disabled={backup.status !== 'completed'}
                className="small"
              >
                Restore
              </Button>
              {backup.url && (
                <Button 
                  onClick={() => window.open(backup.url, '_blank')}
                  className="small secondary"
                >
                  Download
                </Button>
              )}
              <Button 
                onClick={() => handleDeleteBackup(backup.id)}
                className="small danger"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        
        {backups.length === 0 && (
          <div className="empty-backups">
            <h4>No backups yet</h4>
            <p>Create your first backup to protect your business data</p>
            <Button onClick={() => setActiveView('create')} className="primary">
              Create First Backup
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateBackup = () => (
    <div className="create-backup">
      <div className="create-header">
        <h3>Create New Backup</h3>
        <Button onClick={() => setActiveView('backups')} className="secondary">
          Back to Backups
        </Button>
      </div>
      
      <div className="backup-form">
        <div className="form-section">
          <h4>Backup Type</h4>
          <div className="backup-type-options">
            <div 
              className={`type-option ${newBackupType === 'full-backup' ? 'selected' : ''}`}
              onClick={() => setNewBackupType('full-backup')}
            >
              <div className="type-icon">💾</div>
              <div className="type-info">
                <h5>Full Backup</h5>
                <p>Complete backup of all business data</p>
                <span className="size-estimate">
                  ~{calculateBackupSize('full-backup').toFixed(1)} MB
                </span>
              </div>
            </div>
            
            <div 
              className={`type-option ${newBackupType === 'project' ? 'selected' : ''}`}
              onClick={() => setNewBackupType('project')}
            >
              <div className="type-icon">📋</div>
              <div className="type-info">
                <h5>Projects Only</h5>
                <p>Backup project data and tasks</p>
                <span className="size-estimate">
                  ~{calculateBackupSize('project').toFixed(1)} MB
                </span>
              </div>
            </div>
            
            <div 
              className={`type-option ${newBackupType === 'client-data' ? 'selected' : ''}`}
              onClick={() => setNewBackupType('client-data')}
            >
              <div className="type-icon">👥</div>
              <div className="type-info">
                <h5>Client Data</h5>
                <p>Backup client information and contacts</p>
                <span className="size-estimate">
                  ~{calculateBackupSize('client-data').toFixed(1)} MB
                </span>
              </div>
            </div>
            
            <div 
              className={`type-option ${newBackupType === 'invoices' ? 'selected' : ''}`}
              onClick={() => setNewBackupType('invoices')}
            >
              <div className="type-icon">🧾</div>
              <div className="type-info">
                <h5>Invoices</h5>
                <p>Backup all invoice data</p>
                <span className="size-estimate">
                  ~{calculateBackupSize('invoices').toFixed(1)} MB
                </span>
              </div>
            </div>
            
            <div 
              className={`type-option ${newBackupType === 'marketing-materials' ? 'selected' : ''}`}
              onClick={() => setNewBackupType('marketing-materials')}
            >
              <div className="type-icon">🎨</div>
              <div className="type-info">
                <h5>Marketing Materials</h5>
                <p>Backup marketing assets and designs</p>
                <span className="size-estimate">
                  ~{calculateBackupSize('marketing-materials').toFixed(1)} MB
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4>Backup Location</h4>
          <div className="location-options">
            <div className="location-option">
              <input 
                type="radio"
                id="local-backup"
                name="location"
                defaultChecked={!settings.backupSettings.cloudProvider}
              />
              <label htmlFor="local-backup">
                <div className="location-icon">💻</div>
                <div className="location-info">
                  <h5>Local Storage</h5>
                  <p>Store backup on your device</p>
                </div>
              </label>
            </div>
            
            {cloudProviders.map(provider => (
              <div key={provider.id} className="location-option">
                <input 
                  type="radio"
                  id={`${provider.id}-backup`}
                  name="location"
                  defaultChecked={settings.backupSettings.cloudProvider === provider.id}
                />
                <label htmlFor={`${provider.id}-backup`}>
                  <div className="location-icon">{provider.icon}</div>
                  <div className="location-info">
                    <h5>{provider.name}</h5>
                    <p>{provider.description}</p>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-section">
          <h4>Backup Options</h4>
          <div className="backup-options">
            <div className="option-item">
              <input 
                type="checkbox"
                id="encrypt-backup"
                defaultChecked={settings.backupSettings.encryption}
              />
              <label htmlFor="encrypt-backup">
                <strong>Encrypt backup</strong>
                <p>Protect your data with encryption</p>
              </label>
            </div>
            
            <div className="option-item">
              <input 
                type="checkbox"
                id="include-files"
                defaultChecked={settings.backupSettings.includeFiles}
              />
              <label htmlFor="include-files">
                <strong>Include uploaded files</strong>
                <p>Backup associated files and attachments</p>
              </label>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <Button 
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="primary"
          >
            {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
          </Button>
          <Button onClick={() => setActiveView('backups')} className="secondary">
            Cancel
          </Button>
        </div>
        
        {isCreatingBackup && (
          <div className="backup-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${backupProgress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              Creating backup... {backupProgress}%
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="backup-settings">
      <h3>Backup Settings</h3>
      
      <div className="settings-form">
        <div className="setting-section">
          <h4>Automatic Backups</h4>
          <div className="setting-item">
            <input 
              type="checkbox"
              id="auto-backup"
              defaultChecked={settings.backupSettings.autoBackup}
            />
            <label htmlFor="auto-backup">
              <strong>Enable automatic backups</strong>
              <p>Automatically create backups on a schedule</p>
            </label>
          </div>
          
          <div className="setting-item">
            <label>Backup Frequency:</label>
            <select defaultValue={settings.backupSettings.backupFrequency}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        
        <div className="setting-section">
          <h4>Retention Policy</h4>
          <div className="setting-item">
            <label>Keep backups for:</label>
            <select defaultValue={settings.backupSettings.retentionPeriod}>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
        
        <div className="setting-section">
          <h4>Cloud Storage</h4>
          <div className="cloud-providers">
            {cloudProviders.map(provider => (
              <div key={provider.id} className="provider-option">
                <input 
                  type="radio"
                  id={`settings-${provider.id}`}
                  name="cloud-provider"
                  defaultChecked={settings.backupSettings.cloudProvider === provider.id}
                />
                <label htmlFor={`settings-${provider.id}`}>
                  <span className="provider-icon">{provider.icon}</span>
                  <span className="provider-name">{provider.name}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="setting-section">
          <h4>Security</h4>
          <div className="setting-item">
            <input 
              type="checkbox"
              id="settings-encrypt"
              defaultChecked={settings.backupSettings.encryption}
            />
            <label htmlFor="settings-encrypt">
              <strong>Encrypt all backups</strong>
              <p>Use AES-256 encryption for all backup files</p>
            </label>
          </div>
        </div>
        
        <div className="settings-actions">
          <Button className="primary">Save Settings</Button>
          <Button className="secondary">Reset to Defaults</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="data-backup-system">
      <div className="backup-tabs">
        <Button 
          onClick={() => setActiveView('backups')}
          className={`tab-button ${activeView === 'backups' ? 'active' : ''}`}
        >
          💾 Backups
        </Button>
        <Button 
          onClick={() => setActiveView('create')}
          className={`tab-button ${activeView === 'create' ? 'active' : ''}`}
        >
          ➕ Create Backup
        </Button>
        <Button 
          onClick={() => setActiveView('settings')}
          className={`tab-button ${activeView === 'settings' ? 'active' : ''}`}
        >
          ⚙️ Settings
        </Button>
      </div>

      <div className="backup-content">
        {activeView === 'backups' && renderBackupList()}
        {activeView === 'create' && renderCreateBackup()}
        {activeView === 'settings' && renderBackupSettings()}
      </div>
    </div>
  );
};