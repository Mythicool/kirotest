import React, { useState, useEffect } from 'react';
import { ServiceErrorHandler, ServiceError } from '@/services/ServiceErrorHandler';
import { DataIntegrityManager } from '@/services/DataIntegrityManager';
import { NotificationSystem } from '@/services/NotificationSystem';
import { OfflineCapabilities } from '@/services/OfflineCapabilities';
import { AutomaticRecovery } from '@/services/AutomaticRecovery';
import { ProgressiveEnhancement } from '@/services/ProgressiveEnhancement';
import { Button } from '@/components/ui/Button';

interface SystemStatus {
  isOnline: boolean;
  serviceHealth: Record<string, string>;
  activeFeatures: string[];
  pendingOperations: number;
  errorHistory: ServiceError[];
}

export const ErrorHandlingDemo: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isOnline: navigator.onLine,
    serviceHealth: {},
    activeFeatures: [],
    pendingOperations: 0,
    errorHistory: []
  });

  const [services] = useState(() => {
    const serviceErrorHandler = new ServiceErrorHandler();
    const dataIntegrityManager = new DataIntegrityManager();
    const notificationSystem = new NotificationSystem();
    const offlineCapabilities = new OfflineCapabilities();
    const progressiveEnhancement = new ProgressiveEnhancement();
    
    const automaticRecovery = new AutomaticRecovery(
      serviceErrorHandler,
      dataIntegrityManager,
      notificationSystem,
      offlineCapabilities
    );

    return {
      serviceErrorHandler,
      dataIntegrityManager,
      notificationSystem,
      offlineCapabilities,
      automaticRecovery,
      progressiveEnhancement
    };
  });

  useEffect(() => {
    // Initialize progressive enhancement
    services.progressiveEnhancement.initializeAllFeatures();

    // Set up status updates
    const updateStatus = () => {
      setSystemStatus({
        isOnline: navigator.onLine,
        serviceHealth: services.automaticRecovery.getServiceHealth(),
        activeFeatures: services.progressiveEnhancement.getActiveFeatures(),
        pendingOperations: services.offlineCapabilities.getSyncStatus().pendingOperations,
        errorHistory: services.serviceErrorHandler.getErrorHistory().slice(-5) // Last 5 errors
      });
    };

    // Update status periodically
    const interval = setInterval(updateStatus, 1000);
    updateStatus();

    // Listen for network changes
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      services.offlineCapabilities.destroy();
    };
  }, [services]);

  const simulateError = async (errorType: ServiceError['type'], serviceId: string) => {
    const error: ServiceError = {
      type: errorType,
      serviceId,
      message: `Simulated ${errorType.toLowerCase().replace('_', ' ')} for ${serviceId}`,
      timestamp: Date.now(),
      retryable: errorType !== 'VALIDATION_ERROR'
    };

    try {
      const result = await services.automaticRecovery.handleError(error);
      console.log('Recovery result:', result);
    } catch (err) {
      console.error('Recovery failed:', err);
    }
  };

  const testScenarios = [
    {
      name: 'Network Error',
      description: 'Simulate network connectivity issues',
      action: () => simulateError('NETWORK_ERROR', 'photopea')
    },
    {
      name: 'Service Unavailable',
      description: 'Simulate service downtime',
      action: () => simulateError('SERVICE_UNAVAILABLE', 'replit')
    },
    {
      name: 'Rate Limited',
      description: 'Simulate API rate limiting',
      action: () => simulateError('RATE_LIMITED', 'gtmetrix')
    },
    {
      name: 'Timeout Error',
      description: 'Simulate request timeout',
      action: () => simulateError('TIMEOUT', 'cloud-convert')
    },
    {
      name: 'Validation Error',
      description: 'Simulate data validation failure',
      action: () => simulateError('VALIDATION_ERROR', 'file-validator')
    }
  ];

  const createCheckpoint = async () => {
    try {
      const checkpoint = await services.dataIntegrityManager.createCheckpoint(
        'demo-workspace',
        'Manual checkpoint from demo'
      );
      services.notificationSystem.success(
        'Checkpoint Created',
        `Checkpoint ${checkpoint.id} created successfully`
      );
    } catch (error) {
      services.notificationSystem.error(
        'Checkpoint Failed',
        'Failed to create checkpoint'
      );
    }
  };

  const toggleOfflineMode = () => {
    // Simulate network toggle for demo purposes
    Object.defineProperty(navigator, 'onLine', {
      value: !navigator.onLine,
      writable: true
    });

    const event = new Event(navigator.onLine ? 'online' : 'offline');
    window.dispatchEvent(event);
  };

  const clearErrorHistory = () => {
    services.serviceErrorHandler.clearErrorHistory();
    services.automaticRecovery.clearRecoveryHistory();
    services.notificationSystem.success('History Cleared', 'Error history has been cleared');
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'recovering': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'recovering': return '🔄';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="error-handling-demo p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Error Handling System Demo</h1>
        <p className="text-gray-600">
          Comprehensive error handling, recovery, and progressive enhancement system
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Network Status</h3>
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${systemStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>{systemStatus.isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Active Features</h3>
          <div className="text-2xl font-bold text-blue-600">
            {systemStatus.activeFeatures.length}
          </div>
          <div className="text-sm text-gray-500">Enhanced features</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Pending Operations</h3>
          <div className="text-2xl font-bold text-orange-600">
            {systemStatus.pendingOperations}
          </div>
          <div className="text-sm text-gray-500">Queued for sync</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Recent Errors</h3>
          <div className="text-2xl font-bold text-red-600">
            {systemStatus.errorHistory.length}
          </div>
          <div className="text-sm text-gray-500">Last 5 errors</div>
        </div>
      </div>

      {/* Service Health */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Service Health Monitor</h2>
        {Object.keys(systemStatus.serviceHealth).length === 0 ? (
          <p className="text-gray-500">No service health data available. Trigger some errors to see health status.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(systemStatus.serviceHealth).map(([serviceId, health]) => (
              <div key={serviceId} className="flex items-center justify-between p-3 border rounded">
                <span className="font-medium">{serviceId}</span>
                <div className="flex items-center">
                  <span className="mr-2">{getHealthIcon(health)}</span>
                  <span className={`capitalize ${getHealthColor(health)}`}>{health}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Simulation */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Error Simulation</h2>
        <p className="text-gray-600 mb-4">
          Test different error scenarios to see how the system handles and recovers from failures.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testScenarios.map((scenario, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              <Button
                onClick={scenario.action}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Simulate Error
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* System Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">System Controls</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={createCheckpoint} variant="primary">
            Create Checkpoint
          </Button>
          <Button onClick={toggleOfflineMode} variant="outline">
            Toggle {systemStatus.isOnline ? 'Offline' : 'Online'} Mode
          </Button>
          <Button onClick={clearErrorHistory} variant="outline">
            Clear Error History
          </Button>
          <Button
            onClick={() => services.notificationSystem.info('Test Notification', 'This is a test notification')}
            variant="outline"
          >
            Test Notification
          </Button>
        </div>
      </div>

      {/* Active Features */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Progressive Enhancement Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemStatus.activeFeatures.map((feature) => (
            <div key={feature} className="flex items-center justify-between p-3 border rounded">
              <span className="font-medium">{feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <span className="text-green-600">✅ Active</span>
            </div>
          ))}
        </div>
        {systemStatus.activeFeatures.length === 0 && (
          <p className="text-gray-500">No enhanced features are currently active.</p>
        )}
      </div>

      {/* Recent Error History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Error History</h2>
        {systemStatus.errorHistory.length === 0 ? (
          <p className="text-gray-500">No recent errors. System is running smoothly!</p>
        ) : (
          <div className="space-y-3">
            {systemStatus.errorHistory.map((error, index) => (
              <div key={index} className="border-l-4 border-red-400 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-600">{error.type}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Service: {error.serviceId} | {error.message}
                </div>
                <div className="text-xs text-gray-500">
                  Retryable: {error.retryable ? 'Yes' : 'No'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Browser Capabilities */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Browser Capabilities</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(services.progressiveEnhancement.getCapabilities()).map(([capability, supported]) => (
            <div key={capability} className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">{capability.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
              <span className={supported ? 'text-green-600' : 'text-red-600'}>
                {supported ? '✅' : '❌'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ErrorHandlingDemo;