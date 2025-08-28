import React, { useState, useRef } from 'react';
import { UserPreferences } from '@/types/gaming-hub';
import Button from '@/components/ui/Button';

interface ContentCreationToolsProps {
  preferences: UserPreferences;
  onContentCreate: (content: any) => void;
}

export const ContentCreationTools: React.FC<ContentCreationToolsProps> = ({
  preferences,
  onContentCreate,
}) => {
  const [activeTool, setActiveTool] = useState<'drawing' | 'meme' | 'music' | null>(null);
  const [drawingData, setDrawingData] = useState<string>('');
  const [memeText, setMemeText] = useState({ top: '', bottom: '' });
  const [selectedMemeTemplate, setSelectedMemeTemplate] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawingTools = [
    {
      id: 'sketchpad',
      name: 'Sketchpad',
      description: 'Simple drawing and sketching tool',
      url: 'https://sketch.io/sketchpad',
      features: ['brushes', 'colors', 'layers'],
    },
    {
      id: 'autodraw',
      name: 'AutoDraw',
      description: 'AI-powered drawing suggestions',
      url: 'https://www.autodraw.com',
      features: ['ai-suggestions', 'simple-interface'],
    },
    {
      id: 'kleki',
      name: 'Kleki',
      description: 'Advanced painting application',
      url: 'https://kleki.com',
      features: ['advanced-brushes', 'layers', 'filters'],
    },
  ];

  const memeTemplates = [
    { id: 'drake', name: 'Drake Pointing', image: '/memes/drake.jpg' },
    { id: 'distracted', name: 'Distracted Boyfriend', image: '/memes/distracted.jpg' },
    { id: 'woman-cat', name: 'Woman Yelling at Cat', image: '/memes/woman-cat.jpg' },
    { id: 'expanding-brain', name: 'Expanding Brain', image: '/memes/expanding-brain.jpg' },
    { id: 'this-is-fine', name: 'This is Fine', image: '/memes/this-is-fine.jpg' },
  ];

  const musicCreationTools = [
    {
      id: 'beepbox',
      name: 'BeepBox',
      description: 'Chiptune music maker',
      url: 'https://www.beepbox.co',
      features: ['chiptune', 'sequencer', 'export'],
    },
    {
      id: 'soundtrap',
      name: 'Soundtrap',
      description: 'Online music studio',
      url: 'https://www.soundtrap.com',
      features: ['multitrack', 'instruments', 'effects'],
    },
  ];

  const handleDrawingToolSelect = (tool: any) => {
    setActiveTool('drawing');
    // Open drawing tool in iframe or new window
    window.open(tool.url, '_blank', 'width=1200,height=800');
  };

  const handleMemeCreate = () => {
    if (!selectedMemeTemplate || (!memeText.top && !memeText.bottom)) {
      return;
    }

    const memeData = {
      template: selectedMemeTemplate,
      topText: memeText.top,
      bottomText: memeText.bottom,
      createdAt: new Date(),
    };

    onContentCreate({
      type: 'meme',
      data: memeData,
    });

    // Reset form
    setMemeText({ top: '', bottom: '' });
    setSelectedMemeTemplate('');
  };

  const handleCanvasDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fill();
  };

  const handleCanvasSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    onContentCreate({
      type: 'drawing',
      data: {
        imageData: dataUrl,
        createdAt: new Date(),
      },
    });
  };

  const handleCanvasClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="content-creation-tools">
      <div className="tool-selector">
        <h2>Create Content</h2>
        <div className="tool-tabs">
          <Button
            variant={activeTool === 'drawing' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('drawing')}
          >
            Drawing
          </Button>
          <Button
            variant={activeTool === 'meme' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('meme')}
          >
            Memes
          </Button>
          <Button
            variant={activeTool === 'music' ? 'primary' : 'secondary'}
            onClick={() => setActiveTool('music')}
          >
            Music
          </Button>
        </div>
      </div>

      {activeTool === 'drawing' && (
        <div className="drawing-tools">
          <div className="external-tools">
            <h3>Drawing Applications</h3>
            <div className="tool-grid">
              {drawingTools.map((tool) => (
                <div key={tool.id} className="tool-card">
                  <h4>{tool.name}</h4>
                  <p>{tool.description}</p>
                  <div className="tool-features">
                    {tool.features.map((feature) => (
                      <span key={feature} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleDrawingToolSelect(tool)}
                    variant="primary"
                  >
                    Open Tool
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="simple-canvas">
            <h3>Quick Sketch</h3>
            <div className="canvas-container">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="drawing-canvas"
                onMouseDown={handleCanvasDrawing}
                onMouseMove={(e) => {
                  if (e.buttons === 1) handleCanvasDrawing(e);
                }}
              />
              <div className="canvas-controls">
                <Button onClick={handleCanvasSave} variant="primary">
                  Save Drawing
                </Button>
                <Button onClick={handleCanvasClear} variant="secondary">
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTool === 'meme' && (
        <div className="meme-generator">
          <h3>Meme Generator</h3>
          
          <div className="meme-templates">
            <h4>Choose Template</h4>
            <div className="template-grid">
              {memeTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`template-card ${
                    selectedMemeTemplate === template.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedMemeTemplate(template.id)}
                >
                  <img src={template.image} alt={template.name} />
                  <p>{template.name}</p>
                </div>
              ))}
            </div>
          </div>

          {selectedMemeTemplate && (
            <div className="meme-editor">
              <div className="meme-preview">
                <img
                  src={memeTemplates.find(t => t.id === selectedMemeTemplate)?.image}
                  alt="Meme template"
                />
                {memeText.top && (
                  <div className="meme-text meme-text-top">{memeText.top}</div>
                )}
                {memeText.bottom && (
                  <div className="meme-text meme-text-bottom">{memeText.bottom}</div>
                )}
              </div>

              <div className="meme-inputs">
                <input
                  type="text"
                  placeholder="Top text..."
                  value={memeText.top}
                  onChange={(e) => setMemeText(prev => ({ ...prev, top: e.target.value }))}
                  className="meme-input"
                />
                <input
                  type="text"
                  placeholder="Bottom text..."
                  value={memeText.bottom}
                  onChange={(e) => setMemeText(prev => ({ ...prev, bottom: e.target.value }))}
                  className="meme-input"
                />
                <Button
                  onClick={handleMemeCreate}
                  disabled={!memeText.top && !memeText.bottom}
                  variant="primary"
                >
                  Create Meme
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTool === 'music' && (
        <div className="music-creation">
          <h3>Music Creation Tools</h3>
          <div className="music-tool-grid">
            {musicCreationTools.map((tool) => (
              <div key={tool.id} className="music-tool-card">
                <h4>{tool.name}</h4>
                <p>{tool.description}</p>
                <div className="tool-features">
                  {tool.features.map((feature) => (
                    <span key={feature} className="feature-tag">
                      {feature}
                    </span>
                  ))}
                </div>
                <Button
                  onClick={() => window.open(tool.url, '_blank')}
                  variant="primary"
                >
                  Open Studio
                </Button>
              </div>
            ))}
          </div>

          <div className="sound-effects">
            <h4>Sound Effects</h4>
            <p>Create custom sound effects and audio clips</p>
            <Button
              onClick={() => window.open('https://sfxr.me', '_blank')}
              variant="secondary"
            >
              Open Sound Effect Generator
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};