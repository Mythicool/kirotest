import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSmartRouter } from '@/components/navigation/SmartRouter';
import { WorkspaceType } from '@/types/workspace';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const ToolView: React.FC = () => {
  const { workspaceType, workspaceId, toolId } = useParams<{
    workspaceType: string;
    workspaceId: string;
    toolId: string;
  }>();
  
  const { addBreadcrumb, clearBreadcrumbs } = useSmartRouter();

  useEffect(() => {
    clearBreadcrumbs();
    if (workspaceType && workspaceId && toolId) {
      addBreadcrumb({
        label: formatWorkspaceType(workspaceType as WorkspaceType),
        path: `/workspace/${workspaceType}/${workspaceId}`,
      });
      addBreadcrumb({
        label: formatToolName(toolId),
        path: `/workspace/${workspaceType}/${workspaceId}/tool/${toolId}`,
      });
    }
  }, [workspaceType, workspaceId, toolId, addBreadcrumb, clearBreadcrumbs]);

  if (!workspaceType || !workspaceId || !toolId) {
    return <div>Invalid tool configuration</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tool header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {formatToolName(toolId)}
            </h1>
            <p className="text-sm text-gray-600">
              Running in {formatWorkspaceType(workspaceType as WorkspaceType)}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save
            </Button>
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Tool content area */}
      <div className="flex-1 p-6">
        <Card className="h-full">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {formatToolName(toolId)} Integration
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">
                This is where the {formatToolName(toolId)} tool would be embedded. 
                The tool integration system will load the external service in a secure iframe 
                with seamless data exchange capabilities.
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <p><strong>Workspace:</strong> {workspaceId}</p>
                <p><strong>Tool ID:</strong> {toolId}</p>
                <p><strong>Integration Type:</strong> iframe</p>
                <p><strong>Status:</strong> Ready to load</p>
              </div>
              
              <div className="mt-6">
                <Button variant="primary">
                  Load {formatToolName(toolId)}
                </Button>
              </div>
            </div>
          </div>
        </Card>
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

function formatToolName(toolId: string): string {
  const toolNames: Record<string, string> = {
    'photopea': 'PhotoPea',
    'pixlr': 'Pixlr',
    'svg-edit': 'SVG Edit',
    'coolors': 'Coolors',
    'replit': 'Repl.it',
    'codepen': 'CodePen',
    'css-minifier': 'CSS Minifier',
    'gtmetrix': 'GTmetrix',
    'dillinger': 'Dillinger',
    'hackmd': 'HackMD',
    'ethercalc': 'EtherCalc',
    'cloud-convert': 'Cloud Convert',
    'twistedweb': 'TwistedWeb',
    'videotoolbox': 'VideoToolbox',
    'bfxr': 'bfxr',
    'vileo': 'Vileo',
    'tlk-io': 'Tlk.io',
    'firefox-send': 'Firefox Send',
    'cryptii': 'Cryptii',
    'protectedtext': 'ProtectedText',
    'wolframalpha': 'WolframAlpha',
    'desmos': 'Desmos',
    'calculatoria': 'Calculatoria',
    'graph-editor': 'Graph Editor',
    'invoicetome': 'InvoiceToMe',
    'bubbl': 'bubbl',
    'logo-maker': 'Logo Maker',
    'seo-tools': 'SEO Tools',
    'typeracer': 'Typeracer',
    'agar-io': 'agar.io',
    'internet-radio': 'Internet Radio',
    'drawing-tools': 'Drawing Tools',
  };

  return toolNames[toolId] || toolId;
}

export default ToolView;