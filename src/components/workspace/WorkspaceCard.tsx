import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { WorkspaceType } from '@/types/workspace';
import { useSmartRouter } from '@/components/navigation/SmartRouter';

interface WorkspaceCardProps {
  workspaceType: WorkspaceType;
  title: string;
  description: string;
  icon: React.ReactNode;
  tools: string[];
  color: string;
  recentFiles?: number;
  className?: string;
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspaceType,
  title,
  description,
  icon,
  tools,
  color,
  recentFiles = 0,
  className = '',
}) => {
  const { navigateToWorkspace } = useSmartRouter();

  const handleOpenWorkspace = () => {
    // Generate a workspace ID (in a real app, this would come from state management)
    const workspaceId = `${workspaceType}-${Date.now()}`;
    navigateToWorkspace(workspaceId, workspaceType);
  };

  return (
    <Card
      variant="elevated"
      hover
      className={`group transition-all duration-300 ${className}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200`}>
            {icon}
          </div>
          
          {recentFiles > 0 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {recentFiles} recent
            </span>
          )}
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Tools preview */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-1 mb-2">
            {tools.slice(0, 4).map((tool, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tool}
              </span>
            ))}
            {tools.length > 4 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                +{tools.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenWorkspace}
            className="flex-1 mr-2"
          >
            Open Workspace
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            title="More options"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
    </Card>
  );
};

export default WorkspaceCard;