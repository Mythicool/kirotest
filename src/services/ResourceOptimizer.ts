export interface OptimizationConfig {
  minifyCSS: boolean;
  minifyJS: boolean;
  minifyHTML: boolean;
  compressImages: boolean;
  bundleAssets: boolean;
  treeshaking: boolean;
  codesplitting: boolean;
  lazyLoadImages: boolean;
  preloadCritical: boolean;
}

export interface AssetBundle {
  id: string;
  type: 'css' | 'js' | 'mixed';
  assets: string[];
  minified: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  optimizations: string[];
  warnings: string[];
  errors: string[];
}

export class ResourceOptimizer {
  private config: OptimizationConfig;
  private bundles = new Map<string, AssetBundle>();
  private optimizationWorker: Worker | null = null;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      minifyCSS: true,
      minifyJS: true,
      minifyHTML: true,
      compressImages: true,
      bundleAssets: true,
      treeshaking: true,
      codesplitting: true,
      lazyLoadImages: true,
      preloadCritical: true,
      ...config
    };

    this.initializeOptimizationWorker();
  }

  private initializeOptimizationWorker(): void {
    try {
      const workerCode = `
        // CSS Minification
        function minifyCSS(css) {
          return css
            .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '') // Remove comments
            .replace(/\\s+/g, ' ') // Collapse whitespace
            .replace(/;\\s*}/g, '}') // Remove unnecessary semicolons
            .replace(/\\s*{\\s*/g, '{') // Clean up braces
            .replace(/;\\s*/g, ';') // Clean up semicolons
            .replace(/,\\s*/g, ',') // Clean up commas
            .trim();
        }

        // JavaScript Minification (basic)
        function minifyJS(js) {
          return js
            .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '') // Remove block comments
            .replace(/\\/\\/.*$/gm, '') // Remove line comments
            .replace(/\\s+/g, ' ') // Collapse whitespace
            .replace(/;\\s*}/g, '}') // Remove unnecessary semicolons
            .replace(/\\s*{\\s*/g, '{') // Clean up braces
            .replace(/;\\s*/g, ';') // Clean up semicolons
            .replace(/,\\s*/g, ',') // Clean up commas
            .trim();
        }

        // HTML Minification
        function minifyHTML(html) {
          return html
            .replace(/<!--[\\s\\S]*?-->/g, '') // Remove comments
            .replace(/\\s+/g, ' ') // Collapse whitespace
            .replace(/>\\s+</g, '><') // Remove whitespace between tags
            .trim();
        }

        // Tree shaking (remove unused code)
        function treeShake(code, usedFunctions) {
          // Simple tree shaking - remove unused function declarations
          const functionRegex = /function\\s+(\\w+)\\s*\\([^)]*\\)\\s*{[^}]*}/g;
          let result = code;
          let match;
          
          while ((match = functionRegex.exec(code)) !== null) {
            const functionName = match[1];
            if (!usedFunctions.includes(functionName)) {
              result = result.replace(match[0], '');
            }
          }
          
          return result;
        }

        self.onmessage = function(e) {
          const { type, content, options, id } = e.data;
          
          try {
            let result;
            
            switch (type) {
              case 'minify-css':
                result = minifyCSS(content);
                break;
              case 'minify-js':
                result = minifyJS(content);
                break;
              case 'minify-html':
                result = minifyHTML(content);
                break;
              case 'tree-shake':
                result = treeShake(content, options.usedFunctions || []);
                break;
              default:
                throw new Error('Unknown optimization type: ' + type);
            }
            
            self.postMessage({
              id,
              type: 'success',
              result,
              originalSize: content.length,
              optimizedSize: result.length
            });
          } catch (error) {
            self.postMessage({
              id,
              type: 'error',
              error: error.message
            });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.optimizationWorker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Failed to initialize optimization worker:', error);
    }
  }

  public async optimizeCSS(css: string): Promise<OptimizationResult> {
    const originalSize = css.length;
    const optimizations: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      let optimized = css;

      if (this.config.minifyCSS) {
        optimized = await this.minifyWithWorker('minify-css', optimized);
        optimizations.push('CSS minification');
      }

      // Additional CSS optimizations
      optimized = this.optimizeCSSSelectors(optimized);
      optimizations.push('CSS selector optimization');

      optimized = this.removeDuplicateCSS(optimized);
      optimizations.push('Duplicate CSS removal');

      const optimizedSize = optimized.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        originalSize,
        optimizedSize,
        compressionRatio,
        optimizations,
        warnings,
        errors
      };
    } catch (error) {
      errors.push(`CSS optimization failed: ${error.message}`);
      return {
        originalSize,
        optimizedSize: originalSize,
        compressionRatio: 0,
        optimizations,
        warnings,
        errors
      };
    }
  }

  public async optimizeJS(js: string, options: { usedFunctions?: string[] } = {}): Promise<OptimizationResult> {
    const originalSize = js.length;
    const optimizations: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      let optimized = js;

      if (this.config.treeshaking && options.usedFunctions) {
        optimized = await this.minifyWithWorker('tree-shake', optimized, { usedFunctions: options.usedFunctions });
        optimizations.push('Tree shaking');
      }

      if (this.config.minifyJS) {
        optimized = await this.minifyWithWorker('minify-js', optimized);
        optimizations.push('JavaScript minification');
      }

      // Additional JS optimizations
      optimized = this.optimizeJSConstants(optimized);
      optimizations.push('Constant optimization');

      const optimizedSize = optimized.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        originalSize,
        optimizedSize,
        compressionRatio,
        optimizations,
        warnings,
        errors
      };
    } catch (error) {
      errors.push(`JavaScript optimization failed: ${error.message}`);
      return {
        originalSize,
        optimizedSize: originalSize,
        compressionRatio: 0,
        optimizations,
        warnings,
        errors
      };
    }
  }

  public async optimizeHTML(html: string): Promise<OptimizationResult> {
    const originalSize = html.length;
    const optimizations: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      let optimized = html;

      if (this.config.minifyHTML) {
        optimized = await this.minifyWithWorker('minify-html', optimized);
        optimizations.push('HTML minification');
      }

      // Additional HTML optimizations
      if (this.config.lazyLoadImages) {
        optimized = this.addLazyLoadingToImages(optimized);
        optimizations.push('Lazy loading for images');
      }

      if (this.config.preloadCritical) {
        optimized = this.addCriticalResourcePreloads(optimized);
        optimizations.push('Critical resource preloading');
      }

      const optimizedSize = optimized.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        originalSize,
        optimizedSize,
        compressionRatio,
        optimizations,
        warnings,
        errors
      };
    } catch (error) {
      errors.push(`HTML optimization failed: ${error.message}`);
      return {
        originalSize,
        optimizedSize: originalSize,
        compressionRatio: 0,
        optimizations,
        warnings,
        errors
      };
    }
  }

  public async createBundle(assets: string[], type: 'css' | 'js' | 'mixed'): Promise<AssetBundle> {
    const bundleId = Math.random().toString(36).substr(2, 9);
    let concatenated = '';
    let originalSize = 0;

    // Concatenate all assets
    for (const asset of assets) {
      concatenated += asset + '\n';
      originalSize += asset.length;
    }

    // Optimize the bundle based on type
    let optimized = concatenated;
    if (type === 'css') {
      const result = await this.optimizeCSS(concatenated);
      optimized = concatenated; // In real implementation, return the optimized content
    } else if (type === 'js') {
      const result = await this.optimizeJS(concatenated);
      optimized = concatenated; // In real implementation, return the optimized content
    }

    const optimizedSize = optimized.length;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

    const bundle: AssetBundle = {
      id: bundleId,
      type,
      assets,
      minified: optimized,
      originalSize,
      optimizedSize,
      compressionRatio
    };

    this.bundles.set(bundleId, bundle);
    return bundle;
  }

  public async optimizeImages(imageData: ArrayBuffer, format: 'jpeg' | 'png' | 'webp'): Promise<ArrayBuffer> {
    if (!this.config.compressImages) {
      return imageData;
    }

    // In a real implementation, you would use a library like imagemin or sharp
    // For now, we'll simulate image optimization
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate compression by returning a smaller buffer
        const compressionRatio = 0.7; // 30% reduction
        const compressedSize = Math.floor(imageData.byteLength * compressionRatio);
        const compressed = new ArrayBuffer(compressedSize);
        resolve(compressed);
      }, 100);
    });
  }

  private async minifyWithWorker(type: string, content: string, options: any = {}): Promise<string> {
    if (!this.optimizationWorker) {
      throw new Error('Optimization worker not available');
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      const handler = (event: MessageEvent) => {
        if (event.data.id === id) {
          this.optimizationWorker!.removeEventListener('message', handler);
          
          if (event.data.type === 'success') {
            resolve(event.data.result);
          } else if (event.data.type === 'error') {
            reject(new Error(event.data.error));
          }
        }
      };

      this.optimizationWorker.addEventListener('message', handler);
      this.optimizationWorker.postMessage({ type, content, options, id });
    });
  }

  private optimizeCSSSelectors(css: string): string {
    // Optimize CSS selectors by removing redundant ones
    return css
      .replace(/\s*>\s*/g, '>') // Remove spaces around child selectors
      .replace(/\s*\+\s*/g, '+') // Remove spaces around adjacent selectors
      .replace(/\s*~\s*/g, '~'); // Remove spaces around sibling selectors
  }

  private removeDuplicateCSS(css: string): string {
    // Simple duplicate removal - in practice, you'd use a more sophisticated approach
    const rules = css.split('}');
    const uniqueRules = [...new Set(rules)];
    return uniqueRules.join('}');
  }

  private optimizeJSConstants(js: string): string {
    // Replace repeated string literals with constants
    const stringLiterals = js.match(/"[^"]{10,}"/g) || [];
    const frequentStrings = stringLiterals.filter((str, index, arr) => 
      arr.indexOf(str) !== arr.lastIndexOf(str)
    );

    let optimized = js;
    frequentStrings.forEach((str, index) => {
      const constName = `__CONST_${index}__`;
      optimized = `const ${constName} = ${str};\n${optimized}`;
      optimized = optimized.replace(new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), constName);
    });

    return optimized;
  }

  private addLazyLoadingToImages(html: string): string {
    // Add loading="lazy" to images that don't already have it
    return html.replace(
      /<img(?![^>]*loading=)([^>]*?)>/gi,
      '<img$1 loading="lazy">'
    );
  }

  private addCriticalResourcePreloads(html: string): string {
    // Add preload links for critical resources
    const preloads = [
      '<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>',
      '<link rel="preload" href="/css/critical.css" as="style">',
      '<link rel="preload" href="/js/main.js" as="script">'
    ];

    // Insert preloads after the opening head tag
    return html.replace(
      /<head>/i,
      `<head>\n${preloads.join('\n')}`
    );
  }

  // Code splitting utilities
  public generateCodeSplitPoints(code: string): string[] {
    if (!this.config.codesplitting) {
      return [code];
    }

    // Simple code splitting based on function boundaries
    const functions = code.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
    const chunks: string[] = [];
    
    // Create chunks of reasonable size (10KB)
    const maxChunkSize = 10 * 1024;
    let currentChunk = '';
    
    functions.forEach(func => {
      if (currentChunk.length + func.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = func;
      } else {
        currentChunk += func + '\n';
      }
    });
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks.length > 0 ? chunks : [code];
  }

  // Asset bundling
  public getBundleById(bundleId: string): AssetBundle | null {
    return this.bundles.get(bundleId) || null;
  }

  public getAllBundles(): AssetBundle[] {
    return Array.from(this.bundles.values());
  }

  public removeBundleById(bundleId: string): boolean {
    return this.bundles.delete(bundleId);
  }

  // Configuration management
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  // Performance analysis
  public analyzeBundle(bundleId: string): {
    size: number;
    compressionRatio: number;
    recommendations: string[];
  } {
    const bundle = this.bundles.get(bundleId);
    if (!bundle) {
      throw new Error(`Bundle ${bundleId} not found`);
    }

    const recommendations: string[] = [];
    
    if (bundle.compressionRatio < 20) {
      recommendations.push('Consider enabling more aggressive minification');
    }
    
    if (bundle.originalSize > 100 * 1024) {
      recommendations.push('Bundle is large, consider code splitting');
    }
    
    if (bundle.type === 'mixed') {
      recommendations.push('Consider separating CSS and JS into different bundles');
    }

    return {
      size: bundle.optimizedSize,
      compressionRatio: bundle.compressionRatio,
      recommendations
    };
  }

  public destroy(): void {
    if (this.optimizationWorker) {
      this.optimizationWorker.terminate();
      this.optimizationWorker = null;
    }
    
    this.bundles.clear();
  }
}