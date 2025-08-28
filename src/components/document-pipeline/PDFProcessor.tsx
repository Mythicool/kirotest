import React, { useState, useCallback, useRef } from 'react';
import { PDFProcessingOptions, OCRResult } from '@/types/document-pipeline';
import Button from '@/components/ui/Button';

interface PDFProcessorProps {
  onTextExtracted: (text: string, ocrResult?: OCRResult) => void;
  onError: (error: string) => void;
}

export const PDFProcessor: React.FC<PDFProcessorProps> = ({
  onTextExtracted,
  onError
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'edit' | 'ocr'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setExtractedText('');
      setOcrResult(null);
    } else {
      onError('Please select a valid PDF file');
    }
  }, [onError]);

  const openPdfEscape = useCallback(() => {
    if (!selectedFile) {
      onError('Please select a PDF file first');
      return;
    }

    // In a real implementation, this would upload the file to PdfEscape
    // For now, we'll simulate the integration
    const pdfEscapeUrl = 'https://www.pdfescape.com/open/';
    window.open(pdfEscapeUrl, '_blank', 'width=1200,height=800');
    
    setActiveTab('edit');
  }, [selectedFile, onError]);

  const performOCR = useCallback(async (options: PDFProcessingOptions = {}) => {
    if (!selectedFile) {
      onError('Please select a PDF file first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessingStep('Preparing PDF for OCR...');

    try {
      // Simulate OCR processing steps
      const steps = [
        { progress: 20, message: 'Uploading PDF to OnlineOCR...' },
        { progress: 40, message: 'Converting PDF pages to images...' },
        { progress: 60, message: 'Performing optical character recognition...' },
        { progress: 80, message: 'Processing text and formatting...' },
        { progress: 100, message: 'OCR complete!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(step.progress);
        setProcessingStep(step.message);
      }

      // Simulate OCR result
      const mockOcrResult: OCRResult = {
        text: generateMockExtractedText(),
        confidence: 0.95,
        language: options.ocrLanguage || 'en',
        boundingBoxes: [
          {
            text: 'Sample Document',
            x: 100,
            y: 50,
            width: 200,
            height: 30,
            confidence: 0.98
          },
          {
            text: 'This is extracted text from the PDF document.',
            x: 100,
            y: 100,
            width: 400,
            height: 20,
            confidence: 0.92
          }
        ]
      };

      setExtractedText(mockOcrResult.text);
      setOcrResult(mockOcrResult);
      onTextExtracted(mockOcrResult.text, mockOcrResult);
      setActiveTab('ocr');

    } catch (error) {
      onError(error instanceof Error ? error.message : 'OCR processing failed');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProgress(0);
    }
  }, [selectedFile, onTextExtracted, onError]);

  const generateMockExtractedText = (): string => {
    return `Sample Document

This is a sample text extracted from a PDF document using OCR technology.

The document contains various types of content including:
• Headers and titles
• Paragraphs of text
• Lists and bullet points
• Tables and structured data

OCR Confidence: 95%
Language: English
Processing Date: ${new Date().toLocaleString()}

This text would normally be the actual content extracted from your PDF file. The OCR process analyzes the visual elements of the document and converts them into editable text format.

Key Features:
- High accuracy text recognition
- Multiple language support
- Preserves document structure
- Identifies text formatting

For best results, ensure your PDF has clear, high-resolution text and minimal background noise or distortion.`;
  };

  const downloadExtractedText = useCallback(() => {
    if (!extractedText) return;

    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [extractedText]);

  const renderUploadTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Select PDF File</label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="w-full p-2 border rounded-md"
        />
      </div>

      {selectedFile && (
        <div className="bg-gray-50 p-3 rounded-md">
          <h4 className="font-medium mb-2">Selected File</h4>
          <div className="text-sm text-gray-600">
            <p><strong>Name:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Type:</strong> {selectedFile.type}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={openPdfEscape}
          disabled={!selectedFile}
          className="w-full"
        >
          Edit with PdfEscape
        </Button>
        <Button
          onClick={() => performOCR()}
          disabled={!selectedFile || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Extract Text (OCR)'}
        </Button>
      </div>
    </div>
  );

  const renderEditTab = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">PdfEscape Integration</h4>
        <p className="text-sm text-gray-700 mb-3">
          PdfEscape allows you to edit PDF files directly in your browser without installing software.
        </p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Add text and annotations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Fill out forms</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Insert images and shapes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Delete or modify existing content</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button onClick={openPdfEscape} disabled={!selectedFile}>
          Open in PdfEscape
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          This will open PdfEscape in a new window
        </p>
      </div>

      {/* Mock PdfEscape Interface */}
      <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ height: '400px' }}>
        <div className="bg-gray-800 text-white p-2 text-sm">
          PdfEscape Editor (Demo)
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium mb-2">PDF Editor Interface</h3>
            <p className="text-gray-600 max-w-md">
              In a real implementation, this would show the embedded PdfEscape editor
              with full PDF editing capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOCRTab = () => (
    <div className="space-y-4">
      {isProcessing && (
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">OCR Processing</span>
            <span className="text-sm">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{processingStep}</p>
        </div>
      )}

      {ocrResult && (
        <div className="bg-green-50 p-4 rounded-md">
          <h4 className="font-medium mb-2">OCR Results</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Confidence:</strong> {(ocrResult.confidence * 100).toFixed(1)}%
            </div>
            <div>
              <strong>Language:</strong> {ocrResult.language.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {extractedText && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Extracted Text</label>
            <Button size="sm" onClick={downloadExtractedText}>
              Download Text
            </Button>
          </div>
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            className="w-full h-64 p-3 border rounded-md font-mono text-sm"
            placeholder="Extracted text will appear here..."
          />
          <p className="text-sm text-gray-600 mt-2">
            Word count: {extractedText.split(/\s+/).filter(word => word.length > 0).length}
          </p>
        </div>
      )}

      {!extractedText && !isProcessing && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium mb-2">No Text Extracted Yet</h3>
          <p className="text-gray-600 mb-4">
            Upload a PDF file and run OCR to extract text content.
          </p>
          <Button onClick={() => setActiveTab('upload')}>
            Upload PDF File
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-4">PDF Processing</h3>
        
        {/* Tab Navigation */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload & Process
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'edit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            PDF Editor
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'ocr'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Text Extraction
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'edit' && renderEditTab()}
        {activeTab === 'ocr' && renderOCRTab()}
      </div>
    </div>
  );
};