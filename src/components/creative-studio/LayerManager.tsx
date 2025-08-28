import React, { useState, useCallback, useMemo } from 'react';
import { Layer, LayerType, BlendMode, Canvas } from '@/types/creative-studio';
import { UUID } from '@/types/common';
import Button from '@/components/ui/Button';

interface LayerManagerProps {
  canvas: Canvas;
  onCanvasChange: (canvas: Canvas) => void;
}

export const LayerManager: React.FC<LayerManagerProps> = ({
  canvas,
  onCanvasChange
}) => {
  const [draggedLayer, setDraggedLayer] = useState<UUID | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<UUID>>(new Set());

  // Sort layers by z-index (highest first for display)
  const sortedLayers = useMemo(() => {
    return [...canvas.layers].sort((a, b) => b.position.z - a.position.z);
  }, [canvas.layers]);

  const createLayer = useCallback((type: LayerType) => {
    const newLayer: Layer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
      type,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: BlendMode.NORMAL,
      position: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        z: Math.max(...canvas.layers.map(l => l.position.z), 0) + 1
      },
      size: {
        width: type === LayerType.TEXT ? 200 : canvas.width / 4,
        height: type === LayerType.TEXT ? 50 : canvas.height / 4
      },
      rotation: 0,
      content: getDefaultContent(type),
      effects: [],
      childIds: [],
      created: new Date(),
      lastModified: new Date()
    };

    const updatedCanvas = {
      ...canvas,
      layers: [...canvas.layers, newLayer],
      activeLayerId: newLayer.id,
      lastModified: new Date()
    };

    onCanvasChange(updatedCanvas);
  }, [canvas, onCanvasChange]);

  const getDefaultContent = (type: LayerType) => {
    switch (type) {
      case LayerType.IMAGE:
        return {
          type,
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
        };
      case LayerType.TEXT:
        return {
          type,
          data: {
            text: 'Sample Text',
            font: {
              family: 'Arial',
              size: 24,
              weight: 'normal' as const,
              style: 'normal' as const,
              color: '#000000',
              decoration: 'none' as const
            },
            alignment: 'left' as const,
            lineHeight: 1.2,
            letterSpacing: 0
          }
        };
      case LayerType.SHAPE:
        return {
          type,
          data: {
            shape: 'rectangle' as const,
            fill: {
              type: 'solid' as const,
              color: '#0066cc'
            },
            stroke: {
              enabled: true,
              color: '#000000',
              width: 1,
              style: 'solid' as const
            }
          }
        };
      default:
        return { type, data: {} };
    }
  };

  const duplicateLayer = useCallback((layerId: UUID) => {
    const originalLayer = canvas.layers.find(l => l.id === layerId);
    if (!originalLayer) return;

    const duplicatedLayer: Layer = {
      ...originalLayer,
      id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: `${originalLayer.name} Copy`,
      position: {
        ...originalLayer.position,
        x: originalLayer.position.x + 20,
        y: originalLayer.position.y + 20,
        z: Math.max(...canvas.layers.map(l => l.position.z), 0) + 1
      },
      created: new Date(),
      lastModified: new Date()
    };

    const updatedCanvas = {
      ...canvas,
      layers: [...canvas.layers, duplicatedLayer],
      activeLayerId: duplicatedLayer.id,
      lastModified: new Date()
    };

    onCanvasChange(updatedCanvas);
  }, [canvas, onCanvasChange]);

  const deleteLayer = useCallback((layerId: UUID) => {
    if (canvas.layers.length <= 1) return; // Don't delete the last layer

    const updatedLayers = canvas.layers.filter(l => l.id !== layerId);
    const newActiveId = canvas.activeLayerId === layerId 
      ? updatedLayers[0]?.id 
      : canvas.activeLayerId;

    const updatedCanvas = {
      ...canvas,
      layers: updatedLayers,
      activeLayerId: newActiveId,
      lastModified: new Date()
    };

    onCanvasChange(updatedCanvas);
  }, [canvas, onCanvasChange]);

  const updateLayer = useCallback((layerId: UUID, updates: Partial<Layer>) => {
    const updatedLayers = canvas.layers.map(layer =>
      layer.id === layerId
        ? { ...layer, ...updates, lastModified: new Date() }
        : layer
    );

    const updatedCanvas = {
      ...canvas,
      layers: updatedLayers,
      lastModified: new Date()
    };

    onCanvasChange(updatedCanvas);
  }, [canvas, onCanvasChange]);

  const moveLayer = useCallback((layerId: UUID, direction: 'up' | 'down') => {
    const layer = canvas.layers.find(l => l.id === layerId);
    if (!layer) return;

    const newZ = direction === 'up' 
      ? layer.position.z + 1 
      : Math.max(0, layer.position.z - 1);

    updateLayer(layerId, {
      position: { ...layer.position, z: newZ }
    });
  }, [canvas.layers, updateLayer]);

  const handleDragStart = useCallback((e: React.DragEvent, layerId: UUID) => {
    setDraggedLayer(layerId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetLayerId: UUID) => {
    e.preventDefault();
    if (!draggedLayer || draggedLayer === targetLayerId) return;

    const draggedLayerObj = canvas.layers.find(l => l.id === draggedLayer);
    const targetLayerObj = canvas.layers.find(l => l.id === targetLayerId);
    
    if (!draggedLayerObj || !targetLayerObj) return;

    // Swap z-positions
    const draggedZ = draggedLayerObj.position.z;
    const targetZ = targetLayerObj.position.z;

    updateLayer(draggedLayer, {
      position: { ...draggedLayerObj.position, z: targetZ }
    });
    updateLayer(targetLayerId, {
      position: { ...targetLayerObj.position, z: draggedZ }
    });

    setDraggedLayer(null);
  }, [draggedLayer, canvas.layers, updateLayer]);

  const toggleGroupExpansion = useCallback((groupId: UUID) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const getLayerIcon = (type: LayerType): string => {
    switch (type) {
      case LayerType.IMAGE: return '🖼️';
      case LayerType.TEXT: return '📝';
      case LayerType.SHAPE: return '🔷';
      case LayerType.EFFECT: return '✨';
      case LayerType.GROUP: return '📁';
      default: return '📄';
    }
  };

  const getBlendModeOptions = (): BlendMode[] => {
    return Object.values(BlendMode);
  };

  return (
    <div className="layer-manager">
      <div className="layer-manager__header">
        <h3>Layers</h3>
        <div className="layer-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createLayer(LayerType.IMAGE)}
            title="Add Image Layer"
          >
            🖼️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createLayer(LayerType.TEXT)}
            title="Add Text Layer"
          >
            📝
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createLayer(LayerType.SHAPE)}
            title="Add Shape Layer"
          >
            🔷
          </Button>
        </div>
      </div>

      <div className="layer-manager__list">
        {sortedLayers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item ${canvas.activeLayerId === layer.id ? 'active' : ''} ${!layer.visible ? 'hidden' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, layer.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, layer.id)}
            onClick={() => onCanvasChange({ ...canvas, activeLayerId: layer.id })}
          >
            <div className="layer-item__main">
              <div className="layer-controls">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { visible: !layer.visible });
                  }}
                  className={`visibility-toggle ${!layer.visible ? 'hidden' : ''}`}
                >
                  {layer.visible ? '👁️' : '🙈'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { locked: !layer.locked });
                  }}
                  className={`lock-toggle ${layer.locked ? 'locked' : ''}`}
                >
                  {layer.locked ? '🔒' : '🔓'}
                </Button>
              </div>

              <div className="layer-info">
                <div className="layer-icon">{getLayerIcon(layer.type)}</div>
                <div className="layer-details">
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                    className="layer-name-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="layer-meta">
                    {layer.type} • {Math.round(layer.opacity * 100)}%
                  </div>
                </div>
              </div>

              <div className="layer-item__actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(layer.id, 'up');
                  }}
                  title="Move up"
                >
                  ⬆️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveLayer(layer.id, 'down');
                  }}
                  title="Move down"
                >
                  ⬇️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateLayer(layer.id);
                  }}
                  title="Duplicate layer"
                >
                  📋
                </Button>
                {canvas.layers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete "${layer.name}"?`)) {
                        deleteLayer(layer.id);
                      }
                    }}
                    title="Delete layer"
                  >
                    🗑️
                  </Button>
                )}
              </div>
            </div>

            {canvas.activeLayerId === layer.id && (
              <div className="layer-properties">
                <div className="property-group">
                  <label>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={layer.opacity}
                    onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                    className="opacity-slider"
                  />
                  <span className="opacity-value">{Math.round(layer.opacity * 100)}%</span>
                </div>

                <div className="property-group">
                  <label>Blend Mode</label>
                  <select
                    value={layer.blendMode}
                    onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
                    className="blend-mode-select"
                  >
                    {getBlendModeOptions().map(mode => (
                      <option key={mode} value={mode}>
                        {mode.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="property-group">
                  <label>Position</label>
                  <div className="position-inputs">
                    <input
                      type="number"
                      value={Math.round(layer.position.x)}
                      onChange={(e) => updateLayer(layer.id, {
                        position: { ...layer.position, x: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="X"
                      className="position-input"
                    />
                    <input
                      type="number"
                      value={Math.round(layer.position.y)}
                      onChange={(e) => updateLayer(layer.id, {
                        position: { ...layer.position, y: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="Y"
                      className="position-input"
                    />
                  </div>
                </div>

                <div className="property-group">
                  <label>Size</label>
                  <div className="size-inputs">
                    <input
                      type="number"
                      value={Math.round(layer.size.width)}
                      onChange={(e) => updateLayer(layer.id, {
                        size: { ...layer.size, width: parseInt(e.target.value) || 1 }
                      })}
                      placeholder="W"
                      className="size-input"
                      min="1"
                    />
                    <input
                      type="number"
                      value={Math.round(layer.size.height)}
                      onChange={(e) => updateLayer(layer.id, {
                        size: { ...layer.size, height: parseInt(e.target.value) || 1 }
                      })}
                      placeholder="H"
                      className="size-input"
                      min="1"
                    />
                  </div>
                </div>

                <div className="property-group">
                  <label>Rotation</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={layer.rotation}
                    onChange={(e) => updateLayer(layer.id, { rotation: parseInt(e.target.value) })}
                    className="rotation-slider"
                  />
                  <span className="rotation-value">{layer.rotation}°</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .layer-manager {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .layer-manager__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-elevated);
        }

        .layer-manager__header h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .layer-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .layer-manager__list {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-sm);
        }

        .layer-item {
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-xs);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .layer-item:hover {
          background: var(--color-surface-hover);
        }

        .layer-item.active {
          background: var(--color-primary-subtle);
          border: 1px solid var(--color-primary);
        }

        .layer-item.hidden {
          opacity: 0.5;
        }

        .layer-item__main {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
        }

        .layer-controls {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .visibility-toggle.hidden,
        .lock-toggle.locked {
          background: var(--color-warning-subtle);
        }

        .layer-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          flex: 1;
          min-width: 0;
        }

        .layer-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .layer-details {
          flex: 1;
          min-width: 0;
        }

        .layer-name-input {
          background: transparent;
          border: none;
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          width: 100%;
          padding: 2px 4px;
          border-radius: var(--radius-xs);
          font-size: var(--font-size-sm);
        }

        .layer-name-input:focus {
          outline: none;
          background: var(--color-surface);
          border: 1px solid var(--color-primary);
        }

        .layer-meta {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          text-transform: capitalize;
        }

        .layer-item__actions {
          display: flex;
          gap: var(--spacing-xs);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .layer-item:hover .layer-item__actions {
          opacity: 1;
        }

        .layer-properties {
          padding: var(--spacing-md);
          border-top: 1px solid var(--color-border);
          background: var(--color-surface-elevated);
        }

        .property-group {
          margin-bottom: var(--spacing-md);
        }

        .property-group:last-child {
          margin-bottom: 0;
        }

        .property-group label {
          display: block;
          margin-bottom: var(--spacing-xs);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .opacity-slider,
        .rotation-slider {
          width: 100%;
          margin-right: var(--spacing-sm);
        }

        .opacity-value,
        .rotation-value {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          min-width: 40px;
          text-align: right;
        }

        .blend-mode-select {
          width: 100%;
          padding: var(--spacing-xs);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .position-inputs,
        .size-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-xs);
        }

        .position-input,
        .size-input {
          padding: var(--spacing-xs);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          text-align: center;
        }

        .position-input:focus,
        .size-input:focus,
        .blend-mode-select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-subtle);
        }
      `}</style>
    </div>
  );
};