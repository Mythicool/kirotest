import React, { useState, useCallback } from 'react';
import { DocumentFormat, FormatConversionOptions, ConversionProgress } from '@/types/document-pipeline';
import Button from '@/components/ui/Button';

interface FormatConverterProps {
  onConversionComplete: (result: string, format: DocumentFormat) => void;
  onError: (error: string) => void;
}

export const FormatConverter: React.FC<FormatConverterProps> = ({
  onConversionComplete,
  onError
}) => {
  const [sourceContent, setSourceContent] = useState('');
  const [sourceFormat, setSourceFormat] = useState<DocumentFormat>(DocumentFormat.MD);
  const [targetFormat, setTargetFormat] = useState<DocumentFormat>(DocumentFormat.HTML);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const supportedConversions: Record<DocumentFormat, DocumentFormat[]> = {
    [DocumentFormat.MD]: [DocumentFormat.HTML, DocumentFormat.PDF, DocumentFormat.DOCX, DocumentFormat.TEX],
    [DocumentFormat.TEX]: [DocumentFormat.PDF, DocumentFormat.HTML, DocumentFormat.DOCX],
    [DocumentFormat.HTML]: [DocumentFormat.MD, DocumentFormat.PDF, DocumentFormat.DOCX],
    [DocumentFormat.TXT]: [DocumentFormat.MD, DocumentFormat.HTML, DocumentFormat.PDF],
    [DocumentFormat.DOCX]: [DocumentFormat.MD, DocumentFormat.HTML, DocumentFormat.PDF, DocumentFormat.TXT],
    [DocumentFormat.CSV]: [DocumentFormat.TXT, DocumentFormat.HTML],
    [DocumentFormat.XLSX]: [DocumentFormat.CSV, DocumentFormat.TXT],
    [DocumentFormat.PDF]: [DocumentFormat.TXT, DocumentFormat.HTML]
  };

  const convertWithPandoc = useCallback(async (
    content: string,
    options: FormatConversionOptions
  ): Promise<string> => {
    // Simulate Pandoc conversion process
    const conversionId = `conv-${Date.now()}`;
    
    setConversionProgress({
      id: conversionId,
      status: 'processing',
      progress: 0,
      message: 'Initializing conversion...'
    });

    try {
      // Simulate conversion steps
      const steps = [
        { progress: 20, message: 'Parsing source document...' },
        { progress: 40, message: 'Converting format...' },
        { progress: 60, message: 'Applying formatting...' },
        { progress: 80, message: 'Generating output...' },
        { progress: 100, message: 'Conversion complete!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setConversionProgress(prev => prev ? {
          ...prev,
          progress: step.progress,
          message: step.message
        } : null);
      }

      // Simulate actual conversion logic
      let result = content;
      
      if (options.sourceFormat === DocumentFormat.MD && options.targetFormat === DocumentFormat.HTML) {
        result = convertMarkdownToHtml(content);
      } else if (options.sourceFormat === DocumentFormat.MD && options.targetFormat === DocumentFormat.TEX) {
        result = convertMarkdownToLatex(content);
      } else if (options.sourceFormat === DocumentFormat.TEX && options.targetFormat === DocumentFormat.HTML) {
        result = convertLatexToHtml(content);
      } else {
        // Generic conversion placeholder
        result = `<!-- Converted from ${options.sourceFormat} to ${options.targetFormat} -->\n${content}`;
      }

      setConversionProgress(prev => prev ? {
        ...prev,
        status: 'completed',
        result
      } : null);

      return result;

    } catch (error) {
      setConversionProgress(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Conversion failed'
      } : null);
      throw error;
    }
  }, []);

  const convertMarkdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/gim, '<br>');
  };

  const convertMarkdownToLatex = (markdown: string): string => {
    return markdown
      .replace(/^# (.*$)/gim, '\\section{$1}')
      .replace(/^## (.*$)/gim, '\\subsection{$1}')
      .replace(/^### (.*$)/gim, '\\subsubsection{$1}')
      .replace(/\*\*(.*)\*\*/gim, '\\textbf{$1}')
      .replace(/\*(.*)\*/gim, '\\textit{$1}')
      .replace(/```([\s\S]*?)```/gim, '\\begin{verbatim}\n$1\n\\end{verbatim}')
      .replace(/`([^`]+)`/gim, '\\texttt{$1}')
      .replace(/^\- (.*$)/gim, '\\item $1');
  };

  const convertLatexToHtml = (latex: string): string => {
    return latex
      .replace(/\\section\{([^}]+)\}/gim, '<h1>$1</h1>')
      .replace(/\\subsection\{([^}]+)\}/gim, '<h2>$1</h2>')
      .replace(/\\subsubsection\{([^}]+)\}/gim, '<h3>$1</h3>')
      .replace(/\\textbf\{([^}]+)\}/gim, '<strong>$1</strong>')
      .replace(/\\textit\{([^}]+)\}/gim, '<em>$1</em>')
      .replace(/\\texttt\{([^}]+)\}/gim, '<code>$1</code>')
      .replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/gim, '<pre><code>$1</code></pre>')
      .replace(/\\item (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  };

  const handleConvert = useCallback(async () => {
    if (!sourceContent.trim()) {
      onError('Please provide content to convert');
      return;
    }

    setIsConverting(true);
    
    try {
      const options: FormatConversionOptions = {
        sourceFormat,
        targetFormat,
        preserveFormatting: true
      };

      const result = await convertWithPandoc(sourceContent, options);
      onConversionComplete(result, targetFormat);
      
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  }, [sourceContent, sourceFormat, targetFormat, convertWithPandoc, onConversionComplete, onError]);

  const getAvailableTargetFormats = () => {
    return supportedConversions[sourceFormat] || [];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Source Format</label>
          <select
            value={sourceFormat}
            onChange={(e) => setSourceFormat(e.target.value as DocumentFormat)}
            className="w-full p-2 border rounded-md"
          >
            {Object.keys(supportedConversions).map(format => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Target Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Target Format</label>
          <select
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value as DocumentFormat)}
            className="w-full p-2 border rounded-md"
          >
            {getAvailableTargetFormats().map(format => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Source Content Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Source Content</label>
        <textarea
          value={sourceContent}
          onChange={(e) => setSourceContent(e.target.value)}
          placeholder={`Enter your ${sourceFormat.toUpperCase()} content here...`}
          className="w-full h-64 p-3 border rounded-md font-mono text-sm"
          disabled={isConverting}
        />
      </div>

      {/* Conversion Progress */}
      {conversionProgress && (
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Conversion Progress</span>
            <span className="text-sm text-gray-600">{conversionProgress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${conversionProgress.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{conversionProgress.message}</p>
          {conversionProgress.error && (
            <p className="text-sm text-red-600 mt-1">{conversionProgress.error}</p>
          )}
        </div>
      )}

      {/* Convert Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleConvert}
          disabled={isConverting || !sourceContent.trim()}
          className="px-8"
        >
          {isConverting ? 'Converting...' : `Convert to ${targetFormat.toUpperCase()}`}
        </Button>
      </div>

      {/* Conversion Result */}
      {conversionProgress?.result && (
        <div>
          <label className="block text-sm font-medium mb-2">Converted Content</label>
          <textarea
            value={conversionProgress.result}
            readOnly
            className="w-full h-64 p-3 border rounded-md font-mono text-sm bg-gray-50"
          />
        </div>
      )}
    </div>
  );
};