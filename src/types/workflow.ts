import type { Node, Edge } from '@antv/x6';

export interface NodeType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface NodeData {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  sourcePort?: string;
  targetPort?: string;
}

export interface WorkflowData {
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface ExecutionState {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface WorkflowState {
  isRunning: boolean;
  currentNodeId?: string;
  executionStates: Record<string, ExecutionState>;
  startTime?: number;
  endTime?: number;
}

export type SelectedCell = Node | Edge | null;
