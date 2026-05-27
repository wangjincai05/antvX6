import type { Graph } from '@antv/x6';
import type { WorkflowState, ExecutionState } from '@/types/workflow';

export interface GraphState {
  graphRef: Graph | null;
  selectedNode: any;
  selectedEdge: any;
}

export interface UIState {
  isDragging: boolean;
  dragNodeType: string | null;
}

export interface WorkflowStoreState extends WorkflowState {
  executionStates: Record<string, ExecutionState>;
}
