import React, { useState, useCallback, useEffect } from 'react';
import { ColorPalette, CoolorsIntegration as ICoolorsIntegration } from '@/types/creative-studio';
import Button from '@/components/ui/Button';

interface CoolorsIntegrationProps {
  onPaletteSelect?: (palette: ColorPalette) => void;
  onColorSelect?: (color: string) => void;
  className?: string;
}

export const CoolorsIntegration: React.FC<CoolorsIntegrationProps> = ({
  onPaletteSelect,
  onColorSelect,
  className = ''
}) => {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [baseColor, setBaseColor] = useState('#0066cc');
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);

  // Coolors integration implementation
  const coolorsIntegration: ICoolorsIntegration = {
    async generatePalette(baseColor?: string): Promise<ColorPalette> {
      try {
        // Since Coolors doesn't have a public API, we'll simulate palette generation
        // In a real implementation, you would use their API or scrape their website
        const colors = await generateColorsFromBase(baseColor || '#0066cc');
        
        const palette: ColorPalette = {
          id: `palette_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: `Generated Palette ${baseColor ? `from ${baseColor}` : ''}`,
          colors,
          source: 'coolors',
          url: `https://coolors.co/${colors.map(c => c.substring(1)).join('-')}`,
          created: new Date()
        };

        return palette;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to generate palette');
      }
    },

    async searchPalettes(query: string): Promise<ColorPalette[]> {
      try {
        // Simulate search results with predefined palettes
        const searchResults = await searchPredefinedPalettes(query);
        return searchResults;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to search palettes');
      }
    },

    async getTrendingPalettes(): Promise<ColorPalette[]> {
      try {
        // Return some trending/popular palettes
        return getTrendingPalettes();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to get trending palettes');
      }
    }
  };

  // Utility functions for color generation and palette management
  const generateColorsFromBase = async (baseColor: string): Promise<string[]> => {
    // Convert hex to HSL for better color manipulation
    const hsl = hexToHsl(baseColor);
    const colors: string[] = [baseColor];

    // Generate complementary colors
    const complementary = hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
    colors.push(complementary);

    // Generate triadic colors
    const triadic1 = hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
    const triadic2 = hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l);
    colors.push(triadic1, triadic2);

    // Generate analogous color
    const analogous = hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
    colors.push(analogous);

    return colors;
  };

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const searchPredefinedPalettes = async (query: string): Promise<ColorPalette[]> => {
    const predefinedPalettes: ColorPalette[] = [
      {
        id: 'ocean-breeze',
        name: 'Ocean Breeze',
        colors: ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
        source: 'coolors',
        url: 'https://coolors.co/264653-2a9d8f-e9c46a-f4a261-e76f51',
        created: new Date()
      },
      {
        id: 'sunset-vibes',
        name: 'Sunset Vibes',
        colors: ['#f72585', '#b5179e', '#7209b7', '#480ca8', '#3a0ca3'],
        source: 'coolors',
        url: 'https://coolors.co/f72585-b5179e-7209b7-480ca8-3a0ca3',
        created: new Date()
      },
      {
        id: 'forest-calm',
        name: 'Forest Calm',
        colors: ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25'],
        source: 'coolors',
        url: 'https://coolors.co/606c38-283618-fefae0-dda15e-bc6c25',
        created: new Date()
      },
      {
        id: 'modern-minimal',
        name: 'Modern Minimal',
        colors: ['#000000', '#14213d', '#fca311', '#e5e5e5', '#ffffff'],
        source: 'coolors',
        url: 'https://coolors.co/000000-14213d-fca311-e5e5e5-ffffff',
        created: new Date()
      }
    ];

    return predefinedPalettes.filter(palette =>
      palette.name.toLowerCase().includes(query.toLowerCase()) ||
      palette.colors.some(color => color.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const getTrendingPalettes = (): ColorPalette[] => {
    return [
      {
        id: 'trending-1',
        name: 'Warm Autumn',
        colors: ['#8d5524', '#c68642', '#e0ac69', '#f7d794', '#ddbf94'],
        source: 'coolors',
        url: 'https://coolors.co/8d5524-c68642-e0ac69-f7d794-ddbf94',
        created: new Date()
      },
      {
        id: 'trending-2',
        name: 'Cool Blues',
        colors: ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8'],
        source: 'coolors',
        url: 'https://coolors.co/03045e-023e8a-0077b6-0096c7-00b4d8',
        created: new Date()
      },
      {
        id: 'trending-3',
        name: 'Pastel Dreams',
        colors: ['#ffccd5', '#ffb3c6', '#fb8500', '#8ecae6', '#219ebc'],
        source: 'coolors',
        url: 'https://coolors.co/ffccd5-ffb3c6-fb8500-8ecae6-219ebc',
        created: new Date()
      }
    ];
  };

  // Event handlers
  const handleGeneratePalette = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const palette = await coolorsIntegration.generatePalette(baseColor);
      setPalettes(prev => [palette, ...prev]);
      setSelectedPalette(palette);
      
      if (onPaletteSelect) {
        onPaletteSelect(palette);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate palette');
    } finally {
      setIsLoading(false);
    }
  }, [baseColor, onPaletteSelect]);

  const handleSearchPalettes = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await coolorsIntegration.searchPalettes(searchQuery);
      setPalettes(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search palettes');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const handleLoadTrending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const trending = await coolorsIntegration.getTrendingPalettes();
      setPalettes(trending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending palettes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePaletteClick = useCallback((palette: ColorPalette) => {
    setSelectedPalette(palette);
    if (onPaletteSelect) {
      onPaletteSelect(palette);
    }
  }, [onPaletteSelect]);

  const handleColorClick = useCallback((color: string) => {
    if (onColorSelect) {
      onColorSelect(color);
    }
  }, [onColorSelect]);

  const copyColorToClipboard = useCallback(async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      // You could show a toast notification here
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  }, []);

  // Load trending palettes on mount
  useEffect(() => {
    handleLoadTrending();
  }, [handleLoadTrending]);

  return (
    <div className={`coolors-integration ${className}`}>
      <div className="coolors-header">
        <h3>Color Palettes</h3>
        <div className="coolors-actions">
          <div className="color-input-group">
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="base-color-input"
              title="Base color for generation"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleGeneratePalette}
              disabled={isLoading}
            >
              Generate
            </Button>
          </div>
        </div>
      </div>

      <div className="coolors-search">
        <div className="search-input-group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search palettes..."
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && handleSearchPalettes()}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchPalettes}
            disabled={isLoading || !searchQuery.trim()}
          >
            🔍
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLoadTrending}
          disabled={isLoading}
        >
          🔥 Trending
        </Button>
      </div>

      {error && (
        <div className="coolors-error">
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

      <div className="coolors-content">
        {isLoading && (
          <div className="coolors-loading">
            <div className="loading-spinner"></div>
            <p>Loading palettes...</p>
          </div>
        )}

        <div className="palettes-grid">
          {palettes.map((palette) => (
            <div
              key={palette.id}
              className={`palette-card ${selectedPalette?.id === palette.id ? 'selected' : ''}`}
              onClick={() => handlePaletteClick(palette)}
            >
              <div className="palette-colors">
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorClick(color);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      copyColorToClipboard(color);
                    }}
                    title={`${color} (double-click to copy)`}
                  />
                ))}
              </div>
              <div className="palette-info">
                <div className="palette-name">{palette.name}</div>
                <div className="palette-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (palette.url) {
                        window.open(palette.url, '_blank');
                      }
                    }}
                    title="View on Coolors"
                  >
                    🔗
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const colorsText = palette.colors.join(', ');
                      copyColorToClipboard(colorsText);
                    }}
                    title="Copy all colors"
                  >
                    📋
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {palettes.length === 0 && !isLoading && (
          <div className="empty-state">
            <p>No palettes found. Try generating a new palette or searching for different terms.</p>
          </div>
        )}
      </div>

      <style>{`
        .coolors-integration {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .coolors-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          background: var(--color-surface-elevated);
        }

        .coolors-header h3 {
          margin: 0;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .coolors-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .color-input-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .base-color-input {
          width: 40px;
          height: 32px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .coolors-search {
          display: flex;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }

        .search-input-group {
          display: flex;
          flex: 1;
          gap: var(--spacing-xs);
        }

        .search-input {
          flex: 1;
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-subtle);
        }

        .coolors-error {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-error-subtle);
          border-bottom: 1px solid var(--color-error);
        }

        .coolors-error p {
          margin: 0;
          color: var(--color-error);
          font-size: var(--font-size-sm);
        }

        .coolors-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .coolors-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid var(--color-border);
          border-top: 2px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .coolors-loading p {
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }

        .palettes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-md);
        }

        .palette-card {
          background: var(--color-surface-elevated);
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .palette-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .palette-card.selected {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-subtle);
        }

        .palette-colors {
          display: flex;
          height: 120px;
        }

        .color-swatch {
          flex: 1;
          cursor: pointer;
          transition: transform 0.2s ease;
          position: relative;
        }

        .color-swatch:hover {
          transform: scaleY(1.1);
          z-index: 1;
        }

        .palette-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
        }

        .palette-name {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .palette-actions {
          display: flex;
          gap: var(--spacing-xs);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .palette-card:hover .palette-actions {
          opacity: 1;
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
          .coolors-header {
            flex-direction: column;
            gap: var(--spacing-sm);
            align-items: stretch;
          }

          .coolors-search {
            flex-direction: column;
          }

          .palettes-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};