import React, { useState, useCallback, useRef } from 'react';
import { TinyPNGIntegration as ITinyPNGIntegration } from '@/types/creative-studio';

import Button from '@/components/ui/Button';

interface TinyPNGIntegrationProps {
  onOptimized?: (originalFile: File, optimizedBlob: Blob, stats: any) => void;
  className?: string;
}

interface OptimizationResult {
  id: string;
  originalFile: File;
  optimizedBlob: Blob;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  savings: number;
  percentage: number;
  timestamp: Date;
}

export const TinyPNGIntegration: React.FC<TinyPNGIntegrationProps> = ({
  onOptimized,
  className = ''
}) => {
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TinyPNG integration implementation
  const tinyPNGIntegration: ITinyPNGIntegration = {
    async optimizeImage(file: Blob): Promise<Blob> {
      // Since TinyPNG requires an API key and has usage limits,
      // we'll simulate the optimization process with a client-side implementation
      // In a real implementation, you would send the file to TinyPNG's API
      
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // For demonstration, we'll use canvas-based compression
        return await compressImageWithCanvas(file, 0.8);
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to optimize image');
      }
    },

    getCompressionStats(originalSize: number, compressedSize: number) {
      const savings = originalSize - compressedSize;
      const percentage = (savings / originalSize) * 100;
      const ratio = compressedSize / originalSize;

      return {
        ratio,
        savings,
        percentage
      };
    }
  };

  // Client-side image compression using Canvas API
  const compressImageWithCanvas = async (file: Blob, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const optimizeFiles = useCallback(async (files: File[]) => {
    setIsOptimizing(true);
    setError(null);

    const newResults: OptimizationResult[] = [];

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Check file size (limit to 5MB for demo)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 5MB)`);
        }

        try {
          const optimizedBlob = await tinyPNGIntegration.optimizeImage(file);
          const stats = tinyPNGIntegration.getCompressionStats(file.size, optimizedBlob.size);

          const result: OptimizationResult = {
            id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            originalFile: file,
            optimizedBlob,
            originalSize: file.size,
            optimizedSize: optimizedBlob.size,
            compressionRatio: stats.ratio,
            savings: stats.savings,
            percentage: stats.percentage,
            timestamp: new Date()
          };

          newResults.push(result);

          if (onOptimized) {
            onOptimized(file, optimizedBlob, stats);
          }
        } catch (fileError) {
          console.error(`Failed to optimize ${file.name}:`, fileError);
          throw new Error(`Failed to optimize ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }

      setResults(prev => [...newResults, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize images');
    } finally {
      setIsOptimizing(false);
    }
  }, [onOptimized]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      optimizeFiles(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [optimizeFiles]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      optimizeFiles(files);
    }
  }, [optimizeFiles]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  }, []);

  const downloadOptimized = useCallback((result: OptimizationResult) => {
    const url = URL.createObjectURL(result.optimizedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized_${result.originalFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadAll = useCallback(() => {
    results.forEach(result => {
      setTimeout(() => downloadOptimized(result), 100);
    });
  }, [results, downloadOptimized]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalSavings = (): { originalSize: number; optimizedSize: number; savings: number; percentage: number } => {
    const totalOriginal = results.reduce((sum, result) => sum + result.originalSize, 0);
    const totalOptimized = results.reduce((sum, result) => sum + result.optimizedSize, 0);
    const savings = totalOriginal - totalOptimized;
    const percentage = totalOriginal > 0 ? (savings / totalOriginal) * 100 : 0;

    return {
      originalSize: totalOriginal,
      optimizedSize: totalOptimized,
      savings,
      percentage
    };
  };

  const totalStats = getTotalSavings();

  return (
    <div className={`tinypng-integration ${className}`}>
      <div className="tinypng-header">
        <h3>Image Optimization</h3>
        <div className="header-actions">
          {results.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadAll}
                title="Download all optimized images"
              >
                ⬇️ Download All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearResults}
                title="Clear results"
              >
                🗑️ Clear
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`upload-area ${dragOver ? 'drag-over' : ''} ${isOptimizing ? 'optimizing' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
        />

        {isOptimizing ? (
          <div className="upload-content">
            <div className="loading-spinner"></div>
            <p>Optimizing images...</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📸</div>
            <p>Drop images here or click to select</p>
            <small>Supports PNG, JPG, WebP (max 5MB each)</small>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
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

      {/* Total Statistics */}
      {results.length > 0 && (
        <div className="total-stats">
          <h4>Total Savings</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Original Size</span>
              <span className="stat-value">{formatFileSize(totalStats.originalSize)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Optimized Size</span>
              <span className="stat-value">{formatFileSize(totalStats.optimizedSize)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Saved</span>
              <span className="stat-value savings">{formatFileSize(totalStats.savings)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Reduction</span>
              <span className="stat-value percentage">{totalStats.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="results-list">
        {results.map((result) => (
          <div key={result.id} className="result-item">
            <div className="result-info">
              <div className="file-name">{result.originalFile.name}</div>
              <div className="file-stats">
                <span className="original-size">{formatFileSize(result.originalSize)}</span>
                <span className="arrow">→</span>
                <span className="optimized-size">{formatFileSize(result.optimizedSize)}</span>
                <span className="savings">(-{result.percentage.toFixed(1)}%)</span>
              </div>
            </div>
            
            <div className="result-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadOptimized(result)}
                title="Download optimized image"
              >
                ⬇️
              </Button>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !isOptimizing && (
        <div className="empty-state">
          <p>No images optimized yet. Upload some images to get started!</p>
        </div>
      )}

      <style>{`
        .tinypng-integration {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .tinypng-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-elevated);
        }

        .tinypng-header h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .upload-area {
          margin: var(--spacing-md);
          padding: var(--spacing-xl);
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-lg);
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .upload-area:hover {
          border-color: var(--color-primary);
          background: var(--color-primary-subtle);
        }

        .upload-area.drag-over {
          border-color: var(--color-primary);
          background: var(--color-primary-subtle);
          transform: scale(1.02);
        }

        .upload-area.optimizing {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .upload-icon {
          font-size: 48px;
          opacity: 0.6;
        }

        .upload-content p {
          margin: 0;
          font-size: var(--font-size-md);
          color: var(--color-text-primary);
        }

        .upload-content small {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-border);
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 var(--spacing-md);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-error-subtle);
          border: 1px solid var(--color-error);
          border-radius: var(--radius-sm);
        }

        .error-message p {
          margin: 0;
          color: var(--color-error);
          font-size: var(--font-size-sm);
        }

        .total-stats {
          margin: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-radius: var(--radius-md);
        }

        .total-stats h4 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-md);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .stat-value {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .stat-value.savings {
          color: var(--color-success);
        }

        .stat-value.percentage {
          color: var(--color-primary);
        }

        .results-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 var(--spacing-md) var(--spacing-md);
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-sm);
        }

        .result-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-stats {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
        }

        .original-size {
          color: var(--color-text-secondary);
        }

        .arrow {
          color: var(--color-text-secondary);
        }

        .optimized-size {
          color: var(--color-text-primary);
          font-weight: var(--font-weight-medium);
        }

        .savings {
          color: var(--color-success);
          font-weight: var(--font-weight-medium);
        }

        .result-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          text-align: center;
        }

        .empty-state p {
          color: var(--color-text-secondary);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .tinypng-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .result-item {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-sm);
          }

          .file-stats {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};