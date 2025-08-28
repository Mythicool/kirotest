import React, { useState, useCallback } from 'react';
import { Canvas, ExportOptions } from '@/types/creative-studio';
import Button from '@/components/ui/Button';

interface ExportSystemProps {
  canvas: Canvas;
  onExport?: (blob: Blob, format: string, options: ExportOptions) => void;
  className?: string;
}

interface ExportPreset {
  name: string;
  description: string;
  options: ExportOptions;
}

export const ExportSystem: React.FC<ExportSystemProps> = ({
  canvas,
  onExport,
  className = ''
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 90,
    width: canvas.width,
    height: canvas.height,
    dpi: canvas.dpi,
    optimize: true,
    transparent: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Export presets for common use cases
  const exportPresets: ExportPreset[] = [
    {
      name: 'Web Optimized',
      description: 'Optimized for web use with good quality and small file size',
      options: {
        format: 'jpg',
        quality: 85,
        optimize: true,
        progressive: true
      }
    },
    {
      name: 'High Quality Print',
      description: 'High resolution for professional printing',
      options: {
        format: 'png',
        dpi: 300,
        optimize: false,
        transparent: false
      }
    },
    {
      name: 'Social Media',
      description: 'Optimized for social media platforms',
      options: {
        format: 'jpg',
        quality: 90,
        width: 1200,
        height: 630,
        optimize: true
      }
    },
    {
      name: 'Vector Graphics',
      description: 'Scalable vector format',
      options: {
        format: 'svg',
        optimize: true
      }
    },
    {
      name: 'Transparent PNG',
      description: 'PNG with transparency support',
      options: {
        format: 'png',
        quality: 100,
        transparent: true,
        optimize: true
      }
    }
  ];

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Create a canvas element to render the design
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas dimensions based on export options
      const width = exportOptions.width || canvas.width;
      const height = exportOptions.height || canvas.height;
      
      exportCanvas.width = width;
      exportCanvas.height = height;

      // Set background
      if (!exportOptions.transparent) {
        ctx.fillStyle = canvas.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Render layers (simplified - in a real implementation, you'd render actual layer content)
      const visibleLayers = canvas.layers
        .filter(layer => layer.visible)
        .sort((a, b) => a.position.z - b.position.z);

      for (const layer of visibleLayers) {
        await renderLayer(ctx, layer, width, height);
      }

      // Convert to blob based on format
      const blob = await canvasToBlob(exportCanvas, exportOptions);
      
      if (onExport) {
        onExport(blob, exportOptions.format, exportOptions);
      } else {
        // Default behavior: download the file
        downloadBlob(blob, `${canvas.name}.${exportOptions.format}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [canvas, exportOptions, onExport]);

  const renderLayer = async (
    ctx: CanvasRenderingContext2D,
    layer: any,
    canvasWidth: number,
    canvasHeight: number
  ): Promise<void> => {
    // Save context state
    ctx.save();

    // Apply layer transformations
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;

    // Apply position and rotation
    const centerX = layer.position.x + layer.size.width / 2;
    const centerY = layer.position.y + layer.size.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-layer.size.width / 2, -layer.size.height / 2);

    // Render based on layer type
    switch (layer.type) {
      case 'image':
        await renderImageLayer(ctx, layer);
        break;
      case 'text':
        renderTextLayer(ctx, layer);
        break;
      case 'shape':
        renderShapeLayer(ctx, layer);
        break;
      default:
        // Render placeholder for unknown layer types
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(0, 0, layer.size.width, layer.size.height);
        break;
    }

    // Restore context state
    ctx.restore();
  };

  const renderImageLayer = async (ctx: CanvasRenderingContext2D, layer: any): Promise<void> => {
    if (!layer.content.data.src) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, layer.size.width, layer.size.height);
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = layer.content.data.src;
    });
  };

  const renderTextLayer = (ctx: CanvasRenderingContext2D, layer: any): void => {
    const textData = layer.content.data;
    const font = textData.font;
    
    ctx.font = `${font.style} ${font.weight} ${font.size}px ${font.family}`;
    ctx.fillStyle = font.color;
    ctx.textAlign = textData.alignment;
    ctx.textBaseline = 'top';

    // Handle multi-line text
    const lines = textData.text.split('\n');
    const lineHeight = font.size * textData.lineHeight;
    
    lines.forEach((line, index) => {
      const y = index * lineHeight;
      let x = 0;
      
      switch (textData.alignment) {
        case 'center':
          x = layer.size.width / 2;
          break;
        case 'right':
          x = layer.size.width;
          break;
        default:
          x = 0;
          break;
      }
      
      ctx.fillText(line, x, y);
    });
  };

  const renderShapeLayer = (ctx: CanvasRenderingContext2D, layer: any): void => {
    const shapeData = layer.content.data;
    
    ctx.beginPath();
    
    switch (shapeData.shape) {
      case 'rectangle':
        ctx.rect(0, 0, layer.size.width, layer.size.height);
        break;
      case 'circle':
        const radius = Math.min(layer.size.width, layer.size.height) / 2;
        const centerX = layer.size.width / 2;
        const centerY = layer.size.height / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        break;
      default:
        ctx.rect(0, 0, layer.size.width, layer.size.height);
        break;
    }

    // Fill
    if (shapeData.fill.type === 'solid' && shapeData.fill.color) {
      ctx.fillStyle = shapeData.fill.color;
      ctx.fill();
    }

    // Stroke
    if (shapeData.stroke.enabled) {
      ctx.strokeStyle = shapeData.stroke.color;
      ctx.lineWidth = shapeData.stroke.width;
      ctx.stroke();
    }
  };

  const canvasToBlob = (canvas: HTMLCanvasElement, options: ExportOptions): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const callback = (blob: Blob | null) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      };

      switch (options.format) {
        case 'png':
          canvas.toBlob(callback, 'image/png');
          break;
        case 'jpg':
          canvas.toBlob(callback, 'image/jpeg', (options.quality || 90) / 100);
          break;
        case 'webp':
          canvas.toBlob(callback, 'image/webp', (options.quality || 90) / 100);
          break;
        case 'svg':
          // For SVG, we'd need to generate SVG markup from the canvas data
          // This is a simplified implementation
          const svgData = generateSVGFromCanvas(canvas);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
          resolve(svgBlob);
          break;
        default:
          canvas.toBlob(callback, 'image/png');
          break;
      }
    });
  };

  const generateSVGFromCanvas = (canvas: HTMLCanvasElement): string => {
    // Simplified SVG generation - in a real implementation, you'd convert
    // the canvas content to proper SVG elements
    const dataURL = canvas.toDataURL('image/png');
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
        <image href="${dataURL}" width="${canvas.width}" height="${canvas.height}"/>
      </svg>
    `;
  };

  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const applyPreset = useCallback((preset: ExportPreset) => {
    setExportOptions(prev => ({
      ...prev,
      ...preset.options,
      // Preserve dimensions if not specified in preset
      width: preset.options.width || prev.width,
      height: preset.options.height || prev.height,
      dpi: preset.options.dpi || prev.dpi
    }));
  }, []);

  const updateOption = useCallback(<K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const getEstimatedFileSize = (): string => {
    const width = exportOptions.width || canvas.width;
    const height = exportOptions.height || canvas.height;
    const pixels = width * height;
    
    let estimatedBytes: number;
    
    switch (exportOptions.format) {
      case 'png':
        estimatedBytes = pixels * 4; // 4 bytes per pixel for RGBA
        if (exportOptions.optimize) estimatedBytes *= 0.6; // Rough compression estimate
        break;
      case 'jpg':
        estimatedBytes = pixels * 3; // 3 bytes per pixel for RGB
        const quality = (exportOptions.quality || 90) / 100;
        estimatedBytes *= (0.1 + quality * 0.4); // Quality-based compression
        break;
      case 'webp':
        estimatedBytes = pixels * 3;
        const webpQuality = (exportOptions.quality || 90) / 100;
        estimatedBytes *= (0.05 + webpQuality * 0.3); // Better compression than JPEG
        break;
      case 'svg':
        estimatedBytes = 1000 + canvas.layers.length * 500; // Rough estimate based on complexity
        break;
      default:
        estimatedBytes = pixels * 4;
        break;
    }
    
    return formatFileSize(estimatedBytes);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`export-system ${className}`}>
      <div className="export-header">
        <h3>Export Canvas</h3>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
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

      {/* Export Presets */}
      <div className="export-presets">
        <h4>Quick Presets</h4>
        <div className="presets-grid">
          {exportPresets.map((preset) => (
            <button
              key={preset.name}
              className="preset-button"
              onClick={() => applyPreset(preset)}
              title={preset.description}
            >
              <div className="preset-name">{preset.name}</div>
              <div className="preset-format">{preset.options.format.toUpperCase()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="export-options">
        <div className="options-header">
          <h4>Export Settings</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </Button>
        </div>

        <div className="option-group">
          <label>Format</label>
          <select
            value={exportOptions.format}
            onChange={(e) => updateOption('format', e.target.value as any)}
            className="format-select"
          >
            <option value="png">PNG</option>
            <option value="jpg">JPEG</option>
            <option value="webp">WebP</option>
            <option value="svg">SVG</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div className="option-row">
          <div className="option-group">
            <label>Width</label>
            <input
              type="number"
              value={exportOptions.width || canvas.width}
              onChange={(e) => updateOption('width', parseInt(e.target.value) || canvas.width)}
              className="dimension-input"
              min="1"
            />
          </div>
          <div className="option-group">
            <label>Height</label>
            <input
              type="number"
              value={exportOptions.height || canvas.height}
              onChange={(e) => updateOption('height', parseInt(e.target.value) || canvas.height)}
              className="dimension-input"
              min="1"
            />
          </div>
        </div>

        {(exportOptions.format === 'jpg' || exportOptions.format === 'webp') && (
          <div className="option-group">
            <label>Quality ({exportOptions.quality}%)</label>
            <input
              type="range"
              min="1"
              max="100"
              value={exportOptions.quality || 90}
              onChange={(e) => updateOption('quality', parseInt(e.target.value))}
              className="quality-slider"
            />
          </div>
        )}

        {exportOptions.format === 'png' && (
          <div className="option-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={exportOptions.transparent || false}
                onChange={(e) => updateOption('transparent', e.target.checked)}
              />
              Transparent Background
            </label>
          </div>
        )}

        <div className="option-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportOptions.optimize || false}
              onChange={(e) => updateOption('optimize', e.target.checked)}
            />
            Optimize File Size
          </label>
        </div>

        {showAdvanced && (
          <>
            <div className="option-group">
              <label>DPI</label>
              <select
                value={exportOptions.dpi || canvas.dpi}
                onChange={(e) => updateOption('dpi', parseInt(e.target.value))}
                className="dpi-select"
              >
                <option value={72}>72 (Web)</option>
                <option value={150}>150 (Draft Print)</option>
                <option value={300}>300 (High Quality Print)</option>
                <option value={600}>600 (Professional Print)</option>
              </select>
            </div>

            {exportOptions.format === 'jpg' && (
              <div className="option-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={exportOptions.progressive || false}
                    onChange={(e) => updateOption('progressive', e.target.checked)}
                  />
                  Progressive JPEG
                </label>
              </div>
            )}
          </>
        )}
      </div>

      {/* Export Preview */}
      <div className="export-preview">
        <div className="preview-info">
          <div className="info-item">
            <span className="info-label">Dimensions:</span>
            <span className="info-value">
              {exportOptions.width || canvas.width} × {exportOptions.height || canvas.height}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Estimated Size:</span>
            <span className="info-value">{getEstimatedFileSize()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Format:</span>
            <span className="info-value">{exportOptions.format.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <style>{`
        .export-system {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .export-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-elevated);
        }

        .export-header h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .error-message {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: var(--spacing-md);
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

        .export-presets {
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }

        .export-presets h4 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-sm);
        }

        .preset-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--spacing-sm);
          background: var(--color-surface-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preset-button:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-primary);
        }

        .preset-name {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: 2px;
          text-align: center;
        }

        .preset-format {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }

        .export-options {
          flex: 1;
          padding: var(--spacing-md);
          overflow-y: auto;
        }

        .options-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .options-header h4 {
          margin: 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .option-group {
          margin-bottom: var(--spacing-md);
        }

        .option-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .option-group label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .checkbox-label {
          display: flex !important;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
        }

        .format-select,
        .dpi-select,
        .dimension-input {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .format-select:focus,
        .dpi-select:focus,
        .dimension-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-subtle);
        }

        .quality-slider {
          width: 100%;
        }

        .export-preview {
          padding: var(--spacing-md);
          border-top: 1px solid var(--color-border);
          background: var(--color-surface-elevated);
        }

        .preview-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .info-value {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        @media (max-width: 768px) {
          .export-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .presets-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .option-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};