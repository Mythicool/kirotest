import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSmartRouter } from '@/components/navigation/SmartRouter';
import { WorkspaceType } from '@/types/workspace';
import { CreativeContentStudio } from '@/components/creative-studio';
import { DeveloperWorkflowHub } from '@/components/developer-hub/DeveloperWorkflowHub';
import { DocumentProcessingPipeline } from '@/components/document-pipeline/DocumentProcessingPipeline';
import { MediaProductionSuite } from '@/components/media-suite/MediaProductionSuite';
import { BusinessProductivitySuite } from '@/components/business-suite/BusinessProductivitySuite';
import { GamingEntertainmentHub } from '@/components/gaming-hub/GamingEntertainmentHub';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FileDropZone from '@/components/ui/FileDropZone';

const WorkspaceView: React.FC = () => {
  const { workspaceType, workspaceId } = useParams<{
    workspaceType: string;
    workspaceId: string;
  }>();
  
  const { addBreadcrumb, clearBreadcrumbs, navigateToTool } = useSmartRouter();

  useEffect(() => {
    clearBreadcrumbs();
    if (workspaceType && workspaceId) {
      addBreadcrumb({
        label: formatWorkspaceType(workspaceType as WorkspaceType),
        path: `/workspace/${workspaceType}/${workspaceId}`,
      });
    }
  }, [workspaceType, workspaceId, addBreadcrumb, clearBreadcrumbs]);

  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected in workspace:', files);
    // TODO: Process files and suggest tools
  };

  const getWorkspaceTools = (type: WorkspaceType): Array<{ id: string; name: string; description: string }> => {
    const toolSets: Record<WorkspaceType, Array<{ id: string; name: string; description: string }>> = {
      [WorkspaceType.CREATIVE_STUDIO]: [
        { id: 'photopea', name: 'PhotoPea', description: 'Advanced photo editing' },
        { id: 'pixlr', name: 'Pixlr', description: 'Quick image editing' },
        { id: 'svg-edit', name: 'SVG Edit', description: 'Vector graphics editor' },
        { id: 'coolors', name: 'Coolors', description: 'Color palette generator' },
      ],
      [WorkspaceType.DEVELOPER_HUB]: [
        { id: 'replit', name: 'Repl.it', description: 'Online code editor' },
        { id: 'codepen', name: 'CodePen', description: 'Frontend playground' },
        { id: 'css-minifier', name: 'CSS Minifier', description: 'Optimize CSS code' },
        { id: 'gtmetrix', name: 'GTmetrix', description: 'Performance testing' },
      ],
      [WorkspaceType.DOCUMENT_PIPELINE]: [
        { id: 'dillinger', name: 'Dillinger', description: 'Markdown editor' },
        { id: 'hackmd', name: 'HackMD', description: 'Collaborative editing' },
        { id: 'ethercalc', name: 'EtherCalc', description: 'Online spreadsheet' },
        { id: 'cloud-convert', name: 'Cloud Convert', description: 'File conversion' },
      ],
      [WorkspaceType.MEDIA_SUITE]: [
        { id: 'twistedweb', name: 'TwistedWeb', description: 'Audio editing' },
        { id: 'videotoolbox', name: 'VideoToolbox', description: 'Video processing' },
        { id: 'bfxr', name: 'bfxr', description: 'Sound effects generator' },
        { id: 'vileo', name: 'Vileo', description: 'Screen recording' },
      ],
      [WorkspaceType.PRIVACY_HUB]: [
        { id: 'tlk-io', name: 'Tlk.io', description: 'Anonymous chat' },
        { id: 'firefox-send', name: 'Firefox Send', description: 'Secure file sharing' },
        { id: 'cryptii', name: 'Cryptii', description: 'Text encryption' },
        { id: 'protectedtext', name: 'ProtectedText', description: 'Secure notes' },
      ],
      [WorkspaceType.EDUCATION_PLATFORM]: [
        { id: 'wolframalpha', name: 'WolframAlpha', description: 'Computational engine' },
        { id: 'desmos', name: 'Desmos', description: 'Graphing calculator' },
        { id: 'calculatoria', name: 'Calculatoria', description: 'Scientific calculator' },
        { id: 'graph-editor', name: 'Graph Editor', description: 'Diagram creation' },
      ],
      [WorkspaceType.BUSINESS_SUITE]: [
        { id: 'invoicetome', name: 'InvoiceToMe', description: 'Invoice generator' },
        { id: 'bubbl', name: 'bubbl', description: 'Mind mapping' },
        { id: 'logo-maker', name: 'Logo Maker', description: 'Brand creation' },
        { id: 'seo-tools', name: 'SEO Tools', description: 'Website analysis' },
      ],
      [WorkspaceType.GAMING_HUB]: [
        { id: 'typeracer', name: 'Typeracer', description: 'Typing game' },
        { id: 'agar-io', name: 'agar.io', description: 'Multiplayer game' },
        { id: 'internet-radio', name: 'Internet Radio', description: 'Music streaming' },
        { id: 'drawing-tools', name: 'Drawing Tools', description: 'Creative drawing' },
      ],
    };

    return toolSets[type] || [];
  };

  if (!workspaceType || !workspaceId) {
    return <div>Invalid workspace</div>;
  }

  // If this is a Creative Studio workspace, render the full Creative Content Studio
  if (workspaceType === WorkspaceType.CREATIVE_STUDIO) {
    return (
      <CreativeContentStudio
        workspaceId={workspaceId}
        onWorkspaceChange={(workspace) => {
          console.log('Creative Studio workspace changed:', workspace);
          // TODO: Save workspace changes to storage
        }}
      />
    );
  }

  // If this is a Developer Hub workspace, render the full Developer Workflow Hub
  if (workspaceType === WorkspaceType.DEVELOPER_HUB) {
    return (
      <DeveloperWorkflowHub
        workspaceId={workspaceId}
        onWorkspaceChange={(workspace) => {
          console.log('Developer Hub workspace changed:', workspace);
          // TODO: Save workspace changes to storage
        }}
      />
    );
  }

  // If this is a Document Pipeline workspace, render the full Document Processing Pipeline
  if (workspaceType === WorkspaceType.DOCUMENT_PIPELINE) {
    return <DocumentProcessingPipeline />;
  }

  // If this is a Media Suite workspace, render the full Media Production Suite
  if (workspaceType === WorkspaceType.MEDIA_SUITE) {
    return (
      <MediaProductionSuite
        workspace={{
          id: workspaceId,
          type: 'media-suite',
          audioProjects: [],
          videoProjects: [],
          playlists: [],
          mediaFiles: [],
          settings: {
            defaultAudioSettings: {
              sampleRate: 44100,
              bitDepth: 16,
              channels: 2,
              format: 'wav'
            },
            defaultVideoSettings: {
              resolution: { width: 1920, height: 1080 },
              fps: 30,
              bitrate: 5000000,
              codec: 'h264',
              format: 'mp4'
            },
            autoSave: true,
            exportPath: '/downloads',
            integrations: {
              twistedWeb: true,
              filelab: true,
              bfxr: true,
              aiVocalRemover: true,
              videoToolbox: true,
              vileo: true,
              youtubePlaylists: true,
              ambientMixer: true,
              clyp: true,
              sendvid: true
            }
          }
        }}
        onWorkspaceUpdate={(workspace) => {
          console.log('Media Suite workspace changed:', workspace);
          // TODO: Save workspace changes to storage
        }}
      />
    );
  }

  // If this is a Business Suite workspace, render the full Business Productivity Suite
  if (workspaceType === WorkspaceType.BUSINESS_SUITE) {
    return (
      <BusinessProductivitySuite
        workspace={{
          id: workspaceId,
          name: 'Business Workspace',
          type: 'business-suite',
          invoices: [],
          projects: [],
          clients: [],
          marketingMaterials: [],
          backups: [],
          settings: {
            companyInfo: {
              name: 'Your Business',
              address: {
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'US'
              },
              phone: '',
              email: '',
              currency: 'USD',
              timezone: 'UTC'
            },
            invoiceSettings: {
              defaultTemplate: 'professional',
              invoicePrefix: 'INV',
              nextInvoiceNumber: 1,
              paymentTerms: 30,
              lateFee: 0,
              autoReminders: true,
              reminderDays: [7, 3, 1]
            },
            notificationSettings: {
              emailNotifications: true,
              invoiceReminders: true,
              projectDeadlines: true,
              backupAlerts: true,
              performanceReports: false
            },
            integrationSettings: {
              invoiceToMe: { enabled: true },
              bubbl: { enabled: true },
              cryptoApi: { enabled: false, provider: 'coingecko' },
              videoConferencing: { provider: 'jitsi', roomPrefix: 'business' },
              seoTools: { provider: 'gtmetrix' },
              socialMedia: { platforms: ['facebook', 'twitter', 'linkedin'], schedulingEnabled: true }
            },
            backupSettings: {
              autoBackup: false,
              backupFrequency: 'weekly',
              retentionPeriod: 90,
              encryption: true,
              includeFiles: true
            }
          }
        }}
        onWorkspaceUpdate={(workspace) => {
          console.log('Business Suite workspace changed:', workspace);
          // TODO: Save workspace changes to storage
        }}
      />
    );
  }

  // If this is a Gaming Hub workspace, render the full Gaming & Entertainment Hub
  if (workspaceType === WorkspaceType.GAMING_HUB) {
    return (
      <GamingEntertainmentHub
        onClose={() => {
          // Navigate back to dashboard or previous page
          window.history.back();
        }}
      />
    );
  }

  const tools = getWorkspaceTools(workspaceType as WorkspaceType);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {formatWorkspaceType(workspaceType as WorkspaceType)}
        </h1>
        <p className="text-gray-600">
          Workspace ID: {workspaceId}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* File upload area */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Add Files to Workspace
              </h2>
              <FileDropZone
                onFilesSelected={handleFilesSelected}
                acceptedTypes={[
                  'image/*',
                  'video/*',
                  'audio/*',
                  'text/*',
                  'application/pdf',
                  'application/json',
                ]}
                maxFiles={10}
              />
            </div>
          </Card>

          {/* Recent files placeholder */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Files
              </h2>
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No files yet. Upload some files to get started!</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar with tools */}
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Available Tools
              </h2>
              <div className="space-y-3">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{tool.name}</h3>
                      <p className="text-sm text-gray-600">{tool.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigateToTool(tool.id)}
                    >
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Workspace settings */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Workspace Settings
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Auto-save</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Offline mode</span>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Collaboration</span>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

function formatWorkspaceType(type: WorkspaceType): string {
  const labels: Record<WorkspaceType, string> = {
    [WorkspaceType.CREATIVE_STUDIO]: 'Creative Content Studio',
    [WorkspaceType.DEVELOPER_HUB]: 'Developer Workflow Hub',
    [WorkspaceType.DOCUMENT_PIPELINE]: 'Document Processing Pipeline',
    [WorkspaceType.MEDIA_SUITE]: 'Media Production Suite',
    [WorkspaceType.PRIVACY_HUB]: 'Privacy-First Communication Hub',
    [WorkspaceType.EDUCATION_PLATFORM]: 'Educational Learning Platform',
    [WorkspaceType.BUSINESS_SUITE]: 'Business Productivity Suite',
    [WorkspaceType.GAMING_HUB]: 'Gaming & Entertainment Hub',
  };

  return labels[type] || type;
}

export default WorkspaceView;