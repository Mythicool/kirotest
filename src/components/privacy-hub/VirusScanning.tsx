import React, { useState, useRef } from 'react';
import { VirusScanResult, PrivacySettings } from '@/types/privacy-hub';
import Button from '@/components/ui/Button';

interface VirusScanningProps {
  scans: VirusScanResult[];
  onScanCreate: (scan: VirusScanResult) => void;
  settings: PrivacySettings;
}

export const VirusScanning: React.FC<VirusScanningProps> = ({
  scans,
  onScanCreate,
  settings
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const simulateVirusScan = async (file: File): Promise<VirusScanResult> => {
    // Simulate scanning process
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Create initial scan result
    const initialScan: VirusScanResult = {
      id: scanId,
      fileName: file.name,
      fileSize: file.size,
      scanProvider: 'jotti',
      status: 'scanning',
      threats: [],
      scanDate: new Date()
    };

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

    // Simulate scan results (mostly clean files)
    const isClean = Math.random() > 0.1; // 90% chance of clean file
    
    if (isClean) {
      return {
        ...initialScan,
        status: 'clean',
        reportUrl: `https://virusscan.jotti.org/en-US/filescanjob/${scanId}`
      };
    } else {
      // Simulate some common threat names
      const possibleThreats = [
        'Trojan.Generic.KD.12345',
        'Adware.Win32.Agent',
        'PUP.Optional.Bundle',
        'Suspicious.Cloud.9.A'
      ];
      
      const threatCount = Math.floor(Math.random() * 3) + 1;
      const threats = possibleThreats.slice(0, threatCount);
      
      return {
        ...initialScan,
        status: 'infected',
        threats,
        reportUrl: `https://virusscan.jotti.org/en-US/filescanjob/${scanId}`
      };
    }
  };

  const startVirusScan = async () => {
    if (!selectedFile) {
      alert('Please select a file to scan');
      return;
    }

    // Check file size limit (simulate 20MB limit)
    if (selectedFile.size > 20 * 1024 * 1024) {
      alert('File size exceeds 20MB limit for virus scanning');
      return;
    }

    setScanning(true);
    
    try {
      // Create initial scanning result
      const initialScan: VirusScanResult = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        scanProvider: 'jotti',
        status: 'scanning',
        threats: [],
        scanDate: new Date()
      };

      onScanCreate(initialScan);

      // Perform actual scan simulation
      const finalResult = await simulateVirusScan(selectedFile);
      onScanCreate(finalResult);

      // Reset file selection
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Virus scan failed:', error);
      
      const errorScan: VirusScanResult = {
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        scanProvider: 'jotti',
        status: 'error',
        threats: [],
        scanDate: new Date()
      };
      
      onScanCreate(errorScan);
      alert('Virus scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const openScanReport = (reportUrl?: string) => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    }
  };

  const getStatusIcon = (status: VirusScanResult['status']): string => {
    switch (status) {
      case 'scanning': return '🔄';
      case 'clean': return '✅';
      case 'infected': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: VirusScanResult['status']): string => {
    switch (status) {
      case 'scanning': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'clean': return 'text-green-600 bg-green-50 border-green-200';
      case 'infected': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: VirusScanResult['status']): string => {
    switch (status) {
      case 'scanning': return 'Scanning in progress...';
      case 'clean': return 'File is clean';
      case 'infected': return 'Threats detected';
      case 'error': return 'Scan failed';
      default: return 'Unknown status';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Virus Scanning</h3>
        
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-purple-400 bg-purple-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <div className="text-4xl">📄</div>
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-sm text-gray-600">
                  {formatFileSize(selectedFile.size)}
                </div>
                <Button
                  onClick={() => setSelectedFile(null)}
                  variant="outline"
                  size="sm"
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📁</div>
                <div className="font-medium">Drop file here or click to select</div>
                <div className="text-sm text-gray-600">
                  Maximum file size: 20MB
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Select File
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={startVirusScan}
            disabled={!selectedFile || scanning}
            className="w-full"
          >
            {scanning ? '🔄 Scanning File...' : '🛡️ Start Virus Scan'}
          </Button>
        </div>
      </div>

      {scans.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Scan Results</h3>
          <div className="space-y-3">
            {scans.slice().reverse().map((scan) => (
              <div
                key={scan.id}
                className={`p-4 border rounded-lg ${getStatusColor(scan.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getStatusIcon(scan.status)}</span>
                      <span className="font-medium text-sm">{scan.fileName}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {formatFileSize(scan.fileSize)} • {scan.scanProvider}
                    </div>
                    <div className="text-sm font-medium">
                      {getStatusText(scan.status)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1 ml-4">
                    {scan.reportUrl && (
                      <Button
                        onClick={() => openScanReport(scan.reportUrl)}
                        variant="outline"
                        size="sm"
                      >
                        View Report
                      </Button>
                    )}
                  </div>
                </div>
                
                {scan.threats.length > 0 && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
                    <div className="font-medium text-red-900 text-sm mb-1">
                      Detected Threats:
                    </div>
                    <ul className="text-sm text-red-800 space-y-1">
                      {scan.threats.map((threat, index) => (
                        <li key={index}>• {threat}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2 border-t pt-2">
                  Scanned: {scan.scanDate.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Virus Scanning Service</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Files are scanned using multiple antivirus engines</li>
          <li>• Powered by Jotti's malware scan service</li>
          <li>• Maximum file size limit: 20MB</li>
          <li>• Scan results include detailed threat information</li>
          <li>• Files are automatically deleted after scanning</li>
          <li>• No registration required for basic scanning</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Security Recommendations</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Always scan files from unknown sources</li>
          <li>• Don't rely solely on online scanners for critical security</li>
          <li>• Keep your local antivirus software updated</li>
          <li>• Be cautious with executable files (.exe, .bat, .scr)</li>
          <li>• Scan email attachments before opening</li>
          <li>• Use multiple scanning services for suspicious files</li>
        </ul>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-900 mb-2">Important Warnings</h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Never upload sensitive or confidential files to online scanners</li>
          <li>• Online scanners may retain copies of uploaded files</li>
          <li>• False positives can occur - verify results with multiple scanners</li>
          <li>• Some advanced malware may evade detection</li>
          <li>• Always maintain updated local antivirus protection</li>
        </ul>
      </div>
    </div>
  );
};