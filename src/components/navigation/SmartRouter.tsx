import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceType } from '@/types/workspace';

interface NavigationState {
  currentWorkspace?: string;
  workspaceType?: WorkspaceType;
  activeTool?: string;
  breadcrumbs: BreadcrumbItem[];
  history: NavigationHistoryItem[];
}

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
}

interface NavigationHistoryItem {
  path: string;
  timestamp: number;
  workspaceId?: string;
  toolId?: string;
}

interface SmartRouterContextType {
  navigationState: NavigationState;
  navigateToWorkspace: (workspaceId: string, workspaceType: WorkspaceType) => void;
  navigateToTool: (toolId: string, workspaceId?: string) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;
  getRecommendedTools: (fileType?: string) => string[];
}

const SmartRouterContext = createContext<SmartRouterContextType | undefined>(undefined);

const STORAGE_KEY = 'smart-router-state';
const MAX_HISTORY_ITEMS = 50;

export const SmartRouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    // Load persisted state from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          breadcrumbs: [],
          history: [],
          ...parsed,
        };
      }
    } catch (error) {
      console.warn('Failed to load navigation state:', error);
    }
    
    return {
      breadcrumbs: [],
      history: [],
    };
  });

  const [historyIndex, setHistoryIndex] = useState(0);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(navigationState));
    } catch (error) {
      console.warn('Failed to persist navigation state:', error);
    }
  }, [navigationState]);

  // Track navigation history
  useEffect(() => {
    const historyItem: NavigationHistoryItem = {
      path: location.pathname,
      timestamp: Date.now(),
      workspaceId: navigationState.currentWorkspace,
      toolId: navigationState.activeTool,
    };

    setNavigationState(prev => ({
      ...prev,
      history: [
        ...prev.history.slice(0, historyIndex + 1),
        historyItem,
      ].slice(-MAX_HISTORY_ITEMS),
    }));

    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_ITEMS - 1));
  }, [location.pathname]);

  const navigateToWorkspace = (workspaceId: string, workspaceType: WorkspaceType) => {
    setNavigationState(prev => ({
      ...prev,
      currentWorkspace: workspaceId,
      workspaceType,
      activeTool: undefined,
    }));

    const path = `/workspace/${workspaceType}/${workspaceId}`;
    navigate(path);
  };

  const navigateToTool = (toolId: string, workspaceId?: string) => {
    const targetWorkspaceId = workspaceId || navigationState.currentWorkspace;
    
    if (!targetWorkspaceId) {
      console.warn('Cannot navigate to tool without workspace context');
      return;
    }

    setNavigationState(prev => ({
      ...prev,
      activeTool: toolId,
      currentWorkspace: targetWorkspaceId,
    }));

    const path = `/workspace/${navigationState.workspaceType}/${targetWorkspaceId}/tool/${toolId}`;
    navigate(path);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const historyItem = navigationState.history[newIndex];
      
      setHistoryIndex(newIndex);
      navigate(historyItem.path);
      
      setNavigationState(prev => ({
        ...prev,
        currentWorkspace: historyItem.workspaceId,
        activeTool: historyItem.toolId,
      }));
    }
  };

  const goForward = () => {
    if (historyIndex < navigationState.history.length - 1) {
      const newIndex = historyIndex + 1;
      const historyItem = navigationState.history[newIndex];
      
      setHistoryIndex(newIndex);
      navigate(historyItem.path);
      
      setNavigationState(prev => ({
        ...prev,
        currentWorkspace: historyItem.workspaceId,
        activeTool: historyItem.toolId,
      }));
    }
  };

  const addBreadcrumb = (item: BreadcrumbItem) => {
    setNavigationState(prev => ({
      ...prev,
      breadcrumbs: [...prev.breadcrumbs, item],
    }));
  };

  const clearBreadcrumbs = () => {
    setNavigationState(prev => ({
      ...prev,
      breadcrumbs: [],
    }));
  };

  const getRecommendedTools = (fileType?: string): string[] => {
    if (!fileType) return [];

    // Tool recommendations based on file type
    const recommendations: Record<string, string[]> = {
      'image/jpeg': ['photopea', 'pixlr', 'tinypng'],
      'image/png': ['photopea', 'pixlr', 'tinypng'],
      'image/svg+xml': ['svg-edit', 'method-draw'],
      'text/plain': ['dillinger', 'stackedit'],
      'text/markdown': ['dillinger', 'stackedit', 'hackmd'],
      'application/pdf': ['pdfescape', 'online-ocr'],
      'audio/mpeg': ['twistedweb', 'filelab-audio'],
      'audio/wav': ['twistedweb', 'filelab-audio'],
      'video/mp4': ['videotoolbox'],
      'application/json': ['jsonstore', 'json-formatter'],
      'text/javascript': ['replit', 'codepen', 'jsfiddle'],
      'text/css': ['css-minifier', 'codepen'],
      'text/html': ['html-minifier', 'codepen'],
    };

    return recommendations[fileType] || [];
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < navigationState.history.length - 1;

  const contextValue: SmartRouterContextType = {
    navigationState,
    navigateToWorkspace,
    navigateToTool,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    addBreadcrumb,
    clearBreadcrumbs,
    getRecommendedTools,
  };

  return (
    <SmartRouterContext.Provider value={contextValue}>
      {children}
    </SmartRouterContext.Provider>
  );
};

export const useSmartRouter = (): SmartRouterContextType => {
  const context = useContext(SmartRouterContext);
  if (!context) {
    throw new Error('useSmartRouter must be used within a SmartRouterProvider');
  }
  return context;
};