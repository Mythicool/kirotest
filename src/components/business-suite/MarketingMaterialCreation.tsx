import React, { useState } from 'react';
import { MarketingMaterial, BusinessSettings } from '@/types/business-suite';
import Button from '@/components/ui/Button';

interface MarketingMaterialCreationProps {
  materials: MarketingMaterial[];
  settings: BusinessSettings;
  onMaterialUpdate: (materials: MarketingMaterial[]) => void;
}

export const MarketingMaterialCreation: React.FC<MarketingMaterialCreationProps> = ({
  materials,
  settings,
  onMaterialUpdate
}) => {
  const [activeView, setActiveView] = useState<'gallery' | 'create' | 'edit'>('gallery');
  const [selectedMaterial, setSelectedMaterial] = useState<MarketingMaterial | null>(null);
  const [materialType, setMaterialType] = useState<'logo' | 'banner' | 'flyer' | 'business-card' | 'social-media'>('logo');
  const [isCreating, setIsCreating] = useState(false);

  const designTools = {
    logo: [
      { name: 'Canva Logo Maker', url: 'https://www.canva.com/create/logos/', description: 'Professional logo design' },
      { name: 'LogoMakr', url: 'https://logomakr.com/', description: 'Simple logo creation' },
      { name: 'Hatchful', url: 'https://hatchful.shopify.com/', description: 'Free logo maker by Shopify' }
    ],
    banner: [
      { name: 'Canva Banner Maker', url: 'https://www.canva.com/create/banners/', description: 'Web and print banners' },
      { name: 'BannerSnack', url: 'https://www.bannersnack.com/', description: 'Animated banner creator' },
      { name: 'Adobe Express', url: 'https://www.adobe.com/express/', description: 'Professional banner design' }
    ],
    flyer: [
      { name: 'Canva Flyer Maker', url: 'https://www.canva.com/create/flyers/', description: 'Event and business flyers' },
      { name: 'PosterMyWall', url: 'https://www.postermywall.com/', description: 'Flyer and poster design' },
      { name: 'Lucidpress', url: 'https://www.lucidpress.com/', description: 'Professional print materials' }
    ],
    'business-card': [
      { name: 'Canva Business Cards', url: 'https://www.canva.com/create/business-cards/', description: 'Professional business cards' },
      { name: 'Vistaprint Design Tool', url: 'https://www.vistaprint.com/business-cards', description: 'Print-ready business cards' },
      { name: 'Adobe Express Cards', url: 'https://www.adobe.com/express/create/business-card', description: 'Custom business card design' }
    ],
    'social-media': [
      { name: 'Canva Social Media', url: 'https://www.canva.com/create/social-media-graphics/', description: 'Social media graphics' },
      { name: 'Pablo by Buffer', url: 'https://pablo.buffer.com/', description: 'Quick social media images' },
      { name: 'Crello', url: 'https://crello.com/', description: 'Animated social media content' }
    ]
  };

  const handleCreateMaterial = async (toolUrl: string, toolName: string) => {
    setIsCreating(true);
    
    // Open design tool in new window
    const designWindow = window.open(toolUrl, '_blank', 'width=1200,height=800');
    
    // Simulate material creation process
    setTimeout(() => {
      const newMaterial: MarketingMaterial = {
        id: `material-${Date.now()}`,
        name: `${materialType} created with ${toolName}`,
        type: materialType,
        format: materialType === 'logo' ? 'png' : materialType === 'social-media' ? 'jpg' : 'pdf',
        url: `https://example.com/materials/${Date.now()}`,
        dimensions: getDimensionsForType(materialType),
        createdDate: new Date(),
        tags: [materialType, toolName.toLowerCase()]
      };
      
      const updatedMaterials = [...materials, newMaterial];
      onMaterialUpdate(updatedMaterials);
      setIsCreating(false);
      setActiveView('gallery');
    }, 3000);
  };

  const getDimensionsForType = (type: string) => {
    switch (type) {
      case 'logo':
        return { width: 500, height: 500 };
      case 'banner':
        return { width: 1200, height: 300 };
      case 'flyer':
        return { width: 612, height: 792 };
      case 'business-card':
        return { width: 350, height: 200 };
      case 'social-media':
        return { width: 1080, height: 1080 };
      default:
        return { width: 800, height: 600 };
    }
  };

  const renderMaterialGallery = () => (
    <div className="material-gallery">
      <div className="gallery-header">
        <h3>Marketing Materials</h3>
        <Button onClick={() => setActiveView('create')} className="primary">
          Create New Material
        </Button>
      </div>
      
      <div className="material-filters">
        <select onChange={(e) => setMaterialType(e.target.value as any)}>
          <option value="">All Types</option>
          <option value="logo">Logos</option>
          <option value="banner">Banners</option>
          <option value="flyer">Flyers</option>
          <option value="business-card">Business Cards</option>
          <option value="social-media">Social Media</option>
        </select>
        
        <input 
          type="text"
          placeholder="Search materials..."
          className="search-input"
        />
      </div>
      
      <div className="materials-grid">
        {materials.map(material => (
          <div key={material.id} className="material-card">
            <div className="material-preview">
              {material.thumbnail ? (
                <img src={material.thumbnail} alt={material.name} />
              ) : (
                <div className="placeholder-preview">
                  <span className="material-type-icon">
                    {material.type === 'logo' && '🎨'}
                    {material.type === 'banner' && '🖼️'}
                    {material.type === 'flyer' && '📄'}
                    {material.type === 'business-card' && '💳'}
                    {material.type === 'social-media' && '📱'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="material-info">
              <h4>{material.name}</h4>
              <div className="material-meta">
                <span className="material-type">{material.type}</span>
                <span className="material-format">{material.format.toUpperCase()}</span>
                <span className="material-dimensions">
                  {material.dimensions.width}×{material.dimensions.height}
                </span>
              </div>
              <div className="material-date">
                Created: {material.createdDate.toLocaleDateString()}
              </div>
              <div className="material-tags">
                {material.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
            
            <div className="material-actions">
              <Button 
                onClick={() => window.open(material.url, '_blank')}
                className="small"
              >
                Download
              </Button>
              <Button 
                onClick={() => {
                  setSelectedMaterial(material);
                  setActiveView('edit');
                }}
                className="small secondary"
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
        
        {materials.length === 0 && (
          <div className="empty-gallery">
            <h4>No marketing materials yet</h4>
            <p>Create your first marketing material to get started</p>
            <Button onClick={() => setActiveView('create')} className="primary">
              Create Material
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateMaterial = () => (
    <div className="create-material">
      <div className="create-header">
        <h3>Create Marketing Material</h3>
        <Button onClick={() => setActiveView('gallery')} className="secondary">
          Back to Gallery
        </Button>
      </div>
      
      <div className="material-type-selection">
        <h4>What would you like to create?</h4>
        <div className="type-options">
          {Object.keys(designTools).map(type => (
            <div 
              key={type}
              className={`type-option ${materialType === type ? 'selected' : ''}`}
              onClick={() => setMaterialType(type as any)}
            >
              <div className="type-icon">
                {type === 'logo' && '🎨'}
                {type === 'banner' && '🖼️'}
                {type === 'flyer' && '📄'}
                {type === 'business-card' && '💳'}
                {type === 'social-media' && '📱'}
              </div>
              <div className="type-name">
                {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="design-tools">
        <h4>Choose a Design Tool</h4>
        <div className="tools-grid">
          {designTools[materialType].map(tool => (
            <div key={tool.name} className="tool-card">
              <h5>{tool.name}</h5>
              <p>{tool.description}</p>
              <Button 
                onClick={() => handleCreateMaterial(tool.url, tool.name)}
                className="primary"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Use This Tool'}
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="creation-tips">
        <h4>Design Tips for {materialType.replace('-', ' ')}</h4>
        <div className="tips-list">
          {materialType === 'logo' && (
            <>
              <div className="tip">Keep it simple and memorable</div>
              <div className="tip">Use your brand colors</div>
              <div className="tip">Ensure it works in black and white</div>
              <div className="tip">Make it scalable for different sizes</div>
            </>
          )}
          {materialType === 'banner' && (
            <>
              <div className="tip">Use high-contrast colors for readability</div>
              <div className="tip">Keep text large and clear</div>
              <div className="tip">Include a clear call-to-action</div>
              <div className="tip">Optimize for web or print dimensions</div>
            </>
          )}
          {materialType === 'flyer' && (
            <>
              <div className="tip">Use hierarchy to guide the eye</div>
              <div className="tip">Include essential contact information</div>
              <div className="tip">Use high-quality images</div>
              <div className="tip">Leave white space for readability</div>
            </>
          )}
          {materialType === 'business-card' && (
            <>
              <div className="tip">Include only essential information</div>
              <div className="tip">Use readable fonts (minimum 8pt)</div>
              <div className="tip">Consider both sides of the card</div>
              <div className="tip">Use standard business card dimensions</div>
            </>
          )}
          {materialType === 'social-media' && (
            <>
              <div className="tip">Use platform-specific dimensions</div>
              <div className="tip">Keep text minimal and impactful</div>
              <div className="tip">Use bright, engaging colors</div>
              <div className="tip">Include your brand elements</div>
            </>
          )}
        </div>
      </div>
      
      {isCreating && (
        <div className="creation-progress">
          <div className="progress-indicator">
            <div className="spinner"></div>
            <p>Creating your {materialType}...</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderEditMaterial = () => {
    if (!selectedMaterial) return null;
    
    return (
      <div className="edit-material">
        <div className="edit-header">
          <h3>Edit Material: {selectedMaterial.name}</h3>
          <Button onClick={() => setActiveView('gallery')} className="secondary">
            Back to Gallery
          </Button>
        </div>
        
        <div className="edit-content">
          <div className="material-preview-large">
            {selectedMaterial.thumbnail ? (
              <img src={selectedMaterial.thumbnail} alt={selectedMaterial.name} />
            ) : (
              <div className="placeholder-preview-large">
                <span className="material-type-icon-large">
                  {selectedMaterial.type === 'logo' && '🎨'}
                  {selectedMaterial.type === 'banner' && '🖼️'}
                  {selectedMaterial.type === 'flyer' && '📄'}
                  {selectedMaterial.type === 'business-card' && '💳'}
                  {selectedMaterial.type === 'social-media' && '📱'}
                </span>
              </div>
            )}
          </div>
          
          <div className="material-details">
            <div className="detail-section">
              <h4>Material Information</h4>
              <div className="detail-item">
                <label>Name:</label>
                <input 
                  type="text"
                  value={selectedMaterial.name}
                  onChange={(e) => {
                    const updatedMaterial = { ...selectedMaterial, name: e.target.value };
                    setSelectedMaterial(updatedMaterial);
                    const updatedMaterials = materials.map(m => 
                      m.id === selectedMaterial.id ? updatedMaterial : m
                    );
                    onMaterialUpdate(updatedMaterials);
                  }}
                />
              </div>
              <div className="detail-item">
                <label>Type:</label>
                <span>{selectedMaterial.type}</span>
              </div>
              <div className="detail-item">
                <label>Format:</label>
                <span>{selectedMaterial.format.toUpperCase()}</span>
              </div>
              <div className="detail-item">
                <label>Dimensions:</label>
                <span>{selectedMaterial.dimensions.width}×{selectedMaterial.dimensions.height}</span>
              </div>
              <div className="detail-item">
                <label>Created:</label>
                <span>{selectedMaterial.createdDate.toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Tags</h4>
              <div className="tags-editor">
                {selectedMaterial.tags.map(tag => (
                  <span key={tag} className="tag editable">
                    {tag}
                    <button 
                      onClick={() => {
                        const updatedTags = selectedMaterial.tags.filter(t => t !== tag);
                        const updatedMaterial = { ...selectedMaterial, tags: updatedTags };
                        setSelectedMaterial(updatedMaterial);
                        const updatedMaterials = materials.map(m => 
                          m.id === selectedMaterial.id ? updatedMaterial : m
                        );
                        onMaterialUpdate(updatedMaterials);
                      }}
                      className="remove-tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input 
                  type="text"
                  placeholder="Add tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newTag = e.currentTarget.value.trim();
                      const updatedTags = [...selectedMaterial.tags, newTag];
                      const updatedMaterial = { ...selectedMaterial, tags: updatedTags };
                      setSelectedMaterial(updatedMaterial);
                      const updatedMaterials = materials.map(m => 
                        m.id === selectedMaterial.id ? updatedMaterial : m
                      );
                      onMaterialUpdate(updatedMaterials);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="tag-input"
                />
              </div>
            </div>
            
            <div className="detail-section">
              <h4>Actions</h4>
              <div className="action-buttons">
                <Button 
                  onClick={() => window.open(selectedMaterial.url, '_blank')}
                  className="primary"
                >
                  Download Original
                </Button>
                <Button 
                  onClick={() => {
                    // Find appropriate tool for editing
                    const tools = designTools[selectedMaterial.type];
                    if (tools.length > 0) {
                      window.open(tools[0].url, '_blank');
                    }
                  }}
                  className="secondary"
                >
                  Edit in Design Tool
                </Button>
                <Button 
                  onClick={() => {
                    const updatedMaterials = materials.filter(m => m.id !== selectedMaterial.id);
                    onMaterialUpdate(updatedMaterials);
                    setActiveView('gallery');
                  }}
                  className="danger"
                >
                  Delete Material
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="marketing-material-creation">
      {activeView === 'gallery' && renderMaterialGallery()}
      {activeView === 'create' && renderCreateMaterial()}
      {activeView === 'edit' && renderEditMaterial()}
    </div>
  );
};