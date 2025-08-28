import React, { useState, useCallback, useEffect } from 'react';
import { BackendService, BackendCollection, BackendDocument } from '@/types/developer-hub';
import Button from '@/components/ui/Button';

interface BackendIntegrationProps {
  services: BackendService[];
  onServiceChange: (service: BackendService) => void;
  onServiceCreate: (service: BackendService) => void;
}

interface ServiceProvider {
  type: 'jsonstore' | 'firebase' | 'supabase' | 'mongodb' | 'custom';
  name: string;
  description: string;
  icon: string;
  features: string[];
  setupSteps: string[];
}

const SERVICE_PROVIDERS: ServiceProvider[] = [
  {
    type: 'jsonstore',
    name: 'JSONStore.io',
    description: 'Simple JSON storage service for prototyping and small applications',
    icon: '📦',
    features: ['No authentication required', 'REST API', 'JSON storage', 'Free tier available'],
    setupSteps: [
      'No setup required',
      'Start storing JSON data immediately',
      'Use the generated endpoint URL'
    ]
  },
  {
    type: 'firebase',
    name: 'Firebase Firestore',
    description: 'Google\'s NoSQL document database with real-time synchronization',
    icon: '🔥',
    features: ['Real-time updates', 'Offline support', 'Authentication', 'Scalable'],
    setupSteps: [
      'Create a Firebase project',
      'Enable Firestore database',
      'Configure authentication',
      'Add Firebase SDK to your project'
    ]
  },
  {
    type: 'supabase',
    name: 'Supabase',
    description: 'Open source Firebase alternative with PostgreSQL database',
    icon: '⚡',
    features: ['PostgreSQL database', 'Real-time subscriptions', 'Authentication', 'Storage'],
    setupSteps: [
      'Create a Supabase project',
      'Set up database schema',
      'Configure Row Level Security',
      'Add Supabase client to your project'
    ]
  },
  {
    type: 'mongodb',
    name: 'MongoDB Atlas',
    description: 'Cloud-hosted MongoDB database service',
    icon: '🍃',
    features: ['Document database', 'Flexible schema', 'Aggregation pipeline', 'Global clusters'],
    setupSteps: [
      'Create MongoDB Atlas account',
      'Create a cluster',
      'Set up database user',
      'Configure network access',
      'Connect using connection string'
    ]
  },
  {
    type: 'custom',
    name: 'Custom API',
    description: 'Connect to your own custom backend API',
    icon: '🔧',
    features: ['Custom endpoints', 'Flexible authentication', 'Any data format', 'Full control'],
    setupSteps: [
      'Prepare your API endpoints',
      'Configure authentication method',
      'Test API connectivity',
      'Set up data models'
    ]
  }
];

