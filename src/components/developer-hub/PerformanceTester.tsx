import React, { useState, useCallback, useEffect } from 'react';
import { PerformanceTest, PerformanceTestProvider, PerformanceTestResult, DeveloperPreferences } from '@/types/developer-hub';
import Button from '@/components/ui/Button';

interface PerformanceTesterProps {
  tests: PerformanceTest[];
  preferences: DeveloperPreferences['performance'];
  onTestChange: (test: PerformanceTest) => void;
  onTestCreate: (test: PerformanceTest) => void;
}

interface TestProvider {
  id: PerformanceTestProvider;
  name: string;
  description: string;
  icon: string;
  features: string[];
  locations: string[];
  devices: string[];
  connections: string[];
}

const TEST_PROVIDERS: TestProvider[] = [
  {
    id: PerformanceTestProvider.GTMETRIX,
    name: 'GTmetrix',
    description: 'Comprehensive performance analysis with detailed recommendations',
    icon: '📊',
    features: ['PageSpeed Insights', 'YSlow Analysis', 'Waterfall Chart', 'Video Playback'],
    locations: ['Vancouver', 'Dallas', 'London', 'Sydney', 'Mumbai'],
    devices: ['Desktop', 'Mobile'],
    connections: ['Cable', 'DSL', '3G', '4G']
  },
  {
    id: PerformanceTestProvider.PINGDOM,
    name: 'Pingdom',
    description: 'Fast and reliable website speed testing',
    icon: '⚡',
    features: ['Load Time Analysis', 'Performance Grade', 'Request Analysis', 'History Tracking'],
    locations: ['New York', 'San Francisco', 'Stockholm', 'London', 'Tokyo'],
    devices: ['Desktop', 'Mobile'],
    connections: ['Broadband', 'Mobile']
  },
  {
    id: PerformanceTestProvider.PAGESPEED,
    name: 'PageSpeed Insights',
    description: 'Google\'s official performance testing tool',
    icon: '🚀',
    features: ['Core Web Vitals', 'Lighthouse Audit', 'Field Data', 'Lab Data'],
    locations: ['Global'],
    devices: ['Desktop', 'Mobile'],
    connections: ['4G', 'Cable']
  },
  {
    id: PerformanceTestProvider.WEBPAGETEST,
    name: 'WebPageTest',
    description: 'Advanced performance testing with detailed metrics',
    icon: '🔬',
    features: ['Multi-step Tests', 'Video Capture', 'Connection Simulation', 'Advanced Metrics'],
    locations: ['Virginia', 'California', 'Ireland', 'Singapore', 'Australia'],
    devices: ['Desktop', 'Mobile', 'Tablet'],
    connections: ['Cable', 'DSL', '3G', '4G', '5G']
  }
];

