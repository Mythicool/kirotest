import React, { useCallback, useState, useRef } from 'react';
import { useSmartRouter } from '@/components/navigation/SmartRouter';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  error?: string;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  acceptedTypes = [],
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  maxFiles = 10,
  className = '',
  children,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getRecommendedTools } = useSmartRouter();

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`;
    }

    // Check file type if restrictions are set
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }

    return null;
  }, [acceptedTypes, maxFileSize]);

  const createFilePreview = useCallback(async (file: File): Promise<FilePreview> => {
    const id = `${file.name}-${Date.now()}-${Math.random()}`;
    const error = validateFile(file);

    if (error) {
      return { file, id, error };
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      try {
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        return { file, id, preview };
      } catch (error) {
        return { file, id, error: 'Failed to create preview' };
      }
    }

    return { file, id };
  }, [validateFile]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    
    const fileArray = Array.from(files);
    
    // Limit number of files
    const limitedFiles = fileArray.slice(0, maxFiles);
    
    try {
      // Create previews for all files
      const previewPromises = limitedFiles.map(createFilePreview);
      const newPreviews = await Promise.all(previewPromises);
      
      setPreviews(newPreviews);
      
      // Filter out files with errors
      const validFiles = newPreviews
        .filter(preview => !preview.error)
        .map(preview => preview.file);
      
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [maxFiles, createFilePreview, onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const removePreview = useCallback((id: string) => {
    setPreviews(prev => prev.filter(preview => preview.id !== id));
  }, []);

  const clearPreviews = useCallback(() => {
    setPreviews([]);
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    
    if (file.type.startsWith('video/')) {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    
    if (file.type.startsWith('audio/')) {
      return (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    }
    
    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const baseClasses = [
    'relative',
    'border-2',
    'border-dashed',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'cursor-pointer',
  ];

  const stateClasses = disabled
    ? ['border-gray-200', 'bg-gray-50', 'cursor-not-allowed']
    : isDragOver
    ? ['border-primary-400', 'bg-primary-50']
    : ['border-gray-300', 'hover:border-gray-400', 'hover:bg-gray-50'];

  const allClasses = [...baseClasses, ...stateClasses, className].join(' ');

  return (
    <div className="space-y-4">
      <div
        className={allClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="sr-only"
          disabled={disabled}
        />

        <div className="p-8 text-center">
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-primary-500 mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-gray-600">Processing files...</p>
            </div>
          ) : children ? (
            children
          ) : (
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-600">
                {acceptedTypes.length > 0 && (
                  <>Supported: {acceptedTypes.join(', ')}<br /></>
                )}
                Max {maxFiles} files, {Math.round(maxFileSize / (1024 * 1024))}MB each
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Selected Files ({previews.length})
            </h3>
            <button
              onClick={clearPreviews}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {previews.map((preview) => (
              <div
                key={preview.id}
                className={`relative p-3 border rounded-lg ${
                  preview.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {preview.preview ? (
                      <img
                        src={preview.preview}
                        alt={preview.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(preview.file)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(preview.file.size / 1024).toFixed(1)} KB
                    </p>
                    
                    {preview.error ? (
                      <p className="text-xs text-red-600 mt-1">{preview.error}</p>
                    ) : (
                      <div className="mt-1">
                        {getRecommendedTools(preview.file.type).slice(0, 2).map((toolId) => (
                          <span
                            key={toolId}
                            className="inline-block px-2 py-1 mr-1 text-xs bg-blue-100 text-blue-700 rounded"
                          >
                            {toolId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => removePreview(preview.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;