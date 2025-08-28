import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FileReference } from '@/types/file';
import { PhotoPeaIntegration as IPhotoPeaIntegration, Layer } from '@/types/creative-studio';
import Button from '@/components/ui/Button';

interface PhotoPeaIntegrationProps {
  file?: FileReference;
  onSave?: (blob: Blob, format: string) => void;
  onLayersChange?: (layers: Layer[]) => void;
  className?: string;
}

export const PhotoPeaIntegration: React.FC<PhotoPeaIntegrationProps> = ({
  file,
  onSave,
  onLayersChange,
  className = ''
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customToolbar, setCustomToolbar] = useState(false);

  // PhotoPea integration implementation
  const photoPeaIntegration: IPhotoPeaIntegration = {
    async loadImage(fileRef: FileReference): Promise<void> {
      if (!iframeRef.current) throw new Error('PhotoPea not initialized');
      
      try {
        setIsLoading(true);
        setError(null);

        // Convert file to base64 for PhotoPea
        const response = await fetch(fileRef.url);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);

        // Send message to PhotoPea iframe
        const message = {
          type: 'load_image',
          data: {
            name: fileRef.name,
            content: base64,
            format: fileRef.type
          }
        };

        iframeRef.current?.contentWindow?.postMessage(message, '*');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load image');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },

    async saveImage(format: string, quality?: number): Promise<Blob> {
      if (!iframeRef.current) throw new Error('PhotoPea not initialized');

      return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'image_saved') {
            window.removeEventListener('message', messageHandler);
            
            if (event.data.success) {
              // Convert base64 back to blob
              base64ToBlob(event.data.data, format)
                .then(resolve)
                .catch(reject);
            } else {
              reject(new Error(event.data.error || 'Failed to save image'));
            }
          }
        };

        window.addEventListener('message', messageHandler);

        const message = {
          type: 'save_image',
          data: { format, quality }
        };

        iframeRef.current?.contentWindow?.postMessage(message, '*');

        // Timeout after 30 seconds
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('Save operation timed out'));
        }, 30000);
      });
    },

    async applyFilter(filter: string, parameters: Record<string, any>): Promise<void> {
      if (!iframeRef.current) throw new Error('PhotoPea not initialized');

      const message = {
        type: 'apply_filter',
        data: { filter, parameters }
      };

      iframeRef.current.contentWindow?.postMessage(message, '*');
    },

    async getLayerData(): Promise<Layer[]> {
      if (!iframeRef.current) throw new Error('PhotoPea not initialized');

      return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'layer_data') {
            window.removeEventListener('message', messageHandler);
            resolve(event.data.layers);
          }
        };

        window.addEventListener('message', messageHandler);

        const message = { type: 'get_layers' };
        iframeRef.current.contentWindow?.postMessage(message, '*');

        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('Get layers operation timed out'));
        }, 10000);
      });
    },

    async setLayerData(layers: Layer[]): Promise<void> {
      if (!iframeRef.current) throw new Error('PhotoPea not initialized');

      const message = {
        type: 'set_layers',
        data: { layers }
      };

      iframeRef.current.contentWindow?.postMessage(message, '*');
    }
  };

  // Utility functions
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/... prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const base64ToBlob = (base64: string, mimeType: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      resolve(new Blob([byteArray], { type: mimeType }));
    });
  };

  // Handle messages from PhotoPea
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.photopea.com') return;

      switch (event.data.type) {
        case 'photopea_loaded':
          setIsLoaded(true);
          setIsLoading(false);
          break;

        case 'layers_changed':
          if (onLayersChange && event.data.layers) {
            onLayersChange(event.data.layers);
          }
          break;

        case 'image_exported':
          if (onSave && event.data.blob) {
            base64ToBlob(event.data.blob, event.data.format)
              .then(blob => onSave(blob, event.data.format))
              .catch(console.error);
          }
          break;

        case 'error':
          setError(event.data.message);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLayersChange, onSave]);

  // Load file when provided
  useEffect(() => {
    if (file && isLoaded) {
      photoPeaIntegration.loadImage(file).catch(console.error);
    }
  }, [file, isLoaded]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    
    // Initialize PhotoPea with custom settings
    if (iframeRef.current) {
      const initMessage = {
        type: 'init',
        data: {
          customToolbar,
          theme: 'dark',
          language: 'en'
        }
      };
      
      // Wait a bit for PhotoPea to fully load
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(initMessage, '*');
      }, 2000);
    }
  }, [customToolbar]);

  const handleSaveAs = useCallback(async (format: 'png' | 'jpg' | 'svg' | 'psd') => {
    try {
      const blob = await photoPeaIntegration.saveImage(format, format === 'jpg' ? 90 : undefined);
      if (onSave) {
        onSave(blob, format);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save image');
    }
  }, [onSave]);

  const handleApplyFilter = useCallback(async (filter: string) => {
    try {
      await photoPeaIntegration.applyFilter(filter, {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply filter');
    }
  }, []);

  const toggleCustomToolbar = useCallback(() => {
    setCustomToolbar(prev => !prev);
  }, []);

  return (
    <div className={`photopea-integration ${className}`}>
      {/* Custom Toolbar */}
      {customToolbar && (
        <div className="photopea-toolbar">
          <div className="toolbar-section">
            <h4>File</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSaveAs('png')}
              disabled={!isLoaded}
            >
              Save PNG
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSaveAs('jpg')}
              disabled={!isLoaded}
            >
              Save JPG
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSaveAs('svg')}
              disabled={!isLoaded}
            >
              Save SVG
            </Button>
          </div>

          <div className="toolbar-section">
            <h4>Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleApplyFilter('blur')}
              disabled={!isLoaded}
            >
              Blur
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleApplyFilter('sharpen')}
              disabled={!isLoaded}
            >
              Sharpen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleApplyFilter('brightness')}
              disabled={!isLoaded}
            >
              Brightness
            </Button>
          </div>

          <div className="toolbar-section">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCustomToolbar}
            >
              Hide Toolbar
            </Button>
          </div>
        </div>
      )}

      {/* PhotoPea iframe */}
      <div className="photopea-container">
        {isLoading && (
          <div className="photopea-loading">
            <div className="loading-spinner"></div>
            <p>Loading PhotoPea...</p>
          </div>
        )}

        {error && (
          <div className="photopea-error">
            <p>Error: {error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (iframeRef.current) {
                  iframeRef.current.src = iframeRef.current.src;
                }
              }}
            >
              Retry
            </Button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src="https://www.photopea.com/"
          className="photopea-iframe"
          onLoad={handleIframeLoad}
          title="PhotoPea Image Editor"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{ display: error ? 'none' : 'block' }}
        />

        {!customToolbar && isLoaded && (
          <Button
            variant="primary"
            size="sm"
            className="show-toolbar-btn"
            onClick={toggleCustomToolbar}
          >
            Show Custom Toolbar
          </Button>
        )}
      </div>

      <style>{`
        .photopea-integration {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .photopea-toolbar {
          display: flex;
          gap: var(--spacing-lg);
          padding: var(--spacing-md);
          background: var(--color-surface-elevated);
          border-bottom: 1px solid var(--color-border);
          overflow-x: auto;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          white-space: nowrap;
        }

        .toolbar-section h4 {
          margin: 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-secondary);
          margin-right: var(--spacing-sm);
        }

        .photopea-container {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .photopea-iframe {
          flex: 1;
          border: none;
          width: 100%;
          height: 100%;
          min-height: 600px;
        }

        .photopea-loading {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          z-index: 10;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border);
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .photopea-loading p {
          color: var(--color-text-secondary);
          font-size: var(--font-size-md);
        }

        .photopea-error {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          z-index: 10;
          gap: var(--spacing-md);
        }

        .photopea-error p {
          color: var(--color-error);
          font-size: var(--font-size-md);
          text-align: center;
          margin: 0;
        }

        .show-toolbar-btn {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          z-index: 5;
        }

        @media (max-width: 768px) {
          .photopea-toolbar {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .toolbar-section {
            flex-wrap: wrap;
          }

          .photopea-iframe {
            min-height: 400px;
          }
        }
      `}</style>
    </div>
  );
};