import React, { useState, useCallback, useMemo } from 'react';
import { DocumentComparison, DocumentDifference } from '@/types/document-pipeline';
import Button from '@/components/ui/Button';

interface DocumentComparisonProps {
  onComparisonComplete: (comparison: DocumentComparison) => void;
  onError: (error: string) => void;
}

export const DocumentComparisonTool: React.FC<DocumentComparisonProps> = ({
  onComparisonComplete,
  onError
}) => {
  const [document1, setDocument1] = useState('');
  const [document2, setDocument2] = useState('');
  const [document1Name, setDocument1Name] = useState('Document 1');
  const [document2Name, setDocument2Name] = useState('Document 2');
  const [isComparing, setIsComparing] = useState(false);
  const [comparison, setComparison] = useState<DocumentComparison | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified' | 'statistics'>('side-by-side');

  const performComparison = useCallback(async () => {
    if (!document1.trim() || !document2.trim()) {
      onError('Please provide both documents to compare');
      return;
    }

    setIsComparing(true);

    try {
      // Simulate comparison processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const differences = calculateDifferences(document1, document2);
      const similarity = calculateSimilarity(document1, document2, differences);

      const comparisonResult: DocumentComparison = {
        id: `comparison-${Date.now()}`,
        document1: document1Name,
        document2: document2Name,
        differences,
        similarity
      };

      setComparison(comparisonResult);
      onComparisonComplete(comparisonResult);

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Comparison failed');
    } finally {
      setIsComparing(false);
    }
  }, [document1, document2, document1Name, document2Name, onComparisonComplete, onError]);

  const calculateDifferences = (text1: string, text2: string): DocumentDifference[] => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const differences: DocumentDifference[] = [];

    // Simple line-by-line comparison (in a real implementation, you'd use a proper diff algorithm)
    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';

      if (line1 !== line2) {
        if (!line1 && line2) {
          // Addition in document 2
          differences.push({
            type: 'addition',
            position: i,
            newContent: line2,
            line: i + 1
          });
        } else if (line1 && !line2) {
          // Deletion from document 1
          differences.push({
            type: 'deletion',
            position: i,
            oldContent: line1,
            line: i + 1
          });
        } else {
          // Modification
          differences.push({
            type: 'modification',
            position: i,
            oldContent: line1,
            newContent: line2,
            line: i + 1
          });
        }
      }
    }

    return differences;
  };

  const calculateSimilarity = (text1: string, text2: string, differences: DocumentDifference[]): number => {
    const totalLines = Math.max(text1.split('\n').length, text2.split('\n').length);
    const changedLines = differences.length;
    return Math.max(0, (totalLines - changedLines) / totalLines);
  };

  const renderSideBySideView = () => {
    if (!comparison) return null;

    const lines1 = document1.split('\n');
    const lines2 = document2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2 text-red-700">{comparison.document1}</h4>
          <div className="border rounded-md bg-gray-50 p-3 font-mono text-sm max-h-96 overflow-y-auto">
            {Array.from({ length: maxLines }, (_, i) => {
              const line = lines1[i] || '';
              const diff = comparison.differences.find(d => d.line === i + 1);
              const isChanged = diff && (diff.type === 'deletion' || diff.type === 'modification');
              
              return (
                <div
                  key={i}
                  className={`flex ${isChanged ? 'bg-red-100' : ''}`}
                >
                  <span className="w-8 text-gray-400 text-right mr-2">{i + 1}</span>
                  <span className={isChanged ? 'line-through text-red-600' : ''}>{line}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2 text-green-700">{comparison.document2}</h4>
          <div className="border rounded-md bg-gray-50 p-3 font-mono text-sm max-h-96 overflow-y-auto">
            {Array.from({ length: maxLines }, (_, i) => {
              const line = lines2[i] || '';
              const diff = comparison.differences.find(d => d.line === i + 1);
              const isChanged = diff && (diff.type === 'addition' || diff.type === 'modification');
              
              return (
                <div
                  key={i}
                  className={`flex ${isChanged ? 'bg-green-100' : ''}`}
                >
                  <span className="w-8 text-gray-400 text-right mr-2">{i + 1}</span>
                  <span className={isChanged ? 'text-green-600 font-medium' : ''}>{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderUnifiedView = () => {
    if (!comparison) return null;

    const lines1 = document1.split('\n');
    const lines2 = document2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);

    return (
      <div className="border rounded-md bg-gray-50 p-3 font-mono text-sm max-h-96 overflow-y-auto">
        {Array.from({ length: maxLines }, (_, i) => {
          const line1 = lines1[i] || '';
          const line2 = lines2[i] || '';
          const diff = comparison.differences.find(d => d.line === i + 1);

          if (!diff) {
            return (
              <div key={i} className="flex">
                <span className="w-8 text-gray-400 text-right mr-2">{i + 1}</span>
                <span>{line1}</span>
              </div>
            );
          }

          return (
            <div key={i} className="space-y-1">
              {diff.type === 'deletion' || diff.type === 'modification' ? (
                <div className="flex bg-red-100">
                  <span className="w-8 text-gray-400 text-right mr-2">-{i + 1}</span>
                  <span className="line-through text-red-600">{line1}</span>
                </div>
              ) : null}
              {diff.type === 'addition' || diff.type === 'modification' ? (
                <div className="flex bg-green-100">
                  <span className="w-8 text-gray-400 text-right mr-2">+{i + 1}</span>
                  <span className="text-green-600 font-medium">{line2}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStatistics = () => {
    if (!comparison) return null;

    const stats = {
      additions: comparison.differences.filter(d => d.type === 'addition').length,
      deletions: comparison.differences.filter(d => d.type === 'deletion').length,
      modifications: comparison.differences.filter(d => d.type === 'modification').length,
      totalChanges: comparison.differences.length,
      similarity: (comparison.similarity * 100).toFixed(1)
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-green-600">{stats.additions}</div>
          <div className="text-sm text-green-700">Additions</div>
        </div>
        <div className="bg-red-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-red-600">{stats.deletions}</div>
          <div className="text-sm text-red-700">Deletions</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.modifications}</div>
          <div className="text-sm text-blue-700">Modifications</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-gray-600">{stats.totalChanges}</div>
          <div className="text-sm text-gray-700">Total Changes</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.similarity}%</div>
          <div className="text-sm text-purple-700">Similarity</div>
        </div>
      </div>
    );
  };

  const exportComparison = useCallback(() => {
    if (!comparison) return;

    const report = `Document Comparison Report
Generated: ${new Date().toLocaleString()}

Documents Compared:
- ${comparison.document1}
- ${comparison.document2}

Similarity: ${(comparison.similarity * 100).toFixed(1)}%
Total Changes: ${comparison.differences.length}

Detailed Changes:
${comparison.differences.map((diff, index) => 
  `${index + 1}. Line ${diff.line}: ${diff.type.toUpperCase()}
     ${diff.oldContent ? `- ${diff.oldContent}` : ''}
     ${diff.newContent ? `+ ${diff.newContent}` : ''}`
).join('\n\n')}`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [comparison]);

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-4">Document Comparison</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Document 1 Name</label>
            <input
              type="text"
              value={document1Name}
              onChange={(e) => setDocument1Name(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Document 2 Name</label>
            <input
              type="text"
              value={document2Name}
              onChange={(e) => setDocument2Name(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Document 1 Content</label>
            <textarea
              value={document1}
              onChange={(e) => setDocument1(e.target.value)}
              className="w-full h-32 p-2 border rounded-md font-mono text-sm"
              placeholder="Paste or type the first document content..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Document 2 Content</label>
            <textarea
              value={document2}
              onChange={(e) => setDocument2(e.target.value)}
              className="w-full h-32 p-2 border rounded-md font-mono text-sm"
              placeholder="Paste or type the second document content..."
            />
          </div>
        </div>

        <Button
          onClick={performComparison}
          disabled={isComparing || !document1.trim() || !document2.trim()}
          className="w-full"
        >
          {isComparing ? 'Comparing Documents...' : 'Compare Documents'}
        </Button>
      </div>

      {/* Results Section */}
      {comparison && (
        <div className="bg-white p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Comparison Results</h3>
            <div className="flex items-center gap-2">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="p-2 border rounded-md text-sm"
              >
                <option value="side-by-side">Side by Side</option>
                <option value="unified">Unified View</option>
                <option value="statistics">Statistics</option>
              </select>
              <Button size="sm" onClick={exportComparison}>
                Export Report
              </Button>
            </div>
          </div>

          {/* Similarity Score */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="font-medium">Similarity Score</span>
              <span className="text-lg font-bold text-blue-600">
                {(comparison.similarity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${comparison.similarity * 100}%` }}
              />
            </div>
          </div>

          {/* View Content */}
          {viewMode === 'side-by-side' && renderSideBySideView()}
          {viewMode === 'unified' && renderUnifiedView()}
          {viewMode === 'statistics' && renderStatistics()}
        </div>
      )}
    </div>
  );
};