import type { Graph, GraphNode } from '@/types';
import type { ExecutionState, WorkflowState, ExecutionLog } from '@/types/workflow';
import { getExecutionOrder } from '@/utils/topology-sort';

export interface ExecutorOptions {
  maxRetries?: number;
  retryDelay?: number;
  abortSignal?: AbortSignal;
}

export interface NodeExecutor<T = unknown> {
  execute(node: GraphNode, context: ExecutionContext): Promise<T>;
  canRetry?(error: unknown): boolean;
}

export interface ExecutionContext {
  workflowState: WorkflowState;
  nodeStates: Record<string, ExecutionState>;
  getInput(nodeId: string): unknown;
  setOutput(nodeId: string, output: unknown): void;
}

export interface ExecutionResult {
  success: boolean;
  workflowState: WorkflowState;
  error?: string;
}

export class WorkflowExecutor {
  private graph: Graph;
  private nodeExecutors: Record<string, NodeExecutor>;
  private options: ExecutorOptions;
  private workflowState: WorkflowState;
  private nodeStates: Record<string, ExecutionState>;
  private outputs: Record<string, unknown> = {};
  private abortController?: AbortController;
  private isPaused = false;
  private pauseResolve?: () => void;

  constructor(
    graph: Graph,
    nodeExecutors: Record<string, NodeExecutor>,
    options: ExecutorOptions = {}
  ) {
    this.graph = graph;
    this.nodeExecutors = nodeExecutors;
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      ...options,
    };
    this.workflowState = this.createInitialWorkflowState();
    this.nodeStates = this.createInitialNodeStates();
  }

  private createInitialWorkflowState(): WorkflowState {
    return {
      isRunning: false,
      executionStates: {},
      workflowId: `workflow-${Date.now()}`,
      logs: [],
      status: 'idle',
      progress: 0,
    };
  }

  private createInitialNodeStates(): Record<string, ExecutionState> {
    const states: Record<string, ExecutionState> = {};
    const nodes = this.graph.getNodes();

    nodes.forEach((node: GraphNode) => {
      states[node.id] = {
        nodeId: node.id,
        status: 'pending',
        retryCount: 0,
        maxRetries: this.options.maxRetries || 3,
        logs: [],
      };
    });

    return states;
  }

  private addLog(level: ExecutionLog['level'], message: string, data?: unknown): void {
    this.workflowState.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data,
    });
  }

  private updateNodeState(nodeId: string, updates: Partial<ExecutionState>): void {
    this.nodeStates[nodeId] = { ...this.nodeStates[nodeId], ...updates };
    this.workflowState.executionStates[nodeId] = this.nodeStates[nodeId];
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      this.abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Delay aborted'));
      });
    });
  }

  private async executeNodeWithRetry(node: GraphNode): Promise<{
    success: boolean;
    error?: unknown;
  }> {
    const nodeState = this.nodeStates[node.id];
    const executor = this.nodeExecutors[node.data?.type || 'default'];

    if (!executor) {
      const error = new Error(`No executor found for node type: ${node.data?.type}`);
      this.updateNodeState(node.id, {
        status: 'error',
        error: error.message,
        endTime: Date.now(),
      });
      this.addLog('error', `Node ${node.id} failed: No executor found`, { nodeId: node.id });
      return { success: false, error };
    }

    const context: ExecutionContext = {
      workflowState: this.workflowState,
      nodeStates: this.nodeStates,
      getInput: (inputNodeId) => this.outputs[inputNodeId],
      setOutput: (outputNodeId, output) => {
        this.outputs[outputNodeId] = output;
      },
    };

    for (let attempt = 0; attempt <= nodeState.maxRetries; attempt++) {
      if (this.abortController && this.abortController.signal.aborted) {
        this.updateNodeState(node.id, {
          status: 'error',
          error: 'Execution aborted',
          endTime: Date.now(),
        });
        return { success: false, error: new Error('Execution aborted') };
      }

      try {
        this.updateNodeState(node.id, {
          status: 'running',
          startTime: Date.now(),
          retryCount: attempt,
        });

        const nodeLog: ExecutionLog = {
          timestamp: Date.now(),
          level: 'info',
          message: `Executing (attempt ${attempt + 1})`,
        };
        this.nodeStates[node.id].logs.push(nodeLog);

        this.addLog('info', `Executing node ${node.id} (attempt ${attempt + 1})`, {
          nodeId: node.id,
        });

        const result = await executor.execute(node, context);

        this.outputs[node.id] = result;

        const completeLog: ExecutionLog = {
          timestamp: Date.now(),
          level: 'info',
          message: 'Completed successfully',
        };
        this.nodeStates[node.id].logs.push(completeLog);

        this.updateNodeState(node.id, {
          status: 'completed',
          endTime: Date.now(),
          output: result,
        });
        this.addLog('info', `Node ${node.id} completed successfully`, {
          nodeId: node.id,
          output: result,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message === 'Delay aborted') {
          this.updateNodeState(node.id, {
            status: 'error',
            error: 'Execution aborted',
            endTime: Date.now(),
          });
          return { success: false, error: new Error('Execution aborted') };
        }

        const canRetry = executor.canRetry ? executor.canRetry(error) : true;

        if (attempt >= nodeState.maxRetries || !canRetry) {
          this.updateNodeState(node.id, {
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
            endTime: Date.now(),
          });
          this.addLog('error', `Node ${node.id} failed after ${attempt + 1} attempts`, {
            nodeId: node.id,
            error: error instanceof Error ? error.message : String(error),
          });
          return { success: false, error };
        }

        this.updateNodeState(node.id, {
          retryCount: attempt,
        });
        this.addLog('warn', `Node ${node.id} failed, retrying (attempt ${attempt + 1})`, {
          nodeId: node.id,
          error: error instanceof Error ? error.message : String(error),
        });

        await this.delay(this.options.retryDelay! * Math.pow(2, attempt));
      }
    }

    return { success: false, error: new Error('Max retries exceeded') };
  }

  private updateProgress(): void {
    const total = Object.keys(this.nodeStates).length;
    const completed = Object.values(this.nodeStates).filter((s) => s.status === 'completed').length;
    this.workflowState.progress = total > 0 ? (completed / total) * 100 : 0;
  }

  public async execute(): Promise<ExecutionResult> {
    if (this.options.abortSignal) {
      const externalController = new AbortController();
      this.options.abortSignal.addEventListener('abort', () => {
        externalController.abort();
      });
      this.abortController = externalController;
    } else {
      this.abortController = new AbortController();
    }

    this.workflowState = {
      ...this.createInitialWorkflowState(),
      isRunning: true,
      status: 'running',
      startTime: Date.now(),
    };
    this.nodeStates = this.createInitialNodeStates();
    this.outputs = {};

    this.addLog('info', 'Starting workflow execution');

    const executionOrder = getExecutionOrder(this.graph);

    if (executionOrder.length === 0) {
      const error = new Error('Invalid workflow: contains cycles or empty');
      this.workflowState.status = 'failed';
      this.workflowState.error = error.message;
      this.workflowState.isRunning = false;
      this.workflowState.endTime = Date.now();
      this.addLog('error', 'Workflow execution failed', { error: error.message });
      return { success: false, error: error.message, workflowState: this.workflowState };
    }

    for (const nodeId of executionOrder) {
      const node = this.graph.getNodes().find((n: GraphNode) => n.id === nodeId);
      if (!node) continue;

      await this.waitIfPaused();

      if (this.abortController.signal.aborted) {
        this.workflowState.status = 'failed';
        this.workflowState.error = 'Execution aborted';
        this.workflowState.isRunning = false;
        this.workflowState.endTime = Date.now();
        return { success: false, error: 'Execution aborted', workflowState: this.workflowState };
      }

      this.workflowState.currentNodeId = nodeId;

      const result = await this.executeNodeWithRetry(node);

      if (!result.success) {
        this.workflowState.status = 'failed';
        this.workflowState.error =
          result.error instanceof Error ? result.error.message : String(result.error);
        this.workflowState.isRunning = false;
        this.workflowState.endTime = Date.now();
        this.addLog('error', 'Workflow execution failed', { error: this.workflowState.error });
        return {
          success: false,
          error: this.workflowState.error,
          workflowState: this.workflowState,
        };
      }

      this.updateProgress();
    }

    this.workflowState.status = 'completed';
    this.workflowState.isRunning = false;
    this.workflowState.currentNodeId = undefined;
    this.workflowState.endTime = Date.now();
    this.workflowState.progress = 100;
    this.addLog('info', 'Workflow execution completed successfully');

    return { success: true, workflowState: this.workflowState };
  }

  public abort(): void {
    this.abortController?.abort();
    this.resume();
    this.addLog('warn', 'Workflow execution aborted');
  }

  public pause(): void {
    this.isPaused = true;
    this.workflowState.status = 'paused';
    this.workflowState.isRunning = false;
    this.addLog('info', 'Workflow execution paused');
  }

  public resume(): void {
    this.isPaused = false;
    this.workflowState.status = 'running';
    this.workflowState.isRunning = true;
    this.pauseResolve?.();
    this.pauseResolve = undefined;
    this.addLog('info', 'Workflow execution resumed');
  }

  private async waitIfPaused(): Promise<void> {
    if (this.isPaused) {
      await new Promise((resolve) => {
        this.pauseResolve = resolve as () => void;
      });
    }
  }

  public getWorkflowState(): WorkflowState {
    return this.workflowState;
  }

  public getNodeState(nodeId: string): ExecutionState | undefined {
    return this.nodeStates[nodeId];
  }
}

export function createDefaultExecutors(): Record<string, NodeExecutor> {
  return {
    default: {
      execute: async (node) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { nodeId: node.id, result: 'success' };
      },
      canRetry: () => {
        return true;
      },
    },
    INPUT: {
      execute: async (node) => {
        return { nodeId: node.id, type: 'INPUT', data: node.data?.properties || {} };
      },
    },
    OUTPUT: {
      execute: async (node, context) => {
        const input = context.getInput(node.id);
        return { nodeId: node.id, type: 'OUTPUT', data: input };
      },
    },
  };
}
