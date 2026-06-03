import { describe, it, expect } from 'vitest';
import { WorkflowExecutor, createDefaultExecutors, type NodeExecutor } from './workflow-executor';
import type { Graph, GraphNode, GraphEdge } from '@/types';

const createMockNode = (id: string, type: string = 'default'): GraphNode => ({
  id,
  data: { type },
});

const createMockEdge = (source: string, target: string): GraphEdge => ({
  getSourceCellId: () => source,
  getTargetCellId: () => target,
});

const createMockGraph = (nodes: GraphNode[], edges: GraphEdge[]): Graph => ({
  getNodes: () => nodes,
  getEdges: () => edges,
});

describe('WorkflowExecutor', () => {
  describe('basic execution', () => {
    it('should execute a simple workflow successfully', async () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('task1'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [createMockEdge('start', 'task1'), createMockEdge('task1', 'end')];
      const graph = createMockGraph(nodes, edges);

      const executors = createDefaultExecutors();
      const executor = new WorkflowExecutor(graph, executors);

      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(result.workflowState.status).toBe('completed');
      expect(result.workflowState.progress).toBe(100);
    });

    it('should handle empty workflow', async () => {
      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      const graph = createMockGraph(nodes, edges);

      const executors = createDefaultExecutors();
      const executor = new WorkflowExecutor(graph, executors);

      const result = await executor.execute();

      expect(result.success).toBe(false);
      expect(result.workflowState.status).toBe('failed');
    });
  });

  describe('retry mechanism', () => {
    it('should retry failed nodes', async () => {
      let attemptCount = 0;
      const nodes = [createMockNode('task1')];
      const edges: GraphEdge[] = [];
      const graph = createMockGraph(nodes, edges);

      const failingExecutor: NodeExecutor = {
        execute: async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary failure');
          }
          return { success: true };
        },
      };

      const executor = new WorkflowExecutor(graph, { default: failingExecutor }, { maxRetries: 3 });

      const result = await executor.execute();

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should fail after max retries exceeded', async () => {
      const nodes = [createMockNode('task1')];
      const edges: GraphEdge[] = [];
      const graph = createMockGraph(nodes, edges);

      const alwaysFailingExecutor: NodeExecutor = {
        execute: async () => {
          throw new Error('Always fails');
        },
      };

      const executor = new WorkflowExecutor(
        graph,
        { default: alwaysFailingExecutor },
        { maxRetries: 2 }
      );

      const result = await executor.execute();

      expect(result.success).toBe(false);
      expect(result.workflowState.status).toBe('failed');
    });

    it('should respect canRetry function', async () => {
      const nodes = [createMockNode('task1')];
      const edges: GraphEdge[] = [];
      const graph = createMockGraph(nodes, edges);

      const noRetryExecutor: NodeExecutor = {
        execute: async () => {
          throw new Error('Non-retryable error');
        },
        canRetry: () => false,
      };

      const executor = new WorkflowExecutor(graph, { default: noRetryExecutor }, { maxRetries: 3 });

      const result = await executor.execute();

      expect(result.success).toBe(false);
      const nodeState = executor.getNodeState('task1');
      expect(nodeState?.retryCount).toBe(0);
    });
  });

  describe('abort functionality', () => {
    it('should abort execution via abort signal', async () => {
      const abortController = new AbortController();
      const nodes = [createMockNode('task1')];
      const edges: GraphEdge[] = [];
      const graph = createMockGraph(nodes, edges);

      const abortableExecutor: NodeExecutor = {
        execute: async () => {
          while (!abortController.signal.aborted) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          throw new Error('Execution aborted');
        },
      };

      const executor = new WorkflowExecutor(
        graph,
        { default: abortableExecutor },
        { abortSignal: abortController.signal }
      );

      setTimeout(() => {
        abortController.abort();
      }, 100);

      const result = await executor.execute();

      expect(result.success).toBe(false);
      expect(result.workflowState.status).toBe('failed');
    });
  });

  describe('execution context', () => {
    it('should pass data between nodes', async () => {
      const nodes = [
        createMockNode('start', 'INPUT'),
        createMockNode('processor'),
        createMockNode('end', 'OUTPUT'),
      ];
      const edges = [createMockEdge('start', 'processor'), createMockEdge('processor', 'end')];
      const graph = createMockGraph(nodes, edges);

      const processors: Record<string, NodeExecutor> = {
        ...createDefaultExecutors(),
        processor: {
          execute: async (_node, context) => {
            const input = context.getInput('start');
            return { processed: true, input };
          },
        },
      };

      const executor = new WorkflowExecutor(graph, processors);
      const result = await executor.execute();

      expect(result.success).toBe(true);
      const endState = executor.getNodeState('end');
      expect(endState?.output).toBeDefined();
    });
  });

  describe('logging', () => {
    it('should log execution events', async () => {
      const nodes = [createMockNode('task1')];
      const edges: GraphEdge[] = [];
      const graph = createMockGraph(nodes, edges);

      const executors = createDefaultExecutors();
      const executor = new WorkflowExecutor(graph, executors);

      await executor.execute();

      const logs = executor.getWorkflowState().logs;
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.message.includes('Starting'))).toBe(true);
      expect(logs.some((log) => log.message.includes('completed'))).toBe(true);
    });
  });
});
