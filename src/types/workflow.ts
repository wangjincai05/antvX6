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

export interface ExecutionLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

export interface ExecutionState {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  startTime?: number;
  endTime?: number;
  retryCount: number;
  maxRetries: number;
  logs: ExecutionLog[];
  output?: unknown;
}

export interface WorkflowState {
  isRunning: boolean;
  currentNodeId?: string;
  executionStates: Record<string, ExecutionState>;
  startTime?: number;
  endTime?: number;
  workflowId: string;
  logs: ExecutionLog[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export type SelectedCell = Node | Edge | null;

export interface DryRunRecord {
  id: string;
  workflowId: string;
  startTime: number;
  endTime?: number;
  status: 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  logs: ExecutionLog[];
  executionStates: Record<string, ExecutionState>;
}

export interface DryRunState {
  isRunning: boolean;
  currentRecord: DryRunRecord | null;
  history: DryRunRecord[];
  maxHistoryCount: number;
}

export type NodeStatus = 'pending' | 'running' | 'completed' | 'error' | 'warning' | 'idle';

export interface NodeStatusConfig {
  status: NodeStatus;
  label: string;
  color: string;
  bgColor: string;
  hasAnimation: boolean;
}

export const NODE_STATUS_CONFIG: Record<NodeStatus, NodeStatusConfig> = {
  idle: {
    status: 'idle',
    label: '空闲',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
    hasAnimation: false,
  },
  pending: {
    status: 'pending',
    label: '等待中',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
    hasAnimation: false,
  },
  running: {
    status: 'running',
    label: '执行中',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    hasAnimation: true,
  },
  completed: {
    status: 'completed',
    label: '已完成',
    color: '#10B981',
    bgColor: '#D1FAE5',
    hasAnimation: false,
  },
  error: {
    status: 'error',
    label: '执行失败',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    hasAnimation: false,
  },
  warning: {
    status: 'warning',
    label: '有警告',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    hasAnimation: false,
  },
};

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface ExecutionStateMachine {
  status: ExecutionStatus;
  previousStatus?: ExecutionStatus;
  currentStep?: string;
  stepIndex?: number;
  totalSteps: number;
  lastUpdateTime: number;
}

export const EXECUTION_STATUS_CONFIG: Record<
  ExecutionStatus,
  { label: string; color: string; bgColor: string }
> = {
  idle: {
    label: '未开始',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
  },
  running: {
    label: '运行中',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  paused: {
    label: '已暂停',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  completed: {
    label: '已完成',
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  failed: {
    label: '失败',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
};
