import type { Graph, Node, Edge } from '@antv/x6';
import type { WorkflowState, ExecutionState } from '@/types/workflow';

export interface GraphState {
  graphRef: Graph | null;
  selectedNode: Node | null;
  selectedEdge: Edge | null;
}

export interface UIState {
  isDragging: boolean;
  dragNodeType: string | null;
}

export interface WorkflowStoreState extends WorkflowState {
  executionStates: Record<string, ExecutionState>;
}
