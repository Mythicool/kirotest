import React, { useState, useRef } from 'react';
import { Project, ProjectTask, Client, MindMapData, MindMapNode, MindMapConnection } from '@/types/business-suite';
import Button from '@/components/ui/Button';

interface ProjectPlanningProps {
  projects: Project[];
  clients: Client[];
  onProjectUpdate: (projects: Project[]) => void;
}

export const ProjectPlanning: React.FC<ProjectPlanningProps> = ({
  projects,
  clients,
  onProjectUpdate
}) => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit' | 'mindmap'>('list');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'planning',
    startDate: new Date(),
    tasks: []
  });
  const [mindMapNodes, setMindMapNodes] = useState<MindMapNode[]>([]);
  const [mindMapConnections, setMindMapConnections] = useState<MindMapConnection[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const handleCreateProject = () => {
    const project: Project = {
      id: `project-${Date.now()}`,
      name: newProject.name || '',
      description: newProject.description || '',
      clientId: newProject.clientId,
      status: 'planning',
      startDate: new Date(),
      tasks: [],
      mindMap: mindMapNodes.length > 0 ? {
        nodes: mindMapNodes,
        connections: mindMapConnections,
        layout: 'radial'
      } : undefined
    };

    const updatedProjects = [...projects, project];
    onProjectUpdate(updatedProjects);
    setNewProject({ name: '', description: '', status: 'planning', startDate: new Date(), tasks: [] });
    setMindMapNodes([]);
    setMindMapConnections([]);
    setActiveView('list');
  };

  const handleAddTask = (projectId: string) => {
    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      title: '',
      status: 'todo',
      priority: 'medium'
    };

    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: [...project.tasks, newTask]
        };
      }
      return project;
    });

    onProjectUpdate(updatedProjects);
  };

  const handleUpdateTask = (projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        };
      }
      return project;
    });

    onProjectUpdate(updatedProjects);
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.filter(task => task.id !== taskId)
        };
      }
      return project;
    });

    onProjectUpdate(updatedProjects);
  };

  const addMindMapNode = (x: number, y: number, text: string = 'New Node') => {
    const newNode: MindMapNode = {
      id: `node-${Date.now()}`,
      text,
      x,
      y,
      color: '#3b82f6',
      size: 'medium',
      type: mindMapNodes.length === 0 ? 'root' : 'branch'
    };

    setMindMapNodes(prev => [...prev, newNode]);
  };

  const updateMindMapNode = (nodeId: string, updates: Partial<MindMapNode>) => {
    setMindMapNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  };

  const deleteMindMapNode = (nodeId: string) => {
    setMindMapNodes(prev => prev.filter(node => node.id !== nodeId));
    setMindMapConnections(prev => prev.filter(conn => 
      conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    ));
  };

  const addMindMapConnection = (fromNodeId: string, toNodeId: string) => {
    const newConnection: MindMapConnection = {
      id: `conn-${Date.now()}`,
      fromNodeId,
      toNodeId,
      style: 'solid',
      color: '#64748b'
    };

    setMindMapConnections(prev => [...prev, newConnection]);
  };

  const openBubblIntegration = () => {
    // Integration with bubbl.us mind mapping service
    const bubblUrl = 'https://bubbl.us/';
    window.open(bubblUrl, '_blank');
  };

  const renderProjectList = () => (
    <div className="project-list">
      <div className="list-header">
        <h3>Projects</h3>
        <Button onClick={() => setActiveView('create')} className="primary">
          New Project
        </Button>
      </div>
      
      <div className="project-filters">
        <select className="status-filter">
          <option value="">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
        <select className="client-filter">
          <option value="">All Clients</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="project-grid">
        {projects.map(project => {
          const client = clients.find(c => c.id === project.clientId);
          const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
          const totalTasks = project.tasks.length;
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          
          return (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h4>{project.name}</h4>
                <span className={`status-badge ${project.status}`}>
                  {project.status}
                </span>
              </div>
              
              <p className="project-description">{project.description}</p>
              
              {client && (
                <div className="project-client">
                  <span>Client: {client.name}</span>
                </div>
              )}
              
              <div className="project-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span>{completedTasks}/{totalTasks} tasks completed</span>
              </div>
              
              <div className="project-dates">
                <span>Started: {project.startDate.toLocaleDateString()}</span>
                {project.endDate && (
                  <span>Due: {project.endDate.toLocaleDateString()}</span>
                )}
              </div>
              
              <div className="project-actions">
                <Button 
                  onClick={() => {
                    setSelectedProject(project);
                    setActiveView('edit');
                  }}
                  className="small"
                >
                  Edit
                </Button>
                {project.mindMap && (
                  <Button 
                    onClick={() => {
                      setSelectedProject(project);
                      setMindMapNodes(project.mindMap?.nodes || []);
                      setMindMapConnections(project.mindMap?.connections || []);
                      setActiveView('mindmap');
                    }}
                    className="small secondary"
                  >
                    Mind Map
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCreateProject = () => (
    <div className="create-project">
      <div className="form-header">
        <h3>Create New Project</h3>
        <Button onClick={() => setActiveView('list')} className="secondary">
          Back to List
        </Button>
      </div>
      
      <div className="project-form">
        <div className="form-section">
          <h4>Project Details</h4>
          <div className="form-field">
            <label>Project Name</label>
            <input 
              type="text"
              value={newProject.name || ''}
              onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
            />
          </div>
          
          <div className="form-field">
            <label>Description</label>
            <textarea 
              value={newProject.description || ''}
              onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Project description"
              rows={4}
            />
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label>Client</label>
              <select 
                value={newProject.clientId || ''}
                onChange={(e) => setNewProject(prev => ({ ...prev, clientId: e.target.value }))}
              >
                <option value="">Select Client (Optional)</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-field">
              <label>Start Date</label>
              <input 
                type="date"
                value={newProject.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setNewProject(prev => ({ 
                  ...prev, 
                  startDate: new Date(e.target.value) 
                }))}
              />
            </div>
            
            <div className="form-field">
              <label>End Date (Optional)</label>
              <input 
                type="date"
                value={newProject.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setNewProject(prev => ({ 
                  ...prev, 
                  endDate: e.target.value ? new Date(e.target.value) : undefined
                }))}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label>Budget (Optional)</label>
              <input 
                type="number"
                value={newProject.budget || ''}
                onChange={(e) => setNewProject(prev => ({ 
                  ...prev, 
                  budget: e.target.value ? Number(e.target.value) : undefined
                }))}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <div className="section-header">
            <h4>Mind Map Planning</h4>
            <Button onClick={openBubblIntegration} className="small secondary">
              Open bubbl.us
            </Button>
          </div>
          
          <div className="mindmap-canvas-container">
            <canvas 
              ref={canvasRef}
              width={600}
              height={400}
              className="mindmap-canvas"
              onClick={(e) => {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  addMindMapNode(x, y);
                }
              }}
            />
            
            <div className="mindmap-controls">
              <Button 
                onClick={() => addMindMapNode(300, 200, 'Project Goal')}
                className="small"
              >
                Add Root Node
              </Button>
              <Button 
                onClick={() => {
                  setMindMapNodes([]);
                  setMindMapConnections([]);
                }}
                className="small secondary"
              >
                Clear
              </Button>
            </div>
          </div>
          
          {mindMapNodes.length > 0 && (
            <div className="mindmap-nodes-list">
              <h5>Mind Map Nodes</h5>
              {mindMapNodes.map(node => (
                <div key={node.id} className="node-item">
                  <input 
                    type="text"
                    value={node.text}
                    onChange={(e) => updateMindMapNode(node.id, { text: e.target.value })}
                    className="node-text"
                  />
                  <select 
                    value={node.type}
                    onChange={(e) => updateMindMapNode(node.id, { type: e.target.value as any })}
                  >
                    <option value="root">Root</option>
                    <option value="branch">Branch</option>
                    <option value="leaf">Leaf</option>
                  </select>
                  <Button 
                    onClick={() => deleteMindMapNode(node.id)}
                    className="small danger"
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <Button onClick={handleCreateProject} className="primary">
            Create Project
          </Button>
          <Button onClick={() => setActiveView('list')} className="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  const renderEditProject = () => {
    if (!selectedProject) return null;
    
    return (
      <div className="edit-project">
        <div className="form-header">
          <h3>Edit Project: {selectedProject.name}</h3>
          <Button onClick={() => setActiveView('list')} className="secondary">
            Back to List
          </Button>
        </div>
        
        <div className="project-tabs">
          <div className="tab-content">
            <div className="form-section">
              <h4>Project Tasks</h4>
              <Button 
                onClick={() => handleAddTask(selectedProject.id)}
                className="small primary"
              >
                Add Task
              </Button>
              
              <div className="tasks-list">
                {selectedProject.tasks.map(task => (
                  <div key={task.id} className="task-item">
                    <div className="task-main">
                      <input 
                        type="text"
                        value={task.title}
                        onChange={(e) => handleUpdateTask(selectedProject.id, task.id, { title: e.target.value })}
                        placeholder="Task title"
                        className="task-title"
                      />
                      
                      <select 
                        value={task.status}
                        onChange={(e) => handleUpdateTask(selectedProject.id, task.id, { status: e.target.value as any })}
                        className="task-status"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      
                      <select 
                        value={task.priority}
                        onChange={(e) => handleUpdateTask(selectedProject.id, task.id, { priority: e.target.value as any })}
                        className="task-priority"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      
                      <Button 
                        onClick={() => handleDeleteTask(selectedProject.id, task.id)}
                        className="small danger"
                      >
                        Delete
                      </Button>
                    </div>
                    
                    {task.description && (
                      <div className="task-description">
                        <textarea 
                          value={task.description}
                          onChange={(e) => handleUpdateTask(selectedProject.id, task.id, { description: e.target.value })}
                          placeholder="Task description"
                          rows={2}
                        />
                      </div>
                    )}
                    
                    <div className="task-details">
                      <input 
                        type="date"
                        value={task.dueDate?.toISOString().split('T')[0] || ''}
                        onChange={(e) => handleUpdateTask(selectedProject.id, task.id, { 
                          dueDate: e.target.value ? new Date(e.target.value) : undefined 
                        })}
                        placeholder="Due date"
                      />
                      
                      <input 
                        type="number"
                        value={task.estimatedHours || ''}
                        onChange={(e) => handleUpdateTask(selectedProject.id, task.id, { 
                          estimatedHours: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        placeholder="Est. hours"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMindMap = () => (
    <div className="mindmap-view">
      <div className="mindmap-header">
        <h3>Mind Map: {selectedProject?.name}</h3>
        <div className="mindmap-actions">
          <Button onClick={openBubblIntegration} className="secondary">
            Open in bubbl.us
          </Button>
          <Button onClick={() => setActiveView('list')} className="secondary">
            Back to Projects
          </Button>
        </div>
      </div>
      
      <div className="mindmap-container">
        <canvas 
          ref={canvasRef}
          width={800}
          height={600}
          className="mindmap-canvas large"
        />
        
        <div className="mindmap-sidebar">
          <h4>Mind Map Tools</h4>
          <div className="tool-buttons">
            <Button onClick={() => addMindMapNode(400, 300, 'New Idea')}>
              Add Node
            </Button>
            <Button onClick={openBubblIntegration}>
              Advanced Editor
            </Button>
          </div>
          
          <div className="node-properties">
            <h5>Node Properties</h5>
            <div className="color-picker">
              <label>Color:</label>
              <input type="color" defaultValue="#3b82f6" />
            </div>
            <div className="size-picker">
              <label>Size:</label>
              <select>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="project-planning">
      {activeView === 'list' && renderProjectList()}
      {activeView === 'create' && renderCreateProject()}
      {activeView === 'edit' && renderEditProject()}
      {activeView === 'mindmap' && renderMindMap()}
    </div>
  );
};