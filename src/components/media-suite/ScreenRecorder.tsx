import React, { useState, useRef, useCallback } from 'react';
import { MediaFile, ScreenRecordingOptions } from '@/types/media-suite';
import { Button } from '@/components/ui/Button';

interface ScreenRecorderProps {
  onRecordingComplete: (recordedFile: MediaFile) => void;
}

export const ScreenRecorder: React.FC<ScreenRecorderProps> = ({
  onRecordingComplete
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [options, setOptions] = useState<ScreenRecordingOptions>({
    source: 'screen',
    audio: true,
    quality: 'medium',
    fps: 30
  });
  const [useVileo, setUseVileo] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const vileoRef = useRef<HTMLIFrameElement>(null);

  const startRecording = useCallback(async () => {
    if (useVileo) {
      startVileoRecording();
      return;
    }

    try {
      // Get screen capture stream
      const constraints: DisplayMediaStreamConstraints = {
        video: {
          frameRate: options.fps,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: options.audio
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = getSupportedMimeType();
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: getVideoBitrate(options.quality)
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        handleRecordingComplete();
      };

      // Handle stream end (user stops sharing)
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      startTimer();

    } catch (error) {
      console.error('Error starting screen recording:', error);
      alert('Failed to start screen recording. Please check permissions.');
    }
  }, [options, useVileo]);

  const startVileoRecording = () => {
    setIsRecording(true);
    startTimer();
    
    if (vileoRef.current) {
      vileoRef.current.src = 'https://vileo.app/';
    }
  };

  const stopRecording = useCallback(() => {
    if (useVileo) {
      stopVileoRecording();
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    stopTimer();
  }, [isRecording, useVileo]);

  const stopVileoRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    stopTimer();
    
    // Vileo handles the recording internally
    // User will need to download from Vileo interface
  };

  const pauseRecording = useCallback(() => {
    if (useVileo) return; // Vileo handles pause internally

    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        startTimer();
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        stopTimer();
      }
    }
  }, [isRecording, isPaused, useVileo]);

  const handleRecordingComplete = () => {
    const blob = new Blob(chunksRef.current, { 
      type: getSupportedMimeType() 
    });
    
    const url = URL.createObjectURL(blob);
    const fileName = `Screen Recording ${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    
    const mediaFile: MediaFile = {
      id: crypto.randomUUID(),
      name: fileName,
      type: 'video',
      format: getSupportedMimeType(),
      size: blob.size,
      url,
      metadata: {
        resolution: { width: 1920, height: 1080 },
        fps: options.fps,
        customProperties: {
          source: 'screen-recording',
          recordingOptions: options
        }
      }
    };

    // Get video duration
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      mediaFile.duration = video.duration;
      onRecordingComplete(mediaFile);
    };
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="screen-recorder">
      <div className="recorder-header">
        <h3>Screen Recorder</h3>
        <div className="recorder-mode">
          <label>
            <input
              type="checkbox"
              checked={useVileo}
              onChange={(e) => setUseVileo(e.target.checked)}
              disabled={isRecording}
            />
            Use Vileo (Browser-based)
          </label>
        </div>
      </div>

      {useVileo ? (
        <div className="vileo-recorder">
          <div className="vileo-controls">
            <div className="recording-status">
              {isRecording && (
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  Recording: {formatTime(recordingTime)}
                </div>
              )}
            </div>
            
            <div className="control-buttons">
              <Button
                onClick={isRecording ? stopVileoRecording : startVileoRecording}
                variant={isRecording ? 'danger' : 'primary'}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>
          </div>

          <iframe
            ref={vileoRef}
            className="vileo-iframe"
            title="Vileo Screen Recorder"
            sandbox="allow-scripts allow-same-origin allow-forms allow-camera allow-microphone"
          />
        </div>
      ) : (
        <div className="native-recorder">
          <div className="recording-options">
            <h4>Recording Options</h4>
            
            <div className="option-group">
              <label>Source:</label>
              <select
                value={options.source}
                onChange={(e) => setOptions({
                  ...options,
                  source: e.target.value as ScreenRecordingOptions['source']
                })}
                disabled={isRecording}
              >
                <option value="screen">Entire Screen</option>
                <option value="window">Application Window</option>
                <option value="tab">Browser Tab</option>
              </select>
            </div>

            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.audio}
                  onChange={(e) => setOptions({
                    ...options,
                    audio: e.target.checked
                  })}
                  disabled={isRecording}
                />
                Include Audio
              </label>
            </div>

            <div className="option-group">
              <label>Quality:</label>
              <select
                value={options.quality}
                onChange={(e) => setOptions({
                  ...options,
                  quality: e.target.value as ScreenRecordingOptions['quality']
                })}
                disabled={isRecording}
              >
                <option value="low">Low (Smaller file)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Larger file)</option>
              </select>
            </div>

            <div className="option-group">
              <label>Frame Rate:</label>
              <select
                value={options.fps}
                onChange={(e) => setOptions({
                  ...options,
                  fps: parseInt(e.target.value)
                })}
                disabled={isRecording}
              >
                <option value="15">15 FPS</option>
                <option value="30">30 FPS</option>
                <option value="60">60 FPS</option>
              </select>
            </div>
          </div>

          <div className="recording-controls">
            <div className="recording-status">
              {isRecording && (
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  {isPaused ? 'Paused' : 'Recording'}: {formatTime(recordingTime)}
                </div>
              )}
            </div>

            <div className="control-buttons">
              <Button
                onClick={startRecording}
                disabled={isRecording}
                variant="primary"
              >
                Start Recording
              </Button>
              
              <Button
                onClick={pauseRecording}
                disabled={!isRecording}
                variant="secondary"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                onClick={stopRecording}
                disabled={!isRecording}
                variant="danger"
              >
                Stop Recording
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="recorder-info">
        <h4>Recording Tips</h4>
        <ul>
          <li>Choose the appropriate source for your needs</li>
          <li>Enable audio if you want to record system sounds or microphone</li>
          <li>Higher quality settings result in larger file sizes</li>
          <li>The browser will ask for permission to record your screen</li>
          <li>Vileo provides additional editing features in the browser</li>
        </ul>
      </div>
    </div>
  );
};

function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm';
}

function getVideoBitrate(quality: ScreenRecordingOptions['quality']): number {
  switch (quality) {
    case 'low': return 1000000; // 1 Mbps
    case 'medium': return 2500000; // 2.5 Mbps
    case 'high': return 5000000; // 5 Mbps
    default: return 2500000;
  }
}