export const PerformanceTester: React.FC<PerformanceTesterProps> = ({
  tests,
  preferences,
  onTestChange,
  onTestCreate
}) => {
  const [selectedProvider, setSelectedProvider] = useState<TestProvider>(
    TEST_PROVIDERS.find(p => p.id === preferences.defaultProvider) || TEST_PROVIDERS[0]
  );
  const [testUrl, setTestUrl] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(preferences.defaultLocation);
  const [selectedDevice, setSelectedDevice] = useState(preferences.defaultDevice);
  const [selectedConnection, setSelectedConnection] = useState(preferences.defaultConnection);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update location/device/connection when provider changes
  useEffect(() => {
    if (!selectedProvider.locations.includes(selectedLocation)) {
      setSelectedLocation(selectedProvider.locations[0]);
    }
    if (!selectedProvider.devices.includes(selectedDevice)) {
      setSelectedDevice(selectedProvider.devices[0]);
    }
    if (!selectedProvider.connections.includes(selectedConnection)) {
      setSelectedConnection(selectedProvider.connections[0]);
    }
  }, [selectedProvider, selectedLocation, selectedDevice, selectedConnection]);

  // Simulate performance test
  const simulatePerformanceTest = useCallback(async (
    url: string,
    provider: TestProvider,
    location: string,
    device: string,
    connection: string
  ): Promise<PerformanceTestResult> => {
    // Simulate different performance based on connection type
    const connectionMultiplier = {
      'Cable': 1,
      'Broadband': 1,
      'DSL': 1.5,
      '4G': 2,
      '5G': 0.8,
      '3G': 3,
      'Mobile': 2.5
    }[connection] || 1;

    const deviceMultiplier = device === 'Mobile' ? 1.3 : device === 'Tablet' ? 1.1 : 1;
    const baseLoadTime = 1200 * connectionMultiplier * deviceMultiplier;

    const result: PerformanceTestResult = {
      score: Math.max(20, Math.min(100, Math.floor(100 - (baseLoadTime - 800) / 50))),
      grades: {
        performance: baseLoadTime < 1000 ? 'A' : baseLoadTime < 2000 ? 'B' : baseLoadTime < 3000 ? 'C' : 'D',
        structure: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        lcp: baseLoadTime < 2500 ? 'Good' : baseLoadTime < 4000 ? 'Needs Improvement' : 'Poor',
        cls: Math.random() < 0.7 ? 'Good' : 'Needs Improvement',
        fid: Math.random() < 0.8 ? 'Good' : 'Needs Improvement'
      },
      metrics: {
        loadTime: Math.floor(baseLoadTime),
        firstByte: Math.floor(baseLoadTime * 0.1),
        startRender: Math.floor(baseLoadTime * 0.3),
        domInteractive: Math.floor(baseLoadTime * 0.6),
        domComplete: Math.floor(baseLoadTime * 0.9),
        onLoad: Math.floor(baseLoadTime),
        fullyLoaded: Math.floor(baseLoadTime * 1.1),
        requests: Math.floor(20 + Math.random() * 30),
        bytesIn: Math.floor(1000000 + Math.random() * 2000000),
        bytesOut: Math.floor(50000 + Math.random() * 100000)
      },
      opportunities: [
        {
          id: 'optimize-images',
          title: 'Optimize Images',
          description: 'Properly size images to save cellular data and improve load time',
          impact: 'high',
          savings: Math.floor(200 + Math.random() * 500),
          unit: 'ms',
          details: [
            'Serve images in next-gen formats like WebP',
            'Properly size images for different screen sizes',
            'Use lazy loading for off-screen images'
          ]
        },
        {
          id: 'minify-css',
          title: 'Minify CSS',
          description: 'Minifying CSS files can reduce network payload sizes',
          impact: 'medium',
          savings: Math.floor(50 + Math.random() * 150),
          unit: 'ms',
          details: [
            'Remove unused CSS rules',
            'Minify CSS files',
            'Combine multiple CSS files'
          ]
        },
        {
          id: 'enable-compression',
          title: 'Enable Text Compression',
          description: 'Text-based resources should be served with compression',
          impact: 'high',
          savings: Math.floor(300 + Math.random() * 400),
          unit: 'ms',
          details: [
            'Enable gzip compression',
            'Use Brotli compression for better results',
            'Compress all text-based assets'
          ]
        }
      ],
      diagnostics: [
        {
          id: 'largest-contentful-paint',
          title: 'Largest Contentful Paint',
          description: 'Largest Contentful Paint marks the time at which the largest text or image is painted',
          severity: baseLoadTime < 2500 ? 'info' : 'warning',
          value: Math.floor(baseLoadTime * 0.8),
          unit: 'ms',
          details: [
            'Optimize loading of above-the-fold content',
            'Improve server response times',
            'Eliminate render-blocking resources'
          ]
        },
        {
          id: 'cumulative-layout-shift',
          title: 'Cumulative Layout Shift',
          description: 'Cumulative Layout Shift measures the movement of visible elements within the viewport',
          severity: Math.random() < 0.7 ? 'info' : 'warning',
          value: Math.floor(Math.random() * 30) / 100,
          unit: '',
          details: [
            'Include size attributes on images and video elements',
            'Reserve space for ad slots',
            'Avoid inserting content above existing content'
          ]
        }
      ],
      screenshots: [
        {
          timestamp: 0,
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjAlPC90ZXh0Pjwvc3ZnPg==',
          progress: 0
        },
        {
          timestamp: Math.floor(baseLoadTime * 0.3),
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjMwJTwvdGV4dD48L3N2Zz4=',
          progress: 30
        },
        {
          timestamp: Math.floor(baseLoadTime * 0.8),
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmOWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjgwJTwvdGV4dD48L3N2Zz4=',
          progress: 80
        },
        {
          timestamp: Math.floor(baseLoadTime),
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPjEwMCU8L3RleHQ+PC9zdmc+',
          progress: 100
        }
      ],
      waterfall: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldhdGVyZmFsbCBDaGFydDwvdGV4dD48L3N2Zz4=`
    };

    return result;
  }, []);

  const runPerformanceTest = useCallback(async () => {
    if (!testUrl.trim()) {
      alert('Please enter a URL to test');
      return;
    }

    setIsRunningTest(true);

    try {
      const test: PerformanceTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: 'current-project',
        url: testUrl,
        provider: selectedProvider.id,
        status: 'running',
        startTime: new Date(),
        location: selectedLocation,
        device: selectedDevice,
        connection: selectedConnection,
        created: new Date(),
        lastModified: new Date()
      };

      onTestCreate(test);

      // Simulate test duration
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

      const results = await simulatePerformanceTest(
        testUrl,
        selectedProvider,
        selectedLocation,
        selectedDevice,
        selectedConnection
      );

      const completedTest: PerformanceTest = {
        ...test,
        status: 'completed',
        endTime: new Date(),
        results,
        lastModified: new Date()
      };

      onTestChange(completedTest);

    } catch (error) {
      const failedTest: PerformanceTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: 'current-project',
        url: testUrl,
        provider: selectedProvider.id,
        status: 'failed',
        startTime: new Date(),
        endTime: new Date(),
        location: selectedLocation,
        device: selectedDevice,
        connection: selectedConnection,
        error: error instanceof Error ? error.message : 'Test failed',
        created: new Date(),
        lastModified: new Date()
      };

      onTestChange(failedTest);
    } finally {
      setIsRunningTest(false);
    }
  }, [testUrl, selectedProvider, selectedLocation, selectedDevice, selectedConnection, onTestCreate, onTestChange, simulatePerformanceTest]);

  const rerunTest = useCallback((test: PerformanceTest) => {
    setTestUrl(test.url);
    setSelectedProvider(TEST_PROVIDERS.find(p => p.id === test.provider) || TEST_PROVIDERS[0]);
    setSelectedLocation(test.location);
    setSelectedDevice(test.device);
    setSelectedConnection(test.connection);
    runPerformanceTest();
  }, [runPerformanceTest]);

  const clearTests = useCallback(() => {
    // This would typically call a parent function to clear tests
    console.log('Clear tests');
  }, []);

  const recentTests = tests.slice(-5);
  const averageScore = tests.length > 0 
    ? tests.reduce((sum, test) => sum + (test.results?.score || 0), 0) / tests.length 
    : 0;

  return (
    <div className="performance-tester">
      {/* Header */}
      <div className="tester-header">
        <div className="tester-title">
          <h3>Performance Tester</h3>
          <div className="tester-stats">
            {tests.length} tests • {averageScore.toFixed(0)} avg score
          </div>
        </div>
        
        <div className="tester-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title="Toggle Advanced Settings"
          >
            ⚙️ {showAdvanced ? 'Simple' : 'Advanced'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTests}
            disabled={tests.length === 0}
            title="Clear History"
          >
            🗑️ Clear
          </Button>
        </div>
      </div>

      <div className="tester-content">
        {/* URL Input */}
        <div className="url-section">
          <h4>Website URL</h4>
          <div className="url-input-group">
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://example.com"
              className="url-input"
              disabled={isRunningTest}
            />
            <Button
              variant="primary"
              onClick={runPerformanceTest}
              disabled={isRunningTest || !testUrl.trim()}
              className="test-button"
            >
              {isRunningTest ? '⏳ Testing...' : '🚀 Run Test'}
            </Button>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="provider-section">
          <h4>Testing Provider</h4>
          <div className="providers-grid">
            {TEST_PROVIDERS.map(provider => (
              <button
                key={provider.id}
                className={`provider-card ${selectedProvider.id === provider.id ? 'active' : ''}`}
                onClick={() => setSelectedProvider(provider)}
                disabled={isRunningTest}
              >
                <div className="provider-icon">{provider.icon}</div>
                <div className="provider-info">
                  <div className="provider-name">{provider.name}</div>
                  <div className="provider-description">{provider.description}</div>
                  <div className="provider-features">
                    {provider.features.slice(0, 2).join(', ')}
                    {provider.features.length > 2 && '...'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Test Configuration */}
        <div className="config-section">
          <h4>Test Configuration</h4>
          <div className="config-grid">
            <div className="config-group">
              <label>Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="config-select"
                disabled={isRunningTest}
              >
                {selectedProvider.locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            
            <div className="config-group">
              <label>Device</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="config-select"
                disabled={isRunningTest}
              >
                {selectedProvider.devices.map(device => (
                  <option key={device} value={device}>{device}</option>
                ))}
              </select>
            </div>
            
            <div className="config-group">
              <label>Connection</label>
              <select
                value={selectedConnection}
                onChange={(e) => setSelectedConnection(e.target.value)}
                className="config-select"
                disabled={isRunningTest}
              >
                {selectedProvider.connections.map(connection => (
                  <option key={connection} value={connection}>{connection}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="advanced-section">
            <h4>Advanced Settings</h4>
            <div className="advanced-options">
              <label>
                <input type="checkbox" />
                Block ads and trackers
              </label>
              <label>
                <input type="checkbox" />
                Disable JavaScript
              </label>
              <label>
                <input type="checkbox" />
                Capture video
              </label>
              <label>
                <input type="checkbox" />
                Multiple runs (3x)
              </label>
            </div>
          </div>
        )}

        {/* Recent Tests */}
        {recentTests.length > 0 && (
          <div className="results-section">
            <h4>Recent Tests</h4>
            <div className="results-list">
              {recentTests.map(test => (
                <div key={test.id} className={`test-result ${test.status}`}>
                  <div className="result-header">
                    <div className="result-info">
                      <div className="result-url">{test.url}</div>
                      <div className="result-meta">
                        {TEST_PROVIDERS.find(p => p.id === test.provider)?.name} • 
                        {test.location} • {test.device} • {test.connection}
                      </div>
                    </div>
                    
                    <div className="result-actions">
                      {test.status === 'completed' && test.results && (
                        <div className="result-score">
                          <span className="score-value">{test.results.score}</span>
                          <span className="score-label">Score</span>
                        </div>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rerunTest(test)}
                        disabled={isRunningTest}
                        title="Rerun Test"
                      >
                        🔄
                      </Button>
                    </div>
                  </div>
                  
                  {test.status === 'running' && (
                    <div className="running-indicator">
                      <div className="loading-spinner"></div>
                      <span>Running performance test...</span>
                    </div>
                  )}
                  
                  {test.status === 'failed' && (
                    <div className="error-message">
                      Error: {test.error}
                    </div>
                  )}
                  
                  {test.results && (
                    <div className="test-details">
                      {/* Core Metrics */}
                      <div className="metrics-grid">
                        <div className="metric-item">
                          <span className="metric-label">Load Time</span>
                          <span className="metric-value">{(test.results.metrics.loadTime / 1000).toFixed(1)}s</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">First Byte</span>
                          <span className="metric-value">{test.results.metrics.firstByte}ms</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Requests</span>
                          <span className="metric-value">{test.results.metrics.requests}</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">Size</span>
                          <span className="metric-value">{(test.results.metrics.bytesIn / 1024 / 1024).toFixed(1)}MB</span>
                        </div>
                      </div>
                      
                      {/* Grades */}
                      <div className="grades-section">
                        <div className="grade-item">
                          <span className="grade-label">Performance</span>
                          <span className={`grade-value grade-${test.results.grades.performance.toLowerCase()}`}>
                            {test.results.grades.performance}
                          </span>
                        </div>
                        <div className="grade-item">
                          <span className="grade-label">LCP</span>
                          <span className={`grade-value ${test.results.grades.lcp.toLowerCase().replace(' ', '-')}`}>
                            {test.results.grades.lcp}
                          </span>
                        </div>
                        <div className="grade-item">
                          <span className="grade-label">CLS</span>
                          <span className={`grade-value ${test.results.grades.cls.toLowerCase().replace(' ', '-')}`}>
                            {test.results.grades.cls}
                          </span>
                        </div>
                      </div>
                      
                      {/* Top Opportunities */}
                      {test.results.opportunities.length > 0 && (
                        <div className="opportunities-section">
                          <h5>Top Opportunities</h5>
                          <div className="opportunities-list">
                            {test.results.opportunities.slice(0, 3).map(opportunity => (
                              <div key={opportunity.id} className="opportunity-item">
                                <div className="opportunity-header">
                                  <span className="opportunity-title">{opportunity.title}</span>
                                  <span className={`opportunity-impact ${opportunity.impact}`}>
                                    {opportunity.savings}{opportunity.unit}
                                  </span>
                                </div>
                                <div className="opportunity-description">
                                  {opportunity.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Screenshots */}
                      {test.results.screenshots.length > 0 && (
                        <div className="screenshots-section">
                          <h5>Loading Progress</h5>
                          <div className="screenshots-grid">
                            {test.results.screenshots.map((screenshot, index) => (
                              <div key={index} className="screenshot-item">
                                <img 
                                  src={screenshot.url} 
                                  alt={`${screenshot.progress}% loaded`}
                                  className="screenshot-image"
                                />
                                <div className="screenshot-label">
                                  {screenshot.timestamp}ms ({screenshot.progress}%)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .performance-tester {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
        }

        .tester-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
        }

        .tester-title h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .tester-stats {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-top: var(--spacing-xs);
        }

        .tester-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .tester-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-lg);
        }

        .url-section,
        .provider-section,
        .config-section,
        .advanced-section,
        .results-section {
          margin-bottom: var(--spacing-lg);
        }

        .url-section h4,
        .provider-section h4,
        .config-section h4,
        .advanced-section h4,
        .results-section h4 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .url-input-group {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
        }

        .url-input {
          flex: 1;
          padding: var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface-elevated);
          color: var(--color-text-primary);
          font-size: var(--font-size-md);
        }

        .url-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .url-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .test-button {
          min-width: 120px;
        }

        .providers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }

        .provider-card {
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

        .provider-card:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-primary);
        }

        .provider-card.active {
          background: var(--color-primary-subtle);
          border-color: var(--color-primary);
        }

        .provider-card:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .provider-icon {
          font-size: var(--font-size-xl);
          min-width: 40px;
        }

        .provider-info {
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
          margin-bottom: var(--spacing-xs);
          line-height: 1.4;
        }

        .provider-features {
          font-size: var(--font-size-xs);
          color: var(--color-primary);
          font-weight: var(--font-weight-medium);
        }

        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .config-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .config-group label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .config-select {
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface-elevated);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .config-select:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .config-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .advanced-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md);
        }

        .advanced-options label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          cursor: pointer;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .test-result {
          padding: var(--spacing-lg);
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .test-result.completed {
          border-left: 4px solid var(--color-success);
        }

        .test-result.failed {
          border-left: 4px solid var(--color-error);
        }

        .test-result.running {
          border-left: 4px solid var(--color-warning);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-md);
        }

        .result-info {
          flex: 1;
        }

        .result-url {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
          word-break: break-all;
        }

        .result-meta {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .result-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .result-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .score-value {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-success);
        }

        .score-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }

        .running-indicator {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          color: var(--color-text-secondary);
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--color-border);
          border-top: 2px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          color: var(--color-error);
          font-size: var(--font-size-sm);
        }

        .test-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-md);
        }

        .metric-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          text-align: center;
        }

        .metric-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }

        .metric-value {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .grades-section {
          display: flex;
          gap: var(--spacing-lg);
        }

        .grade-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          text-align: center;
        }

        .grade-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }

        .grade-value {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
        }

        .grade-value.grade-a,
        .grade-value.good {
          background: var(--color-success-subtle);
          color: var(--color-success);
        }

        .grade-value.grade-b,
        .grade-value.needs-improvement {
          background: var(--color-warning-subtle);
          color: var(--color-warning);
        }

        .grade-value.grade-c,
        .grade-value.grade-d,
        .grade-value.poor {
          background: var(--color-error-subtle);
          color: var(--color-error);
        }

        .opportunities-section h5,
        .screenshots-section h5 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
        }

        .opportunities-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .opportunity-item {
          padding: var(--spacing-sm);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }

        .opportunity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }

        .opportunity-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .opportunity-impact {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          padding: var(--spacing-xs);
          border-radius: var(--radius-sm);
        }

        .opportunity-impact.high {
          background: var(--color-error-subtle);
          color: var(--color-error);
        }

        .opportunity-impact.medium {
          background: var(--color-warning-subtle);
          color: var(--color-warning);
        }

        .opportunity-impact.low {
          background: var(--color-success-subtle);
          color: var(--color-success);
        }

        .opportunity-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .screenshots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-md);
        }

        .screenshot-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          text-align: center;
        }

        .screenshot-image {
          width: 100%;
          height: 80px;
          object-fit: cover;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }

        .screenshot-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        @media (max-width: 1024px) {
          .providers-grid {
            grid-template-columns: 1fr;
          }

          .config-grid {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .grades-section {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .screenshots-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .tester-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .tester-actions {
            justify-content: center;
          }

          .tester-content {
            padding: var(--spacing-md);
          }

          .url-input-group {
            flex-direction: column;
            align-items: stretch;
          }

          .result-header {
            flex-direction: column;
            gap: var(--spacing-md);
            align-items: stretch;
          }

          .result-actions {
            justify-content: space-between;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .screenshots-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};