export const BackendIntegration: React.FC<BackendIntegrationProps> = ({
  services,
  onServiceChange,
  onServiceCreate
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider>(SERVICE_PROVIDERS[0]);
  const [activeService, setActiveService] = useState<BackendService | null>(
    services.length > 0 ? services[0] : null
  );
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState({
    name: '',
    endpoint: '',
    apiKey: ''
  });
  const [selectedCollection, setSelectedCollection] = useState<BackendCollection | null>(null);
  const [newDocumentData, setNewDocumentData] = useState('{}');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update active service when services change
  useEffect(() => {
    if (services.length > 0 && !activeService) {
      setActiveService(services[0]);
    }
  }, [services, activeService]);

  // Create new service
  const createService = useCallback(async () => {
    if (!setupData.name.trim()) {
      setError('Service name is required');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Simulate service creation
      await new Promise(resolve => setTimeout(resolve, 1500));

      let endpoint = setupData.endpoint;
      let apiKey = setupData.apiKey;

      // Generate defaults for JSONStore
      if (selectedProvider.type === 'jsonstore') {
        endpoint = endpoint || `https://www.jsonstore.io/${Math.random().toString(36).substr(2, 16)}`;
        apiKey = ''; // JSONStore doesn't require API key
      }

      const newService: BackendService = {
        id: `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: setupData.name,
        type: selectedProvider.type,
        endpoint,
        apiKey,
        configuration: {
          timeout: 5000,
          retries: 3,
          headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
        },
        collections: [],
        isConnected: true,
        lastSync: new Date(),
        usage: {
          requests: 0,
          storage: 0,
          bandwidth: 0
        },
        created: new Date(),
        lastModified: new Date()
      };

      // Add default collection for JSONStore
      if (selectedProvider.type === 'jsonstore') {
        const defaultCollection: BackendCollection = {
          id: `collection_${Date.now()}_default`,
          name: 'data',
          documents: [],
          indexes: [],
          permissions: {
            read: 'public',
            write: 'public',
            delete: 'public'
          },
          created: new Date(),
          lastModified: new Date()
        };
        newService.collections = [defaultCollection];
      }

      onServiceCreate(newService);
      setActiveService(newService);
      setShowSetup(false);
      setSetupData({ name: '', endpoint: '', apiKey: '' });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setIsConnecting(false);
    }
  }, [setupData, selectedProvider, onServiceCreate]);

  // Test service connection
  const testConnection = useCallback(async (service: BackendService) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedService: BackendService = {
        ...service,
        isConnected: true,
        lastSync: new Date(),
        lastModified: new Date()
      };

      onServiceChange(updatedService);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
      
      const updatedService: BackendService = {
        ...service,
        isConnected: false,
        lastModified: new Date()
      };

      onServiceChange(updatedService);
    } finally {
      setIsConnecting(false);
    }
  }, [onServiceChange]);

  // Create new collection
  const createCollection = useCallback(async (service: BackendService) => {
    const collectionName = prompt('Enter collection name:');
    if (!collectionName) return;

    setIsConnecting(true);

    try {
      // Simulate collection creation
      await new Promise(resolve => setTimeout(resolve, 500));

      const newCollection: BackendCollection = {
        id: `collection_${Date.now()}_${collectionName.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: collectionName,
        documents: [],
        indexes: [],
        permissions: {
          read: 'public',
          write: 'public',
          delete: 'public'
        },
        created: new Date(),
        lastModified: new Date()
      };

      const updatedService: BackendService = {
        ...service,
        collections: [...service.collections, newCollection],
        lastModified: new Date()
      };

      onServiceChange(updatedService);
      setSelectedCollection(newCollection);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setIsConnecting(false);
    }
  }, [onServiceChange]);

  // Add document to collection
  const addDocument = useCallback(async () => {
    if (!activeService || !selectedCollection) return;

    try {
      const documentData = JSON.parse(newDocumentData);
      setIsConnecting(true);

      // Simulate document creation
      await new Promise(resolve => setTimeout(resolve, 300));

      const newDocument: BackendDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: documentData,
        created: new Date(),
        lastModified: new Date(),
        version: 1
      };

      const updatedCollection: BackendCollection = {
        ...selectedCollection,
        documents: [...selectedCollection.documents, newDocument],
        lastModified: new Date()
      };

      const updatedService: BackendService = {
        ...activeService,
        collections: activeService.collections.map(col =>
          col.id === selectedCollection.id ? updatedCollection : col
        ),
        usage: {
          ...activeService.usage,
          requests: activeService.usage.requests + 1,
          storage: activeService.usage.storage + JSON.stringify(documentData).length
        },
        lastModified: new Date()
      };

      onServiceChange(updatedService);
      setSelectedCollection(updatedCollection);
      setNewDocumentData('{}');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add document');
    } finally {
      setIsConnecting(false);
    }
  }, [activeService, selectedCollection, newDocumentData, onServiceChange]);

  // Delete document
  const deleteDocument = useCallback(async (document: BackendDocument) => {
    if (!activeService || !selectedCollection) return;

    const shouldDelete = window.confirm('Delete this document?');
    if (!shouldDelete) return;

    setIsConnecting(true);

    try {
      // Simulate document deletion
      await new Promise(resolve => setTimeout(resolve, 300));

      const updatedCollection: BackendCollection = {
        ...selectedCollection,
        documents: selectedCollection.documents.filter(doc => doc.id !== document.id),
        lastModified: new Date()
      };

      const updatedService: BackendService = {
        ...activeService,
        collections: activeService.collections.map(col =>
          col.id === selectedCollection.id ? updatedCollection : col
        ),
        usage: {
          ...activeService.usage,
          requests: activeService.usage.requests + 1
        },
        lastModified: new Date()
      };

      onServiceChange(updatedService);
      setSelectedCollection(updatedCollection);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setIsConnecting(false);
    }
  }, [activeService, selectedCollection, onServiceChange]);

  // Generate API code examples
  const generateCodeExample = useCallback((service: BackendService, collection?: BackendCollection) => {
    const baseUrl = service.endpoint;
    const collectionPath = collection ? `/${collection.name}` : '/data';

    switch (service.type) {
      case 'jsonstore':
        return `// JSONStore.io Example
const baseUrl = '${baseUrl}';

// Create/Update data
const response = await fetch(baseUrl + '${collectionPath}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});

// Read data
const data = await fetch(baseUrl + '${collectionPath}').then(r => r.json());

// Delete data
await fetch(baseUrl + '${collectionPath}', { method: 'DELETE' });`;

      case 'firebase':
        return `// Firebase Firestore Example
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Add document
const docRef = await addDoc(collection(db, '${collection?.name || 'data'}'), {
  key: 'value'
});

// Get documents
const querySnapshot = await getDocs(collection(db, '${collection?.name || 'data'}'));
querySnapshot.forEach((doc) => {
  console.log(doc.id, doc.data());
});`;

      case 'supabase':
        return `// Supabase Example
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('${baseUrl}', '${service.apiKey}');

// Insert data
const { data, error } = await supabase
  .from('${collection?.name || 'data'}')
  .insert({ key: 'value' });

// Select data
const { data, error } = await supabase
  .from('${collection?.name || 'data'}')
  .select('*');`;

      default:
        return `// Custom API Example
const baseUrl = '${baseUrl}';
const headers = ${service.apiKey ? `{ 'Authorization': 'Bearer ${service.apiKey}' }` : '{}'};

// POST request
const response = await fetch(baseUrl + '${collectionPath}', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});

// GET request
const data = await fetch(baseUrl + '${collectionPath}', { headers }).then(r => r.json());`;
    }
  }, []);

  return (
    <div className="backend-integration">
      {/* Header */}
      <div className="integration-header">
        <div className="integration-title">
          <h3>Backend Integration</h3>
          <div className="integration-info">
            {services.length} service{services.length !== 1 ? 's' : ''} • 
            {activeService ? `Connected to ${activeService.name}` : 'No active service'}
          </div>
        </div>
        
        <div className="integration-actions">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSetup(true)}
            title="Add New Service"
          >
            ➕ Add Service
          </Button>
        </div>
      </div>

      <div className="integration-content">
        {/* Service Setup Modal */}
        {showSetup && (
          <div className="setup-modal">
            <div className="setup-content">
              <div className="setup-header">
                <h4>Add Backend Service</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSetup(false)}
                >
                  ✕
                </Button>
              </div>

              {/* Provider Selection */}
              <div className="provider-selection">
                <h5>Choose Provider</h5>
                <div className="providers-list">
                  {SERVICE_PROVIDERS.map(provider => (
                    <button
                      key={provider.type}
                      className={`provider-option ${selectedProvider.type === provider.type ? 'active' : ''}`}
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <div className="provider-icon">{provider.icon}</div>
                      <div className="provider-details">
                        <div className="provider-name">{provider.name}</div>
                        <div className="provider-description">{provider.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Setup Form */}
              <div className="setup-form">
                <h5>Configuration</h5>
                
                <div className="form-group">
                  <label>Service Name</label>
                  <input
                    type="text"
                    value={setupData.name}
                    onChange={(e) => setSetupData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Backend Service"
                    className="form-input"
                  />
                </div>

                {selectedProvider.type !== 'jsonstore' && (
                  <>
                    <div className="form-group">
                      <label>Endpoint URL</label>
                      <input
                        type="url"
                        value={setupData.endpoint}
                        onChange={(e) => setSetupData(prev => ({ ...prev, endpoint: e.target.value }))}
                        placeholder="https://api.example.com"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>API Key (optional)</label>
                      <input
                        type="password"
                        value={setupData.apiKey}
                        onChange={(e) => setSetupData(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Your API key"
                        className="form-input"
                      />
                    </div>
                  </>
                )}

                {/* Setup Steps */}
                <div className="setup-steps">
                  <h6>Setup Steps:</h6>
                  <ol>
                    {selectedProvider.setupSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="setup-actions">
                  <Button
                    variant="ghost"
                    onClick={() => setShowSetup(false)}
                    disabled={isConnecting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={createService}
                    disabled={isConnecting || !setupData.name.trim()}
                  >
                    {isConnecting ? '⏳ Creating...' : 'Create Service'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {services.length === 0 ? (
          <div className="no-services">
            <div className="no-services-content">
              <h3>No Backend Services</h3>
              <p>Add a backend service to start storing and managing your data.</p>
              
              <div className="features-preview">
                <div className="feature-item">
                  <span className="feature-icon">📦</span>
                  <span>JSON data storage</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔄</span>
                  <span>Real-time synchronization</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔐</span>
                  <span>Authentication & security</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Usage analytics</span>
                </div>
              </div>
              
              <Button variant="primary" onClick={() => setShowSetup(true)}>
                Add Your First Service
              </Button>
            </div>
          </div>
        ) : (
          <div className="services-dashboard">
            {/* Service Selector */}
            <div className="service-selector">
              <h4>Services</h4>
              <div className="services-list">
                {services.map(service => (
                  <button
                    key={service.id}
                    className={`service-item ${activeService?.id === service.id ? 'active' : ''}`}
                    onClick={() => setActiveService(service)}
                  >
                    <div className="service-icon">
                      {SERVICE_PROVIDERS.find(p => p.type === service.type)?.icon || '🔧'}
                    </div>
                    <div className="service-info">
                      <div className="service-name">{service.name}</div>
                      <div className="service-type">{service.type}</div>
                      <div className={`service-status ${service.isConnected ? 'connected' : 'disconnected'}`}>
                        {service.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Service Details */}
            {activeService && (
              <div className="service-details">
                {/* Service Header */}
                <div className="service-header">
                  <div className="service-title">
                    <h4>{activeService.name}</h4>
                    <div className="service-meta">
                      {activeService.type} • {activeService.collections.length} collections
                    </div>
                  </div>
                  
                  <div className="service-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testConnection(activeService)}
                      disabled={isConnecting}
                      title="Test Connection"
                    >
                      {isConnecting ? '⏳' : '🔄'} Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => createCollection(activeService)}
                      disabled={isConnecting}
                      title="Create Collection"
                    >
                      ➕ Collection
                    </Button>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="usage-stats">
                  <div className="stat-item">
                    <span className="stat-label">Requests</span>
                    <span className="stat-value">{activeService.usage.requests}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Storage</span>
                    <span className="stat-value">{(activeService.usage.storage / 1024).toFixed(1)}KB</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Sync</span>
                    <span className="stat-value">{activeService.lastSync.toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Collections */}
                <div className="collections-section">
                  <h5>Collections</h5>
                  
                  {activeService.collections.length === 0 ? (
                    <div className="no-collections">
                      <p>No collections yet. Create your first collection to start storing data.</p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => createCollection(activeService)}
                        disabled={isConnecting}
                      >
                        Create Collection
                      </Button>
                    </div>
                  ) : (
                    <div className="collections-list">
                      {activeService.collections.map(collection => (
                        <div
                          key={collection.id}
                          className={`collection-item ${selectedCollection?.id === collection.id ? 'active' : ''}`}
                          onClick={() => setSelectedCollection(collection)}
                        >
                          <div className="collection-info">
                            <div className="collection-name">{collection.name}</div>
                            <div className="collection-stats">
                              {collection.documents.length} documents
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Collection Details */}
                {selectedCollection && (
                  <div className="collection-details">
                    <div className="collection-header">
                      <h5>{selectedCollection.name} Collection</h5>
                      <div className="collection-meta">
                        {selectedCollection.documents.length} documents
                      </div>
                    </div>

                    {/* Add Document */}
                    <div className="add-document">
                      <h6>Add Document</h6>
                      <textarea
                        value={newDocumentData}
                        onChange={(e) => setNewDocumentData(e.target.value)}
                        placeholder='{"key": "value"}'
                        className="document-input"
                        rows={4}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={addDocument}
                        disabled={isConnecting}
                      >
                        {isConnecting ? '⏳ Adding...' : '➕ Add Document'}
                      </Button>
                    </div>

                    {/* Documents List */}
                    <div className="documents-section">
                      <h6>Documents</h6>
                      
                      {selectedCollection.documents.length === 0 ? (
                        <div className="no-documents">
                          <p>No documents in this collection.</p>
                        </div>
                      ) : (
                        <div className="documents-list">
                          {selectedCollection.documents.map(document => (
                            <div key={document.id} className="document-item">
                              <div className="document-header">
                                <div className="document-id">{document.id}</div>
                                <div className="document-actions">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteDocument(document)}
                                    disabled={isConnecting}
                                    title="Delete Document"
                                  >
                                    🗑️
                                  </Button>
                                </div>
                              </div>
                              <div className="document-data">
                                <pre>{JSON.stringify(document.data, null, 2)}</pre>
                              </div>
                              <div className="document-meta">
                                Created: {document.created.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Code Example */}
                    <div className="code-example">
                      <h6>Code Example</h6>
                      <pre className="code-block">
                        {generateCodeExample(activeService, selectedCollection)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="error-toast">
          <p>{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
          >
            ✕
          </Button>
        </div>
      )}

      <style>{`
        .backend-integration {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
        }

        .integration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
        }

        .integration-title h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .integration-info {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        .integration-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .integration-content {
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .setup-modal {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .setup-content {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
        }

        .setup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .setup-header h4 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .provider-selection,
        .setup-form {
          margin-bottom: var(--spacing-lg);
        }

        .provider-selection h5,
        .setup-form h5 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .providers-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .provider-option {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .provider-option:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-primary);
        }

        .provider-option.active {
          background: var(--color-primary-subtle);
          border-color: var(--color-primary);
        }

        .provider-icon {
          font-size: var(--font-size-xl);
          min-width: 40px;
        }

        .provider-details {
          flex: 1;
        }

        .provider-name {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .provider-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: 1.4;
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-group label {
          display: block;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xs);
          font-weight: var(--font-weight-medium);
        }

        .form-input {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface-elevated);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .setup-steps {
          background: var(--color-surface-elevated);
          padding: var(--spacing-md);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-md);
        }

        .setup-steps h6 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .setup-steps ol {
          margin: 0;
          padding-left: var(--spacing-lg);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .setup-steps li {
          margin-bottom: var(--spacing-xs);
        }

        .setup-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-sm);
        }

        .no-services {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
        }

        .no-services-content {
          text-align: center;
          max-width: 400px;
        }

        .no-services-content h3 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--color-text-primary);
        }

        .no-services-content p {
          margin: 0 0 var(--spacing-lg) 0;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        .features-preview {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .feature-icon {
          font-size: var(--font-size-md);
        }

        .services-dashboard {
          display: flex;
          height: 100%;
        }

        .service-selector {
          width: 280px;
          background: var(--color-surface-elevated);
          border-right: 1px solid var(--color-border);
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .service-selector h4 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .services-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .service-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .service-item:hover {
          background: var(--color-surface-hover);
        }

        .service-item.active {
          background: var(--color-primary-subtle);
          border-color: var(--color-primary);
        }

        .service-icon {
          font-size: var(--font-size-lg);
          min-width: 32px;
        }

        .service-info {
          flex: 1;
        }

        .service-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .service-type {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          margin-bottom: var(--spacing-xs);
        }

        .service-status {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
        }

        .service-status.connected {
          color: var(--color-success);
        }

        .service-status.disconnected {
          color: var(--color-error);
        }

        .service-details {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-lg);
        }

        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-lg);
        }

        .service-title h4 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .service-meta {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .service-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .usage-stats {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-radius: var(--radius-md);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          text-align: center;
        }

        .stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }

        .stat-value {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .collections-section,
        .collection-details {
          margin-bottom: var(--spacing-lg);
        }

        .collections-section h5,
        .collection-details h5,
        .collection-details h6 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .collection-details h6 {
          font-size: var(--font-size-sm);
        }

        .no-collections {
          text-align: center;
          padding: var(--spacing-lg);
          color: var(--color-text-secondary);
        }

        .no-collections p {
          margin: 0 0 var(--spacing-md) 0;
        }

        .collections-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .collection-item {
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .collection-item:hover {
          background: var(--color-surface-hover);
        }

        .collection-item.active {
          background: var(--color-primary-subtle);
          border-color: var(--color-primary);
        }

        .collection-name {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .collection-stats {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .collection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .collection-meta {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .add-document {
          margin-bottom: var(--spacing-lg);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-radius: var(--radius-md);
        }

        .document-input {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-family: monospace;
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-md);
          resize: vertical;
        }

        .document-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .documents-section {
          margin-bottom: var(--spacing-lg);
        }

        .no-documents {
          text-align: center;
          padding: var(--spacing-md);
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .no-documents p {
          margin: 0;
        }

        .documents-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .document-item {
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .document-id {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          font-family: monospace;
        }

        .document-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .document-data {
          margin-bottom: var(--spacing-sm);
        }

        .document-data pre {
          margin: 0;
          padding: var(--spacing-sm);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          color: var(--color-text-primary);
          overflow-x: auto;
        }

        .document-meta {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .code-example {
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-radius: var(--radius-md);
        }

        .code-block {
          margin: 0;
          padding: var(--spacing-md);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: var(--font-size-xs);
          color: var(--color-text-primary);
          overflow-x: auto;
          white-space: pre-wrap;
        }

        .error-toast {
          position: fixed;
          bottom: var(--spacing-lg);
          right: var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--color-error);
          color: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
        }

        .error-toast p {
          margin: 0;
          font-size: var(--font-size-sm);
        }

        @media (max-width: 1024px) {
          .services-dashboard {
            flex-direction: column;
          }

          .service-selector {
            width: 100%;
            height: 200px;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }

          .features-preview {
            grid-template-columns: 1fr;
          }

          .usage-stats {
            flex-direction: column;
            gap: var(--spacing-md);
          }
        }

        @media (max-width: 768px) {
          .integration-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .integration-actions {
            justify-content: center;
          }

          .setup-content {
            margin: var(--spacing-md);
            max-width: none;
          }

          .service-header {
            flex-direction: column;
            gap: var(--spacing-md);
            align-items: stretch;
          }

          .service-actions {
            justify-content: center;
          }

          .setup-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};