import React, { useState, useEffect, useCallback } from 'react';
import { CollaborationSession, CollaborationOperation, Collaborator } from '@/types/document-pipeline';

interface CollaborationManagerProps {
  documentId: string;
  userId: string;
  userName: string;
  onOperationReceived: (operation: CollaborationOperation) => void;
  onCollaboratorJoined: (collaborator: Collaborator) => void;
  onCollaboratorLeft: (collaboratorId: string) => void;
}

export const useCollaborationManager = ({
  documentId,
  userId,
  userName,
  onOperationReceived,
  onCollaboratorJoined,
  onCollaboratorLeft
}: CollaborationManagerProps) => {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [operationQueue, setOperationQueue] = useState<CollaborationOperation[]>([]);

  // Simulate WebSocket connection for real-time collaboration
  useEffect(() => {
    const connectToSession = async () => {
      try {
        // In a real implementation, this would connect to a WebSocket server
        // For now, we'll simulate the connection
        const mockSession: CollaborationSession = {
          id: `session-${documentId}`,
          documentId,
          participants: [
            {
              id: userId,
              name: userName,
              color: generateUserColor(userId),
              lastSeen: new Date()
            }
          ],
          operations: [],
          isActive: true
        };

        setSession(mockSession);
        setIsConnected(true);

        // Simulate other users joining
        setTimeout(() => {
          const mockCollaborator: Collaborator = {
            id: 'user-2',
            name: 'Demo User',
            color: '#3B82F6',
            lastSeen: new Date()
          };
          onCollaboratorJoined(mockCollaborator);
        }, 2000);

      } catch (error) {
        console.error('Failed to connect to collaboration session:', error);
        setIsConnected(false);
      }
    };

    connectToSession();

    return () => {
      // Cleanup connection
      setIsConnected(false);
      setSession(null);
    };
  }, [documentId, userId, userName, onCollaboratorJoined]);

  const generateUserColor = (userId: string): string => {
    const colors = [
      '#EF4444', '#F97316', '#EAB308', '#22C55E',
      '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const sendOperation = useCallback((operation: CollaborationOperation) => {
    if (!isConnected || !session) {
      // Queue operation for when connection is restored
      setOperationQueue(prev => [...prev, operation]);
      return;
    }

    try {
      // In a real implementation, this would send the operation via WebSocket
      console.log('Sending operation:', operation);
      
      // Simulate receiving the operation back from server
      setTimeout(() => {
        onOperationReceived(operation);
      }, 100);

    } catch (error) {
      console.error('Failed to send operation:', error);
      setOperationQueue(prev => [...prev, operation]);
    }
  }, [isConnected, session, onOperationReceived]);

  const resolveConflicts = useCallback((operations: CollaborationOperation[]): CollaborationOperation[] => {
    // Implement Operational Transformation for conflict resolution
    const resolved: CollaborationOperation[] = [];
    
    // Sort operations by timestamp
    const sortedOps = [...operations].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (const op of sortedOps) {
      let transformedOp = { ...op };
      
      // Transform against all previously resolved operations
      for (const resolvedOp of resolved) {
        transformedOp = transformOperation(transformedOp, resolvedOp);
      }
      
      resolved.push(transformedOp);
    }
    
    return resolved;
  }, []);

  const transformOperation = (op1: CollaborationOperation, op2: CollaborationOperation): CollaborationOperation => {
    // Simplified Operational Transformation
    if (op1.timestamp <= op2.timestamp) {
      return op1; // Op1 happened first, no transformation needed
    }

    const transformed = { ...op1 };

    if (op2.type === 'insert' && op1.position >= op2.position) {
      // Adjust position for insertions that happened before this operation
      transformed.position += op2.content?.length || 0;
    } else if (op2.type === 'delete' && op1.position > op2.position) {
      // Adjust position for deletions that happened before this operation
      transformed.position -= Math.min(op2.length || 0, op1.position - op2.position);
    }

    return transformed;
  };

  const applyOperation = useCallback((operation: CollaborationOperation, content: string): string => {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position);
      
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0));
      
      case 'retain':
        return content; // No change for retain operations
      
      default:
        return content;
    }
  }, []);

  const createOperation = useCallback((
    type: CollaborationOperation['type'],
    position: number,
    content?: string,
    length?: number
  ): CollaborationOperation => {
    return {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      position,
      content,
      length,
      author: userId,
      timestamp: new Date()
    };
  }, [userId]);

  // Process queued operations when connection is restored
  useEffect(() => {
    if (isConnected && operationQueue.length > 0) {
      const resolvedOps = resolveConflicts(operationQueue);
      resolvedOps.forEach(op => sendOperation(op));
      setOperationQueue([]);
    }
  }, [isConnected, operationQueue, resolveConflicts, sendOperation]);

  return {
    session,
    isConnected,
    sendOperation,
    createOperation,
    applyOperation,
    resolveConflicts
  };
};

// Hook for using collaboration features
export const useCollaboration = (
  documentId: string,
  userId: string,
  userName: string
) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [operations, setOperations] = useState<CollaborationOperation[]>([]);

  const handleOperationReceived = useCallback((operation: CollaborationOperation) => {
    setOperations(prev => [...prev, operation]);
  }, []);

  const handleCollaboratorJoined = useCallback((collaborator: Collaborator) => {
    setCollaborators(prev => [...prev, collaborator]);
  }, []);

  const handleCollaboratorLeft = useCallback((collaboratorId: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
  }, []);

  const collaborationManager = useCollaborationManager({
    documentId,
    userId,
    userName,
    onOperationReceived: handleOperationReceived,
    onCollaboratorJoined: handleCollaboratorJoined,
    onCollaboratorLeft: handleCollaboratorLeft
  });

  return {
    collaborators,
    operations,
    ...collaborationManager
  };
};