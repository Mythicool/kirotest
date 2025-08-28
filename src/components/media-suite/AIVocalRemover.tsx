import React, { useState, useRef } from 'react';
import { AudioTrack, MediaFile } from '@/types/media-suite';
import { Button } from '@/components/ui/Button';

interface AIVocalRemoverProps {
  tracks: AudioTrack[];
  onProcessComplete: (result: { vocals: MediaFile; instrumental: MediaFile }) => void;
  onClose: () => void;
}

interface ProcessingOptions {
  algorithm: 'center-channel' | 'spectral' | 'ai-enhanced';
  quality: 'fast' | 'balanced' | 'high-quality';
  outputFormat: 'wav' | 'mp3' | 'flac';
}

export const AIVocalRemover: React.FC<AIVocalRemoverProps> = ({
  tracks,
  onProcessComplete,
  onClose
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<ProcessingOptions>({
    algorithm: 'ai-enhanced',
    quality: 'balanced',
    outputFormat: 'wav'
  });
  const workerRef = useRef<Worker | null>(null);

  const processAudio = async () => {
    const track = tracks.find(t => t.id === selectedTrack);
    if (!track) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Load audio file
      const response = await fetch(track.file.url);
      const arrayBuffer = await response.arrayBuffer();
      
      // Create Web Worker for audio processing
      workerRef.current = new Worker('/workers/vocal-remover-worker.js');
      
      workerRef.current.onmessage = (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'PROGRESS':
            setProgress(data.progress);
            break;
            
          case 'COMPLETE':
            handleProcessingComplete(data);
            break;
            
          case 'ERROR':
            console.error('Vocal removal error:', data.error);
            setIsProcessing(false);
            break;
        }
      };

      // Start processing
      workerRef.current.postMessage({
        type: 'PROCESS_AUDIO',
        audioBuffer: arrayBuffer,
        options
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
    }
  };

  const handleProcessingComplete = (data: { vocals: ArrayBuffer; instrumental: ArrayBuffer }) => {
    try {
      // Create MediaFile objects for vocals and instrumental
      const vocalsBlob = new Blob([data.vocals], { type: `audio/${options.outputFormat}` });
      const instrumentalBlob = new Blob([data.instrumental], { type: `audio/${options.outputFormat}` });
      
      const vocalsFile: MediaFile = {
        id: crypto.randomUUID(),
        name: `${tracks.find(t => t.id === selectedTrack)?.name || 'Audio'} - Vocals.${options.outputFormat}`,
        type: 'audio',
        format: `audio/${options.outputFormat}`,
        size: vocalsBlob.size,
        url: URL.createObjectURL(vocalsBlob),
        metadata: {
          customProperties: {
            source: 'ai-vocal-remover',
            type: 'vocals',
            algorithm: options.algorithm
          }
        }
      };

      const instrumentalFile: MediaFile = {
        id: crypto.randomUUID(),
        name: `${tracks.find(t => t.id === selectedTrack)?.name || 'Audio'} - Instrumental.${options.outputFormat}`,
        type: 'audio',
        format: `audio/${options.outputFormat}`,
        size: instrumentalBlob.size,
        url: URL.createObjectURL(instrumentalBlob),
        metadata: {
          customProperties: {
            source: 'ai-vocal-remover',
            type: 'instrumental',
            algorithm: options.algorithm
          }
        }
      };

      onProcessComplete({
        vocals: vocalsFile,
        instrumental: instrumentalFile
      });

    } catch (error) {
      console.error('Error creating processed files:', error);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    }
  };

  const cancelProcessing = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsProcessing(false);
    setProgress(0);
  };

  return (
    <div className="ai-vocal-remover">
      <div className="vocal-remover-header">
        <h3>AI Vocal Remover</h3>
        <Button onClick={onClose}>Close</Button>
      </div>

      <div className="vocal-remover-content">
        <div className="track-selection">
          <h4>Select Audio Track</h4>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            disabled={isProcessing}
          >
            <option value="">Choose a track...</option>
            {tracks.map(track => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>

        <div className="processing-options">
          <h4>Processing Options</h4>
          
          <div className="option-group">
            <label>Algorithm:</label>
            <select
              value={options.algorithm}
              onChange={(e) => setOptions({
                ...options,
                algorithm: e.target.value as ProcessingOptions['algorithm']
              })}
              disabled={isProcessing}
            >
              <option value="center-channel">Center Channel Extraction</option>
              <option value="spectral">Spectral Subtraction</option>
              <option value="ai-enhanced">AI Enhanced (Recommended)</option>
            </select>
          </div>

          <div className="option-group">
            <label>Quality:</label>
            <select
              value={options.quality}
              onChange={(e) => setOptions({
                ...options,
                quality: e.target.value as ProcessingOptions['quality']
              })}
              disabled={isProcessing}
            >
              <option value="fast">Fast (Lower Quality)</option>
              <option value="balanced">Balanced</option>
              <option value="high-quality">High Quality (Slower)</option>
            </select>
          </div>

          <div className="option-group">
            <label>Output Format:</label>
            <select
              value={options.outputFormat}
              onChange={(e) => setOptions({
                ...options,
                outputFormat: e.target.value as ProcessingOptions['outputFormat']
              })}
              disabled={isProcessing}
            >
              <option value="wav">WAV (Uncompressed)</option>
              <option value="mp3">MP3 (Compressed)</option>
              <option value="flac">FLAC (Lossless)</option>
            </select>
          </div>
        </div>

        {isProcessing && (
          <div className="processing-status">
            <h4>Processing Audio...</h4>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p>{Math.round(progress)}% complete</p>
            <Button onClick={cancelProcessing} variant="danger">
              Cancel
            </Button>
          </div>
        )}

        <div className="action-buttons">
          <Button
            onClick={processAudio}
            disabled={!selectedTrack || isProcessing}
            variant="primary"
          >
            {isProcessing ? 'Processing...' : 'Separate Vocals'}
          </Button>
        </div>

        <div className="algorithm-info">
          <h4>Algorithm Information</h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>Center Channel:</strong>
              <p>Fast method that removes center-panned audio. Works best with stereo tracks where vocals are centered.</p>
            </div>
            <div className="info-item">
              <strong>Spectral Subtraction:</strong>
              <p>Advanced frequency domain processing. Better quality but slower processing time.</p>
            </div>
            <div className="info-item">
              <strong>AI Enhanced:</strong>
              <p>Machine learning-based separation. Highest quality results with intelligent vocal detection.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};