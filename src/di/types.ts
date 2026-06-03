import type { ToastApi } from '@/composables/useToast';

export type Toast = ToastApi;

export interface SelectionStore {
  selectedNode: unknown;
  selectedEdge: unknown;
  clearSelection: () => void;
  selectNode: (node: unknown) => void;
  selectEdge: (edge: unknown) => void;
}

export interface HistoryStore {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export interface UiStore {
  isDragging: boolean;
  showNodeSelectPanel: boolean;
  panelPosition: { x: number; y: number };
  portClickContext: unknown;
  showNodePanel: (position: { x: number; y: number }, context: unknown) => void;
  hideNodePanel: () => void;
}

export interface GraphStore {
  graphRef: unknown;
  addNode: (type: string, x: number, y: number, label?: string) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeDescription: (nodeId: string, description: string) => void;
  updateNodeProperty: (nodeId: string, key: string, value: unknown) => void;
  clearCanvas: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  exportWorkflow: () => string;
  importWorkflow: (jsonString: string) => void;
  getNodeConfig: (type: string, label: string) => unknown;
}

export interface WorkflowStore {
  workflowState: unknown;
  startExecution: () => Promise<{ success: boolean; errors: string[] }>;
  stopExecution: () => void;
  resetExecution: () => void;
  getExecutionProgress: () => number;
}
