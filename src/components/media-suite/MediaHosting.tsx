import React, { useState, useRef } from 'react';
import { MediaFile, MediaHostingOptions } from '@/types/media-suite';
import { Button } from '@/components/ui/Button';

interface MediaHostingProps {
  mediaFiles: MediaFile[];
  onUploadComplete: (url: string) => void;
}

type HostingService = 'clyp' | 'sendvid' | 'local';

export const MediaHosting: React.FC<MediaHostingProps> = ({
  mediaFiles,
  onUploadComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [hostingOptions, setHostingOptions] = useState<MediaHostingOptions>({
    service: 'clyp',
    privacy: 'public',
    title: '',
    description: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  
  const clypRef = useRef<HTMLIFrameElement>(null);
  const sendvidRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToService = async () => {
    const file = mediaFiles.find(f => f.id === selectedFile);
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      let uploadUrl: string;

      switch (hostingOptions.service) {
        case 'clyp':
          uploadUrl = await uploadToClyp(file);
          break;
        case 'sendvid':
          uploadUrl = await uploadToSendVid(file);
          break;
        case 'local':
          uploadUrl = await saveLocally(file);
          break;
        default:
          throw new Error('Invalid hosting service');
      }

      setUploadResult(uploadUrl);
      onUploadComplete(uploadUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadResult('Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadToClyp = async (file: MediaFile): Promise<string> => {
    if (file.type !== 'audio') {
      throw new Error('Clyp only supports audio files');
    }

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // In a real implementation, this would use Clyp's API
    // For now, we'll simulate the upload
    const mockClypUrl = `https://clyp.it/mock-${crypto.randomUUID().slice(0, 8)}`;
    
    return mockClypUrl;
  };

  const uploadToSendVid = async (file: MediaFile): Promise<string> => {
    if (file.type !== 'video') {
      throw new Error('SendVid only supports video files');
    }

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 5) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // In a real implementation, this would use SendVid's API
    const mockSendVidUrl = `https://sendvid.com/mock-${crypto.randomUUID().slice(0, 8)}`;
    
    return mockSendVidUrl;
  };

  const saveLocally = async (file: MediaFile): Promise<string> => {
    // Create download link for local saving
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.click();

    setUploadProgress(100);
    return `Local download: ${file.name}`;
  };

  const openClypInterface = () => {
    if (clypRef.current) {
      clypRef.current.src = 'https://clyp.it/';
    }
  };

  const openSendVidInterface = () => {
    if (sendvidRef.current) {
      sendvidRef.current.src = 'https://sendvid.com/';
    }
  };

  const uploadFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a temporary MediaFile object
      const tempMediaFile: MediaFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type.startsWith('audio/') ? 'audio' : 
              file.type.startsWith('video/') ? 'video' : 'image',
        format: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        metadata: {
          customProperties: {}
        }
      };

      let uploadUrl: string;

      switch (hostingOptions.service) {
        case 'clyp':
          uploadUrl = await uploadToClyp(tempMediaFile);
          break;
        case 'sendvid':
          uploadUrl = await uploadToSendVid(tempMediaFile);
          break;
        case 'local':
          uploadUrl = await saveLocally(tempMediaFile);
          break;
        default:
          throw new Error('Invalid hosting service');
      }

      setUploadResult(uploadUrl);
      onUploadComplete(uploadUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadResult('Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('URL copied to clipboard!');
    });
  };

  const getCompatibleFiles = () => {
    switch (hostingOptions.service) {
      case 'clyp':
        return mediaFiles.filter(f => f.type === 'audio');
      case 'sendvid':
        return mediaFiles.filter(f => f.type === 'video');
      case 'local':
        return mediaFiles;
      default:
        return [];
    }
  };

  const renderServiceInterface = () => {
    switch (hostingOptions.service) {
      case 'clyp':
        return (
          <div className="service-interface">
            <div className="interface-header">
              <h4>Clyp Audio Hosting</h4>
              <Button onClick={openClypInterface}>
                Open Clyp Website
              </Button>
            </div>
            <iframe
              ref={clypRef}
              className="hosting-iframe"
              title="Clyp"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        );

      case 'sendvid':
        return (
          <div className="service-interface">
            <div className="interface-header">
              <h4>SendVid Video Hosting</h4>
              <Button onClick={openSendVidInterface}>
                Open SendVid Website
              </Button>
            </div>
            <iframe
              ref={sendvidRef}
              className="hosting-iframe"
              title="SendVid"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="media-hosting">
      <div className="hosting-header">
        <h3>Media Hosting & Sharing</h3>
        <p>Upload and share your media files using various hosting services</p>
      </div>

      <div className="hosting-options">
        <div className="option-group">
          <label>Hosting Service:</label>
          <select
            value={hostingOptions.service}
            onChange={(e) => {
              setHostingOptions({
                ...hostingOptions,
                service: e.target.value as HostingService
              });
              setSelectedFile('');
            }}
            disabled={isUploading}
          >
            <option value="clyp">Clyp (Audio)</option>
            <option value="sendvid">SendVid (Video)</option>
            <option value="local">Local Download</option>
          </select>
        </div>

        <div className="option-group">
          <label>Select File:</label>
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            disabled={isUploading}
          >
            <option value="">Choose a file...</option>
            {getCompatibleFiles().map(file => (
              <option key={file.id} value={file.id}>
                {file.name} ({file.type})
              </option>
            ))}
          </select>
        </div>

        {hostingOptions.service !== 'local' && (
          <>
            <div className="option-group">
              <label>Privacy:</label>
              <select
                value={hostingOptions.privacy}
                onChange={(e) => setHostingOptions({
                  ...hostingOptions,
                  privacy: e.target.value as MediaHostingOptions['privacy']
                })}
                disabled={isUploading}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="option-group">
              <label>Title:</label>
              <input
                type="text"
                value={hostingOptions.title}
                onChange={(e) => setHostingOptions({
                  ...hostingOptions,
                  title: e.target.value
                })}
                placeholder="Optional title for your upload"
                disabled={isUploading}
              />
            </div>

            <div className="option-group">
              <label>Description:</label>
              <textarea
                value={hostingOptions.description}
                onChange={(e) => setHostingOptions({
                  ...hostingOptions,
                  description: e.target.value
                })}
                placeholder="Optional description"
                disabled={isUploading}
              />
            </div>
          </>
        )}
      </div>

      {isUploading && (
        <div className="upload-progress">
          <h4>Uploading...</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p>{uploadProgress}% complete</p>
        </div>
      )}

      {uploadResult && (
        <div className="upload-result">
          <h4>Upload Complete!</h4>
          <div className="result-url">
            <input
              type="text"
              value={uploadResult}
              readOnly
              className="url-input"
            />
            <Button onClick={() => copyToClipboard(uploadResult)}>
              Copy URL
            </Button>
          </div>
        </div>
      )}

      <div className="upload-actions">
        <Button
          onClick={uploadToService}
          disabled={!selectedFile || isUploading}
          variant="primary"
        >
          {isUploading ? 'Uploading...' : 'Upload Selected File'}
        </Button>

        <Button onClick={uploadFromDevice} disabled={isUploading}>
          Upload from Device
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={hostingOptions.service === 'clyp' ? 'audio/*' : 
                  hostingOptions.service === 'sendvid' ? 'video/*' : '*/*'}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {(hostingOptions.service === 'clyp' || hostingOptions.service === 'sendvid') && (
        renderServiceInterface()
      )}

      <div className="service-info">
        <h4>Hosting Services</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>Clyp:</strong>
            <p>Free audio hosting with easy sharing. Perfect for music, podcasts, and audio recordings.</p>
            <ul>
              <li>Supports MP3, WAV, FLAC, and more</li>
              <li>No registration required</li>
              <li>Direct playback links</li>
              <li>Social media integration</li>
            </ul>
          </div>
          
          <div className="info-item">
            <strong>SendVid:</strong>
            <p>Simple video hosting with privacy options. Great for sharing video content quickly.</p>
            <ul>
              <li>Supports MP4, WebM, AVI, and more</li>
              <li>Privacy controls available</li>
              <li>Mobile-friendly playback</li>
              <li>No account needed</li>
            </ul>
          </div>
          
          <div className="info-item">
            <strong>Local Download:</strong>
            <p>Save files directly to your device for offline use or manual sharing.</p>
            <ul>
              <li>No upload required</li>
              <li>Complete privacy</li>
              <li>Works offline</li>
              <li>All file types supported</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};