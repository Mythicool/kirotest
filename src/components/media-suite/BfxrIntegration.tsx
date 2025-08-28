import React, { useRef, useEffect, useState } from 'react';
import { MediaFile } from '@/types/media-suite';
import { Button } from '@/components/ui/Button';

interface BfxrIntegrationProps {
  onSoundGenerated: (audioFile: MediaFile) => void;
  onClose: () => void;
}

export const BfxrIntegration: React.FC<BfxrIntegrationProps> = ({
  onSoundGenerated,
  onClose
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load bfxr in iframe
    if (iframeRef.current) {
      iframeRef.current.src = 'https://www.bfxr.net/';
    }

    // Listen for messages from bfxr iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.bfxr.net') return;

      if (event.data.type === 'SOUND_GENERATED') {
        handleSoundGenerated(event.data.audioData);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSoundGenerated = async (audioData: ArrayBuffer) => {
    try {
      // Convert audio data to MediaFile
      const blob = new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      const mediaFile: MediaFile = {
        id: crypto.randomUUID(),
        name: `Sound Effect ${Date.now()}.wav`,
        type: 'audio',
        format: 'audio/wav',
        size: blob.size,
        url,
        metadata: {
          customProperties: {
            source: 'bfxr',
            generated: true
          }
        }
      };

      // Get duration
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        mediaFile.duration = audio.duration;
        onSoundGenerated(mediaFile);
      };
    } catch (error) {
      console.error('Error processing generated sound:', error);
    }
  };

  const generateRandomSound = () => {
    // Send message to bfxr iframe to generate random sound
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'GENERATE_RANDOM'
      }, 'https://www.bfxr.net');
    }
  };

  const generatePreset = (preset: string) => {
    // Send message to bfxr iframe to generate preset sound
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'GENERATE_PRESET',
        preset
      }, 'https://www.bfxr.net');
    }
  };

  return (
    <div className="bfxr-integration">
      <div className="bfxr-header">
        <h3>Sound Effects Generator (bfxr)</h3>
        <div className="bfxr-controls">
          <div className="preset-buttons">
            <Button
              size="small"
              onClick={() => generatePreset('pickup')}
            >
              Pickup/Coin
            </Button>
            <Button
              size="small"
              onClick={() => generatePreset('laser')}
            >
              Laser/Shoot
            </Button>
            <Button
              size="small"
              onClick={() => generatePreset('explosion')}
            >
              Explosion
            </Button>
            <Button
              size="small"
              onClick={() => generatePreset('powerup')}
            >
              Power Up
            </Button>
            <Button
              size="small"
              onClick={() => generatePreset('hit')}
            >
              Hit/Hurt
            </Button>
            <Button
              size="small"
              onClick={() => generatePreset('jump')}
            >
              Jump
            </Button>
            <Button
              size="small"
              onClick={() => generatePreset('blip')}
            >
              Blip/Select
            </Button>
            <Button
              size="small"
              onClick={generateRandomSound}
            >
              Random
            </Button>
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>

      <div className="bfxr-content">
        {isLoading && (
          <div className="loading-overlay">
            <p>Loading bfxr sound generator...</p>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          className="bfxr-iframe"
          title="bfxr Sound Generator"
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      <div className="bfxr-instructions">
        <h4>How to use:</h4>
        <ol>
          <li>Click a preset button above or use the Random button</li>
          <li>Adjust parameters in the bfxr interface</li>
          <li>Click "Export Wav" in bfxr to generate the sound</li>
          <li>The sound will be automatically added to your project</li>
        </ol>
      </div>
    </div>
  );
};