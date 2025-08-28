import React, { useState, useEffect } from 'react';
import { BusinessSuiteWorkspace, Invoice, Project, Client, MarketingMaterial, BackupItem } from '@/types/business-suite';
import Button from '@/components/ui/Button';
import { InvoicingSystem } from './InvoicingSystem';
import { FinancialManagement } from './FinancialManagement';
import { ProjectPlanning } from './ProjectPlanning';
import { ClientCommunication } from './ClientCommunication';
import { MarketingMaterialCreation } from './MarketingMaterialCreation';
import { WebsiteAnalysis } from './WebsiteAnalysis';
import { SocialMediaScheduling } from './SocialMediaScheduling';
import { DataBackupSystem } from './DataBackupSystem';
import '@/styles/business-suite.css';

interface BusinessProductivitySuiteProps {
  workspace: BusinessSuiteWorkspace;
  onWorkspaceUpdate: (workspace: BusinessSuiteWorkspace) => void;
}

type BusinessTool = 
  | 'invoicing'
  | 'financial'
  | 'project-planning'
  | 'client-communication'
  | 'marketing'
  | 'website-analysis'
  | 'social-media'
  | 'data-backup'
  | 'dashboard';

export const BusinessProductivitySuite: React.FC<BusinessProductivitySuiteProps> = ({
  workspace,
  onWorkspaceUpdate
}) => {
  const [activeTool, setActiveTool] = useState<BusinessTool>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvoiceUpdate = (invoices: Invoice[]) => {
    const updatedWorkspace = {
      ...workspace,
      invoices
    };
    onWorkspaceUpdate(updatedWorkspace);
  };

  const handleProjectUpdate = (projects: Project[]) => {
    const updatedWorkspace = {
      ...workspace,
      projects
    };
    onWorkspaceUpdate(updatedWorkspace);
  };

  const handleClientUpdate = (clients: Client[]) => {
    const updatedWorkspace = {
      ...workspace,
      clients
    };
    onWorkspaceUpdate(updatedWorkspace);
  };

  const handleMarketingMaterialUpdate = (marketingMaterials: MarketingMaterial[]) => {
    const updatedWorkspace = {
      ...workspace,
      marketingMaterials
    };
    onWorkspaceUpdate(updatedWorkspace);
  };

  const handleBackupUpdate = (backups: BackupItem[]) => {
    const updatedWorkspace = {
      ...workspace,
      backups
    };
    onWorkspaceUpdate(updatedWorkspace);
  };

  const renderDashboard = () => (
    <div className="business-dashboard">
      <div className="dashboard-header">
        <h2>Business Dashboard</h2>
        <p>Manage your business operations efficiently</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Invoices</h3>
          <div className="stat-value">{workspace.invoices.length}</div>
          <div className="stat-detail">
            {workspace.invoices.filter(i => i.status === 'paid').length} paid
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Active Projects</h3>
          <div className="stat-value">
            {workspace.projects.filter(p => p.status === 'active').length}
          </div>
          <div className="stat-detail">
            {workspace.projects.filter(p => p.status === 'completed').length} completed
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Clients</h3>
          <div className="stat-value">{workspace.clients.length}</div>
          <div className="stat-detail">Active relationships</div>
        </div>
        
        <div className="stat-card">
          <h3>Marketing Materials</h3>
          <div className="stat-value">{workspace.marketingMaterials.length}</div>
          <div className="stat-detail">Assets created</div>
        </div>
      </div>
      
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <Button 
            onClick={() => setActiveTool('invoicing')}
            className="action-button"
          >
            Create Invoice
          </Button>
          <Button 
            onClick={() => setActiveTool('project-planning')}
            className="action-button"
          >
            New Project
          </Button>
          <Button 
            onClick={() => setActiveTool('client-communication')}
            className="action-button"
          >
            Schedule Meeting
          </Button>
          <Button 
            onClick={() => setActiveTool('marketing')}
            className="action-button"
          >
            Create Marketing Material
          </Button>
        </div>
      </div>
      
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {workspace.invoices.slice(0, 3).map(invoice => (
            <div key={invoice.id} className="activity-item">
              <span className="activity-type">Invoice</span>
              <span className="activity-description">
                Invoice #{invoice.number} - ${invoice.total}
              </span>
              <span className="activity-status">{invoice.status}</span>
            </div>
          ))}
          {workspace.projects.slice(0, 2).map(project => (
            <div key={project.id} className="activity-item">
              <span className="activity-type">Project</span>
              <span className="activity-description">{project.name}</span>
              <span className="activity-status">{project.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'dashboard':
        return renderDashboard();
      case 'invoicing':
        return (
          <InvoicingSystem
            invoices={workspace.invoices}
            clients={workspace.clients}
            settings={workspace.settings}
            onInvoiceUpdate={handleInvoiceUpdate}
          />
        );
      case 'financial':
        return (
          <FinancialManagement
            workspace={workspace}
            onWorkspaceUpdate={onWorkspaceUpdate}
          />
        );
      case 'project-planning':
        return (
          <ProjectPlanning
            projects={workspace.projects}
            clients={workspace.clients}
            onProjectUpdate={handleProjectUpdate}
          />
        );
      case 'client-communication':
        return (
          <ClientCommunication
            clients={workspace.clients}
            settings={workspace.settings}
            onClientUpdate={handleClientUpdate}
          />
        );
      case 'marketing':
        return (
          <MarketingMaterialCreation
            materials={workspace.marketingMaterials}
            settings={workspace.settings}
            onMaterialUpdate={handleMarketingMaterialUpdate}
          />
        );
      case 'website-analysis':
        return (
          <WebsiteAnalysis
            settings={workspace.settings}
          />
        );
      case 'social-media':
        return (
          <SocialMediaScheduling
            settings={workspace.settings}
          />
        );
      case 'data-backup':
        return (
          <DataBackupSystem
            backups={workspace.backups}
            settings={workspace.settings}
            workspace={workspace}
            onBackupUpdate={handleBackupUpdate}
          />
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="business-productivity-suite">
      <div className="business-sidebar">
        <div className="suite-header">
          <h1>Business Suite</h1>
          <p>Professional productivity tools</p>
        </div>
        
        <nav className="business-nav">
          <Button
            onClick={() => setActiveTool('dashboard')}
            className={`nav-button ${activeTool === 'dashboard' ? 'active' : ''}`}
          >
            📊 Dashboard
          </Button>
          <Button
            onClick={() => setActiveTool('invoicing')}
            className={`nav-button ${activeTool === 'invoicing' ? 'active' : ''}`}
          >
            🧾 Invoicing
          </Button>
          <Button
            onClick={() => setActiveTool('financial')}
            className={`nav-button ${activeTool === 'financial' ? 'active' : ''}`}
          >
            💰 Financial Management
          </Button>
          <Button
            onClick={() => setActiveTool('project-planning')}
            className={`nav-button ${activeTool === 'project-planning' ? 'active' : ''}`}
          >
            📋 Project Planning
          </Button>
          <Button
            onClick={() => setActiveTool('client-communication')}
            className={`nav-button ${activeTool === 'client-communication' ? 'active' : ''}`}
          >
            💬 Client Communication
          </Button>
          <Button
            onClick={() => setActiveTool('marketing')}
            className={`nav-button ${activeTool === 'marketing' ? 'active' : ''}`}
          >
            🎨 Marketing Materials
          </Button>
          <Button
            onClick={() => setActiveTool('website-analysis')}
            className={`nav-button ${activeTool === 'website-analysis' ? 'active' : ''}`}
          >
            📈 Website Analysis
          </Button>
          <Button
            onClick={() => setActiveTool('social-media')}
            className={`nav-button ${activeTool === 'social-media' ? 'active' : ''}`}
          >
            📱 Social Media
          </Button>
          <Button
            onClick={() => setActiveTool('data-backup')}
            className={`nav-button ${activeTool === 'data-backup' ? 'active' : ''}`}
          >
            💾 Data Backup
          </Button>
        </nav>
      </div>
      
      <div className="business-main">
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <Button onClick={() => setError(null)} className="error-close">
              ✕
            </Button>
          </div>
        )}
        
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading business tools...</p>
          </div>
        )}
        
        <div className="tool-content">
          {renderActiveTool()}
        </div>
      </div>
    </div>
  );
};