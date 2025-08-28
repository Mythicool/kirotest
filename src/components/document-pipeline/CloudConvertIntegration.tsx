import React, { useState, useCallback } from 'react';
import { DocumentFormat, ConversionProgress } from '@/types/document-pipeline';
import Button from '@/components/ui/Button';

interface ConversionJob {
  id: string;
  fileName: string;
  sourceFormat: DocumentFormat;
  targetFormat: DocumentFormat;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
}

interface CloudConvertIntegrationProps {
  onConversionComplete: (result: string, format: DocumentFormat, downloadUrl?: string) => void;
  onError: (error: string) => void;
}

export const CloudConvertIntegration: React.FC<CloudConvertIntegrationProps> = ({
  onConversionComplete,
  onError
}) => {
  const [conversionQueue, setConversionQueue] = useState<ConversionJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<DocumentFormat>(DocumentFormat.PDF);

  const supportedFormats = [
    DocumentFormat.PDF,
    DocumentFormat.DOCX,
    DocumentFormat.HTML,
    DocumentFormat.MD,
    DocumentFormat.TEX,
    DocumentFormat.TXT
  ];

  const addToQueue = useCallback((
    file: File,
    sourceFormat: DocumentFormat,
    targetFormat: DocumentFormat
  ) => {
    const job: ConversionJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      sourceFormat,
      targetFormat,
      status: 'queued',
      progress: 0,
      createdAt: new Date()
    };

    setConversionQueue(prev => [...prev, job]);
    return job.id;
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing) return;
    
    const queuedJobs = conversionQueue.filter(job => job.status === 'queued');
    if (queuedJobs.length === 0) return;

    setIsProcessing(true);

    try {
      // Process jobs one by one (CloudConvert typically processes sequentially)
      for (const job of queuedJobs) {
        await processJob(job.id);
      }
    } catch (error) {
      console.error('Queue processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [conversionQueue, isProcessing]);

  const processJob = useCallback(async (jobId: string) => {
    setConversionQueue(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'processing' as const, progress: 0 }
        : job
    ));

    try {
      // Simulate CloudConvert API interaction
      const job = conversionQueue.find(j => j.id === jobId);
      if (!job) throw new Error('Job not found');

      // Simulate conversion progress
      const progressSteps = [10, 25, 50, 75, 90, 100];
      
      for (const progress of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setConversionQueue(prev => prev.map(j => 
          j.id === jobId 
            ? { ...j, progress }
            : j
        ));
      }

      // Simulate successful completion
      const mockDownloadUrl = `https://cloudconvert.com/download/${jobId}`;
      const mockResult = generateMockConvertedContent(job.sourceFormat, job.targetFormat);

      setConversionQueue(prev => prev.map(j => 
        j.id === jobId 
          ? { 
              ...j, 
              status: 'completed' as const, 
              progress: 100,
              completedAt: new Date(),
              downloadUrl: mockDownloadUrl
            }
          : j
      ));

      onConversionComplete(mockResult, job.targetFormat, mockDownloadUrl);

    } catch (error) {
      setConversionQueue(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'failed' as const, 
              error: error instanceof Error ? error.message : 'Conversion failed'
            }
          : job
      ));
      
      onError(error instanceof Error ? error.message : 'Conversion failed');
    }
  }, [conversionQueue, onConversionComplete, onError]);

  const generateMockConvertedContent = (
    sourceFormat: DocumentFormat, 
    targetFormat: DocumentFormat
  ): string => {
    const timestamp = new Date().toLocaleString();
    
    if (targetFormat === DocumentFormat.HTML) {
      return `<!DOCTYPE html>
<html>
<head>
    <title>Converted Document</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Document Converted via CloudConvert</h1>
    <p>Original format: ${sourceFormat.toUpperCase()}</p>
    <p>Target format: ${targetFormat.toUpperCase()}</p>
    <p>Converted at: ${timestamp}</p>
    <p>This is a mock conversion result. In a real implementation, this would contain the actual converted content.</p>
</body>
</html>`;
    }
    
    if (targetFormat === DocumentFormat.MD) {
      return `# Document Converted via CloudConvert

**Original format:** ${sourceFormat.toUpperCase()}  
**Target format:** ${targetFormat.toUpperCase()}  
**Converted at:** ${timestamp}

This is a mock conversion result. In a real implementation, this would contain the actual converted content.

## Features
- High-quality conversion
- Batch processing
- Multiple format support
- Queue management`;
    }

    return `Document Converted via CloudConvert
=====================================

Original format: ${sourceFormat.toUpperCase()}
Target format: ${targetFormat.toUpperCase()}
Converted at: ${timestamp}

This is a mock conversion result. In a real implementation, this would contain the actual converted content.`;
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleConvert = useCallback(() => {
    if (!selectedFile) {
      onError('Please select a file to convert');
      return;
    }

    // Detect source format from file extension
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    let sourceFormat: DocumentFormat;

    switch (extension) {
      case 'md':
        sourceFormat = DocumentFormat.MD;
        break;
      case 'tex':
        sourceFormat = DocumentFormat.TEX;
        break;
      case 'html':
        sourceFormat = DocumentFormat.HTML;
        break;
      case 'pdf':
        sourceFormat = DocumentFormat.PDF;
        break;
      case 'docx':
        sourceFormat = DocumentFormat.DOCX;
        break;
      default:
        sourceFormat = DocumentFormat.TXT;
    }

    const jobId = addToQueue(selectedFile, sourceFormat, targetFormat);
    
    // Auto-start processing
    setTimeout(() => processQueue(), 100);
  }, [selectedFile, targetFormat, addToQueue, processQueue, onError]);

  const removeFromQueue = useCallback((jobId: string) => {
    setConversionQueue(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const retryJob = useCallback((jobId: string) => {
    setConversionQueue(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'queued' as const, error: undefined }
        : job
    ));
    processQueue();
  }, [processQueue]);

  const getStatusColor = (status: ConversionJob['status']) => {
    switch (status) {
      case 'queued': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload and Conversion Setup */}
      <div className="bg-white p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-4">CloudConvert Integration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select File</label>
            <input
              type="file"
              onChange={handleFileSelect}
              className="w-full p-2 border rounded-md"
              accept=".pdf,.docx,.html,.md,.tex,.txt"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Convert To</label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as DocumentFormat)}
              className="w-full p-2 border rounded-md"
            >
              {supportedFormats.map(format => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleConvert}
            disabled={!selectedFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Add to Conversion Queue'}
          </Button>
        </div>
      </div>

      {/* Conversion Queue */}
      {conversionQueue.length > 0 && (
        <div className="bg-white p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Conversion Queue</h3>
            <Button
              size="sm"
              onClick={processQueue}
              disabled={isProcessing || conversionQueue.every(job => job.status !== 'queued')}
            >
              Process Queue
            </Button>
          </div>

          <div className="space-y-3">
            {conversionQueue.map(job => (
              <div key={job.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{job.fileName}</span>
                    <span className="text-sm text-gray-600">
                      {job.sourceFormat.toUpperCase()} → {job.targetFormat.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.toUpperCase()}
                    </span>
                    {job.status === 'failed' && (
                      <Button size="sm" onClick={() => retryJob(job.id)}>
                        Retry
                      </Button>
                    )}
                    {job.status !== 'processing' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromQueue(job.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                {job.status === 'processing' && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {job.error && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Error: {job.error}
                  </div>
                )}

                {job.downloadUrl && job.status === 'completed' && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    <a
                      href={job.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Download converted file
                    </a>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Created: {job.createdAt.toLocaleString()}
                  {job.completedAt && (
                    <span> • Completed: {job.completedAt.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Statistics */}
      {conversionQueue.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {conversionQueue.filter(job => job.status === 'queued').length}
              </div>
              <div className="text-xs text-gray-600">Queued</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {conversionQueue.filter(job => job.status === 'processing').length}
              </div>
              <div className="text-xs text-gray-600">Processing</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {conversionQueue.filter(job => job.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {conversionQueue.filter(job => job.status === 'failed').length}
              </div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};