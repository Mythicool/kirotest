import React, { useMemo } from 'react';
import { useSmartRouter } from './SmartRouter';
import Button from '@/components/ui/Button';
import { WorkspaceType } from '@/types/workspace';

interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  tooltip?: string;
}

interface ContextualToolbarProps {
  className?: string;
}

const ContextualToolbar: React.FC<ContextualToolbarProps> = ({ className = '' }) => {
  const { navigationState, goBack, goForward, canGoBack, canGoForward, navigateToTool } = useSmartRouter();

  // Generate contextual actions based on current workspace and tool
  const contextualActions = useMemo((): ToolbarAction[] => {
    const actions: ToolbarAction[] = [];

    // Navigation actions
    actions.push({
      id: 'back',
      label: 'Back',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      ),
      onClick: goBack,
      disabled: !canGoBack,
      variant: 'ghost',
      tooltip: 'Go back',
    });

    actions.push({
      id: 'forward',
      label: 'Forward',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      ),
      onClick: goForward,
      disabled: !canGoForward,
      variant: 'ghost',
      tooltip: 'Go forward',
    });

    // Workspace-specific actions
    if (navigationState.workspaceType) {
      actions.push(...getWorkspaceActions(navigationState.workspaceType, navigateToTool));
    }

    // Tool-specific actions
    if (navigationState.activeTool) {
      actions.push(...getToolActions(navigationState.activeTool));
    }

    return actions;
  }, [navigationState, canGoBack, canGoForward, goBack, goForward, navigateToTool]);

  return (
    <div className={`flex items-center gap-2 p-4 bg-white border-b border-gray-200 ${className}`}>
      <div className="flex items-center gap-1">
        {contextualActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'ghost'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            leftIcon={action.icon}
            title={action.tooltip}
            className="min-w-0"
          >
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Breadcrumbs */}
      {navigationState.breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 ml-4">
          <span className="text-gray-400">/</span>
          {navigationState.breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <button
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => {/* Navigate to breadcrumb */}}
              >
                {crumb.label}
              </button>
              {index < navigationState.breadcrumbs.length - 1 && (
                <span className="text-gray-400">/</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Current context indicator */}
      <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
        {navigationState.workspaceType && (
          <span className="px-2 py-1 bg-gray-100 rounded-md">
            {formatWorkspaceType(navigationState.workspaceType)}
          </span>
        )}
        {navigationState.activeTool && (
          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md">
            {formatToolName(navigationState.activeTool)}
          </span>
        )}
      </div>
    </div>
  );
};

// Helper functions for generating workspace-specific actions
function getWorkspaceActions(workspaceType: WorkspaceType, navigateToTool: (toolId: string) => void): ToolbarAction[] {
  const actions: ToolbarAction[] = [];

  switch (workspaceType) {
    case WorkspaceType.CREATIVE_STUDIO:
      actions.push(
        {
          id: 'new-canvas',
          label: 'New Canvas',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          ),
          onClick: () => navigateToTool('photopea'),
          variant: 'primary',
        },
        {
          id: 'color-palette',
          label: 'Colors',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2" />
            </svg>
          ),
          onClick: () => navigateToTool('coolors'),
          variant: 'outline',
        }
      );
      break;

    case WorkspaceType.DEVELOPER_HUB:
      actions.push(
        {
          id: 'new-project',
          label: 'New Project',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          ),
          onClick: () => navigateToTool('replit'),
          variant: 'primary',
        },
        {
          id: 'optimize',
          label: 'Optimize',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          onClick: () => navigateToTool('css-minifier'),
          variant: 'outline',
        }
      );
      break;

    case WorkspaceType.DOCUMENT_PIPELINE:
      actions.push(
        {
          id: 'new-document',
          label: 'New Document',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          onClick: () => navigateToTool('dillinger'),
          variant: 'primary',
        }
      );
      break;

    default:
      break;
  }

  return actions;
}

// Helper functions for generating tool-specific actions
function getToolActions(_toolId: string): ToolbarAction[] {
  const actions: ToolbarAction[] = [];

  // Common actions for most tools
  actions.push(
    {
      id: 'save',
      label: 'Save',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      ),
      onClick: () => {/* Implement save functionality */},
      variant: 'outline',
    },
    {
      id: 'export',
      label: 'Export',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => {/* Implement export functionality */},
      variant: 'outline',
    }
  );

  return actions;
}

function formatWorkspaceType(type: WorkspaceType): string {
  const labels: Record<WorkspaceType, string> = {
    [WorkspaceType.CREATIVE_STUDIO]: 'Creative Studio',
    [WorkspaceType.DEVELOPER_HUB]: 'Developer Hub',
    [WorkspaceType.DOCUMENT_PIPELINE]: 'Document Pipeline',
    [WorkspaceType.MEDIA_SUITE]: 'Media Suite',
    [WorkspaceType.PRIVACY_HUB]: 'Privacy Hub',
    [WorkspaceType.EDUCATION_PLATFORM]: 'Education Platform',
    [WorkspaceType.BUSINESS_SUITE]: 'Business Suite',
    [WorkspaceType.GAMING_HUB]: 'Gaming Hub',
  };

  return labels[type] || type;
}

function formatToolName(toolId: string): string {
  // Convert tool IDs to human-readable names
  const toolNames: Record<string, string> = {
    'photopea': 'PhotoPea',
    'pixlr': 'Pixlr',
    'svg-edit': 'SVG Edit',
    'coolors': 'Coolors',
    'replit': 'Repl.it',
    'codepen': 'CodePen',
    'css-minifier': 'CSS Minifier',
    'dillinger': 'Dillinger',
    'hackmd': 'HackMD',
  };

  return toolNames[toolId] || toolId;
}

export default ContextualToolbar;