import { create } from 'zustand';

export type NodeType = 'IDEA' | 'KNOWLEDGE' | 'ACTIVITY' | 'REFLECTION' | 'GOAL' | 'PROJECT' | 'LEARNING';

export interface KnowledgeNode {
  id: string;
  title: string;
  type: NodeType;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  gravityScore: number;
  connections: string[];
  position?: [number, number, number]; 
}

export interface KnowledgeConnection {
  sourceId: string;
  targetId: string;
  strength: number;
}

interface GraphState {
  nodes: KnowledgeNode[];
  connections: KnowledgeConnection[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  isCaptureModalOpen: boolean;
  setNodes: (nodes: KnowledgeNode[]) => void;
  setConnections: (connections: KnowledgeConnection[]) => void;
  setSelectedNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  setCaptureModalOpen: (isOpen: boolean) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  connections: [],
  selectedNodeId: null,
  hoveredNodeId: null,
  isCaptureModalOpen: false,
  setNodes: (nodes) => set({ nodes }),
  setConnections: (connections) => set({ connections }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  setCaptureModalOpen: (isOpen) => set({ isCaptureModalOpen: isOpen }),
}));
