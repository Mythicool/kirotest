import React, { useState, useCallback } from 'react';
import { Canvas, CanvasType, LayerType, BlendMode, CreativeStudioWorkspace } from '@/types/creative-studio';
import { UUID } from '@/types/common';
import Button from '@/components/ui/Button';

interface CanvasManagerProps {
  workspace: CreativeStudioWorkspace;
  onWorkspaceChange: (workspace: CreativeStudioWorkspace) => void;
  onCanvasSelect: (canvasId: UUID) => void;
}

export const CanvasManager: React.FC<CanvasManagerProps> = ({
  workspace,
  onWorkspaceChange,
  onCanvasSelect
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCanvasConfig, setNewCanvasConfig] = useState<{
    name: string;
    type: CanvasType;
    width: number;
    height: number;
    dpi: number;
    colorMode: 'RGB' | 'CMYK' | 'Grayscale';
    backgroundColor: string;
  }>({
    name: 'New Canvas',
    type: CanvasType.RASTER,
    width: 1920,
    height: 1080,
    dpi: 72,
    colorMode: 'RGB',
    backgroundColor: '#ffffff'
  });

  const createCanvas = useCallback(() => {
    const canvas: Canvas = {
      id: `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: newCanvasConfig.name,
      type: newCanvasConfig.type,
      width: newCanvasConfig.width,
      height: newCanvasConfig.height,
      dpi: newCanvasConfig.dpi,
      colorMode: newCanvasConfig.colorMode,
      backgroundColor: newCanvasConfig.backgroundColor,
      layers: [
        {
          id: `layer_${Date.now()}_bg`,
          name: 'Background',
          type: LayerType.IMAGE,
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: BlendMode.NORMAL,
          position: { x: 0, y: 0, z: 0 },
          size: { width: newCanvasConfig.width, height: newCanvasConfig.height },
          rotation: 0,
          content: {
            type: LayerType.IMAGE,
            data: {
              src: '',
              filters: [],
              adjustments: {
                brightness: 0,
                contrast: 0,
                saturation: 0,
                hue: 0,
                gamma: 1,
                exposure: 0,
                highlights: 0,
                shadows: 0,
                whites: 0,
                blacks: 0
              }
            }
          },
          effects: [],
          childIds: [],
          created: new Date(),
          lastModified: new Date()
        }
      ],
      created: new Date(),
      lastModified: new Date(),
      metadata: {}
    };

    const updatedWorkspace = {
      ...workspace,
      canvases: [...workspace.canvases, canvas],
      activeCanvasId: canvas.id
    };

    onWorkspaceChange(updatedWorkspace);
    onCanvasSelect(canvas.id);
    setShowCreateDialog(false);
  }, [newCanvasConfig, workspace, onWorkspaceChange, onCanvasSelect]);

  const duplicateCanvas = useCallback((canvasId: UUID) => {
    const originalCanvas = workspace.canvases.find(c => c.id === canvasId);
    if (!originalCanvas) return;

    const duplicatedCanvas: Canvas = {
      ...originalCanvas,
      id: `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `${originalCanvas.name} Copy`,
      created: new Date(),
      lastModified: new Date(),
      layers: originalCanvas.layers.map(layer => ({
        ...layer,
        id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        created: new Date(),
        lastModified: new Date()
      }))
    };

    const updatedWorkspace = {
      ...workspace,
      canvases: [...workspace.canvases, duplicatedCanvas],
      activeCanvasId: duplicatedCanvas.id
    };

    onWorkspaceChange(updatedWorkspace);
    onCanvasSelect(duplicatedCanvas.id);
  }, [workspace, onWorkspaceChange, onCanvasSelect]);

  const deleteCanvas = useCallback((canvasId: UUID) => {
    if (workspace.canvases.length <= 1) return; // Don't delete the last canvas

    const updatedCanvases = workspace.canvases.filter(c => c.id !== canvasId);
    const newActiveId = workspace.activeCanvasId === canvasId 
      ? updatedCanvases[0]?.id 
      : workspace.activeCanvasId;

    const updatedWorkspace = {
      ...workspace,
      canvases: updatedCanvases,
      activeCanvasId: newActiveId
    };

    onWorkspaceChange(updatedWorkspace);
    if (newActiveId) {
      onCanvasSelect(newActiveId);
    }
  }, [workspace, onWorkspaceChange, onCanvasSelect]);

  const renameCanvas = useCallback((canvasId: UUID, newName: string) => {
    const updatedCanvases = workspace.canvases.map(canvas =>
      canvas.id === canvasId
        ? { ...canvas, name: newName, lastModified: new Date() }
        : canvas
    );

    const updatedWorkspace = {
      ...workspace,
      canvases: updatedCanvases
    };

    onWorkspaceChange(updatedWorkspace);
  }, [workspace, onWorkspaceChange]);

  const getCanvasPreview = (canvas: Canvas): string => {
    // Generate a simple preview based on canvas properties
    const aspectRatio = canvas.width / canvas.height;
    const previewWidth = aspectRatio > 1 ? 60 : 60 * aspectRatio;
    const previewHeight = aspectRatio > 1 ? 60 / aspectRatio : 60;
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${previewWidth}" height="${previewHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${canvas.backgroundColor}"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-size="8" fill="#666">
          ${canvas.width}×${canvas.height}
        </text>
      </svg>
    `)}`;
  };

  return (
    <div className="canvas-manager">
      <div className="canvas-manager__header">
        <h3>Canvases</h3>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateDialog(true)}
        >
          New Canvas
        </Button>
      </div>

      <div className="canvas-manager__list">
        {workspace.canvases.map((canvas) => (
          <div
            key={canvas.id}
            className={`canvas-item ${workspace.activeCanvasId === canvas.id ? 'active' : ''}`}
            onClick={() => onCanvasSelect(canvas.id)}
          >
            <div className="canvas-item__preview">
              <img
                src={getCanvasPreview(canvas)}
                alt={`${canvas.name} preview`}
                className="canvas-preview"
              />
              <div className="canvas-type-badge">{canvas.type}</div>
            </div>
            
            <div className="canvas-item__info">
              <div className="canvas-name">{canvas.name}</div>
              <div className="canvas-details">
                {canvas.width} × {canvas.height} • {canvas.layers.length} layers
              </div>
            </div>

            <div className="canvas-item__actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateCanvas(canvas.id);
                }}
                title="Duplicate canvas"
              >
                📋
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const newName = prompt('Enter new name:', canvas.name);
                  if (newName && newName !== canvas.name) {
                    renameCanvas(canvas.id, newName);
                  }
                }}
                title="Rename canvas"
              >
                ✏️
              </Button>
              {workspace.canvases.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${canvas.name}"?`)) {
                      deleteCanvas(canvas.id);
                    }
                  }}
                  title="Delete canvas"
                >
                  🗑️
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Create New Canvas</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
              >
                ✕
              </Button>
            </div>

            <div className="modal__body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newCanvasConfig.name}
                  onChange={(e) => setNewCanvasConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={newCanvasConfig.type}
                  onChange={(e) => setNewCanvasConfig(prev => ({ ...prev, type: e.target.value as CanvasType }))}
                  className="form-select"
                >
                  <option value={CanvasType.RASTER}>Raster (Bitmap)</option>
                  <option value={CanvasType.VECTOR}>Vector</option>
                  <option value={CanvasType.ANIMATION}>Animation</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Width</label>
                  <input
                    type="number"
                    value={newCanvasConfig.width}
                    onChange={(e) => setNewCanvasConfig(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    className="form-input"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Height</label>
                  <input
                    type="number"
                    value={newCanvasConfig.height}
                    onChange={(e) => setNewCanvasConfig(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    className="form-input"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>DPI</label>
                  <select
                    value={newCanvasConfig.dpi}
                    onChange={(e) => setNewCanvasConfig(prev => ({ ...prev, dpi: parseInt(e.target.value) }))}
                    className="form-select"
                  >
                    <option value={72}>72 (Web)</option>
                    <option value={150}>150 (Draft Print)</option>
                    <option value={300}>300 (High Quality Print)</option>
                    <option value={600}>600 (Professional Print)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color Mode</label>
                  <select
                    value={newCanvasConfig.colorMode}
                    onChange={(e) => setNewCanvasConfig(prev => ({ ...prev, colorMode: e.target.value as 'RGB' | 'CMYK' | 'Grayscale' }))}
                    className="form-select"
                  >
                    <option value="RGB">RGB</option>
                    <option value="CMYK">CMYK</option>
                    <option value="Grayscale">Grayscale</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Background Color</label>
                <input
                  type="color"
                  value={newCanvasConfig.backgroundColor}
                  onChange={(e) => setNewCanvasConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="form-input color-input"
                />
              </div>
            </div>

            <div className="modal__footer">
              <Button
                variant="secondary"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={createCanvas}
              >
                Create Canvas
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .canvas-manager {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .canvas-manager__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-elevated);
        }

        .canvas-manager__header h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .canvas-manager__list {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-sm);
        }

        .canvas-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: var(--spacing-xs);
        }

        .canvas-item:hover {
          background: var(--color-surface-hover);
        }

        .canvas-item.active {
          background: var(--color-primary-subtle);
          border: 1px solid var(--color-primary);
        }

        .canvas-item__preview {
          position: relative;
          flex-shrink: 0;
        }

        .canvas-preview {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
          object-fit: cover;
        }

        .canvas-type-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--color-primary);
          color: white;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: var(--radius-xs);
          text-transform: uppercase;
          font-weight: var(--font-weight-medium);
        }

        .canvas-item__info {
          flex: 1;
          min-width: 0;
        }

        .canvas-name {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .canvas-details {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .canvas-item__actions {
          display: flex;
          gap: var(--spacing-xs);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .canvas-item:hover .canvas-item__actions {
          opacity: 1;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
        }

        .modal__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .modal__header h3 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
        }

        .modal__body {
          padding: var(--spacing-lg);
          max-height: 60vh;
          overflow-y: auto;
        }

        .modal__footer {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-sm);
          padding: var(--spacing-lg);
          border-top: 1px solid var(--color-border);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .form-group label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-subtle);
        }

        .color-input {
          height: 40px;
          padding: 4px;
        }
      `}</style>
    </div>
  );
};