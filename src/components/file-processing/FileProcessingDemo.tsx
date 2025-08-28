import React, { useState, useCallback } from 'react';
import { FileReference } from '../../models/FileReference';
import { FileProcessingService } from '../../services/FileProcessingService';
import { ProgressInfo, OperationStatus } from '../../services/ProgressTracker';
import { BatchOperation, BatchOperationStatus } from '../../services/BatchProcessor';
import { tokens } from '../../styles/tokens';

interface FileProcessingDemoProps {
  files: FileReference[];
  onProcessingComplete?: (results: any) => void;
}

interface ProcessingState {
  isProcessing: boolean;
  currentOperation?: string;
  progress?: ProgressInfo;
  batchOperation?: BatchOperation;
  results: any[];
  errors: string[];
}

export const FileProcessingDemo: React.FC<FileProcessingDemoProps> = ({
  files,
  onProcessingComplete
}) => {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    results: [],
    errors: []
  });

  const [selectedOperation, setSelectedOperation] = useState<'convert' | 'validate' | 'sanitize' | 'optimize'>('convert');
  const [targetFormat, setTargetFormat] = useState('png');
  const [useCase, setUseCase] = useState<'web' | 'mobile' | 'print' | 'archive'>('web');

  const fileProcessingService = FileProcessingService.getInstance();

  const handleProgressUpdate = useCallback((progress: ProgressInfo) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const handleSingleFileProcessing = async (file: FileReference) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      currentOperation: `Processing ${file.name}`,
      errors: []
    }));

    try {
      let result;

      switch (selectedOperation) {
        case 'convert':
          result = await fileProcessingService.convertFile(
            file,
            targetFormat,
            { quality: 0.8 },
            {
              enableProgress: true,
              onProgress: handleProgressUpdate,
              timeout: 30000
            }
          );
          break;

        case 'validate':
          result = await fileProcessingService.validateFile(
            file,
            [],
            {
              enableProgress: true,
              onProgress: handleProgressUpdate
            }
          );
          break;

        case 'sanitize':
          result = await fileProcessingService.sanitizeFile(
            file,
            { stripScripts: true, removeMetadata: true },
            {
              enableProgress: true,
              onProgress: handleProgressUpdate
            }
          );
          break;

        case 'optimize':
          result = await fileProcessingService.optimizeFile(
            file,
            useCase,
            {
              enableProgress: true,
              onProgress: handleProgressUpdate
            }
          );
          break;
      }

      setState(prev => ({
        ...prev,
        isProcessing: false,
        results: [...prev.results, result],
        progress: undefined
      }));

      if (onProcessingComplete) {
        onProcessingComplete(result);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error'],
        progress: undefined
      }));
    }
  };

  const handleBatchProcessing = async () => {
    if (files.length === 0) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      currentOperation: `Batch processing ${files.length} files`,
      errors: []
    }));

    try {
      const batchOperation = await fileProcessingService.processBatch(
        files,
        selectedOperation === 'optimize' ? 'convert' : selectedOperation,
        selectedOperation === 'convert' || selectedOperation === 'optimize' 
          ? { targetFormat, conversionOptions: { quality: 0.8 } }
          : {},
        {
          maxConcurrency: 3,
          continueOnError: true,
          onProgress: (progress) => {
            setState(prev => ({
              ...prev,
              batchOperation: { ...prev.batchOperation!, progress }
            }));
          },
          onOperationComplete: (operation) => {
            setState(prev => ({
              ...prev,
              isProcessing: false,
              batchOperation: operation,
              results: operation.results
            }));

            if (onProcessingComplete) {
              onProcessingComplete(operation.results);
            }
          }
        }
      );

      setState(prev => ({ ...prev, batchOperation }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      }));
    }
  };

  const handleCancelOperation = () => {
    if (state.progress?.operationId) {
      fileProcessingService.cancelOperation(state.progress.operationId);
    }
    if (state.batchOperation?.id) {
      fileProcessingService.cancelOperation(state.batchOperation.id);
    }
  };

  const getProgressPercentage = (): number => {
    if (state.progress) {
      return state.progress.progress;
    }
    if (state.batchOperation) {
      return state.batchOperation.progress.overallProgress;
    }
    return 0;
  };

  const getProgressMessage = (): string => {
    if (state.progress) {
      return `${state.progress.stage} - ${state.progress.message || ''}`;
    }
    if (state.batchOperation) {
      const { progress } = state.batchOperation;
      return `Processing ${progress.processedFiles}/${progress.totalFiles} files`;
    }
    return '';
  };

  const getCapabilities = (file: FileReference) => {
    return fileProcessingService.getProcessingCapabilities(file);
  };

  return (
    <div style={{ 
      padding: tokens.spacing[6], 
      backgroundColor: tokens.colors.gray[50],
      borderRadius: tokens.borderRadius.lg,
      border: `1px solid ${tokens.colors.gray[200]}`
    }}>
      <h3 style={{ 
        margin: `0 0 ${tokens.spacing[4]} 0`,
        fontSize: tokens.typography.fontSize.lg,
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.gray[900]
      }}>
        File Processing Demo
      </h3>

      {/* Operation Selection */}
      <div style={{ marginBottom: tokens.spacing[4] }}>
        <label style={{ 
          display: 'block',
          marginBottom: tokens.spacing[2],
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.gray[700]
        }}>
          Processing Operation:
        </label>
        <select
          value={selectedOperation}
          onChange={(e) => setSelectedOperation(e.target.value as any)}
          disabled={state.isProcessing}
          style={{
            padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
            border: `1px solid ${tokens.colors.gray[300]}`,
            borderRadius: tokens.borderRadius.md,
            fontSize: tokens.typography.fontSize.sm,
            backgroundColor: tokens.colors.gray[50]
          }}
        >
          <option value="convert">Convert Format</option>
          <option value="validate">Validate & Scan</option>
          <option value="sanitize">Sanitize</option>
          <option value="optimize">Optimize</option>
        </select>
      </div>

      {/* Format Selection for Convert/Optimize */}
      {(selectedOperation === 'convert' || selectedOperation === 'optimize') && (
        <div style={{ marginBottom: tokens.spacing[4] }}>
          <label style={{ 
            display: 'block',
            marginBottom: tokens.spacing[2],
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.gray[700]
          }}>
            {selectedOperation === 'convert' ? 'Target Format:' : 'Use Case:'}
          </label>
          {selectedOperation === 'convert' ? (
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              disabled={state.isProcessing}
              style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
                border: `1px solid ${tokens.colors.gray[300]}`,
                borderRadius: tokens.borderRadius.md,
                fontSize: tokens.typography.fontSize.sm,
                backgroundColor: tokens.colors.gray[50]
              }}
            >
              <option value="png">PNG</option>
              <option value="jpg">JPEG</option>
              <option value="webp">WebP</option>
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
              <option value="md">Markdown</option>
            </select>
          ) : (
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value as any)}
              disabled={state.isProcessing}
              style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
                border: `1px solid ${tokens.colors.gray[300]}`,
                borderRadius: tokens.borderRadius.md,
                fontSize: tokens.typography.fontSize.sm,
                backgroundColor: tokens.colors.gray[50]
              }}
            >
              <option value="web">Web Optimization</option>
              <option value="mobile">Mobile Optimization</option>
              <option value="print">Print Quality</option>
              <option value="archive">Archive Quality</option>
            </select>
          )}
        </div>
      )}

      {/* File List with Capabilities */}
      <div style={{ marginBottom: tokens.spacing[4] }}>
        <h4 style={{ 
          margin: `0 0 ${tokens.spacing[3]} 0`,
          fontSize: tokens.typography.fontSize.base,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.gray[800]
        }}>
          Files ({files.length})
        </h4>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {files.map((file) => {
            const capabilities = getCapabilities(file);
            return (
              <div
                key={file.id}
                style={{
                  padding: tokens.spacing[3],
                  marginBottom: tokens.spacing[2],
                  backgroundColor: tokens.colors.gray[100],
                  borderRadius: tokens.borderRadius.md,
                  border: `1px solid ${tokens.colors.gray[200]}`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: tokens.spacing[2]
                }}>
                  <span style={{ 
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: tokens.colors.gray[900]
                  }}>
                    {file.name}
                  </span>
                  <span style={{ 
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.gray[600]
                  }}>
                    {file.getHumanReadableSize()}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.gray[600]
                }}>
                  <div>Can convert: {capabilities.canConvert ? 'Yes' : 'No'}</div>
                  {capabilities.canConvert && (
                    <div>Formats: {capabilities.supportedFormats.join(', ')}</div>
                  )}
                  <div>Can stream: {capabilities.canStream ? 'Yes' : 'No'}</div>
                </div>

                <button
                  onClick={() => handleSingleFileProcessing(file)}
                  disabled={state.isProcessing}
                  style={{
                    marginTop: tokens.spacing[2],
                    padding: `${tokens.spacing[1]} ${tokens.spacing[3]}`,
                    backgroundColor: tokens.colors.primary[500],
                    color: 'white',
                    border: 'none',
                    borderRadius: tokens.borderRadius.md,
                    fontSize: tokens.typography.fontSize.xs,
                    cursor: state.isProcessing ? 'not-allowed' : 'pointer',
                    opacity: state.isProcessing ? 0.6 : 1
                  }}
                >
                  Process This File
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: tokens.spacing[3], 
        marginBottom: tokens.spacing[4] 
      }}>
        <button
          onClick={handleBatchProcessing}
          disabled={state.isProcessing || files.length === 0}
          style={{
            padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
            backgroundColor: tokens.colors.primary[600],
            color: 'white',
            border: 'none',
            borderRadius: tokens.borderRadius.md,
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            cursor: state.isProcessing || files.length === 0 ? 'not-allowed' : 'pointer',
            opacity: state.isProcessing || files.length === 0 ? 0.6 : 1
          }}
        >
          Process All Files
        </button>

        {state.isProcessing && (
          <button
            onClick={handleCancelOperation}
            style={{
              padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
              backgroundColor: tokens.colors.error,
              color: 'white',
              border: 'none',
              borderRadius: tokens.borderRadius.md,
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Display */}
      {state.isProcessing && (
        <div style={{ marginBottom: tokens.spacing[4] }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: tokens.spacing[2]
          }}>
            <span style={{ 
              fontSize: tokens.typography.fontSize.sm,
              color: tokens.colors.gray[700]
            }}>
              {state.currentOperation}
            </span>
            <span style={{ 
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.primary[600]
            }}>
              {Math.round(getProgressPercentage())}%
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: tokens.colors.gray[200],
            borderRadius: tokens.borderRadius.full,
            overflow: 'hidden'
          }}>
            <div
              style={{
                width: `${getProgressPercentage()}%`,
                height: '100%',
                backgroundColor: tokens.colors.primary[500],
                transition: 'width 0.3s ease-in-out'
              }}
            />
          </div>
          
          {getProgressMessage() && (
            <div style={{ 
              marginTop: tokens.spacing[2],
              fontSize: tokens.typography.fontSize.xs,
              color: tokens.colors.gray[600]
            }}>
              {getProgressMessage()}
            </div>
          )}
        </div>
      )}

      {/* Results Display */}
      {state.results.length > 0 && (
        <div style={{ marginBottom: tokens.spacing[4] }}>
          <h4 style={{ 
            margin: `0 0 ${tokens.spacing[3]} 0`,
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.gray[800]
          }}>
            Results ({state.results.length})
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {state.results.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: tokens.spacing[3],
                  marginBottom: tokens.spacing[2],
                  backgroundColor: result.success ? tokens.colors.success + '10' : tokens.colors.error + '10',
                  borderRadius: tokens.borderRadius.md,
                  border: `1px solid ${result.success ? tokens.colors.success : tokens.colors.error}20`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: tokens.spacing[1]
                }}>
                  <span style={{ 
                    fontSize: tokens.typography.fontSize.sm,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: result.success ? tokens.colors.success : tokens.colors.error
                  }}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                  <span style={{ 
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.gray[600]
                  }}>
                    {result.processingTime}ms
                  </span>
                </div>
                
                {result.error && (
                  <div style={{ 
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.error
                  }}>
                    Error: {result.error}
                  </div>
                )}
                
                {result.warnings && result.warnings.length > 0 && (
                  <div style={{ 
                    fontSize: tokens.typography.fontSize.xs,
                    color: tokens.colors.warning
                  }}>
                    Warnings: {result.warnings.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors Display */}
      {state.errors.length > 0 && (
        <div>
          <h4 style={{ 
            margin: `0 0 ${tokens.spacing[3]} 0`,
            fontSize: tokens.typography.fontSize.base,
            fontWeight: tokens.typography.fontWeight.medium,
            color: tokens.colors.error
          }}>
            Errors ({state.errors.length})
          </h4>
          {state.errors.map((error, index) => (
            <div
              key={index}
              style={{
                padding: tokens.spacing[3],
                marginBottom: tokens.spacing[2],
                backgroundColor: tokens.colors.error + '10',
                borderRadius: tokens.borderRadius.md,
                border: `1px solid ${tokens.colors.error}20`,
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.error
              }}
            >
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};