import React, { useState, useEffect, useCallback } from 'react';
import { PerformanceOptimizationManager, PerformanceReport } from '../../services/PerformanceOptimizationManager';
import { PerformanceTest } from '../../services/PerformanceTester';
import { LoadableResource } from '../../services/LazyLoader';

interface PerformanceOptimizationDemoProps {
  className?: string;
}

export const PerformanceOptimizationDemo: React.FC<PerformanceOptimizationDemoProps> = ({
  className = ''
}) => {
  const [optimizationManager] = useState(() => new PerformanceOptimizationManager({
    enableAutoOptimization: true,
    enablePerformanceAlerts: true,
    enableResourcePreloading: true,
    enableNetworkOptimization: true
  }));

  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [activeTests, setActiveTests] = useState<PerformanceTest[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to performance reports
    const unsubscribe = optimizationManager.onPerformanceReport((report) => {
      setPerformanceReport(report);
      addLog(`Performance report generated - Score: ${report.overallScore.toFixed(1)}`);
    });

    // Generate initial report
    optimizationManager.generatePerformanceReport().then(setPerformanceReport);

    return () => {
      unsubscribe();
      optimizationManager.destroy();
    };
  }, [optimizationManager]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setOptimizationLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  }, []);

  const handleOptimizeAsset = async (type: 'css' | 'js' | 'html') => {
    setIsOptimizing(true);
    addLog(`Starting ${type.toUpperCase()} optimization...`);

    try {
      const sampleContent = getSampleContent(type);
      const result = await optimizationManager.optimizeAsset(sampleContent, type);
      
      addLog(`${type.toUpperCase()} optimization completed - ${result.compressionRatio.toFixed(1)}% reduction`);
      addLog(`Original size: ${result.originalSize} bytes, Optimized: ${result.optimizedSize} bytes`);
    } catch (error) {
      addLog(`${type.toUpperCase()} optimization failed: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreatePerformanceTest = async (type: 'load' | 'stress' | 'endurance') => {
    addLog(`Creating ${type} test...`);

    try {
      const test = optimizationManager.createPerformanceTest(type, {
        duration: type === 'endurance' ? 60000 : 30000, // Shorter for demo
        concurrency: type === 'stress' ? 50 : 10,
        targetUrl: window.location.origin
      });

      setActiveTests(prev => [...prev, test]);
      addLog(`${type} test created with ID: ${test.id}`);
    } catch (error) {
      addLog(`Failed to create ${type} test: ${error.message}`);
    }
  };

  const handleRunTest = async (testId: string) => {
    addLog(`Starting test ${testId}...`);

    try {
      await optimizationManager.runPerformanceTest(testId);
      addLog(`Test ${testId} completed successfully`);
    } catch (error) {
      addLog(`Test ${testId} failed: ${error.message}`);
    }
  };

  const handleRegisterResource = () => {
    const resource: LoadableResource = {
      id: `resource-${Date.now()}`,
      type: 'component',
      loader: () => Promise.resolve({ name: 'Sample Component' }),
      priority: 'medium',
      preloadConditions: [
        { type: 'idle' },
        { type: 'viewport' }
      ]
    };

    optimizationManager.registerResource(resource);
    addLog(`Registered resource: ${resource.id}`);
  };

  const handlePreloadResources = () => {
    addLog('Preloading critical resources...');
    // This would trigger preloading of registered resources
    // In a real app, you'd have actual resources registered
    setTimeout(() => {
      addLog('Critical resources preloaded');
    }, 1000);
  };

  const getSampleContent = (type: 'css' | 'js' | 'html'): string => {
    switch (type) {
      case 'css':
        return `
          /* Sample CSS for optimization */
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            margin: 10px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }
          
          .button:hover {
            background-color: #0056b3;
          }
        `;
      case 'js':
        return `
          // Sample JavaScript for optimization
          function calculateSum(numbers) {
            let sum = 0;
            for (let i = 0; i < numbers.length; i++) {
              sum += numbers[i];
            }
            return sum;
          }
          
          function processData(data) {
            const processed = data.map(item => ({
              id: item.id,
              name: item.name.toUpperCase(),
              value: item.value * 2
            }));
            return processed;
          }
          
          const API_ENDPOINT = 'https://api.example.com/data';
          const MAX_RETRIES = 3;
          const TIMEOUT_MS = 5000;
        `;
      case 'html':
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sample Page</title>
          </head>
          <body>
            <!-- Sample HTML for optimization -->
            <div class="container">
              <h1>Welcome to Our Application</h1>
              <p>This is a sample page for performance optimization testing.</p>
              <img src="/images/hero.jpg" alt="Hero Image" width="800" height="400">
              <button class="button">Get Started</button>
            </div>
          </body>
          </html>
        `;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricColor = (value: number, threshold: number, inverse = false): string => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`performance-optimization-demo ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Performance Optimization System
        </h2>

        {/* Performance Report */}
        {performanceReport && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Overall Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(performanceReport.overallScore)}`}>
                  {performanceReport.overallScore.toFixed(1)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Load Time</div>
                <div className={`text-lg font-semibold ${getMetricColor(performanceReport.metrics.loadTime, 3000, true)}`}>
                  {performanceReport.metrics.loadTime.toFixed(0)}ms
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Memory Usage</div>
                <div className={`text-lg font-semibold ${getMetricColor(performanceReport.metrics.memoryUsage, 80, true)}`}>
                  {performanceReport.metrics.memoryUsage.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Cache Hit Rate</div>
                <div className={`text-lg font-semibold ${getMetricColor(performanceReport.metrics.cacheHitRate, 70)}`}>
                  {performanceReport.metrics.cacheHitRate.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Network Efficiency</div>
                <div className={`text-lg font-semibold ${getMetricColor(performanceReport.metrics.networkEfficiency, 70)}`}>
                  {performanceReport.metrics.networkEfficiency.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Resource Optimization</div>
                <div className={`text-lg font-semibold ${getMetricColor(performanceReport.metrics.resourceOptimization, 70)}`}>
                  {performanceReport.metrics.resourceOptimization.toFixed(1)}%
                </div>
              </div>
            </div>

            {performanceReport.recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Recommendations</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {performanceReport.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Optimization Controls */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Resource Optimization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleOptimizeAsset('css')}
              disabled={isOptimizing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Optimize CSS
            </button>
            <button
              onClick={() => handleOptimizeAsset('js')}
              disabled={isOptimizing}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Optimize JS
            </button>
            <button
              onClick={() => handleOptimizeAsset('html')}
              disabled={isOptimizing}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Optimize HTML
            </button>
            <button
              onClick={handlePreloadResources}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Preload Resources
            </button>
          </div>
        </div>

        {/* Performance Testing */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance Testing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => handleCreatePerformanceTest('load')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Load Test
            </button>
            <button
              onClick={() => handleCreatePerformanceTest('stress')}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Stress Test
            </button>
            <button
              onClick={() => handleCreatePerformanceTest('endurance')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Endurance Test
            </button>
          </div>

          {activeTests.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Active Tests</h4>
              <div className="space-y-2">
                {activeTests.map(test => (
                  <div key={test.id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div>
                      <span className="font-medium">{test.name}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        test.status === 'completed' ? 'bg-green-100 text-green-800' :
                        test.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        test.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    {test.status === 'pending' && (
                      <button
                        onClick={() => handleRunTest(test.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm rounded transition-colors"
                      >
                        Run Test
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resource Management */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Resource Management</h3>
          <button
            onClick={handleRegisterResource}
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Register Sample Resource
          </button>
        </div>

        {/* Optimization Logs */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Optimization Logs</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {optimizationLogs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              optimizationLogs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};